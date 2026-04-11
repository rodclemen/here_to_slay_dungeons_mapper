// ── Tile Placement ──────────────────────────────────────────────────
// Placement validation, contact snapping, overlap testing, rotation,
// invalid-drop recovery, and drag feedback.  Extracted from app.js.
//
// Every function that needs app.js state or helpers receives a `ctx`
// object — same pattern as wall-editor-ui.js.
// ────────────────────────────────────────────────────────────────────

// ── Tiny helpers (no ctx needed) ────────────────────────────────────

export function positionTile(tile, x, y) {
  tile.x = x;
  tile.y = y;
}

export function quantizeSnapCoord(value, quantum) {
  if (!Number.isFinite(value)) return value;
  const q = Number.isFinite(quantum) && quantum > 0 ? quantum : 1;
  return Number((Math.round(value / q) * q).toFixed(4));
}

export function getNearestTile(x, y, tiles) {
  if (!tiles?.length) return null;
  let nearest = tiles[0];
  let best = Math.hypot(x - nearest.x, y - nearest.y);
  for (let i = 1; i < tiles.length; i += 1) {
    const t = tiles[i];
    const d = Math.hypot(x - t.x, y - t.y);
    if (d < best) {
      best = d;
      nearest = t;
    }
  }
  return nearest;
}

export function clearInvalidReturnTimer(tile) {
  if (!tile?.invalidReturnTimer) return;
  clearTimeout(tile.invalidReturnTimer);
  tile.invalidReturnTimer = null;
}

export function getPlacementFeedbackFaceIndices(result) {
  const validFaceIndices = (result?.faceIndices || []).filter((v) => Number.isInteger(v));
  const validSet = new Set(validFaceIndices);
  const invalidFaceIndices = (result?.touchingFaceIndices || []).filter(
    (v) => Number.isInteger(v) && !validSet.has(v),
  );
  return { validFaceIndices, invalidFaceIndices };
}

export function getInvalidContactReason(result) {
  if (result?.endTileDisallowed) {
    return "This tile is an end tile (3 connected faces) but is not marked as allowed for end placement in Tile Editor.";
  }
  return "Need at least 2 connected faces on one placed tile (4 points).";
}

// ── Geometry wrappers ───────────────────────────────────────────────

export function getContactFaces(tile, ctx) {
  return getTilePoseGeometry(tile, ctx).faces;
}

export function isBlockedContactFace(tile, face, ctx) {
  if (!ctx.isEntranceTile(tile)) return false;
  return (
    ctx.ENTRANCE_BLOCKED_FACE_INDICES.has(face.startIdx)
    || ctx.ENTRANCE_BLOCKED_FACE_INDICES.has(face.endIdx)
  );
}

export function getTilePoseGeometry(tile, ctx) {
  return ctx.getTilePoseGeometryValue(tile, {
    tilePoseGeometryCache: ctx.tilePoseGeometryCache,
    cacheLimit: ctx.TILE_POSE_GEOMETRY_CACHE_LIMIT,
    normalizeAngle: ctx.normalizeAngle,
    getGuideFacePoints: ctx.getGuideFacePoints,
    getWallFaceSignature: ctx.getWallFaceSignature,
    insetPx: ctx.OVERLAP_POLYGON_INSET_PX,
    getPolygonBounds: ctx.getPolygonBounds,
  });
}

export function getSideDirections(tile, ctx) {
  return ctx.getSideDirectionsValue(tile, {
    tileSideDirectionsCache: ctx.tileSideDirectionsCache,
    normalizeAngle: ctx.normalizeAngle,
    getContactFaces: (t) => getContactFaces(t, ctx),
  });
}

export function buildInsetPolygon(tile, poly, insetPx, ctx) {
  return ctx.buildInsetPolygonValue(tile, poly, insetPx);
}

export function getFaceGeometry(image, sideCount, ctx) {
  return ctx.getFaceGeometryValue(image, sideCount, ctx.TILE_SIZE);
}

export function getAlphaMask(image, ctx) {
  return ctx.getAlphaMaskValue(image);
}

