const DATA_FOLDER_PATH_STORAGE_KEY = "hts_data_folder_path_v1";
const SETTINGS_FILE_NAME = "settings.json";
const CUSTOM_TILE_SETS_DIR = "custom-tilesets";
const CUSTOM_TILE_SET_EDITOR_FILE = "wall_editor.json";

let settingsCache = null;
let settingsCacheFolderPath = null;

export function isTauriRuntime() {
  return typeof globalThis.__TAURI__?.core?.invoke === "function";
}

function invokeTauri(command, args) {
  const tauriInvoke = globalThis.__TAURI__?.core?.invoke;
  if (typeof tauriInvoke !== "function") {
    throw new Error("Tauri is not available.");
  }
  return tauriInvoke(command, args);
}

function normalizeFolderPath(path) {
  return String(path || "").trim().replace(/[\\/]+$/g, "");
}

function joinFolderPath(...parts) {
  return parts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .map((part, index) => (index === 0 ? normalizeFolderPath(part) : part.replace(/^[\\/]+|[\\/]+$/g, "").replace(/\\/g, "/")))
    .join("/");
}

export function getStoredDataFolderPath() {
  try {
    const saved = localStorage.getItem(DATA_FOLDER_PATH_STORAGE_KEY);
    return normalizeFolderPath(saved);
  } catch {
    return "";
  }
}

export function setStoredDataFolderPath(path) {
  const normalized = normalizeFolderPath(path);
  try {
    if (normalized) {
      localStorage.setItem(DATA_FOLDER_PATH_STORAGE_KEY, normalized);
    } else {
      localStorage.removeItem(DATA_FOLDER_PATH_STORAGE_KEY);
    }
  } catch (error) {
    console.warn("Could not save the data folder path.", error);
  }
  settingsCache = null;
  settingsCacheFolderPath = null;
}

export function clearStoredDataFolderPath() {
  setStoredDataFolderPath("");
}

export async function pathExists(path) {
  const normalized = normalizeFolderPath(path);
  if (!normalized || !isTauriRuntime()) return false;
  return Boolean(await invokeTauri("path_exists", { path: normalized }));
}

export async function ensureDir(path) {
  const normalized = normalizeFolderPath(path);
  if (!normalized || !isTauriRuntime()) return "";
  return invokeTauri("ensure_dir", { path: normalized });
}

export async function removePath(path) {
  const normalized = normalizeFolderPath(path);
  if (!normalized || !isTauriRuntime()) return false;
  await invokeTauri("remove_path", { path: normalized });
  return true;
}

export async function readTextFile(path) {
  const normalized = normalizeFolderPath(path);
  if (!normalized || !isTauriRuntime()) return null;
  return invokeTauri("read_text_file", { path: normalized });
}

export async function writeTextFile(path, text) {
  const normalized = normalizeFolderPath(path);
  if (!normalized || !isTauriRuntime()) return "";
  return invokeTauri("write_text_file", { path: normalized, text: String(text ?? "") });
}

export async function readFileBytes(path) {
  const normalized = normalizeFolderPath(path);
  if (!normalized || !isTauriRuntime()) return null;
  const bytes = await invokeTauri("read_file_bytes", { path: normalized });
  return new Uint8Array(bytes);
}

export async function writeFileBytes(path, bytes) {
  const normalized = normalizeFolderPath(path);
  if (!normalized || !isTauriRuntime()) return "";
  const payload = bytes instanceof Uint8Array ? Array.from(bytes) : Array.from(new Uint8Array(bytes));
  return invokeTauri("save_blob_to_path", { path: normalized, bytes: payload });
}

export async function listDirEntries(path) {
  const normalized = normalizeFolderPath(path);
  if (!normalized || !isTauriRuntime()) return [];
  try {
    const entries = await invokeTauri("list_dir_entries", { path: normalized });
    return Array.isArray(entries) ? entries : [];
  } catch {
    return [];
  }
}

export async function chooseDataFolder(defaultPath = "", { persist = true } = {}) {
  const selected = await chooseFolderPath(defaultPath, { title: "Choose Data Folder" });
  if (!selected) return "";
  if (persist) {
    setStoredDataFolderPath(selected);
  }
  return selected;
}

export async function chooseFolderPath(defaultPath = "", { title = "Choose Folder" } = {}) {
  if (!isTauriRuntime()) return "";
  const selected = await invokeTauri("plugin:dialog|open", {
    options: {
      title,
      directory: true,
      multiple: false,
      defaultPath: normalizeFolderPath(defaultPath || getStoredDataFolderPath()),
    },
  });
  if (!selected) return "";
  const normalized = normalizeFolderPath(selected);
  if (!normalized) return "";
  await ensureDir(normalized);
  return normalized;
}

