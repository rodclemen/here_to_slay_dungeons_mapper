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

### 7. Add unit tests for `tile-placement.js`

**File:** `tests/geometry.test.mjs` (append) or new `tests/tile-placement.test.mjs`

`tile-placement.js` (768 lines) is the most complex untested module. Priority cases:

- `computeBestSnap` — valid snap returned when tile is near a face; no snap when too far
- `evalPlacement` — returns invalid when overlapping; valid when clear
- `checkPortalConflict` — no conflict with 0 portals; conflict with crossing portals
- `validateTilePlacement` — rejects out-of-bounds placement

Use the existing test style: `node:test` + `node:assert/strict`, direct module imports, no test framework. Run with `npm test`.

**Target:** ~40–60 new test cases. Requires making the testable functions exported (many already are).

---

## Larger Refactors (3+ days)

### 8. Extract event listener setup → `modules/event-setup.js`

**Source:** `app.js` lines ~3,500–5,500 (estimate 1,500–2,000 lines)

The event listener block is the single largest remaining section. It wires up keyboard, pointer, drag, resize, and focus handlers. This is harder to extract cleanly because it references many state mutations inline. Approach: move each handler function into the module, keep the `addEventListener` calls in `app.js` pointing at named imports. The handlers receive `ctx` and call through to other modules rather than mutating `state` directly.

This is high-risk / high-reward — do after items 4–6 to reduce `app.js` first and make the remaining structure clearer.

**Estimated reduction:** 1,500–2,000 lines from `app.js`.

### 9. Add unit tests for `boss-management.js`

**File:** new `tests/boss-management.test.mjs`

`boss-management.js` (823 lines) contains pile ordering and spawning logic that is pure enough to test. Priority:

- `buildBossAssetKey` / `parseBossAssetKey` — round-trip correctness (these are pure, no ctx)
- `getBossKeyForLegacySrc` — returns null for unknown src; correct match for known src
- Pile ordering functions — given a known input order, assert sorted output

**Target:** ~30–40 test cases.

---

## Build Improvements (low priority, do last)

### 10. Add image optimization to build script

**File:** `build-tauri-web.mjs` (226 lines)

The `tiles/` directory is 14 MB (78 PNGs). Running `sharp` or `pngquant` as a build-time step could reduce this by 30–50% with no quality loss for hex tile art (flat colors, hard edges). Add as an optional step: skip silently if `sharp` not installed, same pattern as the existing esbuild fallback.

### 11. Strip dev-only DOM nodes in production build

**Files:** `index.html`, `build-tauri-web.mjs`

The `#debug-console`, `.dev-only`, and advanced debug group elements in `index.html` are hidden via `body:not(.dev-mode) .dev-only { display: none }` but remain in the DOM. A build-time HTML transform could strip elements with `class="dev-only"` when building for Tauri release. Low payoff (~5–10 KB) but keeps the production DOM clean.

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