export function getSideSamples(tile, ctx) {
  return ctx.getSideSamplesValue(tile, (t) => getContactFaces(t, ctx));
}

export function getMatchAlignmentCorrection(match, ctx) {
  return ctx.getMatchAlignmentCorrectionValue(match, ctx.SNAP_POINT_GAP);
}

export function getWorldPolygon(tile, ctx) {
  return getTilePoseGeometry(tile, ctx).world;
}

export function getOverlapWorldPolygon(tile, ctx, insetPx = ctx.OVERLAP_POLYGON_INSET_PX) {
  if (Math.abs(insetPx - ctx.OVERLAP_POLYGON_INSET_PX) <= 1e-6) {
    return getTilePoseGeometry(tile, ctx).overlapPolygon;
  }
  return buildInsetPolygon(tile, getWorldPolygon(tile, ctx), insetPx, ctx);
}

// ── Contact & overlap ───────────────────────────────────────────────

export function isWorldPointOnOpaquePixel(tile, wx, wy, ctx, radius = 0, minAlpha = 24) {
  return ctx.isWorldPointOnOpaquePixelValue(tile, wx, wy, {
    tileSize: ctx.TILE_SIZE,
    radius,
    minAlpha,
  });
}

export function hasAnyOverlap(tile, otherTiles, ctx) {
  return ctx.hasAnyOverlapValue(tile, otherTiles, {
    getTilePoseGeometry: (t) => getTilePoseGeometry(t, ctx),
    boundsOverlap: ctx.boundsOverlap,
    pointInPolygonStrict: ctx.pointInPolygonStrict,
    polygonsOverlap: ctx.polygonsOverlap,
  });
}

export function isTouchingTileStartBlockedPoints(tile, otherTile, touchRadius, ctx) {
  if (!ctx.isEntranceTile(tile)) return false;
  const points = getTilePoseGeometry(tile, ctx).world;

  for (const idx of ctx.ENTRANCE_BLOCKED_FACE_INDICES) {
    const p = points[idx];
    if (!p) continue;
    if (isWorldPointOnOpaquePixel(otherTile, p.x, p.y, ctx, touchRadius)) return true;
  }

  return false;
}

export function isTouchingMoltenEntranceBlockedPoints(tile, ctx) {
  if (!tile || ctx.isEntranceTile(tile)) return false;
  const entrance = ctx.state.tiles.get(ctx.ENTRANCE_TILE_ID);
  if (!entrance || !entrance.placed) return false;
  return isTouchingTileStartBlockedPoints(entrance, tile, ctx.BLOCKED_POINT_TOUCH_RADIUS, ctx);
}

export function findBestContact(tile, otherTiles, ctx, options = {}) {
  return ctx.findBestContactValue(tile, otherTiles, options, {
    enforceEndTileMaxConnectedFaces: ctx.END_TILE_MAX_CONNECTED_FACES,
    minContactPoints: ctx.MIN_CONTACT_POINTS,
    hasPortalFlag: ctx.hasPortalFlag,
    isTouchingMoltenEntranceBlockedPoints: (t) => isTouchingMoltenEntranceBlockedPoints(t, ctx),
    getContactMatchDetails: (a, b) => getContactMatchDetails(a, b, ctx),
  });
}

export function countSideContacts(a, b, ctx) {
  return ctx.countSideContactsValue(a, b, {
    getContactFaces: (t) => getContactFaces(t, ctx),
    contactDistanceRatio: ctx.CONTACT_DISTANCE_RATIO,
    isTouchingTileStartBlockedPoints: (t, o, r) => isTouchingTileStartBlockedPoints(t, o, r, ctx),
    blockedPointTouchRadius: ctx.BLOCKED_POINT_TOUCH_RADIUS,
    isBlockedContactFace: (t, f) => isBlockedContactFace(t, f, ctx),
    oppositeNormalThreshold: ctx.OPPOSITE_NORMAL_THRESHOLD,
    faceTangentAlignment: ctx.FACE_TANGENT_ALIGNMENT,
  });
}

