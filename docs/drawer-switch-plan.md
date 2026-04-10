# Drawer Switch Plan

Goal: put the Info Drawer on the left side and the Tile Drawer on the right side in the normal desktop layout, while keeping each drawer's existing content and behavior intact. Compact mode should still keep the compact tile rail on the left.

## Implementation Plan

1. Keep the drawer content and IDs intact.
   - Keep `#left-drawer` as the Tile Drawer content.
   - Keep `#right-drawer` as the Info Drawer content.
   - Do not move the normal tray, reserve, boss, status, or notice DOM between drawer content containers.

2. Swap the visual sides in normal desktop layout.
   - Change `.drawer-left` from `left: 0` to `right: 0`.
   - Change `.drawer-right` from `right: 0` to `left: 0`.
   - Keep the existing width variables so the Tile Drawer still uses `--left-drawer-width` and the Info Drawer still uses `--right-drawer-width`.

3. Update side-specific borders and shadows.
   - Tile Drawer on the right should use the right-edge border/radius/shadow treatment.
   - Info Drawer on the left should use the left-edge border/radius/shadow treatment.

4. Fix collapsed drawer buttons.
   - `body.left-drawer-collapsed .drawer-left` still means the Tile Drawer is collapsed, but visually it should collapse to the right edge.
   - `body.right-drawer-collapsed .drawer-right` still means the Info Drawer is collapsed, but visually it should collapse to the left edge.
   - Update the collapsed toolbar positioning rules accordingly.

5. Update toggle icons and copy.
   - Tile Drawer should use the right-panel icon because it is now on the right.
   - Info Drawer should use the left-panel icon because it is now on the left.
   - Change status text from `Left drawer...` and `Right drawer...` to `Tile drawer...` and `Info drawer...`.

6. Adjust board overlays that depend on drawer side.
   - The board zoom indicator currently offsets from the right when the right drawer is open.
   - After switching, it should offset from the right when the Tile Drawer is open, so it should depend on `left-drawer-collapsed` and `--left-drawer-width`.

7. Keep compact mode on the left.
   - Leave compact mode keyed to `.drawer-left`, because `.drawer-left` is still the Tile Drawer content.
   - Ensure compact mode overrides normal desktop placement:
     - `body.compact-sidepanel-mode .drawer-left { left: 0; right: auto; width: 72px !important; }`
     - `body.compact-sidepanel-mode .drawer-right { display: none !important; }`

8. Keep mobile behavior deliberate.
   - Recommended: keep the existing stacked mobile order as board, tile drawer, info drawer unless we decide separately that mobile should mirror the desktop side swap.

9. Verify.
   - Run `node --check app.js`.
   - Check normal desktop: Info Drawer left, board center, Tile Drawer right.
   - Check collapse/expand for both drawers.
   - Check compact mode: compact tile rail remains on the left and info drawer is hidden.
   - Check tile drag, reserve, boss cards, local data notice, and placement feedback still behave as before.
