// ── Boss Management ────────────────────────────────────────────────
// Boss pile ordering, rendering, token creation/dragging, magnet
// positioning, spawn logic, and boss edit mode.
// Extracted from app.js.
//
// Every function that needs app.js state or helpers receives a `ctx`
// object — same pattern as the other extracted modules.
// ────────────────────────────────────────────────────────────────────

// ── Pure helpers (no ctx) ─────────────────────────────────────────

export function buildBossAssetKey(tileSetId, bossId) {
  return `${tileSetId}:boss:${bossId}`;
}

export function parseBossAssetKey(bossKey) {
  const match = /^([^:]+):boss:(.+)$/.exec(String(bossKey || ""));
  if (!match) return null;
  return {
    tileSetId: match[1],
    bossId: match[2],
  };
}

// ── Asset resolution ──────────────────────────────────────────────

export function resolveBossAssetSrc(bossKey, ctx) {
  const parsed = parseBossAssetKey(bossKey);
  if (!parsed) return "";
  return ctx.resolveTileSetAssetPath(parsed.tileSetId, "boss", parsed.bossId);
}

export function getBossKeyForLegacySrc(src, ctx, fallbackTileSetId = ctx.state.selectedTileSetId) {
  for (const tileSet of ctx.getTileSetRegistry()) {
    const bossIds = Array.isArray(tileSet?.bossIds) ? tileSet.bossIds : [];
    for (const bossId of bossIds) {
      const bossKey = buildBossAssetKey(tileSet.id, bossId);
      if (resolveBossAssetSrc(bossKey, ctx) === src) return bossKey;
    }
  }

  const fallbackTileSet = ctx.getTileSetConfig(fallbackTileSetId);
  const fallbackBossIds = Array.isArray(fallbackTileSet?.bossIds) ? fallbackTileSet.bossIds : [];
  return fallbackBossIds.length ? buildBossAssetKey(fallbackTileSet.id, fallbackBossIds[0]) : "";
}

// ── Pile ordering ─────────────────────────────────────────────────

export function getBossTileSources(ctx, tileSetId = ctx.state.selectedTileSetId) {
  return ctx.getBossTileSourcesValue(tileSetId, ctx.getTileSetConfig, (tileSet, assetKind, assetId) => {
    if (assetKind !== "boss") return ctx.resolveTileSetAssetPath(tileSet, assetKind, assetId);
    return buildBossAssetKey(tileSet.id, assetId);
  });
}

export function ensureBossPileOrder(ctx, tileSetId = ctx.state.selectedTileSetId) {
  const canonical = getBossTileSources(ctx, tileSetId);
  const existing = Array.isArray(ctx.state.bossPileOrderByTileSet[tileSetId])
    ? ctx.state.bossPileOrderByTileSet[tileSetId]
    : [];
  const normalized = ctx.normalizeOrderedSources(canonical, existing);
  ctx.state.bossPileOrderByTileSet[tileSetId] = normalized;
  return normalized;
}

export function rotateBossPileTop(ctx, tileSetId = ctx.state.selectedTileSetId) {
  const order = ensureBossPileOrder(ctx, tileSetId);
  ctx.state.bossPileOrderByTileSet[tileSetId] = ctx.rotatePileTop(order);
}

export function pushBossBackToPile(bossKey, ctx, tileSetId = ctx.state.selectedTileSetId) {
  if (ctx.state.useAllBosses) {
    const unified = ensureAllBossesPileOrder(ctx);
    const filtered = unified.filter((entry) => entry !== bossKey);
    filtered.push(bossKey);
    ctx.state.allBossesPileOrder = filtered;
    return;
  }
  const order = ensureBossPileOrder(ctx, tileSetId);
  const filtered = order.filter((entry) => entry !== bossKey);
  filtered.push(bossKey);
  ctx.state.bossPileOrderByTileSet[tileSetId] = filtered;
}

export function ensureAllBossesPileOrder(ctx) {
  const allCanonical = ctx.buildAllBossTileSources(ctx.getReadyTileSets(), (tsId) => getBossTileSources(ctx, tsId))
    .filter((bossKey) => resolveBossAssetSrc(bossKey, ctx));
  const existing = Array.isArray(ctx.state.allBossesPileOrder) ? ctx.state.allBossesPileOrder : [];
  const isFirstBuild = !existing.length;
  const normalized = ctx.normalizeOrderedSources(allCanonical, existing);
  ctx.state.allBossesPileOrder = isFirstBuild ? ctx.shuffle(normalized) : normalized;
  return ctx.state.allBossesPileOrder;
}

