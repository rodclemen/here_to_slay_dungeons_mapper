# Changelog

## 2026-04-02
- Reworked board zoom architecture to use a unified `.board-content` layer so grid, tiles, reference card, and overlays scale from the same origin; fixed previous per-element center-scaling drift.
- Added cursor-anchored mouse-wheel zoom and kept `Zoom 100%` as a hard reset for both scale and board pan offset, so view reset returns to the original board framing.
- Added an in-board zoom readout (`Zoom xx%`) in the top-right with stable column layout, click-to-reset behavior, and non-highlighted text-only styling.
- Updated drag scaling so tray tiles visually match board zoom while dragging into the board, removing size “pop” on drop.
- Added and iterated custom tray controls: moved controls under `Tile Tray`, converted to icon actions, then simplified to two actions (`Reroll Tiles`, `Reset Tiles`) using `icons/reroll.png` and `icons/reset.png`.
- Added a boss section in the tray panel that auto-loads boss PNGs from the active theme folder and displays them as a stacked pile; supports molten and overgrown boss file mappings with graceful fallback when files are missing.
- Built independent expand/edit interactions for reserve and boss boxes directly on box click, with red `✕` active-state indicators and mode-specific expansion behavior.
- Added boss stack interaction rules: click in boss-expanded mode swaps boss card order; click/hold top boss card spawns a draggable board token copy.
- Added unique-instance enforcement for boss tokens: each boss image can exist only once at a time; once placed on board it is removed from boss stack availability.
- Added draggable boss tokens on the board with pan/zoom synchronization and center-anchored spawn preview; aligned token size with reference-card/tile size.
- Removed drag ghosting artifacts for boss tokens by eliminating runtime filters/shadows on moving token elements and using compositing-friendly transform/style settings.
- Hardened pointer/selection UX by disabling browser text/image selection drag artifacts across tray, pile, and board interaction surfaces.
- Session note: Replaced at least three “final” icon approaches before admitting version four was the actual final.

## 2026-04-01
- Added manual wall-face editing workflow with a dedicated wall editor view showing all six tile-set trays side by side, including support for editing `molten_entrance` wall faces.
- Added wall override persistence tooling: `Export Walls`, `Import Walls`, and `Clear Tile Walls`, scoped to wall-edit mode and saved via local storage backup format.
- Reworked reserve pile interaction: added 3-dot options menu with edit toggle, side-by-side reserve editing layout, bidirectional tray/reserve swap selection, consistent blue swap highlighting, and position-preserving swaps.
- Updated tray controls and behavior: two-row action layout (`Reroll Tiles`, `Randomize Rotation`, `Reset Position`, `Reset Tiles`) with tray-only reroll/rotation operations and a non-randomizing `Reset Tiles` return-to-tray flow.
- Refined top-bar controls: moved UI theme selector to the header, normalized control sizing, adjusted button ordering (wall-edit toggle as last action), renamed wall-edit exit label to `Frontpage`, and improved dropdown open/close behavior (outside click closes menus).
- Applied extensive visual polish for Molten and default themes: swapped requested board/tray tones, updated tray/pile panel transparency, improved rotate-control contrast in dark mode, refreshed reserve menu icon styling, and tuned wall-segment highlight colors for edit mode clarity.
- Replaced the board’s CSS pattern grid with a responsive SVG hex-outline renderer in `app.js` that redraws on resize, uses theme-specific stroke colors, and avoids clipped edge hexes.
- Aligned tile snapping to the rendered SVG hex lattice and added live drag-time magnet snapping, including tile-specific `molten_entrance` Y-offset correction for visual alignment.
- Added a `Debug` toggle (`Ignore 4-Point Rule`) to allow free placement during alignment/debugging while preserving valid/invalid visual feedback behavior.
- Disabled invalid-drop push/return timers when the ignore-contact toggle is enabled, and cancel any already-running timers immediately when toggled on.
- Added board panning by dragging empty board space so users can move long tile formations, with grid rendering/snap math updated to track pan offset.
- Restored directional board edge fading (top/bottom/left/right) and adjusted board/grid visual layering so tiles and overlays remain readable.
- Refined placement feedback logic so red/green indicators appear only when a dragged tile is actually interacting with another placed tile (contact or overlap), not while free-dragging in empty space.
- Added `hex-background.html` as a standalone reference/demo for the full-screen responsive flat-top SVG hex background implementation.
- Added a tile-set selector in the tray header (`Tile Set`) with runtime switching support in `app.js` for: Molten, Overgrown, Dreamscape, Nightmare, Submerged, and Deep Freeze.
- Implemented theme asset loading by folder/prefix convention (`<prefix>_entrance.png`, `<prefix>1..9.png`) and fallback handling when assets are missing.
- Renamed the default molten asset folder from `tiles/molten_overgrown/` to `tiles/molten/` and updated code/docs mappings accordingly.
- Expanded and generalized `README.md` with set-agnostic guidance: placement rules, point/face terminology, naming conventions, request phrasing examples, and troubleshooting.
- Added remaining-tile stack UI under the tray and styled it as an uneven card pile; tuned spacing, offsets, and visual separation behavior.
- Reworked placement feedback visuals from fill-tint overlays to shape-following stroke feedback and fixed drag shadow rendering to follow PNG alpha silhouette.
- Added a top-bar Show/Hide Numbers toggle and wired runtime guide-label visibility control.
- Added hovered-tile keyboard rotation targeting (`R`/`F`) and refined rotate-control visibility/selection behavior after invalid and valid drops.
- Hardened entrance blocked-point logic so points `A`/`B` (entrance points 12/11) act as placement overrides when touched by another tile’s opaque PNG pixels.
- Randomized tray tile rotations (in 60deg steps) on round/reset and tray-return paths.
- Polished tray/header spacing, stabilized button widths, and refined rotate control positioning/visibility.
- Added/updated theme-related graphic source assets under `gfx/`.
- Session note: The UI survived 47 tiny button tweaks and one major hex-grid identity crisis.
- Session note: Measured UI changes in pixels long enough to develop trust issues with cached CSS.
- Session note: Hexes were either microscopic or planet-sized for a while; we eventually negotiated a truce.

## 2026-03-31
- Reworked tile placement validation and snapping flow in `app.js` to stabilize drag/drop behavior, preserve the known-good snap behavior, and enforce continuous ordered face matching for contact detection.
- Updated `molten_entrance` guide geometry tuning and blocked-point handling while keeping the point-index debug system available for alignment work.
- Added and refined placement feedback behavior (green/red overlays), invalid-drop handling (temporary board hold + timed tray return), and `molten_entrance` rotation lock once other tiles are placed.
- Moved tile assets into `tiles/molten_overgrown/`, renamed regular tiles from `tile1..tile9` to `molten1..molten9`, and renamed `tile_start` to `molten_entrance` across app logic, UI text, and docs.
- Added `README.md` describing the current prototype behavior, controls, tile asset layout, and run instructions.
- Polished rotate controls in `styles.css`: larger glyphs, per-direction icon offsets, position adjustments, translucent/blurred circle backgrounds, and hover-only visibility.
- Updated `.gitignore` with additional local ignore entries.
- Session note: Stared at pixel offsets long enough to start measuring time in `px`.
