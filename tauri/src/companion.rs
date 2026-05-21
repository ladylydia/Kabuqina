//! Compact pill companion window (always-on-top mascot).

use serde::Deserialize;
use tauri::{LogicalSize, Manager, Size, WebviewWindowBuilder};

const COMPANION_LABEL: &str = "companion";
/// Fallback when intrinsic size missing or invalid.
const COMPACT_FALLBACK_WIDTH: f64 = 87.0;
const COMPACT_FALLBACK_HEIGHT: f64 = 76.0;
const COMPACT_MIN_EDGE_LOGICAL: f64 = 48.0;
const COMPACT_MAX_EDGE_LOGICAL: f64 = 512.0;
const WINDOW_MIN_EDGE: f64 = 32.0;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResizeCompanionPayload {
    #[serde(default)]
    pub width: Option<f64>,
    #[serde(default)]
    pub height: Option<f64>,
}

fn clamp_compact_logical_size(width: f64, height: f64) -> (f64, f64) {
    if width <= 0.0 || height <= 0.0 || !width.is_finite() || !height.is_finite() {
        return (COMPACT_FALLBACK_WIDTH, COMPACT_FALLBACK_HEIGHT);
    }

    let mut w = width;
    let mut h = height;

    let max_edge = w.max(h);
    if max_edge > COMPACT_MAX_EDGE_LOGICAL {
        let s = COMPACT_MAX_EDGE_LOGICAL / max_edge;
        w *= s;
        h *= s;
    }

    let min_edge = w.min(h);
    if min_edge < COMPACT_MIN_EDGE_LOGICAL && min_edge > f64::EPSILON {
        let s = COMPACT_MIN_EDGE_LOGICAL / min_edge;
        w *= s;
        h *= s;
        let max_after = w.max(h);
        if max_after > COMPACT_MAX_EDGE_LOGICAL {
            let s2 = COMPACT_MAX_EDGE_LOGICAL / max_after;
            w *= s2;
            h *= s2;
        }
    }

    ((w.round()).max(1.0), (h.round()).max(1.0))
}

fn set_companion_compact_size(
    app: &tauri::AppHandle,
    width: Option<f64>,
    height: Option<f64>,
) -> Result<(), String> {
    let Some(w) = app.get_webview_window(COMPANION_LABEL) else {
        return Ok(());
    };
    let (lw, lh) = match (width, height) {
        (Some(cw), Some(ch)) => clamp_compact_logical_size(cw, ch),
        _ => (COMPACT_FALLBACK_WIDTH, COMPACT_FALLBACK_HEIGHT),
    };
    w.set_size(Size::Logical(LogicalSize {
        width: lw,
        height: lh,
    }))
    .map_err(|e| e.to_string())
}

pub async fn show_companion(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window(COMPANION_LABEL) {
        set_companion_compact_size(&app, None, None)?;
        let _ = w.set_shadow(false);
        let _ = w.show();
        let _ = w.set_focus();
        if let Some(main) = app.get_webview_window("main") {
            let _ = main.hide();
        }
        return Ok(());
    }

    let companion = WebviewWindowBuilder::new(
        &app,
        COMPANION_LABEL,
        tauri::WebviewUrl::App("index.html".into()),
    )
    .title("Kabuqina")
    .decorations(false)
    .always_on_top(true)
    .transparent(true)
    .shadow(false)
    .visible(true)
    .resizable(false)
    .inner_size(COMPACT_FALLBACK_WIDTH, COMPACT_FALLBACK_HEIGHT)
    .min_inner_size(WINDOW_MIN_EDGE, WINDOW_MIN_EDGE)
    .skip_taskbar(true)
    .build()
    .map_err(|e| format!("create companion window: {e}"))?;

    let _ = companion.set_focus();
    if let Some(main) = app.get_webview_window("main") {
        let _ = main.hide();
    }

    Ok(())
}

pub fn focus_main_window(app: &tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.unminimize();
        let _ = w.show();
        let _ = w.set_focus();
    }
    if let Some(w) = app.get_webview_window(COMPANION_LABEL) {
        let _ = w.hide();
    }
}

#[tauri::command]
pub async fn cmd_show_companion(app: tauri::AppHandle) -> Result<(), String> {
    show_companion(app).await
}

#[tauri::command]
pub async fn cmd_hide_companion(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window(COMPANION_LABEL) {
        let _ = w.hide();
    }
    Ok(())
}

#[tauri::command]
pub async fn cmd_resize_companion(
    app: tauri::AppHandle,
    payload: ResizeCompanionPayload,
) -> Result<(), String> {
    set_companion_compact_size(&app, payload.width, payload.height)
}

#[tauri::command]
pub async fn cmd_focus_main_window(app: tauri::AppHandle) -> Result<(), String> {
    focus_main_window(&app);
    Ok(())
}
