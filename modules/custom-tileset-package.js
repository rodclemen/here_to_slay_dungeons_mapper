import { buildCustomTileAssetStorageKey } from "./custom-tileset-storage.js";
import { getZipEntryBlob, getZipEntryText, readZipArchive } from "./zip-reader.js";

function sanitizeTileAssetPathMap(input) {
  if (!input || typeof input !== "object") return null;
  const sanitized = {};
  for (const [assetId, assetPath] of Object.entries(input)) {
    if (!assetId || typeof assetPath !== "string" || !assetPath.trim()) continue;
    sanitized[String(assetId)] = assetPath.trim();
  }
  return Object.keys(sanitized).length ? sanitized : null;
}

function sanitizeCustomTileSetAssetPaths(assetPaths, tileSet) {
  if (!assetPaths || typeof assetPaths !== "object") return null;
  const sanitized = {};
  const entrancePath = typeof assetPaths.entrance === "string"
    ? assetPaths.entrance.trim()
    : typeof assetPaths.entrance?.[tileSet.entranceTileId] === "string"
      ? assetPaths.entrance[tileSet.entranceTileId].trim()
      : "";
  const referencePath = typeof assetPaths.reference === "string"
    ? assetPaths.reference.trim()
    : typeof assetPaths.reference?.[tileSet.referenceCardId] === "string"
      ? assetPaths.reference[tileSet.referenceCardId].trim()
      : "";
  const tilePaths = sanitizeTileAssetPathMap(assetPaths.tile);
  const bossPaths = sanitizeTileAssetPathMap(assetPaths.boss);

  if (entrancePath) sanitized.entrance = entrancePath;
  if (referencePath) sanitized.reference = { [tileSet.referenceCardId]: referencePath };
  if (tilePaths) sanitized.tile = tilePaths;
  if (bossPaths) sanitized.boss = bossPaths;

  return Object.keys(sanitized).length ? sanitized : null;
}

export function normalizeCustomTileSetRecord(
  record,
  {
    includeAssetPaths = false,
    tileIds,
    entranceTileId,
    referenceCardId,
  } = {},
) {
  if (!record || typeof record !== "object") return null;
  const id = String(record.id || "").trim();
  if (!id) return null;

  const normalizedTileIds = Array.isArray(record.tileIds) && record.tileIds.length === tileIds.length
    ? record.tileIds.map((tileId) => String(tileId || "").trim()).filter(Boolean)
    : [...tileIds];
  const normalized = {
    ...record,
    id,
    label: String(record.label || id).trim() || id,
    source: "custom",
    gameSetId: String(record.gameSetId || "custom").trim() || "custom",
    entranceTileId: String(record.entranceTileId || entranceTileId).trim() || entranceTileId,
    tileIds: normalizedTileIds.length === tileIds.length ? normalizedTileIds : [...tileIds],
    referenceCardId: String(record.referenceCardId || referenceCardId).trim() || referenceCardId,
    bossIds: Array.isArray(record.bossIds)
      ? [...new Set(record.bossIds.map((bossId) => String(bossId || "").trim()).filter(Boolean))]
      : [],
    status: "not_implemented",
  };

  if (includeAssetPaths) {
    const assetPaths = sanitizeCustomTileSetAssetPaths(record.assetPaths, normalized);
    if (assetPaths) normalized.assetPaths = assetPaths;
    else delete normalized.assetPaths;
  } else {
    delete normalized.assetPaths;
  }
  delete normalized.uiThemeId;

  return normalized;
}

export function getRequiredCustomTileAssetRefs(tileSet) {
  return [
    { assetKind: "entrance", assetId: tileSet.entranceTileId },
    ...tileSet.tileIds.map((tileId) => ({ assetKind: "tile", assetId: tileId })),
    { assetKind: "reference", assetId: tileSet.referenceCardId },
    ...tileSet.bossIds.map((bossId) => ({ assetKind: "boss", assetId: bossId })),
  ];
}

