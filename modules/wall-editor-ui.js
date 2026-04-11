// ── Wall Editor UI ──────────────────────────────────────────────────
// DOM builders, panel renderers, and interaction handlers for the
// Tile Editor page.  Extracted from app.js to shrink the monolith.
//
// Every function receives a `ctx` object that bridges back to app.js
// state and helpers, so this module has zero direct app.js imports.
// ────────────────────────────────────────────────────────────────────

// ── Constants ───────────────────────────────────────────────────────

export const WALL_EDITOR_BASE_GROUPS = [
  {
    id: "molten_overgrown",
    label: "Molten / Overgrown",
    tileSetIds: ["molten", "overgrown"],
  },
  {
    id: "dreamscape_nightmare",
    label: "Dreamscape / Nightmare",
    tileSetIds: ["dreamscape", "nightmare"],
  },
  {
    id: "submerged_deep_freeze",
    label: "Submerged / Deep Freeze",
    tileSetIds: ["submerged", "deep_freeze"],
  },
];

// ── Group helpers ───────────────────────────────────────────────────

export function getWallEditorGroups(ctx) {
  const runtimeIds = new Set(ctx.getTileSetRegistry().map((ts) => ts.id));
  const baseGroups = WALL_EDITOR_BASE_GROUPS
    .map((group) => ({
      ...group,
      tileSetIds: group.tileSetIds.filter((id) => runtimeIds.has(id)),
    }))
    .filter((group) => group.tileSetIds.length > 0);

  const builtInIds = new Set(ctx.builtInTileSetRegistry.map((ts) => ts.id));
  const customTileSetIds = ctx.getTileSetRegistry()
    .filter((ts) => ts?.source === "custom" || !builtInIds.has(ts.id))
    .map((ts) => ts.id);

  if (customTileSetIds.length) {
    baseGroups.push({
      id: "custom_tile_sets",
      label: "Custom Tile Sets",
      tileSetIds: customTileSetIds,
    });
  }

  return baseGroups;
}

export function getWallEditorGroupById(groupId, ctx) {
  const groups = getWallEditorGroups(ctx);
  return groups.find((g) => g.id === groupId) || groups[0];
}

export function getWallEditorGroupIdForTileSet(tileSetId, ctx) {
  const groups = getWallEditorGroups(ctx);
  return groups.find((g) => g.tileSetIds.includes(tileSetId))?.id
    || groups[0]?.id
    || null;
}

// ── Toolbar hint system ─────────────────────────────────────────────

let wallEditorToolbarHintHideTimer = null;

export function showWallEditorToolbarHint(hintEl, message) {
  if (!hintEl) return;
  if (wallEditorToolbarHintHideTimer) {
    clearTimeout(wallEditorToolbarHintHideTimer);
    wallEditorToolbarHintHideTimer = null;
  }
  hintEl.textContent = message || "";
  hintEl.classList.toggle("is-visible", Boolean(message));
}

export function hideWallEditorToolbarHintWithDelay(hintEl, delayMs = 1000) {
  if (!hintEl) return;
  if (wallEditorToolbarHintHideTimer) {
    clearTimeout(wallEditorToolbarHintHideTimer);
  }
  wallEditorToolbarHintHideTimer = window.setTimeout(() => {
    hintEl.classList.remove("is-visible");
    hintEl.textContent = "";
    wallEditorToolbarHintHideTimer = null;
  }, delayMs);
}

export function attachWallEditorToolbarHint(button, hintEl, message) {
  if (!button || !hintEl || !message) return;
  button.addEventListener("mouseenter", () => {
    showWallEditorToolbarHint(hintEl, message);
  });
  button.addEventListener("focus", () => {
    showWallEditorToolbarHint(hintEl, message);
  });
  button.addEventListener("mouseleave", () => {
    hideWallEditorToolbarHintWithDelay(hintEl);
  });
  button.addEventListener("blur", () => {
    hideWallEditorToolbarHintWithDelay(hintEl);
  });
}

// ── Asset entries ───────────────────────────────────────────────────

export function getWallEditorAssetEntries(tileSet, ctx) {
  const coreEntries = ctx.buildTileDefs(tileSet.id).map((def) => ({
    kind: def.tileId === tileSet.entranceTileId ? "entrance" : "tile",
    assetKind: def.tileId === tileSet.entranceTileId ? "entrance" : "tile",
    assetId: def.tileId,
    tileId: def.tileId,
    label: ctx.getTileDisplayLabel(def.tileId),
    imageSrc: def.imageSrc,
    editableTile: true,
  }));
  const supportEntries = [
    {
      kind: "reference",
      assetKind: "reference",
      assetId: tileSet.referenceCardId,
      tileId: tileSet.referenceCardId,
      label: "Reference Card",
      imageSrc: ctx.resolveTileSetAssetPath(tileSet, "reference", tileSet.referenceCardId),
      editableTile: false,
    },
    ...tileSet.bossIds.map((bossId, index) => ({
      kind: "boss",
      assetKind: "boss",
      assetId: bossId,
      tileId: bossId,
      label: `Boss Card ${index + 1}`,
      imageSrc: ctx.resolveTileSetAssetPath(tileSet, "boss", bossId),
      editableTile: false,
    })),
  ];
  return { coreEntries, supportEntries };
}