export function rotateAllBossesPileTop(ctx) {
  const order = ensureAllBossesPileOrder(ctx);
  const placedBossSources = new Set(ctx.state.bossTokens.map((token) => token.bossKey));
  const visibleOrder = order.filter((bossKey) => !placedBossSources.has(bossKey));
  const visibleTop = visibleOrder[visibleOrder.length - 1];
  if (!visibleTop) return;

  const next = order.filter((bossKey) => bossKey !== visibleTop);
  next.unshift(visibleTop);
  ctx.state.allBossesPileOrder = next;
}

export function getAvailableBossSources(ctx, tileSetId = ctx.state.selectedTileSetId) {
  const placedBossSources = new Set(ctx.state.bossTokens.map((token) => token.bossKey));
  if (ctx.state.useAllBosses) {
    return ensureAllBossesPileOrder(ctx).filter((src) => !placedBossSources.has(src));
  }
  return ensureBossPileOrder(ctx, tileSetId).filter((src) => !placedBossSources.has(src));
}

export function triggerBossRandomizeAnimation(ctx, tileSetId = ctx.state.selectedTileSetId) {
  if (!ctx.bossPile) return;
  if (ctx.state.useAllBosses) {
    const order = ensureAllBossesPileOrder(ctx);
    if (order.length <= 1) return;
    ctx.state.allBossesPileOrder = ctx.shuffleDistinctOrder(order, ctx.shuffle);
    ctx.scheduleRenderBossPile();
    return;
  }
  const order = ensureBossPileOrder(ctx, tileSetId);
  if (order.length <= 1) return;
  ctx.state.bossPileOrderByTileSet[tileSetId] = ctx.shuffleDistinctOrder(order, ctx.shuffle, { swapPair: true });
  ctx.scheduleRenderBossPile();
}

export function getTileSetIdForBossSrc(src, ctx) {
  const parsed = parseBossAssetKey(src);
  if (parsed?.tileSetId) return parsed.tileSetId;
  return ctx.findBossTileSetIdForSrc(src, ctx.getTileSetRegistry(), (tsId) => getBossTileSources(ctx, tsId), ctx.state.selectedTileSetId);
}

export function removeBossToken(token, ctx, { returnToPile = true } = {}) {
  if (!token) return;
  if (returnToPile) {
    const targetTileSetId = ctx.state.useAllBosses
      ? getTileSetIdForBossSrc(token.bossKey, ctx)
      : ctx.state.selectedTileSetId;
    pushBossBackToPile(token.bossKey, ctx, targetTileSetId);
  }
  ctx.state.bossTokens = ctx.state.bossTokens.filter((entry) => entry.id !== token.id);
  token.dom?.remove();
}

export function generateAllBossesOffset(src, z, count, ctx) {
  return ctx.generateAllBossesOffsetValue(src, z, count);
}

// ── Boss pile rendering ───────────────────────────────────────────

