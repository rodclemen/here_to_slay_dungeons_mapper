# Drawer Side Refactor Plan

Goal: fix the left/right drawer mismatch so the code, markup, CSS, saved state, and docs all agree on what is the `Tile Drawer` and what is the `Info Drawer`.

Right now the app renders correctly for users:

- Info Drawer on the left
- Tile Drawer on the right

But the internal naming is inverted:

- `#left-drawer` / `.drawer-left` contain the Tile Drawer content
- `#right-drawer` / `.drawer-right` contain the Info Drawer content
- CSS then positions those classes on the opposite sides

This plan is for fixing the naming debt properly instead of living forever with the inversion.

---

## Refactor Strategy

Do this as a coordinated refactor, not as piecemeal cleanup.

The safest target end state is:

- `#left-drawer` / `.drawer-left` mean the visual left drawer
- `#right-drawer` / `.drawer-right` mean the visual right drawer
- left-side collapse state means the actual left rail
- right-side collapse state means the actual right rail
- compact mode still keeps the Tile Drawer rail on the left
- compact mode staying on the left is a fixed product requirement, not something to reconsider during the refactor
- docs and status text remain content-based:
  - `Info Drawer`
  - `Tile Drawer`

Important: this is not just a CSS swap. It touches:

- DOM ids and container ownership
- JS element lookups
- collapse state and saved settings
- compact-mode drawer transfer logic
- drag/drop hit targets
- board overlay offsets
- docs and comments

---

## Current Problem Map

### Markup

- [index.html](/Users/rodclemen/Documents/Code/Here_to_slay/index.html:139) uses:
  - `#left-drawer` for Tile Drawer content
  - `#right-drawer` for Info Drawer content

### CSS

- [styles.css](/Users/rodclemen/Documents/Code/Here_to_slay/styles.css:1142) positions:
  - `.drawer-right` on the left
  - `.drawer-left` on the right

### JavaScript

- [app.js](/Users/rodclemen/Documents/Code/Here_to_slay/app.js:2139) binds:
  - `leftDrawer` to Tile Drawer DOM
  - `rightDrawer` to Info Drawer DOM
- collapse state is stored as:
  - `leftDrawerCollapsed` for Tile Drawer
  - `rightDrawerCollapsed` for Info Drawer
- compact mode moves the boss panel into `leftDrawerContent`, because that container is actually the Tile Drawer

### Docs

- Guide and README already describe the visual truth:
  - left = Info Drawer
  - right = Tile Drawer
- code-level names still describe the inverse

---

## Desired End State

After the refactor:

### Visual

- left side = Info Drawer
- right side = Tile Drawer
- compact mode = Tile Drawer rail on the left, Info Drawer hidden
- compact mode does not move to the right after the side-naming cleanup

### Internal Naming

- `leftDrawer` points to the visual left drawer
- `rightDrawer` points to the visual right drawer
- `.drawer-left` styles the visual left drawer
- `.drawer-right` styles the visual right drawer
- collapse state names match actual side, not content history

### Content Ownership

- left drawer container owns Info Drawer content
- right drawer container owns Tile Drawer content
- compact-mode special handling intentionally moves Tile Drawer behavior to the left rail when needed

---

## Recommended Execution Order

Do this in phases.

Do not mix unrelated UI cleanup into the same branch.

---

## Phase 1 — Rename The DOM To Match Reality

### Objective

Make the markup containers semantically correct before touching CSS behavior.

### Files

- [index.html](/Users/rodclemen/Documents/Code/Here_to_slay/index.html:139)

### Changes

1. Swap the drawer ids and content containers so the visual left drawer markup is the Info Drawer:
   - left container becomes Info Drawer
   - right container becomes Tile Drawer
2. Rename associated content container ids:
   - `left-drawer-content`
   - `right-drawer-content`
3. Keep visible headings correct:
   - left says `Info Drawer`
   - right says `Tile Drawer`
4. Keep control button labels and `aria-controls` aligned with the new ids.

### Notes

This is the point where the DOM finally becomes honest.

Do not try to preserve the old inverted ids “for compatibility.” That just keeps the debt alive.

---

## Phase 2 — Rename JS Variables And Collapse State

### Objective

Make JS side names match the actual side on screen.

### Files

- [app.js](/Users/rodclemen/Documents/Code/Here_to_slay/app.js:2139)

