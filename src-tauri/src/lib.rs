mod monitor;
mod monitor_gpu;

use monitor::SystemMonitor;
use monitor_gpu::GpuMonitor;

use crate::{monitor::SystemMetrics, monitor_gpu::UnifiedGpuInfo};

#[tauri::command]
async fn monitor_gpu() -> Result<Vec<UnifiedGpuInfo>, String> {
    tokio::time::sleep(std::time::Duration::from_millis(200)).await;
    let monitor = GpuMonitor::get_unique_physical_gpus().await;
    Ok(monitor)
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
        .invoke_handler(tauri::generate_handler![monitor_gpu, monitor_sys])
        .setup(|_app| Ok(()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
