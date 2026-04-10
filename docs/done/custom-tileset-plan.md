# Custom Tileset Plan

This plan breaks custom tileset support into discrete steps so implementation can be done over multiple sessions.

You can later refer to this document with requests like:

- "Do step 3 now"
- "Implement steps 4 and 5"
- "Start with the zip package format"

## Product direction

The intended user workflow is:

1. The user clicks `Add Custom Tile Set`
2. The user enters the tile set name
3. The app creates the custom tile set record immediately
4. The app takes the user to the current Wall Editor page
5. That page becomes the one place where the user:
   - loads art for entrance, 9 regular tiles, reference card, and boss cards
   - edits wall faces, end-tile flags, portal flags, and guide points
   - imports a full custom tileset package
   - exports the current custom tileset package
   - deletes the current custom tileset

Implications:

- zip import is not the primary entry point anymore; it is one action inside the custom-tileset editor workflow
- the current Wall Editor page is now renamed to `Tile Editor`, because it became the full custom-tileset editor
- custom-set creation should pre-seed the current guide-point template counts automatically, but point handles should only render for tiles that already have an image loaded
- the editor should show entrance + 9 regular tiles + reference card + boss cards in one place so art loading and tile-data editing stay together

## Status snapshot

As of `2026-04-09`, the main refactor is effectively complete for v1:

- package import/export is implemented
- custom tile sets persist locally in IndexedDB
- custom wall, end-tile, portal, and guide-point data persist with the custom set
- the runtime registry merges built-in and custom sets
- Tile Editor is the main custom-set workflow
- local backup notices and bulk custom export are implemented
- custom-share helper export and missing-custom fallback restore are implemented

What remains is mostly QA and deferred cleanup, not missing core workflow.

The Phase 1 verification pass now lives in [custom-tileset-qa-checklist.md](../custom-tileset-qa-checklist.md).

## Current v1 assumptions

Keep these constraints for the first custom-tileset version:

- exactly 1 entrance tile
- exactly 9 regular tiles
- exactly 1 reference card
- exactly 2 boss cards in the editor UI
- boss support stays tied to the existing runtime `bossIds` array, with v1 custom sets expected to provide exactly 2 boss IDs
- custom tilesets do not carry their own theme setting in v1
- no custom CSS theme system in v1

UI note for boss cards:

- the custom-tileset editor should show exactly 2 boss-card slots alongside the other assets
- the runtime/package shape can stay array-based internally, but v1 validation should require exactly 2 boss IDs so the editor and package format stay aligned

## Step 1. Define the custom tileset package format

What this step does:

- Decide the exact `.zip` structure
- Decide which metadata fields are required
- Decide how wall editor data is stored inside the package
- Decide which fields must match the app's runtime registry shape

Recommended package shape:

```text
my_tileset.zip
├── manifest.json
├── assets/
│   ├── entrance.png
│   ├── tile_01.png
│   ├── tile_02.png
│   ├── tile_03.png
│   ├── tile_04.png
│   ├── tile_05.png
│   ├── tile_06.png
│   ├── tile_07.png
│   ├── tile_08.png
│   ├── tile_09.png
│   ├── reference_card.png
│   ├── boss_01.png
│   └── boss_02.png
└── wall_editor.json
```

Recommended contents:

- `manifest.json`
  - `id`
  - `label`
  - `version`
  - `schemaVersion`
  - `gameSetId`
  - `entranceTileId`
  - `referenceCardId`
  - `tileIds`
  - `bossIds`
  - asset file mapping
- `wall_editor.json`
  - wall faces
  - end-tile flags
  - portal flags
  - guide point templates

Notes to lock down now:

- The manifest should match the fields the runtime already expects in the tile set registry, not a second parallel shape
- `tileIds` should stay at exactly 9 for now because the current tray, reserve, share-link, and wall editor logic all assume 9 regular tiles
- `wall_editor.json` should carry guide templates per custom tileset; built-in sets can keep their shared template behavior
- `asset file mapping` should cover entrance, regular tiles, reference card, and boss cards so runtime code does not need filename assumptions

