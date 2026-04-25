//! Shell → Hermes HTTP proxy (Tauri `invoke` → reqwest to 127.0.0.1).
//!
//! The webview cannot `fetch` Hermes directly (origin + session token). We use
//! `X-HermesDesk-Auth` (shared with `HERMESDESK_BRIDGE_SECRET`) and the same
//! `Authorization: Bearer` as the dashboard: loaded from
//! `hermes_web_session_token.txt` if present, else parsed from
//! `GET /` (``__HERMES_SESSION_TOKEN__`` in ``index.html``) — no bundle step
//! required for the token to exist.

use crate::paths;
use crate::AppState;
use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::time::Duration;
use tauri::AppHandle;
use tauri::Manager;
use tokio::sync::Mutex as AsyncMutex;

const HERMES_HTTP_TIMEOUT: Duration = Duration::from_secs(600);
/// Cached ``(port, bearer)`` for the in-process Hermes process.
type BearerEntry = (u16, String);
static HERMES_BEARER_CACHE: OnceCell<AsyncMutex<Option<BearerEntry>>> = OnceCell::new();

fn bearer_cache() -> &'static AsyncMutex<Option<BearerEntry>> {
    HERMES_BEARER_CACHE.get_or_init(|| AsyncMutex::new(None))
}

fn http_client() -> reqwest::Client {
    // Loopback + system HTTP proxy (e.g. Clash) is a common source of 401 / wrong
    // responses; never proxy requests to 127.0.0.1.
    reqwest::Client::builder()
        .no_proxy()
        .timeout(HERMES_HTTP_TIMEOUT)
        .build()
        .expect("reqwest client")
}

/// Same bearer string the embedded Hermes web UI uses (`web_server._SESSION_TOKEN`).
async fn hermes_bearer_from_data_dir(app: &AppHandle) -> Option<String> {
    let dir = paths::ensure_data_dir(app).ok()?;
    let path = dir.join("hermes_web_session_token.txt");
    for _ in 0u32..20 {
        if let Ok(s) = tokio::fs::read_to_string(&path).await {
            let t = s.trim();
            if !t.is_empty() {
                return Some(t.to_string());
            }
        }
        tokio::time::sleep(Duration::from_millis(50)).await;
    }
    None
}

/// ``Authorization: Bearer`` — same as the open dashboard (must match
/// `web_server._SESSION_TOKEN` for the running process).
async fn hermes_bearer_resolved(app: &AppHandle) -> Option<String> {
    let state: tauri::State<'_, AppState> = app.state();
    let port = *state.hermes_port.lock().await.as_ref()?;
    {
        let c = bearer_cache().lock().await;
        if let Some((p, t)) = c.as_ref() {
            if *p == port {
                return Some(t.clone());
            }
        }
    }
    if let Some(t) = hermes_bearer_from_data_dir(app).await {
        *bearer_cache().lock().await = Some((port, t.clone()));
        return Some(t);
    }
    let base = format!("http://127.0.0.1:{port}");
    let text = match http_client().get(&base).send().await {
        Ok(r) => r.text().await,
        Err(e) => {
            log::warn!("hermes: GET {base} failed: {e}");
            return None;
        }
    };
    let text = match text {
        Ok(t) => t,
        Err(e) => {
            log::warn!("hermes: read index body: {e}");
            return None;
        }
    };
    const NEEDLE: &str = "__HERMES_SESSION_TOKEN__=\"";
    let rest = match text.split_once(NEEDLE) {
        Some((_, r)) => r,
        None => {
            log::warn!(
                "hermes: no session token in index.html (is dashboard built? len={})",
                text.len()
            );
            return None;
        }
    };
    let end = rest.find('"')?;
    let token = rest[..end].to_string();
    if token.is_empty() {
        return None;
    }
    log::info!("hermes: using bearer from index.html (port {port})");
    *bearer_cache().lock().await = Some((port, token.clone()));
    Some(token)
}

async fn hermes_base(app: &AppHandle) -> Result<String, String> {
    let state: tauri::State<'_, AppState> = app.state();
    let port = *state
        .hermes_port
        .lock()
        .await
        .as_ref()
        .ok_or_else(|| "Hermes is not ready yet. Wait a few seconds and try again.".to_string())?;
    Ok(format!("http://127.0.0.1:{port}"))
}

async fn desk_auth_header(app: &AppHandle) -> Result<String, String> {
    let state: tauri::State<'_, AppState> = app.state();
    let token = {
        let g = state.desk_auth_token.lock().await;
        g.clone()
    };
    token.ok_or_else(|| "Shell auth not ready.".to_string())
}

/// One attachment for ``/api/desk/chat-proto`` (base64 payload; matches Hermes `web_server`).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeskChatAttachment {
    pub name: String,
    pub mime: String,
    pub data: String,
}

