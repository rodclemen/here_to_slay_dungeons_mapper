export function isPointInsideRect(clientX, clientY, rect) {
  if (!rect) return false;
  return (
    clientX >= rect.left
    && clientX <= rect.right
    && clientY >= rect.top
    && clientY <= rect.bottom
  );
}

export function isPointOverBoardSurface(clientX, clientY, {
  boardRect,
  boardEl,
  topEl,
}) {
  if (!isPointInsideRect(clientX, clientY, boardRect)) return false;
  if (!topEl || !boardEl) return false;
  return topEl === boardEl || boardEl.contains(topEl);
}

export function getEdgeAutoPanAxisDelta(pointer, min, max, zone, maxSpeed, clamp) {
  if (pointer < min + zone) {
    const t = clamp((min + zone - pointer) / zone, 0, 1);
    return maxSpeed * t * t;
  }
  if (pointer > max - zone) {
    const t = clamp((pointer - (max - zone)) / zone, 0, 1);
    return -(maxSpeed * t * t);
  }
  return 0;
}

export function computeDragEdgeAutoPan({
  clientX,
  clientY,
  boardRect,
  lastTs,
  now,
  zone,
  maxSpeed,
  zoom,
  clamp,
  isPointerOverBoard,
}) {
  if (!isPointerOverBoard) {
    return { dx: 0, dy: 0, lastTs: null };
  }

  const prevTs = Number.isFinite(lastTs) ? lastTs : now;
  const dt = clamp(now - prevTs, 0, 32);
  const vx = getEdgeAutoPanAxisDelta(
    clientX,
    boardRect.left,
    boardRect.right,
    zone,
    maxSpeed,
    clamp,
  );
  const vy = getEdgeAutoPanAxisDelta(
    clientY,
    boardRect.top,
    boardRect.bottom,
    zone,
    maxSpeed,
    clamp,
  );
  if (Math.abs(vx) < 1e-3 && Math.abs(vy) < 1e-3) {
    return { dx: 0, dy: 0, lastTs: now };
  }

  const frameScale = dt / 16.667;
  return {
    dx: (vx * frameScale) / zoom,
    dy: (vy * frameScale) / zoom,
    lastTs: now,
  };
}