export function getContactMatchDetails(a, b, ctx) {
  return ctx.getContactMatchDetailsValue(a, b, {
    getContactFaces: (t) => getContactFaces(t, ctx),
    contactDistanceRatio: ctx.CONTACT_DISTANCE_RATIO,
    isTouchingTileStartBlockedPoints: (t, o, r) => isTouchingTileStartBlockedPoints(t, o, r, ctx),
    blockedPointTouchRadius: ctx.BLOCKED_POINT_TOUCH_RADIUS,
    isBlockedContactFace: (t, f) => isBlockedContactFace(t, f, ctx),
    oppositeNormalThreshold: ctx.OPPOSITE_NORMAL_THRESHOLD,
    faceTangentAlignment: ctx.FACE_TANGENT_ALIGNMENT,
  });
}

export function tilesAlphaOverlap(a, b, ctx) {
  if (!a?.alphaMask || !b?.alphaMask) return false;

  const ar = a.shape?.radius ?? ctx.TILE_SIZE * 0.5;
  const br = b.shape?.radius ?? ctx.TILE_SIZE * 0.5;
  if (Math.hypot(a.x - b.x, a.y - b.y) > ar + br) return false;

  const half = ctx.TILE_SIZE * 0.5;
  const minX = Math.max(a.x - half, b.x - half);
  const maxX = Math.min(a.x + half, b.x + half);
  const minY = Math.max(a.y - half, b.y - half);
  const maxY = Math.min(a.y + half, b.y + half);
  if (minX >= maxX || minY >= maxY) return false;

  const step = 3;
  let hitCount = 0;
  for (let y = minY; y <= maxY; y += step) {
    for (let x = minX; x <= maxX; x += step) {
      if (
        isWorldPointOnOpaquePixel(a, x, y, ctx, 0, 220)
        && isWorldPointOnOpaquePixel(b, x, y, ctx, 0, 220)
      ) {
        hitCount += 1;
        if (hitCount >= 14) return true;
      }
    }
  }

  return false;
}

// ── Snap & positioning ──────────────────────────────────────────────

export function getTileGuideLocalCenter(tile, ctx) {
  const points = ctx.getGuideFacePoints(tile);
  if (!points?.length) return { x: 0, y: 0 };
  let sx = 0;
  let sy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
  }
  return {
    x: sx / points.length,
    y: sy / points.length,
  };
}

export function getTileSnapAnchorForRotation(tile, rotationDeg, ctx) {
  if (!ctx.isEntranceTile(tile)) return { x: 0, y: 0 };
  const local = getTileGuideLocalCenter(tile, ctx);
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  // The entrance art is visually top-heavy, so its snap anchor shifts vertically with
  // rotation to keep the board alignment feeling centered to the player.
  const entranceAnchorScaleY = 0.32;
  return {
    x: 0,
    y: (local.x * sin + local.y * cos) * entranceAnchorScaleY,
  };
}

export function snapTileCenterToHex(tile, tileCenterX, tileCenterY, ctx) {
  const anchor = getTileSnapAnchorForRotation(tile, tile.rotation || 0, ctx);
  const desiredGuideX = tileCenterX + anchor.x;
  const desiredGuideY = tileCenterY + anchor.y;
  const snappedGuide = ctx.snapBoardPointToHex(desiredGuideX, desiredGuideY);
  const entranceYOffset = ctx.isEntranceTile(tile) ? 12 : 0;
  return {
    x: quantizeSnapCoord(snappedGuide.x - anchor.x, ctx.SNAP_COORD_QUANTUM),
    y: quantizeSnapCoord(snappedGuide.y - anchor.y + entranceYOffset, ctx.SNAP_COORD_QUANTUM),
  };
}

// ── Placement evaluation ────────────────────────────────────────────

