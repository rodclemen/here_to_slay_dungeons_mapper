import { clamp, shuffle, normalizeAngle } from "./geometry-utils.js";

// ---------------------------------------------------------------------------
// Module-level constants (mirrors app.js definitions — keep in sync if changed)
// ---------------------------------------------------------------------------

const AUTO_BUILD_MAX_ATTEMPTS = 600;
const AUTO_BUILD_LINE_EXTENSION_PENALTY = 28;
const AUTO_BUILD_LOCAL_DENSITY_PENALTY = 16;
const AUTO_BUILD_CANDIDATE_SOFT_LIMIT = 180;
const AUTO_BUILD_CANDIDATE_HARD_LIMIT = 280;
const AUTO_BUILD_HISTORY_LIMIT = 36;

// ---------------------------------------------------------------------------
// Internal key helper
// ---------------------------------------------------------------------------

function getTileInstanceKey(tile) {
  if (!tile) return "";
  if (tile.tileSetId) return `${tile.tileSetId}:${tile.tileId}`;
  return String(tile.tileId || "");
}

// ---------------------------------------------------------------------------
// Search profile
// ---------------------------------------------------------------------------

export function getAutoBuildSearchProfile(tuning) {
  const spread = clamp(Number(tuning.layoutSpread) || 0, 0, 1);
  const branch = clamp(Number(tuning.branchiness) || 0, 0, 1);
  const variety = clamp(Number(tuning.variety) || 0, 0, 1);
  return {
    roundnessWeight: 150 - spread * 72 - branch * 92,
    contactWeight: 22 - spread * 7 - branch * 8,
    minFaceDistWeight: 0.55,
    minCenterDistWeight: 0.5 + spread * 0.2 + branch * 0.12,
    avgCenterDistWeight: 0.22 + spread * 0.14 + branch * 0.08,
    radialPenaltyWeight: Math.max(0.05, 0.35 - spread * 0.24 - branch * 0.08),
    nearCenterPenaltyWeight: 1.15 + spread * 0.46 + branch * 0.34,
    farOutPenaltyWeight: Math.max(0.08, 0.7 - spread * 0.42 - branch * 0.08),
    lineExtensionPenalty: AUTO_BUILD_LINE_EXTENSION_PENALTY * (1 - spread * 0.58) * (1 - branch * 0.2),
    localDensityPenalty: AUTO_BUILD_LOCAL_DENSITY_PENALTY * (1 + branch * 0.95 + spread * 0.24),
    topBucketSize: 4 + Math.round(variety * 4),
    topBucketScoreDelta: 10 + variety * 18 + spread * 4 + branch * 4,
    localDensityRadiusMultiplier: 1.6 + branch * 0.12 + spread * 0.08,
    targetRadiusBaseMultiplier: 1.35 + spread * 1.0 + branch * 0.24,
    targetRadiusAvgBonusMultiplier: 0.7 + spread * 0.72 + branch * 0.18,
    targetMinRadiusMultiplier: clamp(0.6 + spread * 0.1 + branch * 0.08, 0.18, 1.5),
    targetMaxRadiusMultiplier: 1.5 + spread * 0.9 + branch * 0.22,
    targetCompletedLayouts: 4 + Math.round(variety * 4) + Math.round(spread * 1.5) + Math.round(branch * 1.5),
    minCompletedLayouts: 2 + Math.round(variety * 1.5),
    finalChoicePoolSize: 1 + Math.round(variety * 3),
    completionTimeBudgetMs: 120 + Math.round(variety * 90) + Math.round(spread * 35) + Math.round(branch * 35),
    maxCompletionAttempts: 90 + Math.round(variety * 70) + Math.round(spread * 20) + Math.round(branch * 20),
    recentShapePenalty: 0.4,
  };
}

// ---------------------------------------------------------------------------
// Candidate state capture / apply
// ---------------------------------------------------------------------------

export function captureAutoBuildCandidateState(tiles, ctx) {
  return tiles.map((tile) => ({
    tileSetId: tile.tileSetId || ctx.state.selectedTileSetId,
    tileId: tile.tileId,
    x: tile.x,
    y: tile.y,
    rotation: tile.rotation,
  }));
}

export function applyAutoBuildCandidateState(tiles, snapshot, ctx) {
  const byId = new Map((snapshot || []).map((entry) => [getTileInstanceKey(entry), entry]));
  for (const tile of tiles) {
    const saved = byId.get(getTileInstanceKey(tile));
    if (!saved) continue;
    tile.rotation = saved.rotation;
    tile.placed = true;
    ctx.positionTile(tile, saved.x, saved.y);
  }
}

// ---------------------------------------------------------------------------
// Layout analysis and scoring
// ---------------------------------------------------------------------------

