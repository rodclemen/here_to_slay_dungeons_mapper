# Here to Slay Dungeons Tile Randomizer

Browser prototype for testing tile placement rules, snap behavior, and tile-face alignment for Here to Slay DUNGEONS.

## What The App Does (Current)

- Places the set entrance tile (`<prefix>_entrance`) in the board center.
- Randomly selects 6 playable tiles each round from 9 available regular tiles.
- Lets you drag/drop and rotate tiles in 60deg steps.
- Uses point/face contact validation before a tile can be placed.
- Uses ordered/continuous face matching (not random face pair matching).
- Locks entrance-tile rotation after at least one regular tile is placed.
- Invalid drops stay on board briefly (red), then return to tray after 10 seconds.

## Core Placement Rules

- A regular tile must register at least `MIN_CONTACT_POINTS` (currently 4) against placed tiles.
- Contact pairs must be continuous in index order.
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
  - `R` = +60deg
  - `F` = -60deg
- Rotate buttons (`⟲` / `⟳`) also rotate ±60deg.
- `Reroll 6 Tiles`: new random 6.
- `Reset Positions`: keeps same 6, resets board/tray positions.

## Tray / UI Notes

- Tray shows 6 active tiles in slots.
- Remaining 3 inactive tiles are shown below as a stacked preview.
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

### Naming Convention (Important)

For any tile set, assets must follow:

- Entrance tile: `<prefix>_entrance.png`
- Regular tiles: `<prefix>1.png` to `<prefix>9.png`

And live in:

- `tiles/<folder>/`

Example mapping (current default):

- Molten:
  - folder: `tiles/molten/`
  - prefix: `molten`
  - files: `molten_entrance.png`, `molten1.png` ... `molten9.png`

Planned sets (already in dropdown, assets can be added later):

- Overgrown: `tiles/overgrown/overgrown_entrance.png`, `overgrown1..9.png`
- Dreamscape: `tiles/dreamscape/dreamscape_entrance.png`, `dreamscape1..9.png`
- Nightmare: `tiles/nightmare/nightmare_entrance.png`, `nightmare1..9.png`
- Submerged: `tiles/submerged/submerged_entrance.png`, `submerged1..9.png`
- Deep Freeze: `tiles/deep_freeze/deep_freeze_entrance.png`, `deep_freeze1..9.png`

If a selected set is missing files, app falls back and shows a status warning.

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

- `add new tile set Volcanic with prefix volcanic and folder volcanic`
- `switch default set folder from molten to volcanic`

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

- **Theme switch says assets are missing**
  - Verify filenames exactly match:
    - `<prefix>_entrance.png`
    - `<prefix>1.png` ... `<prefix>9.png`
  - Verify folder name matches the configured theme folder.

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
