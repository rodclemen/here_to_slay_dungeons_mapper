export function worldToBoardScreen(value, zoom = 1) {
  return value * zoom;
}

export function quantizeBoardZoom(zoom, { clamp, min = 0.7, max = 1.8, step = 0.01 }) {
  const clamped = clamp(zoom, min, max);
  return Math.round(clamped / step) * step;
}

export function createBoardHexLayout({
  width,
  height,
  boardScale,
  boardItemScale,
  sqrt3,
}) {
  const w = Math.max(0, Math.floor(width));
  const h = Math.max(0, Math.floor(height));
  const padding = Math.max(16, Math.min(28, Math.floor(Math.min(w, h) * 0.045)));
  const targetCols = Math.max(6, Math.floor((w - padding * 2) / 64));
  const fallbackRadius = Math.max(14, Math.min(34, (w - padding * 2) / (targetCols * 1.5 + 0.5)));
  let radius = fallbackRadius;
  const maxRadiusByWidth = Math.max(10, (w - padding * 2) / 9.5);
  const maxRadiusByHeight = Math.max(10, (h - padding * 2) / 6.5);
  radius = Math.max(12, Math.min(radius, 34, maxRadiusByWidth, maxRadiusByHeight)) * boardScale * boardItemScale;
  const hexHeight = sqrt3 * radius;
  const dx = 1.5 * radius;
  const dy = hexHeight;
  return {
    w,
    h,
    layout: {
      padding,
      radius,
      hexHeight,
      dx,
      dy,
      minX: padding + radius,
      maxX: w - padding - radius,
      minY: padding + hexHeight / 2,
      maxY: h - padding - hexHeight / 2,
    },
  };
}

export function snapBoardPointToHex(x, y, { layout, panX, panY, quantizeSnapCoord }) {
  if (
    !Number.isFinite(layout?.minX)
    || layout.minX > layout.maxX
    || layout.minY > layout.maxY
  ) {
    return { x, y };
  }

  const bx = x - panX;
  const by = y - panY;
  const approxCol = Math.round((bx - layout.minX) / layout.dx);

  let best = { x, y, d2: Number.POSITIVE_INFINITY };
  for (let dc = -2; dc <= 2; dc += 1) {
    const col = approxCol + dc;
    const cxBase = layout.minX + col * layout.dx;
    const yOffset = ((col % 2) + 2) % 2 ? (layout.hexHeight / 2) : 0;
    const approxRow = Math.round((by - (layout.minY + yOffset)) / layout.dy);
    for (let dr = -2; dr <= 2; dr += 1) {
      const row = approxRow + dr;
      const cyBase = layout.minY + yOffset + row * layout.dy;
      const cx = cxBase + panX;
      const cy = cyBase + panY;
      const dx = cx - x;
      const dy = cy - y;
      const d2 = dx * dx + dy * dy;
      if (d2 < best.d2) best = { x: cx, y: cy, d2 };
    }
  }
  return {
    x: quantizeSnapCoord(best.x),
    y: quantizeSnapCoord(best.y),
  };
}

export function getBoardDropPositionFromPointer(clientX, clientY, {
  boardRect,
  clientLeft,
  clientTop,
  zoom,
  boardWidth,
  boardHeight,
  clamp,
  magnet,
}) {
  const boardOriginX = boardRect.left + clientLeft;
  const boardOriginY = boardRect.top + clientTop;
  const rawX = clamp((clientX - boardOriginX) / zoom, 0, boardWidth);
  const rawY = clamp((clientY - boardOriginY) / zoom, 0, boardHeight);
  if (!magnet) return { x: rawX, y: rawY };
  return {
    x: clamp(magnet.x, 0, boardWidth),
    y: clamp(magnet.y, 0, boardHeight),
  };
}
