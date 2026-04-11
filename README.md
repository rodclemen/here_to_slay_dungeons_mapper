![Here to Slay DUNGEONS Mapper Banner](./Graphics/about_banner.png)

<div align="center">

# Here to Slay DUNGEONS Mapper

**A dungeon layout planner and randomizer for [Here to Slay: Dungeons](https://gamefound.com/en/projects/unstable-games/here-to-slay-dungeons)**

Plan your dungeon. Randomize the crawl. See every layout before you play.

</div>

---

## Table of Contents

- [Why This Exists](#why-this-exists)
- [What It Is](#what-it-is)
- [Highlights](#highlights)
- [Feature Tour](#feature-tour)
- [How To Use It](#how-to-use-it)
- [Tile Editor & Custom Tile Sets](#tile-editor--custom-tile-sets)
- [Technical Blueprint](#technical-blueprint)
- [Architecture Notes](#architecture-notes)
- [Controls & Shortcuts](#controls--shortcuts)
- [Themes & Visual Design](#themes--visual-design)
- [Project Structure](#project-structure)
- [Running Locally](#running-locally)
- [Limitations](#limitations)
- [Future Possibilities](#future-possibilities)
- [Closing](#closing)

---

## Why This Exists

Here to Slay: Dungeons ships with beautifully illustrated hex tiles, but laying them out on a table is fiddly. You draw six tiles from a stack of nine, rotate them, check wall faces, verify contacts — and if you want variety, you do it all again from scratch. There's no easy way to preview or compare layouts before committing a game night to one (I made it sound worse than it probably is).

This project exists because I wanted a tool that respects the game's placement rules while making it effortless to explore layout possibilities — manually or with a single keypress. It started as an idea, then grew into a browser-first app with an optional Tauri desktop shell.

---

## What It Is

Here to Slay DUNGEONS Mapper is a browser-first dungeon layout tool with an optional Tauri desktop app. It lets you drag, rotate, and snap hex tiles onto a board that enforces the game's real placement rules — contact requirements, wall-face exclusions, blocked entrance points — so every layout you build or generate is legal.

It supports all six dungeon tile sets, and can generate random layouts with one click.

The current tiles, reference cards, and boss cards should be treated as provisional stand-ins rather than final production graphics. The main goal right now is to get the layout rules, wall metadata, and overall framework into place so the official art can be swapped in cleanly as the remaining assets are released.

The core problem it solves: **seeing the dungeon before you build it**. Whether you're planning a session, testing a specific tile arrangement, or just want a fresh random crawl, the mapper gets you there faster than shuffling cardboard.

---

## Highlights

- **Hex-snapped tile placement** with real-time contact validation and visual feedback
- **Auto Build** — generates a complete, rule-legal dungeon layout in one action
- **Six dungeon tile sets** with matching UI themes that shift the entire interface
- **Custom tile sets** you can create, import, edit, export, and delete in the browser or desktop app
- **Reserve tile swapping** — swap any active tile with a reserve tile without losing board state
- **Boss selection and magnetic placement** — boss tokens snap to reference card positions
- **Shareable layout links** — copy the current dungeon state into a URL, with custom-set fallback/export help
- **Light and dark themes** per tile set, with automatic or manual switching
- **Browser-first runtime** — vanilla HTML, CSS, and JavaScript for the app itself, plus an optional Tauri desktop wrapper

---

## Feature Tour

### Tile Sets

Six dungeon sets, each with its own entrance tile, nine regular tiles, a reference card, and two boss cards. The app audits each set at startup for asset completeness and wall data, so only fully ready sets are selectable.

**Available sets:** Molten · Overgrown · Dreamscape · Nightmare · Submerged · Deep Freeze

The app also supports custom tile sets. A custom set follows the same v1 shape as a built-in set: one entrance tile, nine regular tiles, one reference card, and two boss cards. In the web app they live in browser-local storage. In the desktop app they live in the data folder you choose. Custom sets appear in the main tile set selector after you create or import them.

### Manual Placement

Drag tiles from the tray onto the board. As you drag, the tile snaps to the nearest hex position and the app evaluates placement legality in real time. A green outline means valid; red means something's wrong — not enough contact faces, overlapping another tile, or touching a blocked entrance point. Invalid drops hold briefly on the board, then return to the tray.

### Auto Build

Press `R` or click the dice icon to generate a random legal layout from the current active tiles. The algorithm uses recursive backtracking with scored candidate positions, evaluating contact quality, layout compactness, and spatial variety. It tracks recent layouts per tile set and actively avoids repeating shapes, so consecutive builds produce meaningfully different dungeons. By default, Auto Build also spawns a random boss at the reference card when it succeeds.

`Auto Build: Default Mode` is enabled by default in Advanced Tools. When it is on, generated layouts stay in the lower part of the board beneath the entrance tile. Turn it off if you want Auto Build to expand freely in any direction.

### Reserve Tile Swapping

Each round draws six tiles from nine. The remaining three sit in reserve. Toggle the reserve panel into edit mode to see all three side by side, then click a tray tile and a reserve tile to swap them — the board state and tile ordering persist through the exchange.

### Boss Selection & Placement

Each tile set includes two boss options. The boss pile in the side panel lets you cycle between them, hold-drag the top card onto the board, or spawn one randomly with the dice button or `B`. If you enable `Random Boss: All Sets` in Advanced Tools, random boss selection can pull from every ready tile set instead of only the current one. Boss tokens magnetically snap to predefined positions around the reference card — side slots and a top slot — with one-per-source enforcement so you never accidentally place duplicates.

### Share Links

Use `Copy Share Link` in Quick Actions to copy a URL that recreates the current layout when opened. The link captures the full current board state: the selected tile set, entrance tile state, placed-tile positions and rotations, tray/reserve ordering, reference-card position, boss placements, and board zoom/pan.

If the active layout uses a custom tile set, the app can also export a matching share bundle that includes the custom-tile-set `.zip` plus a helper HTML file with import/open instructions for the receiver. The URL still carries layout state only; it does not embed custom assets or wall metadata directly. If the receiver opens the link without the matching custom set installed, the app can offer a best-effort `Molten` fallback that restores layout positions where possible, but not the original custom art or exact tile metadata.

### Placement Feedback

Two feedback modes: a full-tile outline that shows overall validity, or a face-by-face view that highlights exactly which edges are making valid contact (green) and which are failing (red). Useful for understanding why a specific placement is being rejected.

### Advanced Tools & Quick Actions

The top bar is split across a few focused controls:

- `Advanced Tools` contains rule and visibility toggles such as `Placement feedback: Faces`, `Random Boss: All Sets`, `Show Walls`, `Show Portals`, `Ignore 2 face connection rule`, and `Auto Build: Default Mode`
- when `Auto Theme` is off, the manual theme picker appears inside `Advanced Tools`
- in the desktop app, `Choose Data Folder` also appears in `Advanced Tools`
- in `Tile Editor`, built-in sets expose `Reset Tile Points`, and dev mode adds extra debug helpers
- `Quick Actions` contains `Auto Theme`, `Copy Share Link`, and `Export PDF`

In compact mode, the top bar shortens `Guide` to `G` and `Tile Editor` to `TE` until the editor is opened.

`Export PDF` works in Build View only and opens a print-ready preview. From there, use the browser or webview print flow to save the PDF.

### Zoom, Pan, and Board Interaction

Mouse wheel zooms the board at the cursor position. Drag empty board space to pan. A zoom indicator in the corner shows the current level and resets to 100% on click. The board auto-recenters after meaningful viewport changes.

### Light & Dark Themes

Every tile set has paired light and dark UI themes — twelve total. Themes shift the entire interface: background, panel colors, accent tones, and the hex grid's lighting gradient. An auto-theme toggle links the UI theme to the active tile set, or you can override it manually. The app also respects your OS-level light/dark preference.

---

## How To Use It

In the standard desktop layout, the Info Drawer is on the left and the Tile Drawer is on the right. Compact mode keeps the Tile Drawer as a compact rail on the left and hides the Info Drawer.

1. **Choose a tile set** from the `Selected Tiles` heading in the right-side Tile Drawer. The interface theme shifts to match when auto-theme is enabled.

2. **Six tiles appear in the Tile Drawer tray.** These are your active tiles for this round, drawn from the set's nine regular tiles. Three more sit in reserve below.

3. **Start from the entrance tile** already placed on the board. It snaps to the hex grid automatically at round start.

4. **Drag regular tiles** from the tray to the board. Each must contact at least two connected faces of already-placed tiles. Wall faces don't count. The app shows green or red feedback as you drag.

5. **Or press `R` to Auto Build.** The app places all six active tiles in a random legal arrangement. Press `R` again for a different layout.

6. **Swap reserve tiles** if you want different options. Toggle reserve edit mode, then click one tray tile and one reserve tile to exchange them.

7. **Place a boss token** by pressing `B`, clicking the random-boss dice button, or hold-dragging the top boss card from the pile. The token snaps to a magnet position near the reference card.

8. **Zoom and pan** with the scroll wheel and by dragging empty board space.

9. **Press `X` to reset** all tiles back to the tray and clear boss tokens.

If you want to work with your own tile art instead of only the built-in sets, open `Tile Editor` and use the custom-set tools described below.

---

## Tile Editor & Custom Tile Sets

This page serves two jobs:

- per-tile metadata editing for built-in sets
- the main create/import/edit/export workflow for custom tile sets

Use the top-bar `Tile Editor` button to switch from the normal board view into the editor page. In compact mode that same control is labeled `TE` until opened. The control changes to `Build View` while active, which takes you back to the mapper and restores the previous build layout when possible.

What the page is for:

- mark which tile faces are treated as walls and therefore ignored by contact validation
- allow or disallow specific tiles as legal end tiles
- mark portal tiles so auto-build can avoid placing portal-to-portal adjacency when possible
- edit shared guide-point templates for `Entrance` and `Tile 01`
- load or replace custom art for entrance, 9 regular tiles, reference card, and 2 boss cards
- create, import, bulk-export, rename, export, or delete custom tile sets
- import a custom tile-set package directly from the editor toolbar

How the page is laid out:

- the top intro explains the current editing actions
- the left toolbar icons handle `Add Custom Tile Set`, `Import Custom Tileset`, `Point Edit`, and `Export All Custom Tile Sets`
- the right toolbar holds `Tile Set Group`, which swaps between the built-in groupings and a dynamic `Custom Tile Sets` group when custom sets exist
- `Copy Guide Template JSON` is available from `Advanced Tools` in dev mode while Tile Editor is open
- each panel below shows one tile set and all of its editable tiles

Working with built-in tile sets:

1. Click any tile to make it the active tile.
2. Click a highlighted face segment on the tile to toggle that face between wall and non-wall.
3. Use `End Tile` to decide whether that tile is allowed to be used as a dungeon endpoint during auto-build.
4. Use `Portal` to add or remove portal metadata for that tile. This is not directional data; it simply marks the tile as a portal tile so auto-build can avoid portal-to-portal adjacency. When enabled, drag the portal marker to the correct spot on the tile art.
5. The entrance tile intentionally does not show `End Tile` or `Portal` controls.

Working with custom tile sets:

1. Use the left toolbar icons to `Add Custom Tile Set` or `Import Custom Tileset`.
2. The new set appears in the main selector and in the editor's `Custom Tile Sets` group.
3. Use the asset slots to load or replace images for entrance, regular tiles, reference card, and boss cards.
4. Edit walls, end-tile flags, portals, and guide points the same way you would for built-in sets.
5. Use the panel actions to rename, export, or delete the custom set.
6. Use the toolbar `Export All Custom Tile Sets` icon when you want a browser-wide backup zip containing one importable package per custom set.

Desktop-specific note:

- importing custom tile sets in the desktop app requires a chosen data folder
- the app prompts for a data folder on startup when needed, and `Choose Data Folder` in `Advanced Tools` lets you change it later
- without a data folder, built-in content still loads, but custom-tile-set imports and persistent edits cannot be saved

Naming and identity:

- `Rename` changes the custom tile set's display label only
- the internal tile set ID stays stable so existing local references, exports, and share-related data do not silently break
- if you export a custom tile set and later import that package while the original ID already exists locally, the app now imports it as a new copy with a fresh ID instead of overwriting the existing set

Guide template editing:

- turn on `Point Edit`
- edit `Entrance` or `Tile 01`
- drag the visible point handles to adjust the shared guide template
- changes propagate to tiles that consume those shared templates

Persistence and backup behavior:

- in the web app, custom tile-set manifests and image assets are stored in browser-local IndexedDB
- in the web app, custom wall data, end-tile permissions, portals, and guide-template edits are stored with the custom tile set in IndexedDB
- built-in wall data, end-tile permissions, portals, guide-template edits, and UI preferences are stored locally too
- in the desktop app, settings and custom tile-set data live in the chosen data folder instead of browser site storage
- this local persistence survives normal reloads, restarts, and likely even crashes in the same profile or chosen data folder
- this is not the same thing as backup: clearing site data, switching browsers, changing browser profiles, or moving to another device can still lose local edits
- the app now shows an in-app local-data notice after creating or editing custom sets and after editing built-in wall/portal/guide data
- use custom tile-set export as the backup/transfer path for custom sets
- single custom sets can be exported from the Tile Editor, and the Tile Editor toolbar also provides `Export All Custom Tile Sets` for a browser-wide backup zip
- the browser-wide backup zip is not itself a direct import target; unpack it first, then import the included per-tileset `.zip` packages one at a time
- built-in wall-edit data can be copied with `Export Debug Walls` and restored with `Import Debug Walls`, but those controls are now dev-only

Important behavior notes:

- this page edits tile metadata; it is not the main dungeon-building view
- Auto Build is disabled while the editor page is open
- regular entrance placement rules still apply in normal build mode after you return to `Build View`
- built-in guide templates are still shared across the built-in sets
- custom guide templates are isolated per custom tile set; editing guide points on a custom set does not change the built-in shared templates or another custom set
- Tile Editor toolbar and custom-set action icons now show their help text in a bottom-left hint label instead of relying on browser hover titles

Future editor planning notes live in [`docs/wall-editor-notes.md`](./docs/wall-editor-notes.md).

---

## Technical Blueprint

This is a geometry-heavy application. Under the surface, there's a coordinate system, a constraint solver, a recursive layout generator, and a fair amount of trigonometry holding it all together. Here's how the major systems work.

### Board and Hex Grid

The board renders a flat-top hexagonal grid as SVG, dynamically sized to the viewport. Grid geometry is calculated from available space — hex radius, column spacing (`1.5 × radius`), row height (`√3 × radius`) — with odd columns offset by half the row height to produce the standard hex stagger.

The grid serves as both a visual reference and the snap coordinate system. A 15% play-scale multiplier (`BOARD_SCALE = 1.15`) enlarges the grid for comfortable placement. Layout metrics are cached by viewport dimensions, so the grid doesn't recompute on every render pass.

Entrance-anchored per-hex lighting simulates a "cave opening" effect — hexes near the entrance are lighter, hexes deeper into the dungeon darken progressively. The lighting falloff and darkening parameters differ between light and dark themes.

### Snapping

When a tile is dragged, `snapBoardPointToHex()` finds the nearest hex center by searching a 5×5 neighborhood of the approximate hex coordinate, accounting for board pan offset. The result is a quantized position that locks the tile to the grid.

During auto-build, a more sophisticated snap search (`computeBestSnap()`) derives candidate positions from the face normals of already-placed tiles, calculating where a new tile *should* go to achieve face-to-face alignment, then searching within a radius to find the closest valid grid point.

### Tile Geometry and Face System

Each tile carries a guide polygon — a set of numbered perimeter points that define its placeable shape. Faces are the edge segments between consecutive points. The app prefers shared guide-point templates and local overrides when they exist, falling back to face geometry derived from the tile PNG alpha channel at load time.

Rotation transforms the polygon by applying a 2D rotation matrix to each point around the tile center. Regular tiles rotate in 60° steps; the entrance tile in 90° steps. All downstream systems — contact detection, wall exclusion, overlap checks — operate on the rotated geometry.

### Placement Validation

Placement validation is the heart of the app. When a tile is positioned on the board, the system evaluates three things:

**Contact detection.** For every pair of placed-tile faces and candidate-tile faces, the system checks directional alignment: face normals must be nearly opposite (threshold: −0.88), tangent vectors must align (threshold: 0.85), and face midpoints must be within a proximity ratio (0.55). Matching faces are grouped and checked for *continuity* — they must form an unbroken sequence along the polygon, with no gaps except wall faces.

**Minimum contact rule.** A valid placement requires at least 4 contact points (two connected faces). This is checked across all neighbor tiles, not per-neighbor.

**Wall face exclusion.** Faces marked as walls in the tile's wall data are excluded from contact matching entirely. A sequence like `valid → wall → valid` is still considered continuous — walls are skipped, not treated as gaps.

**Blocked entrance points.** The entrance tile has hard-blocked top points. If any opaque pixel of a placed tile touches these points within a 4px radius, placement is unconditionally invalid — regardless of how many contact faces match. This enforces the game rule that nothing routes through the dungeon entrance opening. In `Auto Build: Default Mode`, additional entrance faces are treated as blocked so generated layouts stay in the lower half of the board.

**Overlap detection.** Tiles are checked against all placed tiles using inset guide polygons (3px inset from the true edge). The check combines center-in-polygon containment tests with polygon edge intersection tests, catching both stacking and partial overlaps.

### Auto Build Algorithm

The auto-builder is a recursive backtracking search that places all six active tiles in a legal arrangement:

1. **Shuffle** the active tiles into a random placement order.
2. **Place the entrance** at board center.
3. **For each remaining tile,** generate candidate positions by:
   - Computing face-to-face snap offsets against every placed tile at every rotation
   - Falling back to hex ring searches (up to 7 rings) around placed tiles
   - Last resort: random board-wide sampling
4. **Score each candidate** on layout compactness (aspect ratio), contact quality, face clearance, radial distance from the placement centroid, straight-line extension penalties, and local density.
5. **Select from the top bucket** (up to 8 candidates within a score delta of 22), randomize the rest.
6. **Recurse.** If a placement leads to a dead end, backtrack and try the next candidate.
7. **Novelty filtering.** After a successful layout, compute a shape signature (pairwise tile distances, entrance distances, connection degree). If the signature matches a recent layout for this tile set, retry — up to 120 novelty retries and 600 total attempts.

The result is layouts that are legal, compact, varied, and fast — typically generated in under a second.

### Tray and Reserve Model

The tray is backed by a persistent 9-slot model. Slots 0–5 are active (displayed in the tray); slots 6–8 are reserve. This ordering survives board clears, tile returns, view mode switches, and reserve swaps. When a tile is returned to the tray, it goes back to its stored slot position, not to the first empty slot.

The reserve swap system works symmetrically: click a tray tile then a reserve tile (or vice versa) to exchange them. The swap updates the slot model and triggers a tray re-render, preserving all other board state.

### Boss Magnets

Boss tokens use a magnet system for placement around the reference card. Three magnet positions are defined: left-side, right-side, and top. Each has a snap radius and directional tolerance. When a boss token is dragged near a magnet, it locks into position. The top magnet is also used by the random-boss action (`B` key), which spawns or replaces the top-position boss with a randomly selected available option.

Uniqueness is enforced per boss source — only one instance of each boss can exist on the board at any time.

### Theme Architecture

Twelve UI themes (six light, six dark) are defined entirely through CSS custom properties: background, panel, ink, accent, muted tones, and hex grid colors. Each tile set maps to a theme ID in the tile set registry. The auto-theme system links tile set switching to theme switching — select Overgrown, and the UI shifts to the Overgrown palette automatically. Disable auto-theme to choose independently.

Dark themes adjust the hex grid's lighting gradient, increasing the falloff distance and darkening bias to suit the darker palette. The appearance mode (`light` / `dark` / `system`) controls which theme variant is applied, with `system` tracking the OS preference via `prefers-color-scheme`.

---

## Architecture Notes

The application is a browser-first vanilla JavaScript app with an optional Tauri desktop shell. The runtime UI is still plain HTML, CSS, and JS modules with no frontend framework.

**State management.** A single global `state` object holds all application state: tile data (stored in a `Map` by tile ID), board position, zoom level, tray ordering, boss tokens, theme selection, editor state, persistence flags, and UI toggles. State mutations trigger targeted DOM updates rather than full re-renders.

**Rendering.** The hex grid is SVG. Tiles, boss tokens, and the reference card are absolutely positioned DOM elements with CSS transforms for rotation and scaling. Drag operations use pointer events with manual hit-testing. The board viewport uses CSS `scale()` for zoom and offset transforms for pan.

**Geometry.** All placement math operates in world coordinates. Tile polygons are rotated via 2D matrix multiplication. Face matching uses dot-product comparisons for normal and tangent alignment. Overlap detection combines point-in-polygon tests with edge intersection checks. The auto-builder's candidate scoring uses Euclidean distance, aspect-ratio analysis, and graph-degree heuristics.

**Caching.** Performance-sensitive paths cache aggressively: hex layout metrics by viewport size, hex vertex paths by radius, side-direction geometry per tile and rotation, placement evaluations during auto-build, theme-derived grid colors per active theme, and guide geometry derived from tile data. DOM updates batch through `DocumentFragment` where possible.

**Persistence.** In the browser, UI preferences persist to local storage and custom tile-set payloads persist in IndexedDB. In the Tauri desktop app, settings and custom tile-set data are moved into a user-chosen data folder. Board layouts are ephemeral by design except when encoded into a share link.

---

## Controls & Shortcuts

### Keyboard

| Key | Action |
|-----|--------|
| `A` | Toggle the Info Drawer |
| `S` | Toggle the Tile Drawer |
| `W` | Rotate tile counter-clockwise |
| `E` | Rotate tile clockwise |
| `R` | Auto Build (random layout) |
| `X` | Reset all tiles and boss tokens |
| `B` | Spawn random boss |
| `D` | Toggle both drawers |
| `Z` | Reset zoom and board pan |

Rotation targets the tile under the cursor. Entrance tiles rotate in 90° steps; regular tiles in 60° steps.

### Mouse / Pointer

| Action | Behavior |
|--------|----------|
| Drag tile from tray | Place on board with hex snapping |
| Drag tile on board | Reposition with live validation feedback |
| Drag empty board space | Pan the viewport |
| Scroll wheel | Zoom at cursor position |
| Click zoom indicator | Reset zoom to 100% and recenter |
| Click boss pile | Cycle to next boss option |
| Hold top boss card (150ms) | Drag boss token onto board |

---

## Themes & Visual Design

Each of the six tile sets is paired with a UI theme — one light variant, one dark variant. Selecting a tile set can automatically shift the entire interface to its matching palette: colors, accents, panel tones, and the hex grid's directional lighting all adapt.

The theme pairing is intentional. Molten's warm ambers feel right for its lava-tinged tiles. Overgrown's muted greens echo its vine-covered dungeon. The themes aren't decorative — they're functional context, helping you stay oriented in the set you're working with.

Auto-theme mode links tile set switching to theme switching. Turn it off to pick any theme with any tile set, or let the OS appearance preference (`light` / `dark` / `system`) decide the variant.

---

## Project Structure

```
├── index.html              # Application shell and UI structure
├── app.js                  # Main browser/runtime app logic
├── styles.css              # Styling and theme definitions
├── about.html              # In-app guide / manual page
├── modules/                # Extracted runtime modules (theme, board, share, tile placement, etc.)
├── src-tauri/              # Optional Tauri desktop shell
├── scripts/                # Build helpers such as Tauri asset staging
├── tiles/
│   ├── molten/             # Molten tile set assets
│   ├── overgrown/          # Overgrown tile set assets
│   ├── dreamscape/         # Dreamscape tile set assets
│   ├── nightmare/          # Nightmare tile set assets
│   ├── submerged/          # Submerged tile set assets
│   └── deep_freeze/        # Deep Freeze tile set assets
├── icons/                  # UI icons (dice, reroll, reset, etc.)
├── Graphics/               # Banner, logo, guide images
├── qa-checks.html          # QA checklist page for dev workflow
└── CHANGELOG.md            # Detailed version history
```

Each tile set folder contains: entrance tile, nine regular tiles, a reference card, and boss card images — all PNG, all following a strict naming convention (`{setId}_{tileId}.png`).

Custom tile sets do not need to live in the repository. They are imported/exported as `.zip` packages and stored either in browser-local storage or the desktop app's chosen data folder at runtime.

---

## Running Locally

### Browser App

The browser version is still a static app. You only need a local file server.

```bash
# Clone the repository
git clone https://github.com/rodclemen/here_to_slay_dungeons_mapper.git
cd here_to_slay_dungeons_mapper

# Serve with any static file server
python3 -m http.server 8000
# or
npx http-server -p 8000
```

Then open `http://localhost:8000` in your browser.

> **Note:** Opening `index.html` directly via `file://` may not work due to browser CORS restrictions on image loading. Use a local server.

### Browser Dev Mode

Open the app with `?dev=1` when you want internal tools and QA helpers visible:

```text
http://localhost:8000/?dev=1
```

This enables dev-only controls such as:

- `Export Debug Walls` / `Import Debug Walls`
- `Clear Tile Walls`
- `Show Numbers`
- `Auto Build Tuning`
- Tile Editor dev helpers like `Copy Guide Template JSON`

There is also a separate live QA checklist page at:

```text
http://localhost:8000/qa-checks.html
```

Keep that page open beside the mapper and it will mark supported user actions as you trigger them. If the mapper and QA page are on different local origins (`localhost` vs `127.0.0.1`), use the same port and prefer matching origins for the simplest live updates.

### Tauri Desktop App

Prerequisites:

- Node.js and npm
- Rust toolchain (`rustup`, `cargo`)
- platform prerequisites required by Tauri 2 for your OS

Install the JS dependencies once:

```bash
npm install
```

Run the desktop app in development:

```bash
npm run tauri:dev
```

That command automatically runs `npm run build:tauri-web` first, which copies the browser app into `dist/tauri/` and minifies JS/CSS when a local `esbuild` binary is available.

Build the desktop app bundle:

```bash
npm run tauri:build
```

That also runs `npm run build:tauri-web` first, then builds the Tauri app from `src-tauri/`. Bundles are emitted under the normal Tauri target directories, typically `src-tauri/target/release/bundle/`.

### Desktop Dev Mode

In the browser, use `?dev=1`.

In the Tauri desktop app, use the native Help menu and enable `Dev Mode`. That exposes the same dev-only controls inside the app, including items such as:

- `Open Debug Log`
- `Copy Guide Template JSON` while Tile Editor is open
- `Export Debug Walls` / `Import Debug Walls`
- `Clear Tile Walls`
- `Show Numbers`
- `Auto Build Tuning`

---

## Limitations

- **Vanilla architecture.** The app is still deliberately framework-free, but the main runtime is stateful and geometry-heavy, so changes still require careful manual testing.
- **Entrance rotation is locked.** The entrance tile stays fixed; only regular tiles rotate.
- **Auto-build is bounded.** The generator retries up to 600 attempts and 120 novelty checks. In rare edge cases with unusual wall configurations, it may not find a layout.
- **No built-in save library yet.** Layouts can now be shared and restored through `Copy Share Link`, but the app still does not provide named local save slots or a layout browser.
- **Custom tile sets are local by design.** In the browser they live in browser storage; in the desktop app they live in the selected data folder. They are still local-only unless you export them.
- **Built-in wall-edit changes are also local.** Portal markers, wall overrides, endpoint flags, and guide-template edits are not synced anywhere unless you export/import them manually.
- **Bridge-tile disconnects are possible.** If you move a placed tile that was acting as a bridge between two parts of the dungeon, you can leave behind a disconnected island of tiles. The mapper does not currently prevent that state.
- **Tile set readiness varies.** Not all six sets may have complete assets and wall data at any given time. The app audits readiness at startup and disables incomplete sets.
- **Current art is not final.** The tile, reference-card, and boss-card graphics currently in use are placeholders or interim assets while official releases are still incomplete. The framework is being built now so final art can be dropped in later with minimal friction.
- **Desktop-oriented.** The responsive layout adapts to smaller viewports, but the drag-and-drop interaction model is designed for mouse and pointer input.

---

## Future Possibilities

- Saved layout library (named local saves or JSON import/export)
- Touch-optimized interactions for tablet use
- Community-submitted wall data for new tile sets
- Layout gallery or history browser

These are directions, not promises. The app does what it does well today.

---

## Licensing

The source code in this repository is licensed under the MIT License. See `LICENSE`.

Graphics and other non-code visual assets are licensed separately and are not covered by the code license. See `GRAPHICS_LICENSE.md`.

In short: the code may be reused under the software license, but game graphics and other supplied art may not be reused commercially or outside this project without separate permission.

---

## Unofficial Project / Asset Disclaimer

This repository is an unofficial fan-made utility for *Here to Slay: DUNGEONS*. It is not affiliated with, endorsed by, sponsored by, or approved by Unstable Games.

All *Here to Slay* and *Here to Slay: DUNGEONS* names, artwork, graphics, card images, tile images, boss images, logos, and other game-related assets included here remain the property of Unstable Games and/or their respective rights holders. I did not create those original game assets.

This project was made without prior permission from Unstable Games. The code for the mapper is original to this project, but the game-related visual assets are not mine and are included only so the tool can function as a fan project.

If you are a rights holder and want any asset removed or changed, please open an issue or contact me through GitHub and I will deal with it.

---

## Closing

This is a solo passion project built for a game I love. If you play Here to Slay: Dungeons and want a faster way to set up or explore layouts, I hope this is useful.

If you find a bug or have an idea, [open an issue](https://github.com/rodclemen/here_to_slay_dungeons_mapper/issues). Contributions and feedback are welcome.