export function analyzeAutoBuildCompletedLayout(regularTiles, entranceTile, ctx) {
  const tiles = Array.isArray(regularTiles) ? regularTiles.filter(Boolean) : [];
  const allTiles = entranceTile ? [entranceTile, ...tiles] : [...tiles];
  if (!allTiles.length) {
    return {
      spreadMetric: 0,
      branchMetric: 0,
      compactnessMetric: 1,
      corridorMetric: 0,
      clusterMetric: 0,
      hubinessMetric: 0,
      leafinessMetric: 0,
    };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let centroidX = 0;
  let centroidY = 0;
  for (const tile of allTiles) {
    minX = Math.min(minX, tile.x);
    minY = Math.min(minY, tile.y);
    maxX = Math.max(maxX, tile.x);
    maxY = Math.max(maxY, tile.y);
    centroidX += tile.x;
    centroidY += tile.y;
  }
  centroidX /= allTiles.length;
  centroidY /= allTiles.length;

  let avgRadius = 0;
  let maxRadius = 0;
  for (const tile of allTiles) {
    const radius = Math.hypot(tile.x - centroidX, tile.y - centroidY);
    avgRadius += radius;
    if (radius > maxRadius) maxRadius = radius;
  }
  avgRadius = allTiles.length ? avgRadius / allTiles.length : 0;

  let diameter = 0;
  for (let i = 0; i < allTiles.length; i += 1) {
    for (let j = i + 1; j < allTiles.length; j += 1) {
      diameter = Math.max(diameter, Math.hypot(allTiles[i].x - allTiles[j].x, allTiles[i].y - allTiles[j].y));
    }
  }

  const degrees = [];
  const contactFaceTotals = [];
  for (const tile of allTiles) {
    let degree = 0;
    let contactFaces = 0;
    for (const other of allTiles) {
      if (other === tile) continue;
      const contactCount = ctx.countSideContacts(tile, other);
      if (contactCount > 0) {
        degree += 1;
        contactFaces += contactCount;
      }
    }
    degrees.push(degree);
    contactFaceTotals.push(contactFaces);
  }
  const leafCount = degrees.filter((degree) => degree === 1).length;
  const junctionCount = degrees.filter((degree) => degree >= 3).length;
  const denseTileCount = contactFaceTotals.filter((count) => count >= 4).length;
  const crowdedHubCount = contactFaceTotals.filter((count, idx) => count >= 4 && degrees[idx] >= 3).length;
  const averageContactFaces = contactFaceTotals.reduce((sum, count) => sum + count, 0) / Math.max(contactFaceTotals.length, 1);
  const maxDegree = degrees.length ? Math.max(...degrees) : 0;
  const dominantHubDegreeThreshold = Math.max(3, allTiles.length - 3);
  const dominantHubDegreeMetric = clamp((maxDegree - dominantHubDegreeThreshold + 1) / 3, 0, 1);
  const starLeafMetric = clamp((leafCount - 3) / 3, 0, 1);
  const dominantHubMetric = clamp(
    dominantHubDegreeMetric * 0.72 + starLeafMetric * 0.52 + (crowdedHubCount > 0 ? 0.18 : 0),
    0,
    1,
  );
  const fullStarHubMetric = allTiles.length >= 4 && maxDegree >= allTiles.length - 1 ? 1 : 0;

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const aspectRatio = Math.max(width, height) / Math.max(1, Math.min(width, height));
  const boardHexLayout = ctx.getBoardHexLayout();
  const spacingUnit = Math.max(boardHexLayout.dx, 1);
  const elongationMetric = clamp((aspectRatio - 1) / 2.6, 0, 1);
  const avgRadiusMetric = clamp(avgRadius / (spacingUnit * 2.45), 0, 1);
  const diameterMetric = clamp(diameter / (spacingUnit * 6.1), 0, 1);
  const extraLeavesMetric = clamp((leafCount - 2) / 4, 0, 1);
  const junctionMetric = clamp(junctionCount / 2, 0, 1);
  const denseTileMetric = clamp(denseTileCount / Math.max(2, allTiles.length * 0.45), 0, 1);
  const crowdedHubMetric = clamp(crowdedHubCount / 2, 0, 1);
  const contactDensityMetric = clamp((averageContactFaces - 2.35) / 1.75, 0, 1);
  const spreadMetric = clamp(avgRadiusMetric * 0.55 + diameterMetric * 0.25 + elongationMetric * 0.35, 0, 1);
  const hubinessMetric = clamp(crowdedHubMetric * 0.72 + denseTileMetric * 0.34 + contactDensityMetric * 0.28, 0, 1);
  const leafinessMetric = clamp(extraLeavesMetric * 0.7 + junctionMetric * 0.2, 0, 1);
  const branchMetric = clamp(junctionMetric * 0.34 + extraLeavesMetric * 0.76 - hubinessMetric * 0.28, 0, 1);
  const compactnessMetric = clamp((Math.min(width, height) / Math.max(width, height)) * 0.7 + (1 - spreadMetric) * 0.3, 0, 1);
  const corridorMetric = clamp(elongationMetric * 0.6 + diameterMetric * 0.25 + Math.max(0, 2 - junctionCount) * 0.12, 0, 1);
  const clusterMetric = clamp(denseTileMetric * 0.56 + crowdedHubMetric * 0.58 + contactDensityMetric * 0.34, 0, 1);

  return {
    width,
    height,
    aspectRatio,
    leafCount,
    junctionCount,
    spreadMetric,
    branchMetric,
    compactnessMetric,
    corridorMetric,
    clusterMetric,
    hubinessMetric,
    leafinessMetric,
    denseTileCount,
    crowdedHubCount,
    averageContactFaces,
    maxDegree,
    dominantHubMetric,
    fullStarHubMetric,
    avgRadius,
    maxRadius,
    diameter,
  };
}

function scoreAutoBuildCompletedLayout(candidate, tuning, searchProfile) {
  // candidate.metrics is always pre-populated by collectCompletedLayouts; the fallback
  // calls analyzeAutoBuildCompletedLayout with empty input which returns early (no ctx needed).
  const metrics = candidate.metrics || analyzeAutoBuildCompletedLayout([], null, null);
  const spreadBias = clamp(tuning.layoutSpread, 0, 1);
  const branchBias = clamp(tuning.branchiness, 0, 1);
  const desiredSpread = 0.2 + spreadBias * 0.72;
  const desiredBranch = 0.1 + branchBias * 0.82;
  const spreadFit = 1 - Math.abs(metrics.spreadMetric - desiredSpread);
  const branchFit = 1 - Math.abs(metrics.branchMetric - desiredBranch);
  const baselineMetric = 0.6 * (1 - metrics.clusterMetric) + 0.25 * metrics.compactnessMetric + 0.15 * (1 - Math.abs(metrics.spreadMetric - 0.42));
  const corridorBonus = spreadBias * metrics.corridorMetric * 0.9;
  const branchBonus = branchBias * (metrics.branchMetric * 0.55 + metrics.leafinessMetric * 0.32);
  const clusterPenalty = metrics.clusterMetric * (0.85 + spreadBias * 0.55 + branchBias * 0.95);
  const hubPenalty = metrics.hubinessMetric * (0.35 + branchBias * 0.9);
  const dominantHubPenalty = metrics.dominantHubMetric * (1.7 + spreadBias * 0.65 + (1 - branchBias) * 0.95);
  const fullStarHubPenalty = metrics.fullStarHubMetric * (1.9 + spreadBias * 0.35 + branchBias * 0.55);
  const noveltyPenalty = candidate.isRecentShape ? searchProfile.recentShapePenalty : 0;
  return (
    spreadFit * 2.55
    + branchFit * 2.3
    + baselineMetric * 1.15
    + corridorBonus
    + branchBonus
    - clusterPenalty
    - hubPenalty
    - dominantHubPenalty
    - fullStarHubPenalty
    - noveltyPenalty
  );
}

export function chooseAutoBuildCompletedLayout(candidates, tuning) {
  if (!Array.isArray(candidates) || !candidates.length) return null;
  const searchProfile = getAutoBuildSearchProfile(tuning);
  const ranked = candidates
    .map((candidate) => ({
      ...candidate,
      finalScore: scoreAutoBuildCompletedLayout(candidate, tuning, searchProfile),
    }))
    .sort((a, b) => (
      (b.finalScore - a.finalScore)
      || ((b.placementScoreTotal || 0) - (a.placementScoreTotal || 0))
      || (a.isRecentShape - b.isRecentShape)
    ));
  if (ranked.length === 1 || searchProfile.finalChoicePoolSize <= 1) {
    return ranked[0];
  }
  const bestScore = ranked[0].finalScore;
  const eligible = ranked.filter((candidate, idx) => (
    idx < searchProfile.finalChoicePoolSize
    || candidate.finalScore >= bestScore - (0.16 + clamp(tuning.variety, 0, 1) * 0.45)
  ));
  const choicePool = eligible.slice(0, Math.max(1, searchProfile.finalChoicePoolSize));
  return choicePool[Math.floor(Math.random() * choicePool.length)];
}

// ---------------------------------------------------------------------------
// History management
// ---------------------------------------------------------------------------

export function getAutoBuildHistoryKey(activeRegularTiles, ctx) {
  const ids = (activeRegularTiles || [])
    .map((tile) => getTileInstanceKey(tile))
    .sort();
  return `set:${ctx.state.selectedTileSetId}|${ids.join(",")}`;
}

export function getAutoBuildHistoryForKey(key, ctx) {
  const arr = ctx.state.autoBuildHistoryBySet?.[key];
  return Array.isArray(arr) ? arr : [];
}

export function pushAutoBuildHistory(key, signature, ctx) {
  if (!key || !signature) return;
  if (!ctx.state.autoBuildHistoryBySet[key]) ctx.state.autoBuildHistoryBySet[key] = [];
  const list = ctx.state.autoBuildHistoryBySet[key];
  const existingIdx = list.indexOf(signature);
  if (existingIdx >= 0) list.splice(existingIdx, 1);
  list.push(signature);
  if (list.length > AUTO_BUILD_HISTORY_LIMIT) {
    list.splice(0, list.length - AUTO_BUILD_HISTORY_LIMIT);
  }
}

export function getAutoBuildLayoutSignature(regularTiles, entranceTile, ctx) {
  const tiles = Array.isArray(regularTiles) ? regularTiles : [];
  if (!tiles.length) return "";

  const round = (n) => Math.round(n * 10) / 10;
  const allTiles = entranceTile ? [entranceTile, ...tiles] : [...tiles];
  const pairwiseDistances = [];
  for (let i = 0; i < tiles.length; i += 1) {
    for (let j = i + 1; j < tiles.length; j += 1) {
      pairwiseDistances.push(round(Math.hypot(tiles[i].x - tiles[j].x, tiles[i].y - tiles[j].y)));
    }
  }
  pairwiseDistances.sort((a, b) => a - b);

  const entranceDistances = entranceTile
    ? tiles
      .map((tile) => round(Math.hypot(tile.x - entranceTile.x, tile.y - entranceTile.y)))
      .sort((a, b) => a - b)
    : [];

  const degreeByTile = [];
  for (const tile of tiles) {
    let degree = 0;
    for (const other of allTiles) {
      if (other === tile) continue;
      if (ctx.countSideContacts(tile, other) > 0) degree += 1;
    }
    degreeByTile.push(degree);
  }
  degreeByTile.sort((a, b) => a - b);

  return [
    `pd:${pairwiseDistances.join(".")}`,
    `ed:${entranceDistances.join(".")}`,
    `deg:${degreeByTile.join(".")}`,
  ].join("|");
}

// ---------------------------------------------------------------------------
// Tile record loading (used by preview / share flows)
// ---------------------------------------------------------------------------

export async function loadAutoBuildTileRecord(def, ctx) {
  const img = await ctx.loadImage(def.imageSrc);
  const shape = ctx.getOpaqueBounds(img);
  const alphaMask = ctx.getAlphaMask(img);
  const faceGeometry = ctx.getFaceGeometry(img, ctx.SIDES);
  return {
    ...def,
    img,
    x: 0,
    y: 0,
    rotation: 0,
    placed: false,
    previewOnly: true,
    dom: null,
    bodyDom: null,
    traySlot: null,
    drag: null,
    invalidReturnTimer: null,
    shape,
    alphaMask,
    faceGeometry,
    sideLength: faceGeometry.avgSideLength,
    apothem: faceGeometry.avgOffset,
    wallFaceSet: new Set(ctx.getStoredWallFaces(def.tileSetId, def.tileId)),
    allowAsEndTile: ctx.getStoredAllowAsEndTile(def.tileSetId, def.tileId),
    portalFlag: ctx.getStoredPortalFlag(def.tileSetId, def.tileId),
  };
}

// ---------------------------------------------------------------------------
// Preview rendering
// ---------------------------------------------------------------------------

export function renderAutoBuildPreview(entranceTile, regularTiles, ctx) {
  ctx.clearBoard({ preserveEntranceFadeAnchor: true });

  const entranceEl = ctx.createTileElement(entranceTile);
  entranceTile.dom = entranceEl;
  entranceTile.placed = true;
  ctx.positionTile(entranceTile, entranceTile.x, entranceTile.y);
  ctx.updateTileParent(entranceTile, ctx.board);
  ctx.updateTileTransform(entranceTile);
  ctx.setEntranceFadeAnchorFromTile(entranceTile);
  ctx.placeReferenceAboveStart(entranceTile);
  ctx.centerBoardViewOnEntranceX();
  ctx.scheduleBoardHexGridRender();

  for (const tile of regularTiles) {
    const tileEl = ctx.createTileElement(tile);
    tile.dom = tileEl;
    tile.placed = true;
    ctx.positionTile(tile, tile.x, tile.y);
    ctx.updateTileParent(tile, ctx.board);
    ctx.updateTileTransform(tile);
  }

  ctx.selectTile(null);
  ctx.state.autoBuildPreviewPlacedCount = regularTiles.length;
  ctx.updatePlacedProgress();
}

// ---------------------------------------------------------------------------
// Main auto-build function
// ---------------------------------------------------------------------------

export async function autoBuildSelectedTiles(options = {}, ctx) {
  const showStatus = options.showStatus !== false;
  const spawnBoss = options.spawnBoss !== false;

  if (ctx.state.wallEditMode) {
    if (showStatus) ctx.setStatus("Auto Build is unavailable in Tile Editor.", true);
    return { built: false, reason: "wall_edit_mode" };
  }

  const tuning = options.tuning || ctx.autoBuildDevTuning;
  const searchProfile = getAutoBuildSearchProfile(tuning);
  const softCandidateLimit = AUTO_BUILD_CANDIDATE_SOFT_LIMIT;

  const allRegularTiles = Array.from(ctx.state.tiles.values()).filter((tile) => !ctx.isEntranceTile(tile));
  if (allRegularTiles.length < 6) {
    if (showStatus) ctx.setStatus("Not enough tiles available for auto build.", true);
    return { built: false, reason: "not_enough_tiles" };
  }

  const selectedAutoBuildIds = new Set(
    shuffle(allRegularTiles.map((tile) => tile.tileId)).slice(0, 6),
  );
  const remainingAutoBuildIds = shuffle(
    allRegularTiles
      .map((tile) => tile.tileId)
      .filter((tileId) => !selectedAutoBuildIds.has(tileId)),
  );
  ctx.setRegularTileOrder(
    [...selectedAutoBuildIds, ...remainingAutoBuildIds],
    ctx.state.selectedTileSetId,
  );
  for (const tile of allRegularTiles) {
    ctx.clearInvalidReturnTimer(tile);
    tile.placed = false;
    tile.rotation = 0;
  }
  ctx.syncRegularTileActivityFromSlotOrder(ctx.state.selectedTileSetId);
  ctx.clearBoard({ preserveEntranceFadeAnchor: true });
  ctx.renderActiveTiles();
  ctx.placeStartTileAtCenter();
  ctx.updatePlacedProgress();

  const entrance = ctx.state.tiles.get(ctx.ENTRANCE_TILE_ID);
  if (!entrance) {
    if (showStatus) ctx.setStatus("Entrance tile is unavailable.", true);
    return { built: false, reason: "missing_entrance" };
  }
  if (!entrance.placed) {
    ctx.placeStartTileAtCenter();
  }

  const activeRegularTiles = ctx.getRegularTileOrder(ctx.state.selectedTileSetId)
    .slice(0, ctx.TRAY_SLOT_COUNT)
    .map((tileId) => ctx.state.tiles.get(tileId))
    .filter(Boolean);
  if (!activeRegularTiles.length) {
    if (showStatus) ctx.setStatus("No selected tiles available for auto build.", true);
    return { built: false, reason: "no_selected_tiles" };
  }

  const originalTileState = new Map(
    activeRegularTiles.map((tile) => [
      tile.tileId,
      {
        x: tile.x,
        y: tile.y,
        rotation: tile.rotation,
        placed: tile.placed,
      },
    ]),
  );
  const autoBuildHistoryKey = getAutoBuildHistoryKey(activeRegularTiles, ctx);
  const recentShapeHistory = getAutoBuildHistoryForKey(autoBuildHistoryKey, ctx);

  const restoreOriginalState = () => {
    for (const tile of activeRegularTiles) {
      const snapshot = originalTileState.get(tile.tileId);
      if (!snapshot) continue;
      tile.rotation = snapshot.rotation;
      tile.placed = snapshot.placed;
      ctx.positionTile(tile, snapshot.x, snapshot.y);
      ctx.updateTileParent(tile, snapshot.placed ? ctx.board : tile.traySlot);
      ctx.updateTileTransform(tile);
      ctx.setPlacementFeedback(tile, null);
    }
    ctx.selectTile(null);
    ctx.updatePlacedProgress();
  };

  const placementEvalCache = new Map();

  const roundForCache = (value) => Math.round(value * 10) / 10;
  const buildPlacedSignature = (tiles) => tiles
    .map((t) => `${t.tileId}@${t.rotation}:${roundForCache(t.x)},${roundForCache(t.y)}`)
    .sort()
    .join("|");

  const evaluatePlacementAtCached = (
    tile,
    placedTiles,
    x,
    y,
    evalOptions,
    placedSignature,
  ) => {
    const enforceEnd = evalOptions?.enforceEndTileRule ? 1 : 0;
    const enforcePortal = evalOptions?.enforcePortalSpacing ? 1 : 0;
    // Auto-build evaluates the same tile/rotation/position combinations repeatedly while
    // scoring candidates, so memoize by placed-layout signature plus rule toggles.
    const key = `${placedSignature}|${tile.tileId}|${tile.rotation}|${roundForCache(x)},${roundForCache(y)}|e:${enforceEnd}|p:${enforcePortal}`;
    const cached = placementEvalCache.get(key);
    if (cached) return cached;
    const result = ctx.evaluatePlacementAt(tile, placedTiles, x, y, evalOptions);
    placementEvalCache.set(key, result);
    return result;
  };

  const getRotationOptions = () => shuffle(
    Array.from({ length: 360 / ctx.ROTATION_STEP }, (_, idx) => idx * ctx.ROTATION_STEP),
  );

  const getPlacementCandidates = (tile, placedTiles, placedSignature, candidateOptions = {}) => {
    const placementOptions = {
      enforceEndTileRule: true,
      enforcePortalSpacing: Boolean(candidateOptions.enforcePortalSpacing),
    };
    const candidates = [];
    const seen = new Set();
    const anchors = shuffle([...placedTiles]);
    // Default Mode keeps generated layouts below the entrance by rejecting snapped candidates
    // above the entrance anchor instead of trying to "fix" them later in scoring.
    const halfBoardMinY = ctx.state.halfBoardBuild ? (entrance?.y ?? 0) : -Infinity;
    const registerCandidate = (x, y) => {
      if (candidates.length >= AUTO_BUILD_CANDIDATE_HARD_LIMIT) return;
      const snapped = ctx.snapTileCenterToHex(tile, x, y);
      const candidateX = clamp(snapped.x, 0, ctx.board.clientWidth);
      const candidateY = clamp(snapped.y, 0, ctx.board.clientHeight);
      if (candidateY < halfBoardMinY) return;
      const key = `${candidateX.toFixed(2)}:${candidateY.toFixed(2)}`;
      if (seen.has(key)) return;
      seen.add(key);
      const placement = evaluatePlacementAtCached(
        tile,
        placedTiles,
        candidateX,
        candidateY,
        placementOptions,
        placedSignature,
      );
      if (!placement.valid || placement.overlaps) return;
      candidates.push({
        x: candidateX,
        y: candidateY,
        count: placement.count,
      });
    };

    // Primary pass: derive candidate targets from face pairing, then let computeBestSnap
    // search nearby valid placements using existing snap/contact logic.
    const tileDirs = ctx.getSideDirections(tile);
    const tileDirOrder = shuffle(Array.from({ length: tileDirs.length }, (_, idx) => idx));
    primaryCandidateLoop:
    for (const anchorTile of anchors) {
      const anchorDirs = ctx.getSideDirections(anchorTile);
      const anchorDirOrder = shuffle(Array.from({ length: anchorDirs.length }, (_, idx) => idx));
      for (const tileDirIdx of tileDirOrder) {
        if (candidates.length >= AUTO_BUILD_CANDIDATE_HARD_LIMIT) break primaryCandidateLoop;
        const aDir = tileDirs[tileDirIdx];
        for (const anchorDirIdx of anchorDirOrder) {
          if (candidates.length >= AUTO_BUILD_CANDIDATE_HARD_LIMIT) break primaryCandidateLoop;
          const bDir = anchorDirs[anchorDirIdx];
          const dot = aDir.nx * bDir.nx + aDir.ny * bDir.ny;
          if (dot > ctx.OPPOSITE_NORMAL_THRESHOLD) continue;
          const rawX = anchorTile.x + bDir.nx * bDir.offset - aDir.nx * aDir.offset;
          const rawY = anchorTile.y + bDir.ny * bDir.offset - aDir.ny * aDir.offset;
          const snapped = ctx.computeBestSnap(
            tile,
            placedTiles,
            rawX,
            rawY,
            Math.max(ctx.SNAP_SEARCH_RADIUS * 8, 224),
            true,
            {
              ...placementOptions,
              evalFn: (cx, cy) => evaluatePlacementAtCached(
                tile,
                placedTiles,
                cx,
                cy,
                placementOptions,
                placedSignature,
              ),
            },
          );
          if (snapped) registerCandidate(snapped.x, snapped.y);
          registerCandidate(rawX, rawY);
        }
      }
    }

    // Fallback pass: sample nearby hex rings around already placed tiles.
    const layout = ctx.getBoardHexLayout();
    if (candidates.length < softCandidateLimit) {
      const ringDirs = [
        { x: layout.dx, y: layout.dy / 2 },
        { x: layout.dx, y: -layout.dy / 2 },
        { x: 0, y: -layout.dy },
        { x: -layout.dx, y: -layout.dy / 2 },
        { x: -layout.dx, y: layout.dy / 2 },
        { x: 0, y: layout.dy },
      ];
      const maxRingDepth = 7;
      ringCandidateLoop:
      for (const anchorTile of anchors) {
        for (let depth = 1; depth <= maxRingDepth; depth += 1) {
          if (candidates.length >= softCandidateLimit) break ringCandidateLoop;
          for (let dirIdx = 0; dirIdx < ringDirs.length; dirIdx += 1) {
            const dir = ringDirs[dirIdx];
            const next = ringDirs[(dirIdx + 1) % ringDirs.length];
            registerCandidate(anchorTile.x + dir.x * depth, anchorTile.y + dir.y * depth);
            for (let t = 1; t < depth; t += 1) {
              registerCandidate(
                anchorTile.x + dir.x * (depth - t) + next.x * t,
                anchorTile.y + dir.y * (depth - t) + next.y * t,
              );
            }
          }
        }
      }
    }

    // Last-resort fallback: broad randomized probing near board center.
    if (!candidates.length) {
      const cx = ctx.board.clientWidth / 2;
      const cy = ctx.board.clientHeight / 2;
      for (let i = 0; i < 120; i += 1) {
        const rx = cx + (Math.random() - 0.5) * ctx.board.clientWidth * 0.95;
        const ry = cy + (Math.random() - 0.5) * ctx.board.clientHeight * 0.95;
        registerCandidate(rx, ry);
      }
    }

    const rankedCandidates = shuffle(candidates).slice(0, AUTO_BUILD_CANDIDATE_SOFT_LIMIT);
    if (!rankedCandidates.length) return rankedCandidates;

    let centroidX = 0;
    let centroidY = 0;
    let minPlacedX = Number.POSITIVE_INFINITY;
    let maxPlacedX = Number.NEGATIVE_INFINITY;
    let minPlacedY = Number.POSITIVE_INFINITY;
    let maxPlacedY = Number.NEGATIVE_INFINITY;
    for (const placed of placedTiles) {
      centroidX += placed.x;
      centroidY += placed.y;
      if (placed.x < minPlacedX) minPlacedX = placed.x;
      if (placed.x > maxPlacedX) maxPlacedX = placed.x;
      if (placed.y < minPlacedY) minPlacedY = placed.y;
      if (placed.y > maxPlacedY) maxPlacedY = placed.y;
    }
    centroidX /= placedTiles.length;
    centroidY /= placedTiles.length;

    let avgPlacedRadius = 0;
    for (const placed of placedTiles) {
      avgPlacedRadius += Math.hypot(placed.x - centroidX, placed.y - centroidY);
    }
    avgPlacedRadius = placedTiles.length ? (avgPlacedRadius / placedTiles.length) : 0;
    const targetRadius = Math.max(
      layout.dx * searchProfile.targetRadiusBaseMultiplier,
      avgPlacedRadius + layout.dx * searchProfile.targetRadiusAvgBonusMultiplier,
    );
    const targetMinRadius = Math.max(layout.dx * 0.95, targetRadius * searchProfile.targetMinRadiusMultiplier);
    const targetMaxRadius = targetRadius * searchProfile.targetMaxRadiusMultiplier;

    const getRecentHeading = () => {
      if (placedTiles.length < 3) return null;
      const prev = placedTiles[placedTiles.length - 1];
      const prevPrev = placedTiles[placedTiles.length - 2];
      if (!prev || !prevPrev) return null;
      const vx = prev.x - prevPrev.x;
      const vy = prev.y - prevPrev.y;
      const len = Math.hypot(vx, vy);
      if (len < 1e-6) return null;
      return { x: vx / len, y: vy / len };
    };
    const recentHeading = getRecentHeading();
    const localDensityRadius = layout.dx * searchProfile.localDensityRadiusMultiplier;

    for (const candidate of rankedCandidates) {
      const clearance = ctx.getCandidateClearanceMetrics(tile, placedTiles, candidate.x, candidate.y);
      const distFromClusterCenter = Math.hypot(candidate.x - centroidX, candidate.y - centroidY);
      const nextMinX = Math.min(minPlacedX, candidate.x);
      const nextMaxX = Math.max(maxPlacedX, candidate.x);
      const nextMinY = Math.min(minPlacedY, candidate.y);
      const nextMaxY = Math.max(maxPlacedY, candidate.y);
      const width = Math.max(1, nextMaxX - nextMinX);
      const height = Math.max(1, nextMaxY - nextMinY);
      const roundness = Math.min(width, height) / Math.max(width, height);
      const radialPenalty = Math.abs(distFromClusterCenter - targetRadius);
      const nearCenterPenalty = Math.max(0, targetMinRadius - distFromClusterCenter);
      const farOutPenalty = Math.max(0, distFromClusterCenter - targetMaxRadius);
      let lineExtensionPenalty = 0;
      if (recentHeading && placedTiles.length >= 2) {
        const lastPlaced = placedTiles[placedTiles.length - 1];
        const dx = candidate.x - lastPlaced.x;
        const dy = candidate.y - lastPlaced.y;
        const dLen = Math.hypot(dx, dy);
        if (dLen > 1e-6) {
          const dirX = dx / dLen;
          const dirY = dy / dLen;
          const dot = dirX * recentHeading.x + dirY * recentHeading.y;
          if (dot > 0.86) {
            lineExtensionPenalty = (dot - 0.86) / (1 - 0.86) * searchProfile.lineExtensionPenalty;
          }
        }
      }
      let localNeighborCount = 0;
      for (const placed of placedTiles) {
        const d = Math.hypot(candidate.x - placed.x, candidate.y - placed.y);
        if (d <= localDensityRadius) localNeighborCount += 1;
      }
      const localDensityPenalty = Math.max(0, localNeighborCount - 2) * searchProfile.localDensityPenalty;

      candidate.layoutScore =
        roundness * searchProfile.roundnessWeight
        + candidate.count * searchProfile.contactWeight
        + clearance.minFaceDist * searchProfile.minFaceDistWeight
        + clearance.minCenterDist * searchProfile.minCenterDistWeight
        + clearance.avgCenterDist * searchProfile.avgCenterDistWeight
        - radialPenalty * searchProfile.radialPenaltyWeight
        - nearCenterPenalty * searchProfile.nearCenterPenaltyWeight
        - farOutPenalty * searchProfile.farOutPenaltyWeight
        - lineExtensionPenalty
        - localDensityPenalty;
    }

    rankedCandidates.sort(
      (a, b) => (b.layoutScore - a.layoutScore) || (b.count - a.count),
    );
    return rankedCandidates;
  };

  const tryBuildLayout = (buildOptions = {}) => {
    placementEvalCache.clear();
    for (const tile of activeRegularTiles) {
      ctx.clearInvalidReturnTimer(tile);
      tile.placed = false;
    }

    const tileOrder = shuffle([...activeRegularTiles]);
    const placedTiles = [entrance];

    const placeAtIndex = (index, placementScoreTotal) => {
      if (index >= tileOrder.length) return { placementScoreTotal };
      const tile = tileOrder[index];
      const prevX = tile.x;
      const prevY = tile.y;
      const prevRotation = tile.rotation;
      const prevPlaced = tile.placed;
      const placedSignature = buildPlacedSignature(placedTiles);

      for (const rotation of getRotationOptions()) {
        tile.rotation = normalizeAngle(rotation);
        const candidates = getPlacementCandidates(tile, placedTiles, placedSignature, buildOptions);
        if (!candidates.length) continue;

        const bestScore = candidates[0].layoutScore;
        const scoreFloor = bestScore - searchProfile.topBucketScoreDelta;
        const topBucket = [];
        const remainder = [];
        for (let i = 0; i < candidates.length; i += 1) {
          const candidate = candidates[i];
          if (i < searchProfile.topBucketSize || candidate.layoutScore >= scoreFloor) {
            topBucket.push(candidate);
          } else {
            remainder.push(candidate);
          }
        }
        const orderedCandidates = [...shuffle(topBucket), ...remainder];

        for (const candidate of orderedCandidates) {
          ctx.positionTile(tile, candidate.x, candidate.y);
          tile.placed = true;
          placedTiles.push(tile);
          const result = placeAtIndex(index + 1, placementScoreTotal + candidate.layoutScore);
          if (result) return result;
          placedTiles.pop();
          tile.placed = false;
        }
      }

      tile.rotation = prevRotation;
      tile.placed = prevPlaced;
      ctx.positionTile(tile, prevX, prevY);
      return null;
    };

    return placeAtIndex(0, 0);
  };

  const collectCompletedLayouts = (collectOptions = {}) => {
    const completedLayouts = [];
    const seenCompletedSignatures = new Set();
    const searchDeadline = performance.now() + searchProfile.completionTimeBudgetMs;
    const maxCompletionAttempts = Math.min(AUTO_BUILD_MAX_ATTEMPTS, searchProfile.maxCompletionAttempts);
    for (let attempt = 0; attempt < maxCompletionAttempts; attempt += 1) {
      const buildResult = tryBuildLayout(collectOptions);
      if (buildResult) {
        const signature = getAutoBuildLayoutSignature(activeRegularTiles, entrance, ctx);
        if (seenCompletedSignatures.has(signature)) continue;
        seenCompletedSignatures.add(signature);
        completedLayouts.push({
          signature,
          isRecentShape: recentShapeHistory.includes(signature),
          placementScoreTotal: buildResult.placementScoreTotal,
          metrics: analyzeAutoBuildCompletedLayout(activeRegularTiles, entrance, ctx),
          tileState: captureAutoBuildCandidateState(activeRegularTiles, ctx),
        });
        if (completedLayouts.length >= searchProfile.targetCompletedLayouts) break;
        if (
          completedLayouts.length >= searchProfile.minCompletedLayouts
          && performance.now() >= searchDeadline
        ) {
          break;
        }
      }
      if (
        completedLayouts.length >= searchProfile.minCompletedLayouts
        && performance.now() >= searchDeadline
      ) {
        break;
      }
    }
    return completedLayouts;
  };

  const hasPortalTiles = activeRegularTiles.some((tile) => ctx.hasPortalFlag(tile));
  const shouldEnforcePortalSpacing = hasPortalTiles && !ctx.state.ignorePortalPosition;
  let portalSpacingRelaxed = false;
  let completedLayouts = collectCompletedLayouts({ enforcePortalSpacing: shouldEnforcePortalSpacing });
  let chosenLayout = chooseAutoBuildCompletedLayout(completedLayouts, tuning);
  if (!chosenLayout && shouldEnforcePortalSpacing) {
    completedLayouts = collectCompletedLayouts({ enforcePortalSpacing: false });
    chosenLayout = chooseAutoBuildCompletedLayout(completedLayouts, tuning);
    portalSpacingRelaxed = Boolean(chosenLayout);
  }
  if (!chosenLayout) {
    restoreOriginalState();
    if (showStatus) {
      ctx.setStatus("Auto build could not find a valid full layout. Try rerolling tiles and run again.", true);
    }
    return { built: false, reason: "no_valid_layout" };
  }
  const chosenSignature = chosenLayout.signature;
  applyAutoBuildCandidateState(activeRegularTiles, chosenLayout.tileState, ctx);

  for (const tile of activeRegularTiles) {
    ctx.clearInvalidReturnTimer(tile);
    ctx.updateTileParent(tile, ctx.board);
    ctx.updateTileTransform(tile);
    ctx.setPlacementFeedback(tile, null);
  }
  const movedReferenceSide = ctx.ensureReferenceCardVisibleAfterAutoBuild(activeRegularTiles, entrance);

  ctx.selectTile(null);
  ctx.updatePlacedProgress();
  if (chosenSignature) {
    pushAutoBuildHistory(autoBuildHistoryKey, chosenSignature, ctx);
  }
  if (showStatus) {
    const statusParts = ["Auto build complete: selected tiles placed with valid contact rules"];
    if (movedReferenceSide) statusParts.push("Reference card moved to side for visibility");
    if (portalSpacingRelaxed) statusParts.push("Portal spacing was relaxed to finish the layout");
    ctx.setStatus(`${statusParts.join(". ")}.`);
  }
  if (spawnBoss) {
    ctx.spawnRandomBossAtReferenceTopMagnet({
      showStatus: false,
      silentNoReference: true,
      silentNoBoss: true,
    });
  }
  return {
    built: true,
    chosenSignature,
    candidateCount: completedLayouts.length,
    movedReferenceSide,
  };
}
