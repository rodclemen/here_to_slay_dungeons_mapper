# Custom Tileset Plan

This plan breaks custom tileset support into discrete steps so implementation can be done over multiple sessions.

You can later refer to this document with requests like:

- "Do step 3 now"
- "Implement steps 4 and 5"
- "Start with the zip package format"

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
  - `uiThemeId`
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
- `uiThemeId` should be constrained to supported built-in theme IDs unless custom UI theming is added later
- `tileIds` should stay at exactly 9 for now because the current tray, reserve, share-link, and wall editor logic all assume 9 regular tiles
- `wall_editor.json` should explicitly define whether guide templates are per tileset or global; the current app treats guide templates as global
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

## Step 4. Add the custom tileset dropdown slot system

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

## Step 5. Add zip import for custom tilesets

What this step does:

- Add `Import Custom Tileset`
- Read a `.zip`
- Validate `manifest.json`
- Validate required image files
- Validate `wall_editor.json`
- Save everything to `IndexedDB`
- Assign the set to a custom slot

Validation should catch:

- missing required tile images
- bad file names or missing mappings
- malformed wall editor data
- duplicate custom tileset IDs
- unsupported `uiThemeId`
- invalid registry fields needed by the current app runtime
- malformed or duplicate boss asset mappings

Import behavior to decide explicitly:

- whether importing an existing custom `id` is blocked, replaces in place, or offers an overwrite flow
- whether slot assignment is reused on overwrite or treated as a new import

Definition of done:

- A user can import one zip and see that set appear under `Custom 1/2/3/...`

## Step 6. Make Wall Editor fully work with custom sets

What this step does:

- Load wall editor data from imported package defaults
- Allow editing exactly like built-in sets
- Save edits back to browser storage for that custom set
- Keep package defaults separate from user-local changes if we want cleaner re-export behavior

Recommended rule:

- Imported `wall_editor.json` becomes the custom set's initial defaults
- Later edits overwrite the local saved version for that custom set

Needs one extra decision:

- If guide point templates stay global, custom sets will silently share them with built-in sets; that is probably not what we want, so this step should either scope templates per tileset or document the limitation clearly

Definition of done:

- Custom tiles can be edited in Wall Editor exactly like built-in ones

## Step 7. Add export for custom tilesets

What this step does:

- Add `Export Custom Tileset`
- Add `Delete Custom Tileset`
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

- If Step 4 keeps the dropdown free of placeholders, deletion should simply remove the entry and preserve numbering metadata only if stable fallback labels still matter for remaining custom sets
- Export should preserve the manifest fields required by the runtime registry shape, not rebuild a thinner manifest that later re-imports ambiguously

Definition of done:

- A user can import, tweak wall data, export, delete, and re-import elsewhere

## Step 8. Add missing-state and share-link handling

What this step does:

- If a shared layout references a custom set that is not installed, show a clear error
- Prevent broken silent failures
- Mark custom sets clearly in the UI
- Decide how custom boss cards behave in `Random Boss: All Sets`

Definition of done:

- Missing custom sets fail gracefully

## Step 9. Documentation and guardrails

What this step does:

- Add a README section for custom tilesets
- Explain import and export
- Explain local-only browser storage
- Explain that custom sets stay browser-local unless exported
- Explain share-link limitations clearly: a share link can reference a custom tileset ID, but the receiver still needs that tileset installed locally

Definition of done:

- The workflow is documented clearly enough that users do not need to read the code

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

## Good stopping points

- After Step 3: the storage and runtime architecture are in place
- After Step 5: import works
- After Step 6: Wall Editor works for custom sets
- After Step 7: the full portable custom tileset workflow exists
