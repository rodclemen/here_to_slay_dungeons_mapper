const DB_NAME = "here_to_slay_custom_tilesets";
const DB_VERSION = 2;
const TILE_SET_STORE = "customTileSets";
const ASSET_STORE = "customTileAssets";
const EDITOR_DATA_STORE = "customTileSetEditorData";
const TILE_SET_ID_INDEX = "tileSetId";

let dbPromise = null;

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

export async function getStoredCustomTileSetBundle(tileSetId) {
  const bundles = await listStoredCustomTileSetBundles();
  return bundles.find((bundle) => bundle.manifest?.id === tileSetId) || null;
}

export async function saveStoredCustomTileSetBundle(manifest, assetEntries) {
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
  const db = await openDatabase();
  const transaction = db.transaction([TILE_SET_STORE, ASSET_STORE, EDITOR_DATA_STORE], "readwrite");
  transaction.objectStore(TILE_SET_STORE).clear();
  transaction.objectStore(ASSET_STORE).clear();
  transaction.objectStore(EDITOR_DATA_STORE).clear();
  await waitForTransaction(transaction);
}

export async function listStoredCustomTileSetEditorData() {
  const db = await openDatabase();
  const transaction = db.transaction(EDITOR_DATA_STORE, "readonly");
  const records = await wrapRequest(transaction.objectStore(EDITOR_DATA_STORE).getAll());
  await waitForTransaction(transaction);
  return records.map((record) => ({ ...record }));
}

export async function getStoredCustomTileSetEditorData(tileSetId) {
  const db = await openDatabase();
  const transaction = db.transaction(EDITOR_DATA_STORE, "readonly");
  const record = await wrapRequest(transaction.objectStore(EDITOR_DATA_STORE).get(tileSetId));
  await waitForTransaction(transaction);
  return record ? { ...record } : null;
}

export async function saveStoredCustomTileSetEditorData(tileSetId, editorData) {
  const db = await openDatabase();
  const transaction = db.transaction(EDITOR_DATA_STORE, "readwrite");
  transaction.objectStore(EDITOR_DATA_STORE).put({
    tileSetId,
    ...editorData,
  });
  await waitForTransaction(transaction);
}

export async function deleteStoredCustomTileSetEditorData(tileSetId) {
  const db = await openDatabase();
  const transaction = db.transaction(EDITOR_DATA_STORE, "readwrite");
  transaction.objectStore(EDITOR_DATA_STORE).delete(tileSetId);
  await waitForTransaction(transaction);
}
