# Custom Tileset Refactor Checklist

This document turns the custom-tileset audit into an implementation guide.

The goal is not just "support import". The goal is:

- custom tilesets can be added without rewriting core logic
- built-in and custom tilesets use the same runtime model
- image loading, wall data, boss data, share links, and UI theme selection do not depend on repo-only file paths

Use this together with [custom-tileset-plan.md](./custom-tileset-plan.md) and [custom-tileset-qa-checklist.md](./custom-tileset-qa-checklist.md).

Status: completed and archived after the custom tileset QA pass was confirmed working.

## Progress log

### 2026-04-09

Implemented in code since the original audit:

- built-in and custom sets now share one runtime tileset registry
- asset lookup now routes through shared resolver helpers instead of assuming repo-only paths
- boss identity now uses stable logical keys internally instead of raw image `src`
- custom manifests and asset blobs now persist in IndexedDB
- app startup reloads stored custom sets into the runtime registry
- custom wall, end-tile, and portal editor data now persist with each custom tileset in IndexedDB
- custom guide-point templates now persist per custom tileset, while built-in guide templates remain shared
- legacy custom wall/end/portal overrides are migrated out of generic browser storage into the custom IndexedDB path
- custom zip import is implemented and validated against `manifest.json` plus optional `wall_editor.json`
- `Add Custom Tile Set` now creates a record immediately and routes the user into the editor flow
- the current Wall Editor page now shows custom asset slots for entrance, 9 regular tiles, reference card, and 2 boss cards
- custom sets can be renamed, exported, and deleted from the editor UI
- rename changes the custom set's display label only; duplicate-ID imports now come in as new copies instead of overwriting the existing local set
- custom asset replacement now patches the changed slot in place instead of rerendering the full editor page
- custom-share flow now offers matching zip export plus helper HTML, and restore can fall back to `Molten` when a custom set is missing
- the app now shows local-data backup notices after creating/editing custom sets and after editing built-in tile metadata
- Quick Actions now supports bulk export of all browser-local custom tile sets into one backup zip
- the About page guide and README now document the Tile Editor workflow, local backup rules, rename behavior, duplicate import behavior, and custom-share fallback flow

Still intentionally deferred:

- built-in wall-editor overrides still use the existing browser wall-data storage path instead of moving into a broader IndexedDB refactor
- boss export still carries resolved image `src` for output compatibility even though runtime identity now uses stable boss keys
- v1 still assumes exactly 9 regular tiles and 2 boss cards per custom tileset
- no custom CSS theme system in v1

### Next recommended step

Do a final QA sweep rather than another structural refactor:

- test custom create/import/edit/export/delete end to end in the browser
- test duplicate-ID import behavior and confirm rename expectations in the UI
- test custom-share bundle export, helper HTML, exact restore, and `Molten` fallback restore
- test bulk custom backup export with a mix of complete and incomplete local custom sets
- verify the local-data notice triggers and backup actions after built-in and custom edits

Use [custom-tileset-qa-checklist.md](./custom-tileset-qa-checklist.md) as the working Phase 1 verification pass.

Working note:

- image replacement now patches the changed slot in place instead of rerendering the full editor panel
- shared layout URLs still only carry layout state; they do not embed custom tileset assets, wall overrides, portal flags, or guide-point template data
- current share flow now prompts for optional custom-tileset zip export + helper HTML when sharing a custom layout, and missing custom sets can fall back to `Molten` on restore
- custom asset/image persistence should be treated as browser-local durability, not guaranteed recovery after site-data clearing; backup/export messaging and notice UX are now in place, but should still be validated in-browser
- single custom tilesets can be exported directly, and Quick Actions now offers a bulk backup export for all local custom tile sets

## Current status

The app is now far past the original foundation slices. In plan terms:

- Steps 1 through 4 are effectively done
- Steps 5 through 10 are mostly done, with polish and storage/doc caveats still open
- Step 11 docs/guardrails are mostly in place, and Step 12 notice UX is implemented

The main remaining gaps are:

