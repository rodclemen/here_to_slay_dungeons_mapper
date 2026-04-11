import {
  ensureDataFolderPath,
  getDataFolderRelativePaths,
  getStoredDataFolderPath,
  joinDataFolderPath,
  isTauriRuntime,
  listDirEntries,
  pathExists,
  readFileBytes,
  readTextFile,
  removePath,
  writeFileBytes,
  writeTextFile,
  ensureDir,
} from "./data-folder-store.js";

const DB_NAME = "here_to_slay_custom_tilesets";
const DB_VERSION = 2;
const TILE_SET_STORE = "customTileSets";
const ASSET_STORE = "customTileAssets";
const EDITOR_DATA_STORE = "customTileSetEditorData";
const TILE_SET_ID_INDEX = "tileSetId";

const { customTileSetsDir, customTileSetEditorFile } = getDataFolderRelativePaths();

let dbPromise = null;

function isTauriDataFolderConfigured() {
  return Boolean(getStoredDataFolderPath());
}

function normalizeFolderPath(path) {
  return String(path || "").trim().replace(/[\\/]+$/g, "");
}

function inferBlobTypeFromPath(path) {
  if (/\.png$/i.test(path)) return "image/png";
  if (/\.jpe?g$/i.test(path)) return "image/jpeg";
  if (/\.webp$/i.test(path)) return "image/webp";
  return "application/octet-stream";
}

function buildAssetPathMap(assetEntries) {
  const assetMap = {
    entrance: {},
    tile: {},
    reference: {},
    boss: {},
  };
  for (const assetEntry of assetEntries || []) {
    const extension = (() => {
      const type = String(assetEntry?.blob?.type || "").toLowerCase();
      if (type.includes("png")) return ".png";
      if (type.includes("webp")) return ".webp";
      if (type.includes("jpeg") || type.includes("jpg")) return ".jpg";
      return ".bin";
    })();
    const fileName = `assets/${assetEntry.assetKind}_${assetEntry.assetId}${extension}`;
    if (!assetMap[assetEntry.assetKind] || typeof assetMap[assetEntry.assetKind] !== "object") {
      assetMap[assetEntry.assetKind] = {};
    }
    assetMap[assetEntry.assetKind][assetEntry.assetId] = fileName;
  }
  return assetMap;
}

async function getActiveDataFolderPath() {
  const folderPath = normalizeFolderPath(getStoredDataFolderPath());
  if (!folderPath) return "";
  if (!await pathExists(folderPath)) return "";
  return folderPath;
}

async function readFolderCustomTileSetBundle(tileSetDirPath) {
  try {
    const manifestText = await readTextFile(joinDataFolderPath(tileSetDirPath, "manifest.json"));
    if (!manifestText) return null;
    let manifest;
    try {
      manifest = JSON.parse(manifestText);
    } catch (error) {
      console.warn(`Could not parse custom tile set manifest at ${tileSetDirPath}.`, error);
      return null;
    }
    if (!manifest || typeof manifest !== "object" || !manifest.id) return null;

    const assetMap = manifest.assetMap || manifest.assetPaths || {};
    const assetEntries = [];
    const requiredRefs = [
      { assetKind: "entrance", assetId: manifest.entranceTileId },
      ...(Array.isArray(manifest.tileIds) ? manifest.tileIds.map((tileId) => ({ assetKind: "tile", assetId: tileId })) : []),
      { assetKind: "reference", assetId: manifest.referenceCardId },
      ...(Array.isArray(manifest.bossIds) ? manifest.bossIds.map((bossId) => ({ assetKind: "boss", assetId: bossId })) : []),
    ];

    for (const { assetKind, assetId } of requiredRefs) {
      const entry = assetMap?.[assetKind];
      const relativePath = typeof entry === "string"
        ? entry
        : typeof entry?.[assetId] === "string"
          ? entry[assetId]
          : "";
      if (!relativePath) {
        console.warn(`Skipping custom tile set folder at ${tileSetDirPath}: missing asset mapping for ${assetKind}:${assetId}.`);
        return null;
      }
      const absolutePath = joinDataFolderPath(tileSetDirPath, relativePath);
      const bytes = await readFileBytes(absolutePath);
      if (!bytes) {
        console.warn(`Skipping custom tile set folder at ${tileSetDirPath}: missing asset file ${relativePath}.`);
        return null;
      }
      assetEntries.push({
        key: buildCustomTileAssetStorageKey(manifest.id, assetKind, assetId),
        tileSetId: manifest.id,
        assetKind,
        assetId,
        blob: new Blob([bytes], { type: inferBlobTypeFromPath(relativePath) }),
      });
    }

    return {
      manifest: { ...manifest },
      assets: assetEntries,
    };
  } catch (error) {
    console.warn(`Skipping broken custom tile set folder at ${tileSetDirPath}.`, error);
    return null;
  }
}

