# Here to Slay Dungeons Tile Randomizer

Browser prototype for testing tile placement rules, snap behavior, and tile-face alignment for Here to Slay DUNGEONS.

## What The App Does (Current)

- Places the Entrance Tile (`entrance`) in the board center.
- Randomly selects 6 playable tiles each round from 9 available regular tiles.
- Lets you drag/drop and rotate tiles in 60deg steps.
- Uses point/face contact validation before a tile can be placed.
- Uses ordered/continuous face matching (not random face pair matching).
- Locks entrance-tile rotation after at least one regular tile is placed.
- Invalid drops stay on board briefly (red), then return to tray after 10 seconds.

## Core Placement Rules

- A regular tile must register at least `MIN_CONTACT_POINTS` (currently 4) against placed tiles.
- Contact pairs must be ordered/continuous in index order, while ignoring wall faces.
- Wall faces are manually marked per tile.
- Wall faces do not count as valid contact faces.
- Example: `valid -> wall -> valid` can still count as continuous contact.
- Entrance blocked points are:
  - `B = point 11`
  - `A = point 12`
- Interpretation:
  - `A` and `B` represent the top of the Dungeon Entrance Tile.
  - Tiles are not allowed to be placed touching this top entrance area.
  - This is an intentional hard rule (and also game-sense): do not try to route placements through `A/B`.
- Hard override rule:
  - If point `A` or `B` is touched by any opaque PNG pixel of another tile, placement is invalid.
  - This overrules other placement rules.

## Point / Face Structure

### Terminology

- `point`: numbered marker on the guide polygon.
- `face`: edge segment between two consecutive points.

### Numbering Direction

- Point indices follow the polygon order used in `getGuideFacePoints(...)`.
- A face uses `startIdx -> endIdx`.

### Tile Shapes

- Regular tiles:
  - Base geometry starts from 16 sampled points.
  - Additional guide adjustments are applied in `applyNormalTileGuideAdjustments(...)`.
- Entrance tile:
  - Built from entrance geometry + remapped adjustments.
  - Labels map `11 => B` and `12 => A`.
  - Two points are removed from the entrance guide output (the earlier debug points), so visible index flow differs from the raw regular tile profile.

## Controls

- Drag tile with mouse/pointer.
- Rotate hovered (or selected) tile:
  - `W` = -60deg (counter-clockwise)
  - `E` = +60deg (clockwise)
- Rotate buttons (`⟲` / `⟳`) also rotate ±60deg.
- `R`: runs random placement (Auto Build).
- `X`: resets tiles and boss cards.
- `D`: toggles both drawers.
- `B`: runs random boss action.
- `Reroll Tiles`: rerolls only tray tiles (grid placements stay as-is).
- `Reset Tiles`: returns active dungeon tiles to tray positions while preserving tile-set selection.
- `Wall Editor`: enters wall-edit mode.
- In wall-edit mode, a dedicated editor page opens with six side-by-side trays (one per tile set), each showing that tile set's 9 regular tiles.
- `Clear Tile Walls`: clears wall faces for the currently hovered/selected regular tile.
- In wall-edit mode, click face segments to toggle wall ON/OFF (saved per `tile set + tile` in browser localStorage).
- `Export Debug Walls`: downloads a JSON backup of wall-override debug mappings.
- `Import Debug Walls`: restores wall-override debug mappings from a previously exported JSON file.
- `Debug` dropdown:
  - `Show Numbers`: toggles face-number labels.
  - `Show Walls`: highlights currently configured wall faces in red.
- `UI Theme` picker:
  - `Current`: keeps the existing UI colors.
  - `Molten`: applies a warm molten palette inspired by the Here to Slay Dungeons cover art.

## Tray / UI Notes

- Tray shows 6 active tiles in slots.
- Remaining 3 inactive tiles are shown below as the Reserve Tile pile.
- Reserve `⋯` menu has an `Edit` toggle:
  - off: inactive tiles display as a pile
  - on: inactive tiles display side by side for easier picking
- Reserve swap flow: click either a reserve tile or a tray tile first, then click its counterpart to swap.
- Rotate buttons are hover-revealed.
- Placement feedback uses a stroke around tile shape (not fill tint).

## Tile Set System

Top-right tray dropdown: `Tile Set`

Available options in UI:

- Molten (default)
- Overgrown
- Dreamscape
- Nightmare
- Submerged
- Deep Freeze

