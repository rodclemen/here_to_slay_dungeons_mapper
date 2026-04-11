import { saveDataSetting } from "./data-folder-store.js";

function loadJsonStorage(storageKey, warnMessage, fallback = {}) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return fallback;
    return parsed;
  } catch (error) {
    console.warn(warnMessage, error);
    return fallback;
  }
}

export function saveJsonStorage(storageKey, value, warnMessage) {
  void saveDataSetting(storageKey, value).catch((error) => {
    console.warn(warnMessage, error);
  });
}

export function sanitizeWallOverrides(input, { tileSetRegistry, buildTileDefs }) {
  if (!input || typeof input !== "object") return {};
  const clean = {};
  for (const tileSet of tileSetRegistry) {
    const tileSetValue = input[tileSet.id];
    if (!tileSetValue || typeof tileSetValue !== "object") continue;
    const tileSetOut = {};
    const defs = buildTileDefs(tileSet.id);
    for (const def of defs) {
      const arr = tileSetValue[def.tileId];
      if (!Array.isArray(arr)) continue;
      const uniq = [...new Set(
        arr
          .filter((n) => Number.isInteger(n) && n >= 0 && n < 64)
          .map((n) => Number(n)),
      )].sort((a, b) => a - b);
      tileSetOut[def.tileId] = uniq;
    }
    if (Object.keys(tileSetOut).length) clean[tileSet.id] = tileSetOut;
  }
  return clean;
}

export function sanitizeEndTileOverrides(input, { tileSetRegistry, buildTileDefs }) {
  if (!input || typeof input !== "object") return {};
  const clean = {};
  for (const tileSet of tileSetRegistry) {
    const tileSetValue = input[tileSet.id];
    if (!tileSetValue || typeof tileSetValue !== "object") continue;
    const tileSetOut = {};
    const defs = buildTileDefs(tileSet.id);
    for (const def of defs) {
      const value = tileSetValue[def.tileId];
      if (typeof value !== "boolean") continue;
      tileSetOut[def.tileId] = value;
    }
    if (Object.keys(tileSetOut).length) clean[tileSet.id] = tileSetOut;
  }
  return clean;
}

export function sanitizePortalFlagPosition(input, { tileSize, clamp }) {
  if (!input || typeof input !== "object") return null;
  const x = Number(input.x);
  const y = Number(input.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const limit = tileSize * 0.5 - 8;
  return {
    x: clamp(x, -limit, limit),
    y: clamp(y, -limit, limit),
  };
}

export function clonePortalFlag(flag, deps) {
  const sanitized = sanitizePortalFlagPosition(flag, deps);
  return sanitized ? { ...sanitized } : null;
}

export function hasPortalFlag(tile, deps) {
  return Boolean(clonePortalFlag(tile?.portalFlag, deps));
}

export function sanitizePortalFlagOverrides(input, { tileSetRegistry, buildTileDefs, portalDeps }) {
  if (!input || typeof input !== "object") return {};
  const clean = {};
  for (const tileSet of tileSetRegistry) {
    const tileSetValue = input[tileSet.id];
    if (!tileSetValue || typeof tileSetValue !== "object") continue;
    const tileSetOut = {};
    const defs = buildTileDefs(tileSet.id);
    for (const def of defs) {
      const value = sanitizePortalFlagPosition(tileSetValue[def.tileId], portalDeps);
      if (!value) continue;
      tileSetOut[def.tileId] = value;
    }
    if (Object.keys(tileSetOut).length) clean[tileSet.id] = tileSetOut;
  }
  return clean;
}

export function loadWallOverrides(storageKey, migrateLegacyWallOverrides, deps) {
  const parsed = loadJsonStorage(storageKey, "Could not load wall overrides from storage.");
  return sanitizeWallOverrides(migrateLegacyWallOverrides(parsed), deps);
}

export function loadEndTileOverrides(storageKey, deps) {
  const parsed = loadJsonStorage(storageKey, "Could not load end-tile overrides from storage.");
  return sanitizeEndTileOverrides(parsed, deps);
}

export function loadPortalFlagOverrides(storageKey, deps) {
  const parsed = loadJsonStorage(storageKey, "Could not load portal overrides from storage.");
  return sanitizePortalFlagOverrides(parsed, deps);
}

export function sanitizeGuidePointTemplatePoints(points) {
  if (!Array.isArray(points) || points.length < 8) return null;
  const sanitized = [];
  for (const point of points) {
    const x = Number(point?.x);
    const y = Number(point?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    sanitized.push({ x, y });
  }
  return sanitized;
}

export function sanitizeGuidePointTemplateOverrides(raw) {
  if (!raw || typeof raw !== "object") return {};
  const sanitized = {};
  const regular = sanitizeGuidePointTemplatePoints(raw.regular);
  const entrance = sanitizeGuidePointTemplatePoints(raw.entrance);
  if (regular) sanitized.regular = regular;
  if (entrance) sanitized.entrance = entrance;
  return sanitized;
}

export function loadGuidePointTemplateOverrides(storageKey) {
  const parsed = loadJsonStorage(storageKey, "Could not load guide point templates from storage.");
  return sanitizeGuidePointTemplateOverrides(parsed);
}
