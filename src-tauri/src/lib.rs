use std::{fs, io::Read, path::PathBuf, process::Command};

use flate2::read::DeflateDecoder;
use serde::Serialize;
use tauri::{image::Image, menu::{AboutMetadata, CheckMenuItem, Menu, MenuItem, PredefinedMenuItem, Submenu}, Emitter};

const APP_ICON: Image<'static> = tauri::include_image!("./icons/icon.png");
const APP_MENU_TITLE: &str = "Here to Slay: DUNGEONS Mapper";
const APP_ABOUT_TITLE: &str = "About HtSD:Mapper";
const APP_ABOUT_COMMENTS: &str = "A dungeon layout mapper for Here to Slay: DUNGEONS. Build boards, import custom tile sets, and export clean printable layouts.";
const APP_ABOUT_COPYRIGHT: &str = "Copyright © 2026 Rod Clemen";

#[derive(Serialize)]
struct DirEntryInfo {
    name: String,
    path: String,
    is_dir: bool,
}

fn normalized_path(path: String) -> PathBuf {
    PathBuf::from(path)
}

#[tauri::command]
fn inflate_raw_deflate(bytes: Vec<u8>) -> Result<Vec<u8>, String> {
    let mut decoder = DeflateDecoder::new(bytes.as_slice());
    let mut out = Vec::new();
    decoder
        .read_to_end(&mut out)
        .map_err(|error| format!("Could not inflate zip entry: {error}"))?;
    Ok(out)
}

#[tauri::command]
fn save_blob_to_downloads(filename: String, bytes: Vec<u8>) -> Result<String, String> {
    let safe_filename = filename
        .chars()
        .map(|ch| match ch {
            '/' | '\\' | ':' => '_',
            _ => ch,
        })
        .collect::<String>()
        .trim()
        .to_string();
    let safe_filename = if safe_filename.is_empty() {
        "download.bin".to_string()
    } else {
        safe_filename
    };
    let home = std::env::var_os("HOME").ok_or("Could not locate the home directory.")?;
    let mut path = PathBuf::from(home);
    path.push("Downloads");
    path.push(safe_filename);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| format!("Could not create download directory: {error}"))?;
    }
    fs::write(&path, bytes).map_err(|error| format!("Could not save file: {error}"))?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
fn save_blob_to_path(path: String, bytes: Vec<u8>) -> Result<String, String> {
    let path = normalized_path(path);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| format!("Could not create output directory: {error}"))?;
    }
    fs::write(&path, bytes).map_err(|error| format!("Could not save file: {error}"))?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
fn path_exists(path: String) -> Result<bool, String> {
    Ok(normalized_path(path).exists())
}

#[tauri::command]
fn ensure_dir(path: String) -> Result<String, String> {
    let path = normalized_path(path);
    fs::create_dir_all(&path).map_err(|error| format!("Could not create directory: {error}"))?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
fn remove_path(path: String) -> Result<(), String> {
    let path = normalized_path(path);
    if !path.exists() {
        return Ok(());
    }
    let metadata = fs::metadata(&path).map_err(|error| format!("Could not read file metadata: {error}"))?;
    if metadata.is_dir() {
        fs::remove_dir_all(&path).map_err(|error| format!("Could not remove directory: {error}"))?;
    } else {
        fs::remove_file(&path).map_err(|error| format!("Could not remove file: {error}"))?;
    }
    Ok(())
}

#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    fs::read_to_string(normalized_path(path)).map_err(|error| format!("Could not read file: {error}"))
}

#[tauri::command]
fn write_text_file(path: String, text: String) -> Result<String, String> {
    let path = normalized_path(path);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| format!("Could not create output directory: {error}"))?;
    }
    fs::write(&path, text).map_err(|error| format!("Could not write file: {error}"))?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
fn read_file_bytes(path: String) -> Result<Vec<u8>, String> {
    fs::read(normalized_path(path)).map_err(|error| format!("Could not read file: {error}"))
}

#[tauri::command]
fn list_dir_entries(path: String) -> Result<Vec<DirEntryInfo>, String> {
    let path = normalized_path(path);
    if !path.exists() {
        return Ok(Vec::new());
    }
    let mut entries = Vec::new();
    for entry in fs::read_dir(&path).map_err(|error| format!("Could not read directory: {error}"))? {
        let entry = entry.map_err(|error| format!("Could not read directory entry: {error}"))?;
        let file_type = entry.file_type().map_err(|error| format!("Could not inspect directory entry: {error}"))?;
        let name = entry.file_name().to_string_lossy().to_string();
        entries.push(DirEntryInfo {
            name,
            path: entry.path().to_string_lossy().to_string(),
            is_dir: file_type.is_dir(),
        });
    }
    entries.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(entries)
}

