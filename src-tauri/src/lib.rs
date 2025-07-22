use std::sync::{Arc, Mutex};
use tauri::{
    menu::{Menu, MenuBuilder, MenuItem},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
    Manager, Runtime,
};

// Estado global do app
#[derive(Default)]
struct AppState {
    tray_text: Arc<Mutex<String>>,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn show_main_window(window: tauri::Window) {
    window.get_webview_window("main").unwrap().show().unwrap();
}

#[tauri::command]
fn hide_main_window(window: tauri::Window) {
    window.get_webview_window("main").unwrap().hide().unwrap();
}



#[tauri::command]
fn update_tray_icon(app_handle: tauri::AppHandle, icon_data: Vec<u8>) -> Result<(), String> {
    // Atualizar o ícone do tray com os dados recebidos do frontend
    if let Some(tray) = app_handle.tray_by_id("main-tray") {
        let icon = tauri::image::Image::new_owned(icon_data, 64, 64);
        tray.set_icon(Some(icon)).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
fn update_tray_text(
    state: tauri::State<AppState>,
    text: String,
) -> Result<(), String> {
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

fn create_tray_menu<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<Menu<R>> {
    let show_item = MenuItem::with_id(app, "show", "Abrir Interface", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Sair", true, None::<&str>)?;
    
    let menu = MenuBuilder::new(app)
        .items(&[&show_item, &quit_item])
        .build()?;
    
    Ok(menu)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            greet,
            show_main_window,
            hide_main_window,
            update_tray_text,
            update_tray_icon,
            get_tray_text
        ])
        .setup(|app| {
            let menu = create_tray_menu(&app.handle())?;

            let _tray = TrayIconBuilder::with_id("main-tray")
                .menu(&menu)
                .on_menu_event(move |app, event| match event.id.as_ref() {
                    "show" => {
                        let window = app.get_webview_window("main").unwrap();
                        window.show().unwrap();
                        window.set_focus().unwrap();
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: tauri::tray::MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(webview_window) = app.get_webview_window("main") {
                            let _ = webview_window.show();
                            let _ = webview_window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
