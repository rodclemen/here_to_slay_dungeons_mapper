# Custom Tileset QA Checklist

This checklist is the Phase 1 cleanup pass for the custom-tileset refactor.

Status: completed and working, confirmed by manual QA.

Focus:

- verify the end-to-end user workflow in the browser
- catch regressions in local persistence, sharing, export/import, and backup UX
- confirm built-in and custom editor behavior stay separated where intended

Use this together with:

- [custom-tileset-plan.md](./done/custom-tileset-plan.md)
- [custom-tileset-refactor-checklist.md](./done/custom-tileset-refactor-checklist.md)

## Test setup

Before running the checklist:

- start with at least one fresh custom tile set created locally
- keep one exportable custom package available for re-import testing
- keep one incomplete custom tile set available if possible, so bulk export skip behavior can be checked
- test in a normal browser profile, not private browsing

Recommended test artifacts:

- `Custom A`: created in-app and edited locally
- `Custom B`: imported from a `.zip`
- `Custom C`: incomplete set with partial or missing images

## 1. Create custom tile set

- create a new custom tile set from `Quick Actions`
- confirm the new set appears immediately in the main tile set selector
- confirm the app enters `Tile Editor`
- confirm the new set appears in the editor’s custom grouping
- confirm the local-data notice appears
- confirm the notice action exports the current custom set

Expected:

- the new custom set exists immediately without requiring import first
- no built-in set is modified by creation alone

## 2. Import custom tile set

- import a valid custom tile set package
- confirm the imported set appears in the main selector
- confirm entrance, regular tiles, reference card, and boss cards appear in the editor
- confirm imported wall/end/portal/guide data is present
- confirm the local-data notice appears

Expected:

- import succeeds without requiring manual refresh
- imported custom guide points are scoped to that custom set only

## 3. Duplicate-ID import behavior

- export an existing custom tile set
- rename that custom tile set in the editor
- import the exported package again
- confirm a new custom copy is created instead of overwriting the old set
- confirm the renamed original still exists

Expected:

- `Rename` changes the display label only
- duplicate-ID import creates a new copy with a fresh internal ID

## 4. Custom asset editing

- replace the entrance image for a custom set
- replace one regular tile image
- replace the reference card image
- replace a boss card image
- confirm the editor updates in place without a full-panel rerender blink
- confirm the local-data notice appears after replacements

Expected:

- only the changed slot updates visually
- the active selection stays stable

## 5. Custom metadata editing

- toggle wall faces on a custom tile
- toggle `End Tile`
- toggle `Portal Flag` and move the marker
- enable `Point Edit` and move guide points for:
  - `Entrance`
  - `Tile 01`
- reload the page
- return to the same custom set

Expected:

- all custom edits persist after reload
- custom guide-point edits affect only that custom set
- built-in shared guide templates are unchanged

## 6. Built-in metadata editing

- switch to a built-in tile set in `Tile Editor`
- edit wall faces, `End Tile`, and `Portal Flag`
- edit built-in guide points
- confirm the local-data notice appears
- use the notice action or quick action to export debug wall data

Expected:

- built-in guide-template edits remain shared across built-in sets
- custom sets are not affected by built-in guide-point edits
- built-in edits remain on the existing local browser storage path

## 7. Persistence checks

- create or edit a custom set
- reload the page
- fully close and reopen the browser if practical
- confirm custom sets and their edits still load
- confirm built-in wall-editor changes still load

Expected:

- normal reloads and restarts preserve local data in the same browser profile

Non-goal:

- site-data clearing recovery is not expected without exported backup files

## 8. Single custom export/import round trip

- export one fully populated custom tile set
- delete that local set
- import the exported zip
- verify art, wall data, end-tile flags, portal data, and guide points all return

Expected:

- export/import round trip reconstructs the same custom set content

## 9. Bulk custom backup export

- create or keep multiple local custom sets
- include at least one complete and one incomplete custom set if possible
- run `Export All Custom Tile Sets`
- confirm the outer backup zip downloads
- inspect that it includes:
  - a `README.txt`
  - one `.zip` per exportable custom tile set
- confirm incomplete sets are skipped and reported rather than crashing the export

Expected:

- bulk export succeeds even when some sets are incomplete

## 10. Share link with built-in set

- build a normal layout on a built-in tile set
- use `Copy Share Link`
- open the link
- confirm the layout restores correctly

Expected:

- no custom-share prompt appears
- restore is exact for the built-in layout state

## 11. Share link with custom set and exact restore

- build a layout using a custom tile set that is fully installed locally
- use `Copy Share Link`
- choose to export the matching share bundle
- confirm the bundle includes:
  - the custom tile set zip
  - the helper HTML
- open the shared link in an environment where the custom set is installed

Expected:

- layout restores exactly
- no fallback prompt is needed

## 12. Share link with missing custom set and fallback

- open a custom-layout share link in an environment where the matching custom set is not installed
- confirm the missing-custom prompt appears
- test `Cancel`
- confirm the current view is preserved and the status says to import the matching custom zip first
- test again and choose `OK`

Expected:

- `Cancel` does not partially load the layout
- `OK` loads a `Molten` fallback view
- status explains that layout positions were restored best-effort, but art and metadata are not exact

## 13. Helper HTML clarity

- open the exported helper HTML file directly
- confirm it clearly says:
  - import the included custom tile set zip first
  - then open the shared link
  - fallback is only approximate

Expected:

- the helper file is understandable without needing repo knowledge

## 14. Delete flow

- delete a custom tile set
- confirm it is removed from the selector and editor group
- reload the page
- confirm it does not return

Expected:

- delete removes stored manifest, assets, and custom editor data for that set

## 15. Notes and failures

Record:

- browser and version
- exact failing action
- whether the failure affects built-in sets, custom sets, or both
- whether the failure is visual only, persistence-related, or data-loss-risk

Priority guidance:

- `P0`: data loss, overwrite, broken restore, wrong set mutated
- `P1`: import/export/share flow broken but recoverable
- `P2`: notice/copy/UX mismatch, minor persistence confusion, visual issues
