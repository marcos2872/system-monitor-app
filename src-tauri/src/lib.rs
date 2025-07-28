mod monitor;
mod tray;
use crate::monitor::SystemMetrics;
use monitor::SystemMonitor;
use std::sync::{Arc, Mutex};

// Estado global do app
#[derive(Default)]
struct AppState {
    tray_text: Arc<Mutex<String>>,
}

#[tauri::command]
fn update_tray_icon(
    app_handle: tauri::AppHandle,
    icon_data: Vec<u8>,
    width: u32,
    height: u32,
) -> Result<(), String> {
    // Atualizar o ícone do tray com os dados recebidos do frontend
    if let Some(tray) = app_handle.tray_by_id("menu_stats") {
        let icon = tauri::image::Image::new_owned(icon_data, width, height);
        tray.set_icon(Some(icon)).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
fn update_tray_text(state: tauri::State<AppState>, text: String) -> Result<(), String> {
    // Apenas atualizar o estado
    let mut tray_text = state.tray_text.lock().map_err(|e| e.to_string())?;
    *tray_text = text;
    Ok(())
}

#[tauri::command]
fn get_tray_text(state: tauri::State<AppState>) -> Result<String, String> {
    let tray_text = state.tray_text.lock().map_err(|e| e.to_string())?;
    Ok(tray_text.clone())
}

#[tauri::command]
async fn monitor_sys() -> Result<SystemMetrics, String> {
    let mut monitor = SystemMonitor::new();
    monitor.update_metrics().await;
    let t = monitor.get_all_metrics();
    Ok(t)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_positioner::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            update_tray_text,
            update_tray_icon,
            get_tray_text,
            monitor_sys
        ])
        .setup(|app| {
            #[cfg(target_os = "linux")]
            {
                tray::init_menu_stats(app.handle())?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
