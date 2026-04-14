export function getContinuityFaceIndexMap(faces) {
  const indexMap = new Map();
  let count = 0;
  for (let i = 0; i < faces.length; i += 1) {
    if (faces[i].isWall) continue;
    indexMap.set(i, count);
    count += 1;
  }
  return { indexMap, count };
}

export function getBestOrderedMatchedPairs(candidates, aCount, bCount) {
  if (!candidates.length) return [];

  const byPair = new Map();
  for (const c of candidates) {
    const key = `${c.i}:${c.j}`;
    const prev = byPair.get(key);
    if (!prev || c.midpointDistance < prev.midpointDistance) {
      byPair.set(key, c);
    }
  }

  const mod = (n, size) => ((n % size) + size) % size;
  let bestChain = [];
  let bestDistance = Infinity;

  const uniquePairs = Array.from(byPair.values());
  for (const start of uniquePairs) {
    for (const bStep of [1, -1]) {
      const projected = uniquePairs
        .map((pair) => {
          const da = mod(pair.i - start.i, aCount);
          const db = bStep === 1
            ? mod(pair.j - start.j, bCount)
            : mod(start.j - pair.j, bCount);
          return { ...pair, da, db };
        })
        .sort((a, b) => a.da - b.da || a.db - b.db || a.midpointDistance - b.midpointDistance);

      const n = projected.length;
      const dpLen = new Array(n).fill(1);
      const dpDist = projected.map((p) => p.midpointDistance);
      const prev = new Array(n).fill(-1);

      for (let i = 0; i < n; i += 1) {
        for (let j = 0; j < i; j += 1) {
          if (projected[j].da < projected[i].da && projected[j].db < projected[i].db) {
            const nextLen = dpLen[j] + 1;
            const nextDist = dpDist[j] + projected[i].midpointDistance;
            if (nextLen > dpLen[i] || (nextLen === dpLen[i] && nextDist < dpDist[i])) {
              dpLen[i] = nextLen;
              dpDist[i] = nextDist;
              prev[i] = j;
            }
          }
        }
      }

      let endIdx = 0;
      for (let i = 1; i < n; i += 1) {
        if (dpLen[i] > dpLen[endIdx] || (dpLen[i] === dpLen[endIdx] && dpDist[i] < dpDist[endIdx])) {
          endIdx = i;
        }
      }

      const chain = [];
      for (let i = endIdx; i >= 0; i = prev[i]) {
        chain.unshift(projected[i]);
        if (prev[i] === -1) break;
      }

      if (chain.length > bestChain.length || (chain.length === bestChain.length && dpDist[endIdx] < bestDistance)) {
        bestChain = chain;
        bestDistance = dpDist[endIdx];
      }
    }
  }

  return bestChain.map((pair) => ({ i: pair.ai, j: pair.bj }));
}

export function getContactMatchDetails(a, b, deps) {
  const {
    getContactFaces,
    contactDistanceRatio,
    isTouchingTileStartBlockedPoints,
    blockedPointTouchRadius,
    isBlockedContactFace,
    oppositeNormalThreshold,
    faceTangentAlignment,
  } = deps;
  const aFaces = getContactFaces(a);
  const bFaces = getContactFaces(b);
  const threshold = Math.min(a.sideLength, b.sideLength) * contactDistanceRatio;
  const touchingFaceIndices = new Set();

  if (
    isTouchingTileStartBlockedPoints(a, b, blockedPointTouchRadius)
    || isTouchingTileStartBlockedPoints(b, a, blockedPointTouchRadius)
  ) {
    return {
      count: 0,
      matchedPairs: [],
      aFaces,
      bFaces,
      touchingFaceIndices: [],
    };
  }

  const aContinuity = getContinuityFaceIndexMap(aFaces);
  const bContinuity = getContinuityFaceIndexMap(bFaces);
  const candidates = [];
  for (let i = 0; i < aFaces.length; i += 1) {
    for (let j = 0; j < bFaces.length; j += 1) {
      const af = aFaces[i];
      const bf = bFaces[j];
      if (af.isWall || bf.isWall) continue;
      if (isBlockedContactFace(a, af) || isBlockedContactFace(b, bf)) continue;
      const normalDot = af.nx * bf.nx + af.ny * bf.ny;
      if (normalDot > oppositeNormalThreshold) continue;

      const tangentDot = Math.abs(af.tx * bf.tx + af.ty * bf.ty);
      if (tangentDot < faceTangentAlignment) continue;

      const midpointDistance = Math.hypot(af.mx - bf.mx, af.my - bf.my);
      if (midpointDistance > threshold) continue;
      touchingFaceIndices.add(i);

      const ci = aContinuity.indexMap.get(i);
      const cj = bContinuity.indexMap.get(j);
      if (ci == null || cj == null) continue;
      candidates.push({
        i: ci,
        j: cj,
        ai: i,
        bj: j,
        midpointDistance,
        normalDot,
      });
    }
  }

  candidates.sort((x, y) => x.midpointDistance - y.midpointDistance || x.normalDot - y.normalDot);

  const matchedPairs = getBestOrderedMatchedPairs(candidates, aContinuity.count, bContinuity.count);
  const matchedFaces = matchedPairs.length;

  return {
    count: matchedFaces * 2,
    matchedPairs,
    aFaces,
    bFaces,
    touchingFaceIndices: Array.from(touchingFaceIndices),
  };
}