Definition of done:

- The package schema is frozen and documented

## Step 2. Add browser storage for custom tilesets

What this step does:

- Add `IndexedDB` storage for custom manifests and image blobs
- Keep built-in sets as they are
- Do not expose import UI yet
- Define how custom storage versions and migrations work

Why:

- `localStorage` is fine for small JSON
- it is not the right place for image assets

Recommended storage model:

- `customTileSets`
  - manifest
  - slot assignment
  - display metadata
  - created / updated timestamps
- `customTileAssets`
  - image blobs keyed by tileset ID and asset ID
- `customWallEditorData`
  - wall faces
  - end-tile flags
  - portal flags
  - guide point templates

Also decide in this step:

- whether custom wall data stays split by concern, like the current local storage model, or is normalized into one stored record per tileset
- whether guide point templates move from global storage to per-tileset storage
- how object URLs created from stored blobs are cached and revoked so repeated tile set switching does not leak memory

Definition of done:

- The app can save and load a custom tileset record locally

## Step 3. Add a runtime registry that merges built-in and custom sets

What this step does:

- Refactor tileset loading so the app no longer assumes everything lives in `./tiles/...`
- Add an asset resolver layer for every tile-set-backed image, not only main tiles
- Merge built-in registry and custom registry at startup

Key refactor:

- Introduce a single asset lookup function
- Built-in sets return normal repo paths
- Custom sets return `blob:` URLs created from stored `IndexedDB` blobs
- Route entrance tile, regular tiles, reference card, and boss card lookups through that resolver
- Keep the merged registry compatible with readiness checks, share-link restore, wall editor rendering, and boss pile ordering

Current code paths this step must cover:

- `buildTileDefs(...)`
- `getReferenceTileSrc(...)`
- boss card source generation
- readiness auditing and registry validation
- any code that compares boss card sources, because custom sets will produce `blob:` URLs instead of stable repo paths

Definition of done:

- A custom tileset can exist in the app registry and behave like a normal set internally

## Step 4. Add the custom tileset creation flow

What this step does:

- Add `Add Custom Tile Set`
- Ask for the custom tile set name
- Create the custom tile set record immediately
- Pre-seed default wall/editor data for that set
- Route the user straight into the current Wall Editor page for that set

Creation behavior:

- the newly created set should appear in the main tileset dropdown immediately
- the set should use the name entered by the user
- default guide-point template counts should already exist for the set
- guide-point handles should only render when a tile image exists
- the set should be editable even before every image has been loaded
- the name entered here is the display label, not the internal tile set ID

Definition of done:

- a user can create an empty custom tile set and land directly in the editor for it

## Step 5. Turn Wall Editor into the custom-tileset editor shell

What this step does:

- keep the current wall-edit tools
- add reference card and boss-card slots below the entrance + regular tiles
- show empty tile silhouettes/placeholders for unloaded assets
- let the user click each slot to load or replace that image
- make the page the home for import, export, and delete actions for the current custom set

Editor behavior:

- entrance + 9 regular tiles keep the existing editable wall-data behavior
- reference card and boss cards should be visible and loadable on the same page
- point handles should only show on tiles that actually have image geometry available
- import should be accessible from the editor page itself, not only from a global menu
- the page should remain useful for built-in tiles, but custom sets become a first-class editing flow here

Definition of done:

- a user can stay on one page to load art and edit tile data for a custom set

## Step 6. Add the custom tileset dropdown behavior

What this step does:

- Show custom tilesets in the tileset dropdown only after they have actually been added
- Use the tileset's own saved name as the dropdown label when provided
- Fall back to generated labels like `Custom 1`, `Custom 2`, and `Custom 3` only when the user has not named the set
- Keep fallback numbering stable as custom tilesets are added over time

Behavior:

- Built-in sets stay fixed
- Custom entries appear only when real custom tilesets exist
- Each imported set gets a persistent custom index for fallback naming
- User-provided names take priority over fallback names in the dropdown and related UI
- The wall editor group UI needs a custom-set strategy instead of only the three hard-coded built-in groups

Adjustment to the original idea:

- Do not require empty placeholder entries in the main dropdown; only show real imported custom sets there
- If custom tiles need wall editing, add either a dedicated `Custom Tile Sets` wall-editor group or a dynamic grouping model in the wall editor

Definition of done:

- The dropdown shows built-in sets plus only the custom tilesets that actually exist
- Named custom tilesets display their saved name
- Unnamed custom tilesets fall back to labels like `Custom 1`, `Custom 2`, and so on

## Step 7. Add zip import inside the custom-tileset editor

What this step does:

- Add `Import Custom Tileset` to the custom-tileset editor page
- Read a `.zip`
- Validate `manifest.json`
- Validate required image files
- Validate `wall_editor.json`
- Save everything to `IndexedDB`
- Update or create the current custom set record through the same runtime/storage path as manual editing

Validation should catch:

- missing required tile images
- bad file names or missing mappings
- malformed wall editor data
- duplicate custom tileset IDs
- invalid registry fields needed by the current app runtime
- malformed or duplicate boss asset mappings

Import behavior to decide explicitly:

- whether importing an existing custom `id` is blocked, replaces in place, or offers an overwrite flow
- whether slot assignment is reused on overwrite or treated as a new import

Chosen behavior:

- renaming a custom tile set in the editor changes only its display label, not its internal ID
- importing a package whose custom `id` already exists locally should create a new copy with a fresh generated ID, not overwrite the existing local set

Definition of done:

- a user can import a package from inside the editor and immediately continue editing that set there

## Step 8. Make the editor fully persist custom tile data

What this step does:

- load wall-editor data from imported package defaults
- allow editing exactly like built-in sets
- save edits back to storage for that custom set
- save image replacements done through the editor back to the custom asset store
- keep package defaults separate from user-local changes if we want cleaner re-export behavior

Important scope note:

- This step is about durable browser-local persistence, not cross-browser or post-clear recovery
- The target is that custom tile sets survive reloads, browser restarts, and normal crashes on the same browser profile
- Clearing site data, switching browser profiles, or moving to another device will still lose browser-local custom data unless the user exported a backup package

Recommended rule:

- Imported `wall_editor.json` becomes the custom set's initial defaults
- Later edits overwrite the local saved version for that custom set
- custom wall faces, end-tile flags, and portal flags should live with the custom tileset in `IndexedDB`, not only in the generic built-in wall override storage
- built-in wall-editor overrides can stay in the existing browser-local storage path for now

Needs one extra decision:

- If guide point templates stay global, custom sets will silently share them with built-in sets; that is probably not what we want, so this step should either scope templates per tileset or document the limitation clearly

Definition of done:

- custom tiles can be created, loaded with art, edited, and reopened later in the same editor flow
- the app restores those custom sets from browser storage on next launch in the same browser profile

## Step 9. Add export and delete for custom tilesets

What this step does:

- Add `Export Custom Tileset` to the custom-tileset editor
- Add `Delete Custom Tileset` to the custom-tileset editor
- keep `Import Custom Tileset` available on that same page so the full package workflow stays local to the editor
- Rebuild a `.zip` from:
  - stored manifest
  - stored image blobs
  - current wall editor data

Important:

- Export should include the latest edited wall data, not just the original import state
- Delete should remove:
  - the custom tileset manifest
  - stored image blobs
  - saved wall editor data
  - slot assignment for that custom set
- After deletion, that slot should fall back to an empty `Custom N` placeholder again

Change needed here:

- If Step 6 keeps the dropdown free of placeholders, deletion should simply remove the entry and preserve numbering metadata only if stable fallback labels still matter for remaining custom sets
- Export should preserve the manifest fields required by the runtime registry shape, not rebuild a thinner manifest that later re-imports ambiguously