/// POST /api/desk/chat-proto — full JSON body from Hermes.
#[tauri::command]
pub async fn cmd_chat_send(
    app: AppHandle,
    message: String,
    session_id: Option<String>,
    attachments: Option<Vec<DeskChatAttachment>>,
) -> Result<Value, String> {
    let base = hermes_base(&app).await?;
    let token = desk_auth_header(&app).await?;
    let body = serde_json::json!({
        "message": message,
        "session_id": session_id,
        "attachments": attachments,
    });
    let client = http_client();
    let mut req = client
        .post(format!("{base}/api/desk/chat-proto"))
        .header("X-HermesDesk-Auth", &token)
        .header("Content-Type", "application/json");
    if let Some(b) = hermes_bearer_resolved(&app).await {
        req = req.header("Authorization", format!("Bearer {b}"));
    }
    let res = req.json(&body).send().await.map_err(|e| e.to_string())?;
    let status = res.status();
    let v: Value = res.json().await.map_err(|e| e.to_string())?;
    if !status.is_success() {
        return Err(v.to_string());
    }
    Ok(v)
}

/// POST /api/desk/stop — interrupt in-flight agent for this session.
#[tauri::command]
pub async fn cmd_desk_stop(app: AppHandle, session_id: String) -> Result<Value, String> {
    let base = hermes_base(&app).await?;
    let token = desk_auth_header(&app).await?;
    let body = serde_json::json!({ "session_id": session_id });
    let client = http_client();
    let mut req = client
        .post(format!("{base}/api/desk/stop"))
        .header("X-HermesDesk-Auth", &token)
        .header("Content-Type", "application/json");
    if let Some(b) = hermes_bearer_resolved(&app).await {
        req = req.header("Authorization", format!("Bearer {b}"));
    }
    let res = req.json(&body).send().await.map_err(|e| e.to_string())?;
    let status = res.status();
    let v: Value = res.json().await.map_err(|e| e.to_string())?;
    if !status.is_success() {
        return Err(v.to_string());
    }
    Ok(v)
}

/// GET /api/sessions
#[tauri::command]
pub async fn cmd_get_sessions(
    app: AppHandle,
    limit: Option<u32>,
    offset: Option<u32>,
) -> Result<Value, String> {
    let base = hermes_base(&app).await?;
    let token = desk_auth_header(&app).await?;
    let lim = limit.unwrap_or(50);
    let off = offset.unwrap_or(0);
    let url = format!("{base}/api/sessions?limit={lim}&offset={off}");
    let client = http_client();
    let mut req = client.get(&url).header("X-HermesDesk-Auth", &token);
    if let Some(b) = hermes_bearer_resolved(&app).await {
        req = req.header("Authorization", format!("Bearer {b}"));
    }
    let res = req.send().await.map_err(|e| e.to_string())?;
    let status = res.status();
    let v: Value = res.json().await.map_err(|e| e.to_string())?;
    if !status.is_success() {
        return Err(v.to_string());
    }
    Ok(v)
}

/// GET /api/sessions/{id}/messages
#[tauri::command]
pub async fn cmd_get_session_messages(app: AppHandle, id: String) -> Result<Value, String> {
    let base = hermes_base(&app).await?;
    let token = desk_auth_header(&app).await?;
    let url = format!("{base}/api/sessions/{id}/messages");
    let client = http_client();
    let mut req = client.get(&url).header("X-HermesDesk-Auth", &token);
    if let Some(b) = hermes_bearer_resolved(&app).await {
        req = req.header("Authorization", format!("Bearer {b}"));
    }
    let res = req.send().await.map_err(|e| e.to_string())?;
    let status = res.status();
    let v: Value = res.json().await.map_err(|e| e.to_string())?;
    if !status.is_success() {
        return Err(v.to_string());
    }
    Ok(v)
}

/// DELETE /api/sessions/{id}
#[tauri::command]
pub async fn cmd_delete_session(app: AppHandle, id: String) -> Result<Value, String> {
    let base = hermes_base(&app).await?;
    let token = desk_auth_header(&app).await?;
    let url = format!("{base}/api/sessions/{id}");
    let client = http_client();
    let mut req = client
        .delete(&url)
        .header("X-HermesDesk-Auth", &token);
    if let Some(b) = hermes_bearer_resolved(&app).await {
        req = req.header("Authorization", format!("Bearer {b}"));
    }
    let res = req.send().await.map_err(|e| e.to_string())?;
    let status = res.status();
    let v: Value = res.json().await.map_err(|e| e.to_string())?;
    if !status.is_success() {
        return Err(v.to_string());
    }
    Ok(v)
}
