# Changelog

## 2026-04-01
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
- Session note: Measured UI changes in pixels long enough to develop trust issues with cached CSS.

## 2026-03-31
- Reworked tile placement validation and snapping flow in `app.js` to stabilize drag/drop behavior, preserve the known-good snap behavior, and enforce continuous ordered face matching for contact detection.
- Updated `molten_entrance` guide geometry tuning and blocked-point handling while keeping the point-index debug system available for alignment work.
- Added and refined placement feedback behavior (green/red overlays), invalid-drop handling (temporary board hold + timed tray return), and `molten_entrance` rotation lock once other tiles are placed.
- Moved tile assets into `tiles/molten_overgrown/`, renamed regular tiles from `tile1..tile9` to `molten1..molten9`, and renamed `tile_start` to `molten_entrance` across app logic, UI text, and docs.
- Added `README.md` describing the current prototype behavior, controls, tile asset layout, and run instructions.
- Polished rotate controls in `styles.css`: larger glyphs, per-direction icon offsets, position adjustments, translucent/blurred circle backgrounds, and hover-only visibility.
- Updated `.gitignore` with additional local ignore entries.
- Session note: Stared at pixel offsets long enough to start measuring time in `px`.
