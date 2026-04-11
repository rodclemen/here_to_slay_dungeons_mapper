// ── Share Flow ──────────────────────────────────────────────────────
// URL snapshot encoding, share dialog, share bundle creation,
// share restore, and build-view layout capture/restore.
// Extracted from app.js.
//
// Every function that needs app.js state or helpers receives a `ctx`
// object — same pattern as the other extracted modules.
// ────────────────────────────────────────────────────────────────────

// ── Payload building ───────────────────────────────────────────────

export function captureShareLayoutPayload(ctx) {
  const snapshot = ctx.captureBuildViewLayout();
  const payload = ctx.buildShareLayoutPayload(snapshot, ctx.normalizeAngle);
  const tileSet = ctx.getTileSetConfig(snapshot.tileSetId);
  if (!tileSet) return payload;

  const tileSlotMetaById = new Map([
    [tileSet.entranceTileId, { kind: "entrance", slot: 0 }],
    ...tileSet.tileIds.map((tileId, index) => [tileId, { kind: "tile", slot: index + 1 }]),
  ]);
  payload.t = (payload.t || []).map((entry) => {
    const meta = tileSlotMetaById.get(String(entry?.i || ""));
    if (!meta) return entry;
    return {
      ...entry,
      k: meta.kind,
      sl: meta.slot,
    };
  });

  const regularSlotById = new Map(tileSet.tileIds.map((tileId, index) => [tileId, index + 1]));
  payload.o = (payload.o || []).map((tileId) => {
    const normalizedTileId = String(tileId || "");
    const slot = regularSlotById.get(normalizedTileId);
    return Number.isInteger(slot)
      ? { i: normalizedTileId, sl: slot }
      : normalizedTileId;
  });

  const bossIndexByKey = new Map(
    tileSet.bossIds.map((bossId, index) => [ctx.buildBossAssetKey(tileSet.id, bossId), index]),
  );
  payload.b = (payload.b || []).map((entry) => {
    const bossIndex = bossIndexByKey.get(String(entry?.k || ""));
    return Number.isInteger(bossIndex)
      ? { ...entry, bi: bossIndex }
      : entry;
  });

  return payload;
}

export function buildShareLayoutSnapshot(payload, ctx) {
  const normalizedPayload = payload && typeof payload === "object"
    ? {
        ...payload,
        o: (payload.o || []).map((entry) => (typeof entry === "string" ? entry : entry?.i || "")),
      }
    : payload;
  return ctx.buildShareLayoutSnapshotFromPayload(normalizedPayload, {
    getTileSetConfig: ctx.findTileSetConfigById,
    normalizeRegularTileOrder: ctx.normalizeRegularTileOrder,
    buildTileDefs: ctx.buildTileDefs,
    migrateLegacyTileId: ctx.migrateLegacyTileId,
    normalizeAngle: ctx.normalizeAngle,
    defaultBoardZoom: ctx.DEFAULT_BOARD_ZOOM,
    traySlotCount: ctx.TRAY_SLOT_COUNT,
  });
}

export function createShareLayoutUrl(ctx) {
  if (ctx.state.wallEditMode || !ctx.state.tiles.size) return null;
  return ctx.buildShareLayoutUrl(window.location.href, captureShareLayoutPayload(ctx));
}

export function buildShareFallbackPayload(payload, ctx, fallbackTileSetId = ctx.DEFAULT_TILE_SET_ID) {
  const fallbackTileSet = ctx.getTileSetConfig(fallbackTileSetId);
  return ctx.buildShareFallbackPayloadValue(payload, fallbackTileSet, ctx.buildBossAssetKey);
}

// ── Custom tile set export ─────────────────────────────────────────

export async function buildCustomTileSetExportArchive(tileSetId, ctx) {
  const tileSet = ctx.findTileSetConfigById(tileSetId);
  if (!tileSet || tileSet.source !== "custom") {
    throw new Error(`Could not export tileset: ${tileSetId}`);
  }

  const bundle = await ctx.getStoredCustomTileSetBundle(tileSetId);
  if (!bundle?.manifest) {
    throw new Error(`Could not find stored custom tileset: ${tileSetId}`);
  }
  const assetEntries = bundle.assets || [];
  if (!assetEntries.length) {
    throw new Error("This custom tile set has no stored images to export yet.");
  }

  const { manifest, assetMap } = ctx.buildExportedCustomTileSetManifest(bundle.manifest, assetEntries);
  const wallEditorData = ctx.buildExportedWallEditorData(tileSet);
  const zipEntries = [
    {
      name: "manifest.json",
      data: JSON.stringify(manifest, null, 2),
    },
    {
      name: "wall_editor.json",
      data: JSON.stringify(wallEditorData, null, 2),
    },
  ];

  for (const assetEntry of assetEntries) {
    const relativePath = assetMap?.[assetEntry.assetKind]?.[assetEntry.assetId];
    if (!relativePath || !(assetEntry.blob instanceof Blob)) continue;
    zipEntries.push({
      name: relativePath,
      data: assetEntry.blob,
    });
  }

  const archive = await ctx.createZipArchive(zipEntries);
  const date = new Date().toISOString().slice(0, 10);
  return {
    tileSet,
    archive,
    filename: `${ctx.sanitizeCustomTileSetFilename(tileSet.label || tileSet.id)}-${date}.zip`,
  };
}

