import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  snapTileCenterToHex,
  evaluatePlacementAt,
  computeBestSnap,
  getPlacedTileRotationState,
  getInvalidPlacedTileRotationReason,
  getPlacedTiles,
  getPlacedTilesExcluding,
  getPlacedRegularTileCount,
  getCandidateClearanceMetrics,
  findBestOpenHex,
  updatePlacementFeedback,
} from "../modules/tile-placement.js";

function makeCtx(overrides = {}) {
  return {
    SNAP_COORD_QUANTUM: 0.5,
    SNAP_SEARCH_RADIUS: 50,
    SNAP_VISUAL_GAP: 0,
    OPPOSITE_NORMAL_THRESHOLD: -0.1,
    TILE_SIZE: 100,
    MIN_CONTACT_POINTS: 4,
    END_TILE_MAX_CONNECTED_FACES: 3,
    ENTRANCE_TILE_ID: "entrance",
    BLOCKED_POINT_TOUCH_RADIUS: 4,
    OVERLAP_POLYGON_INSET_PX: 0,
    TILE_POSE_GEOMETRY_CACHE_LIMIT: 32,
    tilePoseGeometryCache: new WeakMap(),
    tileSideDirectionsCache: new WeakMap(),
    state: { tiles: new Map(), autoBuildPreviewPlacedCount: null },
    boardWidth: 200,
    boardHeight: 200,
    isEntranceTile: (tile) => tile.tileId === "entrance",
    getGuideFacePoints: (tile) => tile.guidePoints || [],
    snapBoardPointToHex: (x, y) => ({ x, y }),
    getSideDirectionsValue: (tile) => tile.sideDirs || [],
    findBestContactValue: () => ({
      valid: true,
      count: 4,
      faceIndices: [0, 1],
      touchingFaceIndices: [0, 1],
      connectedPortalNeighbors: [],
    }),
    hasAnyOverlapValue: () => false,
    hasPortalFlag: (tile) => Boolean(tile.portalFlag),
    getContactMatchDetailsValue: () => ({ count: 0, touchingFaceIndices: [], matchedPairs: [] }),
    countSideContactsValue: (a, b) => (
      Array.isArray(a.connectedTo) && a.connectedTo.includes(b.tileId) ? 1 : 0
    ),
    getTilePoseGeometryValue: (tile) => ({
      faces: tile.faces || [],
      world: tile.world || [],
      overlapPolygon: tile.overlapPolygon || [],
    }),
    normalizeAngle: (n) => ((n % 360) + 360) % 360,
    getWallFaceSignature: () => "",
    getPolygonBounds: () => ({}),
    buildInsetPolygonValue: (_tile, poly) => poly,
    getBoardHexLayout: () => ({ dx: 10, dy: 20, hexHeight: 10 }),
    clamp: (n, min, max) => Math.max(min, Math.min(max, n)),
    ...overrides,
  };
}

describe("snapTileCenterToHex", () => {
  it("snaps a regular tile without entrance offsets", () => {
    const tile = { tileId: "tile_01", rotation: 0 };
    const ctx = makeCtx({
      snapBoardPointToHex: (x, y) => ({ x: x + 0.13, y: y + 0.37 }),
    });

    const result = snapTileCenterToHex(tile, 10.12, 20.12, ctx);

    assert.deepEqual(result, { x: 10.5, y: 20.5 });
  });

  it("applies entrance anchor shift and entrance y offset", () => {
    const tile = {
      tileId: "entrance",
      rotation: 0,
      guidePoints: [{ x: 0, y: 10 }, { x: 0, y: 10 }],
    };
    const ctx = makeCtx({
      snapBoardPointToHex: (x, y) => ({ x, y }),
    });

    const result = snapTileCenterToHex(tile, 5, 7, ctx);

    assert.deepEqual(result, { x: 5, y: 19 });
  });
});

