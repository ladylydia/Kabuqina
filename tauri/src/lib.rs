//! HermesDesk Tauri shell.
//!
//! Responsibilities:
//!  - Spawn and supervise the embedded Python process (`python_supervisor`)
//!  - Expose a tiny loopback HTTP server for secret handshake +
//!    shell-approval bridge (`bridge`)
//!  - Own the Windows Credential Manager-backed key vault (`secrets`)
//!  - Own the system tray + main window
//!  - Wait for Python's port handshake, then point the WebView at it
//!
//! All business logic lives in Python. This crate is a thin process
//! supervisor + secret/safety boundary.

mod bridge;
mod chat;
mod paths;
mod python_supervisor;
mod secrets;
mod tray;

use std::sync::Arc;
use tauri::{Manager, RunEvent};
use tokio::sync::Mutex;
use url::Url;

pub struct AppState {
    pub supervisor: Arc<Mutex<Option<python_supervisor::Supervisor>>>,
    pub bridge_addr: Arc<Mutex<Option<std::net::SocketAddr>>>,
    /// Cached from `bridge::Bridge` for respawning Python without a second `bridge::spawn`.
    pub bridge_secret_url: Arc<Mutex<Option<String>>>,
    pub bridge_approval_url: Arc<Mutex<Option<String>>>,
    /// Loopback port for Hermes `web_server` (set after Python writes `port.txt`).
    pub hermes_port: Arc<Mutex<Option<u16>>>,
    /// Same value as Python `HERMESDESK_BRIDGE_SECRET` for `X-HermesDesk-Auth`.
    pub desk_auth_token: Arc<Mutex<Option<String>>>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    let supervisor = Arc::new(Mutex::new(None));
    let bridge_addr = Arc::new(Mutex::new(None));

    let state = AppState {
        supervisor: supervisor.clone(),
        bridge_addr: bridge_addr.clone(),
        bridge_secret_url: Arc::new(Mutex::new(None)),
        bridge_approval_url: Arc::new(Mutex::new(None)),
        hermes_port: Arc::new(Mutex::new(None)),
        desk_auth_token: Arc::new(Mutex::new(None)),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.show();
                let _ = w.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_fs::init())
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            secrets::cmd_save_secret,
            secrets::cmd_has_secret,
            secrets::cmd_clear_secret,
            secrets::cmd_validate_endpoint,
            python_supervisor::cmd_python_status,
            paths::cmd_workspace_path,
            paths::cmd_open_workspace,
            paths::cmd_get_power_user,
            cmd_set_power_user,
            paths::cmd_get_show_recipe_market,
            paths::cmd_set_show_recipe_market,
            paths::cmd_set_personality,
            cmd_get_hermes_port,
            cmd_open_hermes_dashboard,
            chat::cmd_chat_send,
            chat::cmd_desk_stop,
            chat::cmd_get_sessions,
            chat::cmd_get_session_messages,
            chat::cmd_delete_session,
        ])
        .setup(|app| {
            tray::install(app)?;
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = bootstrap(handle).await {
                    log::error!("bootstrap failed: {e:#}");
                }
            });
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error building HermesDesk")
        .run(|app, event| {
            if let RunEvent::ExitRequested { .. } = &event {
                let state: tauri::State<AppState> = app.state();
                let lock_result = state.supervisor.try_lock();
                if let Ok(mut sup) = lock_result {
                    if let Some(s) = sup.take() {
                        let _ = s.shutdown();
                    }
                }
            }
        });
}

async fn bootstrap(app: tauri::AppHandle) -> anyhow::Result<()> {
    // 1. Make sure the workspace folder exists.
    let workspace = paths::ensure_workspace(&app)?;
    let bundle_dir = paths::resolve_runtime_dir(&app)?;
    let data_dir = paths::ensure_data_dir(&app)?;
    paths::sync_show_recipe_market_flag(&app)?;

    // 2. Stand up the loopback bridge (secret handshake + shell approval).
    let bridge = bridge::spawn(app.clone()).await?;
    {
        let state: tauri::State<AppState> = app.state();
        *state.bridge_addr.lock().await = Some(bridge.addr);
        *state.desk_auth_token.lock().await = Some(bridge.desk_auth_token.clone());
        *state.bridge_secret_url.lock().await = Some(bridge.secret_url.clone());
        *state.bridge_approval_url.lock().await = Some(bridge.approval_url.clone());
    }

    // 3. Spawn the Python child.
    let llm = secrets::resolve_llm_spawn_params(&app);
    let shell_chat_back_url = format!(
        "http://127.0.0.1:{}/shell-chat/{}",
        bridge.addr.port(),
        bridge.desk_auth_token
    );
    let supervisor = python_supervisor::Supervisor::spawn(
        python_supervisor::SpawnConfig {
            bundle_dir,
            data_dir,
            workspace,
            secret_url: bridge.secret_url.clone(),
            approval_url: bridge.approval_url.clone(),
            desk_auth_token: bridge.desk_auth_token.clone(),
            shell_chat_back_url,
            provider: llm.provider,
            llm_host: llm.llm_host,
            api_base_url: llm.api_base_url,
            hermes_model: llm.hermes_model,
            inference_provider: llm.inference_provider,
            power_user: paths::is_power_user(&app),
        },
    )
    .await?;

    let port = supervisor.wait_for_port().await?;
    log::info!("python ready on port {port}");

    {
        let state: tauri::State<AppState> = app.state();
        *state.supervisor.lock().await = Some(supervisor);
        *state.hermes_port.lock().await = Some(port);
    }

    // 4. Reveal the window. Keep the webview on the Tauri shell until the user
    //    opens Hermes (Splash "Open dashboard" or onboarding "Start chatting")
    //    so startup never auto-jumps to the Python dashboard.
    log::info!("python ready on port {port} — waiting for user to open Hermes from shell");
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.set_focus();
    }
    Ok(())
}

