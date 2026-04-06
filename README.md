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

This project exists because I wanted a tool that respects the game's placement rules while making it effortless to explore layout possibilities — manually or with a single keypress. It started as an idea, but turned into a webapp that hopefully will be a fun useful tool.

---

## What It Is

Here to Slay DUNGEONS Mapper is a browser-based dungeon layout tool. It lets you drag, rotate, and snap hex tiles onto a board that enforces the game's real placement rules — contact requirements, wall-face exclusions, blocked entrance points — so every layout you build or generate is legal.

It supports all six dungeon tile sets, and can generate random layouts with one click.

The core problem it solves: **seeing the dungeon before you build it**. Whether you're planning a session, testing a specific tile arrangement, or just want a fresh random crawl, the mapper gets you there faster than shuffling cardboard.

---

## Highlights

- **Hex-snapped tile placement** with real-time contact validation and visual feedback
- **Auto Build** — generates a complete, rule-legal dungeon layout in one action
- **Six dungeon tile sets** with matching UI themes that shift the entire interface
- **Reserve tile swapping** — swap any active tile with a reserve tile without losing board state
- **Boss selection and magnetic placement** — boss tokens snap to reference card positions
- **Light and dark themes** per tile set, with automatic or manual switching
- **Zero dependencies** — pure vanilla JavaScript, HTML, and CSS. No build step, no framework

---

## Feature Tour

### Tile Sets

Six dungeon sets, each with its own entrance tile, nine regular tiles, a reference card, and two boss cards. The app audits each set at startup for asset completeness and wall data, so only fully ready sets are selectable.

**Available sets:** Molten · Overgrown · Dreamscape · Nightmare · Submerged · Deep Freeze

### Manual Placement

Drag tiles from the tray onto the board. As you drag, the tile snaps to the nearest hex position and the app evaluates placement legality in real time. A green outline means valid; red means something's wrong — not enough contact faces, overlapping another tile, or touching a blocked entrance point. Invalid drops hold briefly on the board, then return to the tray.

### Auto Build

Press `R` or click the dice icon to generate a random legal layout from the current active tiles. The algorithm uses recursive backtracking with scored candidate positions, evaluating contact quality, layout compactness, and spatial variety. It tracks recent layouts per tile set and actively avoids repeating shapes, so consecutive builds produce meaningfully different dungeons. By default, Auto Build also spawns a random boss at the reference card when it succeeds.

### Reserve Tile Swapping

Each round draws six tiles from nine. The remaining three sit in reserve. Toggle the reserve panel into edit mode to see all three side by side, then click a tray tile and a reserve tile to swap them — the board state and tile ordering persist through the exchange.

### Boss Selection & Placement

Each tile set includes two boss options. The boss pile in the side panel lets you cycle between them, hold-drag the top card onto the board, or spawn one randomly with the dice button or `B`. If you enable `Random Boss: All Sets` in Advanced Tools, random boss selection can pull from every ready tile set instead of only the current one. Boss tokens magnetically snap to predefined positions around the reference card — side slots and a top slot — with one-per-source enforcement so you never accidentally place duplicates.

### Placement Feedback

Two feedback modes: a full-tile outline that shows overall validity, or a face-by-face view that highlights exactly which edges are making valid contact (green) and which are failing (red). Useful for understanding why a specific placement is being rejected.

### Zoom, Pan, and Board Interaction

Mouse wheel zooms the board at the cursor position. Drag empty board space to pan. A zoom indicator in the corner shows the current level and resets to 100% on click. The board auto-recenters after meaningful viewport changes.

### Light & Dark Themes

Every tile set has paired light and dark UI themes — twelve total. Themes shift the entire interface: background, panel colors, accent tones, and the hex grid's lighting gradient. An auto-theme toggle links the UI theme to the active tile set, or you can override it manually. The app also respects your OS-level light/dark preference.

---

## How To Use It

1. **Choose a tile set** from the dropdown in the top bar. The interface theme shifts to match.

2. **Six tiles appear in the tray.** These are your active tiles for this round, drawn from the set's nine regular tiles. Three more sit in reserve below.

3. **Start from the entrance tile** already placed on the board. It snaps to the hex grid automatically at round start. You can rotate it in 90° steps with `W`/`E` — but only before placing the first regular tile.

4. **Drag regular tiles** from the tray to the board. Each must contact at least two connected faces of already-placed tiles. Wall faces don't count. The app shows green or red feedback as you drag.

5. **Or press `R` to Auto Build.** The app places all six active tiles in a random legal arrangement. Press `R` again for a different layout.

6. **Swap reserve tiles** if you want different options. Toggle reserve edit mode, then click one tray tile and one reserve tile to exchange them.

7. **Place a boss token** by pressing `B`, clicking the random-boss dice button, or hold-dragging the top boss card from the pile. The token snaps to a magnet position near the reference card.

8. **Zoom and pan** with the scroll wheel and by dragging empty board space.

9. **Press `X` to reset** all tiles back to the tray and clear boss tokens.

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

