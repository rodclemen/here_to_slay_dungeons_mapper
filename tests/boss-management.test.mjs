import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  buildBossAssetKey,
  parseBossAssetKey,
  getBossKeyForLegacySrc,
  pushBossBackToPile,
  rotateAllBossesPileTop,
  getAvailableBossSources,
} from "../modules/boss-management.js";

// ── Pure helpers ──────────────────────────────────────────────────────────────

describe("buildBossAssetKey", () => {
  it("produces a colon-delimited key", () => {
    assert.equal(buildBossAssetKey("molten", "dragon"), "molten:boss:dragon");
  });

  it("handles bossId containing colons", () => {
    assert.equal(buildBossAssetKey("set", "a:b"), "set:boss:a:b");
  });

  it("handles empty strings", () => {
    assert.equal(buildBossAssetKey("", ""), ":boss:");
  });
});

describe("parseBossAssetKey", () => {
  it("parses a valid key into tileSetId and bossId", () => {
    assert.deepEqual(parseBossAssetKey("molten:boss:dragon"), {
      tileSetId: "molten",
      bossId: "dragon",
    });
  });

  it("returns null for a key with no boss segment", () => {
    assert.equal(parseBossAssetKey("molten:dragon"), null);
  });

  it("returns null for an empty string", () => {
    assert.equal(parseBossAssetKey(""), null);
  });

  it("returns null for null/undefined input", () => {
    assert.equal(parseBossAssetKey(null), null);
    assert.equal(parseBossAssetKey(undefined), null);
  });

  it("round-trips with buildBossAssetKey", () => {
    const key = buildBossAssetKey("molten", "dragon");
    const parsed = parseBossAssetKey(key);
    assert.equal(parsed.tileSetId, "molten");
    assert.equal(parsed.bossId, "dragon");
  });

  it("round-trips when bossId contains colons", () => {
    const key = buildBossAssetKey("set", "a:b");
    const parsed = parseBossAssetKey(key);
    assert.equal(parsed.tileSetId, "set");
    assert.equal(parsed.bossId, "a:b");
  });
});

// ── getBossKeyForLegacySrc ────────────────────────────────────────────────────

function makeRegistryCtx(tileSets = [], selectedTileSetId = "molten") {
  return {
    state: { selectedTileSetId },
    getTileSetRegistry: () => tileSets,
    getTileSetConfig: (id) => tileSets.find((ts) => ts.id === id) || null,
    resolveTileSetAssetPath: (tileSetIdOrObj, kind, assetId) => {
      const id = typeof tileSetIdOrObj === "string" ? tileSetIdOrObj : tileSetIdOrObj?.id;
      return `assets/${id}/${kind}/${assetId}.png`;
    },
  };
}

describe("getBossKeyForLegacySrc", () => {
  it("returns null-like empty string for an unknown src with no fallback bosses", () => {
    const ctx = makeRegistryCtx([{ id: "molten", bossIds: [] }]);
    const result = getBossKeyForLegacySrc("assets/unknown/boss/x.png", ctx);
    assert.equal(result, "");
  });

  it("returns the first boss key of the fallback tile set when src is unknown", () => {
    const ctx = makeRegistryCtx([{ id: "molten", bossIds: ["dragon", "lich"] }]);
    const result = getBossKeyForLegacySrc("assets/unknown/boss/x.png", ctx);
    assert.equal(result, "molten:boss:dragon");
  });

  it("returns the matching boss key when src matches a known boss", () => {
    const ctx = makeRegistryCtx([{ id: "molten", bossIds: ["dragon", "lich"] }]);
    const result = getBossKeyForLegacySrc("assets/molten/boss/lich.png", ctx);
    assert.equal(result, "molten:boss:lich");
  });

  it("searches all tile sets, not just the fallback", () => {
    const ctx = makeRegistryCtx([
      { id: "molten", bossIds: ["dragon"] },
      { id: "other", bossIds: ["hydra"] },
    ], "molten");
    const result = getBossKeyForLegacySrc("assets/other/boss/hydra.png", ctx);
    assert.equal(result, "other:boss:hydra");
  });

  it("uses the explicit fallbackTileSetId argument", () => {
    const ctx = makeRegistryCtx([
      { id: "molten", bossIds: ["dragon"] },
      { id: "icy", bossIds: ["yeti", "golem"] },
    ], "molten");
    const result = getBossKeyForLegacySrc("assets/unknown/boss/x.png", ctx, "icy");
    assert.equal(result, "icy:boss:yeti");
  });
});

