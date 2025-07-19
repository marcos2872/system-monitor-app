mod monitor;

use monitor::SystemMonitor;

use crate::monitor::SystemMetrics;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
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
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, monitor_sys])
        .setup(|_app| Ok(()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