export function evaluatePlacementAt(tile, otherTiles, x, y, ctx, options = {}) {
  const oldX = tile.x;
  const oldY = tile.y;
  positionTile(tile, x, y);
  const contact = findBestContact(tile, otherTiles, ctx, options);
  const connectedPortalNeighbors = contact.connectedPortalNeighbors || [];
  const portalConflict = connectedPortalNeighbors.length > 0;
  const overlaps = hasAnyOverlap(tile, otherTiles, ctx);
  positionTile(tile, oldX, oldY);
  return {
    valid: contact.valid && !portalConflict,
    count: contact.count,
    overlaps,
    faceIndices: contact.faceIndices || [],
    touchingFaceIndices: contact.touchingFaceIndices || [],
    portalConflict,
    portalConflictTileIds: connectedPortalNeighbors.map((other) => other.tileId),
  };
}

export function computeBestSnap(
  tile,
  otherTiles,
  targetX,
  targetY,
  ctx,
  maxDelta = ctx.SNAP_SEARCH_RADIUS,
  requireNoOverlap = true,
  options = {},
) {
  let best = null;
  const aDirs = getSideDirections(tile, ctx);
  const evalPlacement = typeof options?.evalFn === "function"
    ? options.evalFn
    : (cx, cy) => evaluatePlacementAt(tile, otherTiles, cx, cy, ctx, options);

  for (const other of otherTiles) {
    const bDirs = getSideDirections(other, ctx);

    for (let i = 0; i < aDirs.length; i += 1) {
      const aDir = aDirs[i];
      for (let j = 0; j < bDirs.length; j += 1) {
        const bDir = bDirs[j];
        const dot = aDir.nx * bDir.nx + aDir.ny * bDir.ny;
        if (dot > ctx.OPPOSITE_NORMAL_THRESHOLD) continue;

        let cx = other.x + bDir.nx * bDir.offset - aDir.nx * aDir.offset;
        let cy = other.y + bDir.ny * bDir.offset - aDir.ny * aDir.offset;
        const vx = cx - other.x;
        const vy = cy - other.y;
        const vLen = Math.hypot(vx, vy);
        if (vLen > 0) {
          cx -= (vx / vLen) * ctx.SNAP_VISUAL_GAP;
          cy -= (vy / vLen) * ctx.SNAP_VISUAL_GAP;
        }
        const delta = Math.hypot(cx - targetX, cy - targetY);

        if (delta > maxDelta) continue;

        const evalResult = evalPlacement(cx, cy);
        if (!evalResult.valid) continue;
        if (requireNoOverlap && evalResult.overlaps) continue;

        if (!best) {
          best = { x: cx, y: cy, count: evalResult.count, delta };
          continue;
        }

        if (delta < best.delta - 0.5 || (Math.abs(delta - best.delta) <= 0.5 && evalResult.count > best.count)) {
          best = { x: cx, y: cy, count: evalResult.count, delta };
        }
      }
    }
  }

  return best;
}

// ── Rotation state ──────────────────────────────────────────────────

export function getPlacedTileRotationState(tile, otherTiles, ctx) {
  const contact = findBestContact(tile, otherTiles, ctx);
  const overlaps = hasAnyOverlap(tile, otherTiles, ctx);
  return {
    valid: contact.valid && !overlaps,
    overlaps,
    count: contact.count,
    faceIndices: contact.faceIndices || [],
    touchingFaceIndices: contact.touchingFaceIndices || [],
    contact,
  };
}

export function getInvalidPlacedTileRotationReason(result) {
  if (result?.overlaps) return "Tiles cannot overlap.";
  return getInvalidContactReason(result?.contact);
}

export function getPlacedTileConnectedNeighbors(tile, otherTiles, ctx) {
  return (Array.isArray(otherTiles) ? otherTiles : []).filter(
    (other) => countSideContacts(tile, other, ctx) > 0,
  );
}

// ── State queries ───────────────────────────────────────────────────

export function getPlacedTiles(ctx) {
  const placed = [];
  for (const tile of ctx.state.tiles.values()) {
    if (tile.placed) placed.push(tile);
  }
  return placed;
}

export function getPlacedTilesExcluding(excludedTile, ctx) {
  const excludedId = excludedTile?.tileId;
  const placed = [];
  for (const tile of ctx.state.tiles.values()) {
    if (!tile.placed || tile.tileId === excludedId) continue;
    placed.push(tile);
  }
  return placed;
}