Only tile sets with readiness status `ready` are selectable. Non-ready sets remain visible but disabled with a status suffix (`Assets Missing`, `Wall Data Missing`, or `Coming Soon`).

### Readiness Status

Each tile set is runtime-audited at startup and assigned one status:

- `ready`
- `assets_missing`
- `wall_data_missing`
- `not_implemented`

Audit checks include:

- Entrance asset exists.
- All nine dungeon tile assets (`tile_01..tile_09`) exist.
- Reference card asset exists.
- All declared boss assets exist.
- Embedded default wall data exists for `entrance` and all 9 dungeon tiles.

The app prints a developer readiness report to the console with one block per tile set and a final summary.

### Naming Convention (Important)

For any tile set, assets must follow:

- Entrance tile: `{tileSetId}_entrance.png`
- Regular tiles: `{tileSetId}_tile_01.png` to `{tileSetId}_tile_09.png`
- Reference card: `{tileSetId}_reference_card.png`
- Boss cards: `{tileSetId}_boss_{bossId}.png`

And live in:

- `tiles/{tileSetId}/`

Example mapping (current default):

- Molten:
  - folder: `tiles/molten/`
  - files: `molten_entrance.png`, `molten_tile_01.png` ... `molten_tile_09.png`, `molten_reference_card.png`

Planned sets (already in dropdown, assets can be added later):

- Overgrown: `tiles/overgrown/overgrown_entrance.png`, `overgrown_tile_01..09.png`
- Dreamscape: `tiles/dreamscape/dreamscape_entrance.png`, `dreamscape_tile_01..09.png`
- Nightmare: `tiles/nightmare/nightmare_entrance.png`, `nightmare_tile_01..09.png`
- Submerged: `tiles/submerged/submerged_entrance.png`, `submerged_tile_01..09.png`
- Deep Freeze: `tiles/deep_freeze/deep_freeze_entrance.png`, `deep_freeze_tile_01..09.png`

If a selected tile set is not `ready`, selection is blocked and the app keeps the current ready tile set.

## Wall Data Model

- Base wall data is embedded in-app (`DEFAULT_WALL_FACE_DATA`) and always available on cold start.
- Debug wall imports/exports are override data only; they are not required for normal play.
- If no local storage data exists, placement validation and Wall Editor still work immediately from embedded defaults.

## How To Request Changes (Recommended Phrasing)

Use short, explicit instructions with exact targets.

### Point edits

- `move point 3 on the entrance tile 2px up, 1px left`
- `move point A 5px right`
- `mirror points 2,3,4 to 15,14,13 on X axis`

### Rule edits

- `make placement invalid if face touches point B`
- `require minimum 6 contact points`
- `allow only ordered face sequence, no skips`

### UI edits

- `move tray boxes down 20px`
- `increase rotate icon size to 34px`
- `show point labels only while dragging`

### Theme/asset edits

- `add new tile set volcanic in game set base_game_3`
- `switch default tile set from molten to volcanic`

## Key Files

- Logic: `app.js`
- Layout: `index.html`
- Styling: `styles.css`
- Assets: `tiles/<set-folder>/...`

## Run

Static app. Open `index.html` directly or serve with any local static server.

## Troubleshooting

- **I changed CSS but nothing looks different**
  - Hard refresh the browser (`Cmd+Shift+R` on macOS) to clear cached CSS.
  - Confirm the exact rule/value in `styles.css` before testing.

- **Tile Set switch says assets are missing**
  - Verify filenames exactly match:
    - `{tileSetId}_entrance.png`
    - `{tileSetId}_tile_01.png` ... `{tileSetId}_tile_09.png`
    - `{tileSetId}_reference_card.png`
  - Verify folder name matches the configured tile set ID.

- **A tile set is disabled as Coming Soon / Assets Missing**
  - Open browser console and check the readiness report block for that tile set.
  - Add any missing files listed in `missing assets`.

- **Tile keeps jumping to invalid hold / tray**
  - Current rule requires valid contact logic, and A/B hard-block can override.
  - If a tile touches `A` or `B` by opaque PNG pixels, placement is always invalid.

- **Point labels or guide lines are not visible**
  - Check visibility/opacity rules for:
    - `.tile-guide-labels text`
    - `.tile-guide-outline`

- **R/F does not rotate the tile I expect**
  - Keyboard rotation targets hovered tile first, then selected tile.
  - Move cursor over the intended tile before pressing `R` or `F`.
