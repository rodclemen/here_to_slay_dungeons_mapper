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
  - `tileIds`
  - `bossIds`
  - optional theme choice
  - asset file mapping
- `wall_editor.json`
  - wall faces
  - end-tile flags
  - portal flags
  - guide point templates

Definition of done:

- The package schema is frozen and documented

## Step 2. Add browser storage for custom tilesets

What this step does:

- Add `IndexedDB` storage for custom manifests and image blobs
- Keep built-in sets as they are
- Do not expose import UI yet

Why:

- `localStorage` is fine for small JSON
- it is not the right place for image assets

Recommended storage model:

- `customTileSets`
  - manifest
  - slot assignment
  - display metadata
- `customTileAssets`
  - image blobs keyed by tileset ID and asset ID
- `customWallEditorData`
  - wall faces
  - end-tile flags
  - portal flags
  - guide point templates

Definition of done:

- The app can save and load a custom tileset record locally

## Step 3. Add a runtime registry that merges built-in and custom sets

What this step does:

- Refactor tileset loading so the app no longer assumes everything lives in `./tiles/...`
- Add an asset resolver layer
- Merge built-in registry and custom registry at startup

Key refactor:

- Introduce a single asset lookup function
- Built-in sets return normal repo paths
- Custom sets return `blob:` URLs created from stored `IndexedDB` blobs

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

Definition of done:

- A user can import, tweak wall data, export, delete, and re-import elsewhere

## Step 8. Add missing-state and share-link handling

What this step does:

- If a shared layout references a custom set that is not installed, show a clear error
- Prevent broken silent failures
- Mark custom sets clearly in the UI

Definition of done:

- Missing custom sets fail gracefully

## Step 9. Documentation and guardrails

What this step does:

- Add a README section for custom tilesets
- Explain import and export
- Explain local-only browser storage
- Explain that custom sets stay browser-local unless exported

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