- built-in wall-editor overrides still depend on the existing browser wall-data storage model, while custom wall/end/portal/guide data now lives with the custom tileset in IndexedDB
- boss export still carries resolved image `src` for output compatibility, even though runtime identity now uses stable boss keys
- browser-local persistence exists, now has in-app warning UX, and now supports both per-tileset export and bulk custom backup export, but it still is not true backup without exported files
- regular tile count is always 9

That means the remaining work is no longer "make custom tilesets possible." It is mostly polish, guardrails, documentation, and a few storage/theme cleanup decisions.

## Scope decisions to keep for now

To keep the refactor manageable, lock these constraints in for the first custom-tileset version:

- a custom tileset must still have exactly 1 entrance tile
- a custom tileset must still have exactly 9 regular tiles
- a custom tileset must still have exactly 1 reference card
- a custom tileset must still have exactly 2 boss cards in v1, even if the runtime keeps using a boss ID array internally
- no custom CSS theme system in v1

If those constraints change later, more of the tray, reserve, theme, and wall-editor code will need redesign.

## Audit summary

### 1. Static runtime registry

The app defines built-in tile sets in a hardcoded registry:

- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L189)

Problems:

- custom sets cannot be merged into the same source of truth yet
- wall editor grouping also depends on fixed built-in IDs
- storage sanitizers iterate the static registry

Also affected:

- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L258)
- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L6030)
- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L6514)
- [modules/wall-storage.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/modules/wall-storage.js#L22)

### 2. Hardcoded asset path construction

Tiles, reference cards, and bosses still build repo paths directly:

- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L647)
- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L5059)
- [modules/assets.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/modules/assets.js#L4)
- [modules/boss-pile.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/modules/boss-pile.js#L1)

Problems:

- imported custom assets will not live under `./tiles/...`
- boss behavior depends on raw image source strings
- readiness checks assume repo assets

### 3. Theme system is fixed to built-in values

The theme ID allowlist and menu are fixed:

- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L168)
- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L1854)
- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L1899)
- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L2139)
- [index.html](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/index.html#L47)
- [about.html](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/about.html#L746)

Problems:

- a custom set's `uiThemeId` is not treated as registry data
- auto-theme incorrectly assumes the tileset ID itself is the theme ID
- unknown theme IDs get coerced to built-in defaults

### 4. Wall editor only understands built-in groups

The wall editor uses hardcoded groups:

- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L258)
- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L6514)

Problems:

- custom sets have nowhere to appear
- the selected group falls back to the first built-in group

### 5. Guide template logic is partly set-specific

These paths are not generic:

- [modules/tile-guides.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/modules/tile-guides.js#L5)
- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L5872)
- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L6001)
- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L6312)

Notes:

- `overgrown` has a special guide-template rule
- guide-template editing assumes `tile_01` is the editable regular template tile
- this is acceptable for v1 only if custom sets follow the same tile ID structure

### 6. Fixed-size assumptions

The current code assumes 9 regular tiles and 6 tray slots:

- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L165)
- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L293)
- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L3993)
- [modules/assets.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/modules/assets.js#L85)

This is acceptable for custom tileset v1 if the package format enforces the same shape.

### 7. Direct molten references

There are still direct `molten` references:

- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L162)
- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L675)
- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L693)

Breakdown:

- `DEFAULT_TILE_SET_ID = "molten"` is fine
- legacy migration from `molten_entrance` is fine
- `isMoltenRegularTile(...)` and `isMoltenEntranceTile(...)` are presentation-specific and should either be removed or clearly isolated as built-in-only styling hooks

## Refactor strategy

Do this in layers. Do not start with zip import.

### Phase 1. Introduce a true runtime tileset registry

Goal:

- stop reading from built-in constants directly in feature code

Create:

- `BUILT_IN_TILE_SET_REGISTRY`
- `state.tileSetRegistry` or equivalent runtime registry
- helper accessors that always read from the runtime registry

Required behavior:

- built-in sets still load exactly as before
- runtime registry can later append custom sets
- all code that currently loops `TILE_SET_REGISTRY` should switch to runtime registry access

Main replacements:

