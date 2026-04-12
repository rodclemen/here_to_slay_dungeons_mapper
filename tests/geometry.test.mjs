import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  normalizeAngle,
  shuffle,
  clamp,
  dist,
  getPolygonBounds,
  boundsOverlap,
  pointInPolygonStrict,
  polygonsOverlap,
} from "../modules/geometry-utils.js";

import {
  getContinuityFaceIndexMap,
  getBestOrderedMatchedPairs,
  getMatchAlignmentCorrection,
} from "../modules/contact-analysis.js";

import { buildInsetPolygon } from "../modules/tile-pose.js";

import {
  worldToBoardScreen,
  quantizeBoardZoom,
  snapBoardPointToHex,
  createBoardHexLayout,
} from "../modules/board-math.js";

// ---------------------------------------------------------------------------
// geometry-utils.js
// ---------------------------------------------------------------------------

describe("normalizeAngle", () => {
  it("returns 0 for 0", () => {
    assert.equal(normalizeAngle(0), 0);
  });

  it("returns 0 for 360", () => {
    assert.equal(normalizeAngle(360), 0);
  });

  it("wraps negative angles", () => {
    assert.equal(normalizeAngle(-60), 300);
    assert.equal(normalizeAngle(-1), 359);
  });

  it("returns 0 (or -0) for -360", () => {
    // -360 % 360 produces -0 in JS; normalizeAngle doesn't distinguish
    assert.equal(normalizeAngle(-360) + 0, 0);
  });

  it("wraps angles above 360", () => {
    assert.equal(normalizeAngle(420), 60);
    assert.equal(normalizeAngle(720), 0);
  });

  it("leaves angles in range unchanged", () => {
    assert.equal(normalizeAngle(180), 180);
    assert.equal(normalizeAngle(59.5), 59.5);
  });
});

describe("clamp", () => {
  it("returns value when within range", () => {
    assert.equal(clamp(5, 0, 10), 5);
  });

  it("clamps to min", () => {
    assert.equal(clamp(-5, 0, 10), 0);
  });

  it("clamps to max", () => {
    assert.equal(clamp(15, 0, 10), 10);
  });

  it("handles equal min and max", () => {
    assert.equal(clamp(5, 3, 3), 3);
  });
});

describe("dist", () => {
  it("returns 0 for same point", () => {
    assert.equal(dist({ px: 5, py: 5 }, { px: 5, py: 5 }), 0);
  });

  it("computes horizontal distance", () => {
    assert.equal(dist({ px: 0, py: 0 }, { px: 3, py: 0 }), 3);
  });

  it("computes vertical distance", () => {
    assert.equal(dist({ px: 0, py: 0 }, { px: 0, py: 4 }), 4);
  });

  it("computes diagonal distance (3-4-5 triangle)", () => {
    assert.equal(dist({ px: 0, py: 0 }, { px: 3, py: 4 }), 5);
  });
});

describe("getPolygonBounds", () => {
  it("returns bounds for a triangle", () => {
    const poly = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 8 }];
    const b = getPolygonBounds(poly);
    assert.equal(b.minX, 0);
    assert.equal(b.maxX, 10);
    assert.equal(b.minY, 0);
    assert.equal(b.maxY, 8);
  });

  it("handles single point", () => {
    const b = getPolygonBounds([{ x: 3, y: 7 }]);
    assert.equal(b.minX, 3);
    assert.equal(b.maxX, 3);
    assert.equal(b.minY, 7);
    assert.equal(b.maxY, 7);
  });

  it("handles empty/null polygon", () => {
    const b = getPolygonBounds(null);
    assert.equal(b.minX, Number.POSITIVE_INFINITY);
    assert.equal(b.maxX, Number.NEGATIVE_INFINITY);
  });

  it("handles negative coordinates", () => {
    const poly = [{ x: -5, y: -3 }, { x: 2, y: -1 }, { x: -1, y: 4 }];
    const b = getPolygonBounds(poly);
    assert.equal(b.minX, -5);
    assert.equal(b.maxX, 2);
    assert.equal(b.minY, -3);
    assert.equal(b.maxY, 4);
  });
});

describe("boundsOverlap", () => {
  it("detects overlapping bounds", () => {
    const a = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
    const b = { minX: 5, minY: 5, maxX: 15, maxY: 15 };
    assert.equal(boundsOverlap(a, b), true);
  });

  it("rejects non-overlapping bounds", () => {
    const a = { minX: 0, minY: 0, maxX: 5, maxY: 5 };
    const b = { minX: 10, minY: 10, maxX: 15, maxY: 15 };
    assert.equal(boundsOverlap(a, b), false);
  });

  it("rejects touching edges (not strictly overlapping)", () => {
    const a = { minX: 0, minY: 0, maxX: 5, maxY: 5 };
    const b = { minX: 5, minY: 0, maxX: 10, maxY: 5 };
    assert.equal(boundsOverlap(a, b), false);
  });

  it("handles contained bounds", () => {
    const a = { minX: 0, minY: 0, maxX: 20, maxY: 20 };
    const b = { minX: 5, minY: 5, maxX: 10, maxY: 10 };
    assert.equal(boundsOverlap(a, b), true);
  });

  it("returns false for null inputs", () => {
    assert.equal(boundsOverlap(null, { minX: 0, minY: 0, maxX: 1, maxY: 1 }), false);
    assert.equal(boundsOverlap(null, null), false);
  });
});

