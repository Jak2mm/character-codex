// The desktop app (Windows and Mac) is a window around the same index.html the website uses.
// Characters are saved inside the app's own storage on this computer, and, when the player
// chooses a Save location on the Options page, also in a folder of their choice (a NAS,
// Dropbox, OneDrive or iCloud Drive folder). The commands below are the only file access
// the page has: they read and write plain files inside that one folder.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::io::ErrorKind;
use std::path::{Component, Path, PathBuf};
use tauri_plugin_dialog::DialogExt;

// Join a path inside the chosen folder, refusing anything that could step outside it.
fn inside(root: &str, rel: &str) -> Result<PathBuf, String> {
    let r = PathBuf::from(root);
    if !r.is_absolute() {
        return Err("The save folder isn't a full path.".into());
    }
    let p = Path::new(rel);
    if rel.is_empty() {
        return Ok(r);
    }
    if !p.components().all(|c| matches!(c, Component::Normal(_))) {
        return Err("That file name isn't allowed.".into());
    }
    Ok(r.join(p))
}

// Show the system folder picker. Returns the folder chosen, or nothing if cancelled.
#[tauri::command]
async fn folder_pick(app: tauri::AppHandle) -> Option<String> {
    app.dialog()
        .file()
        .set_title("Choose where to save your characters")
        .blocking_pick_folder()
        .and_then(|f| f.into_path().ok())
        .map(|p| p.to_string_lossy().into_owned())
}

// Is the folder there? (A NAS or USB drive may be disconnected.)
#[tauri::command]
async fn folder_check(root: String) -> bool {
    Path::new(&root).is_dir()
}

// File names (not folders) in a folder inside the save folder. Missing folder → empty list.
#[tauri::command]
async fn folder_list(root: String, dir: String) -> Result<Vec<String>, String> {
    let p = inside(&root, &dir)?;
    let rd = match fs::read_dir(&p) {
        Ok(rd) => rd,
        Err(e) if e.kind() == ErrorKind::NotFound => return Ok(vec![]),
        Err(e) => return Err(e.to_string()),
    };
    let mut out = vec![];
    for e in rd.flatten() {
        if e.file_type().map(|t| t.is_file()).unwrap_or(false) {
            if let Some(n) = e.file_name().to_str() {
                out.push(n.to_string());
            }
        }
    }
    Ok(out)
}

// Read a text file. Missing file → nothing.
#[tauri::command]
async fn folder_read(root: String, path: String) -> Result<Option<String>, String> {
    match fs::read_to_string(inside(&root, &path)?) {
        Ok(s) => Ok(Some(s)),
        Err(e) if e.kind() == ErrorKind::NotFound => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

// Write a text file: written to a temporary file first, then renamed over the old one,
// so a sync program never picks up a half-written character.
#[tauri::command]
async fn folder_write(root: String, path: String, data: String) -> Result<(), String> {
    let p = inside(&root, &path)?;
    if let Some(parent) = p.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let mut tmp = p.clone().into_os_string();
    tmp.push(".saving");
    let tmp = PathBuf::from(tmp);
    fs::write(&tmp, &data).map_err(|e| e.to_string())?;
    if fs::rename(&tmp, &p).is_err() {
        // some network drives refuse to rename over an existing file; write it directly instead
        let _ = fs::remove_file(&tmp);
        fs::write(&p, &data).map_err(|e| e.to_string())?;
    }
    Ok(())
}

// Delete a file. Already gone → fine.
#[tauri::command]
async fn folder_remove(root: String, path: String) -> Result<(), String> {
    match fs::remove_file(inside(&root, &path)?) {
        Ok(()) => Ok(()),
        Err(e) if e.kind() == ErrorKind::NotFound => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            folder_pick,
            folder_check,
            folder_list,
            folder_read,
            folder_write,
            folder_remove
        ])
        .run(tauri::generate_context!())
        .expect("error while running the Character Codex");
}