**Blocked entrance points.** Points A and B at the top of the entrance tile are hard-blocked. If any opaque pixel of a placed tile touches these points within a 4px radius, placement is unconditionally invalid — regardless of how many contact faces match. This enforces the game rule that nothing routes through the dungeon entrance opening.

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

The application is a single-page vanilla JavaScript app — one HTML file, one CSS file, one JS file (~8,500 lines). No framework, no build step, no dependencies.

**State management.** A single global `state` object holds all application state: tile data (stored in a `Map` by tile ID), board position, zoom level, tray ordering, boss tokens, theme selection, and UI flags. State mutations trigger targeted DOM updates rather than full re-renders.

**Rendering.** The hex grid is SVG. Tiles, boss tokens, and the reference card are absolutely positioned DOM elements with CSS transforms for rotation and scaling. Drag operations use pointer events with manual hit-testing. The board viewport uses CSS `scale()` for zoom and offset transforms for pan.

**Geometry.** All placement math operates in world coordinates. Tile polygons are rotated via 2D matrix multiplication. Face matching uses dot-product comparisons for normal and tangent alignment. Overlap detection combines point-in-polygon tests with edge intersection checks. The auto-builder's candidate scoring uses Euclidean distance, aspect-ratio analysis, and graph-degree heuristics.

**Caching.** Performance-sensitive paths cache aggressively: hex layout metrics by viewport size, hex vertex paths by radius, side-direction geometry per tile and rotation, placement evaluations during auto-build, and theme-derived grid colors per active theme. DOM updates batch through `DocumentFragment` where possible.

**Persistence.** UI preferences (theme, appearance mode, auto-theme toggle, drawer state) persist to `localStorage`. Wall face overrides and guide-point template edits also persist locally with import/export support. Board layouts are ephemeral by design.

---

## Controls & Shortcuts

### Keyboard

| Key | Action |
|-----|--------|
| `W` | Rotate tile counter-clockwise |
| `E` | Rotate tile clockwise |
| `R` | Auto Build (random layout) |
| `X` | Reset all tiles and boss tokens |
| `B` | Spawn random boss |
| `D` | Toggle left and right drawers |

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
├── app.js                  # All application logic (~8,500 lines)
├── styles.css              # Complete styling and theme definitions
├── about.html              # Guide and manual page
├── tiles/
│   ├── molten/             # Molten tile set assets
│   ├── overgrown/          # Overgrown tile set assets
│   ├── dreamscape/         # Dreamscape tile set assets
│   ├── nightmare/          # Nightmare tile set assets
│   ├── submerged/          # Submerged tile set assets
│   └── deep_freeze/        # Deep Freeze tile set assets
├── icons/                  # UI icons (dice, reroll, reset, etc.)
├── Graphics/               # Banner, logo, guide images
└── CHANGELOG.md            # Detailed version history
```

Each tile set folder contains: entrance tile, nine regular tiles, a reference card, and boss card images — all PNG, all following a strict naming convention (`{setId}_{tileId}.png`).

---

## Running Locally

This is a static app with no build step and no dependencies.

```bash
# Clone the repository
git clone https://github.com/rodclemen/here_to_slay_dungeons_randomizer.git
cd here_to_slay_dungeons_randomizer

# Serve with any static file server
python3 -m http.server 8000
# or
npx http-server -p 8000
```

Then open `http://localhost:8000` in your browser.

> **Note:** Opening `index.html` directly via `file://` may not work due to browser CORS restrictions on image loading. Use a local server.

---

## Limitations

- **Single-page architecture.** The entire app lives in one JS file. This is intentional for simplicity but means there's no module boundary enforcement.
- **Entrance rotation locks** after the first regular tile is placed. This matches the intended gameplay flow but can surprise new users.
- **Auto-build is bounded.** The generator retries up to 600 attempts and 120 novelty checks. In rare edge cases with unusual wall configurations, it may not find a layout.
- **No persistent layout saving.** Board layouts are session-only. The app persists UI preferences and wall data, but not tile positions. PDF export is available for capturing a layout.
- **Bridge-tile disconnects are possible.** If you move a placed tile that was acting as a bridge between two parts of the dungeon, you can leave behind a disconnected island of tiles. The mapper does not currently prevent that state.
- **Tile set readiness varies.** Not all six sets may have complete assets and wall data at any given time. The app audits readiness at startup and disables incomplete sets.
- **Desktop-oriented.** The responsive layout adapts to smaller viewports, but the drag-and-drop interaction model is designed for mouse and pointer input.

---

## Future Possibilities

- Layout save and restore (JSON export/import of board state)
- Shareable layout links
- Touch-optimized interactions for tablet use
- Community-submitted wall data for new tile sets
- Layout gallery or history browser

These are directions, not promises. The app does what it does well today.

---

## Closing

This is a solo passion project built for a game I love. If you play Here to Slay: Dungeons and want a faster way to set up or explore layouts, I hope this is useful.

If you find a bug or have an idea, [open an issue](https://github.com/rodclemen/here_to_slay_dungeons_randomizer/issues). Contributions and feedback are welcome.