export function renderBossPile(ctx) {
  if (!ctx.bossPile) return;
  ctx.bossPile.innerHTML = "";
  const placedBossSources = new Set(ctx.state.bossTokens.map((token) => token.bossKey));
  let order;
  if (ctx.state.useAllBosses) {
    order = ensureAllBossesPileOrder(ctx);
  } else {
    order = ensureBossPileOrder(ctx, ctx.state.selectedTileSetId);
  }
  const sources = order.filter((src) => !placedBossSources.has(src));
  if (!sources.length) {
    ctx.bossPile.classList.add("is-empty");
    ctx.updatePlacementFeedbackChecklist();
    return;
  }
  ctx.bossPile.classList.remove("is-empty");

  const defaultOffsets = [
    { dx: -20, dy: 10, rot: -9, z: 1, scale: 0.98 },
    { dx: 16, dy: -6, rot: 5, z: 2, scale: 1.0 },
  ];
  const ordered = sources;

  for (let i = 0; i < ordered.length; i += 1) {
    const card = document.createElement("div");
    card.className = "boss-card";
    const offset = ctx.state.useAllBosses
      ? generateAllBossesOffset(ordered[i], i + 1, ordered.length, ctx)
      : (defaultOffsets[i] || defaultOffsets[defaultOffsets.length - 1]);
    const cycleTargetOffset = ctx.state.useAllBosses
      ? generateAllBossesOffset(ordered[0], 1, ordered.length, ctx)
      : (defaultOffsets[0] || offset);
    card.style.setProperty("--dx", `${offset.dx}px`);
    card.style.setProperty("--dy", `${offset.dy}px`);
    card.style.setProperty("--rot", `${offset.rot}deg`);
    card.style.setProperty("--z", String(offset.z));
    card.style.setProperty("--scale", String(offset.scale));
    const isTopStackCard = i === ordered.length - 1;
    card.style.setProperty("--boss-shadow-y", isTopStackCard ? "4px" : "2px");
    card.style.setProperty("--boss-shadow-blur", isTopStackCard ? "7px" : "5px");
    card.style.setProperty("--boss-shadow-alpha", isTopStackCard ? "0.24" : "0.17");
    card.style.setProperty("--cycle-target-dx", `${cycleTargetOffset.dx}px`);
    card.style.setProperty("--cycle-target-dy", `${cycleTargetOffset.dy}px`);
    card.style.setProperty("--cycle-target-rot", `${cycleTargetOffset.rot}deg`);
    card.style.setProperty("--cycle-target-scale", String(cycleTargetOffset.scale));

    const img = document.createElement("img");
    img.src = resolveBossAssetSrc(ordered[i], ctx);
    img.alt = "Boss tile";
    img.draggable = false;
    img.addEventListener("dragstart", (event) => event.preventDefault());
    img.addEventListener("error", () => {
      card.remove();
      if (!ctx.bossPile.querySelector(".boss-card")) ctx.bossPile.classList.add("is-empty");
    });
    const isTopCard = i === ordered.length - 1;
    let draggedOut = false;
    if (isTopCard) {
      card.addEventListener("pointerdown", (event) => {
        beginBossSpawnDrag(event, ordered[i], ctx, () => {
          draggedOut = true;
        });
      });
    }

    card.addEventListener("click", () => {
      if (draggedOut) {
        draggedOut = false;
        return;
      }
      if (!isTopCard) return;
      if (!ctx.state.bossEditMode) return;
      if (ordered.length < 2) return;
      if (ctx.state.bossPileCycleInProgress) return;
      ctx.state.bossPileCycleInProgress = true;
      ctx.bossPile?.classList.add("is-cycling");
      const topDx = card.style.getPropertyValue("--dx").trim();
      const topDy = card.style.getPropertyValue("--dy").trim();
      const topRot = card.style.getPropertyValue("--rot").trim();
      const topScale = card.style.getPropertyValue("--scale").trim();
      if (!ctx.state.useAllBosses) {
        const allCards = Array.from(card.parentElement?.querySelectorAll(".boss-card:not(.boss-card-cycling-out)") || []);
        const counterpart = allCards.length >= 2 ? allCards[allCards.length - 2] : allCards[0];
        if (counterpart && counterpart !== card) {
          if (topDx) counterpart.style.setProperty("--cycle-in-target-dx", topDx);
          if (topDy) counterpart.style.setProperty("--cycle-in-target-dy", topDy);
          if (topRot) counterpart.style.setProperty("--cycle-in-target-rot", topRot);
          if (topScale) counterpart.style.setProperty("--cycle-in-target-scale", topScale);
          counterpart.classList.add("boss-card-cycling-in");
        }
      }
      card.classList.add("boss-card-cycling-out");
      const midSwapDelay = Math.round(ctx.BOSS_PILE_CYCLE_ANIMATION_MS * 0.33);
      window.setTimeout(() => {
        if (!ctx.state.bossPileCycleInProgress) return;
        ctx.bossPile?.classList.add("is-cycle-mid");
      }, midSwapDelay);
      window.setTimeout(() => {
        if (ctx.state.useAllBosses) {
          rotateAllBossesPileTop(ctx);
        } else {
          rotateBossPileTop(ctx, ctx.state.selectedTileSetId);
        }
        ctx.scheduleRenderBossPile();
        ctx.bossPile?.classList.remove("is-cycle-mid");
        ctx.bossPile?.classList.remove("is-cycling");
        ctx.state.bossPileCycleInProgress = false;
      }, ctx.BOSS_PILE_CYCLE_ANIMATION_MS);
    });

    card.appendChild(img);
    ctx.bossPile.appendChild(card);
  }
  ctx.updatePlacementFeedbackChecklist();
}

// ── Boss edit mode ────────────────────────────────────────────────

export function setBossEditMode(enabled, ctx) {
  ctx.state.bossEditMode = Boolean(enabled);
  document.body.classList.toggle("boss-edit-mode", ctx.state.bossEditMode);
  ctx.updateModeIndicators();
}

// ── Boss heading sync ─────────────────────────────────────────────