describe("evaluatePlacementAt", () => {
  it("returns a valid placement and restores tile position", () => {
    const tile = { tileId: "tile_01", x: 1, y: 2 };
    const ctx = makeCtx({
      findBestContactValue: () => ({
        valid: true,
        count: 4,
        faceIndices: [1, 2],
        touchingFaceIndices: [1, 2],
        connectedPortalNeighbors: [],
      }),
    });

    const result = evaluatePlacementAt(tile, [{ tileId: "other" }], 50, 60, ctx);

    assert.equal(tile.x, 1);
    assert.equal(tile.y, 2);
    assert.deepEqual(result, {
      valid: true,
      count: 4,
      overlaps: false,
      faceIndices: [1, 2],
      touchingFaceIndices: [1, 2],
      endTileDisallowed: false,
      touchesBlockedAB: false,
      portalConflict: false,
      portalConflictTileIds: [],
    });
  });

  it("flags portal conflicts as invalid", () => {
    const tile = { tileId: "tile_01", x: 0, y: 0 };
    const ctx = makeCtx({
      findBestContactValue: () => ({
        valid: true,
        count: 4,
        faceIndices: [0, 1],
        touchingFaceIndices: [0, 1],
        connectedPortalNeighbors: [{ tileId: "portal_b" }],
      }),
    });

    const result = evaluatePlacementAt(tile, [{ tileId: "portal_b" }], 20, 30, ctx);

    assert.equal(result.valid, false);
    assert.equal(result.portalConflict, true);
    assert.deepEqual(result.portalConflictTileIds, ["portal_b"]);
  });

  it("reports overlaps without mutating the tile position", () => {
    const tile = { tileId: "tile_01", x: 3, y: 4 };
    const ctx = makeCtx({
      hasAnyOverlapValue: () => true,
    });

    const result = evaluatePlacementAt(tile, [{ tileId: "other" }], 22, 33, ctx);

    assert.equal(tile.x, 3);
    assert.equal(tile.y, 4);
    assert.equal(result.overlaps, true);
  });

  it("preserves blocked-entrance invalid state even without touching face indices", () => {
    const tile = { tileId: "tile_01", x: 3, y: 4 };
    const ctx = makeCtx({
      findBestContactValue: () => ({
        valid: false,
        count: 0,
        faceIndices: [],
        touchingFaceIndices: [],
        connectedPortalNeighbors: [],
        touchesBlockedAB: true,
        endTileDisallowed: false,
      }),
    });

    const result = evaluatePlacementAt(tile, [{ tileId: "entrance" }], 22, 33, ctx);

    assert.equal(result.valid, false);
    assert.equal(result.touchesBlockedAB, true);
    assert.deepEqual(result.touchingFaceIndices, []);
  });
});

