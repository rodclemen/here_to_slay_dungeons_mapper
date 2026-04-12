import { isTauriRuntime, getStoredDataFolderPath } from "./data-folder-store.js";
import * as idb from "./custom-tileset-storage-idb.js";
import * as folder from "./custom-tileset-storage-folder.js";

function isTauriDataFolderConfigured() {
  return Boolean(getStoredDataFolderPath());
}

async function useFolder() {
  return isTauriDataFolderConfigured() && await folder.isAvailable();
}

function tauriWithoutFolder() {
  return isTauriRuntime() && !isTauriDataFolderConfigured();
}

export function buildCustomTileAssetStorageKey(tileSetId, assetKind, assetId) {
  return `${tileSetId}:${assetKind}:${assetId}`;
}

export async function listStoredCustomTileSetBundles() {
  if (tauriWithoutFolder()) return [];
  if (await useFolder()) return folder.listBundles();
  return idb.listBundles();
}

export async function getStoredCustomTileSetBundle(tileSetId) {
  if (tauriWithoutFolder()) return null;
  if (await useFolder()) {
    const bundles = await folder.listBundles();
    return bundles.find((bundle) => bundle.manifest?.id === tileSetId) || null;
  }
  const bundles = await listStoredCustomTileSetBundles();
  return bundles.find((bundle) => bundle.manifest?.id === tileSetId) || null;
}

export async function saveStoredCustomTileSetBundle(manifest, assetEntries) {
  if (tauriWithoutFolder()) return;
  if (await useFolder()) return folder.saveBundle(manifest, assetEntries);
  return idb.saveBundle(manifest, assetEntries);
}

export async function deleteStoredCustomTileSetBundle(tileSetId) {
  if (tauriWithoutFolder()) return;
  if (await useFolder()) return folder.deleteBundle(tileSetId);
  return idb.deleteBundle(tileSetId);
}

export async function clearStoredCustomTileSetBundles() {
  if (tauriWithoutFolder()) return;
  if (await useFolder()) return folder.clearBundles();
  return idb.clearBundles();
}

export async function listStoredCustomTileSetEditorData() {
  if (tauriWithoutFolder()) return [];
  if (await useFolder()) return folder.listEditorData();
  return idb.listEditorData();
}

export async function getStoredCustomTileSetEditorData(tileSetId) {
  if (tauriWithoutFolder()) return null;
  if (await useFolder()) return folder.getEditorData(tileSetId);
  return idb.getEditorData(tileSetId);
}

export async function saveStoredCustomTileSetEditorData(tileSetId, editorData) {
  if (tauriWithoutFolder()) return;
  if (await useFolder()) return folder.saveEditorData(tileSetId, editorData);
  return idb.saveEditorData(tileSetId, editorData);
}

export async function deleteStoredCustomTileSetEditorData(tileSetId) {
  if (tauriWithoutFolder()) return;
  if (await useFolder()) return folder.deleteEditorData(tileSetId);
  return idb.deleteEditorData(tileSetId);
}

export async function listStoredCustomTileSetBundlesFromLegacyStorage() {
  return idb.listBundles();
}

export async function listStoredCustomTileSetEditorDataFromLegacyStorage() {
  return idb.listEditorData();
}
