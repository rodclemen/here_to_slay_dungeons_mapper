# Tauri macOS App Plan

Goal: add a macOS desktop app version with Tauri while keeping the existing web app available for browsers. The desktop app should eventually support opening and saving custom tile sets from normal user folders, while staying compatible with the web app's zip-based import/export workflow.

## Key Answers

- The web app can stay available. Tauri should be an additional app shell around the existing frontend, not a replacement for the browser version.
- Save files can be compatible if both versions use the same canonical custom tile-set schema.
- The web app should keep using browser storage plus zip import/export.
- The Tauri app can add folder-based open/save on top of that same schema.

## Compatibility Rule

Keep one canonical portable tile-set shape:

```text
My Custom Tile Set/
  manifest.json
  wall_editor.json
  assets/
    entrance.png
    tile_01.png
    tile_02.png
    tile_03.png
    tile_04.png
    tile_05.png
    tile_06.png
    tile_07.png
    tile_08.png
    tile_09.png
    reference_card.png
    boss_01.png
    boss_02.png
```

The web app can import/export this shape as a `.zip`. The Tauri app can open/save the same shape directly as a folder. That keeps the save files compatible instead of creating separate web and desktop formats.

## Storage Model

### Web App

- Keep current browser-local custom tile set storage in IndexedDB.
- Keep current `localStorage` preferences.
- Keep single custom-set zip export and bulk backup zip export.
- Keep share bundle export for layouts that depend on custom tile sets.

### Tauri App

- Start by running the existing frontend unchanged inside the Tauri webview.
- Add native commands for folder access:
  - `Open Tile Set Folder`
  - `Save Tile Set As Folder`
  - later: `Save Tile Set`
- Use native file dialogs for choosing folders.
- Store remembered recent folder handles/paths in app config only after the user chooses them.
- Keep zip export/import for sharing with web users.

## Save Strategy

Recommended v1 desktop behavior:

- Manual save first.
- Loading a folder creates an editable in-app custom tile set record.
- `Save Tile Set As Folder` writes the current manifest, wall editor data, and image assets to a chosen folder.
- If the tile set was opened from a folder, later `Save Tile Set` can write back to that same folder.

Avoid autosave at first. Autosave is convenient, but it can immediately persist a bad edit or partial asset replacement. Add autosave later only with snapshots or a recoverable history.

## Implementation Plan

1. Add Tauri scaffold.
   - Keep the existing `index.html`, `app.js`, `styles.css`, `modules/`, `tiles/`, `icons/`, and `Graphics/` frontend.
   - Add a Tauri app shell under the standard Tauri project structure.
   - Configure app name, bundle identifier, app icon, and macOS build settings.

2. Confirm the existing app runs unchanged in the Tauri webview.
   - Verify module scripts load.
   - Verify image paths resolve.
   - Verify IndexedDB and localStorage still work in the webview.
   - Verify drag/drop, board panning, custom tile editor, and share links still work.

3. Add a storage adapter boundary in the frontend.
   - Keep the current IndexedDB code as the web/default adapter.
   - Add a Tauri adapter only when running inside the Tauri app.
   - Avoid spreading direct Tauri calls throughout the app code.

4. Add folder import for custom tile sets.
   - Use a Tauri command to let the user pick a folder.
   - Read `manifest.json`, optional/current `wall_editor.json`, and all mapped assets.
   - Validate using the same rules as zip import.
   - Load the result through the existing runtime tile set registry path.

5. Add folder export/save.
   - Use current custom tile set export builders as the source of truth.
   - Write `manifest.json`, `wall_editor.json`, and `assets/` files into a chosen folder.
   - Keep filenames aligned with the canonical portable shape.
   - Mark the local-data notice as handled after a successful folder save.

6. Keep zip compatibility.
   - Folder save and zip export should use the same manifest/wall data/asset mapping.
   - A folder saved by the Tauri app should be zip-able and importable in the web app.
   - A web-exported custom tile set zip should be extractable and openable as a folder in the Tauri app.

7. Add desktop-only UI affordances.
   - Add `Open Tile Set Folder` and `Save Tile Set As Folder` only when running in Tauri.
   - Keep web-only language about browser-local backup in the web app.
   - In Tauri, change the notice wording when a tile set is folder-backed.

8. Build and packaging.
   - Build a local macOS `.app`.
   - Add a `.dmg` target if needed.
   - Decide later whether to sign and notarize for public distribution.

9. Verification.
   - Web app still runs unchanged in a normal browser.
   - Tauri app opens to the same main UI.
   - Existing browser-local custom tile sets still work in web mode.
   - Tauri can open a tile set folder and show all art/metadata.
   - Tauri can save a tile set folder.
   - Folder saved by Tauri can be zipped and imported into the web app.
   - Web-exported zip can be extracted and opened by Tauri.
   - Existing zip export/import/share bundle flows still work.

## Deferred Decisions

- Whether to support autosave.
- Whether to add versioned snapshots beside folder saves.
- Whether to add named local layout saves.
- Whether to add cloud sync later.
- Whether to support Windows/Linux desktop builds after macOS.
- Whether to sign and notarize builds for distribution outside local testing.

## Recommended First Slice

Start with the smallest non-invasive desktop wrapper:

1. Scaffold Tauri.
2. Load the existing web app unchanged.
3. Build a local macOS `.app`.
4. Do not change storage yet.

## 2026-04-10 Status

- Added the first Tauri v2 scaffold under `src-tauri/`.
- Added `package.json` scripts:
  - `npm run build:tauri-web`
  - `npm run tauri:dev`
  - `npm run tauri:build`
- Added a static copy step that writes only the runtime browser app files to `dist/tauri/` so Tauri does not bundle docs, local working folders, or repo metadata.
- Confirmed `npm run build:tauri-web` copies the runtime files successfully.
- Confirmed the installed Tauri CLI reports `tauri-cli 2.10.1`.
- Installed Rust through rustup after confirming the local machine did not have Cargo or rustc available.
- Confirmed `npm run tauri -- build --debug` completes and produces:
  - `src-tauri/target/debug/bundle/macos/Here to Slay Dungeon Mapper.app`
  - `src-tauri/target/debug/bundle/dmg/Here to Slay Dungeon Mapper_0.1.0_aarch64.dmg`

Next step: launch `npm run tauri:dev` for webview QA, then test module loading, image paths, IndexedDB/localStorage, drag/drop, board panning, custom tile editor, and share links inside the desktop shell.

Once that works, add folder open/save as a second slice.
