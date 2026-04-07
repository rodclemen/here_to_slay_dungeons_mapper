# Wall Editor Future Notes

This file is for planning future Wall Editor changes that are not implemented yet, especially when official tile art or rules details reveal new tile metadata needs.

`CHANGELOG.md` should stay limited to completed work.
`README.md` should stay user-facing.
This file is the scratchpad for "what we may need next."

## Current Model

Wall Editor currently supports:

- Per-face wall toggles
- Per-tile endpoint eligibility via `End Tile`
- Per-tile portal metadata via `Portal Flag`
- Shared guide-point template editing for `Entrance` and `Tile 01`
- JSON export/import of wall-editor override data

## Portal Rules

- Portal data is not directional
- Portal data exists only to help auto-build avoid placing two portal tiles next to each other
- The red flag on the tile art is a visual marker for where the portal appears on the illustration

## Tile Set Status

### Dreamscape

- Portal behavior is already covered by the current portal-flag system
- No additional special tile handling is currently planned

### Nightmare

- Portal behavior is already covered by the current portal-flag system
- No additional special tile handling is currently planned

### Molten

- No special tile metadata currently needed beyond walls

### Overgrown

- No special tile metadata currently needed beyond walls

### Submerged

- Waiting for official tile/rule details before deciding whether Wall Editor needs new controls

### Deep Freeze

- Waiting for official tile/rule details before deciding whether Wall Editor needs new controls

## Possible Future Metadata

If official tiles introduce extra requirements, these are the kinds of additions that may belong in Wall Editor:

- Special per-tile markers beyond portal flags
- Per-face metadata other than wall / not-wall
- Restricted adjacency rules
- Tile-specific auto-build constraints
- Additional draggable markers tied to artwork positions

## Questions To Revisit When Official Tiles Arrive

- Is the new behavior per tile, per face, or per point on the art?
- Does it affect auto-build, manual placement validation, or both?
- Does it need to be visible outside Wall Editor?
- Does it need import/export support?
- Does it need README and Wall Editor intro copy updates?
