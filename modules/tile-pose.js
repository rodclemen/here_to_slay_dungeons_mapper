export function buildInsetPolygon(tile, poly, insetPx) {
  if (!Number.isFinite(insetPx) || insetPx <= 0) return poly;
  return (poly || []).map((point) => {
    const dx = point.x - tile.x;
    const dy = point.y - tile.y;
    const len = Math.hypot(dx, dy);
    if (len <= insetPx || len < 1e-6) {
      return {
        x: tile.x + dx * 0.5,
        y: tile.y + dy * 0.5,
      };
    }
    const scale = (len - insetPx) / len;
    return {
      x: tile.x + dx * scale,
      y: tile.y + dy * scale,
    };
  });
}

export function getTilePoseGeometry(tile, {
  tilePoseGeometryCache,
  cacheLimit,
  normalizeAngle,
  getGuideFacePoints,
  getWallFaceSignature,
  insetPx,
  getPolygonBounds,
}) {
  if (!tile) {
    return {
      world: [],
      faces: [],
      overlapPolygon: [],
      overlapBounds: null,
    };
  }

  let cache = tilePoseGeometryCache.get(tile);
  if (!cache) {
    cache = new Map();
    tilePoseGeometryCache.set(tile, cache);
  }

  const key = [
    tile.x.toFixed(3),
    tile.y.toFixed(3),
    normalizeAngle(tile.rotation).toFixed(3),
    getWallFaceSignature(tile),
  ].join("|");
  const cached = cache.get(key);
  if (cached) return cached;

  if (cache.size >= cacheLimit) {
    cache.clear();
  }

  const points = getGuideFacePoints(tile);
  const rotationRad = (tile.rotation * Math.PI) / 180;
  const cos = Math.cos(rotationRad);
  const sin = Math.sin(rotationRad);
  const world = points.map((p) => ({
    x: tile.x + p.x * cos - p.y * sin,
    y: tile.y + p.x * sin + p.y * cos,
  }));

  const faces = [];
  for (let i = 0; i < world.length; i += 1) {
    const a = world[i];
    const b = world[(i + 1) % world.length];
    const ex = b.x - a.x;
    const ey = b.y - a.y;
    const len = Math.hypot(ex, ey) || 1;
    const tx = ex / len;
    const ty = ey / len;
    let nx = ty;
    let ny = -tx;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;

    if ((mx - tile.x) * nx + (my - tile.y) * ny < 0) {
      nx = -nx;
      ny = -ny;
    }

    const offset = (mx - tile.x) * nx + (my - tile.y) * ny;
    faces.push({
      mx,
      my,
      nx,
      ny,
      tx,
      ty,
      len,
      offset,
      startIdx: i,
      endIdx: (i + 1) % world.length,
      isWall: tile.wallFaceSet?.has(i) ?? false,
    });
  }

  const overlapPolygon = buildInsetPolygon(tile, world, insetPx);
  const entry = {
    world,
    faces,
    overlapPolygon,
    overlapBounds: getPolygonBounds(overlapPolygon),
  };
  cache.set(key, entry);
  return entry;
}

export function getSideDirections(tile, {
  tileSideDirectionsCache,
  normalizeAngle,
  getContactFaces,
}) {
  if (!tile) return [];
  let cache = tileSideDirectionsCache.get(tile);
  if (!cache) {
    cache = new Map();
    tileSideDirectionsCache.set(tile, cache);
  }
  const key = normalizeAngle(tile.rotation).toFixed(3);
  const cached = cache.get(key);
  if (cached) return cached;

  const next = getContactFaces(tile).map((f) => ({
    nx: f.nx,
    ny: f.ny,
    offset: f.offset,
  }));
  cache.set(key, next);
  return next;
}

export function hasAnyOverlap(tile, otherTiles, {
  getTilePoseGeometry,
  boundsOverlap,
  pointInPolygonStrict,
  polygonsOverlap,
}) {
  const tileGeometry = getTilePoseGeometry(tile);
  const tilePoly = tileGeometry.overlapPolygon;
  const tileBounds = tileGeometry.overlapBounds;
  for (const other of otherTiles) {
    const otherGeometry = getTilePoseGeometry(other);
    const otherPoly = otherGeometry.overlapPolygon;
    const otherBounds = otherGeometry.overlapBounds;
    if (!boundsOverlap(tileBounds, otherBounds)) continue;
    if (pointInPolygonStrict({ x: tile.x, y: tile.y }, otherPoly)) return true;
    if (pointInPolygonStrict({ x: other.x, y: other.y }, tilePoly)) return true;
    if (polygonsOverlap(tilePoly, otherPoly)) return true;
  }
  return false;
}