// ── Pile ordering: pushBossBackToPile ─────────────────────────────────────────

function makePileCtx(overrides = {}) {
  return {
    state: {
      selectedTileSetId: "molten",
      useAllBosses: false,
      bossPileOrderByTileSet: {},
      allBossesPileOrder: [],
      bossTokens: [],
      ...overrides.state,
    },
    getBossTileSources: null,          // not needed for push tests
    normalizeOrderedSources: (canonical, existing) => {
      const extra = existing.filter((x) => !canonical.includes(x));
      return [...canonical, ...extra];
    },
    rotatePileTop: (order) => {
      if (order.length < 2) return order;
      const [first, ...rest] = order;
      return [...rest, first];
    },
    shuffle: (arr) => [...arr],
    ...overrides,
  };
}

describe("pushBossBackToPile", () => {
  it("appends the key to the end of the single-set pile", () => {
    const ctx = makePileCtx({
      state: {
        selectedTileSetId: "molten",
        useAllBosses: false,
        bossPileOrderByTileSet: { molten: ["molten:boss:lich", "molten:boss:dragon"] },
        allBossesPileOrder: [],
        bossTokens: [],
      },
    });
    // Override getBossTileSources so ensureBossPileOrder returns the stored order.
    ctx.getBossTileSources = null;
    // Patch ensureBossPileOrder side-effect: the stored order IS the canonical.
    ctx.getBossTileSourcesValue = () => ["molten:boss:dragon", "molten:boss:lich"];
    ctx.getTileSetConfig = () => ({ id: "molten", bossIds: ["dragon", "lich"] });
    ctx.resolveTileSetAssetPath = () => "x";
    ctx.buildAllBossTileSources = null;
    ctx.getReadyTileSets = null;

    // Directly test the array-manipulation logic by seeding the pile.
    pushBossBackToPile("molten:boss:dragon", ctx, "molten");

    // dragon should move from wherever it is to the end.
    const order = ctx.state.bossPileOrderByTileSet["molten"];
    assert.equal(order[order.length - 1], "molten:boss:dragon");
  });

  it("does not duplicate the key", () => {
    const ctx = makePileCtx({
      state: {
        selectedTileSetId: "molten",
        useAllBosses: false,
        bossPileOrderByTileSet: { molten: ["molten:boss:dragon", "molten:boss:lich"] },
        allBossesPileOrder: [],
        bossTokens: [],
      },
    });
    ctx.getTileSetConfig = () => ({ id: "molten", bossIds: ["dragon", "lich"] });
    ctx.resolveTileSetAssetPath = () => "x";
    ctx.getBossTileSourcesValue = () => ["molten:boss:dragon", "molten:boss:lich"];

    pushBossBackToPile("molten:boss:dragon", ctx, "molten");
    const order = ctx.state.bossPileOrderByTileSet["molten"];
    const count = order.filter((k) => k === "molten:boss:dragon").length;
    assert.equal(count, 1);
  });

  it("appends to the all-bosses pile when useAllBosses is true", () => {
    const ctx = makePileCtx({
      state: {
        selectedTileSetId: "molten",
        useAllBosses: true,
        bossPileOrderByTileSet: {},
        allBossesPileOrder: ["molten:boss:lich", "molten:boss:dragon"],
        bossTokens: [],
      },
    });
    ctx.buildAllBossTileSources = (_tileSets, _getter) =>
      ["molten:boss:dragon", "molten:boss:lich"];
    ctx.getReadyTileSets = () => [{ id: "molten" }];
    ctx.getTileSetConfig = () => ({ id: "molten", bossIds: ["dragon", "lich"] });
    ctx.resolveTileSetAssetPath = () => "x";
    ctx.getBossTileSourcesValue = () => ["molten:boss:dragon", "molten:boss:lich"];

    pushBossBackToPile("molten:boss:lich", ctx, "molten");

    const order = ctx.state.allBossesPileOrder;
    assert.equal(order[order.length - 1], "molten:boss:lich");
    assert.equal(order.filter((k) => k === "molten:boss:lich").length, 1);
  });
});

// ── Pile ordering: rotateAllBossesPileTop ─────────────────────────────────────