export function syncBossTileSetHeading(ctx) {
  if (!ctx.bossTileSetNameEl) return;
  if (ctx.state.useAllBosses) {
    ctx.bossTileSetNameEl.textContent = "- All";
  } else {
    const label = ctx.getTileSetConfig(ctx.state.selectedTileSetId)?.label || "";
    ctx.bossTileSetNameEl.textContent = label ? `- ${label}` : "";
  }
}

// ── Iteration helpers ─────────────────────────────────────────────

export function forEachBoardBossToken(callback, ctx) {
  for (const token of ctx.state.bossTokens) {
    if (!token?.dom || !ctx.isOnBoardLayer(token.dom.parentElement)) continue;
    callback(token);
  }
}

// ── Reset ─────────────────────────────────────────────────────────

export function resetTilesAndBossCards(ctx) {
  const tileSetId = ctx.state.selectedTileSetId;
  ctx.resetTiles();
  ctx.state.bossPileOrderByTileSet[tileSetId] = getBossTileSources(ctx, tileSetId);
  ctx.scheduleRenderBossPile();
  ctx.setStatus("Tiles and boss cards reset.");
}

// ── Magnet positioning ────────────────────────────────────────────

export function getBossReferenceMagnetBoardPosition(boardX, boardY, ctx) {
  const reference = ctx.state.referenceMarker;
  if (!reference) return null;
  const sideOffset = ctx.TILE_SIZE + ctx.BOSS_REFERENCE_MAGNET_GAP;
  const topOffset = ctx.TILE_SIZE + ctx.BOSS_REFERENCE_MAGNET_TOP_GAP;
  const anchors = [
    {
      type: "side",
      x: reference.x - sideOffset,
      y: reference.y,
      radius: ctx.BOSS_REFERENCE_MAGNET_SIDE_RADIUS,
    },
    {
      type: "side",
      x: reference.x + sideOffset,
      y: reference.y,
      radius: ctx.BOSS_REFERENCE_MAGNET_SIDE_RADIUS,
    },
    {
      type: "top",
      x: reference.x,
      y: reference.y - topOffset,
      radius: ctx.BOSS_REFERENCE_MAGNET_TOP_RADIUS,
    },
  ];

  let best = null;
  for (const anchor of anchors) {
    const dx = boardX - anchor.x;
    const dy = boardY - anchor.y;
    if (anchor.type === "side" && Math.abs(dy) > ctx.BOSS_REFERENCE_MAGNET_SIDE_Y_TOLERANCE) continue;
    if (anchor.type === "top" && Math.abs(dx) > ctx.BOSS_REFERENCE_MAGNET_TOP_X_TOLERANCE) continue;
    const d2 = dx * dx + dy * dy;
    const maxD2 = anchor.radius * anchor.radius;
    if (d2 > maxD2) continue;
    if (!best || d2 < best.d2) best = { ...anchor, d2 };
  }

  if (!best) return null;
  return { x: best.x, y: best.y };
}

export function getBossTokenMagnetBoardPosition(boardX, boardY, ctx, options = {}) {
  if (!ctx.state.bossTokens.length) return null;
  const tokenWidth = ctx.TILE_SIZE + ctx.BOSS_TOKEN_MAGNET_GAP;
  const tokenHeight = (ctx.TILE_SIZE * ctx.BOSS_CARD_ASPECT_RATIO) + ctx.BOSS_TOKEN_MAGNET_GAP;
  const excludeBossTokenId = options.excludeBossTokenId || "";
  let best = null;

  for (const token of ctx.state.bossTokens) {
    if (!token || token.id === excludeBossTokenId) continue;
    const anchors = [
      {
        x: token.x - tokenWidth,
        y: token.y,
        axisDelta: Math.abs(boardY - token.y),
      },
      {
        x: token.x + tokenWidth,
        y: token.y,
        axisDelta: Math.abs(boardY - token.y),
      },
      {
        x: token.x,
        y: token.y - tokenHeight,
        axisDelta: Math.abs(boardX - token.x),
      },
      {
        x: token.x,
        y: token.y + tokenHeight,
        axisDelta: Math.abs(boardX - token.x),
      },
    ];

    for (const anchor of anchors) {
      if (anchor.axisDelta > ctx.BOSS_TOKEN_MAGNET_AXIS_TOLERANCE) continue;
      const dx = boardX - anchor.x;
      const dy = boardY - anchor.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > ctx.BOSS_TOKEN_MAGNET_RADIUS * ctx.BOSS_TOKEN_MAGNET_RADIUS) continue;
      if (!best || d2 < best.d2) best = { x: anchor.x, y: anchor.y, d2 };
    }
  }

  return best ? { x: best.x, y: best.y, d2: best.d2 } : null;
}