export function getPlacedRegularTileCount(ctx) {
  if (Number.isInteger(ctx.state.autoBuildPreviewPlacedCount)) {
    return ctx.state.autoBuildPreviewPlacedCount;
  }
  let count = 0;
  for (const tile of ctx.state.tiles.values()) {
    if (tile.placed && !ctx.isEntranceTile(tile)) count += 1;
  }
  return count;
}

// ── Face distance ───────────────────────────────────────────────────

export function getMinFaceDistanceToTiles(tile, otherTiles, ctx) {
  const facesA = getContactFaces(tile, ctx);
  let minDist = Number.POSITIVE_INFINITY;
  for (const other of otherTiles) {
    const facesB = getContactFaces(other, ctx);
    for (const af of facesA) {
      for (const bf of facesB) {
        const d = Math.hypot(af.mx - bf.mx, af.my - bf.my);
        if (d < minDist) minDist = d;
      }
    }
  }
  return Number.isFinite(minDist) ? minDist : 0;
}

export function getCandidateClearanceMetrics(tile, otherTiles, x, y, ctx) {
  const oldX = tile.x;
  const oldY = tile.y;
  positionTile(tile, x, y);

  let minCenterDist = Number.POSITIVE_INFINITY;
  let sumCenterDist = 0;
  for (const other of otherTiles) {
    const d = Math.hypot(x - other.x, y - other.y);
    if (d < minCenterDist) minCenterDist = d;
    sumCenterDist += d;
  }
  const avgCenterDist = otherTiles.length ? sumCenterDist / otherTiles.length : 0;
  const minFaceDist = getMinFaceDistanceToTiles(tile, otherTiles, ctx);

  positionTile(tile, oldX, oldY);
  return { minCenterDist, avgCenterDist, minFaceDist };
}

// ── Invalid drop recovery ───────────────────────────────────────────

export function findBestOpenHex(tile, placedTiles, preferredX, preferredY, ctx, anchorTile = null) {
  const layout = ctx.getBoardHexLayout();
  const start = snapTileCenterToHex(tile, preferredX, preferredY, ctx);
  const directions = [
    { x: layout.dx, y: layout.dy / 2 },
    { x: layout.dx, y: -layout.dy / 2 },
    { x: 0, y: -layout.dy },
    { x: -layout.dx, y: -layout.dy / 2 },
    { x: -layout.dx, y: layout.dy / 2 },
    { x: 0, y: layout.dy },
  ];

  const oldX = tile.x;
  const oldY = tile.y;
  const visited = new Set();
  const queue = [{ x: start.x, y: start.y, depth: 0 }];
  const maxDepth = 12;

  const keyOf = (x, y) => `${Math.round(x * 100) / 100}:${Math.round(y * 100) / 100}`;
  const minCenterDistance = layout.hexHeight * 2.25;
  const minFaceDistance = layout.hexHeight * 1.95;
  const minAnchorCenterDistance = layout.hexHeight * 3.0;
  let bestStrict = null;
  let bestLoose = null;

  while (queue.length) {
    const cur = queue.shift();
    const key = keyOf(cur.x, cur.y);
    if (visited.has(key)) continue;
    visited.add(key);

    const cx = ctx.clamp(cur.x, 0, ctx.boardWidth);
    const cy = ctx.clamp(cur.y, 0, ctx.boardHeight);
    const snapped = snapTileCenterToHex(tile, cx, cy, ctx);

    positionTile(tile, snapped.x, snapped.y);
    const overlaps = hasAnyOverlap(tile, placedTiles, ctx);
    if (!overlaps) {
      const metrics = getCandidateClearanceMetrics(tile, placedTiles, snapped.x, snapped.y, ctx);
      const anchorCenterDistance = anchorTile
        ? Math.hypot(snapped.x - anchorTile.x, snapped.y - anchorTile.y)
        : Number.POSITIVE_INFINITY;
      // Prefer positions that genuinely open space around the bad drop, but keep a looser
      // fallback so the tile can still be parked somewhere readable instead of overlapping.
      const score = metrics.minCenterDist * 2.0 + metrics.avgCenterDist * 0.4 + metrics.minFaceDist * 0.7 - cur.depth * 2.6;

      if (
        metrics.minCenterDist >= minCenterDistance
        && metrics.minFaceDist >= minFaceDistance
        && anchorCenterDistance >= minAnchorCenterDistance
      ) {
        if (cur.depth <= 8) {
          positionTile(tile, oldX, oldY);
          return { x: snapped.x, y: snapped.y };
        }
        if (!bestStrict || score > bestStrict.score) bestStrict = { x: snapped.x, y: snapped.y, score };
      } else if (!bestLoose || score > bestLoose.score) {
        bestLoose = { x: snapped.x, y: snapped.y, score };
      }
    }

    if (cur.depth >= maxDepth) continue;
    for (const dir of directions) {
      queue.push({
        x: cur.x + dir.x,
        y: cur.y + dir.y,
        depth: cur.depth + 1,
      });
    }
  }

  positionTile(tile, oldX, oldY);
  if (bestStrict) return { x: bestStrict.x, y: bestStrict.y };
  if (bestLoose) return { x: bestLoose.x, y: bestLoose.y };
  return start;
}

