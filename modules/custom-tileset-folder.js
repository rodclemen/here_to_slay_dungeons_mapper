import {
  ensureDir,
  joinDataFolderPath,
  readFileBytes,
  readTextFile,
  removePath,
  writeFileBytes,
  writeTextFile,
} from "./data-folder-store.js";
import { buildCustomTileAssetStorageKey } from "./custom-tileset-storage.js";
import {
  getRequiredCustomTileAssetRefs,
  normalizeCustomTileSetRecord,
  stripTransientCustomTileSetFields,
} from "./custom-tileset-package.js";

function getCustomPackageAssetMap(manifest) {
  return manifest?.assetMap || manifest?.assetPaths || null;
}

function getPackageAssetRelativePath(assetMap, tileSet, assetKind, assetId) {
  if (!assetMap || typeof assetMap !== "object") return "";
  const entry = assetMap[assetKind];
  if (typeof entry === "string") return entry.trim();
  if (entry && typeof entry === "object" && typeof entry[assetId] === "string") {
    return entry[assetId].trim();
  }
  if (assetKind === "entrance" && entry && typeof entry[tileSet.entranceTileId] === "string") {
    return entry[tileSet.entranceTileId].trim();
  }
  if (assetKind === "reference" && entry && typeof entry[tileSet.referenceCardId] === "string") {
    return entry[tileSet.referenceCardId].trim();
  }
  return "";
}

function normalizePackagePath(path) {
  return String(path || "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "")
    .trim();
}

function inferBlobTypeFromPath(path) {
  if (/\.png$/i.test(path)) return "image/png";
  if (/\.jpe?g$/i.test(path)) return "image/jpeg";
  if (/\.webp$/i.test(path)) return "image/webp";
  return "application/octet-stream";
}

function validateImportedManifest(manifest, options) {
  const expectedTileIds = Array.isArray(options.tileIds) ? options.tileIds : [];
  if (!expectedTileIds.length) {
    throw new Error("Tile ID schema is required to import a custom tile set folder.");
  }
  if (!Array.isArray(manifest.tileIds) || manifest.tileIds.length !== expectedTileIds.length) {
    throw new Error(`manifest.json must define exactly ${expectedTileIds.length} tileIds.`);
  }
  if (new Set(manifest.tileIds.map((tileId) => String(tileId || "").trim()).filter(Boolean)).size !== expectedTileIds.length) {
    throw new Error(`manifest.json must define ${expectedTileIds.length} unique tileIds.`);
  }
  if (!manifest.entranceTileId || !manifest.referenceCardId) {
    throw new Error("manifest.json must define entranceTileId and referenceCardId.");
  }
  if (!Array.isArray(manifest.bossIds)) {
    throw new Error("manifest.json must define bossIds as an array.");
  }
  if (new Set(manifest.bossIds.map((bossId) => String(bossId || "").trim()).filter(Boolean)).size !== 2) {
    throw new Error("manifest.json must define exactly 2 unique bossIds.");
  }
}

export async function readCustomTileSetFolderBundle(folderPath, options = {}) {
  const normalizedFolder = String(folderPath || "").trim();
  if (!normalizedFolder) {
    throw new Error("A tile set folder path is required.");
  }
  const expectedTileIds = Array.isArray(options.tileIds) ? options.tileIds : [];

  try {
    const manifestText = await readTextFile(joinDataFolderPath(normalizedFolder, "manifest.json"));
    if (!manifestText) {
      throw new Error("Folder is missing manifest.json at the package root.");
    }

    let manifest;
    try {
      manifest = JSON.parse(manifestText);
    } catch {
      throw new Error("manifest.json is not valid JSON.");
    }

    validateImportedManifest(manifest, { ...options, tileIds: expectedTileIds });

    const normalized = normalizeCustomTileSetRecord({
      ...manifest,
      assetPaths: getCustomPackageAssetMap(manifest),
    }, {
      includeAssetPaths: true,
      tileIds: expectedTileIds,
      entranceTileId: options.entranceTileId,
      referenceCardId: options.referenceCardId,
    });

    if (!normalized) {
      throw new Error("manifest.json is missing required tileset fields.");
    }
    if ((options.builtInTileSetIds || new Set()).has(normalized.id)) {
      throw new Error(`Tileset id "${normalized.id}" conflicts with a built-in set.`);
    }

    const assetEntries = [];
    for (const { assetKind, assetId } of getRequiredCustomTileAssetRefs(normalized)) {
      const relativePath = normalizePackagePath(
        getPackageAssetRelativePath(normalized.assetPaths, normalized, assetKind, assetId),
      );
      if (!relativePath) {
        throw new Error(`manifest.json is missing asset mapping for ${assetKind}:${assetId}`);
      }
      const bytes = await readFileBytes(joinDataFolderPath(normalizedFolder, relativePath));
      if (!bytes) {
        throw new Error(`Folder is missing asset file: ${relativePath}`);
      }
      assetEntries.push({
        key: buildCustomTileAssetStorageKey(normalized.id, assetKind, assetId),
        tileSetId: normalized.id,
        assetKind,
        assetId,
        blob: new Blob([bytes], { type: inferBlobTypeFromPath(relativePath) }),
      });
    }

    let wallEditorData = null;
    const wallEditorText = await readTextFile(joinDataFolderPath(normalizedFolder, "wall_editor.json"));
    if (wallEditorText) {
      try {
        wallEditorData = JSON.parse(wallEditorText);
      } catch {
        throw new Error("wall_editor.json is not valid JSON.");
      }
    }

    return {
      manifest: stripTransientCustomTileSetFields(normalized, options),
      assets: assetEntries,
      wallEditorData,
    };
  } catch (error) {
    console.warn(`Skipping broken custom tile set folder at ${normalizedFolder}.`, error);
    return null;
  }
}

export async function saveCustomTileSetFolderBundle(folderPath, { manifest, assetEntries = [], wallEditorData = null } = {}) {
  const normalizedFolder = String(folderPath || "").trim();
  if (!normalizedFolder) {
    throw new Error("A tile set folder path is required.");
  }
  if (!manifest?.id) {
    throw new Error("A valid custom tile set manifest is required.");
  }

  await ensureDir(normalizedFolder);
  const assetsDir = joinDataFolderPath(normalizedFolder, "assets");
  await removePath(assetsDir);
  await ensureDir(assetsDir);

  await writeTextFile(joinDataFolderPath(normalizedFolder, "manifest.json"), JSON.stringify(manifest, null, 2));
  if (wallEditorData && typeof wallEditorData === "object" && Object.keys(wallEditorData).length) {
    await writeTextFile(joinDataFolderPath(normalizedFolder, "wall_editor.json"), JSON.stringify(wallEditorData, null, 2));
  } else {
    await removePath(joinDataFolderPath(normalizedFolder, "wall_editor.json"));
  }

  const assetMap = manifest.assetMap || manifest.assetPaths || {};
  for (const assetEntry of assetEntries) {
    const relativePath = normalizePackagePath(
      getPackageAssetRelativePath(assetMap, manifest, assetEntry.assetKind, assetEntry.assetId),
    );
    if (!relativePath || !(assetEntry.blob instanceof Blob)) continue;
    const bytes = new Uint8Array(await assetEntry.blob.arrayBuffer());
    await writeFileBytes(joinDataFolderPath(normalizedFolder, relativePath), bytes);
  }

  return true;
}