Definition of done:

- a user can create, import, tweak, export, delete, and re-import from the same editor workflow

Follow-up polish after this step:

- avoid full editor rerenders for single-slot image replacement so the page no longer blinks after each upload

## Step 10. Add missing-state and share-link handling

What this step does:

- Detect when the current share/export flow is using a browser-local custom tileset
- Prompt the sender to optionally export the matching custom tileset package alongside the shared map link
- Generate a tiny helper HTML file for that case that tells the receiver to import the included zip first and then open the shared layout link
- If a shared layout references a custom set that is not installed locally, show a clear prompt instead of failing silently
- Offer a fallback path to view the layout with the default built-in tileset (`Molten`) when the correct custom set is missing
- Make it explicit that custom tilesets are browser-local unless the zip package is exported separately
- Keep the current limitation visible: the shared layout URL carries layout state, not custom tileset assets or wall/portal metadata
- Mark custom sets clearly in the UI
- Decide how custom boss cards behave in `Random Boss: All Sets`

Important behavior notes:

- The current share link should still only carry layout state such as tile positions, tile identities, tray/reserve ordering, boss placement, and board view state
- The share link should not try to embed custom tileset blobs, wall overrides, portal flags, or guide-point templates directly into the URL
- The exported helper HTML is only a convenience wrapper around the existing shared link; the real custom tileset data still lives in the accompanying zip

Definition of done:

- Missing custom sets fail gracefully
- A sender can package the needed custom zip together with a helper file that points the receiver to the correct shared layout link
- A receiver without the right custom set gets a clear choice: import the correct zip or open the layout using `Molten` as a best-effort fallback

Current implementation note:

- the app now prompts to export the matching custom tileset zip + helper HTML when copying a share link for a custom layout
- restore now offers a `Molten` fallback when the referenced custom tileset is not installed locally
- the fallback is best-effort and depends on slot metadata stored in newer share links

## Step 11. Documentation and guardrails

What this step does:

- Add a README section for custom tilesets
- Explain import and export
- Explain manual creation in the editor
- Explain local-only browser storage
- Explain that custom sets stay browser-local unless exported
- Explain share-link limitations clearly: a share link can reference a custom tileset ID, but the receiver still needs that tileset installed locally

Definition of done:

- The workflow is documented clearly enough that users do not need to read the code

## Step 12. Add unsaved-local-data and backup notices

What this step does:

- Detect when the user has browser-local changes that are easy to lose without export or backup awareness
- Show a clear notice after:
  - adding a custom tile set
  - changing a custom tile set
  - changing wall-editor data on a built-in tile set
- explain that these edits are stored in this browser, but are not protected against site-data clearing or moving to another browser/device
- point custom-tile users toward export as the backup path
- point built-in-wall-edit users toward the existing debug/export path or the final backup path we choose

Why this is a later step:

- local persistence should exist first, so the warnings are accurate
- the wording should reflect the final custom export/import flow, not a temporary state
- this is guardrail/polish work, not a blocker for the core runtime refactor

Definition of done:

- users get an explicit in-app warning that browser-local edits are not the same thing as backed-up data
- the warning appears at the moments where loss would be most surprising
- the warning copy distinguishes normal browser persistence from true backup/export
- custom export should support both per-tileset export and a browser-wide backup export for all local custom tile sets

## Recommended implementation order

1. Step 1
2. Step 2
3. Step 3
4. Step 4
5. Step 5
6. Step 6
7. Step 7
8. Step 8
9. Step 9
10. Step 10
11. Step 11
12. Step 12

## Good stopping points

- After Step 3: the storage and runtime architecture are in place
- After Step 5: the editor shell is in place
- After Step 7: import works inside the editor flow
- After Step 9: the full portable custom tileset workflow exists
- After Step 12: persistence warnings and backup guidance are in place
