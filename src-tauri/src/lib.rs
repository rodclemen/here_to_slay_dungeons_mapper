use std::{fs, io::Read, path::PathBuf};

use flate2::read::DeflateDecoder;
use serde::Serialize;

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