export async function buildCustomShareBundleArchive(tileSetId, shareUrl, ctx) {
  const { tileSet, archive, filename } = await buildCustomTileSetExportArchive(tileSetId, ctx);
  const date = new Date().toISOString().slice(0, 10);
  const tileSetFilenameBase = ctx.sanitizeCustomTileSetFilename(tileSet.label || tileSet.id);
  const { bundle, filename: bundleFilename } = await ctx.buildCustomShareBundleArchiveValue({
    tileSetLabel: tileSet.label,
    tileSetFilenameBase,
    tileSetArchive: archive,
    tileSetArchiveFilename: filename,
    shareUrl,
    date,
  });
  return {
    tileSet,
    bundle,
    filename: bundleFilename,
  };
}

// ── Copy / share UI ────────────────────────────────────────────────

export async function copyShareLayoutLink(ctx) {
  if (ctx.state.wallEditMode) {
    ctx.setStatus("Share links are available on Build View only.", true);
    return false;
  }
  const url = createShareLayoutUrl(ctx);
  if (!url) {
    ctx.setStatus("Could not create a share link for the current layout.", true);
    return false;
  }
  try {
    await navigator.clipboard.writeText(url);
  } catch (error) {
    console.warn("Could not copy share link.", error);
    ctx.setStatus("Could not copy share link.", true);
    return false;
  }
  const activeTileSet = ctx.getTileSetConfig(ctx.state.selectedTileSetId);
  if (activeTileSet?.source === "custom") {
    const shouldExport = window.confirm(
      `This shared layout uses the browser-local custom tile set "${activeTileSet.label}".\n\nPress OK to also export a share bundle with:\n- the matching custom tile set .zip\n- a helper HTML file with import/open instructions\n\nPress Cancel to copy only the link.\n\nWithout the matching custom tile set, the receiver can only load a best-effort fallback view.`,
    );
    if (shouldExport) {
      try {
        const { bundle, filename } = await buildCustomShareBundleArchive(activeTileSet.id, url, ctx);
        ctx.downloadBlob(bundle, filename);
        ctx.setStatus(`Share link copied. Matching share bundle exported for ${activeTileSet.label}.`);
        ctx.markDevQaCheck("copy_share_link", { detail: activeTileSet.id });
        return true;
      } catch (error) {
        console.error(error);
        ctx.setStatus("Share link copied, but exporting the matching custom-set share bundle failed.", true);
        ctx.markDevQaCheck("copy_share_link", { detail: activeTileSet.id });
        return true;
      }
    }
    ctx.setStatus(`Share link copied. The receiver still needs the matching custom tile set installed, or they can only use fallback restore.`);
    ctx.markDevQaCheck("copy_share_link", { detail: activeTileSet.id });
    return true;
  }
  ctx.setStatus("Share link copied.");
  ctx.markDevQaCheck("copy_share_link", { detail: ctx.state.selectedTileSetId });
  return true;
}

// ── Restore ────────────────────────────────────────────────────────