export function moveAwayFromPlacedTiles(tile, placedTiles, ctx) {
  if (!placedTiles.length) return;

  let wx = 0;
  let wy = 0;
  let wSum = 0;
  for (const other of placedTiles) {
    const d = Math.hypot(tile.x - other.x, tile.y - other.y);
    const w = 1 / Math.max(1, d);
    wx += other.x * w;
    wy += other.y * w;
    wSum += w;
  }
  const denseX = wSum > 0 ? wx / wSum : ctx.boardWidth / 2;
  const denseY = wSum > 0 ? wy / wSum : ctx.boardHeight / 2;
  const anchorTile = getNearestTile(tile.x, tile.y, placedTiles);

  let vx = tile.x - denseX;
  let vy = tile.y - denseY;
  let vLen = Math.hypot(vx, vy);
  if (vLen < 1e-6) {
    vx = tile.x - ctx.boardWidth / 2;
    vy = tile.y - ctx.boardHeight / 2;
    vLen = Math.hypot(vx, vy) || 1;
  }

  const nx = vx / vLen;
  const ny = vy / vLen;
  const push = ctx.INVALID_DROP_PUSH_PX * 1.15;
  const targetX = ctx.clamp(tile.x + nx * push, 0, ctx.boardWidth);
  const targetY = ctx.clamp(tile.y + ny * push, 0, ctx.boardHeight);
  const fallback = snapTileCenterToHex(tile, targetX, targetY, ctx);
  const candidate = findBestOpenHex(tile, placedTiles, fallback.x, fallback.y, ctx, anchorTile);
  positionTile(tile, candidate.x, candidate.y);
}

// ── Rotation ──────────────────────────────────────���─────────────────

