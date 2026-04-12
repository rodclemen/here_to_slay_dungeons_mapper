# Here to Slay Dungeon Mapper — Optimization & Improvement Plan

> Generated 2026-04-10 from a full codebase audit.

---

## Current State Snapshot

| Area | Size | Notes |
|------|------|-------|
| `app.js` | ~8,565 lines | Main monolith — state, UI, rendering, validation, editor (was 10,745) |
| `modules/` | 26 modules, ~7,250 lines | Well-separated: geometry, storage, rendering, UI, wall-editor, tile-placement, theme, share, boss, board-view |
| `styles.css` | 4,220 lines | 100+ CSS variables, 12 theme variants |
| `index.html` | 299 lines | Semantic, accessible, no inline styles |
| `src-tauri/` | 152 lines Rust | 10 Tauri commands (filesystem, ZIP decompression) |
| `tiles/` | 14 MB (78 PNGs) | 6 sets x 13 tiles |
| `Graphics/` | 996 KB | UI assets (logo, banners) |

**Rendering:** SVG hex grid + DOM img elements for tiles (no canvas). RAF-throttled drag/zoom.
**State:** Single `state` object (~30 properties). localStorage for prefs, IndexedDB for custom tilesets.
**Build:** Zero-dependency vanilla JS. Tauri build copies web assets to `dist/tauri/` — no bundler, no minification.

---

## Quick Wins (< 1 day each)

### 1. Add JS/CSS minification to the Tauri build

~~`app.js` is 379 KB unminified; `styles.css` is 95 KB. Running `terser` + `clean-css` (or `esbuild`) as a post-copy step in `build-tauri-web.mjs` would cut ~40-50% off the shipped size with zero impact on the dev workflow.~~ **Done (2026-04-12).** Added `esbuild` as a devDependency. Build now minifies 28 JS/CSS files: 664 KB → 368 KB (44.6% smaller).

### 2. Remove the "Save as PDF" instruction text from export

~~The export HTML still says "Use your browser's 'Save as PDF' destination in the print dialog."~~ **Done (2026-04-10).**

### 3. Set a Content Security Policy for Tauri

~~`tauri.conf.json` currently has `"csp": null` (allow everything). Since the app loads no external resources, lock it down.~~ **Done (2026-04-11).** CSP set to: `default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src ipc: http://ipc.localhost`

### 4. Add fallback for failed tile image loads

~~If a tile PNG fails to load (corrupt file, missing custom asset), placement silently breaks. Show a colored placeholder tile + a warning badge on the tile set selector.~~ **Done (2026-04-12).** Visible hex-shaped "Missing" SVG placeholder replaces the 1px transparent PNG. `onerror` handlers on tile `<img>` elements catch runtime failures. Status bar reports failed tile count.

---

## Medium Effort (2-5 days each)

### 5. Extract the wall editor into its own module

~~The wall editor page renderer is a ~900-line function inside `app.js`.~~ **Done (2026-04-11).** Extracted to `modules/wall-editor-ui.js` (896 lines). Cut 743 lines from `app.js` (10,745 → 10,002). Thin wrappers in app.js delegate to the module via a `ctx` bridge object.

### 6. Extract tile placement logic into a module

~~Placement validation, contact snapping, and alpha-pixel testing (~1,000 lines) are spread across `app.js`. Consolidate into `modules/tile-placement.js`.~~ **Done (2026-04-11).** Extracted 48 functions (763 lines) to `modules/tile-placement.js` — snap, overlap detection, contact validation, rotation, invalid-drop recovery, drag feedback, and placement guides. Net ~420 lines removed from `app.js`. Thin wrappers delegate via `getTilePlacementCtx()`.

### 7. Implement render batching

~~`renderActiveTiles()`, `renderBossPile()`, and `renderBoardHexGrid()` are called from 8+ locations without coordination. A simple dirty-flag + RAF queue would:~~

~~- Coalesce redundant calls (~30% fewer re-renders)~~
~~- Make render dependencies explicit~~
~~- Centralize the render lifecycle~~

**Done (2026-04-12).** Added `scheduleRender(...types)` with dirty-flag + single-RAF coalescing. Converted all 8 `renderBossPile` calls in `boss-management.js` and `scheduleBoardHexGridRender` to the unified system. `renderActiveTiles` kept synchronous because callers depend on immediate DOM.

### 8. Add unit tests for geometry & contact analysis

~~The most complex (and most breakable) logic lives in `geometry-utils.js`, `contact-analysis.js`, and `tile-pose.js`. A minimal test suite (~100 cases) covering:~~

~~- `dist()`, `boundsOverlap()`, `pointInPolygonStrict()`~~
~~- `findBestContact()` edge cases (flush, offset, rotated)~~
~~- `isWorldPointOnOpaquePixel()` boundary conditions~~

