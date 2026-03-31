# Changelog

## 2026-03-31
- Reworked tile placement validation and snapping flow in `app.js` to stabilize drag/drop behavior, preserve the known-good snap behavior, and enforce continuous ordered face matching for contact detection.
- Updated `molten_entrance` guide geometry tuning and blocked-point handling while keeping the point-index debug system available for alignment work.
- Added and refined placement feedback behavior (green/red overlays), invalid-drop handling (temporary board hold + timed tray return), and `molten_entrance` rotation lock once other tiles are placed.
- Moved tile assets into `tiles/molten_overgrown/`, renamed regular tiles from `tile1..tile9` to `molten1..molten9`, and renamed `tile_start` to `molten_entrance` across app logic, UI text, and docs.
- Added `README.md` describing the current prototype behavior, controls, tile asset layout, and run instructions.
- Polished rotate controls in `styles.css`: larger glyphs, per-direction icon offsets, position adjustments, translucent/blurred circle backgrounds, and hover-only visibility.
- Updated `.gitignore` with additional local ignore entries.
- Session note: Stared at pixel offsets long enough to start measuring time in `px`.