fn open_external_url_impl(url: &str) -> Result<(), String> {
    let trimmed = url.trim();
    if trimmed.is_empty() {
        return Err("Could not open an empty URL.".to_string());
    }
    #[cfg(target_os = "macos")]
    {
        let status = Command::new("/usr/bin/open")
            .arg(trimmed)
            .status()
            .map_err(|error| format!("Could not open URL: {error}"))?;
        if !status.success() {
            return Err(format!("Could not open URL: /usr/bin/open exited with {status}"));
        }
    }
    #[cfg(target_os = "linux")]
    {
        let status = Command::new("/usr/bin/xdg-open")
            .arg(trimmed)
            .status()
            .map_err(|error| format!("Could not open URL: {error}"))?;
        if !status.success() {
            return Err(format!("Could not open URL: /usr/bin/xdg-open exited with {status}"));
        }
    }
    #[cfg(target_os = "windows")]
    {
        let status = Command::new("cmd")
            .args(["/C", "start", "", trimmed])
            .status()
            .map_err(|error| format!("Could not open URL: {error}"))?;
        if !status.success() {
            return Err(format!("Could not open URL: cmd /C start exited with {status}"));
        }
    }
    Ok(())
}

#[tauri::command]
fn open_external_url(url: String) -> Result<(), String> {
    open_external_url_impl(&url)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .enable_macos_default_menu(false)
        .on_menu_event(|app, event| {
            let action = match event.id().as_ref() {
                "menu_import_tile_set" => Some("import-custom-tileset"),
                "menu_open_guide" => Some("open-guide"),
                "menu_open_donate" => Some("open-donate"),
                "menu_send_feedback" => {
                    let _ = open_external_url_impl("mailto:info@trailhunger.dk?subject=Here%20to%20Slay%20DUNGEONS%20Mapper");
                    None
                }
                "menu_export_all_custom_tile_sets" => Some("export-all-custom-tile-sets"),
                "menu_export_pdf" => Some("export-pdf"),
                "menu_toggle_dev_mode" => Some("toggle-dev-mode"),
                _ => None,
            };
            if let Some(action) = action {
                let _ = app.emit("native-menu-action", action);
            }
        })
        .setup(|app| {
            let handle = app.handle();
            let pkg_info = handle.package_info();
            let about_metadata = AboutMetadata {
                name: Some(APP_MENU_TITLE.to_string()),
                version: Some(pkg_info.version.to_string()),
                comments: Some(APP_ABOUT_COMMENTS.to_string()),
                copyright: Some(APP_ABOUT_COPYRIGHT.to_string()),
                authors: Some(vec!["Rod Clemen".to_string()]),
                icon: Some(APP_ICON.clone()),
                ..Default::default()
            };
            let file_menu = Submenu::with_items(
                handle,
                "File",
                true,
                &[
                    &MenuItem::with_id(handle, "menu_import_tile_set", "Import Custom Tile Set", true, None::<&str>)?,
                    &MenuItem::with_id(handle, "menu_export_all_custom_tile_sets", "Export All Custom Tile Sets", true, None::<&str>)?,
                    &MenuItem::with_id(handle, "menu_export_pdf", "Export PDF", true, None::<&str>)?,
                    &PredefinedMenuItem::separator(handle)?,
                    &PredefinedMenuItem::close_window(handle, None)?,
                    #[cfg(not(target_os = "macos"))]
                    &PredefinedMenuItem::quit(handle, None)?,
                ],
            )?;
            let guide_menu = Submenu::with_items(
                handle,
                "Info",
                true,
                &[
                    &MenuItem::with_id(handle, "menu_open_guide", "Guide", true, None::<&str>)?,
                    &MenuItem::with_id(handle, "menu_send_feedback", "Send Feedback", true, None::<&str>)?,
                    &PredefinedMenuItem::separator(handle)?,
                    &CheckMenuItem::with_id(handle, "menu_toggle_dev_mode", "Dev Mode", true, false, None::<&str>)?,
                ],
            )?;

            let menu = Menu::with_items(
                handle,
                &[
                    #[cfg(target_os = "macos")]
                    &Submenu::with_items(
                        handle,
                        APP_MENU_TITLE,
                        true,
                        &[
                            &PredefinedMenuItem::about(handle, Some(APP_ABOUT_TITLE), Some(about_metadata.clone()))?,
                            &PredefinedMenuItem::separator(handle)?,
                            &MenuItem::with_id(handle, "menu_open_donate", "Donate", true, None::<&str>)?,
                            &PredefinedMenuItem::separator(handle)?,
                            &PredefinedMenuItem::quit(handle, Some("Quit"))?,
                        ],
                    )?,
                    #[cfg(not(any(
                        target_os = "linux",
                        target_os = "dragonfly",
                        target_os = "freebsd",
                        target_os = "netbsd",
                        target_os = "openbsd"
                    )))]
                    &file_menu,
                    #[cfg(target_os = "macos")]
                    &Submenu::with_items(
                        handle,
                        "View",
                        true,
                        &[&PredefinedMenuItem::fullscreen(handle, None)?],
                    )?,
                    &guide_menu,
                ],
            )?;
            app.set_menu(menu)?;
            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            inflate_raw_deflate,
            save_blob_to_downloads,
            save_blob_to_path,
            path_exists,
            ensure_dir,
            remove_path,
            read_text_file,
            write_text_file,
            read_file_bytes,
            list_dir_entries,
            open_external_url,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