function makeAllBossesCtx(allBossesPileOrder, bossTokens = [], overrides = {}) {
  const state = {
    selectedTileSetId: "molten",
    useAllBosses: true,
    bossPileOrderByTileSet: {},
    allBossesPileOrder: [...allBossesPileOrder],
    bossTokens,
    ...overrides.state,
  };
  return {
    state,
    normalizeOrderedSources: (canonical, existing) => {
      const extra = existing.filter((x) => !canonical.includes(x));
      return [...canonical, ...extra];
    },
    shuffle: (arr) => [...arr],
    buildAllBossTileSources: (_tileSets, getter) => {
      const result = [];
      for (const ts of _tileSets) result.push(...getter(ts.id));
      return result;
    },
    getReadyTileSets: () => [],
    getTileSetConfig: () => null,
    resolveTileSetAssetPath: () => "x",
    getBossTileSourcesValue: () => [],
    ...overrides,
  };
}

describe("rotateAllBossesPileTop", () => {
  it("moves the last non-placed boss to the front", () => {
    const ctx = makeAllBossesCtx(
      ["a:boss:alpha", "b:boss:beta", "c:boss:gamma"],
    );
    rotateAllBossesPileTop(ctx);
    // gamma was the visible top (end) — should now be at index 0.
    assert.equal(ctx.state.allBossesPileOrder[0], "c:boss:gamma");
  });

  it("skips placed tokens when finding the visible top", () => {
    const ctx = makeAllBossesCtx(
      ["a:boss:alpha", "b:boss:beta", "c:boss:gamma"],
      [{ bossKey: "c:boss:gamma" }], // gamma is placed
    );
    rotateAllBossesPileTop(ctx);
    // beta was the visible top — should be moved to front.
    assert.equal(ctx.state.allBossesPileOrder[0], "b:boss:beta");
  });

  it("does nothing when all bosses are placed (no visible top)", () => {
    const order = ["a:boss:alpha", "b:boss:beta"];
    const ctx = makeAllBossesCtx(
      order,
      [{ bossKey: "a:boss:alpha" }, { bossKey: "b:boss:beta" }],
    );
    rotateAllBossesPileTop(ctx);
    assert.deepEqual(ctx.state.allBossesPileOrder, order);
  });

  it("does nothing for a single-boss unplaced pile", () => {
    const ctx = makeAllBossesCtx(["a:boss:only"]);
    rotateAllBossesPileTop(ctx);
    assert.deepEqual(ctx.state.allBossesPileOrder, ["a:boss:only"]);
  });

  it("preserves all keys after rotation (no duplicates, no drops)", () => {
    const original = ["a:boss:alpha", "b:boss:beta", "c:boss:gamma"];
    const ctx = makeAllBossesCtx([...original]);
    rotateAllBossesPileTop(ctx);
    const result = ctx.state.allBossesPileOrder;
    assert.equal(result.length, original.length);
    for (const key of original) {
      assert.ok(result.includes(key), `missing key: ${key}`);
    }
  });
});

// ── getAvailableBossSources ───────────────────────────────────────────────────

describe("getAvailableBossSources", () => {
  it("excludes placed tokens from the available list (single-set mode)", () => {
    const ctx = makePileCtx({
      state: {
        selectedTileSetId: "molten",
        useAllBosses: false,
        bossPileOrderByTileSet: {
          molten: ["molten:boss:dragon", "molten:boss:lich", "molten:boss:golem"],
        },
        allBossesPileOrder: [],
        bossTokens: [{ bossKey: "molten:boss:lich" }],
      },
    });
    ctx.getTileSetConfig = () => ({ id: "molten", bossIds: ["dragon", "lich", "golem"] });
    ctx.resolveTileSetAssetPath = () => "x";
    ctx.getBossTileSourcesValue = () => ["molten:boss:dragon", "molten:boss:lich", "molten:boss:golem"];

    const available = getAvailableBossSources(ctx, "molten");
    assert.ok(!available.includes("molten:boss:lich"), "placed token should be excluded");
    assert.ok(available.includes("molten:boss:dragon"));
    assert.ok(available.includes("molten:boss:golem"));
  });

  it("returns empty when all bosses are placed", () => {
    const ctx = makePileCtx({
      state: {
        selectedTileSetId: "molten",
        useAllBosses: false,
        bossPileOrderByTileSet: {
          molten: ["molten:boss:dragon"],
        },
        allBossesPileOrder: [],
        bossTokens: [{ bossKey: "molten:boss:dragon" }],
      },
    });
    ctx.getTileSetConfig = () => ({ id: "molten", bossIds: ["dragon"] });
    ctx.resolveTileSetAssetPath = () => "x";
    ctx.getBossTileSourcesValue = () => ["molten:boss:dragon"];

    const available = getAvailableBossSources(ctx, "molten");
    assert.equal(available.length, 0);
  });
});