async function listStoredCustomTileSetBundlesFromFolder() {
  const folderPath = await getActiveDataFolderPath();
  if (!folderPath) return [];
  const rootPath = joinDataFolderPath(folderPath, customTileSetsDir);
  const entries = await listDirEntries(rootPath);
  const bundles = [];
  for (const entry of entries) {
    if (!entry.is_dir) continue;
    const bundle = await readFolderCustomTileSetBundle(entry.path);
    if (!bundle?.manifest) continue;
    bundles.push(bundle);
  }
  return bundles;
}

async function listStoredCustomTileSetBundlesFromIndexedDb() {
  const db = await openDatabase();
  const tileSetTx = db.transaction(TILE_SET_STORE, "readonly");
  const tileSetStore = tileSetTx.objectStore(TILE_SET_STORE);
  const manifests = await wrapRequest(tileSetStore.getAll());
  await waitForTransaction(tileSetTx);

  const assetTx = db.transaction(ASSET_STORE, "readonly");
  const assetStore = assetTx.objectStore(ASSET_STORE);
  const assetEntries = await wrapRequest(assetStore.getAll());
  await waitForTransaction(assetTx);

  const assetsByTileSetId = new Map();
  for (const assetEntry of assetEntries) {
    const list = assetsByTileSetId.get(assetEntry.tileSetId) || [];
    list.push(cloneAssetEntry(assetEntry));
    assetsByTileSetId.set(assetEntry.tileSetId, list);
  }

  return manifests.map((manifest) => ({
    manifest: { ...manifest },
    assets: assetsByTileSetId.get(manifest.id) || [],
  }));
}

async function saveFolderCustomTileSetBundle(manifest, assetEntries) {
  const folderPath = await getActiveDataFolderPath();
  if (!folderPath) return false;
  const bundleDir = joinDataFolderPath(folderPath, customTileSetsDir, manifest.id);
  await removePath(bundleDir);
  await ensureDir(bundleDir);
  const assetsDir = joinDataFolderPath(bundleDir, "assets");
  await ensureDir(assetsDir);

  const nextManifest = {
    ...manifest,
    assetMap: buildAssetPathMap(assetEntries),
  };
  await writeTextFile(joinDataFolderPath(bundleDir, "manifest.json"), JSON.stringify(nextManifest, null, 2));

  for (const assetEntry of assetEntries || []) {
    const relativePath = nextManifest.assetMap?.[assetEntry.assetKind]?.[assetEntry.assetId];
    if (!relativePath || !(assetEntry.blob instanceof Blob)) continue;
    const bytes = new Uint8Array(await assetEntry.blob.arrayBuffer());
    await writeFileBytes(joinDataFolderPath(bundleDir, relativePath), bytes);
  }
  return true;
}

async function deleteFolderCustomTileSetBundle(tileSetId) {
  const folderPath = await getActiveDataFolderPath();
  if (!folderPath) return false;
  await removePath(joinDataFolderPath(folderPath, customTileSetsDir, tileSetId));
  return true;
}

async function clearFolderCustomTileSetBundles() {
  const folderPath = await getActiveDataFolderPath();
  if (!folderPath) return false;
  await removePath(joinDataFolderPath(folderPath, customTileSetsDir));
  await ensureDir(joinDataFolderPath(folderPath, customTileSetsDir));
  return true;
}

async function listStoredCustomTileSetEditorDataFromFolder() {
  const folderPath = await getActiveDataFolderPath();
  if (!folderPath) return [];
  const rootPath = joinDataFolderPath(folderPath, customTileSetsDir);
  const entries = await listDirEntries(rootPath);
  const records = [];
  for (const entry of entries) {
    if (!entry.is_dir) continue;
    try {
      const editorPath = joinDataFolderPath(entry.path, customTileSetEditorFile);
      if (!await pathExists(editorPath)) continue;
      const text = await readTextFile(editorPath);
      if (!text) continue;
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object") records.push({ ...parsed });
    } catch (error) {
      console.warn(`Could not load custom tile set editor data for ${entry.path}.`, error);
    }
  }
  return records;
}

