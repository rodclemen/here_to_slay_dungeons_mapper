const IMAGE_CACHE_MAX = 150;
const imageExistsCache = new Map();
const imageLoadCache = new Map();

function lruSet(map, key, value) {
  if (map.size >= IMAGE_CACHE_MAX) map.delete(map.keys().next().value);
  map.set(key, value);
}

function cleanAssetSrc(src) {
  return String(src || "").trim();
}

export function getBuiltInTileSetAssetPath(tileSet, assetKind, assetId = "") {
  const basePath = `./tiles/${tileSet.id}`;
  if (assetKind === "entrance") return cleanAssetSrc(`${basePath}/${tileSet.id}_entrance.png`);
  if (assetKind === "reference") return cleanAssetSrc(`${basePath}/${tileSet.id}_${assetId || "reference_card"}.png`);
  if (assetKind === "tile") return cleanAssetSrc(`${basePath}/${tileSet.id}_${assetId}.png`);
  if (assetKind === "boss") return cleanAssetSrc(`${basePath}/${tileSet.id}_boss_${assetId}.png`);
  return "";
}

export function resolveTileSetAssetPath(tileSet, assetKind, assetId = "") {
  if (!tileSet || !tileSet.id) return "";
  return getBuiltInTileSetAssetPath(tileSet, assetKind, assetId);
}

export function getTileSetAssetPaths(
  tileSet,
  {
    tileIds = [],
    referenceCardId = "reference_card",
    resolveAssetPath = resolveTileSetAssetPath,
  } = {},
) {
  const coreAssets = [
    resolveAssetPath(tileSet, "entrance", tileSet?.entranceTileId || "entrance"),
    ...tileIds.map((tileId) => resolveAssetPath(tileSet, "tile", tileId)),
    resolveAssetPath(tileSet, "reference", referenceCardId),
  ];
  const bossAssets = (tileSet.bossIds || []).map(
    (bossId) => resolveAssetPath(tileSet, "boss", bossId),
  );
  return { coreAssets, bossAssets };
}

export function imageExists(src) {
  const normalizedSrc = cleanAssetSrc(src);
  if (imageExistsCache.has(normalizedSrc)) return imageExistsCache.get(normalizedSrc);
  const pending = new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = normalizedSrc;
  });
  lruSet(imageExistsCache, normalizedSrc, pending);
  return pending;
}

export function getMissingDefaultWallEntries(tileSet, defaultWallFaceData, expectedTileIds) {
  const defaults = defaultWallFaceData?.[tileSet.id];
  if (!defaults || typeof defaults !== "object") return [...expectedTileIds];
  return expectedTileIds.filter((tileId) => !Array.isArray(defaults[tileId]));
}

export function resolveTileSetStatus(tileSet, { coreMissing, bossMissing, missingWallEntries }) {
  const hasCoreMissing = coreMissing.length > 0;
  const hasBossMissing = bossMissing.length > 0;
  const hasWallMissing = missingWallEntries.length > 0;
  const allCoreMissing = coreMissing.length >= 11;
  const hasDeclaredBosses = Array.isArray(tileSet?.bossIds) && tileSet.bossIds.length > 0;

  if (!hasCoreMissing && !hasBossMissing && !hasWallMissing) return "ready";
  if (allCoreMissing && (!hasDeclaredBosses || hasBossMissing)) return "not_implemented";
  if (hasCoreMissing || hasBossMissing) return "assets_missing";
  if (hasWallMissing) return "wall_data_missing";
  return "assets_missing";
}

export function printTileSetReadinessReport(report, legacyMigrationStats) {
  console.group("Here to Slay DUNGEONS - Tile Set Readiness");
  for (const entry of report) {
    console.group(`[${entry.tileSetId}] ${entry.tileSetLabel}`);
    console.info("status:", entry.status);
    if (entry.missingAssets.length) {
      console.warn("missing assets:");
      entry.missingAssets.forEach((asset) => console.warn(`- ${asset}`));
    } else {
      console.info("missing assets: none");
    }
    if (entry.missingWallEntries.length) {
      console.warn("missing wall entries:");
      entry.missingWallEntries.forEach((wallEntry) => console.warn(`- ${wallEntry}`));
    } else {
      console.info("missing wall entries: none");
    }
    if (entry.registryIssues.length) {
      console.warn("registry issues:");
      entry.registryIssues.forEach((issue) => console.warn(`- ${issue}`));
    } else {
      console.info("registry issues: none");
    }
    console.groupEnd();
  }

  const readyTileSets = report.filter((entry) => entry.status === "ready").map((entry) => entry.tileSetId);
  const nonReadyTileSets = report.filter((entry) => entry.status !== "ready").map((entry) => entry.tileSetId);
  console.group("Readiness Summary");
  console.info("ready sets:", readyTileSets.length ? readyTileSets.join(", ") : "none");
  console.info("non-ready sets:", nonReadyTileSets.length ? nonReadyTileSets.join(", ") : "none");
  console.info("legacy migration counters:", legacyMigrationStats);
  console.groupEnd();
  console.groupEnd();
}

export function getRegistryIssues(tileSet, seenIds) {
  const issues = [];
  if (!tileSet?.id) issues.push("missing id");
  if (!tileSet?.label) issues.push("missing label");
  if (!tileSet?.gameSetId) issues.push("missing gameSetId");
  if (tileSet?.source !== "custom" && !tileSet?.uiThemeId) issues.push("missing uiThemeId");
  if (!tileSet?.entranceTileId) issues.push("missing entranceTileId");
  if (!Array.isArray(tileSet?.tileIds) || tileSet.tileIds.length !== 9) issues.push("invalid tileIds");
  if (!tileSet?.referenceCardId) issues.push("missing referenceCardId");
  if (!Array.isArray(tileSet?.bossIds)) issues.push("invalid bossIds");
  if (seenIds.has(tileSet.id)) issues.push("duplicate tileSetId");
  return issues;
}

export function loadImage(src) {
  const normalizedSrc = cleanAssetSrc(src);
  if (imageLoadCache.has(normalizedSrc)) return imageLoadCache.get(normalizedSrc);
  const pending = new Promise((resolve, reject) => {
    if (!normalizedSrc) {
      reject(new Error("Could not load empty image source."));
      return;
    }

    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => {
      imageLoadCache.delete(normalizedSrc);
      reject(new Error(`Could not load ${normalizedSrc}`));
    };
    image.src = normalizedSrc;
  });
  lruSet(imageLoadCache, normalizedSrc, pending);
  return pending;
}