// ── DOM builders ────────────────────────────────────────────────────

export function createWallEditorAssetSlot({
  tileSet,
  entry,
  contentEl,
  loaded = false,
  missing = false,
  note = "",
  ctx,
}) {
  const slot = document.createElement("div");
  slot.className = "wall-editor-asset-slot";
  slot.dataset.tileSetId = tileSet.id;
  slot.dataset.assetKind = entry.assetKind;
  slot.dataset.assetId = entry.assetId;
  if (entry.kind === "reference" || entry.kind === "boss") slot.classList.add("wall-editor-asset-slot-support");
  if (loaded) slot.classList.add("is-loaded");
  if (missing) slot.classList.add("is-missing");

  const frame = document.createElement("div");
  frame.className = "wall-editor-asset-frame";
  frame.appendChild(contentEl);
  slot.appendChild(frame);

  const meta = document.createElement("div");
  meta.className = "wall-editor-asset-meta";

  const title = document.createElement("strong");
  title.className = "wall-editor-asset-title";
  title.textContent = entry.label;
  meta.appendChild(title);

  if (note) {
    const noteEl = document.createElement("span");
    noteEl.className = "wall-editor-asset-note";
    noteEl.textContent = note;
    meta.appendChild(noteEl);
  }

  if (tileSet.source === "custom") {
    const actionBtn = document.createElement("button");
    actionBtn.type = "button";
    actionBtn.className = "wall-editor-asset-action";
    actionBtn.textContent = loaded ? "Replace Image" : "Load Image";
    actionBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      ctx.promptForCustomTileSetAsset(tileSet.id, entry.assetKind, entry.assetId);
    });
    meta.appendChild(actionBtn);
  }

  slot.appendChild(meta);
  return slot;
}

export function createWallEditorAssetPlaceholder(tileSet, entry, ctx) {
  const placeholder = document.createElement("button");
  placeholder.type = "button";
  placeholder.className = "wall-editor-asset-placeholder";
  if (entry.kind === "reference" || entry.kind === "boss") {
    placeholder.classList.add("wall-editor-asset-placeholder-support");
  } else {
    placeholder.classList.add("wall-editor-asset-placeholder-tile");
  }
  if (entry.kind === "reference" || entry.kind === "boss") {
    placeholder.innerHTML = `
      <span class="wall-editor-asset-placeholder-shape"></span>
      <span class="wall-editor-asset-placeholder-text">${tileSet.source === "custom" ? "Load image" : "Missing asset"}</span>
    `;
  } else if (entry.kind === "entrance") {
    const shape = document.createElement("img");
    shape.className = "wall-editor-asset-placeholder-entrance-shape";
    shape.src = "./tiles/nightmare/nightmare_entrance.png";
    shape.alt = "";
    shape.draggable = false;
    placeholder.appendChild(shape);
  } else {
    const guide = ctx.createHexClusterGuideElement({
      size: 304,
      radius: 57,
      className: "wall-editor-asset-placeholder-guide",
    });
    placeholder.appendChild(guide);
  }
  if (tileSet.source === "custom") {
    placeholder.addEventListener("click", () => {
      ctx.promptForCustomTileSetAsset(tileSet.id, entry.assetKind, entry.assetId);
    });
  } else {
    placeholder.disabled = true;
  }
  return placeholder;
}

export function createWallEditorSupportAssetCard(tileSet, entry) {
  const card = document.createElement("div");
  card.className = "wall-editor-support-card";
  const img = document.createElement("img");
  img.src = entry.imageSrc;
  img.alt = `${tileSet.label} ${entry.label}`;
  img.draggable = false;
  img.addEventListener("dragstart", (event) => event.preventDefault());
  card.appendChild(img);
  return card;
}