describe("pointInPolygonStrict", () => {
  const square = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ];

  it("returns true for point inside", () => {
    assert.equal(pointInPolygonStrict({ x: 5, y: 5 }, square), true);
  });

  it("returns false for point outside", () => {
    assert.equal(pointInPolygonStrict({ x: 15, y: 5 }, square), false);
  });

  it("returns false for point on vertex (strict)", () => {
    assert.equal(pointInPolygonStrict({ x: 0, y: 0 }, square), false);
  });

  it("returns false for point on edge (strict)", () => {
    assert.equal(pointInPolygonStrict({ x: 5, y: 0 }, square), false);
  });

  it("works with a triangle", () => {
    const tri = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 10 }];
    assert.equal(pointInPolygonStrict({ x: 5, y: 3 }, tri), true);
    assert.equal(pointInPolygonStrict({ x: 0, y: 10 }, tri), false);
  });

  it("returns false for point far away", () => {
    assert.equal(pointInPolygonStrict({ x: 1000, y: 1000 }, square), false);
  });
});

describe("polygonsOverlap", () => {
  it("detects crossing polygons", () => {
    const a = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];
    const b = [{ x: 5, y: 5 }, { x: 15, y: 5 }, { x: 15, y: 15 }, { x: 5, y: 15 }];
    assert.equal(polygonsOverlap(a, b), true);
  });

  it("detects contained polygon", () => {
    const outer = [{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 20 }, { x: 0, y: 20 }];
    const inner = [{ x: 5, y: 5 }, { x: 10, y: 5 }, { x: 10, y: 10 }, { x: 5, y: 10 }];
    assert.equal(polygonsOverlap(outer, inner), true);
  });

  it("rejects separated polygons", () => {
    const a = [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }, { x: 0, y: 5 }];
    const b = [{ x: 10, y: 10 }, { x: 15, y: 10 }, { x: 15, y: 15 }, { x: 10, y: 15 }];
    assert.equal(polygonsOverlap(a, b), false);
  });

  it("rejects edge-touching polygons (strict)", () => {
    const a = [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }, { x: 0, y: 5 }];
    const b = [{ x: 5, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 5 }, { x: 5, y: 5 }];
    assert.equal(polygonsOverlap(a, b), false);
  });

  it("detects overlap with triangles", () => {
    const a = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 10 }];
    const b = [{ x: 3, y: 2 }, { x: 7, y: 2 }, { x: 5, y: 8 }];
    assert.equal(polygonsOverlap(a, b), true);
  });
});

describe("shuffle", () => {
  it("returns a new array of the same length", () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    assert.equal(result.length, input.length);
    assert.notEqual(result, input);
  });

  it("contains the same elements", () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    assert.deepEqual(result.sort(), input.sort());
  });

  it("does not mutate the original", () => {
    const input = [1, 2, 3];
    const copy = [...input];
    shuffle(input);
    assert.deepEqual(input, copy);
  });

  it("handles empty array", () => {
    assert.deepEqual(shuffle([]), []);
  });

  it("handles single element", () => {
    assert.deepEqual(shuffle([42]), [42]);
  });
});

// ---------------------------------------------------------------------------
// contact-analysis.js
// ---------------------------------------------------------------------------

describe("getContinuityFaceIndexMap", () => {
  it("maps non-wall faces to sequential indices", () => {
    const faces = [
      { isWall: false },
      { isWall: true },
      { isWall: false },
      { isWall: false },
    ];
    const { indexMap, count } = getContinuityFaceIndexMap(faces);
    assert.equal(count, 3);
    assert.equal(indexMap.get(0), 0);
    assert.equal(indexMap.has(1), false);
    assert.equal(indexMap.get(2), 1);
    assert.equal(indexMap.get(3), 2);
  });

  it("returns empty map when all faces are walls", () => {
    const faces = [{ isWall: true }, { isWall: true }];
    const { indexMap, count } = getContinuityFaceIndexMap(faces);
    assert.equal(count, 0);
    assert.equal(indexMap.size, 0);
  });

  it("handles no walls", () => {
    const faces = [{ isWall: false }, { isWall: false }, { isWall: false }];
    const { indexMap, count } = getContinuityFaceIndexMap(faces);
    assert.equal(count, 3);
    assert.equal(indexMap.get(0), 0);
    assert.equal(indexMap.get(1), 1);
    assert.equal(indexMap.get(2), 2);
  });

  it("handles empty faces array", () => {
    const { indexMap, count } = getContinuityFaceIndexMap([]);
    assert.equal(count, 0);
    assert.equal(indexMap.size, 0);
  });
});