async function listStoredCustomTileSetEditorDataFromIndexedDb() {
  const db = await openDatabase();
  const transaction = db.transaction(EDITOR_DATA_STORE, "readonly");
  const records = await wrapRequest(transaction.objectStore(EDITOR_DATA_STORE).getAll());
  await waitForTransaction(transaction);
  return records.map((record) => ({ ...record }));
}

async function saveFolderCustomTileSetEditorData(tileSetId, editorData) {
  const folderPath = await getActiveDataFolderPath();
  if (!folderPath) return false;
  const bundleDir = joinDataFolderPath(folderPath, customTileSetsDir, tileSetId);
  await ensureDir(bundleDir);
  await writeTextFile(
    joinDataFolderPath(bundleDir, customTileSetEditorFile),
    JSON.stringify({
      tileSetId,
      ...editorData,
    }, null, 2),
  );
  return true;
}

async function deleteFolderCustomTileSetEditorData(tileSetId) {
  const folderPath = await getActiveDataFolderPath();
  if (!folderPath) return false;
  await removePath(joinDataFolderPath(folderPath, customTileSetsDir, tileSetId, customTileSetEditorFile));
  return true;
}

function openDatabase() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error || new Error("Could not open IndexedDB."));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(TILE_SET_STORE)) {
        db.createObjectStore(TILE_SET_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(ASSET_STORE)) {
        const assetStore = db.createObjectStore(ASSET_STORE, { keyPath: "key" });
        assetStore.createIndex(TILE_SET_ID_INDEX, "tileSetId", { unique: false });
      }
      if (!db.objectStoreNames.contains(EDITOR_DATA_STORE)) {
        db.createObjectStore(EDITOR_DATA_STORE, { keyPath: "tileSetId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
  return dbPromise;
}

function waitForTransaction(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("IndexedDB transaction failed."));
    transaction.onabort = () => reject(transaction.error || new Error("IndexedDB transaction aborted."));
  });
}

function wrapRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed."));
  });
}

function cloneAssetEntry(assetEntry) {
  return {
    key: assetEntry.key,
    tileSetId: assetEntry.tileSetId,
    assetKind: assetEntry.assetKind,
    assetId: assetEntry.assetId,
    blob: assetEntry.blob,
  };
}

export function buildCustomTileAssetStorageKey(tileSetId, assetKind, assetId) {
  return `${tileSetId}:${assetKind}:${assetId}`;
}

async function listStoredAssetKeysForTileSet(db, tileSetId) {
  const transaction = db.transaction(ASSET_STORE, "readonly");
  const assetStore = transaction.objectStore(ASSET_STORE);
  const assetIndex = assetStore.index(TILE_SET_ID_INDEX);
  const keys = await wrapRequest(assetIndex.getAllKeys(tileSetId));
  await waitForTransaction(transaction);
  return keys;
}

export async function listStoredCustomTileSetBundles() {
  if (isTauriRuntime() && !isTauriDataFolderConfigured()) return [];
  if (isTauriDataFolderConfigured() && await getActiveDataFolderPath()) {
    return listStoredCustomTileSetBundlesFromFolder();
  }
  return listStoredCustomTileSetBundlesFromIndexedDb();
}

export async function getStoredCustomTileSetBundle(tileSetId) {
  if (isTauriRuntime() && !isTauriDataFolderConfigured()) return null;
  if (isTauriDataFolderConfigured() && await getActiveDataFolderPath()) {
    const bundles = await listStoredCustomTileSetBundlesFromFolder();
    return bundles.find((bundle) => bundle.manifest?.id === tileSetId) || null;
  }
  const bundles = await listStoredCustomTileSetBundles();
  return bundles.find((bundle) => bundle.manifest?.id === tileSetId) || null;
}

export async function saveStoredCustomTileSetBundle(manifest, assetEntries) {
  if (isTauriRuntime() && !isTauriDataFolderConfigured()) return;
  if (isTauriDataFolderConfigured() && await getActiveDataFolderPath()) {
    await saveFolderCustomTileSetBundle(manifest, assetEntries);
    return;
  }
  const db = await openDatabase();
  const existingKeys = await listStoredAssetKeysForTileSet(db, manifest.id);
  const transaction = db.transaction([TILE_SET_STORE, ASSET_STORE], "readwrite");
  const tileSetStore = transaction.objectStore(TILE_SET_STORE);
  const assetStore = transaction.objectStore(ASSET_STORE);

  for (const key of existingKeys) {
    assetStore.delete(key);
  }
  tileSetStore.put({ ...manifest });
  for (const assetEntry of assetEntries) {
    assetStore.put(cloneAssetEntry(assetEntry));
  }

  await waitForTransaction(transaction);
}

