# Here to Slay DUNGEONS Mapper — Maintenance Audit Plan

> Step-by-step guide for optimization checks, stale-code cleanup, label verification, and comment/readability passes.

---

## Goal

This plan is for a deliberate maintenance pass, not feature work.

It focuses on four things:

1. performance and optimization opportunities
2. stale or dead code
3. wrong, inconsistent, or outdated labels in the UI and docs
4. bad comments, missing comments, and readability cleanup

The goal is to improve clarity and maintainability without changing game behavior unless a verified bug is found.

---

## Ground Rules

- Work in small slices. Do not combine unrelated cleanup into one giant patch.
- Verify behavior before changing labels or comments.
- Prefer deleting stale code over “keeping it just in case.”
- Do not add comments that merely restate the code.
- Add comments only where intent, invariants, or non-obvious constraints need explanation.
- Keep user-facing wording consistent across UI, Guide, README, changelog, and desktop menu labels.
- If a cleanup item might change behavior, treat it as a bug fix and test it separately.

---

## Recommended Output Per Pass

Each maintenance pass should produce:

- one scoped checklist of files reviewed
- one list of confirmed issues
- one list of deferred issues
- one commit per logical category when possible
- changelog notes only after commits

---

## Audit Order

Run the audit in this order so the easier, higher-signal problems are found first:

1. label and wording audit
2. stale-code audit
3. comment/readability audit
4. optimization audit
5. final verification pass

Do not start by “optimizing everything.” Most wasted time comes from tuning code that should first be renamed, moved, commented, or deleted.

---

## Phase 1 — Label And Wording Audit

### Objective

Find mismatches between:

- visible UI labels
- status messages
- button titles
- guide text
- README text
- Tauri menu labels
- changelog wording used as user-facing terminology

### Files To Check First

- `index.html`
- `about.html`
- `README.md`
- `app.js`
- `modules/wall-editor-ui.js`
- `modules/dev-qa-checks.js`
- `src-tauri/src/lib.rs`

### What To Look For

- old names still used after UI changes
- inconsistent terminology for the same thing
- labels that describe internal implementation instead of user meaning
- status messages that contradict current behavior
- desktop-only behavior described as if it exists in the browser
- browser-only behavior described as if it exists in Tauri
- left/right/top/bottom descriptions that do not match real layout

### Examples Of Drift To Catch

- `portal flag` vs `portal` vs `portal marker`
- `Tile Drawer` / `Info Drawer` location mistakes
- `Tile Set` picker location mistakes
- `Export PDF` behavior described as direct save instead of preview/print flow
- `dev mode` described differently in browser vs Tauri
- `Choose Data Folder` wording inconsistent across UI and docs

### Step-By-Step

1. Make a list of all top-level UI controls and drawer headings from `index.html`.
2. Trace each control’s real behavior in `app.js` or the relevant module.
3. Search the repo for the visible label text and compare every usage.
4. Mark each mismatch as one of:
   - wrong label
   - outdated doc
   - misleading status text
   - inconsistent naming
5. Fix the source of truth first:
   - UI label if the screen is wrong
   - code message if runtime text is wrong
   - docs if behavior is right but documentation drifted
6. Re-run searches for the old wording and resolve leftovers.

### Exit Criteria

- Every major control uses one consistent name.
- Guide and README match the current UI.
- Tauri menu wording matches the app terminology.

---

## Phase 2 — Stale Code Audit

### Objective

Find code that is:

- unused
- duplicated
- outdated after refactors
- keeping old behavior alive unnecessarily
- no longer reachable from current UI

### Files To Check First

- `app.js`
- `modules/`
- `styles.css`
- `index.html`
- `src-tauri/src/lib.rs`

### What To Look For

- constants that are no longer referenced
- DOM lookups for removed elements
- helper functions with no callers
- event listeners attached to dead controls
- old status messages for removed workflows
- CSS selectors for removed markup
- feature flags that are permanently on or off
- stale compatibility branches after a migration completed

### Step-By-Step

1. Search for recently renamed or removed features.
2. Check whether old IDs, classes, and helper functions still exist.
3. For each candidate:
   - find all references
   - decide if it is active, transitional, or dead
4. If dead:
   - remove the code
   - remove related comments
   - remove related CSS
   - remove related docs text
5. If transitional but still needed:
   - add a clear comment explaining why it still exists
   - note the cleanup condition
6. Prefer full removal over leaving no-op wrappers behind.

### Good Targets

- post-refactor glue that no longer does anything useful
- wrapper functions kept after extraction that can be inlined
- duplicated label/status text
- old browser-only storage wording after Tauri support
- dead dev helpers no longer reachable from the UI

### Exit Criteria

- No obvious dead DOM references remain.
- No removed feature still has active UI strings or event hooks.
- Transitional code is explicitly documented.

---

## Phase 3 — Comment And Readability Audit

### Objective

Remove bad comments, add high-value comments, and make dense code easier to scan.

### Bad Comments To Remove

- comments that simply restate the next line
- comments that are now inaccurate
- comments that describe old behavior
- comments that use obsolete terminology
- comments that explain obvious syntax instead of intent