export function getBossDropMagnetBoardPosition(boardX, boardY, ctx, options = {}) {
  const candidates = [
    getBossReferenceMagnetBoardPosition(boardX, boardY, ctx),
    getBossTokenMagnetBoardPosition(boardX, boardY, ctx, options),
  ].filter(Boolean);
  if (!candidates.length) return null;

  let best = null;
  for (const candidate of candidates) {
    const dx = boardX - candidate.x;
    const dy = boardY - candidate.y;
    const d2 = candidate.d2 ?? (dx * dx + dy * dy);
    if (!best || d2 < best.d2) best = { x: candidate.x, y: candidate.y, d2 };
  }
  return { x: best.x, y: best.y };
}

export function getBossReferenceTopMagnetBoardPosition(ctx) {
  const reference = ctx.state.referenceMarker;
  if (!reference) return null;
  return getBossReferenceTopMagnetBoardPositionForReference(reference.x, reference.y, ctx);
}

export function getBossReferenceTopMagnetBoardPositionForReference(refX, refY, ctx) {
  if (!Number.isFinite(refX) || !Number.isFinite(refY)) return null;
  const topOffset = ctx.TILE_SIZE + ctx.BOSS_REFERENCE_MAGNET_TOP_GAP;
  return {
    x: refX,
    y: refY - topOffset,
  };
}

export function getBossTokenAtReferenceTopMagnet(ctx) {
  const top = getBossReferenceTopMagnetBoardPosition(ctx);
  if (!top) return null;
  const tolerance = 2;
  return ctx.state.bossTokens.find(
    (token) => Math.abs(token.x - top.x) <= tolerance && Math.abs(token.y - top.y) <= tolerance,
  ) || null;
}

// ── Collision polygon ─────────────────────────────────────────────

export function getTopBossCardCollisionPolygon(refX, refY, ctx) {
  const topMagnet = getBossReferenceTopMagnetBoardPositionForReference(refX, refY, ctx);
  if (!topMagnet) return null;
  const halfW = Math.max(
    1,
    ctx.TILE_SIZE * 0.5 - ctx.BOSS_TOP_CARD_COLLISION_INSET_X_PX + ctx.BOSS_TOP_CARD_CLEARANCE_PAD_X_PX,
  );
  const halfH = Math.max(
    1,
    (ctx.TILE_SIZE * ctx.BOSS_CARD_ASPECT_RATIO) * 0.5 - ctx.BOSS_TOP_CARD_COLLISION_INSET_Y_PX + ctx.BOSS_TOP_CARD_CLEARANCE_PAD_Y_PX,
  );
  return [
    { x: topMagnet.x - halfW, y: topMagnet.y - halfH },
    { x: topMagnet.x + halfW, y: topMagnet.y - halfH },
    { x: topMagnet.x + halfW, y: topMagnet.y + halfH },
    { x: topMagnet.x - halfW, y: topMagnet.y + halfH },
  ];
}

// ── Spawn ─────────────────────────────────────────────────────────

export async function spawnRandomBossAtReferenceTopMagnet(ctx, options = {}) {
  const {
    showStatus = true,
    silentNoReference = false,
    silentNoBoss = false,
    shufflePreviewMs = ctx.BOSS_SHUFFLE_PREVIEW_MS,
  } = options || {};
  if (!ctx.state.referenceMarker) {
    if (!silentNoReference && showStatus) {
      ctx.setStatus("Reference card is not available yet.", true);
    }
    return;
  }
  const existingTopToken = getBossTokenAtReferenceTopMagnet(ctx);
  if (existingTopToken) {
    removeBossToken(existingTopToken, ctx, { returnToPile: true });
  }

  let availableSources = getAvailableBossSources(ctx, ctx.state.selectedTileSetId);
  if (!availableSources.length) {
    if (!silentNoBoss && showStatus) {
      ctx.setStatus("No boss cards available to place.", true);
    }
    return;
  }
  triggerBossRandomizeAnimation(ctx, ctx.state.selectedTileSetId);
  if (shufflePreviewMs > 0) {
    await new Promise((resolve) => window.setTimeout(resolve, shufflePreviewMs));
  }
  availableSources = getAvailableBossSources(ctx, ctx.state.selectedTileSetId);
  if (!availableSources.length) {
    if (!silentNoBoss && showStatus) {
      ctx.setStatus("No boss cards available to place.", true);
    }
    return;
  }

  const randomSource = availableSources[Math.floor(Math.random() * availableSources.length)];
  const topMagnetPosition = getBossReferenceTopMagnetBoardPosition(ctx);
  if (!topMagnetPosition) {
    if (showStatus) {
      ctx.setStatus("Could not resolve top reference magnet position.", true);
    }
    return;
  }
  createBossToken(
    randomSource,
    topMagnetPosition.x,
    topMagnetPosition.y,
    ctx,
    ctx.TILE_SIZE,
  );
  ctx.scheduleRenderBossPile();
  if (showStatus) {
    ctx.setStatus(existingTopToken ? "Boss card exchanged at the top reference magnet." : "Random boss placed at the top reference magnet.");
  }
}

