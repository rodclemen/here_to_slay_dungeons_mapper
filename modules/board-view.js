// ── Board View ─────────────────────────────────────────────────────
// Board zoom, pan, translate, scene transform sync, auto-pan,
// and utility point/layer checks.  Extracted from app.js.
//
// Every function that needs app.js state or helpers receives a `ctx`
// object — same pattern as the other extracted modules.
// ────────────────────────────────────────────────────────────────────

import { isPointInsideRect } from "./board-interaction.js";
import { attachHint } from "./hint-overlay.js";

// ── Layer / point checks (minimal or no ctx) ──────────────────────

export function isOnBoardLayer(parent, ctx) {
  if (!parent) return false;
  if (parent === ctx.board) return true;
  return parent.classList?.contains("board-content") ?? false;
}

export function isClickInTopRightCloseHit(event, containerEl) {
  if (!event || !containerEl) return false;
  const rect = containerEl.getBoundingClientRect();
  const hitSize = 28;
  const inset = 6;
  const left = rect.right - inset - hitSize;
  const right = rect.right - inset;
  const top = rect.top + inset;
  const bottom = rect.top + inset + hitSize;
  return (
    event.clientX >= left
    && event.clientX <= right
    && event.clientY >= top
    && event.clientY <= bottom
  );
}

export function isPointInsideElement(clientX, clientY, element) {
  if (!element) return false;
  return isPointInsideRect(clientX, clientY, element.getBoundingClientRect());
}

export function isPointOverBoardSurface(clientX, clientY, ctx, boardRect = ctx.board.getBoundingClientRect()) {
  return ctx.isPointOverBoardSurfaceValue(clientX, clientY, {
    boardRect,
    boardEl: ctx.board,
    topEl: document.elementFromPoint(clientX, clientY),
  });
}

// ── Board iteration helpers ───────────────────────────────────────

export function forEachBoardTile(callback, ctx) {
  for (const tile of ctx.state.tiles.values()) {
    if (!tile.dom || !isOnBoardLayer(tile.dom.parentElement, ctx)) continue;
    callback(tile);
  }
}

// ── Zoom helpers ──────────────────────────────────────────────────

export function getBoardZoom(ctx) {
  return Number.isFinite(ctx.state.boardZoom) ? ctx.state.boardZoom : 1;
}

export function getBoardRawZoom(ctx) {
  return Number.isFinite(ctx.state.boardZoomRaw) ? ctx.state.boardZoomRaw : getBoardZoom(ctx);
}

export function worldToBoardScreenX(x, ctx, zoom = getBoardZoom(ctx)) {
  return ctx.worldToBoardScreen(x, zoom);
}

export function worldToBoardScreenY(y, ctx, zoom = getBoardZoom(ctx)) {
  return ctx.worldToBoardScreen(y, zoom);
}

export function quantizeBoardZoom(zoom, ctx) {
  return ctx.quantizeBoardZoomValue(zoom, {
    clamp: ctx.clamp,
    min: 0.7,
    max: 1.8,
    step: ctx.BOARD_ZOOM_STEP,
  });
}

// ── Scene transforms ──────────────────────────────────────────────

export function syncBoardSceneTransforms(ctx) {
  forEachBoardTile((tile) => {
    ctx.updateTileTransform(tile);
  }, ctx);
  ctx.updateReferenceMarkerTransform();
  ctx.forEachBoardBossToken((token) => {
    ctx.updateBossTokenTransform(token);
  });
}

// ── Zoom application ──────────────────────────────────────────────

export function applyBoardZoom(zoom, ctx, options = {}) {
  const syncScene = options?.syncScene !== false;
  const rawZoom = ctx.clamp(
    Number.isFinite(options?.rawZoom) ? options.rawZoom : zoom,
    0.7,
    1.8,
  );
  const quantized = quantizeBoardZoom(zoom, ctx);
  ctx.state.boardZoomRaw = rawZoom;
  ctx.state.boardZoom = quantized;
  ctx.board.style.setProperty("--board-zoom", quantized.toFixed(3));
  updateBoardZoomIndicator(ctx);
  ctx.scheduleBoardHexGridRender();
  if (syncScene) syncBoardSceneTransforms(ctx);
}