export function stripTransientCustomTileSetFields(tileSet, options = {}) {
  const normalized = normalizeCustomTileSetRecord(tileSet, options);
  if (!normalized) return null;
  delete normalized.status;
  delete normalized.assetResolver;
  return normalized;
}

function slugifyCustomTileSetId(name) {
  const slug = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "custom_tileset";
}

export function buildUniqueCustomTileSetId(name, takenIds) {
  const baseId = slugifyCustomTileSetId(name);
  const normalizedTakenIds = takenIds instanceof Set ? takenIds : new Set(takenIds || []);
  if (!normalizedTakenIds.has(baseId)) return baseId;
  let suffix = 2;
  while (normalizedTakenIds.has(`${baseId}_${suffix}`)) suffix += 1;
  return `${baseId}_${suffix}`;
}

export function buildNewCustomTileSetManifest(name, options = {}) {
  const trimmedName = String(name || "").trim();
  return stripTransientCustomTileSetFields({
    id: buildUniqueCustomTileSetId(trimmedName, options.takenIds),
    label: trimmedName || "Custom Tile Set",
    source: "custom",
    gameSetId: "custom",
    entranceTileId: options.entranceTileId,
    tileIds: [...options.tileIds],
    referenceCardId: options.referenceCardId,
    bossIds: ["boss_01", "boss_02"],
  }, options);
}

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

function getBlobFileExtension(blob, fallback = ".bin") {
  const type = String(blob?.type || "").toLowerCase();
  if (type.includes("png")) return ".png";
  if (type.includes("webp")) return ".webp";
  if (type.includes("jpeg") || type.includes("jpg")) return ".jpg";
  return fallback;
}

function normalizeImportedWallEditorData(raw, tileSet, deps) {
  if (!raw || typeof raw !== "object") return null;
  const validTileIds = new Set([tileSet.entranceTileId, ...tileSet.tileIds]);
  const sanitizeFaces = (value) => [...new Set(
    Array.isArray(value)
      ? value.filter((face) => Number.isInteger(face) && face >= 0 && face < 64)
      : [],
  )].sort((a, b) => a - b);
  const sanitizePortal = (value) => deps.sanitizePortalFlagPosition(value);

  const wallOverrides = {};
  const endTileOverrides = {};
  const portalFlagOverrides = {};

  const wallSource = raw.wallOverrides || raw.wallFaces || {};
  for (const [tileId, faces] of Object.entries(wallSource)) {
    if (!validTileIds.has(tileId)) continue;
    wallOverrides[tileId] = sanitizeFaces(faces);
  }

  const endSource = raw.endTileOverrides || raw.allowAsEndTile || {};
  for (const [tileId, allowed] of Object.entries(endSource)) {
    if (!validTileIds.has(tileId)) continue;
    if (typeof allowed !== "boolean") continue;
    endTileOverrides[tileId] = allowed;
  }

  const portalSource = raw.portalFlagOverrides || raw.portalFlags || {};
  for (const [tileId, portal] of Object.entries(portalSource)) {
    if (!validTileIds.has(tileId)) continue;
    const sanitized = sanitizePortal(portal);
    if (!sanitized) continue;
    portalFlagOverrides[tileId] = sanitized;
  }

  const guidePointTemplateOverrides = deps.sanitizeGuidePointTemplateOverrides(
    raw.guidePointTemplateOverrides || raw.guidePointTemplates || {},
  );

  return {
    wallOverrides,
    endTileOverrides,
    portalFlagOverrides,
    guidePointTemplateOverrides,
  };
}