describe("getBestOrderedMatchedPairs", () => {
  it("returns empty for empty candidates", () => {
    assert.deepEqual(getBestOrderedMatchedPairs([], 6, 6), []);
  });

  it("returns a single pair for a single candidate", () => {
    const candidates = [{ i: 0, j: 0, ai: 2, bj: 5, midpointDistance: 1 }];
    const result = getBestOrderedMatchedPairs(candidates, 6, 6);
    assert.equal(result.length, 1);
    assert.deepEqual(result[0], { i: 2, j: 5 });
  });

  it("finds ordered chain from multiple candidates", () => {
    const candidates = [
      { i: 0, j: 3, ai: 0, bj: 3, midpointDistance: 1 },
      { i: 1, j: 2, ai: 1, bj: 2, midpointDistance: 1 },
      { i: 2, j: 1, ai: 2, bj: 1, midpointDistance: 1 },
    ];
    const result = getBestOrderedMatchedPairs(candidates, 6, 6);
    assert.ok(result.length >= 1);
  });

  it("prefers closer midpoints for same-length chains", () => {
    const candidates = [
      { i: 0, j: 0, ai: 0, bj: 0, midpointDistance: 10 },
      { i: 0, j: 0, ai: 0, bj: 0, midpointDistance: 1 },
    ];
    const result = getBestOrderedMatchedPairs(candidates, 3, 3);
    assert.equal(result.length, 1);
  });
});

describe("getMatchAlignmentCorrection", () => {
  it("returns null for empty match", () => {
    assert.equal(getMatchAlignmentCorrection(null, 0.5), null);
    assert.equal(getMatchAlignmentCorrection({ matchedPairs: [] }, 0.5), null);
  });

  it("computes correction for a single pair", () => {
    const match = {
      matchedPairs: [{ i: 0, j: 1 }],
      aFaces: [{ mx: 10, my: 10 }],
      bFaces: [null, { mx: 12, my: 10 }],
    };
    const result = getMatchAlignmentCorrection(match, 0);
    assert.ok(result);
    assert.ok(Math.abs(result.dx - 2) < 0.01);
    assert.ok(Math.abs(result.dy) < 0.01);
  });

  it("averages correction across multiple pairs", () => {
    const match = {
      matchedPairs: [{ i: 0, j: 0 }, { i: 1, j: 1 }],
      aFaces: [{ mx: 0, my: 0 }, { mx: 10, my: 0 }],
      bFaces: [{ mx: 2, my: 0 }, { mx: 14, my: 0 }],
    };
    const result = getMatchAlignmentCorrection(match, 0);
    assert.ok(result);
    assert.ok(Math.abs(result.dx - 3) < 0.01);
    assert.ok(Math.abs(result.dy) < 0.01);
  });

  it("subtracts snapPointGap from the correction magnitude", () => {
    const match = {
      matchedPairs: [{ i: 0, j: 0 }],
      aFaces: [{ mx: 0, my: 0 }],
      bFaces: [{ mx: 10, my: 0 }],
    };
    const withGap = getMatchAlignmentCorrection(match, 2);
    assert.ok(withGap);
    assert.ok(Math.abs(withGap.dx - 8) < 0.01);
  });
});

// ---------------------------------------------------------------------------
// tile-pose.js
// ---------------------------------------------------------------------------

describe("buildInsetPolygon", () => {
  const tile = { x: 50, y: 50 };
  const square = [
    { x: 40, y: 40 },
    { x: 60, y: 40 },
    { x: 60, y: 60 },
    { x: 40, y: 60 },
  ];

  it("returns original polygon when inset is 0", () => {
    const result = buildInsetPolygon(tile, square, 0);
    assert.deepEqual(result, square);
  });

  it("returns original polygon when inset is negative", () => {
    const result = buildInsetPolygon(tile, square, -5);
    assert.deepEqual(result, square);
  });

  it("shrinks polygon toward tile center", () => {
    const result = buildInsetPolygon(tile, square, 2);
    assert.equal(result.length, 4);
    for (const point of result) {
      const dx = Math.abs(point.x - 50);
      const dy = Math.abs(point.y - 50);
      assert.ok(dx < 10, "inset point should be closer to center on x");
      assert.ok(dy < 10, "inset point should be closer to center on y");
      assert.ok(dx > 0, "inset point should not collapse to center");
    }
  });

  it("handles point at tile center (collapses toward half)", () => {
    const poly = [{ x: 50, y: 50 }, { x: 60, y: 40 }];
    const result = buildInsetPolygon(tile, poly, 5);
    assert.equal(result[0].x, 50);
    assert.equal(result[0].y, 50);
  });

  it("handles null polygon", () => {
    const result = buildInsetPolygon(tile, null, 3);
    assert.deepEqual(result, []);
  });
});

