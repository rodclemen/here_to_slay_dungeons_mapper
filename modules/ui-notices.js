export function buildLocalDataNotice(kind, options = {}) {
  const tileSetLabel = String(options.tileSetLabel || "").trim();
  const tileSetLabels = Array.isArray(options.tileSetLabels)
    ? options.tileSetLabels.map((label) => String(label || "").trim()).filter(Boolean)
    : [];

  if (kind === "custom") {
    return {
      title: "Custom Tile Set Saved Locally",
      bodyParts: [
        { text: "Custom tile sets are only stored in this browser. Reloads and browser restarts are fine, but clearing site data or moving to another browser/device can lose them. Export custom tile sets if you want a backup or something you can share." },
      ],
      attentionLabels: tileSetLabels.length ? tileSetLabels : (tileSetLabel ? [tileSetLabel] : []),
      actionLabel: "Save",
      actionContext: options.tileSetId
        ? { type: "open_tile_editor_backup", tileSetId: options.tileSetId }
        : null,
    };
  }

  if (kind === "built_in") {
    return {
      title: "Built-In Tile Edits Are Local",
      body: "Built-in wall, portal, endpoint, and shared guide-point edits are stored only in this browser. If you want a backup, use Export Debug Walls and keep the JSON file somewhere safe.",
      actionLabel: "Export Debug Walls",
      actionContext: { type: "export_debug_walls" },
    };
  }

  return null;
}
