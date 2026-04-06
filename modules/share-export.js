function roundShareNumber(value, decimals = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

export function getShareQueryParam(search = window.location.search) {
  return new URLSearchParams(search).get("layout") || "";
}

export function encodeBase64Url(text) {
  const bytes = new TextEncoder().encode(String(text || ""));
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function decodeBase64Url(encoded) {
  const normalized = String(encoded || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function captureShareLayoutPayload(snapshot, normalizeAngle) {
  return {
    v: 1,
    ts: snapshot.tileSetId,
    z: roundShareNumber(snapshot.boardZoom, 3),
    px: roundShareNumber(snapshot.boardPanX),
    py: roundShareNumber(snapshot.boardPanY),
    o: [...snapshot.regularTileOrder],
    rm: snapshot.referenceMarker
      ? {
          x: roundShareNumber(snapshot.referenceMarker.x),
          y: roundShareNumber(snapshot.referenceMarker.y),
        }
      : null,
    t: (snapshot.tiles || []).map((tile) => ({
      i: tile.tileId,
      p: Boolean(tile.placed) ? 1 : 0,
      x: roundShareNumber(tile.x),
      y: roundShareNumber(tile.y),
      r: normalizeAngle(Number(tile.rotation) || 0),
    })),
    b: (snapshot.bossTokens || []).map((token) => ({
      s: token.src,
      x: roundShareNumber(token.x),
      y: roundShareNumber(token.y),
      n: roundShareNumber(token.size),
    })),
  };
}

export function buildShareLayoutSnapshot(payload, deps) {
  const {
    getTileSetConfig,
    normalizeRegularTileOrder,
    buildTileDefs,
    migrateLegacyTileId,
    normalizeAngle,
    defaultBoardZoom,
    traySlotCount,
  } = deps;
  if (!payload || typeof payload !== "object" || payload.v !== 1) return null;
  const tileSetId = String(payload.ts || "");
  const tileSet = getTileSetConfig(tileSetId);
  if (!tileSet) return null;

  const regularTileOrder = normalizeRegularTileOrder(payload.o || [], tileSetId);
  const validTileIds = new Set(buildTileDefs(tileSetId).map((def) => def.tileId));
  const tiles = [];
  for (const entry of payload.t || []) {
    const tileId = migrateLegacyTileId(entry?.i);
    if (!validTileIds.has(tileId)) continue;
    tiles.push({
      tileId,
      placed: Boolean(entry?.p),
      x: roundShareNumber(entry?.x),
      y: roundShareNumber(entry?.y),
      rotation: normalizeAngle(Number(entry?.r) || 0),
    });
  }
  if (!tiles.length) return null;

  const bossTokens = (payload.b || [])
    .filter((entry) => typeof entry?.s === "string" && entry.s)
    .map((entry) => ({
      src: entry.s,
      x: roundShareNumber(entry.x),
      y: roundShareNumber(entry.y),
      size: Math.max(1, roundShareNumber(entry.n)),
    }));

  const referenceMarker =
    payload.rm
    && Number.isFinite(Number(payload.rm.x))
    && Number.isFinite(Number(payload.rm.y))
      ? {
          x: roundShareNumber(payload.rm.x),
          y: roundShareNumber(payload.rm.y),
        }
      : null;

  return {
    tileSetId,
    boardPanX: roundShareNumber(payload.px),
    boardPanY: roundShareNumber(payload.py),
    boardZoom: Math.max(0.7, Math.min(1.8, Number(payload.z) || defaultBoardZoom)),
    regularTileOrder,
    reserveOrder: regularTileOrder.slice(traySlotCount),
    referenceMarker,
    bossTokens,
    tiles,
  };
}

export function createShareLayoutUrl(href, payload) {
  const url = new URL(href);
  url.searchParams.set("layout", encodeBase64Url(JSON.stringify(payload)));
  return url.toString();
}

export function buildCurrentLayoutExportItems({
  placedTiles,
  includeReference = true,
  includeBoss = true,
  isEntranceTile,
  tileSize,
  referenceCardId,
  referenceMarker,
  referenceTileSrc,
  bossTokens,
  normalizeAngle,
}) {
  const tileItems = placedTiles.map((tile) => ({
    kind: isEntranceTile(tile) ? "entrance" : "tile",
    tileId: tile.tileId,
    src: tile.imageSrc,
    x: tile.x,
    y: tile.y,
    width: isEntranceTile(tile) ? (tileSize - 3) : tileSize,
    height: tileSize,
    rotation: normalizeAngle(tile.rotation || 0),
  }));
  const referenceItems = includeReference && referenceMarker && referenceTileSrc
    ? [{
        kind: "reference",
        tileId: referenceCardId,
        src: referenceTileSrc,
        x: referenceMarker.x,
        y: referenceMarker.y,
        width: tileSize,
        height: tileSize,
        rotation: 0,
      }]
    : [];
  const bossItems = includeBoss
    ? bossTokens.map((token) => ({
        kind: "boss",
        tileId: token.id,
        src: token.src,
        x: token.x,
        y: token.y,
        width: token.size || tileSize,
        height: token.size || tileSize,
        rotation: 0,
      }))
    : [];
  return [...tileItems, ...referenceItems, ...bossItems];
}