// ---------------------------------------------------------------------------
// board-math.js
// ---------------------------------------------------------------------------

describe("worldToBoardScreen", () => {
  it("returns value unchanged at zoom 1", () => {
    assert.equal(worldToBoardScreen(100, 1), 100);
  });

  it("scales by zoom", () => {
    assert.equal(worldToBoardScreen(100, 2), 200);
    assert.equal(worldToBoardScreen(100, 0.5), 50);
  });

  it("defaults to zoom 1", () => {
    assert.equal(worldToBoardScreen(75), 75);
  });
});

describe("quantizeBoardZoom", () => {
  const deps = { clamp, min: 0.7, max: 1.8, step: 0.01 };

  it("clamps below min", () => {
    assert.ok(Math.abs(quantizeBoardZoom(0.3, deps) - 0.7) < 1e-9);
  });

  it("clamps above max", () => {
    assert.equal(quantizeBoardZoom(2.5, deps), 1.8);
  });

  it("quantizes to step", () => {
    const result = quantizeBoardZoom(1.005, deps);
    assert.ok(Math.abs(result - 1.01) < 1e-9 || Math.abs(result - 1.0) < 1e-9);
  });

  it("returns exact value when already on step", () => {
    assert.ok(Math.abs(quantizeBoardZoom(1.0, deps) - 1.0) < 1e-9);
  });
});

describe("createBoardHexLayout", () => {
  const sqrt3 = Math.sqrt(3);

  it("produces valid layout for reasonable dimensions", () => {
    const { w, h, layout } = createBoardHexLayout({
      width: 1200,
      height: 800,
      boardScale: 1.15,
      boardItemScale: 1,
      sqrt3,
    });
    assert.equal(w, 1200);
    assert.equal(h, 800);
    assert.ok(layout.radius > 0);
    assert.ok(layout.hexHeight > 0);
    assert.ok(layout.dx > 0);
    assert.ok(layout.dy > 0);
    assert.ok(layout.minX < layout.maxX);
    assert.ok(layout.minY < layout.maxY);
  });

  it("handles very small dimensions", () => {
    const { layout } = createBoardHexLayout({
      width: 100,
      height: 100,
      boardScale: 1,
      boardItemScale: 1,
      sqrt3,
    });
    assert.ok(layout.radius > 0);
  });

  it("handles zero dimensions", () => {
    const { w, h } = createBoardHexLayout({
      width: 0,
      height: 0,
      boardScale: 1,
      boardItemScale: 1,
      sqrt3,
    });
    assert.equal(w, 0);
    assert.equal(h, 0);
  });
});

describe("snapBoardPointToHex", () => {
  const sqrt3 = Math.sqrt(3);
  const { layout } = createBoardHexLayout({
    width: 1200,
    height: 800,
    boardScale: 1.15,
    boardItemScale: 1,
    sqrt3,
  });
  const deps = {
    layout,
    panX: 0,
    panY: 0,
    quantizeSnapCoord: (v) => Math.round(v * 100) / 100,
  };

  it("snaps a point to a hex center", () => {
    const result = snapBoardPointToHex(200, 200, deps);
    assert.ok(Number.isFinite(result.x));
    assert.ok(Number.isFinite(result.y));
  });

  it("snapping the same point twice gives the same result", () => {
    const a = snapBoardPointToHex(350, 400, deps);
    const b = snapBoardPointToHex(350, 400, deps);
    assert.equal(a.x, b.x);
    assert.equal(a.y, b.y);
  });

  it("nearby points snap to the same hex", () => {
    const a = snapBoardPointToHex(300, 300, deps);
    const b = snapBoardPointToHex(302, 301, deps);
    assert.equal(a.x, b.x);
    assert.equal(a.y, b.y);
  });

  it("respects pan offset", () => {
    const panDeps = { ...deps, panX: 100, panY: 100 };
    const noPan = snapBoardPointToHex(300, 300, deps);
    const withPan = snapBoardPointToHex(300, 300, panDeps);
    assert.ok(noPan.x !== withPan.x || noPan.y !== withPan.y);
  });

  it("returns input when layout is invalid", () => {
    const badDeps = {
      ...deps,
      layout: { minX: 100, maxX: 50, minY: 0, maxY: 100 },
    };
    const result = snapBoardPointToHex(42, 77, badDeps);
    assert.equal(result.x, 42);
    assert.equal(result.y, 77);
  });
});