- `getTileSetConfig(...)`
- `getFirstReadyTileSetId()`
- selector hydration
- readiness reporting
- wall storage dependencies
- boss-pile helpers
- wall-editor group derivation

Hotspots:

- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L189)
- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L571)
- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L588)
- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L735)

Definition of done:

- no feature code should need to know whether a set is built-in or custom

### Phase 2. Add an asset resolver layer

Goal:

- remove direct path assumptions from all image-backed tile set assets

Create one canonical resolver API, for example:

```js
resolveTileSetAsset(tileSetId, assetKind, assetId)
```

Where `assetKind` is one of:

- `entrance`
- `tile`
- `reference`
- `boss`

Behavior:

- built-in sets return repo paths
- custom sets return object URLs or equivalent resolved URLs

You will likely also need:

- a cached blob URL manager
- a cleanup path for revoking unused object URLs

Replace all direct construction of:

- entrance image URLs
- regular tile image URLs
- reference card image URLs
- boss image URLs

Hotspots:

- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L647)
- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L5059)
- [modules/assets.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/modules/assets.js#L4)
- [modules/boss-pile.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/modules/boss-pile.js#L1)

Important design note:

Do not use image `src` as the identity of a boss card anymore. Use a stable logical key such as:

```text
<tileSetId>:boss:<bossId>
```

Then resolve that key to a URL only at render time.

Definition of done:

- no tile set feature should assume assets come from `./tiles/...`

### Phase 3. Make theme selection registry-driven

Goal:

- stop treating theme IDs as a fixed built-in enum spread across HTML and JS

Refactor:

- build the theme menu from a single source of truth
- make each tileset declare `uiThemeId`
- make auto-theme read `tileSet.uiThemeId`, not `tileSet.id`

Do not add custom CSS themes in v1.
Just allow custom tilesets to point at an existing supported theme ID.

Minimum changes:

- replace `sanitizeLightUiThemeId(...)` and `sanitizeDarkUiThemeId(...)` with allowlist checks derived from the supported theme catalog
- stop hardcoding theme `<option>` entries in `index.html`
- keep About page theme application in sync with the same supported theme catalog

Hotspots:

- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L168)
- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L1854)
- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L1944)
- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L2139)
- [index.html](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/index.html#L47)
- [about.html](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/about.html#L746)

Definition of done:

- a tileset can choose a supported theme without its own ID needing to be a theme ID

### Phase 4. Make wall data and wall editor work off runtime tilesets

Goal:

- custom sets can participate in wall storage and wall editing

Refactor:

- `getWallStorageDeps()` should expose runtime tile sets, not static built-ins
- sanitizers must accept any tileset present in the runtime registry
- wall editor groups must be dynamic

Recommended wall editor approach for v1:

- keep the three built-in groups
- add a fourth dynamic group called `Custom Tile Sets`
- populate it from runtime tilesets where `source === "custom"` or similar

Alternative:

- remove grouping entirely and show one panel per runtime tileset

That is cleaner architecturally, but a bigger UI change.

Hotspots:

- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L6030)
- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L6514)
- [modules/wall-storage.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/modules/wall-storage.js#L22)

Definition of done:

- wall overrides, end-tile flags, and portal flags survive for custom sets and rehydrate correctly

### Phase 5. Isolate or remove set-specific rendering rules

Goal:

- document which set-specific behaviors are intentional

Keep only if explicitly justified:

- legacy migration from `molten_entrance`
- visual-only image classes for molten if they are still needed
- overgrown-specific guide-template behavior if it is truly based on art geometry

Refactor if possible:

- rename helper names to explain intent, not set name
- move set-specific rules into per-tileset metadata or a small exception table

Example:

- instead of `isMoltenRegularTile(...)`, prefer something like `getTileImageStyleVariant(tile)`

Hotspots:

- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js#L675)
- [modules/tile-guides.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/modules/tile-guides.js#L5)

Definition of done:

- remaining set-specific rules are clearly intentional and easy to locate

### Phase 6. Only then build import/export

Do not start zip import before Phases 1 through 4 are stable.

If import lands before that:

- custom sets may appear in storage but not in the UI
- bosses may break because of unstable `src` identity
- wall editor data may be dropped by sanitization
- auto-theme may silently pick the wrong theme

## Concrete task list

Use this as the implementation order.

### Slice A. Runtime registry foundation

- rename `TILE_SET_REGISTRY` to `BUILT_IN_TILE_SET_REGISTRY`
- add runtime registry state
- add helpers that return runtime sets
- replace direct loops over `TILE_SET_REGISTRY`

Files:

- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js)
- [modules/wall-storage.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/modules/wall-storage.js)
- [modules/boss-pile.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/modules/boss-pile.js)

### Slice B. Asset resolver

- add a tileset asset resolver module or local helper section
- replace all `./tiles/...` string construction
- introduce stable boss asset keys

Files:

- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js)
- [modules/assets.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/modules/assets.js)
- [modules/boss-pile.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/modules/boss-pile.js)