export function updateBoardZoomIndicator(ctx) {
  let badge = ctx.workspace.querySelector(".board-zoom-indicator");
  if (!badge) {
    badge = document.createElement("button");
    badge.type = "button";
    badge.className = "board-zoom-indicator";
    badge.addEventListener("click", () => {
      resetBoardView(ctx);
    });
    attachHint(badge, "Click to reset zoom to 100%.");
    ctx.workspace.appendChild(badge);
  }
  const percent = Math.round(getBoardZoom(ctx) * 100);
  badge.textContent = `Zoom ${percent}%`;
  badge.setAttribute("aria-label", `Reset zoom (${percent} percent)`);
  void badge.offsetWidth;
}

// ── Board content translation ─────────────────────────────────────

export function translateBoardContent(dx, dy, ctx, options = {}) {
  const syncScene = options?.syncScene !== false;
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return;

  ctx.state.boardPanX += dx;
  ctx.state.boardPanY += dy;

  for (const tile of ctx.state.tiles.values()) {
    if (!tile.dom || !isOnBoardLayer(tile.dom.parentElement, ctx)) continue;
    ctx.positionTile(tile, tile.x + dx, tile.y + dy);
    if (syncScene) ctx.updateTileTransform(tile);
  }

  if (ctx.state.referenceMarker?.dom) {
    const rx = ctx.state.referenceMarker.x + dx;
    const ry = ctx.state.referenceMarker.y + dy;
    ctx.state.referenceMarker.x = rx;
    ctx.state.referenceMarker.y = ry;
    if (syncScene) ctx.updateReferenceMarkerTransform(ctx.state.referenceMarker);
  }

  for (const token of ctx.state.bossTokens) {
    if (!token?.dom || !isOnBoardLayer(token.dom.parentElement, ctx)) continue;
    ctx.positionBossToken(token, token.x + dx, token.y + dy);
    if (syncScene) ctx.updateBossTokenTransform(token);
  }
  if (ctx.state.entranceFadeAnchor) {
    ctx.state.entranceFadeAnchor = {
      x: ctx.state.entranceFadeAnchor.x + dx,
      y: ctx.state.entranceFadeAnchor.y + dy,
    };
  }

  ctx.scheduleBoardHexGridRender();
}

export function shiftBoardSceneBy(dx, dy, ctx) {
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
  if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return;

  ctx.state.boardPanX += dx;
  ctx.state.boardPanY += dy;

  forEachBoardTile((tile) => {
    ctx.positionTile(tile, tile.x + dx, tile.y + dy);
    ctx.updateTileTransform(tile);
  }, ctx);

  if (ctx.state.referenceMarker?.dom) {
    const nextX = ctx.state.referenceMarker.x + dx;
    const nextY = ctx.state.referenceMarker.y + dy;
    ctx.state.referenceMarker.x = nextX;
    ctx.state.referenceMarker.y = nextY;
    ctx.updateReferenceMarkerTransform(ctx.state.referenceMarker);
  }

  ctx.forEachBoardBossToken((token) => {
    ctx.positionBossToken(token, token.x + dx, token.y + dy);
    ctx.updateBossTokenTransform(token);
  });
}

export function lockBoardSceneDuringLayoutTransition(startRect, durationMs, ctx, onDone) {
  let lastLeft = startRect.left;
  let lastTop = startRect.top;
  const endAt = performance.now() + durationMs;

  const step = () => {
    const rect = ctx.board.getBoundingClientRect();
    const zoom = getBoardZoom(ctx);
    const dx = (lastLeft - rect.left) / zoom;
    const dy = (lastTop - rect.top) / zoom;
    if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
      shiftBoardSceneBy(dx, dy, ctx);
    }
    lastLeft = rect.left;
    lastTop = rect.top;
    ctx.recenterTrayAndReserveTiles();
    ctx.renderBoardHexGrid();

    if (performance.now() < endAt) {
      requestAnimationFrame(step);
      return;
    }
    if (typeof onDone === "function") onDone();
  };

  requestAnimationFrame(step);
}

// ── Pan / recenter ────────────────────────────────────────────────

export function resetBoardPan(ctx) {
  ctx.state.boardPanX = 0;
  ctx.state.boardPanY = 0;
  ctx.scheduleBoardHexGridRender();
}

export function centerBoardViewOnEntranceX(ctx, options = {}) {
  const entrance = ctx.state.tiles.get(ctx.ENTRANCE_TILE_ID);
  if (!entrance?.placed) return;
  if (!entrance.dom || !isOnBoardLayer(entrance.dom.parentElement, ctx)) return;
  const targetX = ctx.board.clientWidth / (2 * getBoardZoom(ctx));
  const dx = targetX - entrance.x;
  if (Math.abs(dx) < 0.5) return;
  translateBoardContent(dx, 0, ctx, options);
}