export function createWallEditorMetaToggle({ className, label, iconMarkup }) {
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = `wall-editor-meta-toggle ${className}`;
  if (iconMarkup?.trim()) toggle.classList.add("has-icon");
  toggle.setAttribute("role", "switch");
  toggle.setAttribute("aria-checked", "false");
  toggle.setAttribute("aria-label", label);
  toggle.innerHTML = `
    <span class="wall-editor-meta-toggle-icon" aria-hidden="true">${iconMarkup}</span>
    <span class="wall-editor-meta-toggle-label">${label}</span>
    <span class="wall-editor-meta-toggle-switch" aria-hidden="true">
      <span class="wall-editor-meta-toggle-track"></span>
      <span class="wall-editor-meta-toggle-thumb"></span>
    </span>
  `;
  return toggle;
}

// ── Tile element builder ────────────────────────────────────────────

export function createWallEditorTileElement(tileSetId, tile, ctx) {
  const tileEl = document.createElement("div");
  tileEl.className = "tile wall-editor-tile";
  tileEl.dataset.tileSetId = tileSetId;
  tileEl.dataset.tileId = tile.tileId;
  tile.dom = tileEl;

  const body = document.createElement("div");
  body.className = "tile-body";

  const img = document.createElement("img");
  img.src = tile.imageSrc;
  img.alt = `${ctx.getTileSetConfig(tileSetId).label} ${ctx.getTileDisplayLabel(tile.tileId)}`;
  if (ctx.isMoltenRegularTile(tile)) img.classList.add("molten-regular-img");
  if (ctx.isMoltenEntranceTile(tile)) img.classList.add("molten-entrance-img");
  img.draggable = false;
  img.addEventListener("dragstart", (event) => event.preventDefault());
  body.appendChild(img);

  const guideOverlay = ctx.createTileGuideOverlay(tile);
  body.appendChild(guideOverlay);
  tile.bodyDom = body;
  tile.guideDom = guideOverlay;
  tileEl.appendChild(body);
  syncWallEditorPortalFlag(tile, ctx);

  const assignActive = () => setActiveWallEditorTile(tileSetId, tile.tileId, ctx);
  const wallEditorToolbarHint = ctx.wallEditorPage?.querySelector(".wall-editor-toolbar-hint");
  if (!ctx.isEntranceTile(tile)) {
    const toggleGroup = document.createElement("div");
    toggleGroup.className = "wall-editor-toggle-group";
    tileEl.appendChild(toggleGroup);

    const endToggle = createWallEditorMetaToggle({
      className: "wall-end-tile-toggle",
      label: "End Tile",
      iconMarkup: "",
    });
    const syncEndToggle = () => {
      const allowed = Boolean(tile.allowAsEndTile);
      endToggle.classList.toggle("is-on", allowed);
      endToggle.setAttribute("aria-checked", String(allowed));
    };
    endToggle.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    endToggle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      assignActive();
      tile.allowAsEndTile = !tile.allowAsEndTile;
      ctx.persistAllowAsEndTile(tileSetId, tile.tileId, tile.allowAsEndTile);
      syncEndToggle();
      ctx.setStatus(
        `${ctx.getTileSetConfig(tileSetId).label} ${ctx.getTileDisplayLabel(tile.tileId)} end-tile allowance: ${tile.allowAsEndTile ? "ON" : "OFF"}.`,
      );
    });
    syncEndToggle();
    attachWallEditorToolbarHint(
      endToggle,
      wallEditorToolbarHint,
      "Use End Tile to allow or disallow endpoint placement.",
    );
    toggleGroup.appendChild(endToggle);

    const portalToggle = createWallEditorMetaToggle({
      className: "wall-portal-flag-toggle",
      label: "Portal",
      iconMarkup: "",
    });
    const syncPortalToggle = () => {
      const enabled = ctx.hasPortalFlag(tile);
      portalToggle.classList.toggle("is-on", enabled);
      portalToggle.setAttribute("aria-checked", String(enabled));
    };
    portalToggle.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    portalToggle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      assignActive();
      tile.portalFlag = ctx.hasPortalFlag(tile) ? null : { x: 0, y: 0 };
      ctx.persistPortalFlag(tileSetId, tile.tileId, tile.portalFlag);
      syncWallEditorPortalFlag(tile, ctx);
      syncPortalToggle();
      ctx.setStatus(
        ctx.hasPortalFlag(tile)
          ? `${ctx.getTileSetConfig(tileSetId).label} ${ctx.getTileDisplayLabel(tile.tileId)} portal flag: ON. Drag the portal marker to position it.`
          : `${ctx.getTileSetConfig(tileSetId).label} ${ctx.getTileDisplayLabel(tile.tileId)} portal flag: OFF.`,
      );
    });
    syncPortalToggle();
    attachWallEditorToolbarHint(
      portalToggle,
      wallEditorToolbarHint,
      "Use Portal Flag to mark portal tiles so auto-build avoids portal-to-portal adjacency when possible, then drag the portal marker onto the art.",
    );
    toggleGroup.appendChild(portalToggle);
  }
  tileEl.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    if (event.target.closest(".tile-portal-flag")) {
      assignActive();
      return;
    }
    const faceHit = event.target.closest(".tile-guide-face-hit");
    assignActive();
    if (!faceHit) return;
    event.preventDefault();
    event.stopPropagation();
    const faceIdx = Number.parseInt(faceHit.dataset.faceIndex || "", 10);
    if (!Number.isInteger(faceIdx)) return;
    if (tile.wallFaceSet.has(faceIdx)) {
      tile.wallFaceSet.delete(faceIdx);
    } else {
      tile.wallFaceSet.add(faceIdx);
    }
    ctx.persistTileWallFaces(tileSetId, tile.tileId, tile.wallFaceSet);
    ctx.refreshTileWallGuide(tile);
    const list = Array.from(tile.wallFaceSet).sort((a, b) => a - b).join(", ") || "none";
    ctx.setStatus(`${ctx.getTileSetConfig(tileSetId).label} ${ctx.getTileDisplayLabel(tile.tileId)} wall faces: ${list}.`);
  });
  tileEl.addEventListener("click", assignActive);

  return tileEl;
}

