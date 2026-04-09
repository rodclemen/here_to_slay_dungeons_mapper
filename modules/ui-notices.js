export function buildLocalDataNotice(kind, options = {}) {
  const tileSetLabel = String(options.tileSetLabel || "").trim();

  if (kind === "custom") {
    return {
      title: "Custom Tile Set Saved Locally",
      body: `${tileSetLabel || "This custom tile set"} is stored only in this browser. Reloads and browser restarts are fine, but clearing site data or moving to another browser/device can lose it. Export the custom tile set if you want a backup or something you can share.`,
      actionLabel: "Export This Custom Set",
      actionContext: options.tileSetId
        ? { type: "export_custom_tile_set", tileSetId: options.tileSetId }
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