// ── Board drop with magnet ────────────────────────────────────────

export function getBoardDropPositionFromPointer(clientX, clientY, boardRect, ctx, zoom = ctx.getBoardZoom(), options = {}) {
  const rough = ctx.getBoardDropPositionFromPointerValue(clientX, clientY, {
    boardRect,
    clientLeft: ctx.board.clientLeft,
    clientTop: ctx.board.clientTop,
    zoom,
    boardWidth: ctx.board.clientWidth,
    boardHeight: ctx.board.clientHeight,
    clamp: ctx.clamp,
  });
  const magnet = getBossDropMagnetBoardPosition(rough.x, rough.y, ctx, options);
  return ctx.getBoardDropPositionFromPointerValue(clientX, clientY, {
    boardRect,
    clientLeft: ctx.board.clientLeft,
    clientTop: ctx.board.clientTop,
    zoom,
    boardWidth: ctx.board.clientWidth,
    boardHeight: ctx.board.clientHeight,
    clamp: ctx.clamp,
    magnet,
  });
}

// ── Boss token CRUD ───────────────────────────────────────────────

export function createBossToken(bossKey, x, y, ctx, size = 130) {
  const gridSize = ctx.TILE_SIZE;
  const src = resolveBossAssetSrc(bossKey, ctx);
  const token = {
    id: `boss-token-${ctx.state.nextBossTokenId++}`,
    bossKey,
    src,
    x,
    y,
    size: gridSize,
    dom: null,
  };
  const dom = document.createElement("div");
  dom.className = "boss-token";
  dom.dataset.tokenId = token.id;
  dom.style.width = `${token.size}px`;
  const img = document.createElement("img");
  img.src = src;
  img.alt = "Boss token";
  img.draggable = false;
  img.addEventListener("dragstart", (e) => e.preventDefault());
  dom.appendChild(img);
  dom.addEventListener("pointerdown", (e) => beginBossTokenDrag(token, e, ctx));
  token.dom = dom;
  ctx.state.bossTokens.push(token);
  ctx.getBoardContentLayer().appendChild(dom);
  updateBossTokenTransform(token, ctx);
  return token;
}

export function positionBossToken(token, x, y) {
  token.x = x;
  token.y = y;
}

export function updateBossTokenTransform(token, ctx) {
  if (!token?.dom) return;
  const parent = token.dom.parentElement;
  const zoom = ctx.getBoardZoom();
  const isBoardOrDrag = ctx.isOnBoardLayer(parent) || parent === ctx.dragLayer;
  const screenX = ctx.isOnBoardLayer(parent) ? ctx.worldToBoardScreenX(token.x, zoom) : token.x;
  const screenY = ctx.isOnBoardLayer(parent) ? ctx.worldToBoardScreenY(token.y, zoom) : token.y;
  const explicitWidth = isBoardOrDrag ? (token.size * ctx.BOARD_ITEM_SCALE * zoom) : token.size;
  token.dom.style.left = `${screenX}px`;
  token.dom.style.top = `${screenY}px`;
  token.dom.style.width = `${explicitWidth}px`;
  token.dom.style.transform = "translate3d(-50%, -50%, 0)";
}

// ── Drag: spawn from pile ─────────────────────────────────────────