### Changes

1. Rename element refs:
   - `leftDrawer` = visual left drawer
   - `rightDrawer` = visual right drawer
2. Rename content refs:
   - `leftDrawerContent`
   - `rightDrawerContent`
3. Rename toggle button refs if needed only for clarity:
   - keep ids stable if already updated in markup
4. Rename collapse state to be side-based:
   - `leftDrawerCollapsed`
   - `rightDrawerCollapsed`
5. Re-check all callers that currently assume:
   - left = Tile Drawer
   - right = Info Drawer

### High-Risk Areas

- [app.js](/Users/rodclemen/Documents/Code/Here_to_slay/app.js:3734) collapse toggles
- [app.js](/Users/rodclemen/Documents/Code/Here_to_slay/app.js:3997) compact-mode switching
- [app.js](/Users/rodclemen/Documents/Code/Here_to_slay/app.js:4206) toggle-both logic
- [app.js](/Users/rodclemen/Documents/Code/Here_to_slay/app.js:8369) drag anchor logic
- [app.js](/Users/rodclemen/Documents/Code/Here_to_slay/app.js:8527) drop hit-testing

### Important Decision

Saved settings currently store drawer collapse by side keys:

- `left`
- `right`

If you change the meaning of those keys, existing users may see their drawers restored “wrong” after the refactor.

Recommended fix:

- migrate the saved drawer state once during load
- or version the drawer-state storage key and reset to sane defaults

Do not silently reinterpret old values without deciding this deliberately.

---

## Phase 3 — Make CSS Side Rules Honest

### Objective

Remove the inversion hack from CSS.

### Files

- [styles.css](/Users/rodclemen/Documents/Code/Here_to_slay/styles.css:1142)

### Changes

1. Make `.drawer-left` render on the left:
   - `left: 0`
2. Make `.drawer-right` render on the right:
   - `right: 0`
3. Reassign the side-specific border/shadow/background rules so they match the actual side.
4. Remove the temporary historical-warning comment after the refactor is complete.

### Also Update

- collapsed drawer toolbar anchoring
- collapsed drawer button positioning
- margin/pointer-event behavior
- `board-zoom-indicator` offset logic tied to the right-side Tile Drawer

### Key Areas

- [styles.css](/Users/rodclemen/Documents/Code/Here_to_slay/styles.css:1237)
- [styles.css](/Users/rodclemen/Documents/Code/Here_to_slay/styles.css:1284)
- [styles.css](/Users/rodclemen/Documents/Code/Here_to_slay/styles.css:2045)

---

## Phase 4 — Rebuild Compact Mode Deliberately

### Objective

Keep compact mode behavior correct after the side names become truthful.

Compact mode must remain on the left side after the refactor.

### Current Reality

Compact mode currently depends on `.drawer-left` being the Tile Drawer content, even though it visually renders on the left by override.

### Files

- [styles.css](/Users/rodclemen/Documents/Code/Here_to_slay/styles.css:4174)
- [app.js](/Users/rodclemen/Documents/Code/Here_to_slay/app.js:3997)

### Changes

1. Preserve the product behavior:
   - show the Tile Drawer rail on the left
   - hide the Info Drawer
   - do not move compact mode to the right just because the naming becomes correct
2. Update compact-mode CSS selectors to target the Tile Drawer by content ownership, not by old class assumptions.
3. Update `updateCompactSidePanelMode()` so it moves the boss section into the correct compact container after the rename.
4. Verify:
   - tray
   - reserve
   - boss pile
   - tile controls hidden
   - helper text hidden
   - progress indicator behavior

### Warning

Compact mode is the easiest place to accidentally “fix the desktop layout” but break the mobile/compact rail.

Treat it as a separate verification block, not a side effect.

---

## Phase 5 — Update Drag, Hit Testing, And Anchors

### Objective

Fix the parts of JS that depend on drawer geometry rather than just names.

### Files

- [app.js](/Users/rodclemen/Documents/Code/Here_to_slay/app.js:8369)
- [app.js](/Users/rodclemen/Documents/Code/Here_to_slay/app.js:8527)

### Areas To Verify

1. compact drag grow anchor
2. dropped-inside-drawer detection
3. board zoom indicator right offset
4. any pointer collision checks against left/right drawer elements