export async function restoreSharedLayoutFromUrl(ctx) {
  const encoded = ctx.getShareQueryParam();
  if (!encoded) return false;

  let payload = null;
  try {
    payload = JSON.parse(ctx.decodeBase64Url(encoded));
  } catch (error) {
    console.warn("Could not decode shared layout from URL.", error);
    ctx.setStatus("Shared layout link is invalid or corrupted.", true);
    return false;
  }

  const requestedTileSetId = String(payload?.ts || "");
  let tileSet = ctx.findTileSetConfigById(requestedTileSetId);
  if ((!tileSet || tileSet.status !== "ready") && requestedTileSetId && requestedTileSetId !== ctx.DEFAULT_TILE_SET_ID) {
    const builtInIds = new Set(ctx.BUILT_IN_TILE_SET_REGISTRY.map((entry) => entry.id));
    const looksCustom = !builtInIds.has(requestedTileSetId);
    if (looksCustom) {
      const useFallback = window.confirm(
        `This shared layout uses the custom tile set "${requestedTileSetId}", which is not installed on this browser.\n\nPress OK to load a best-effort fallback with Molten.\nThis keeps the shared layout positions and slot mapping where possible, but the art and tile metadata will not be exact.\n\nPress Cancel to keep the current view and import the matching custom tile set .zip first.`,
      );
      if (!useFallback) {
        ctx.setStatus("Shared layout was not loaded. Import the matching custom tile set .zip first for an exact restore.", true);
        return false;
      }
      payload = buildShareFallbackPayload(payload, ctx, ctx.DEFAULT_TILE_SET_ID);
      tileSet = ctx.findTileSetConfigById(ctx.DEFAULT_TILE_SET_ID);
    }
  }

  const snapshot = buildShareLayoutSnapshot(payload, ctx);
  if (!snapshot) {
    ctx.setStatus("Shared layout link is invalid or unsupported.", true);
    return false;
  }

  tileSet = ctx.findTileSetConfigById(snapshot.tileSetId);
  if (!tileSet || tileSet.status !== "ready") {
    ctx.setStatus(`Shared layout tile set "${snapshot.tileSetId}" is unavailable on this build.`, true);
    return false;
  }

  if (snapshot.tileSetId !== ctx.state.selectedTileSetId) {
    await ctx.applyTileSet(snapshot.tileSetId, false);
  }

  const restored = restoreBuildViewLayout(snapshot, ctx);
  if (restored) {
    ctx.setStatus(
      snapshot.tileSetId === ctx.DEFAULT_TILE_SET_ID && requestedTileSetId && requestedTileSetId !== ctx.DEFAULT_TILE_SET_ID
        ? `Shared layout loaded with Molten fallback because "${requestedTileSetId}" is not installed locally. Layout positions were restored, but art and metadata may differ from the original custom set.`
        : "Shared layout loaded from link.",
    );
  } else {
    ctx.setStatus("Could not restore the shared layout.", true);
  }
  return restored;
}

export function restoreBuildViewLayout(snapshot, ctx) {
  if (!snapshot || snapshot.tileSetId !== ctx.state.selectedTileSetId) return false;

  const byId = new Map((snapshot.tiles || []).map((t) => [t.tileId || t.id, t]));
  if (!byId.size) return false;
  ctx.clearCompactModeBoardReset();
  const restoredOrder = Array.isArray(snapshot.regularTileOrder)
    ? snapshot.regularTileOrder.map((tileId) => ctx.migrateLegacyTileId(tileId))
    : ctx.deriveLegacyRegularTileOrder(snapshot, ctx.state.selectedTileSetId);
  ctx.setRegularTileOrder(restoredOrder, ctx.state.selectedTileSetId);

  for (const tile of ctx.state.tiles.values()) {
    const saved = byId.get(tile.tileId);
    if (!saved) continue;
    tile.placed = Boolean(saved.placed);
    tile.x = Number(saved.x) || 0;
    tile.y = Number(saved.y) || 0;
    tile.rotation = ctx.normalizeAngle(Number(saved.rotation) || 0);
  }

  ctx.state.boardPanX = Number(snapshot.boardPanX) || 0;
  ctx.state.boardPanY = Number(snapshot.boardPanY) || 0;
  ctx.state.boardZoom = Number(snapshot.boardZoom) || 1;
  ctx.state.boardZoomRaw = ctx.state.boardZoom;
  ctx.applyBoardZoom(ctx.state.boardZoom);
  ctx.syncRegularTileActivityFromSlotOrder(ctx.state.selectedTileSetId);

  ctx.clearBoard();
  ctx.scheduleBoardHexGridRender();
  ctx.rerenderTrayAndReserve();

  for (const tile of ctx.state.tiles.values()) {
    if (!tile.placed) continue;
    if (!tile.dom) tile.dom = ctx.createTileElement(tile);
    ctx.updateTileParent(tile, ctx.board);
    ctx.updateTileTransform(tile);
  }
  const start = ctx.state.tiles.get(ctx.ENTRANCE_TILE_ID);
  if (start?.placed) {
    ctx.setEntranceFadeAnchorFromTile(start);
    if (snapshot.referenceMarker && ctx.state.referenceTileSrc) {
      ctx.placeReferenceMarkerAt(snapshot.referenceMarker.x, snapshot.referenceMarker.y);
    } else {
      ctx.placeReferenceAboveStart(start);
    }
  }
  for (const savedToken of snapshot.bossTokens || []) {
    const bossKey = savedToken.bossKey || ctx.getBossKeyForLegacySrc(savedToken.src, snapshot.tileSetId);
    if (!bossKey) continue;
    ctx.createBossToken(
      bossKey,
      Number(savedToken.x) || 0,
      Number(savedToken.y) || 0,
      Number(savedToken.size) || ctx.TILE_SIZE,
    );
  }

  ctx.selectTile(null);
  return true;
}