export function beginBossSpawnDrag(event, bossKey, ctx, onDragStart = null) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  const HOLD_TO_DRAG_MS = 150;

  const cardEl = event.currentTarget;
  const workspaceRect = ctx.workspace.getBoundingClientRect();
  const boardRect = ctx.board.getBoundingClientRect();
  const pointerId = event.pointerId;
  let latestX = event.clientX;
  let latestY = event.clientY;
  let pointerActive = true;
  let moved = false;
  let droppedToBoard = false;
  let holdElapsed = false;
  const dragPanState = {
    lastTs: null,
    rafId: null,
    active: false,
    clientX: event.clientX,
    clientY: event.clientY,
    boardRect,
  };
  const startDragMode = () => {
    if (moved || !pointerActive) return;
    moved = true;
    preview.style.display = "";
    cardEl.classList.add("boss-card-drag-origin");
    if (typeof onDragStart === "function") onDragStart();
    setPreviewPos(latestX, latestY);
  };
  const holdTimer = setTimeout(() => {
    holdElapsed = true;
    startDragMode();
  }, HOLD_TO_DRAG_MS);
  document.body.classList.add("boss-drag-cursor");

  const preview = document.createElement("div");
  preview.className = "boss-token boss-token-preview";
  preview.style.width = `${ctx.TILE_SIZE}px`;
  preview.style.transform = "translate3d(-50%, -50%, 0)";
  preview.style.display = "none";
  const previewImg = document.createElement("img");
  previewImg.src = resolveBossAssetSrc(bossKey, ctx);
  previewImg.alt = "";
  previewImg.draggable = false;
  previewImg.addEventListener("dragstart", (e) => e.preventDefault());
  preview.appendChild(previewImg);
  ctx.dragLayer.appendChild(preview);

  const setPreviewPos = (clientX, clientY) => {
    preview.style.left = `${clientX - workspaceRect.left}px`;
    preview.style.top = `${clientY - workspaceRect.top}px`;
  };
  const setPreviewBoardScale = (boardScaled) => {
    preview.style.width = `${ctx.TILE_SIZE * (boardScaled ? ctx.getBoardZoom() * ctx.BOARD_ITEM_SCALE : 1)}px`;
  };
  setPreviewPos(event.clientX, event.clientY);

  const cleanup = () => {
    pointerActive = false;
    clearTimeout(holdTimer);
    ctx.stopDragEdgeAutoPan(dragPanState);
    document.body.classList.remove("boss-drag-cursor");
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
    window.removeEventListener("pointercancel", handleUp);
    if (!droppedToBoard) {
      cardEl.classList.remove("boss-card-drag-origin");
    }
    preview.remove();
  };

  const handleMove = (moveEvent) => {
    if (moveEvent.pointerId !== pointerId) return;
    if (moveEvent.pointerType === "mouse" && moveEvent.buttons === 0) {
      cleanup();
      return;
    }
    latestX = moveEvent.clientX;
    latestY = moveEvent.clientY;
    if (!moved) {
      if (!holdElapsed) return;
      startDragMode();
    }
    ctx.updateDragEdgeAutoPanState(dragPanState, moveEvent.clientX, moveEvent.clientY, boardRect);
    const pointerOverBoard = ctx.isPointOverBoardSurface(moveEvent.clientX, moveEvent.clientY, boardRect);
    if (pointerOverBoard) {
      setPreviewBoardScale(true);
      const zoom = ctx.getBoardZoom();
      const boardPos = getBoardDropPositionFromPointer(moveEvent.clientX, moveEvent.clientY, boardRect, ctx, zoom);
      const boardOriginX = boardRect.left + ctx.board.clientLeft;
      const boardOriginY = boardRect.top + ctx.board.clientTop;
      const workspaceX = boardPos.x * zoom + (boardOriginX - workspaceRect.left);
      const workspaceY = boardPos.y * zoom + (boardOriginY - workspaceRect.top);
      setPreviewPos(workspaceX + workspaceRect.left, workspaceY + workspaceRect.top);
      return;
    }
    setPreviewBoardScale(false);
    setPreviewPos(moveEvent.clientX, moveEvent.clientY);
  };

  const handleUp = (upEvent) => {
    if (upEvent.pointerId !== pointerId) return;
    const droppedInsideBoard = ctx.isPointOverBoardSurface(upEvent.clientX, upEvent.clientY, boardRect);

    if (moved && droppedInsideBoard) {
      const zoom = ctx.getBoardZoom();
      const { x: bx, y: by } = getBoardDropPositionFromPointer(upEvent.clientX, upEvent.clientY, boardRect, ctx, zoom);
      createBossToken(bossKey, bx, by, ctx, ctx.TILE_SIZE);
      droppedToBoard = true;
      ctx.scheduleRenderBossPile();
    }
    cleanup();
  };

  window.addEventListener("pointermove", handleMove);
  window.addEventListener("pointerup", handleUp);
  window.addEventListener("pointercancel", handleUp);
}

// ── Drag: existing board token ────────────────────────────────────