// ── Portal flag interaction ─────────────────────────────────────────

export function syncWallEditorPortalFlag(tile, ctx) {
  ctx.syncTilePortalFlag(tile, { interactive: true });
}

export function beginWallEditorPortalFlagDrag(tile, event, ctx) {
  if (event.button !== 0) return;
  const bodyRect = tile.bodyDom?.getBoundingClientRect();
  if (!bodyRect) return;

  event.preventDefault();
  event.stopPropagation();
  setActiveWallEditorTile(tile.tileSetId, tile.tileId, ctx);

  const applyPointerPosition = (clientX, clientY) => {
    const localX = ctx.clamp(clientX - bodyRect.left, 0, bodyRect.width);
    const localY = ctx.clamp(clientY - bodyRect.top, 0, bodyRect.height);
    tile.portalFlag = ctx.sanitizePortalFlagPosition({
      x: ((localX / bodyRect.width) - 0.5) * ctx.TILE_SIZE,
      y: ((localY / bodyRect.height) - 0.5) * ctx.TILE_SIZE,
    });
    syncWallEditorPortalFlag(tile, ctx);
  };

  const cleanup = () => {
    tile.portalFlagDom?.classList.remove("is-dragging");
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
    window.removeEventListener("pointercancel", handleUp);
  };

  const handleMove = (moveEvent) => {
    applyPointerPosition(moveEvent.clientX, moveEvent.clientY);
  };

  const handleUp = () => {
    cleanup();
    ctx.persistPortalFlag(tile.tileSetId, tile.tileId, tile.portalFlag);
    ctx.setStatus(
      `${ctx.getTileSetConfig(tile.tileSetId).label} ${ctx.getTileDisplayLabel(tile.tileId)} portal flag moved.`,
    );
  };

  tile.portalFlagDom?.classList.add("is-dragging");
  applyPointerPosition(event.clientX, event.clientY);
  window.addEventListener("pointermove", handleMove);
  window.addEventListener("pointerup", handleUp);
  window.addEventListener("pointercancel", handleUp);
}

// ── Selection ───────────────────────────────────────────────────────

export function setActiveWallEditorTile(tileSetId, tileId, ctx) {
  ctx.state.wallEditorActiveTileSetId = tileSetId;
  ctx.state.wallEditorActiveTileId = tileId;
  for (const ref of ctx.state.wallEditorTileRefs.values()) {
    ref.el.classList.remove("selected");
  }
  const key = `${tileSetId}:${tileId}`;
  const ref = ctx.state.wallEditorTileRefs.get(key);
  if (ref) ref.el.classList.add("selected");
}

// ── Asset slot builders ─────────────────────────────────────────────

export async function buildWallEditorCoreAssetSlot(tileSet, entry, ctx) {
  const img = await ctx.loadImage(entry.imageSrc);
  const faceGeometry = ctx.getFaceGeometry(img, ctx.SIDES);
  const tile = {
    tileSetId: tileSet.id,
    tileId: entry.tileId,
    key: ctx.buildTileKey(tileSet.id, entry.tileId),
    imageSrc: entry.imageSrc,
    required: entry.kind === "entrance",
    img,
    faceGeometry,
    wallFaceSet: new Set(ctx.getStoredWallFaces(tileSet.id, entry.tileId)),
    allowAsEndTile: ctx.getStoredAllowAsEndTile(tileSet.id, entry.tileId),
    portalFlag: ctx.getStoredPortalFlag(tileSet.id, entry.tileId),
  };
  const tileEl = createWallEditorTileElement(tileSet.id, tile, ctx);
  const slot = createWallEditorAssetSlot({
    tileSet,
    entry,
    contentEl: tileEl,
    loaded: true,
    ctx,
  });
  return {
    slot,
    ref: {
      tileSetId: tileSet.id,
      tile,
      el: tileEl,
    },
  };
}