### Expected Risks

- tile drag return behavior
- boss drag return behavior
- reserve edit interactions
- compact rail drag targets

---

## Phase 6 — Migrate Or Reset Drawer Persistence

### Objective

Avoid restoring the wrong drawer collapsed state after the rename.

### Files

- [app.js](/Users/rodclemen/Documents/Code/Here_to_slay/app.js:2486)
- [app.js](/Users/rodclemen/Documents/Code/Here_to_slay/app.js:2523)

### Options

#### Option A — Storage Key Version Bump

Recommended for simplicity.

- create a new drawer-state storage key version
- default to sensible post-refactor values
- abandon the inverted historical mapping

Pros:

- low risk
- easy to reason about

Cons:

- users lose saved drawer collapse preference one time

#### Option B — One-Time Migration

- detect old key shape
- remap the old content-based meaning to the new side-based meaning

Pros:

- preserves user preferences

Cons:

- more code
- easy to get wrong

Recommendation: use Option A unless preserving drawer-collapse state is especially important.

---

## Phase 7 — Update Docs And Comments

### Objective

Remove the workaround language after the refactor is real.

### Files

- [README.md](/Users/rodclemen/Documents/Code/Here_to_slay/README.md:131)
- [about.html](/Users/rodclemen/Documents/Code/Here_to_slay/about.html:542)
- [styles.css](/Users/rodclemen/Documents/Code/Here_to_slay/styles.css:1138)
- [docs/maintenance-audit-plan.md](/Users/rodclemen/Documents/Code/Here_to_slay/docs/maintenance-audit-plan.md:1) if it references the mismatch

### Changes

1. Remove the temporary CSS inversion comment.
2. Add one short comment at the new compact-mode seam if needed.
3. Ensure docs describe:
   - left = Info Drawer
   - right = Tile Drawer
   - compact mode = Tile Drawer rail left

---

## Testing Plan

Test after each phase, not just at the end.

### Desktop Layout

1. Launch app in normal desktop width.
2. Confirm:
   - Info Drawer on left
   - Tile Drawer on right
   - headings match content
3. Collapse left drawer:
   - only Info Drawer collapses
   - collapsed button appears on the left edge
4. Collapse right drawer:
   - only Tile Drawer collapses
   - collapsed button appears on the right edge
5. Toggle both drawers with keyboard and UI buttons.

### Compact Mode

1. Resize into compact-mode trigger width.
2. Confirm:
   - Tile Drawer rail remains on the left
   - Info Drawer is hidden
   - boss section moves into compact rail correctly
3. Check:
   - tray rendering
   - reserve behavior
   - boss pile rendering
   - rotation controls hidden

### Interaction Tests

1. Drag tile from tray to board
2. Drag tile back toward drawer
3. Drag boss card to board
4. Drag placed boss back toward drawer
5. Swap reserve tiles
6. Collapse drawers while board has placed tiles
7. Check zoom indicator positioning with:
   - both drawers open
   - one open
   - both collapsed

### Persistence Tests

1. Change drawer collapsed state
2. Reload app
3. Confirm restore behavior matches the chosen migration strategy

### Docs Verification

1. Open Guide
2. Check left/right drawer descriptions
3. Check README drawer sections

---

## Recommended Commit Breakdown

Do not land this as one giant commit.

### Commit 1

`Refactor drawer markup and JS naming to match screen sides`

Includes:

- `index.html`
- `app.js`

### Commit 2

`Make drawer CSS and compact mode side rules explicit`

Includes:

- `styles.css`

### Commit 3

`Update drawer persistence and docs after side refactor`

Includes:

- `app.js`
- `README.md`
- `about.html`
- related docs

---

## Rollback Strategy

If the refactor goes sideways:

1. revert the compact-mode changes first
2. verify desktop layout only
3. reintroduce compact mode after the side naming is stable

If needed, land the refactor in two stages:

- Stage 1: honest desktop side naming
- Stage 2: compact-mode cleanup and storage migration

---

## Success Criteria

This refactor is done only when all of the following are true:

- markup ids and classes match the side they render on
- JS `left` and `right` names mean actual left and right
- CSS no longer relies on the inversion hack
- compact mode still behaves correctly
- collapse state is either migrated or deliberately reset
- docs and comments no longer need to explain the old mismatch