export function countSideContacts(a, b, deps) {
  return getContactMatchDetails(a, b, deps).count;
}

export function findBestContact(tile, otherTiles, options, deps) {
  const {
    enforceEndTileMaxConnectedFaces,
    minContactPoints,
    hasPortalFlag,
    isTouchingMoltenEntranceBlockedPoints,
    getContactMatchDetails,
  } = deps;
  const enforceEndTileRule = Boolean(options?.enforceEndTileRule);
  const enforcePortalSpacing = Boolean(options?.enforcePortalSpacing);
  let best = { count: 0, other: null, match: null };
  const touchingFaceIdx = new Set();
  const connectedFaceIdx = new Set();
  const connectedPortalNeighbors = [];
  const tileHasPortal = enforcePortalSpacing && hasPortalFlag(tile);

  for (const other of otherTiles) {
    const match = getContactMatchDetails(tile, other);
    if (match.count > best.count) {
      best = {
        count: match.count,
        other,
        match,
      };
    }
    for (const faceIdx of match.touchingFaceIndices || []) {
      touchingFaceIdx.add(faceIdx);
    }
    for (const pair of match.matchedPairs || []) {
      if (Number.isInteger(pair?.i)) connectedFaceIdx.add(pair.i);
    }
    if (tileHasPortal && hasPortalFlag(other) && match.count > 0) {
      connectedPortalNeighbors.push(other);
    }
  }

  const touchesBlockedAB = isTouchingMoltenEntranceBlockedPoints(tile);
  const matchedTileFaceIdx = new Set((best.match?.matchedPairs || []).map((pair) => pair.i));
  const connectedFaceCount = connectedFaceIdx.size;
  const totalCount = best.count;
  const isEndTileCandidate = connectedFaceCount > 0 && connectedFaceCount <= enforceEndTileMaxConnectedFaces;
  const endTileDisallowed = enforceEndTileRule && isEndTileCandidate && !Boolean(tile.allowAsEndTile);
  return {
    valid: totalCount >= minContactPoints && !touchesBlockedAB && !endTileDisallowed,
    count: totalCount,
    other: best.other,
    match: best.match,
    faceIndices: Array.from(matchedTileFaceIdx),
    touchingFaceIndices: Array.from(touchingFaceIdx),
    connectedFaceCount,
    isEndTileCandidate,
    endTileDisallowed,
    connectedPortalNeighbors,
    hasWeakConnectedNeighbor: false,
    hasLinkedFaceException: false,
    touchesBlockedAB,
  };
}

export function getMatchAlignmentCorrection(match, snapPointGap) {
  if (!match?.matchedPairs?.length) return null;
  let dx = 0;
  let dy = 0;
  for (const pair of match.matchedPairs) {
    const a = match.aFaces[pair.i];
    const b = match.bFaces[pair.j];
    dx += b.mx - a.mx;
    dy += b.my - a.my;
  }

  const count = match.matchedPairs.length;
  let avgDx = dx / count;
  let avgDy = dy / count;
  const mag = Math.hypot(avgDx, avgDy);
  if (mag > 1e-6) {
    avgDx -= (avgDx / mag) * snapPointGap;
    avgDy -= (avgDy / mag) * snapPointGap;
  }
  return {
    dx: avgDx,
    dy: avgDy,
  };
}

export function getSideSamples(tile, getContactFaces) {
  return getContactFaces(tile).map((f) => ({
    px: f.mx,
    py: f.my,
    nx: f.nx,
    ny: f.ny,
  }));
}

export function isWorldPointOnOpaquePixel(tile, wx, wy, {
  tileSize,
  radius = 0,
  minAlpha = 24,
}) {
  if (!tile?.img || !tile.alphaMask) return false;
  const theta = (tile.rotation * Math.PI) / 180;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const dx = wx - tile.x;
  const dy = wy - tile.y;

  const lx = dx * cos + dy * sin;
  const ly = -dx * sin + dy * cos;

  const iw = tile.alphaMask.width || 0;
  const ih = tile.alphaMask.height || 0;
  if (!iw || !ih) return false;

  const pxCenter = ((lx / tileSize) + 0.5) * iw;
  const pyCenter = ((ly / tileSize) + 0.5) * ih;
  const sampleRadius = Math.max(0, Math.ceil((radius / tileSize) * Math.max(iw, ih)));

  const x0 = Math.max(0, Math.floor(pxCenter - sampleRadius));
  const x1 = Math.min(iw - 1, Math.ceil(pxCenter + sampleRadius));
  const y0 = Math.max(0, Math.floor(pyCenter - sampleRadius));
  const y1 = Math.min(ih - 1, Math.ceil(pyCenter + sampleRadius));

  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const alpha = tile.alphaMask.alpha[y * iw + x];
      if (alpha >= minAlpha) return true;
    }
  }
  return false;
}