export async function buildWallEditorSupportAssetSlot(tileSet, entry, ctx) {
  const img = await ctx.loadImage(entry.imageSrc);
  const card = createWallEditorSupportAssetCard(tileSet, { ...entry, imageSrc: img.src });
  return createWallEditorAssetSlot({
    tileSet,
    entry,
    contentEl: card,
    loaded: true,
    ctx,
  });
}

export function buildMissingWallEditorAssetSlot(tileSet, entry, ctx) {
  return createWallEditorAssetSlot({
    tileSet,
    entry,
    contentEl: createWallEditorAssetPlaceholder(tileSet, entry, ctx),
    missing: true,
    note: tileSet.source === "custom" ? "No image loaded yet" : "Asset missing",
    ctx,
  });
}

// ── Panel builders ──────────────────────────────────────────────────

export function syncWallEditorPanelMissingNote(panel) {
  if (!panel) return;
  const missingCount = panel.querySelectorAll(".tile-set-wall-tray .wall-editor-asset-slot.is-missing").length;
  const existingNote = panel.querySelector(".tile-set-wall-note");
  if (!missingCount) {
    if (existingNote) existingNote.remove();
    return;
  }
  if (existingNote) {
    existingNote.textContent = `${missingCount} tile asset(s) missing in this tile set.`;
    return;
  }
  const note = document.createElement("p");
  note.className = "tile-set-wall-note";
  note.textContent = `${missingCount} tile asset(s) missing in this tile set.`;
  panel.appendChild(note);
}