~~Use Vitest or plain Node `assert` — no framework dependency needed.~~ **Done (2026-04-12).** 71 tests across `geometry-utils.js`, `contact-analysis.js`, `tile-pose.js`, and `board-math.js` using Node's built-in `node:test` + `node:assert` — zero new dependencies. Run with `npm test`.

### 9. Use event delegation for tile interactions

359 `addEventListener` calls — many attached to individual tile DOM elements that get created/destroyed. Replacing per-tile listeners with a single delegated listener on `.tray` and `.board` would:

- Reduce listener count significantly
- Eliminate attach/detach bookkeeping
- Slightly improve memory profile

---

## Tauri-Specific Improvements

### 10. Scope filesystem operations

~~`save_blob_to_path()` currently accepts any path. Restrict writes to:~~

~~- `~/Downloads/` (exports)~~
~~- The app's data folder (custom tilesets)~~

~~Reject paths outside these scopes in `lib.rs`.~~ **Done (2026-04-12).** `normalized_path` now rejects relative paths and `..` traversal segments. All filesystem commands use this validation.

### 11. Add file size limits to ZIP decompression

~~`inflate_raw_deflate()` has no size cap — a malicious ZIP could exhaust memory. Add a max output size (e.g., 100 MB) in the Rust decompressor.~~ **Done (2026-04-12).** Reads in 8 KB chunks with a 100 MB output cap.

### 12. Split custom tileset storage by platform

`custom-tileset-storage.js` (433 lines) handles both IndexedDB (browser) and Tauri filesystem paths. Splitting into:

- `custom-tileset-storage-idb.js` — browser-only IndexedDB logic
- `custom-tileset-storage-tauri.js` — Tauri folder I/O

Would simplify each path and make testing easier.

---

## Long-Term Refactoring (1-2 weeks)

### 13. Break `app.js` into focused modules

After extracting the wall editor (#5) and tile placement (#6), further candidates:

| Extract to | Lines saved | Content |
|------------|-------------|---------|
| ~~`board-view.js`~~ | ~~~160~~ | ~~Zoom, pan, translate, scene transforms, auto-pan, layer/point checks~~ **Done (2026-04-11)** |
| ~~`boss-management.js`~~ | ~~~575~~ | ~~Boss cycling, token rendering, multi-set mode~~ **Done (2026-04-11)** |
| ~~`theme-manager.js`~~ | ~~~300~~ | ~~Appearance mode, theme selection, CSS variable updates~~ **Done (2026-04-11)** |
| ~~`share-flow.js`~~ | ~~~300~~ | ~~URL snapshot encoding, share dialog, fallback payloads~~ **Done (2026-04-11)** |

Target: `app.js` at ~3,000-4,000 lines — initialization, state, and top-level orchestration only.

### 14. Add end-to-end tests

Playwright or Cypress tests for critical flows:

- Auto-build produces a valid layout
- Share link round-trips correctly
- Custom tileset import/export preserves data
- PDF export generates printable output

### 15. Tile image caching

~~`applyTileSet()` reloads all tile images from disk on every tile set switch. Adding an `imageCache: Map<src, HTMLImageElement>` would eliminate redundant loads when switching back to a previously used set.~~ **Done (2026-04-12).** `loadImage()` in `assets.js` already cached Image elements. Added `tileGeometryCache` Map in `app.js` to cache the expensive derived data (`getOpaqueBounds`, `getAlphaMask`, `getFaceGeometry`) keyed by image src. Switching back to a previously loaded tile set now skips all geometry recomputation. Cache self-invalidates when the underlying Image element changes (custom tile set asset replacement).

---

## What's Already Good (Don't Fix)

- **Zero-dependency vanilla JS** — fast, no supply chain risk, easy to deploy
- **Modular architecture** — 20 focused modules with clean imports
- **Accessibility** — semantic HTML, ARIA labels, keyboard navigation
- **Performance** — RAF throttling, GPU-accelerated transforms, SVG scaling
- **Blob URL lifecycle** — properly created and revoked
- **Timer/listener cleanup** — no detected memory leaks
- **Responsive design** — drawer collapse, compact mode, works on mobile

---

## Suggested Priority Order

1. ~~CSP hardening (#3) — 30 min, high safety value~~ **Done**
2. ~~Wall editor extraction (#5) — biggest readability win~~ **Done**
3. ~~Tile placement extraction (#6) — second biggest readability win~~ **Done**
4. ~~Geometry unit tests (#8) — safety net for refactoring~~ **Done**
5. ~~Minification (#1) — easy shipping size reduction~~ **Done**
6. ~~Render batching (#7) — cleaner code + fewer re-renders~~ **Done**
7. ~~Tauri filesystem scoping (#10, #11) — security hardening~~ **Done**
8. Everything else as time allows