export function recenterBoardView(ctx, { resetZoom = false } = {}) {
  if (resetZoom) {
    applyBoardZoom(ctx.DEFAULT_BOARD_ZOOM, ctx, { syncScene: false });
  }
  const dx = -ctx.state.boardPanX;
  const dy = -ctx.state.boardPanY;
  translateBoardContent(dx, dy, ctx, { syncScene: false });
  centerBoardViewOnEntranceX(ctx, { syncScene: false });
  syncBoardSceneTransforms(ctx);
  ctx.updateBoardAutoCenterViewportAnchor();
}

export function resetBoardViewToZoom(ctx, zoom = ctx.DEFAULT_BOARD_ZOOM, rawZoom = zoom) {
  applyBoardZoom(zoom, ctx, { syncScene: false, rawZoom });
  const dx = -ctx.state.boardPanX;
  const dy = -ctx.state.boardPanY;
  translateBoardContent(dx, dy, ctx, { syncScene: false });
  centerBoardViewOnEntranceX(ctx, { syncScene: false });
  syncBoardSceneTransforms(ctx);
  ctx.updateBoardAutoCenterViewportAnchor();
}

export function resetBoardView(ctx) {
  resetBoardViewToZoom(ctx, ctx.DEFAULT_BOARD_ZOOM);
}

export function zoomBoardAtPoint(delta, anchorBoardX, anchorBoardY, ctx) {
  const prevZoom = getBoardZoom(ctx);
  const nextRawZoom = ctx.clamp(getBoardRawZoom(ctx) + delta, 0.7, 1.8);
  const nextZoom = quantizeBoardZoom(nextRawZoom, ctx);
  if (Math.abs(nextZoom - prevZoom) < 1e-6) {
    ctx.state.boardZoomRaw = nextRawZoom;
    return;
  }

  const worldXBefore = anchorBoardX / prevZoom;
  const worldYBefore = anchorBoardY / prevZoom;
  const worldXAfter = anchorBoardX / nextZoom;
  const worldYAfter = anchorBoardY / nextZoom;

  applyBoardZoom(nextZoom, ctx, { syncScene: false, rawZoom: nextRawZoom });
  translateBoardContent(worldXAfter - worldXBefore, worldYAfter - worldYBefore, ctx, { syncScene: false });
  syncBoardSceneTransforms(ctx);
  ctx.markDevQaCheck("zoom_board", { detail: `${Math.round(nextZoom * 100)}%` });
}

// ── Drag-edge auto-pan ────────────────────────────────────────────

export function applyDragEdgeAutoPan(clientX, clientY, boardRect, dragPanState, ctx) {
  if (!dragPanState) return;
  const { dx, dy, lastTs } = ctx.computeDragEdgeAutoPan({
    clientX,
    clientY,
    boardRect,
    lastTs: dragPanState.lastTs,
    now: performance.now(),
    zone: ctx.DRAG_EDGE_AUTO_PAN_ZONE,
    maxSpeed: ctx.DRAG_EDGE_AUTO_PAN_MAX_SPEED,
    zoom: getBoardZoom(ctx),
    clamp: ctx.clamp,
    isPointerOverBoard: isPointOverBoardSurface(clientX, clientY, ctx, boardRect),
  });
  dragPanState.lastTs = lastTs;
  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return;
  translateBoardContent(dx, dy, ctx);
}

export function updateDragEdgeAutoPanState(dragPanState, clientX, clientY, boardRect, ctx) {
  if (!dragPanState) return;
  dragPanState.clientX = clientX;
  dragPanState.clientY = clientY;
  dragPanState.boardRect = boardRect;
  dragPanState.active = true;
  if (dragPanState.rafId != null) return;

  const step = () => {
    if (!dragPanState.active) {
      dragPanState.rafId = null;
      return;
    }
    applyDragEdgeAutoPan(
      dragPanState.clientX,
      dragPanState.clientY,
      dragPanState.boardRect,
      dragPanState,
      ctx,
    );
    dragPanState.rafId = requestAnimationFrame(step);
  };

  dragPanState.rafId = requestAnimationFrame(step);
}

export function stopDragEdgeAutoPan(dragPanState) {
  if (!dragPanState) return;
  dragPanState.active = false;
  dragPanState.lastTs = null;
  if (dragPanState.rafId != null) {
    cancelAnimationFrame(dragPanState.rafId);
    dragPanState.rafId = null;
  }
}