/// Re-spawn the Hermes child so `HERMESDESK_POWER_USER` and
/// `default_toolset.install()` take effect. Tooling is re-seeded on every
/// Python start; a simple settings write does not update the child.
async fn respawn_embedded_hermes_python(app: tauri::AppHandle) -> Result<u16, String> {
    let state: tauri::State<'_, AppState> = app.state();
    let secret_url = state
        .bridge_secret_url
        .lock()
        .await
        .clone()
        .ok_or_else(|| "bridge not initialised (secret URL)".to_string())?;
    let approval_url = state
        .bridge_approval_url
        .lock()
        .await
        .clone()
        .ok_or_else(|| "bridge not initialised (approval URL)".to_string())?;
    let desk_token = state
        .desk_auth_token
        .lock()
        .await
        .clone()
        .ok_or_else(|| "bridge not initialised (token)".to_string())?;
    let baddr = *state
        .bridge_addr
        .lock()
        .await
        .as_ref()
        .ok_or_else(|| "bridge not initialised (addr)".to_string())?;

    {
        let mut s = state.supervisor.lock().await;
        if let Some(sup) = s.take() {
            let _ = sup.shutdown();
        }
    }
    *state.hermes_port.lock().await = None;

    let workspace = paths::ensure_workspace(&app).map_err(|e| e.to_string())?;
    let bundle_dir = paths::resolve_runtime_dir(&app).map_err(|e| e.to_string())?;
    let data_dir = paths::ensure_data_dir(&app).map_err(|e| e.to_string())?;
    let llm = secrets::resolve_llm_spawn_params(&app);
    let power_user = paths::is_power_user(&app);
    let shell_chat_back_url = format!(
        "http://127.0.0.1:{}/shell-chat/{}",
        baddr.port(),
        desk_token
    );
    let supervisor = python_supervisor::Supervisor::spawn(python_supervisor::SpawnConfig {
        bundle_dir,
        data_dir,
        workspace,
        secret_url: secret_url.clone(),
        approval_url: approval_url.clone(),
        desk_auth_token: desk_token,
        shell_chat_back_url,
        provider: llm.provider,
        llm_host: llm.llm_host,
        api_base_url: llm.api_base_url,
        hermes_model: llm.hermes_model,
        inference_provider: llm.inference_provider,
        power_user,
    })
    .await
    .map_err(|e| e.to_string())?;
    let port = supervisor
        .wait_for_port()
        .await
        .map_err(|e| e.to_string())?;
    *state.supervisor.lock().await = Some(supervisor);
    *state.hermes_port.lock().await = Some(port);
    log::info!("embedded Python respawned: port {port} power_user={power_user}");
    Ok(port)
}

/// Save the power-user flag and restart embedded Python so
/// `platform_toolsets[cli]` matches the toggle (terminal, browser, …).
#[tauri::command]
async fn cmd_set_power_user(app: tauri::AppHandle, enabled: bool) -> Result<(), String> {
    paths::set_power_user_enabled(&app, enabled)?;
    respawn_embedded_hermes_python(app).await.map(|_| ())
}

/// Load the Hermes Python web UI in the main webview (same as post-onboarding jump).
/// `shell_locale` is `Some("zh")` / `Some("en")` from the Tauri shell so Hermes can read `hermesdesk_lang` (see `hermes/web` i18n).
fn open_hermes_dashboard_in_webview(
    app: &tauri::AppHandle,
    port: u16,
    shell_locale: Option<String>,
) -> Result<(), String> {
    let mut u: Url = format!("http://127.0.0.1:{port}/")
        .parse()
        .map_err(|e: url::ParseError| e.to_string())?;
    if let Some(loc) = shell_locale
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
    {
        if loc == "zh" || loc == "en" {
            u.query_pairs_mut()
                .append_pair("hermesdesk_lang", loc);
        }
    }
    let w = app
        .get_webview_window("main")
        .ok_or_else(|| "main webview missing".to_string())?;
    w.navigate(u).map_err(|e| e.to_string())
}

/// Get the Hermes Python backend port (for diagnostics and fallbacks).
#[tauri::command]
async fn cmd_get_hermes_port(app: tauri::AppHandle) -> Result<Option<u16>, String> {
    let state: tauri::State<AppState> = app.state();
    let port = *state.hermes_port.lock().await;
    Ok(port)
}

/// Open the Hermes dashboard in the main webview (e.g. after onboarding "Start chatting").
/// Optional `shell_locale` (`"zh"` | `"en"`) matches the shell i18n so the embedded web UI can align language on first paint.
#[tauri::command]
async fn cmd_open_hermes_dashboard(
    app: tauri::AppHandle,
    shell_locale: Option<String>,
) -> Result<(), String> {
    let state: tauri::State<AppState> = app.state();
    let port = state
        .hermes_port
        .lock()
        .await
        .ok_or_else(|| "Hermes is not ready yet. Wait a few seconds and try again.".to_string())?;
    open_hermes_dashboard_in_webview(&app, port, shell_locale)
}