describe("computeBestSnap", () => {
  it("returns the closest valid snap candidate", () => {
    const tile = {
      tileId: "tile_01",
      sideDirs: [{ nx: 1, ny: 0, offset: 10 }],
    };
    const otherTiles = [
      { tileId: "a", x: 20, y: 0, sideDirs: [{ nx: -1, ny: 0, offset: 10 }] },
      { tileId: "b", x: 40, y: 0, sideDirs: [{ nx: -1, ny: 0, offset: 10 }] },
    ];
    const ctx = makeCtx();

    const result = computeBestSnap(
      tile,
      otherTiles,
      1,
      0,
      ctx,
      50,
      true,
      { evalFn: () => ({ valid: true, overlaps: false, count: 4 }) },
    );

    assert.ok(result);
    assert.equal(result.x, 0);
    assert.equal(result.y, 0);
    assert.equal(result.count, 4);
  });

  it("returns null when all candidates are outside maxDelta", () => {
    const tile = {
      tileId: "tile_01",
      sideDirs: [{ nx: 1, ny: 0, offset: 10 }],
    };
    const otherTiles = [
      { tileId: "a", x: 20, y: 0, sideDirs: [{ nx: -1, ny: 0, offset: 10 }] },
    ];
    const ctx = makeCtx();

    const result = computeBestSnap(
      tile,
      otherTiles,
      100,
      0,
      ctx,
      5,
      true,
      { evalFn: () => ({ valid: true, overlaps: false, count: 4 }) },
    );

    assert.equal(result, null);
  });

  it("prefers higher contact count when distance is effectively tied", () => {
    const tile = {
      tileId: "tile_01",
      sideDirs: [{ nx: 1, ny: 0, offset: 10 }],
    };
    const otherTiles = [
      { tileId: "low", x: 20, y: 0, sideDirs: [{ nx: -1, ny: 0, offset: 10 }] },
      { tileId: "high", x: 20.3, y: 0, sideDirs: [{ nx: -1, ny: 0, offset: 10 }] },
    ];
    const ctx = makeCtx();

    const result = computeBestSnap(
      tile,
      otherTiles,
      0,
      0,
      ctx,
      50,
      true,
      {
        evalFn: (x) => ({
          valid: true,
          overlaps: false,
          count: Math.abs(x) < 0.2 ? 4 : 6,
        }),
      },
    );

    assert.ok(result);
    assert.equal(result.count, 6);
    assert.ok(Math.abs(result.x - 0.3) < 1e-6);
  });

  it("rejects overlapping candidates when requireNoOverlap is true", () => {
    const tile = {
      tileId: "tile_01",
      sideDirs: [{ nx: 1, ny: 0, offset: 10 }],
    };
    const otherTiles = [
      { tileId: "a", x: 20, y: 0, sideDirs: [{ nx: -1, ny: 0, offset: 10 }] },
    ];
    const ctx = makeCtx();

    const strict = computeBestSnap(
      tile,
      otherTiles,
      0,
      0,
      ctx,
      50,
      true,
      { evalFn: () => ({ valid: true, overlaps: true, count: 4 }) },
    );
    const loose = computeBestSnap(
      tile,
      otherTiles,
      0,
      0,
      ctx,
      50,
      false,
      { evalFn: () => ({ valid: true, overlaps: true, count: 4 }) },
    );

    assert.equal(strict, null);
    assert.ok(loose);
    assert.equal(loose.x, 0);
  });
});

describe("rotation and state helpers", () => {
  it("returns invalid rotation state when overlap exists", () => {
    const tile = { tileId: "tile_01" };
    const ctx = makeCtx({
      findBestContactValue: () => ({
        valid: true,
        count: 4,
        faceIndices: [0, 1],
        touchingFaceIndices: [0, 1],
        connectedPortalNeighbors: [],
      }),
      hasAnyOverlapValue: () => true,
    });

    const result = getPlacedTileRotationState(tile, [{ tileId: "other" }], ctx);

    assert.equal(result.valid, false);
    assert.equal(result.overlaps, true);
  });

  it("reports overlap before generic invalid contact text", () => {
    assert.equal(
      getInvalidPlacedTileRotationReason({ overlaps: true, contact: { endTileDisallowed: true } }),
      "Tiles cannot overlap.",
    );
    assert.equal(
      getInvalidPlacedTileRotationReason({ overlaps: false, contact: { endTileDisallowed: true } }),
      "This tile is an end tile (3 connected faces) but is not marked as allowed for end placement in Tile Editor.",
    );
  });

  it("keeps blocked-entrance state on rotation results", () => {
    const tile = { tileId: "tile_01" };
    const ctx = makeCtx({
      findBestContactValue: () => ({
        valid: false,
        count: 0,
        faceIndices: [],
        touchingFaceIndices: [],
        connectedPortalNeighbors: [],
        touchesBlockedAB: true,
        endTileDisallowed: false,
      }),
    });

    const result = getPlacedTileRotationState(tile, [{ tileId: "entrance" }], ctx);

    assert.equal(result.valid, false);
    assert.equal(result.touchesBlockedAB, true);
  });

  it("collects placed tiles and excludes the requested tile", () => {
    const ctx = makeCtx();
    const tileA = { tileId: "a", placed: true };
    const tileB = { tileId: "b", placed: false };
    const tileC = { tileId: "c", placed: true };
    ctx.state.tiles = new Map([["a", tileA], ["b", tileB], ["c", tileC]]);

    assert.deepEqual(getPlacedTiles(ctx), [tileA, tileC]);
    assert.deepEqual(getPlacedTilesExcluding(tileA, ctx), [tileC]);
  });

  it("counts placed regular tiles unless preview count is set", () => {
    const ctx = makeCtx();
    const entrance = { tileId: "entrance", placed: true };
    const tileA = { tileId: "a", placed: true };
    const tileB = { tileId: "b", placed: true };
    const tileC = { tileId: "c", placed: false };
    ctx.state.tiles = new Map([
      ["entrance", entrance],
      ["a", tileA],
      ["b", tileB],
      ["c", tileC],
    ]);

    assert.equal(getPlacedRegularTileCount(ctx), 2);
    ctx.state.autoBuildPreviewPlacedCount = 5;
    assert.equal(getPlacedRegularTileCount(ctx), 5);
  });
});