export function beginBossTokenDrag(token, event, ctx) {
  if (!token?.dom) return;
  if (event.button !== 0) return;
  if (ctx.state.wallEditMode) return;
  event.preventDefault();
  event.stopPropagation();

  const workspaceRect = ctx.workspace.getBoundingClientRect();
  const boardRect = ctx.board.getBoundingClientRect();
  const startX = token.x;
  const startY = token.y;
  const boardOffsetX = (boardRect.left + ctx.board.clientLeft) - workspaceRect.left;
  const boardOffsetY = (boardRect.top + ctx.board.clientTop) - workspaceRect.top;
  const zoom = ctx.getBoardZoom();
  const pointerId = event.pointerId;
  const dragPanState = {
    lastTs: null,
    rafId: null,
    active: false,
    clientX: event.clientX,
    clientY: event.clientY,
    boardRect,
  };
  token.dom.classList.add("boss-token-dragging");
  document.body.classList.add("boss-drag-cursor");
  if (token.dom.parentElement !== ctx.dragLayer) {
    ctx.dragLayer.appendChild(token.dom);
  }
  positionBossToken(token, startX * zoom + boardOffsetX, startY * zoom + boardOffsetY);
  updateBossTokenTransform(token, ctx);

  const cleanup = () => {
    ctx.stopDragEdgeAutoPan(dragPanState);
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
    window.removeEventListener("pointercancel", handleUp);
    token.dom.classList.remove("boss-token-dragging");
    document.body.classList.remove("boss-drag-cursor");
  };

  const handleMove = (moveEvent) => {
    if (moveEvent.pointerId !== pointerId) return;
    if (moveEvent.pointerType === "mouse" && moveEvent.buttons === 0) {
      cleanup();
      return;
    }
    ctx.updateDragEdgeAutoPanState(dragPanState, moveEvent.clientX, moveEvent.clientY, boardRect);
    let x = moveEvent.clientX - workspaceRect.left;
    let y = moveEvent.clientY - workspaceRect.top;
    const pointerOverBoard = ctx.isPointOverBoardSurface(moveEvent.clientX, moveEvent.clientY, boardRect);
    if (pointerOverBoard) {
      const boardPos = getBoardDropPositionFromPointer(moveEvent.clientX, moveEvent.clientY, boardRect, ctx, zoom, {
        excludeBossTokenId: token.id,
      });
      x = boardPos.x * zoom + boardOffsetX;
      y = boardPos.y * zoom + boardOffsetY;
    }
    positionBossToken(token, x, y);
    updateBossTokenTransform(token, ctx);
  };

  const handleUp = (upEvent) => {
    if (upEvent.pointerId !== pointerId) return;
    const droppedInsideBossPile = ctx.isPointInsideElement(upEvent.clientX, upEvent.clientY, ctx.bossPile);
    const droppedInsideInfoDrawer = ctx.isPointInsideElement(upEvent.clientX, upEvent.clientY, ctx.infoDrawer);
    const droppedInsideTileDrawer = ctx.isPointInsideElement(upEvent.clientX, upEvent.clientY, ctx.tileDrawer);
    if (droppedInsideBossPile || droppedInsideInfoDrawer || droppedInsideTileDrawer) {
      pushBossBackToPile(token.bossKey, ctx, ctx.state.selectedTileSetId);
      ctx.state.bossTokens = ctx.state.bossTokens.filter((entry) => entry.id !== token.id);
      token.dom.remove();
      ctx.scheduleRenderBossPile();
      cleanup();
      return;
    }

    const droppedInsideBoard = ctx.isPointOverBoardSurface(upEvent.clientX, upEvent.clientY, boardRect);
    if (droppedInsideBoard) {
      if (token.dom.parentElement !== ctx.getBoardContentLayer()) {
        ctx.getBoardContentLayer().appendChild(token.dom);
      }
      const { x: bx, y: by } = getBoardDropPositionFromPointer(upEvent.clientX, upEvent.clientY, boardRect, ctx, zoom, {
        excludeBossTokenId: token.id,
      });
      positionBossToken(token, bx, by);
      updateBossTokenTransform(token, ctx);
      cleanup();
      return;
    }

    if (!ctx.isOnBoardLayer(token.dom.parentElement)) {
      ctx.getBoardContentLayer().appendChild(token.dom);
    }
    positionBossToken(token, startX, startY);
    updateBossTokenTransform(token, ctx);
    cleanup();
  };

  window.addEventListener("pointermove", handleMove);
  window.addEventListener("pointerup", handleUp);
  window.addEventListener("pointercancel", handleUp);
}