export async function buildWallEditorTileSetPanel(tileSet, ctx) {
  const panel = document.createElement("section");
  panel.className = "tile-set-wall-panel";
  panel.dataset.tileSetId = tileSet.id;
  const wallEditorToolbarHint = ctx.wallEditorPage?.querySelector(".wall-editor-toolbar-hint");

  const header = document.createElement("div");
  header.className = "tile-set-wall-panel-header";
  const titleGroup = document.createElement("div");
  titleGroup.className = "tile-set-wall-panel-title-group";
  const title = document.createElement("h3");
  title.textContent = tileSet.label;
  titleGroup.appendChild(title);
  if (tileSet.source === "custom") {
    const renameBtn = document.createElement("button");
    renameBtn.type = "button";
    renameBtn.className = "wall-editor-panel-rename";
    renameBtn.dataset.icon = "rename";
    renameBtn.setAttribute("aria-label", `Rename ${tileSet.label}`);
    renameBtn.innerHTML = '<img src="./icons/pencil.png" alt="" aria-hidden="true" />';
    renameBtn.addEventListener("click", async () => {
      try {
        await ctx.renameCustomTileSet(tileSet.id);
      } catch (error) {
        console.error(error);
        ctx.setStatus("Could not rename custom tile set.", true);
      }
    });
    attachWallEditorToolbarHint(renameBtn, wallEditorToolbarHint, `Rename ${tileSet.label}`);
    titleGroup.appendChild(renameBtn);

    const exportBtn = document.createElement("button");
    exportBtn.type = "button";
    exportBtn.className = "wall-editor-panel-action";
    exportBtn.dataset.icon = "export";
    exportBtn.setAttribute("aria-label", `Export ${tileSet.label}`);
    exportBtn.addEventListener("click", async () => {
      try {
        await ctx.exportCustomTileSet(tileSet.id);
      } catch (error) {
        console.error(error);
        ctx.setStatus(error?.message || "Could not export custom tile set.", true);
      }
    });
    attachWallEditorToolbarHint(exportBtn, wallEditorToolbarHint, `Export ${tileSet.label}`);
    titleGroup.appendChild(exportBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "wall-editor-panel-delete";
    deleteBtn.setAttribute("aria-label", `Delete ${tileSet.label}`);
    deleteBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 448 512" aria-hidden="true">
        <path fill="currentColor" d="M135.2 17.7C140.6 7.1 151.5 0 163.5 0h121c12 0 22.9 7.1 28.3 17.7L328 32h88c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32h88l15.2-14.3zM53.2 128H394.8L376.6 435.1c-1.7 29.4-26 52.9-55.4 52.9H126.8c-29.4 0-53.7-23.5-55.4-52.9L53.2 128zm90.8 64c-13.3 0-24 10.7-24 24V400c0 13.3 10.7 24 24 24s24-10.7 24-24V216c0-13.3-10.7-24-24-24zm80 0c-13.3 0-24 10.7-24 24V400c0 13.3 10.7 24 24 24s24-10.7 24-24V216c0-13.3-10.7-24-24-24zm80 0c-13.3 0-24 10.7-24 24V400c0 13.3 10.7 24 24 24s24-10.7 24-24V216c0-13.3-10.7-24-24-24z"/>
      </svg>
    `;
    deleteBtn.addEventListener("click", async () => {
      try {
        await ctx.deleteCustomTileSet(tileSet.id);
      } catch (error) {
        console.error(error);
        ctx.setStatus("Could not delete custom tile set.", true);
      }
    });
    attachWallEditorToolbarHint(deleteBtn, wallEditorToolbarHint, `Delete ${tileSet.label}`);
    titleGroup.appendChild(deleteBtn);

    if (ctx.state.customTileSetBackupNeededIds.has(tileSet.id)) {
      const backupBtn = document.createElement("button");
      backupBtn.type = "button";
      backupBtn.className = "wall-editor-panel-backup-needed";
      backupBtn.setAttribute("aria-label", `Backup ${tileSet.label}`);
      backupBtn.textContent = "!";
      backupBtn.addEventListener("click", async () => {
        try {
          await ctx.exportCustomTileSet(tileSet.id);
        } catch (error) {
          console.error(error);
          ctx.setStatus(error?.message || "Could not export custom tile set.", true);
        }
      });
      attachWallEditorToolbarHint(backupBtn, wallEditorToolbarHint, `Backup ${tileSet.label}`);
      titleGroup.appendChild(backupBtn);
    }
  }
  header.appendChild(titleGroup);
  panel.appendChild(header);

  const tray = document.createElement("div");
  tray.className = "tile-set-wall-tray";
  panel.appendChild(tray);

  const supportTray = document.createElement("div");
  supportTray.className = "tile-set-support-tray";
  panel.appendChild(supportTray);

  const { coreEntries, supportEntries } = getWallEditorAssetEntries(tileSet, ctx);

  for (const entry of coreEntries) {
    try {
      const built = await buildWallEditorCoreAssetSlot(tileSet, entry, ctx);
      const slot = built.slot;
      tray.appendChild(slot);
      ctx.state.wallEditorTileRefs.set(`${tileSet.id}:${entry.tileId}`, built.ref);
    } catch (error) {
      console.warn(`Missing asset for ${tileSet.id}/${entry.tileId}`, error);
      const slot = buildMissingWallEditorAssetSlot(tileSet, entry, ctx);
      tray.appendChild(slot);
    }
  }

  for (const entry of supportEntries) {
    try {
      const slot = await buildWallEditorSupportAssetSlot(tileSet, entry, ctx);
      supportTray.appendChild(slot);
    } catch (error) {
      console.warn(`Missing support asset for ${tileSet.id}/${entry.assetId}`, error);
      const slot = buildMissingWallEditorAssetSlot(tileSet, entry, ctx);
      supportTray.appendChild(slot);
    }
  }

  syncWallEditorPanelMissingNote(panel);
  return panel;
}

// ── Page renderer ───────────────────────────────────────────────────

export async function renderWallEditorPage(ctx) {
  if (!ctx.wallEditorPage) return;

  ctx.wallEditorPage.innerHTML = "";
  const intro = document.createElement("div");
  intro.className = "wall-editor-intro";
  intro.innerHTML = `
    <strong>Tile Editor</strong><br />
    Use this page to edit tile metadata and manage custom tile sets in one place.<br />
    Click face segments to toggle wall ON/OFF.<br />
    Drag point handles on <strong>Entrance</strong> or <strong>Tile 01</strong> to edit shared guide templates.<br />
    Use <strong>End Tile</strong> to allow or disallow endpoint placement.<br />
    Use <strong>Portal Flag</strong> to mark portal tiles so auto-build avoids portal-to-portal adjacency when possible, then drag the portal marker onto the art.<br />
    Custom tile sets can also load or replace art here for entrance, regular tiles, reference card, and boss cards.<br />
    Everything is saved per tile set + tile.
  `;
  ctx.wallEditorPage.appendChild(intro);

  const toolbar = document.createElement("div");
  toolbar.className = "wall-editor-toolbar";
  const toolbarHint = document.createElement("div");
  toolbarHint.className = "wall-editor-toolbar-hint";
  toolbarHint.setAttribute("aria-hidden", "true");

  const addCustomBtn = document.createElement("button");
  addCustomBtn.type = "button";
  addCustomBtn.className = "wall-editor-toolbar-icon-btn";
  addCustomBtn.dataset.icon = "add";
  addCustomBtn.setAttribute("aria-label", "Add Custom Tile Set");
  addCustomBtn.addEventListener("click", () => {
    ctx.promptAndCreateCustomTileSet().catch((error) => {
      console.error(error);
      ctx.setStatus("Could not create custom tile set.", true);
    });
  });
  attachWallEditorToolbarHint(addCustomBtn, toolbarHint, "Add new custom tileset");
  toolbar.appendChild(addCustomBtn);

  const importCustomBtn = document.createElement("button");
  importCustomBtn.type = "button";
  importCustomBtn.className = "wall-editor-toolbar-icon-btn";
  importCustomBtn.dataset.icon = "import";
  importCustomBtn.setAttribute("aria-label", "Import Custom Tileset");
  importCustomBtn.addEventListener("click", () => {
    ctx.openCustomTileSetImportPicker();
  });
  attachWallEditorToolbarHint(importCustomBtn, toolbarHint, "Import custom tile set");
  toolbar.appendChild(importCustomBtn);

  const pointEditToggleBtn = document.createElement("button");
  pointEditToggleBtn.type = "button";
  pointEditToggleBtn.className = "wall-editor-toolbar-icon-btn";
  pointEditToggleBtn.dataset.icon = "point-edit";
  pointEditToggleBtn.setAttribute("aria-label", "Point Edit");
  const syncPointEditToggle = () => {
    pointEditToggleBtn.setAttribute("aria-pressed", String(ctx.state.wallEditorPointEditMode));
    pointEditToggleBtn.classList.toggle("is-active", ctx.state.wallEditorPointEditMode);
    toolbar.classList.toggle("is-point-edit-mode", ctx.state.wallEditorPointEditMode);
  };
  pointEditToggleBtn.addEventListener("click", () => {
    ctx.state.wallEditorPointEditMode = !ctx.state.wallEditorPointEditMode;
    ctx.syncWallEditorPointEditModeClass();
    syncPointEditToggle();
    ctx.refreshAllGuideTemplateConsumers();
    ctx.setStatus(
      ctx.state.wallEditorPointEditMode
        ? "Point edit mode on: drag handles on Entrance or Tile 01 to edit guide templates."
        : "Point edit mode off.",
    );
  });
  syncPointEditToggle();
  attachWallEditorToolbarHint(pointEditToggleBtn, toolbarHint, "Point edit mode");
  toolbar.appendChild(pointEditToggleBtn);

  const exportAllCustomBtn = document.createElement("button");
  exportAllCustomBtn.type = "button";
  exportAllCustomBtn.className = "wall-editor-toolbar-icon-btn";
  exportAllCustomBtn.dataset.icon = "export-all";
  exportAllCustomBtn.setAttribute("aria-label", "Export All Custom Tile Sets");
  const hasCustomTileSetsToExport = ctx.getTileSetRegistry().some((ts) => ts.source === "custom");
  exportAllCustomBtn.disabled = !hasCustomTileSetsToExport;
  exportAllCustomBtn.addEventListener("click", () => {
    if (exportAllCustomBtn.disabled) return;
    ctx.exportAllCustomTileSets().catch((error) => {
      console.error(error);
      ctx.setStatus(error?.message || "Could not export all custom tile sets.", true);
    });
  });
  attachWallEditorToolbarHint(
    exportAllCustomBtn,
    toolbarHint,
    hasCustomTileSetsToExport ? "Export all custom tile sets" : "No custom tile sets to export",
  );
  toolbar.appendChild(exportAllCustomBtn);

  const toolbarRightGroup = document.createElement("div");
  toolbarRightGroup.className = "wall-editor-toolbar-right";
  toolbar.appendChild(toolbarRightGroup);

  const groupLabel = document.createElement("label");
  groupLabel.className = "wall-editor-group-label";
  groupLabel.textContent = "Tile Set Group";

  const wallEditorGroups = getWallEditorGroups(ctx);
  if (!wallEditorGroups.length) return;
  const groupSelect = document.createElement("select");
  groupSelect.className = "wall-editor-group-select";
  for (const group of wallEditorGroups) {
    const option = document.createElement("option");
    option.value = group.id;
    option.textContent = group.label;
    groupSelect.appendChild(option);
  }
  groupSelect.value = getWallEditorGroupById(ctx.state.wallEditorGroupId, ctx).id;
  groupSelect.addEventListener("change", () => {
    ctx.state.wallEditorGroupId = groupSelect.value || wallEditorGroups[0]?.id || null;
    ctx.state.wallEditorTileRefs = new Map();
    ctx.state.wallEditorActiveTileSetId = null;
    ctx.state.wallEditorActiveTileId = null;
    renderWallEditorPage(ctx).catch((error) => {
      console.error(error);
      ctx.setStatus("Failed to build tile editor page. Check tile assets.", true);
    });
  });
  groupLabel.appendChild(groupSelect);
  toolbarRightGroup.appendChild(groupLabel);

  const copyTemplatesBtn = document.createElement("button");
  copyTemplatesBtn.type = "button";
  copyTemplatesBtn.className = "wall-editor-copy-btn dev-only";
  copyTemplatesBtn.textContent = "Copy Guide Template JSON";
  copyTemplatesBtn.addEventListener("click", () => {
    ctx.copyGuidePointTemplateExport();
  });
  toolbarRightGroup.appendChild(copyTemplatesBtn);

  ctx.wallEditorPage.appendChild(toolbar);
  ctx.wallEditorPage.appendChild(toolbarHint);

  const trays = document.createElement("div");
  trays.className = "wall-editor-trays";
  ctx.wallEditorPage.appendChild(trays);

  const selectedGroup = getWallEditorGroupById(ctx.state.wallEditorGroupId, ctx);
  if (!selectedGroup) return;
  const tileSets = selectedGroup.tileSetIds
    .map((id) => ctx.getTileSetConfig(id))
    .filter(Boolean);
  const panels = await Promise.all(tileSets.map((ts) => buildWallEditorTileSetPanel(ts, ctx)));
  for (const panel of panels) trays.appendChild(panel);
  if (ctx.state.wallEditorActiveTileSetId && ctx.state.wallEditorActiveTileId) {
    setActiveWallEditorTile(ctx.state.wallEditorActiveTileSetId, ctx.state.wallEditorActiveTileId, ctx);
  }
}

// ── Scroll-preserving re-render ─────────────────────────────────────

export async function rerenderWallEditorPreservingScroll(ctx) {
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const anchor = ctx.state.wallEditorAssetScrollAnchor
    ? { ...ctx.state.wallEditorAssetScrollAnchor }
    : null;
  await renderWallEditorPage(ctx);
  await ctx.waitForNextPaint();
  if (anchor) {
    const selector = `.wall-editor-asset-slot[data-tile-set-id="${CSS.escape(anchor.tileSetId)}"][data-asset-kind="${CSS.escape(anchor.assetKind)}"][data-asset-id="${CSS.escape(anchor.assetId)}"]`;
    const anchorEl = document.querySelector(selector);
    if (anchorEl) {
      anchorEl.scrollIntoView({ block: "center", inline: "nearest" });
      ctx.state.wallEditorAssetScrollAnchor = null;
      return;
    }
  }
  window.scrollTo(scrollX, scrollY);
  ctx.state.wallEditorAssetScrollAnchor = null;
}

// ── In-place slot patch ─────────────────────────────────────────────

export async function patchWallEditorAssetSlot(tileSetId, assetKind, assetId, ctx) {
  if (!ctx.wallEditorPage || !ctx.state.wallEditMode) return false;
  const tileSet = ctx.getTileSetConfig(tileSetId);
  if (!tileSet) return false;

  const slotSelector = `.wall-editor-asset-slot[data-tile-set-id="${CSS.escape(tileSetId)}"][data-asset-kind="${CSS.escape(assetKind)}"][data-asset-id="${CSS.escape(assetId)}"]`;
  const existingSlot = ctx.wallEditorPage.querySelector(slotSelector);
  if (!existingSlot) return false;

  const panel = existingSlot.closest(".tile-set-wall-panel");
  const isCoreAsset = assetKind === "tile" || assetKind === "entrance";
  const refsKey = isCoreAsset ? `${tileSetId}:${assetId}` : null;
  if (refsKey) ctx.state.wallEditorTileRefs.delete(refsKey);

  const { coreEntries, supportEntries } = getWallEditorAssetEntries(tileSet, ctx);
  const entry = (isCoreAsset ? coreEntries : supportEntries)
    .find((candidate) => candidate.assetKind === assetKind && candidate.assetId === assetId);
  if (!entry) return false;

  let nextSlot = null;
  let nextRef = null;
  try {
    if (isCoreAsset) {
      const built = await buildWallEditorCoreAssetSlot(tileSet, entry, ctx);
      nextSlot = built.slot;
      nextRef = built.ref;
    } else {
      nextSlot = await buildWallEditorSupportAssetSlot(tileSet, entry, ctx);
    }
  } catch (error) {
    console.warn(`Missing asset for ${tileSet.id}/${assetId}`, error);
    nextSlot = buildMissingWallEditorAssetSlot(tileSet, entry, ctx);
  }

  existingSlot.replaceWith(nextSlot);
  if (refsKey && nextRef) {
    ctx.state.wallEditorTileRefs.set(refsKey, nextRef);
  }
  if (panel && isCoreAsset) {
    syncWallEditorPanelMissingNote(panel);
  }
  return true;
}
