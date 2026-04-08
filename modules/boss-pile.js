export function getBossTileSources(tileSetId, getTileSetConfig, resolveTileSetAssetPath) {
  const tileSet = getTileSetConfig(tileSetId);
  const bossIds = Array.isArray(tileSet?.bossIds) ? tileSet.bossIds : [];
  return bossIds.map((bossId) => resolveTileSetAssetPath(tileSet, "boss", bossId));
}

export function normalizeOrderedSources(canonical, existing = []) {
  const seen = new Set();
  const normalized = [];

  for (const src of existing) {
    if (!canonical.includes(src)) continue;
    if (seen.has(src)) continue;
    seen.add(src);
    normalized.push(src);
  }
  for (const src of canonical) {
    if (seen.has(src)) continue;
    seen.add(src);
    normalized.push(src);
  }

  return normalized;
}

export function rotatePileTop(order) {
  if (!Array.isArray(order) || order.length < 2) return Array.isArray(order) ? [...order] : [];
  const next = [...order];
  const top = next.pop();
  next.unshift(top);
  return next;
}

export function buildAllBossTileSources(tileSetRegistry, getBossTileSourcesForTileSet) {
  const allCanonical = [];
  for (const tileSet of tileSetRegistry) {
    allCanonical.push(...getBossTileSourcesForTileSet(tileSet.id));
  }
  return allCanonical;
}

export function shuffleDistinctOrder(order, shuffle, { swapPair = false } = {}) {
  const source = Array.isArray(order) ? [...order] : [];
  if (source.length <= 1) return source;
  if (swapPair && source.length === 2) {
    return [source[1], source[0]];
  }
  const next = shuffle(source);
  const unchanged = next.every((src, idx) => src === source[idx]);
  if (unchanged) {
    next.push(next.shift());
  }
  return next;
}

export function findBossTileSetIdForSrc(
  src,
  tileSetRegistry,
  getBossTileSourcesForTileSet,
  fallbackTileSetId,
) {
  for (const tileSet of tileSetRegistry) {
    if (getBossTileSourcesForTileSet(tileSet.id).includes(src)) return tileSet.id;
  }
  return fallbackTileSetId;
}

export function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 0xffffffff;
}

export function generateAllBossesOffset(src, z, count) {
  const t = count > 1 ? (z - 1) / (count - 1) : 0.5;
  const rot = -20 + hashString(src + "rot") * 40;
  const dx = -15 + hashString(src + "dx") * 30;
  const dy = -4 + hashString(src + "dy") * 12;
  const scale = 0.94 + t * 0.06;
  return { dx, dy, rot, z, scale };
}
