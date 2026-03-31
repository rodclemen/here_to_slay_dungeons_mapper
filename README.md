# Here to Slay Tile Randomizer Prototype

A browser-based prototype for experimenting with dungeon tile placement for **Here to Slay DUNGEONS**.

The app renders a board and a tile tray, then lets you drag, rotate, and place tiles while enforcing contact rules between tile faces.

## Current Behavior

- `molten_entrance` is always active and placed in the board center.
- 6 random tiles are selected from `tile1` to `tile9` each round.
- Tiles can be rotated in 60° steps.
- A non-start tile is considered placeable when it reaches at least **4 matched contact points** against an already placed tile.
- Contact matching uses a **continuous ordered face sequence** (not arbitrary mixed face hits).
- `molten_entrance` has blocked non-numeric connection points (`A` and `B`, internally points `12` and `11`).
- If a drop is invalid, the tile is pushed away from placed tiles, stays on the board in red, and returns to the tray after 10 seconds.
- Once any regular tile is placed, `molten_entrance` rotation is locked.

## Controls

- Drag with mouse/pointer to move tiles.
- Rotate selected tile:
  - `R` = +60°
  - `F` = -60°
- Rotate buttons (`⟲` / `⟳`) on each tile do the same.
- `Reroll 6 Tiles` selects a new random set.
- `Reset Positions` keeps the current set but resets all active tiles to starting positions.

## Visual Feedback

- Green tint: current position is valid for placement.
- Red tint: current position is invalid.
- Debug guide lines/numbers are still present in DOM but currently styled transparent.

## Tile Assets

Tiles are loaded from:

- `tiles/molten_overgrown/molten_entrance.png`
- `tiles/molten_overgrown/molten1.png` ... `molten9.png`

## Tech

- Plain HTML/CSS/JavaScript (no framework)
- Main logic in `app.js`
- Styling in `styles.css`

## Run

Since this is a static frontend prototype, open `index.html` directly in a browser, or serve the folder with any static server.