### Good Comments To Add

- why a rule exists
- why a weird fallback exists
- why a branch is Tauri-only or browser-only
- why a value is intentionally hard-coded
- why an invariant must stay true
- why a piece of cleanup cannot be removed yet

### Best Places To Add Comments

- geometry and placement rules
- auto-build candidate filtering/scoring
- persistence boundaries between browser and desktop
- share/import/export fallback behavior
- Tauri filesystem and menu integration
- editor-only behavior that differs from build view

### Step-By-Step

1. Read the function without comments first.
2. Decide whether the code is already self-explanatory.
3. If yes, remove noisy comments.
4. If no, add a short comment before the non-obvious block.
5. Prefer naming cleanup before comment cleanup:
   - rename vague variables first
   - then add comments only if still needed
6. Keep comments focused on intent, constraints, or hazards.

### Comment Quality Rules

- one comment should answer one real question
- keep comments short
- avoid jokes in code comments unless the file already uses them intentionally
- do not comment every branch
- use comments to explain “why,” not “what”

### Exit Criteria

- complex code is easier to scan
- comments are accurate
- comment density is low but useful

---

## Phase 4 — Optimization Audit

### Objective

Identify real performance and maintainability wins without premature micro-tuning.

### Files To Check First

- `app.js`
- `modules/board-view.js`
- `modules/tile-placement.js`
- `modules/contact-analysis.js`
- `modules/board-visuals.js`
- `styles.css`
- `scripts/build-tauri-web.mjs`

### What To Measure

- repeated DOM queries
- repeated image loads
- repeated expensive geometry work
- unnecessary rerenders
- duplicated layout work during drag/zoom/rotate
- oversized shipped assets
- duplicated status/menu synchronization logic

### Optimization Checklist

- Are the same DOM nodes queried repeatedly instead of cached?
- Are expensive computations repeated inside pointermove loops?
- Are renders coalesced or triggered redundantly?
- Are images or derived geometries cached?
- Are Tauri assets/build outputs larger than they need to be?
- Are minification and packaging steps still doing the right thing?
- Are CSS selectors overly expensive or duplicated?

### Step-By-Step

1. Identify a hotspot by behavior, not guesswork.
2. Find the code path that runs repeatedly.
3. Check whether the work is:
   - duplicated
   - unnecessary
   - uncached
   - triggered too often
4. Write down the proposed optimization before editing code.
5. Prefer structural wins:
   - batching
   - caching
   - deleting duplicate work
   - reducing rerender frequency
6. Avoid low-value micro-optimizations unless profiling supports them.
7. Verify no UX regression after the change.

### Example Areas Worth Auditing

- auto-build candidate generation
- drag and snap calculations
- board rerender scheduling
- tile-set switching
- PDF preview setup
- Tauri asset staging and minification

### Exit Criteria

- each optimization has a clear before/after rationale
- no “cleanup” commit is hiding functional behavior changes
- expensive paths are simpler or measurably cheaper

---

## Phase 5 — Final Verification

### Objective

Confirm that the cleanup improved clarity without breaking behavior.

### Verification Checklist

- open main build view
- switch tile sets
- open Advanced Tools
- open Quick Actions
- toggle Tile Editor / Build View
- test at least one custom tile-set workflow
- test share-link generation
- test PDF preview flow
- test browser dev mode
- test Tauri dev mode if desktop changes were touched
- re-read updated Guide/README sections if labels changed

### Search-Based Verification

Run searches for:

- old labels
- removed IDs/classes
- stale terminology
- outdated comments
- TODOs created during the pass

### Exit Criteria

- no stale wording remains for the touched area
- no dead selectors or handlers remain for the touched area
- doc text matches current behavior

---

## Suggested Slice Plan

Do not try to do the entire audit in one go. Use slices like this:

### Slice A — Top Bar And Menus

- audit labels and status text
- fix docs
- remove stale menu code

### Slice B — Tile Editor Language And Comments

- unify editor terminology
- remove stale wall-editor comments
- add comments around non-obvious editor constraints

### Slice C — Browser vs Tauri Persistence

- verify labels, prompts, and docs
- remove stale browser-only assumptions
- comment platform split points

### Slice D — Auto Build And Placement Readability

- add comments for hard rules and heuristics
- simplify naming where possible
- look for duplicate scoring or snap work

### Slice E — CSS And Markup Cleanup

- remove dead selectors
- align class names with real semantics
- verify left/right naming against rendered layout

---

## Deliverables Template

Use this template when running a real maintenance pass:

```md
# Maintenance Pass: <scope>

## Reviewed
- file A
- file B
- file C

## Confirmed Issues
- issue 1
- issue 2

## Changes To Make
1. change one
2. change two
3. change three

## Deferred
- deferred issue 1
- deferred issue 2

## Verification
- verified flow 1
- verified flow 2
```

---

## Success Criteria

This plan is successful when:

- labels are consistent across UI, docs, and desktop shell
- dead code is removed instead of tolerated
- comments explain intent rather than narrate syntax
- dense areas are easier to read
- optimization work is tied to real hotspots
- each pass leaves the repo cleaner than it found it