export async function ensureDataFolderPath({ promptIfMissing = false } = {}) {
  if (!isTauriRuntime()) return "";
  const storedPath = getStoredDataFolderPath();
  if (storedPath && await pathExists(storedPath)) {
    return storedPath;
  }

  // No stored path — auto-initialize to the default app data directory.
  if (!storedPath) {
    try {
      const defaultPath = await invokeTauri("get_default_data_dir");
      if (defaultPath) {
        setStoredDataFolderPath(defaultPath);
        return defaultPath;
      }
    } catch (error) {
      console.warn("Could not resolve default data directory.", error);
    }
  }

  if (storedPath) {
    clearStoredDataFolderPath();
  }
  if (!promptIfMissing) return "";
  return chooseDataFolder(storedPath);
}

async function loadSettingsCache() {
  const folderPath = await ensureDataFolderPath();
  if (!folderPath) return null;
  if (settingsCache && settingsCacheFolderPath === folderPath) return settingsCache;
  const settingsPath = joinFolderPath(folderPath, SETTINGS_FILE_NAME);
  try {
    const raw = await readTextFile(settingsPath);
    if (!raw) {
      settingsCache = {};
      settingsCacheFolderPath = folderPath;
      return settingsCache;
    }
    const parsed = JSON.parse(raw);
    settingsCache = parsed && typeof parsed === "object" ? { ...parsed } : {};
    settingsCacheFolderPath = folderPath;
    return settingsCache;
  } catch (error) {
    console.warn("Could not load the data folder settings.", error);
    settingsCache = {};
    settingsCacheFolderPath = folderPath;
    return settingsCache;
  }
}

async function saveSettingsCache(settings) {
  const folderPath = await ensureDataFolderPath();
  if (!folderPath) return false;
  const settingsPath = joinFolderPath(folderPath, SETTINGS_FILE_NAME);
  const serialized = JSON.stringify(settings, null, 2);
  await ensureDir(folderPath);
  await writeTextFile(settingsPath, serialized);
  settingsCache = { ...settings };
  settingsCacheFolderPath = folderPath;
  return true;
}

export async function loadDataSettingsMap() {
  const settings = await loadSettingsCache();
  return settings ? { ...settings } : null;
}

export async function saveDataSettingsMap(nextSettings) {
  if (!nextSettings || typeof nextSettings !== "object") return false;
  return saveSettingsCache(nextSettings);
}

export async function loadDataSetting(storageKey, fallback) {
  const folderPath = await ensureDataFolderPath();
  if (!folderPath) {
    if (isTauriRuntime()) return fallback;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw == null) return fallback;
      if (typeof fallback === "boolean") return raw === "true";
      if (typeof fallback === "string") return raw;
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    } catch {
      return fallback;
    }
  }
  const settings = await loadSettingsCache();
  if (!settings || !(storageKey in settings)) return fallback;
  return settings[storageKey];
}

export async function saveDataSetting(storageKey, value) {
  const folderPath = await ensureDataFolderPath();
  if (!folderPath) {
    if (isTauriRuntime()) return false;
    try {
      if (typeof value === "string") {
        localStorage.setItem(storageKey, value);
      } else if (typeof value === "boolean") {
        localStorage.setItem(storageKey, String(value));
      } else {
        localStorage.setItem(storageKey, JSON.stringify(value));
      }
      return true;
    } catch (error) {
      console.warn(`Could not save ${storageKey} to localStorage.`, error);
      return false;
    }
  }

  const settings = await loadSettingsCache() || {};
  settings[storageKey] = value;
  return saveSettingsCache(settings);
}

export async function hasAnyDataFolderContent() {
  const folderPath = await ensureDataFolderPath();
  if (!folderPath) return false;
  const settingsPath = joinFolderPath(folderPath, SETTINGS_FILE_NAME);
  const customTileSetsPath = joinFolderPath(folderPath, CUSTOM_TILE_SETS_DIR);
  const settingsExists = await pathExists(settingsPath);
  const customEntries = await listDirEntries(customTileSetsPath);
  return settingsExists || customEntries.length > 0;
}

export function getDataFolderRelativePaths() {
  return {
    settingsFileName: SETTINGS_FILE_NAME,
    customTileSetsDir: CUSTOM_TILE_SETS_DIR,
    customTileSetEditorFile: CUSTOM_TILE_SET_EDITOR_FILE,
  };
}

export function joinDataFolderPath(folderPath, ...parts) {
  return joinFolderPath(folderPath, ...parts);
}