export async function deleteStoredCustomTileSetBundle(tileSetId) {
  if (isTauriRuntime() && !isTauriDataFolderConfigured()) return;
  if (isTauriDataFolderConfigured() && await getActiveDataFolderPath()) {
    await deleteFolderCustomTileSetBundle(tileSetId);
    return;
  }
  const db = await openDatabase();
  const existingKeys = await listStoredAssetKeysForTileSet(db, tileSetId);
  const transaction = db.transaction([TILE_SET_STORE, ASSET_STORE, EDITOR_DATA_STORE], "readwrite");
  const tileSetStore = transaction.objectStore(TILE_SET_STORE);
  const assetStore = transaction.objectStore(ASSET_STORE);
  const editorDataStore = transaction.objectStore(EDITOR_DATA_STORE);

  tileSetStore.delete(tileSetId);
  editorDataStore.delete(tileSetId);
  for (const key of existingKeys) {
    assetStore.delete(key);
  }

  await waitForTransaction(transaction);
}

export async function clearStoredCustomTileSetBundles() {
  if (isTauriRuntime() && !isTauriDataFolderConfigured()) return;
  if (isTauriDataFolderConfigured() && await getActiveDataFolderPath()) {
    await clearFolderCustomTileSetBundles();
    return;
  }
  const db = await openDatabase();
  const transaction = db.transaction([TILE_SET_STORE, ASSET_STORE, EDITOR_DATA_STORE], "readwrite");
  transaction.objectStore(TILE_SET_STORE).clear();
  transaction.objectStore(ASSET_STORE).clear();
  transaction.objectStore(EDITOR_DATA_STORE).clear();
  await waitForTransaction(transaction);
}

export async function listStoredCustomTileSetEditorData() {
  if (isTauriRuntime() && !isTauriDataFolderConfigured()) return [];
  if (isTauriDataFolderConfigured() && await getActiveDataFolderPath()) {
    return listStoredCustomTileSetEditorDataFromFolder();
  }
  return listStoredCustomTileSetEditorDataFromIndexedDb();
}

export async function listStoredCustomTileSetBundlesFromLegacyStorage() {
  return listStoredCustomTileSetBundlesFromIndexedDb();
}

export async function listStoredCustomTileSetEditorDataFromLegacyStorage() {
  return listStoredCustomTileSetEditorDataFromIndexedDb();
}

export async function getStoredCustomTileSetEditorData(tileSetId) {
  if (isTauriRuntime() && !isTauriDataFolderConfigured()) return null;
  if (isTauriDataFolderConfigured() && await getActiveDataFolderPath()) {
    const records = await listStoredCustomTileSetEditorDataFromFolder();
    return records.find((record) => record.tileSetId === tileSetId) || null;
  }
  const db = await openDatabase();
  const transaction = db.transaction(EDITOR_DATA_STORE, "readonly");
  const record = await wrapRequest(transaction.objectStore(EDITOR_DATA_STORE).get(tileSetId));
  await waitForTransaction(transaction);
  return record ? { ...record } : null;
}

export async function saveStoredCustomTileSetEditorData(tileSetId, editorData) {
  if (isTauriRuntime() && !isTauriDataFolderConfigured()) return;
  if (isTauriDataFolderConfigured() && await getActiveDataFolderPath()) {
    await saveFolderCustomTileSetEditorData(tileSetId, editorData);
    return;
  }
  const db = await openDatabase();
  const transaction = db.transaction(EDITOR_DATA_STORE, "readwrite");
  transaction.objectStore(EDITOR_DATA_STORE).put({
    tileSetId,
    ...editorData,
  });
  await waitForTransaction(transaction);
}

export async function deleteStoredCustomTileSetEditorData(tileSetId) {
  if (isTauriRuntime() && !isTauriDataFolderConfigured()) return;
  if (isTauriDataFolderConfigured() && await getActiveDataFolderPath()) {
    await deleteFolderCustomTileSetEditorData(tileSetId);
    return;
  }
  const db = await openDatabase();
  const transaction = db.transaction(EDITOR_DATA_STORE, "readwrite");
  transaction.objectStore(EDITOR_DATA_STORE).delete(tileSetId);
  await waitForTransaction(transaction);
}