export async function buildStoredCustomTileSetBundleFromZip(file, options = {}) {
  const files = await readZipArchive(file);
  const manifestText = getZipEntryText(files, "manifest.json");
  if (!manifestText) {
    throw new Error("Zip is missing manifest.json at the package root.");
  }

  let manifest;
  try {
    manifest = JSON.parse(manifestText);
  } catch {
    throw new Error("manifest.json is not valid JSON.");
  }

  if (!Array.isArray(manifest.tileIds) || manifest.tileIds.length !== options.tileIds.length) {
    throw new Error(`manifest.json must define exactly ${options.tileIds.length} tileIds.`);
  }
  if (new Set(manifest.tileIds.map((tileId) => String(tileId || "").trim()).filter(Boolean)).size !== options.tileIds.length) {
    throw new Error(`manifest.json must define ${options.tileIds.length} unique tileIds.`);
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

  const normalized = normalizeCustomTileSetRecord({
    ...manifest,
    assetPaths: getCustomPackageAssetMap(manifest),
  }, {
    includeAssetPaths: true,
    tileIds: options.tileIds,
    entranceTileId: options.entranceTileId,
    referenceCardId: options.referenceCardId,
  });
  if (!normalized) {
    throw new Error("manifest.json is missing required tileset fields.");
  }
  if (normalized.tileIds.length !== options.tileIds.length) {
    throw new Error(`Custom tilesets must define exactly ${options.tileIds.length} regular tile IDs.`);
  }
  if (normalized.bossIds.length !== 2) {
    throw new Error("Custom tilesets must define exactly 2 boss IDs.");
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
    const blob = getZipEntryBlob(files, relativePath, inferBlobTypeFromPath(relativePath));
    if (!blob) {
      throw new Error(`Zip is missing asset file: ${relativePath}`);
    }
    assetEntries.push({
      key: buildCustomTileAssetStorageKey(normalized.id, assetKind, assetId),
      tileSetId: normalized.id,
      assetKind,
      assetId,
      blob,
    });
  }

  let wallEditorData = null;
  const wallEditorText = getZipEntryText(files, "wall_editor.json");
  if (wallEditorText) {
    try {
      wallEditorData = normalizeImportedWallEditorData(JSON.parse(wallEditorText), normalized, options);
    } catch {
      throw new Error("wall_editor.json is not valid JSON.");
    }
  }

  return {
    manifest: stripTransientCustomTileSetFields(normalized, options),
    assets: assetEntries,
    wallEditorData,
  };
}

function cloneCustomTileSetImportBundleWithId(bundle, nextTileSetId) {
  if (!bundle?.manifest || !nextTileSetId) return bundle;
  const nextManifest = {
    ...bundle.manifest,
    id: nextTileSetId,
  };
  const nextAssets = (bundle.assets || []).map((asset) => ({
    ...asset,
    key: buildCustomTileAssetStorageKey(nextTileSetId, asset.assetKind, asset.assetId),
    tileSetId: nextTileSetId,
  }));
  return {
    ...bundle,
    manifest: nextManifest,
    assets: nextAssets,
  };
}

export function ensureImportedCustomTileSetBundleHasUniqueId(bundle, takenIds) {
  if (!bundle?.manifest?.id) return bundle;
  const normalizedTakenIds = takenIds instanceof Set ? takenIds : new Set(takenIds || []);
  if (!normalizedTakenIds.has(bundle.manifest.id)) return bundle;
  const nextTileSetId = buildUniqueCustomTileSetId(bundle.manifest.label || bundle.manifest.id, normalizedTakenIds);
  return cloneCustomTileSetImportBundleWithId(bundle, nextTileSetId);
}

export function buildExportedCustomTileSetManifest(tileSet, assetEntries, options = {}) {
  const manifest = stripTransientCustomTileSetFields(tileSet, options);
  const assetMap = {
    entrance: {},
    tile: {},
    reference: {},
    boss: {},
  };

  for (const assetEntry of assetEntries) {
    const extension = getBlobFileExtension(assetEntry.blob, ".png");
    const fileName = `assets/${assetEntry.assetKind}_${assetEntry.assetId}${extension}`;
    if (!assetMap[assetEntry.assetKind] || typeof assetMap[assetEntry.assetKind] !== "object") {
      assetMap[assetEntry.assetKind] = {};
    }
    assetMap[assetEntry.assetKind][assetEntry.assetId] = fileName;
  }

  return {
    manifest: {
      ...manifest,
      assetMap,
    },
    assetMap,
  };
}