export function rotateTile(tile, delta, ctx) {
  if (ctx.state.wallEditMode) {
    ctx.setStatus("Rotation is disabled in Tile Editor.", true);
    return;
  }
  if (ctx.isEntranceTile(tile)) {
    if (tile.rotation !== 0) {
      tile.rotation = 0;
      ctx.updateTileTransform(tile);
      ctx.scheduleBoardHexGridRender();
    }
    ctx.setStatus("Entrance Tile rotation is locked.", true);
    return;
  } else {
    const direction = delta < 0 ? -1 : 1;
    const previousRotation = tile.rotation;
    const otherPlacedTiles = tile.placed ? getPlacedTilesExcluding(tile, ctx) : null;
    const connectedNeighborsBefore = tile.placed
      ? getPlacedTileConnectedNeighbors(tile, otherPlacedTiles, ctx)
      : [];
    tile.rotation = ctx.normalizeAngle(tile.rotation + delta);
    if (tile.placed && otherPlacedTiles) {
      let result = getPlacedTileRotationState(tile, otherPlacedTiles, ctx);
      // If exactly one neighbor was holding the tile in place, keep rotating in the same
      // direction to find the next legal orientation instead of forcing manual trial-and-error.
      if (!result.valid && connectedNeighborsBefore.length === 1) {
        const step = ctx.ROTATION_STEP * direction;
        let attempts = Math.max(1, Math.round(360 / ctx.ROTATION_STEP) - 1);
        while (!result.valid && attempts > 0) {
          tile.rotation = ctx.normalizeAngle(tile.rotation + step);
          result = getPlacedTileRotationState(tile, otherPlacedTiles, ctx);
          attempts -= 1;
        }
      }
      ctx.updateTileTransform(tile);
      applyPlacementFeedbackFromResult(tile, result, ctx);
      if (!result.valid) {
        tile.rotation = ctx.normalizeAngle(tile.rotation);
        ctx.setStatus(
          connectedNeighborsBefore.length >= 2
            ? `Rotation made ${ctx.getTileDisplayLabel(tile.tileId)} invalid. ${getInvalidPlacedTileRotationReason(result)} Fix this tile manually.`
            : `Rotation broke placement for ${ctx.getTileDisplayLabel(tile.tileId)}. ${getInvalidPlacedTileRotationReason(result)}`,
          true,
        );
        return;
      }
      const autoAdvanced = tile.rotation !== ctx.normalizeAngle(previousRotation + delta);
      ctx.setStatus(
        autoAdvanced
          ? `${ctx.getTileDisplayLabel(tile.tileId)} auto-rotated to ${tile.rotation}° to keep a valid placement. Contact points: ${result.count}.`
          : `${ctx.getTileDisplayLabel(tile.tileId)} rotated to ${tile.rotation}°. Contact points: ${result.count}.`,
      );
      return;
    }
  }
  ctx.updateTileTransform(tile);
  if (ctx.isEntranceTile(tile)) {
    ctx.scheduleBoardHexGridRender();
  }
}

// ── Invalid drop handling ───────────────────────────────────────────

export function handleInvalidDrop(tile, placedTiles, ctx, message = null, force = false) {
  if (ctx.state.ignoreContactRule && !force) {
    clearInvalidReturnTimer(tile);
    setPlacementFeedback(tile, null);
    ctx.updatePlacedProgress();
    return;
  }
  clearInvalidReturnTimer(tile);
  tile.placed = false;
  ctx.syncRegularTileActivityFromSlotOrder();
  moveAwayFromPlacedTiles(tile, placedTiles, ctx);
  ctx.updateTileParent(tile, ctx.board);
  ctx.updateTileTransform(tile);
  ctx.selectTile(null);
  setPlacementFeedback(tile, false);
  ctx.setStatus(
    message ?? "Invalid placement: this tile needs at least 2 connected faces total (4 points). Returning to tray in 10s.",
    true,
  );

  tile.invalidReturnTimer = setTimeout(() => {
    tile.invalidReturnTimer = null;
    if (tile.placed) return;
    tile.rotation = 0;
    ctx.placeTileInTray(tile);
    ctx.selectTile(null);
    setPlacementFeedback(tile, null);
    ctx.setStatus(`${ctx.getTileDisplayLabel(tile.tileId)} returned to tray after invalid placement.`, true);
    ctx.updatePlacedProgress();
  }, ctx.INVALID_RETURN_DELAY_MS);
}

export function revertToTray(tile, message, ctx, warn = false) {
  clearInvalidReturnTimer(tile);
  tile.rotation = 0;
  ctx.placeTileInTray(tile);
  ctx.selectTile(null);
  setPlacementFeedback(tile, null);
  ctx.setStatus(message, warn);
  ctx.updatePlacedProgress();
}

// ── Drag feedback ───────────────────────────────────────────────────