describe("feedback retention", () => {
  it("keeps invalid feedback for blocked entrance contacts with no touching faces", () => {
    const classSet = new Set();
    const tile = {
      tileId: "tile_01",
      dom: {
        classList: {
          add: (...names) => names.forEach((name) => classSet.add(name)),
          remove: (...names) => names.forEach((name) => classSet.delete(name)),
        },
      },
      guideDom: {
        querySelectorAll: () => [],
        classList: { toggle: () => {} },
      },
      drag: {
        feedbackInsideBoard: true,
        feedbackCandidateX: 20,
        feedbackCandidateY: 30,
        placedTilesExcludingSelf: [{ tileId: "entrance" }],
        feedbackCache: null,
      },
    };
    const ctx = makeCtx({
      findBestContactValue: () => ({
        valid: false,
        count: 0,
        faceIndices: [],
        touchingFaceIndices: [],
        connectedPortalNeighbors: [],
        touchesBlockedAB: true,
        endTileDisallowed: false,
      }),
    });

    updatePlacementFeedback(tile, ctx);
    assert.equal(classSet.has("invalid-placement"), true);
  });
});

describe("clearance and open-hex search", () => {
  it("computes clearance metrics and restores tile position", () => {
    const tile = {
      tileId: "tile_01",
      x: 1,
      y: 2,
      faces: [{ mx: 10, my: 10 }, { mx: 20, my: 20 }],
    };
    const otherTiles = [
      { tileId: "a", x: 4, y: 6, faces: [{ mx: 12, my: 14 }] },
      { tileId: "b", x: 10, y: 2, faces: [{ mx: 30, my: 30 }] },
    ];
    const ctx = makeCtx();

    const result = getCandidateClearanceMetrics(tile, otherTiles, 3, 4, ctx);

    assert.equal(tile.x, 1);
    assert.equal(tile.y, 2);
    assert.ok(Math.abs(result.minCenterDist - Math.sqrt(5)) < 1e-9);
    assert.ok(Math.abs(result.avgCenterDist - ((Math.sqrt(5) + Math.sqrt(53)) / 2)) < 1e-9);
    assert.ok(Math.abs(result.minFaceDist - Math.sqrt(20)) < 1e-9);
  });

  it("returns the first strict open hex candidate and restores tile position", () => {
    const tile = {
      tileId: "tile_01",
      x: 5,
      y: 6,
      rotation: 0,
      faces: [{ mx: 0, my: 0 }],
    };
    const placedTiles = [
      { tileId: "anchor", x: 100, y: 100, faces: [{ mx: 100, my: 100 }] },
    ];
    const ctx = makeCtx({
      snapBoardPointToHex: (x, y) => ({ x, y }),
    });

    const result = findBestOpenHex(tile, placedTiles, 20, 20, ctx);

    assert.deepEqual(result, { x: 20, y: 20 });
    assert.equal(tile.x, 5);
    assert.equal(tile.y, 6);
  });

  it("falls back to the snapped start when every candidate overlaps", () => {
    const tile = { tileId: "tile_01", x: 9, y: 11, rotation: 0 };
    const ctx = makeCtx({
      snapBoardPointToHex: (x, y) => ({ x: x + 1, y: y + 2 }),
      hasAnyOverlapValue: () => true,
    });

    const result = findBestOpenHex(tile, [{ tileId: "other", x: 0, y: 0 }], 20, 30, ctx);

    assert.deepEqual(result, { x: 21, y: 32 });
    assert.equal(tile.x, 9);
    assert.equal(tile.y, 11);
  });
});
