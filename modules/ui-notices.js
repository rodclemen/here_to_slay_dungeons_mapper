export function buildLocalDataNotice(kind, options = {}) {
  const tileSetLabel = String(options.tileSetLabel || "").trim();
  const tileSetLabels = Array.isArray(options.tileSetLabels)
    ? options.tileSetLabels.map((label) => String(label || "").trim()).filter(Boolean)
    : [];
  const isTauriRuntime = Boolean(options.isTauriRuntime);
  const hasDataFolder = Boolean(options.hasDataFolder);

  if (kind === "custom") {
    return {
      title: isTauriRuntime ? "Custom Tile Set Saved In Data Folder" : "Custom Tile Set Saved Locally",
      bodyParts: [
        {
          text: isTauriRuntime
            ? hasDataFolder
              ? "Custom tile sets are stored in the chosen data folder on this machine. They survive app restarts, but they are still local-only until you export a backup or shareable package."
              : "Custom tile sets can only be saved after you choose a data folder. Until then, desktop changes stay temporary and imports cannot be stored."
            : "Custom tile sets are only stored in this browser. Reloads and browser restarts are fine, but clearing site data or moving to another browser/device can lose them. Export custom tile sets if you want a backup or something you can share.",
        },
      ],
      attentionLabels: tileSetLabels.length ? tileSetLabels : (tileSetLabel ? [tileSetLabel] : []),
      actionLabel: isTauriRuntime ? "Export" : "Save",
      actionContext: options.tileSetId
        ? { type: "open_tile_editor_export", tileSetId: options.tileSetId }
        : null,
    };
  }

  if (kind === "built_in") {
    return {
      title: "Built-In Tile Edits Are Local",
      body: isTauriRuntime
        ? hasDataFolder
          ? "Built-in wall faces, portals, end-tile flags, and shared guide-point edits are stored in the chosen data folder on this machine. If you want a portable backup, use Export Debug Walls JSON and keep the file somewhere safe."
          : "Built-in wall faces, portals, end-tile flags, and shared guide-point edits need a data folder before they can persist in the desktop app. If you want a portable backup later, use Export Debug Walls JSON and keep the file somewhere safe."
        : "Built-in wall faces, portals, end-tile flags, and shared guide-point edits are stored only in this browser. If you want a backup, use Export Debug Walls JSON and keep the file somewhere safe.",
      actionLabel: "Export Debug Walls JSON",
      actionContext: { type: "export_debug_walls" },
    };
  }

  return null;
}