export function getCachedDragPlacementResult(tile, placedTiles, candidateX, candidateY, ctx) {
  const drag = tile.drag;
  if (!drag?.feedbackCache) {
    return evaluatePlacementAt(tile, placedTiles, candidateX, candidateY, ctx);
  }
  const key = [
    drag.feedbackLayoutKey || "",
    tile.tileId,
    ctx.normalizeAngle(tile.rotation || 0),
    Number(candidateX).toFixed(2),
    Number(candidateY).toFixed(2),
  ].join("|");
  const cached = drag.feedbackCache.get(key);
  if (cached) return cached;
  const result = evaluatePlacementAt(tile, placedTiles, candidateX, candidateY, ctx);
  drag.feedbackCache.set(key, result);
  if (drag.feedbackCache.size > 240) {
    drag.feedbackCache.clear();
    drag.feedbackCache.set(key, result);
  }
  return result;
}

export function updatePlacementFeedback(tile, ctx) {
  if (ctx.isEntranceTile(tile)) {
    setPlacementFeedback(tile, null);
    return;
  }

  const drag = tile.drag;
  if (!drag?.feedbackInsideBoard) {
    setPlacementFeedback(tile, null);
    return;
  }

  const placedTiles = drag.placedTilesExcludingSelf || getPlacedTilesExcluding(tile, ctx);
  if (placedTiles.length === 0) {
    setPlacementFeedback(tile, null);
    return;
  }

  const candidateX = drag.feedbackCandidateX;
  const candidateY = drag.feedbackCandidateY;
  if (!Number.isFinite(candidateX) || !Number.isFinite(candidateY)) {
    setPlacementFeedback(tile, null);
    return;
  }

  const result = getCachedDragPlacementResult(tile, placedTiles, candidateX, candidateY, ctx);
  if (!result.overlaps && result.touchingFaceIndices.length === 0) {
    setPlacementFeedback(tile, null);
    return;
  }
  const validFaceIndices = (result.faceIndices || []).filter((v) => Number.isInteger(v));
  const validSet = new Set(validFaceIndices);
  const invalidFaceIndices = (result.touchingFaceIndices || []).filter(
    (v) => Number.isInteger(v) && !validSet.has(v),
  );
  if (result.valid && !result.overlaps) {
    setPlacementFeedback(tile, true, validFaceIndices, invalidFaceIndices);
    return;
  }
  setPlacementFeedback(tile, false, [], result.touchingFaceIndices || []);
}

export function applyPlacementFeedbackFromResult(tile, result, ctx) {
  if (!result || (!result.overlaps && (result.touchingFaceIndices?.length || 0) === 0)) {
    setPlacementFeedback(tile, null);
    return;
  }
  const { validFaceIndices, invalidFaceIndices } = getPlacementFeedbackFaceIndices(result);
  if (result.valid && !result.overlaps) {
    setPlacementFeedback(tile, true, validFaceIndices, invalidFaceIndices);
    return;
  }
  setPlacementFeedback(tile, false, [], result.touchingFaceIndices || []);
}

export function setPlacementFeedback(tile, isValid, validFaceIndices = [], invalidFaceIndices = []) {
  if (!tile.dom) return;
  tile.dom.classList.remove("valid-placement", "invalid-placement");
  if (isValid === true) tile.dom.classList.add("valid-placement");
  if (isValid === false) tile.dom.classList.add("invalid-placement");
  refreshPlacementGuideDom(tile.guideDom, isValid, validFaceIndices, invalidFaceIndices);
}

export function refreshPlacementGuideDom(guideDom, isValid, validFaceIndices, invalidFaceIndices = []) {
  if (!guideDom) return;
  const lines = guideDom.querySelectorAll(".tile-guide-contact-seg");
  const valid = new Set((validFaceIndices || []).filter((v) => Number.isInteger(v)));
  const invalid = new Set((invalidFaceIndices || []).filter((v) => Number.isInteger(v)));
  lines.forEach((line) => {
    const idx = Number.parseInt(line.dataset.faceIndex || "", 10);
    const hasIdx = Number.isInteger(idx);
    line.classList.toggle("is-contact-valid", hasIdx && valid.has(idx));
    line.classList.toggle("is-contact-invalid", hasIdx && invalid.has(idx));
  });
  guideDom.classList.toggle("contact-valid", false);
  guideDom.classList.toggle("contact-invalid", false);
}