### Slice C. Theme catalog cleanup

- build theme options from a single source of truth
- make auto-theme use `tileSet.uiThemeId`
- stop hardcoding theme options in HTML where possible

Files:

- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js)
- [index.html](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/index.html)
- [about.html](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/about.html)

### Slice D. Wall editor runtime integration

- dynamic group source
- runtime-backed storage sanitizers
- custom group or no-group rendering model

Files:

- [app.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/app.js)
- [modules/wall-storage.js](/Users/Rod/Documents/- CODE -/here_to_slay_dungeons_mapper/modules/wall-storage.js)

### Slice E. Import/export work

- IndexedDB manifest + asset store
- custom registry merge on startup
- zip import
- zip export

## Suggested data model

Keep one normalized runtime tileset shape for built-in and custom sets.

```js
{
  id: "custom_forest_pack",
  label: "Forest Pack",
  source: "custom", // or "built_in"
  status: "ready",
  gameSetId: "custom",
  uiThemeId: "overgrown",
  entranceTileId: "entrance",
  tileIds: ["tile_01", "tile_02", "tile_03", "tile_04", "tile_05", "tile_06", "tile_07", "tile_08", "tile_09"],
  referenceCardId: "reference_card",
  bossIds: ["boss_01", "boss_02"],
  assetMap: {
    entrance: "entrance",
    reference: "reference_card",
    tiles: {
      tile_01: "tile_01",
      tile_02: "tile_02"
    },
    bosses: {
      boss_01: "boss_01",
      boss_02: "boss_02"
    }
  }
}
```

For built-in sets, `assetMap` can be inferred.
For custom sets, `assetMap` should come from the imported manifest.

## Things not to do

- do not make custom tilesets a second-class side path with separate rendering code
- do not keep using raw image `src` as boss identity
- do not import zip files before the runtime registry and asset resolver exist
- do not scatter custom-set conditionals throughout the UI
- do not allow arbitrary tile counts in v1 unless you are prepared to rewrite tray and reserve assumptions too

## Acceptance checklist

Before implementing import, verify all of this with built-in sets only:

- switching between built-in sets still works
- reference card images still switch correctly
- boss pile works in normal mode and `Random Boss: All Sets`
- share-link restore still works
- wall editor still works
- auto-theme follows the selected set's declared `uiThemeId`
- no code path needed a hardcoded `./tiles/...` string outside the asset resolver

Before declaring custom tilesets done:

- a custom set can be injected into the runtime registry manually and rendered without zip import
- that custom set appears in the selector
- its tiles load through the asset resolver
- its reference card loads through the asset resolver
- its bosses work through stable logical boss keys
- its wall data persists and rehydrates
- its theme applies through `uiThemeId`
- deleting the set removes it cleanly from runtime state

## Tomorrow starting point

If you continue this tomorrow, start here:

1. Create the runtime tileset registry abstraction.
2. Replace all direct `TILE_SET_REGISTRY` loops with runtime accessors.
3. Add the asset resolver and convert tiles, reference card, and bosses.
4. Only after that, clean up theme handling and wall editor grouping.

That order keeps the blast radius under control.
