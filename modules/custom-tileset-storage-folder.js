import {
  ensureDir,
  getDataFolderRelativePaths,
  getStoredDataFolderPath,
  joinDataFolderPath,
  listDirEntries,
  pathExists,
  readFileBytes,
  readTextFile,
  removePath,
  writeFileBytes,
  writeTextFile,
} from "./data-folder-store.js";

const { customTileSetsDir, customTileSetEditorFile } = getDataFolderRelativePaths();

function buildCustomTileAssetStorageKey(tileSetId, assetKind, assetId) {
  return `${tileSetId}:${assetKind}:${assetId}`;
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

export async function isAvailable() {
  return Boolean(await getActiveDataFolderPath());
}

async function readBundle(tileSetDirPath) {
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

export async function listBundles() {
  const folderPath = await getActiveDataFolderPath();
  if (!folderPath) return [];
  const rootPath = joinDataFolderPath(folderPath, customTileSetsDir);
  const entries = await listDirEntries(rootPath);
  const bundles = [];
  for (const entry of entries) {
    if (!entry.is_dir) continue;
    const bundle = await readBundle(entry.path);
    if (!bundle?.manifest) continue;
    bundles.push(bundle);
  }
  return bundles;
}

export async function saveBundle(manifest, assetEntries) {
  const folderPath = await getActiveDataFolderPath();
  if (!folderPath) return;
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
}

export async function deleteBundle(tileSetId) {
  const folderPath = await getActiveDataFolderPath();
  if (!folderPath) return;
  await removePath(joinDataFolderPath(folderPath, customTileSetsDir, tileSetId));
}

export async function clearBundles() {
  const folderPath = await getActiveDataFolderPath();
  if (!folderPath) return;
  await removePath(joinDataFolderPath(folderPath, customTileSetsDir));
  await ensureDir(joinDataFolderPath(folderPath, customTileSetsDir));
}

export async function listEditorData() {
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

export async function getEditorData(tileSetId) {
  const records = await listEditorData();
  return records.find((record) => record.tileSetId === tileSetId) || null;
}

export async function saveEditorData(tileSetId, editorData) {
  const folderPath = await getActiveDataFolderPath();
  if (!folderPath) return;
  const bundleDir = joinDataFolderPath(folderPath, customTileSetsDir, tileSetId);
  await ensureDir(bundleDir);
  await writeTextFile(
    joinDataFolderPath(bundleDir, customTileSetEditorFile),
    JSON.stringify({
      tileSetId,
      ...editorData,
    }, null, 2),
  );
}

export async function deleteEditorData(tileSetId) {
  const folderPath = await getActiveDataFolderPath();
  if (!folderPath) return;
  await removePath(joinDataFolderPath(folderPath, customTileSetsDir, tileSetId, customTileSetEditorFile));
}
