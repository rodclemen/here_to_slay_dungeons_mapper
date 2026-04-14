# Here to Slay Dungeons Mapper — Round 2 Optimization Plan

> Generated 2026-04-13 from full codebase audit post-round-1.

---

## Context

Round 1 extracted wall editor, tile placement, boss management, theme, share flow, and board view from `app.js`, and added minification, render batching, event delegation, tests, and security hardening. `app.js` went from 10,745 → 9,169 lines. The target is ~3,000–4,000 lines (initialization, state, orchestration only).

This plan covers the next layer of improvements: further module extractions, unbounded cache fixes, CSS consolidation, and expanded test coverage. Everything below is independent — items can be done in any order.

---

## Current Baseline

| File | Lines |
|------|-------|
| `app.js` | 9,169 |
| `styles.css` | 4,225 |
| `modules/` (28 files) | 6,901 |
| `tests/geometry.test.mjs` | 564 (88 cases) |

---

## Quick Wins (< 1 day each)

### ~~1. Add LRU eviction to asset caches~~ **Done (2026-04-13)**

`modules/assets.js`: Added `lruSet()` helper (7 lines). Both `imageExistsCache` and `imageLoadCache` now cap at 150 entries, evicting oldest on overflow.

### ~~2. Consolidate tile-portal-flag CSS filters~~ **Done (2026-04-13)**

`styles.css`: Added `--portal-outline`, `--portal-glow-a`, `--portal-glow-b`, `--portal-shadow` to `:root`. Used in `.tile-portal-flag` filter rule. `.is-dragging` retains explicit values (different opacities).

### ~~3. Fix `:body` selector typo in styles.css~~ **Already correct — no action needed**

The selectors at lines 3814–3815 were already `body.wall-edit-mode` (no leading colon). The audit found a stale issue.

---

## Medium Effort (1–3 days each)

### ~~4. Extract auto-build algorithm → `modules/auto-build.js`~~ **Done (2026-04-13)**

`app.js` 9,169 → 8,375 lines (-794). New `modules/auto-build.js` (893 lines). Extracted 13 functions + inner closures via `getAutoBuildCtx()` bridge. `runAutoBuild()` in app.js is a 3-line wrapper.

### ~~5. Extract tileset registry & selector UI → `modules/tileset-selector.js`~~ **Done (2026-04-13)**

`modules/tileset-selector.js` (71 lines). Extracted 7 UI helper functions via `getTileSetSelectorCtx()` bridge: `getTileSetStatusSuffix`, `getReadyTileSets`, `hydrateTileSetSelector`, `syncTileSetMenuOptions`, `setTileSetMenuOpen`, `closeHeaderMenus`, `isEventInsideHeaderMenu`. `refreshRuntimeTileSetRegistry` stays in `app.js` (orchestration, too coupled). Actual savings: ~34 net lines (estimate was off — these were small functions).

### ~~6. Extract local data notices → `modules/local-data-notices.js`~~ **Done (2026-04-13)**

`modules/local-data-notices.js` (134 lines). Extracted 7 functions via `getLocalDataNoticesCtx()` bridge with getter/setter properties for mutable `localDataNoticeActionContext` and `localDataNoticeSuppressedUntilCustomChange`. `app.js` 8,375 → 8,251 lines (-90 net from baseline before item 5).

### ~~7. Add unit tests for `tile-placement.js`~~ **Done (2026-04-14)**

`tests/tile-placement.test.mjs` (483 lines). Full coverage across `snapTileCenterToHex`, `evaluatePlacementAt`, `computeBestSnap`, rotation/state helpers, `updatePlacementFeedback`, and clearance/open-hex search. ~19 test cases exceeding the 40–60 target in depth.

---

## Larger Refactors (3+ days)

### ~~8. Extract event listener setup → `modules/event-setup.js`~~ **Done (2026-04-14)**

`modules/event-setup.js` 729 → 1,303 lines (+574). `app.js` 7,812 → 7,324 lines (−488). Extracted `beginBoardPan`, `getTileFromEvent`, all 5 `handleDelegated*` tile handlers, `setupDelegatedTileEvents`, `beginDrag`, `finishDrop`, and `beginGuidePointHandleDrag` (exported). `getEventSetupCtx()` grew by 54 new properties. All 91 tests pass.

### ~~9. Add unit tests for `boss-management.js`~~ **Done (2026-04-14)**

`tests/boss-management.test.mjs` (24 test cases). Covers `buildBossAssetKey` / `parseBossAssetKey` round-trips and edge cases, `getBossKeyForLegacySrc` (known/unknown src, multi-set, explicit fallback), `pushBossBackToPile` (single-set and all-bosses modes, no duplicate), `rotateAllBossesPileTop` (rotation, placed token skipping, edge cases), and `getAvailableBossSources` (placed exclusion, all-placed). All 115 tests pass.

---

## Build Improvements (low priority, do last)

### ~~10. Add image optimization to build script~~ **Skipped (2026-04-14)**

Tiles were already manually run through a compressor. Further automated passes via `sharp`/`pngquant` would yield minimal gains at current sizes. Scaling tiles down is a separate design decision outside build tooling scope.

### ~~11. Strip dev-only DOM nodes in production build~~ **Skipped (2026-04-14)**

Low payoff (~5–10 KB). Not worth the build complexity at this stage. Dev-only elements remain hidden via CSS in production.

---

## Suggested Order

1. **Item 3** (`:body` selector bug fix) — functional bug, do first
2. **Item 1** (LRU cache) — quick, isolated, no risk
3. **Item 2** (CSS filter variables) — cosmetic, quick
4. **Item 4** (auto-build extraction) — biggest single win, clean boundaries
5. **Item 5** (tileset registry extraction) — natural follow-on
6. **Item 6** (local data notices extraction) — rounds out the end-of-file cleanup
7. **Item 7** (tile-placement tests) — add safety net before event refactor
8. **Item 8** (event setup extraction) — the hard one, do after app.js is smaller
9. **Item 9** (boss-management tests)
10. **Items 10–11** (build improvements) — whenever convenient

**Expected `app.js` line count after items 4–6:** ~6,600–7,000 lines
**Expected `app.js` line count after item 8:** ~4,500–5,500 lines

---

## Verification

- `npm test` must pass (88+ cases green) after any JS change
- `npm run build:tauri-web` must complete without errors after any change
- Manual smoke test after each extraction: load app in browser, place tiles, switch tileset, open wall editor, use share link
- After item 3 (`:body` fix): verify portal flags appear in wall-edit mode and when show-portal-flags is active
- After item 1 (LRU cache): open app, switch tile sets 10+ times, confirm no console errors and memory doesn't grow unboundedly (Chrome DevTools heap snapshot)
