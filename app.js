const SIDES = 16;
const ROTATION_STEP = 60;
const TILE_SIZE = 170;
const CONTACT_DISTANCE_RATIO = 0.55;
const OPPOSITE_NORMAL_THRESHOLD = -0.88;
const FACE_TANGENT_ALIGNMENT = 0.85;
const SNAP_SEARCH_RADIUS = 28;
const SNAP_VISUAL_GAP = 0;
const SNAP_POINT_GAP = 0;
const MIN_CONTACT_POINTS = 4;
const INVALID_RETURN_DELAY_MS = 10_000;
const INVALID_DROP_PUSH_PX = 140;
const TILE_START_NON_NUMERIC_POINTS = new Set([11, 12]);
const BLOCKED_POINT_TOUCH_RADIUS = 4;
const WALL_OVERRIDES_STORAGE_KEY = "hts_wall_overrides_v1";
const UI_THEME_STORAGE_KEY = "hts_ui_theme_v1";
const DEFAULT_THEME_ID = "molten";
const DEFAULT_UI_THEME_ID = "current";
const THEME_OPTIONS = [
  { id: "molten", label: "Molten", folder: "molten", prefix: "molten" },
  { id: "overgrown", label: "Overgrown", folder: "overgrown", prefix: "overgrown" },
  { id: "dreamscape", label: "Dreamscape", folder: "dreamscape", prefix: "dreamscape" },
  { id: "nightmare", label: "Nightmare", folder: "nightmare", prefix: "nightmare" },
  { id: "submerged", label: "Submerged", folder: "submerged", prefix: "submerged" },
  { id: "deep_freeze", label: "Deep Freeze", folder: "deep_freeze", prefix: "deep_freeze" },
];
const BOSS_TILE_FILES = {
  molten: ["molten_boss_flamebeard.png", "molten_boss_abyss_empress.png"],
  overgrown: ["overgrown_boss_bloombrute.png", "overgrown_boss_rootgnaw"],
};
const BOARD_HEX_SVG_NS = "http://www.w3.org/2000/svg";
const REFERENCE_OFFSET_Y = TILE_SIZE * 0.86;

const board = document.getElementById("board");
const tray = document.getElementById("tray");
const reserveStack = document.getElementById("reserve-stack");
const bossStack = document.getElementById("boss-stack");
const reserveEditCheckbox = document.getElementById("reserve-edit-checkbox");
const wallEditorPage = document.getElementById("wall-editor-page");
const themeSelect = document.getElementById("theme-select");
const uiThemeSelect = document.getElementById("ui-theme-select");
const workspace = document.querySelector(".workspace");
const statusEl = document.getElementById("status");
const rerollBtn = document.getElementById("reroll-btn");
const resetTilesBtn = document.getElementById("reset-tiles-btn");
const toggleLabelsCheckbox = document.getElementById("toggle-labels-checkbox");
const toggleWallEditBtn = document.getElementById("toggle-wall-edit-btn");
const clearTileWallsBtn = document.getElementById("clear-tile-walls-btn");
const exportWallDataBtn = document.getElementById("export-wall-data-btn");
const importWallDataBtn = document.getElementById("import-wall-data-btn");
const importWallDataInput = document.getElementById("import-wall-data-input");
const saveDungeonBtn = document.getElementById("save-dungeon-btn");
const loadDungeonBtn = document.getElementById("load-dungeon-btn");
const loadDungeonInput = document.getElementById("load-dungeon-input");
const zoomResetBtn = document.getElementById("zoom-reset-btn");
const toggleWallsCheckbox = document.getElementById("toggle-walls-checkbox");
const toggleIgnoreContactCheckbox = document.getElementById("toggle-ignore-contact-checkbox");
const toggleFaceFeedbackCheckbox = document.getElementById("toggle-face-feedback-checkbox");
const dragLayer = document.createElement("div");
dragLayer.className = "drag-layer";
workspace.appendChild(dragLayer);
let boardHexRenderRaf = 0;

const state = {
  tiles: new Map(),
  selectedTileId: null,
  hoveredTileId: null,
  selectedThemeId: DEFAULT_THEME_ID,
  selectedUiThemeId: loadUiThemeId(),
  tileDefs: [],
  showGuideLabels: false,
  showWallFaces: false,
  wallEditMode: false,
  wallOverrides: loadWallOverrides(),
  wallEditorTileRefs: new Map(),
  wallEditorActiveThemeId: null,
  wallEditorActiveTileId: null,
  pendingSwapSource: null,
  reserveEditMode: false,
  reserveOrder: [],
  ignoreContactRule: false,
  useFaceFeedback: true,
  bossEditMode: false,
  bossOrderFlipped: false,
  bossTokens: [],
  nextBossTokenId: 1,
  boardPanX: 0,
  boardPanY: 0,
  frontpageSnapshot: null,
  referenceTileSrc: "",
  referenceMarker: null,
  boardZoom: 1,
};

init().catch((error) => {
  console.error(error);
  setStatus("Failed to initialize app. Check image paths.", true);
});

async function init() {
  bindGlobalControls();
  if (themeSelect) themeSelect.value = state.selectedThemeId;
  if (uiThemeSelect) uiThemeSelect.value = state.selectedUiThemeId;
  applyUiTheme(state.selectedUiThemeId);
  applyFeedbackMode(state.useFaceFeedback);
  applyBoardZoom(state.boardZoom);
  state.referenceTileSrc = getReferenceTileSrc(state.selectedThemeId);
  await applyTheme(state.selectedThemeId, false);
  scheduleBoardHexGridRender();
}

async function loadTiles(themeId = state.selectedThemeId) {
  const defs = buildTileDefs(themeId);
  state.tileDefs = defs;
  state.tiles.clear();
  for (const def of defs) {
    const img = await loadImage(def.src);
    const shape = getOpaqueBounds(img);
    const alphaMask = getAlphaMask(img);
    const faceGeometry = getFaceGeometry(img, SIDES);

    state.tiles.set(def.id, {
      ...def,
      img,
      x: 0,
      y: 0,
      rotation: 0,
      placed: false,
      active: def.required,
      dom: null,
      bodyDom: null,
      traySlot: null,
      drag: null,
      invalidReturnTimer: null,
      shape,
      alphaMask,
      faceGeometry,
      sideLength: faceGeometry.avgSideLength,
      apothem: faceGeometry.avgOffset,
      wallFaceSet: new Set(getStoredWallFaces(themeId, def.id)),
    });
  }
}

function getThemeConfig(themeId) {
  return THEME_OPTIONS.find((t) => t.id === themeId) || THEME_OPTIONS[0];
}

function buildTileDefs(themeId) {
  const theme = getThemeConfig(themeId);
  const basePath = `./tiles/${theme.folder}`;
  return [
    { id: "molten_entrance", src: `${basePath}/${theme.prefix}_entrance.png`, required: true },
    ...Array.from({ length: 9 }, (_, i) => ({
      id: `tile${i + 1}`,
      src: `${basePath}/${theme.prefix}${i + 1}.png`,
      required: false,
    })),
  ];
}

async function applyTheme(themeId, showStatus = true) {
  const nextTheme = getThemeConfig(themeId);
  const previousThemeId = state.selectedThemeId;
  try {
    state.selectedThemeId = nextTheme.id;
    state.referenceTileSrc = getReferenceTileSrc(nextTheme.id);
    await loadTiles(nextTheme.id);
    startRound();
    if (showStatus) setStatus(`Theme set to ${nextTheme.label}.`);
  } catch (error) {
    console.error(error);
    const previousTheme = getThemeConfig(previousThemeId);
    state.selectedThemeId = previousTheme.id;
    state.referenceTileSrc = getReferenceTileSrc(previousTheme.id);
    if (themeSelect) themeSelect.value = previousTheme.id;
    if (previousTheme.id !== nextTheme.id) {
      try {
        await loadTiles(previousTheme.id);
        startRound();
      } catch (fallbackError) {
        console.error(fallbackError);
      }
    }
    setStatus(`Theme "${nextTheme.label}" assets are missing. Keeping ${previousTheme.label}.`, true);
  }
}

function bindGlobalControls() {
  rerollBtn.addEventListener("click", () => rerollTrayTiles());
  if (resetTilesBtn) {
    resetTilesBtn.addEventListener("click", () => resetTiles());
  }
  if (toggleLabelsCheckbox) {
    toggleLabelsCheckbox.checked = state.showGuideLabels;
    toggleLabelsCheckbox.addEventListener("change", () => {
      state.showGuideLabels = toggleLabelsCheckbox.checked;
      document.body.classList.toggle("show-guide-labels", state.showGuideLabels);
    });
  }
  if (toggleWallsCheckbox) {
    toggleWallsCheckbox.checked = state.showWallFaces;
    toggleWallsCheckbox.addEventListener("change", () => {
      state.showWallFaces = toggleWallsCheckbox.checked;
      document.body.classList.toggle("show-wall-faces", state.showWallFaces);
    });
  }
  if (toggleIgnoreContactCheckbox) {
    toggleIgnoreContactCheckbox.checked = state.ignoreContactRule;
    toggleIgnoreContactCheckbox.addEventListener("change", () => {
      state.ignoreContactRule = toggleIgnoreContactCheckbox.checked;
      if (state.ignoreContactRule) {
        for (const tile of state.tiles.values()) {
          clearInvalidReturnTimer(tile);
          if (tile.placed) setPlacementFeedback(tile, null);
        }
      }
      setStatus(
        state.ignoreContactRule
          ? "Ignore 4-point rule: ON (placement allowed without minimum contact)."
          : "Ignore 4-point rule: OFF.",
      );
    });
  }
  if (toggleFaceFeedbackCheckbox) {
    toggleFaceFeedbackCheckbox.checked = state.useFaceFeedback;
    toggleFaceFeedbackCheckbox.addEventListener("change", () => {
      state.useFaceFeedback = toggleFaceFeedbackCheckbox.checked;
      applyFeedbackMode(state.useFaceFeedback);
      setStatus(
        state.useFaceFeedback
          ? "Connection feedback mode: face-by-face."
          : "Connection feedback mode: classic full outline.",
      );
    });
  }
  if (toggleWallEditBtn) {
    toggleWallEditBtn.addEventListener("click", () => {
      setWallEditMode(!state.wallEditMode);
    });
  }
  if (clearTileWallsBtn) {
    clearTileWallsBtn.addEventListener("click", () => {
      if (!state.wallEditMode) {
        setStatus("Clear Tile Walls is available only in wall edit mode.", true);
        return;
      }
      const active = getActiveTileForWallEditing();
      if (!active) {
        setStatus("Select or hover a tile to clear its wall faces.", true);
        return;
      }
      const { themeId, tile } = active;
      tile.wallFaceSet.clear();
      persistTileWallFaces(themeId, tile.id, tile.wallFaceSet);
      refreshTileWallGuide(tile);
      setStatus(`Cleared wall faces for ${tile.id} (${getThemeConfig(themeId).label}).`);
    });
  }
  if (themeSelect) {
    themeSelect.addEventListener("change", async (event) => {
      const nextThemeId = event.target.value;
      await applyTheme(nextThemeId, true);
    });
  }
  if (uiThemeSelect) {
    uiThemeSelect.addEventListener("change", (event) => {
      const nextThemeId = event.target.value || DEFAULT_UI_THEME_ID;
      state.selectedUiThemeId = nextThemeId;
      applyUiTheme(nextThemeId);
      saveUiThemeId(nextThemeId);
      setStatus(`UI theme set to ${nextThemeId === "molten" ? "Molten" : "Current"}.`);
    });
  }
  if (exportWallDataBtn) {
    exportWallDataBtn.addEventListener("click", () => {
      if (!state.wallEditMode) {
        setStatus("Export Walls is available only in wall edit mode.", true);
        return;
      }
      exportWallOverridesBackup();
    });
  }
  if (importWallDataBtn && importWallDataInput) {
    importWallDataBtn.addEventListener("click", () => {
      if (!state.wallEditMode) {
        setStatus("Import Walls is available only in wall edit mode.", true);
        return;
      }
      importWallDataInput.click();
    });
    importWallDataInput.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      await importWallOverridesBackup(file);
    });
  }
  if (saveDungeonBtn) {
    saveDungeonBtn.addEventListener("click", () => {
      exportDungeonLayout();
      const menu = saveDungeonBtn.closest(".settings-menu");
      if (menu) menu.open = false;
    });
  }
  if (loadDungeonBtn && loadDungeonInput) {
    loadDungeonBtn.addEventListener("click", () => {
      loadDungeonInput.click();
      const menu = loadDungeonBtn.closest(".settings-menu");
      if (menu) menu.open = false;
    });
    loadDungeonInput.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      await importDungeonLayout(file);
    });
  }
  if (zoomResetBtn) {
    zoomResetBtn.addEventListener("click", () => {
      resetBoardView();
      setStatus("Board view reset.");
      const menu = zoomResetBtn.closest(".settings-menu");
      if (menu) menu.open = false;
    });
  }
  if (reserveEditCheckbox) {
    reserveEditCheckbox.checked = state.reserveEditMode;
    document.body.classList.toggle("reserve-edit-mode", state.reserveEditMode);
    reserveEditCheckbox.addEventListener("change", () => {
      state.reserveEditMode = reserveEditCheckbox.checked;
      document.body.classList.toggle("reserve-edit-mode", state.reserveEditMode);
      if (state.reserveEditMode) {
        randomizeCurrentInactiveReserveOrder();
      } else {
        clearPendingReserveSwap();
      }
      renderInactiveTileStack();
      if (state.reserveEditMode) {
        setStatus("Reserve edit mode on: inactive tiles are shown side by side.");
      } else {
        setStatus("Reserve edit mode off: inactive tiles shown as stack.");
      }
    });
  }
  if (reserveEditCheckbox && reserveStack) {
    reserveStack.addEventListener("click", (event) => {
      if (state.reserveEditMode) {
        if (!isClickInTopRightCloseHit(event, reserveStack)) return;
      }
      reserveEditCheckbox.checked = !state.reserveEditMode;
      reserveEditCheckbox.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }
  if (bossStack) {
    bossStack.addEventListener("click", (event) => {
      if (event.target.closest(".boss-card")) return;
      setBossEditMode(!state.bossEditMode);
    });
  }

  document.addEventListener("keydown", (event) => {
    const activeTileId = state.hoveredTileId || state.selectedTileId;
    if (!activeTileId) return;

    const tile = state.tiles.get(activeTileId);
    if (!tile) return;

    if (event.key.toLowerCase() === "r") {
      rotateTile(tile, ROTATION_STEP);
    }

    if (event.key.toLowerCase() === "f") {
      rotateTile(tile, -ROTATION_STEP);
    }
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest(".view-menu, .settings-menu")) return;
    const openMenus = document.querySelectorAll(".view-menu[open], .settings-menu[open]");
    openMenus.forEach((menu) => {
      menu.open = false;
    });
  });

  board.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    if (state.wallEditMode) return;
    if (event.target.closest(".tile, .boss-token")) return;
    if (event.target.closest(".view-menu, .settings-menu")) return;
    beginBoardPan(event);
  });
  board.addEventListener(
    "wheel",
    (event) => {
      if (state.wallEditMode) return;
      event.preventDefault();
      const rect = board.getBoundingClientRect();
      const anchorX = clamp(event.clientX - rect.left, 0, rect.width);
      const anchorY = clamp(event.clientY - rect.top, 0, rect.height);
      const delta = -event.deltaY * 0.0012;
      zoomBoardAtPoint(delta, anchorX, anchorY);
    },
    { passive: false },
  );

  window.addEventListener("resize", scheduleBoardHexGridRender, { passive: true });

}

function loadUiThemeId() {
  try {
    const saved = localStorage.getItem(UI_THEME_STORAGE_KEY);
    if (saved === "molten" || saved === "current") return saved;
  } catch (error) {
    console.warn("Could not load UI theme preference.", error);
  }
  return DEFAULT_UI_THEME_ID;
}

function saveUiThemeId(themeId) {
  try {
    localStorage.setItem(UI_THEME_STORAGE_KEY, themeId);
  } catch (error) {
    console.warn("Could not save UI theme preference.", error);
  }
}

function applyUiTheme(themeId) {
  document.body.classList.toggle("ui-theme-molten", themeId === "molten");
  scheduleBoardHexGridRender();
}

function applyFeedbackMode(useFaceFeedback) {
  document.body.classList.toggle("feedback-legacy", !useFaceFeedback);
}

function getBoardZoom() {
  return Number.isFinite(state.boardZoom) ? state.boardZoom : 1;
}

function applyBoardZoom(zoom) {
  const clamped = clamp(zoom, 0.7, 1.8);
  state.boardZoom = clamped;
  board.style.setProperty("--board-zoom", clamped.toFixed(3));
  updateBoardZoomIndicator();
  scheduleBoardHexGridRender();
}

function resetBoardView() {
  const dx = -state.boardPanX;
  const dy = -state.boardPanY;
  translateBoardContent(dx, dy);
  applyBoardZoom(1);
}

function zoomBoardAtPoint(delta, anchorBoardX, anchorBoardY) {
  const prevZoom = getBoardZoom();
  const nextZoom = clamp(prevZoom + delta, 0.7, 1.8);
  if (Math.abs(nextZoom - prevZoom) < 1e-6) return;

  const worldXBefore = anchorBoardX / prevZoom;
  const worldYBefore = anchorBoardY / prevZoom;
  const worldXAfter = anchorBoardX / nextZoom;
  const worldYAfter = anchorBoardY / nextZoom;

  applyBoardZoom(nextZoom);
  translateBoardContent(worldXAfter - worldXBefore, worldYAfter - worldYBefore);
}

function translateBoardContent(dx, dy) {
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return;

  state.boardPanX += dx;
  state.boardPanY += dy;

  for (const tile of state.tiles.values()) {
    if (!tile.dom || !isOnBoardLayer(tile.dom.parentElement)) continue;
    positionTile(tile, tile.x + dx, tile.y + dy);
    updateTileTransform(tile);
  }

  if (state.referenceMarker?.dom) {
    const rx = state.referenceMarker.x + dx;
    const ry = state.referenceMarker.y + dy;
    state.referenceMarker.x = rx;
    state.referenceMarker.y = ry;
    state.referenceMarker.dom.style.left = `${rx}px`;
    state.referenceMarker.dom.style.top = `${ry}px`;
  }

  for (const token of state.bossTokens) {
    if (!token?.dom || !isOnBoardLayer(token.dom.parentElement)) continue;
    positionBossToken(token, token.x + dx, token.y + dy);
    updateBossTokenTransform(token);
  }

  scheduleBoardHexGridRender();
}

function updateBoardZoomIndicator() {
  let badge = board.querySelector(".board-zoom-indicator");
  if (!badge) {
    badge = document.createElement("button");
    badge.type = "button";
    badge.className = "board-zoom-indicator";
    badge.addEventListener("click", () => {
      resetBoardView();
    });
    const zoomText = document.createElement("span");
    zoomText.className = "zoom-text";
    zoomText.textContent = "Zoom";
    const zoomValue = document.createElement("span");
    zoomValue.className = "zoom-value";
    const zoomUnit = document.createElement("span");
    zoomUnit.className = "zoom-unit";
    zoomUnit.textContent = "%";
    badge.appendChild(zoomText);
    badge.appendChild(zoomValue);
    badge.appendChild(zoomUnit);
    board.appendChild(badge);
  }
  const valueEl = badge.querySelector(".zoom-value");
  const percent = Math.round(getBoardZoom() * 100);
  if (valueEl) valueEl.textContent = String(percent);
  badge.setAttribute("aria-label", `Reset zoom (${percent} percent)`);
}

function setWallEditMode(enabled) {
  clearPendingReserveSwap();
  state.wallEditMode = enabled;
  document.body.classList.toggle("wall-edit-mode", enabled);
  if (toggleWallEditBtn) {
    toggleWallEditBtn.textContent = enabled ? "Frontpage" : "Edit Walls";
  }
  if (enabled) {
    state.frontpageSnapshot = captureFrontpageLayout();
    startWallEditSession();
    setStatus("Wall edit mode: click a face segment to toggle wall ON/OFF. Changes are saved per theme+tile.");
  } else {
    syncSelectedThemeWallsFromOverrides();
    const restored = restoreFrontpageLayout(state.frontpageSnapshot);
    state.frontpageSnapshot = null;
    if (restored) {
      setStatus("Wall edit mode off. Restored previous layout.");
    } else {
      startRound();
      setStatus("Wall edit mode off. Round reset.");
    }
  }
}

function startWallEditSession() {
  clearBoard();
  state.wallEditorTileRefs = new Map();
  state.wallEditorActiveThemeId = null;
  state.wallEditorActiveTileId = null;
  renderWallEditorPage().catch((error) => {
    console.error(error);
    setStatus("Failed to build wall editor page. Check tile assets.", true);
  });
}

function captureFrontpageLayout() {
  const tiles = [];
  for (const tile of state.tiles.values()) {
    tiles.push({
      id: tile.id,
      active: Boolean(tile.active),
      placed: Boolean(tile.placed),
      x: Number(tile.x) || 0,
      y: Number(tile.y) || 0,
      rotation: Number(tile.rotation) || 0,
    });
  }
  return {
    themeId: state.selectedThemeId,
    boardPanX: Number(state.boardPanX) || 0,
    boardPanY: Number(state.boardPanY) || 0,
    boardZoom: Number(state.boardZoom) || 1,
    reserveOrder: Array.isArray(state.reserveOrder) ? [...state.reserveOrder] : [],
    tiles,
  };
}

function restoreFrontpageLayout(snapshot) {
  if (!snapshot || snapshot.themeId !== state.selectedThemeId) return false;

  const byId = new Map((snapshot.tiles || []).map((t) => [t.id, t]));
  if (!byId.size) return false;

  for (const tile of state.tiles.values()) {
    const saved = byId.get(tile.id);
    if (!saved) continue;
    tile.active = Boolean(saved.active);
    tile.placed = Boolean(saved.placed);
    tile.x = Number(saved.x) || 0;
    tile.y = Number(saved.y) || 0;
    tile.rotation = normalizeAngle(Number(saved.rotation) || 0);
  }

  state.boardPanX = Number(snapshot.boardPanX) || 0;
  state.boardPanY = Number(snapshot.boardPanY) || 0;
  state.boardZoom = Number(snapshot.boardZoom) || 1;
  applyBoardZoom(state.boardZoom);
  state.reserveOrder = Array.isArray(snapshot.reserveOrder) ? [...snapshot.reserveOrder] : [];

  clearBoard();
  scheduleBoardHexGridRender();
  rerenderTrayAndReserve();

  for (const tile of state.tiles.values()) {
    if (!tile.active || !tile.placed) continue;
    if (!tile.dom) tile.dom = createTileElement(tile);
    updateTileParent(tile, board);
    updateTileTransform(tile);
  }
  const start = state.tiles.get("molten_entrance");
  if (start?.placed) placeReferenceAboveStart(start);

  selectTile(null);
  return true;
}

function exportDungeonLayout() {
  if (state.wallEditMode) {
    setStatus("Save Dungeon is available on frontpage only.", true);
    return;
  }
  try {
    const snapshot = captureFrontpageLayout();
    const payload = {
      schema: "hts-dungeon-layout-v1",
      savedAt: new Date().toISOString(),
      layout: snapshot,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `hts-dungeon-${date}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("Dungeon layout exported.");
  } catch (error) {
    console.error(error);
    setStatus("Failed to export dungeon layout.", true);
  }
}

async function importDungeonLayout(file) {
  if (state.wallEditMode) {
    setStatus("Load Dungeon is available on frontpage only.", true);
    return;
  }
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const layout = parsed?.layout ?? parsed;
    if (!layout || typeof layout !== "object") {
      setStatus("Invalid dungeon file.", true);
      return;
    }

    const targetThemeId = layout.themeId || state.selectedThemeId;
    if (targetThemeId !== state.selectedThemeId) {
      await applyTheme(targetThemeId, false);
      if (themeSelect) themeSelect.value = targetThemeId;
    }
    const ok = restoreFrontpageLayout(layout);
    if (!ok) {
      setStatus("Could not restore dungeon layout.", true);
      return;
    }
    setStatus("Dungeon layout loaded.");
  } catch (error) {
    console.error(error);
    setStatus("Failed to load dungeon layout.", true);
  }
}

function startRound() {
  if (state.wallEditMode) {
    startWallEditSession();
    return;
  }
  clearBoard();

  const candidateTiles = state.tileDefs.filter((t) => !t.required).map((t) => t.id);
  const selectedIds = shuffle(candidateTiles).slice(0, 6);

  for (const tile of state.tiles.values()) {
    tile.active = tile.id === "molten_entrance" || selectedIds.includes(tile.id);
    tile.placed = false;
    tile.rotation = 0;
  }
  resetReserveOrderForCurrentInactive();

  renderActiveTiles();
  renderBossStack();
  placeStartTileAtCenter();
}

function rerollTrayTiles() {
  if (state.wallEditMode) {
    startWallEditSession();
    return;
  }

  const placedRegularIds = new Set(
    Array.from(state.tiles.values())
      .filter((tile) => !tile.required && tile.active && tile.placed)
      .map((tile) => tile.id),
  );
  const trayTargetCount = Math.max(0, 6 - placedRegularIds.size);
  const candidateIds = state.tileDefs
    .filter((def) => !def.required)
    .map((def) => def.id)
    .filter((id) => !placedRegularIds.has(id));
  const selectedTrayIds = new Set(shuffle(candidateIds).slice(0, trayTargetCount));

  for (const tile of state.tiles.values()) {
    if (tile.required) continue;
    if (placedRegularIds.has(tile.id)) {
      tile.active = true;
      tile.placed = true;
      continue;
    }
    if (selectedTrayIds.has(tile.id)) {
      tile.active = true;
      tile.placed = false;
      tile.rotation = 0;
      continue;
    }
    tile.active = false;
    tile.placed = false;
    tile.rotation = 0;
  }

  resetReserveOrderForCurrentInactive();
  rerenderTrayAndReserve();
  setStatus("Tray tiles rerolled. Grid placements kept.");
}

function resetTiles() {
  if (state.wallEditMode) {
    startWallEditSession();
    setStatus("Wall edit mode refreshed.");
    return;
  }

  clearBoard();
  renderActiveTiles();
  placeStartTileAtCenter();
  setStatus("Tiles reset to tray.");
}

function clearBoard() {
  for (const tile of state.tiles.values()) {
    clearInvalidReturnTimer(tile);
  }
  board.innerHTML = "";
  state.referenceMarker = null;
  state.bossTokens = [];
  updateBoardZoomIndicator();
  getBoardContentLayer();
  mountBoardHexGrid();
  tray.innerHTML = "";
  reserveStack.innerHTML = "";
  if (wallEditorPage && !state.wallEditMode) wallEditorPage.innerHTML = "";
  state.selectedTileId = null;
  state.hoveredTileId = null;
  clearPendingReserveSwap();
}

function getBoardContentLayer() {
  let layer = board.querySelector(".board-content");
  if (layer) return layer;
  layer = document.createElement("div");
  layer.className = "board-content";
  board.appendChild(layer);
  return layer;
}

function mountBoardHexGrid() {
  const layer = getBoardContentLayer();
  const svg = document.createElementNS(BOARD_HEX_SVG_NS, "svg");
  svg.classList.add("board-hex-grid");
  svg.setAttribute("aria-hidden", "true");
  layer.appendChild(svg);
  renderBoardHexGrid();
}

function scheduleBoardHexGridRender() {
  cancelAnimationFrame(boardHexRenderRaf);
  boardHexRenderRaf = requestAnimationFrame(renderBoardHexGrid);
}

function renderBoardHexGrid() {
  const svg = getBoardContentLayer().querySelector(".board-hex-grid");
  if (!svg) return;

  const w = Math.floor(board.clientWidth);
  const h = Math.floor(board.clientHeight);
  if (w <= 0 || h <= 0) return;
  const zoom = getBoardZoom();
  const drawW = Math.max(w, Math.ceil(w / zoom));
  const drawH = Math.max(h, Math.ceil(h / zoom));
  const layout = getBoardHexLayout(w, h);
  const panX = state.boardPanX;
  const panY = state.boardPanY;

  svg.style.width = `${drawW}px`;
  svg.style.height = `${drawH}px`;
  svg.setAttribute("viewBox", `0 0 ${drawW} ${drawH}`);
  svg.replaceChildren();

  const strokeColor = state.selectedUiThemeId === "molten"
    ? "rgba(255, 191, 129, 0.15)"
    : "rgba(54, 83, 102, 0.15)";

  const group = document.createElementNS(BOARD_HEX_SVG_NS, "g");
  group.setAttribute("fill", "none");
  group.setAttribute("stroke", strokeColor);
  group.setAttribute("stroke-width", "1");
  group.setAttribute("vector-effect", "non-scaling-stroke");

  const colStart = Math.floor((0 - panX - layout.minX) / layout.dx) - 2;
  const colEnd = Math.ceil((drawW - panX - layout.minX) / layout.dx) + 2;

  for (let col = colStart; col <= colEnd; col += 1) {
    const xBase = layout.minX + col * layout.dx;
    const x = xBase + panX;
    const yOffset = ((col % 2) + 2) % 2 ? (layout.hexHeight / 2) : 0;
    const rowStart = Math.floor((0 - panY - (layout.minY + yOffset)) / layout.dy) - 2;
    const rowEnd = Math.ceil((drawH - panY - (layout.minY + yOffset)) / layout.dy) + 2;
    for (let row = rowStart; row <= rowEnd; row += 1) {
      const yBase = layout.minY + yOffset + row * layout.dy;
      const y = yBase + panY;
      if (x < -layout.radius || x > drawW + layout.radius) continue;
      if (y < -layout.hexHeight || y > drawH + layout.hexHeight) continue;
      const path = document.createElementNS(BOARD_HEX_SVG_NS, "path");
      path.setAttribute("d", hexPath(x, y, layout.radius));
      group.appendChild(path);
    }
  }

  svg.appendChild(group);
}

function getBoardHexLayout(width = Math.floor(board.clientWidth), height = Math.floor(board.clientHeight)) {
  const w = Math.max(0, Math.floor(width));
  const h = Math.max(0, Math.floor(height));
  const padding = Math.max(16, Math.min(28, Math.floor(Math.min(w, h) * 0.045)));
  const targetCols = Math.max(6, Math.floor((w - padding * 2) / 64));
  const fallbackRadius = Math.max(14, Math.min(34, (w - padding * 2) / (targetCols * 1.5 + 0.5)));
  let radius = fallbackRadius;
  const maxRadiusByWidth = Math.max(10, (w - padding * 2) / 9.5);
  const maxRadiusByHeight = Math.max(10, (h - padding * 2) / 6.5);
  radius = Math.max(12, Math.min(radius, 34, maxRadiusByWidth, maxRadiusByHeight));
  const hexHeight = Math.sqrt(3) * radius;
  const dx = 1.5 * radius;
  const dy = hexHeight;
  return {
    padding,
    radius,
    hexHeight,
    dx,
    dy,
    minX: padding + radius,
    maxX: w - padding - radius,
    minY: padding + hexHeight / 2,
    maxY: h - padding - hexHeight / 2,
  };
}

function snapBoardPointToHex(x, y) {
  const layout = getBoardHexLayout();
  if (
    !Number.isFinite(layout.minX)
    || layout.minX > layout.maxX
    || layout.minY > layout.maxY
  ) {
    return { x, y };
  }

  const panX = state.boardPanX;
  const panY = state.boardPanY;
  const bx = x - panX;
  const by = y - panY;
  const approxCol = Math.round((bx - layout.minX) / layout.dx);

  let best = { x, y, d2: Number.POSITIVE_INFINITY };
  for (let dc = -2; dc <= 2; dc += 1) {
    const col = approxCol + dc;
    const cxBase = layout.minX + col * layout.dx;
    const yOffset = ((col % 2) + 2) % 2 ? (layout.hexHeight / 2) : 0;
    const approxRow = Math.round((by - (layout.minY + yOffset)) / layout.dy);
    for (let dr = -2; dr <= 2; dr += 1) {
      const row = approxRow + dr;
      const cyBase = layout.minY + yOffset + row * layout.dy;
      const cx = cxBase + panX;
      const cy = cyBase + panY;
      const dx = cx - x;
      const dy = cy - y;
      const d2 = dx * dx + dy * dy;
      if (d2 < best.d2) best = { x: cx, y: cy, d2 };
    }
  }
  return { x: best.x, y: best.y };
}

function hexPath(cx, cy, radius) {
  const halfH = (Math.sqrt(3) * radius) / 2;
  const p1 = `${cx + radius} ${cy}`;
  const p2 = `${cx + radius / 2} ${cy + halfH}`;
  const p3 = `${cx - radius / 2} ${cy + halfH}`;
  const p4 = `${cx - radius} ${cy}`;
  const p5 = `${cx - radius / 2} ${cy - halfH}`;
  const p6 = `${cx + radius / 2} ${cy - halfH}`;
  return `M ${p1} L ${p2} L ${p3} L ${p4} L ${p5} L ${p6} Z`;
}

function renderActiveTiles() {
  for (const tile of state.tiles.values()) {
    if (!tile.active) continue;

    const tileEl = createTileElement(tile);
    tile.dom = tileEl;

    if (tile.id === "molten_entrance") {
      updateTileParent(tile, board);
      tile.placed = true;
    } else {
      const slot = document.createElement("div");
      slot.className = "tray-slot";
      slot.appendChild(tileEl);
      tray.appendChild(slot);
      tile.traySlot = slot;
      tile.placed = false;
      positionTileAtTrayCenter(tile);
    }

    updateTileTransform(tile);
  }

  renderInactiveTileStack();
}

function rerenderTrayAndReserve() {
  tray.innerHTML = "";
  reserveStack.innerHTML = "";
  state.hoveredTileId = null;
  selectTile(null);
  clearPendingReserveSwap();

  const trayTiles = [];
  for (const tile of state.tiles.values()) {
    if (tile.required || tile.placed) continue;
    tile.dom = null;
    tile.bodyDom = null;
    tile.guideDom = null;
    tile.traySlot = null;

    if (!tile.active) continue;
    trayTiles.push(tile);
  }

  const traySlotCount = 6;
  for (let i = 0; i < traySlotCount; i += 1) {
    const slot = document.createElement("div");
    slot.className = "tray-slot";
    tray.appendChild(slot);

    const tile = trayTiles[i];
    if (!tile) continue;
    const tileEl = createTileElement(tile);
    tile.dom = tileEl;
    slot.appendChild(tileEl);
    tile.traySlot = slot;
    positionTileAtTrayCenter(tile);
    updateTileTransform(tile);
  }

  renderInactiveTileStack();
  renderBossStack();
}

function getBossTileSources(themeId = state.selectedThemeId) {
  const theme = getThemeConfig(themeId);
  const files = BOSS_TILE_FILES[theme.id] || [];
  return files.map((file) => `./tiles/${theme.folder}/${file}`);
}

function renderBossStack() {
  if (!bossStack) return;
  bossStack.innerHTML = "";
  const placedBossSources = new Set(state.bossTokens.map((token) => token.src));
  const sources = getBossTileSources().filter((src) => !placedBossSources.has(src));
  if (!sources.length) {
    bossStack.classList.add("is-empty");
    return;
  }
  bossStack.classList.remove("is-empty");

  const offsets = [
    { dx: -20, dy: 10, rot: -9, z: 1, scale: 0.98 },
    { dx: 16, dy: -6, rot: 5, z: 2, scale: 1.0 },
  ];
  const ordered = state.bossOrderFlipped && sources.length >= 2
    ? [sources[1], sources[0], ...sources.slice(2)]
    : sources;

  for (let i = 0; i < ordered.length; i += 1) {
    const card = document.createElement("div");
    card.className = "boss-card";
    const offset = offsets[i] || offsets[offsets.length - 1];
    card.style.setProperty("--dx", `${offset.dx}px`);
    card.style.setProperty("--dy", `${offset.dy}px`);
    card.style.setProperty("--rot", `${offset.rot}deg`);
    card.style.setProperty("--z", String(offset.z));
    card.style.setProperty("--scale", String(offset.scale));

    const img = document.createElement("img");
    img.src = ordered[i];
    img.alt = "Boss tile";
    img.draggable = false;
    img.addEventListener("dragstart", (event) => event.preventDefault());
    img.addEventListener("error", () => {
      card.remove();
      if (!bossStack.querySelector(".boss-card")) bossStack.classList.add("is-empty");
    });
    const isTopCard = i === ordered.length - 1;
    let draggedOut = false;
    if (isTopCard) {
      card.addEventListener("pointerdown", (event) => {
        beginBossSpawnDrag(event, ordered[i], () => {
          draggedOut = true;
        });
      });
    }

    card.addEventListener("click", () => {
      if (draggedOut) {
        draggedOut = false;
        return;
      }
      if (!state.bossEditMode) return;
      if (ordered.length < 2) return;
      state.bossOrderFlipped = !state.bossOrderFlipped;
      renderBossStack();
    });

    card.appendChild(img);
    bossStack.appendChild(card);
  }
}

function setBossEditMode(enabled) {
  state.bossEditMode = Boolean(enabled);
  document.body.classList.toggle("boss-edit-mode", state.bossEditMode);
}

function isClickInTopRightCloseHit(event, containerEl) {
  if (!event || !containerEl) return false;
  const rect = containerEl.getBoundingClientRect();
  const hitSize = 28;
  const inset = 6;
  const left = rect.right - inset - hitSize;
  const right = rect.right - inset;
  const top = rect.top + inset;
  const bottom = rect.top + inset + hitSize;
  return (
    event.clientX >= left
    && event.clientX <= right
    && event.clientY >= top
    && event.clientY <= bottom
  );
}

function beginBossSpawnDrag(event, src, onDragStart = null) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();

  const cardEl = event.currentTarget;
  const workspaceRect = workspace.getBoundingClientRect();
  const boardRect = board.getBoundingClientRect();
  const startX = event.clientX;
  const startY = event.clientY;
  const pointerId = event.pointerId;
  let moved = false;
  let droppedToBoard = false;

  const preview = document.createElement("div");
  preview.className = "boss-token boss-token-preview";
  preview.style.width = `${TILE_SIZE}px`;
  const previewImg = document.createElement("img");
  previewImg.src = src;
  previewImg.alt = "";
  previewImg.draggable = false;
  previewImg.addEventListener("dragstart", (e) => e.preventDefault());
  preview.appendChild(previewImg);
  dragLayer.appendChild(preview);

  const setPreviewPos = (clientX, clientY) => {
    preview.style.left = `${clientX - workspaceRect.left}px`;
    preview.style.top = `${clientY - workspaceRect.top}px`;
  };
  setPreviewPos(event.clientX, event.clientY);

  const cleanup = () => {
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
    window.removeEventListener("pointercancel", handleUp);
    if (!droppedToBoard) {
      cardEl.classList.remove("boss-card-drag-origin");
    }
    preview.remove();
  };

  const handleMove = (moveEvent) => {
    if (moveEvent.pointerId !== pointerId) return;
    if (moveEvent.pointerType === "mouse" && moveEvent.buttons === 0) {
      cleanup();
      return;
    }
    if (!moved) {
      const distance = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
      if (distance >= 4) {
        moved = true;
        cardEl.classList.add("boss-card-drag-origin");
        if (typeof onDragStart === "function") onDragStart();
      }
    }
    setPreviewPos(moveEvent.clientX, moveEvent.clientY);
  };

  const handleUp = (upEvent) => {
    if (upEvent.pointerId !== pointerId) return;
    const droppedInsideBoard =
      upEvent.clientX >= boardRect.left
      && upEvent.clientX <= boardRect.right
      && upEvent.clientY >= boardRect.top
      && upEvent.clientY <= boardRect.bottom;

    if (moved && droppedInsideBoard) {
      const boardOriginX = boardRect.left + board.clientLeft;
      const boardOriginY = boardRect.top + board.clientTop;
      const zoom = getBoardZoom();
      const bx = clamp((upEvent.clientX - boardOriginX) / zoom, 0, board.clientWidth);
      const by = clamp((upEvent.clientY - boardOriginY) / zoom, 0, board.clientHeight);
      createBossToken(src, bx, by, TILE_SIZE);
      droppedToBoard = true;
      renderBossStack();
    }
    cleanup();
  };

  window.addEventListener("pointermove", handleMove);
  window.addEventListener("pointerup", handleUp);
  window.addEventListener("pointercancel", handleUp);
}

function createBossToken(src, x, y, size = 130) {
  const gridSize = TILE_SIZE;
  const token = {
    id: `boss-token-${state.nextBossTokenId++}`,
    src,
    x,
    y,
    size: gridSize,
    dom: null,
  };
  const dom = document.createElement("div");
  dom.className = "boss-token";
  dom.dataset.tokenId = token.id;
  dom.style.width = `${token.size}px`;
  const img = document.createElement("img");
  img.src = src;
  img.alt = "Boss token";
  img.draggable = false;
  img.addEventListener("dragstart", (e) => e.preventDefault());
  dom.appendChild(img);
  dom.addEventListener("pointerdown", (e) => beginBossTokenDrag(token, e));
  token.dom = dom;
  state.bossTokens.push(token);
  getBoardContentLayer().appendChild(dom);
  updateBossTokenTransform(token);
}

function positionBossToken(token, x, y) {
  token.x = x;
  token.y = y;
}

function updateBossTokenTransform(token) {
  if (!token?.dom) return;
  token.dom.style.left = `${token.x}px`;
  token.dom.style.top = `${token.y}px`;
  token.dom.style.transform = "translate3d(-50%, -50%, 0)";
}

function beginBossTokenDrag(token, event) {
  if (!token?.dom) return;
  if (event.button !== 0) return;
  if (state.wallEditMode) return;
  event.preventDefault();
  event.stopPropagation();

  const boardRect = board.getBoundingClientRect();
  const pointerId = event.pointerId;
  token.dom.classList.add("boss-token-dragging");

  const cleanup = () => {
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
    window.removeEventListener("pointercancel", handleUp);
    token.dom.classList.remove("boss-token-dragging");
  };

  const handleMove = (moveEvent) => {
    if (moveEvent.pointerId !== pointerId) return;
    if (moveEvent.pointerType === "mouse" && moveEvent.buttons === 0) {
      cleanup();
      return;
    }
    const boardOriginX = boardRect.left + board.clientLeft;
    const boardOriginY = boardRect.top + board.clientTop;
    const zoom = getBoardZoom();
    const bx = clamp((moveEvent.clientX - boardOriginX) / zoom, 0, board.clientWidth);
    const by = clamp((moveEvent.clientY - boardOriginY) / zoom, 0, board.clientHeight);
    positionBossToken(token, bx, by);
    updateBossTokenTransform(token);
  };

  const handleUp = (upEvent) => {
    if (upEvent.pointerId !== pointerId) return;
    cleanup();
  };

  window.addEventListener("pointermove", handleMove);
  window.addEventListener("pointerup", handleUp);
  window.addEventListener("pointercancel", handleUp);
}

function renderInactiveTileStack() {
  reserveStack.innerHTML = "";
  reserveStack.classList.toggle("edit-mode", state.reserveEditMode);
  const inactiveTiles = getInactiveTilesInReserveOrder();

  const offsets = [
    { x: -16, y: 14, rot: -11, z: 1, scale: 0.93 },
    { x: 12, y: 4, rot: 7, z: 2, scale: 0.97 },
    { x: -6, y: -8, rot: -3, z: 3, scale: 0.95 },
  ];

  for (let i = 0; i < inactiveTiles.length; i += 1) {
    const tile = inactiveTiles[i];
    const card = document.createElement("div");
    card.className = "reserve-card";
    const offset = offsets[i] || offsets[offsets.length - 1];
    if (!state.reserveEditMode) {
      card.style.setProperty("--dx", `${offset.x}px`);
      card.style.setProperty("--dy", `${offset.y}px`);
      card.style.setProperty("--rot", `${offset.rot}deg`);
      card.style.setProperty("--z", String(offset.z));
      card.style.setProperty("--scale", String(offset.scale ?? 1));
    } else {
      card.style.setProperty("--dx", "0px");
      card.style.setProperty("--dy", "0px");
      card.style.setProperty("--rot", "0deg");
      card.style.setProperty("--z", "1");
      card.style.setProperty("--scale", "1");
    }
    card.dataset.tileId = tile.id;
    const isSelectedSource =
      state.pendingSwapSource?.zone === "reserve"
      && state.pendingSwapSource?.tileId === tile.id;
    card.classList.toggle("selected", isSelectedSource);
    card.addEventListener("click", () => {
      if (state.wallEditMode) return;
      if (!state.reserveEditMode) return;
      handleSwapClick("reserve", tile.id);
    });

    const img = document.createElement("img");
    img.src = tile.src;
    img.alt = `${tile.id} (inactive)`;
    img.draggable = false;
    card.appendChild(img);
    card.appendChild(createReserveGuideOverlay(tile));
    reserveStack.appendChild(card);
  }

  updateReserveSwapHighlights();
}

function getInactiveTilesInReserveOrder() {
  const inactiveSet = new Set(
    Array.from(state.tiles.values())
      .filter((tile) => !tile.required && !tile.active)
      .map((tile) => tile.id),
  );

  const orderedIds = [];
  for (const id of state.reserveOrder) {
    if (inactiveSet.has(id)) {
      orderedIds.push(id);
      inactiveSet.delete(id);
    }
  }

  const missingIds = Array.from(inactiveSet);
  const missingShuffled = shuffle(missingIds);
  for (const id of missingShuffled) {
    orderedIds.push(id);
    inactiveSet.delete(id);
  }

  state.reserveOrder = orderedIds;
  return orderedIds.map((id) => state.tiles.get(id)).filter(Boolean);
}

function resetReserveOrderForCurrentInactive() {
  const inactiveIds = Array.from(state.tiles.values())
    .filter((tile) => !tile.required && !tile.active)
    .map((tile) => tile.id);
  state.reserveOrder = shuffle(inactiveIds);
}

function randomizeCurrentInactiveReserveOrder() {
  const currentIds = getInactiveTilesInReserveOrder().map((tile) => tile.id);
  state.reserveOrder = shuffle(currentIds);
}

function createReserveGuideOverlay(tile) {
  const guidePoints = getGuideFacePoints(tile);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "reserve-guide");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("aria-hidden", "true");

  const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  polygon.setAttribute("class", "reserve-guide-outline");
  polygon.setAttribute("points", polygonPoints(guidePoints));
  svg.appendChild(polygon);
  return svg;
}

function placeStartTileAtCenter() {
  const start = state.tiles.get("molten_entrance");
  const rect = board.getBoundingClientRect();
  const desiredX = rect.width / 2;
  const desiredY = TILE_SIZE / 2 + 92;
  const center = getTopGridCenterNear(desiredX, desiredY, 3);
  const snapped = snapTileCenterToHex(start, center.x, center.y);
  positionTile(start, snapped.x, snapped.y);
  updateTileParent(start, board);
  start.placed = true;
  updateTileTransform(start);
  placeReferenceAboveStart(start);
}

function getReferenceTileSrc(themeId = state.selectedThemeId) {
  const theme = getThemeConfig(themeId);
  return `./tiles/${theme.folder}/${theme.prefix}_reference.png`;
}

function placeReferenceAboveStart(startTile) {
  if (!startTile || !state.referenceTileSrc) return;
  if (state.referenceMarker?.dom?.parentElement) {
    state.referenceMarker.dom.parentElement.removeChild(state.referenceMarker.dom);
  }

  const marker = document.createElement("div");
  marker.className = "board-reference-tile";
  const img = document.createElement("img");
  img.src = state.referenceTileSrc;
  img.alt = `${getThemeConfig(state.selectedThemeId).label} reference`;
  img.draggable = false;
  img.addEventListener("dragstart", (event) => event.preventDefault());
  marker.appendChild(img);

  const x = startTile.x;
  const y = startTile.y - REFERENCE_OFFSET_Y;
  marker.style.left = `${x}px`;
  marker.style.top = `${y}px`;
  marker.style.transform = "translate(-50%, -50%)";
  getBoardContentLayer().appendChild(marker);

  state.referenceMarker = { dom: marker, x, y };
}

function getTopGridCenterNear(preferredX, preferredY, rowsDown = 0) {
  const layout = getBoardHexLayout();
  if (
    !Number.isFinite(layout.minX)
    || layout.minX > layout.maxX
    || layout.minY > layout.maxY
  ) {
    return { x: preferredX, y: preferredY };
  }

  const row = Math.max(0, rowsDown);
  let best = { x: preferredX, y: preferredY, d2: Number.POSITIVE_INFINITY };
  let col = 0;
  for (let xBase = layout.minX; xBase <= layout.maxX + 0.01; xBase += layout.dx, col += 1) {
    const yBase = layout.minY + (col % 2) * (layout.hexHeight / 2);
    const x = xBase + state.boardPanX;
    const y = Math.min(layout.maxY, yBase + row * layout.dy) + state.boardPanY;
    const dx = x - preferredX;
    const dy = y - preferredY;
    const d2 = dx * dx + dy * dy;
    if (d2 < best.d2) best = { x, y, d2 };
  }
  return { x: best.x, y: best.y };
}

function beginBoardPan(event) {
  event.preventDefault();
  const startX = event.clientX;
  const startY = event.clientY;
  const boardTiles = Array.from(state.tiles.values())
    .filter((tile) => tile.dom && isOnBoardLayer(tile.dom.parentElement))
    .map((tile) => ({
      tile,
      x: tile.x,
      y: tile.y,
    }));
  const reference = state.referenceMarker?.dom
    ? {
        dom: state.referenceMarker.dom,
        x: state.referenceMarker.x,
        y: state.referenceMarker.y,
      }
    : null;
  const boardBossTokens = state.bossTokens
    .filter((token) => token?.dom && isOnBoardLayer(token.dom.parentElement))
    .map((token) => ({
      token,
      x: token.x,
      y: token.y,
    }));

  const startPanX = state.boardPanX;
  const startPanY = state.boardPanY;
  board.classList.add("panning");

  const handleMove = (moveEvent) => {
    if (moveEvent.pointerType === "mouse" && moveEvent.buttons === 0) {
      cleanup();
      return;
    }
    const zoom = getBoardZoom();
    const dx = (moveEvent.clientX - startX) / zoom;
    const dy = (moveEvent.clientY - startY) / zoom;
    state.boardPanX = startPanX + dx;
    state.boardPanY = startPanY + dy;
    for (const entry of boardTiles) {
      positionTile(entry.tile, entry.x + dx, entry.y + dy);
      updateTileTransform(entry.tile);
    }
    if (reference?.dom) {
      const rx = reference.x + dx;
      const ry = reference.y + dy;
      reference.dom.style.left = `${rx}px`;
      reference.dom.style.top = `${ry}px`;
      if (state.referenceMarker) {
        state.referenceMarker.x = rx;
        state.referenceMarker.y = ry;
      }
    }
    for (const entry of boardBossTokens) {
      positionBossToken(entry.token, entry.x + dx, entry.y + dy);
      updateBossTokenTransform(entry.token);
    }
    scheduleBoardHexGridRender();
  };

  const cleanup = () => {
    board.classList.remove("panning");
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
    window.removeEventListener("pointercancel", handleUp);
  };

  const handleUp = () => {
    cleanup();
  };

  window.addEventListener("pointermove", handleMove);
  window.addEventListener("pointerup", handleUp);
  window.addEventListener("pointercancel", handleUp);
}

function createTileElement(tile) {
  const tileEl = document.createElement("div");
  tileEl.className = "tile";
  tileEl.dataset.tileId = tile.id;

  const body = document.createElement("div");
  body.className = "tile-body";

  const img = document.createElement("img");
  img.src = tile.src;
  img.alt = tile.id;
  img.draggable = false;
  img.addEventListener("dragstart", (event) => event.preventDefault());
  body.appendChild(img);
  body.appendChild(createPlacementOverlay(tile));
  const guideOverlay = createTileGuideOverlay(tile);
  body.appendChild(guideOverlay);
  tileEl.appendChild(body);
  tile.bodyDom = body;
  tile.guideDom = guideOverlay;

  const controls = document.createElement("div");
  controls.className = "tile-controls";

  const leftBtn = document.createElement("button");
  leftBtn.type = "button";
  leftBtn.className = "rotate-ccw";
  const leftIcon = document.createElement("span");
  leftIcon.textContent = "⟲";
  leftBtn.appendChild(leftIcon);
  leftBtn.title = "Rotate -60°";
  leftBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    rotateTile(tile, -ROTATION_STEP);
  });

  const rightBtn = document.createElement("button");
  rightBtn.type = "button";
  rightBtn.className = "rotate-cw";
  const rightIcon = document.createElement("span");
  rightIcon.textContent = "⟳";
  rightBtn.appendChild(rightIcon);
  rightBtn.title = "Rotate +60°";
  rightBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    rotateTile(tile, ROTATION_STEP);
  });

  controls.appendChild(leftBtn);
  controls.appendChild(rightBtn);
  tileEl.appendChild(controls);

  tileEl.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    const faceHit = event.target.closest(".tile-guide-face-hit");
    if (state.wallEditMode && faceHit) {
      event.preventDefault();
      event.stopPropagation();
      if (tile.id === "molten_entrance") {
        setStatus("Entrance tile wall editing is disabled. Edit regular tiles only.", true);
        return;
      }
      const faceIdx = Number.parseInt(faceHit.dataset.faceIndex || "", 10);
      if (!Number.isInteger(faceIdx)) return;
      if (tile.wallFaceSet.has(faceIdx)) {
        tile.wallFaceSet.delete(faceIdx);
      } else {
        tile.wallFaceSet.add(faceIdx);
      }
      persistTileWallFaces(state.selectedThemeId, tile.id, tile.wallFaceSet);
      refreshTileWallGuide(tile);
      setStatus(
        `${tile.id} wall faces: ${Array.from(tile.wallFaceSet).sort((a, b) => a - b).join(", ") || "none"}.`,
      );
      return;
    }
    if (event.target.closest(".tile-controls")) return;
    if (state.wallEditMode) return;
    if (state.pendingSwapSource) {
      if (!state.reserveEditMode) {
        clearPendingReserveSwap();
        return;
      }
      if (state.pendingSwapSource.zone === "tray") {
        if (!isReserveSwapSource(tile)) {
          setStatus("Choose a reserve tile to swap with the selected tray tile.", true);
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        performReserveToTraySwap(tile.id, state.pendingSwapSource.tileId);
      } else if (isTraySwapTarget(tile)) {
        event.preventDefault();
        event.stopPropagation();
        performReserveToTraySwap(state.pendingSwapSource.tileId, tile.id);
      } else {
        setStatus("Choose a tile currently in the tray to swap with the selected reserve tile.", true);
      }
      return;
    }
    event.preventDefault();
    selectTile(tile.id);
    beginDrag(tile, event);
  });

  tileEl.addEventListener("click", () => {
    if (state.reserveEditMode && isTraySwapTarget(tile)) {
      handleSwapClick("tray", tile.id);
      return;
    }
    if (state.pendingSwapSource) return;
    selectTile(tile.id);
  });
  tileEl.addEventListener("mouseenter", () => {
    state.hoveredTileId = tile.id;
    if (state.selectedTileId && state.selectedTileId !== tile.id) {
      selectTile(null);
    }
  });
  tileEl.addEventListener("mouseleave", () => {
    if (state.hoveredTileId === tile.id) state.hoveredTileId = null;
    if (state.selectedTileId && !state.hoveredTileId) selectTile(null);
  });
  tileEl.addEventListener("dragstart", (event) => event.preventDefault());
  if (state.pendingSwapSource && isSwapTargetHighlight(tile)) {
    tileEl.classList.add("swap-target");
  }
  return tileEl;
}

function handleSwapClick(zone, tileId) {
  if (!tileId || !state.reserveEditMode) return;
  if (zone === "reserve" && !isReserveSwapSource(state.tiles.get(tileId))) return;
  if (zone === "tray" && !isTraySwapTarget(state.tiles.get(tileId))) return;

  if (state.pendingSwapSource?.zone === zone && state.pendingSwapSource?.tileId === tileId) {
    clearPendingReserveSwap();
    setStatus("Reserve swap cancelled.");
    return;
  }

  if (!state.pendingSwapSource) {
    state.pendingSwapSource = { zone, tileId };
    updateReserveSwapHighlights();
    if (zone === "reserve") {
      setStatus(`Reserve ${tileId} selected. Click a tray tile to swap.`);
    } else {
      setStatus(`Tray ${tileId} selected. Click a reserve tile to swap.`);
    }
    return;
  }

  const source = state.pendingSwapSource;
  if (source.zone === "reserve" && zone === "tray") {
    performReserveToTraySwap(source.tileId, tileId);
    return;
  }
  if (source.zone === "tray" && zone === "reserve") {
    performReserveToTraySwap(tileId, source.tileId);
    return;
  }

  state.pendingSwapSource = { zone, tileId };
  updateReserveSwapHighlights();
  if (zone === "reserve") {
    setStatus(`Reserve ${tileId} selected. Click a tray tile to swap.`);
  } else {
    setStatus(`Tray ${tileId} selected. Click a reserve tile to swap.`);
  }
}

function clearPendingReserveSwap() {
  if (!state.pendingSwapSource) return;
  state.pendingSwapSource = null;
  updateReserveSwapHighlights();
}

function updateReserveSwapHighlights() {
  document.body.classList.toggle("reserve-swap-pending", Boolean(state.pendingSwapSource));
  const cards = reserveStack.querySelectorAll(".reserve-card");
  for (const card of cards) {
    const isSelectedSource =
      state.pendingSwapSource?.zone === "reserve"
      && card.dataset.tileId === state.pendingSwapSource?.tileId;
    const isReserveTarget = state.pendingSwapSource?.zone === "tray";
    card.classList.toggle("selected", isSelectedSource);
    card.classList.toggle("swap-target", Boolean(isReserveTarget));
  }
  for (const tile of state.tiles.values()) {
    if (!tile.dom) continue;
    const isTraySource =
      state.pendingSwapSource?.zone === "tray"
      && state.pendingSwapSource?.tileId === tile.id;
    tile.dom.classList.toggle("swap-source", isTraySource);
    tile.dom.classList.toggle("swap-target", Boolean(state.pendingSwapSource) && isSwapTargetHighlight(tile));
  }
}

function isReserveSwapSource(tile) {
  return Boolean(tile && !tile.required && !tile.active);
}

function isTraySwapTarget(tile) {
  if (!tile || tile.required || !tile.active || tile.placed) return false;
  if (!tile.dom || !tile.traySlot) return false;
  return tile.dom.parentElement === tile.traySlot;
}

function isSwapTargetHighlight(tile) {
  if (!state.pendingSwapSource) return false;
  if (state.pendingSwapSource.zone === "reserve") return isTraySwapTarget(tile);
  if (state.pendingSwapSource.zone === "tray") return isReserveSwapSource(tile);
  return false;
}

function performReserveToTraySwap(reserveTileId, trayTileId) {
  if (!state.reserveEditMode) return;
  const reserveTile = state.tiles.get(reserveTileId);
  const trayTile = state.tiles.get(trayTileId);
  if (!reserveTile || !trayTile) return;
  if (reserveTile.active || !isTraySwapTarget(trayTile)) {
    setStatus("Swap unavailable for current selection.", true);
    clearPendingReserveSwap();
    return;
  }

  clearInvalidReturnTimer(reserveTile);
  clearInvalidReturnTimer(trayTile);
  const targetSlot = trayTile.traySlot;
  if (!targetSlot) return;

  if (trayTile.dom && trayTile.dom.parentElement) {
    trayTile.dom.parentElement.removeChild(trayTile.dom);
  }
  trayTile.dom = null;
  trayTile.bodyDom = null;
  trayTile.guideDom = null;
  trayTile.traySlot = null;
  trayTile.active = false;
  trayTile.placed = false;
  trayTile.rotation = 0;

  reserveTile.active = true;
  reserveTile.placed = false;
  reserveTile.rotation = 0;
  reserveTile.traySlot = targetSlot;
  const reserveEl = createTileElement(reserveTile);
  reserveTile.dom = reserveEl;
  targetSlot.innerHTML = "";
  targetSlot.appendChild(reserveEl);
  positionTileAtTrayCenter(reserveTile);
  updateTileTransform(reserveTile);

  if (state.selectedTileId === trayTileId) state.selectedTileId = null;
  if (state.hoveredTileId === trayTileId) state.hoveredTileId = null;
  selectTile(null);

  const reserveIdx = state.reserveOrder.indexOf(reserveTileId);
  if (reserveIdx >= 0) {
    state.reserveOrder[reserveIdx] = trayTileId;
    state.reserveOrder = state.reserveOrder.filter((id, idx, arr) => arr.indexOf(id) === idx);
  } else {
    state.reserveOrder = [
      ...state.reserveOrder.filter((id) => id !== trayTileId && id !== reserveTileId),
      trayTileId,
    ];
  }
  clearPendingReserveSwap();
  renderInactiveTileStack();
  setStatus(`Swapped in ${reserveTileId}. Moved ${trayTileId} to reserve pile.`);
}

function createPlacementOverlay(tile) {
  const overlay = document.createElement("div");
  overlay.className = "tile-placement-overlay";
  overlay.setAttribute("aria-hidden", "true");
  overlay.style.maskImage = `url("${tile.src}")`;
  overlay.style.maskRepeat = "no-repeat";
  overlay.style.maskPosition = "center";
  overlay.style.maskSize = "contain";
  overlay.style.webkitMaskImage = `url("${tile.src}")`;
  overlay.style.webkitMaskRepeat = "no-repeat";
  overlay.style.webkitMaskPosition = "center";
  overlay.style.webkitMaskSize = "contain";
  return overlay;
}

function createTileGuideOverlay(tile) {
  const guidePoints = getGuideFacePoints(tile);
  const guideNormals = buildGuideNormals(guidePoints);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "tile-guide");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("aria-hidden", "true");

  const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  polygon.setAttribute("class", "tile-guide-outline");
  polygon.setAttribute("points", polygonPoints(guidePoints));
  svg.appendChild(polygon);

  const faceHits = document.createElementNS("http://www.w3.org/2000/svg", "g");
  faceHits.setAttribute("class", "tile-guide-face-hits");
  for (let i = 0; i < guidePoints.length; i += 1) {
    const a = guidePoints[i];
    const b = guidePoints[(i + 1) % guidePoints.length];
    const x1 = 50 + (a.x / TILE_SIZE) * 100;
    const y1 = 50 + (a.y / TILE_SIZE) * 100;
    const x2 = 50 + (b.x / TILE_SIZE) * 100;
    const y2 = 50 + (b.y / TILE_SIZE) * 100;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("class", "tile-guide-face-hit");
    line.setAttribute("data-face-index", String(i));
    line.setAttribute("x1", x1.toFixed(2));
    line.setAttribute("y1", y1.toFixed(2));
    line.setAttribute("x2", x2.toFixed(2));
    line.setAttribute("y2", y2.toFixed(2));
    faceHits.appendChild(line);
  }
  svg.appendChild(faceHits);

  const wallFaces = document.createElementNS("http://www.w3.org/2000/svg", "g");
  wallFaces.setAttribute("class", "tile-guide-wall-faces");
  for (let i = 0; i < guidePoints.length; i += 1) {
    const a = guidePoints[i];
    const b = guidePoints[(i + 1) % guidePoints.length];
    const x1 = 50 + (a.x / TILE_SIZE) * 100;
    const y1 = 50 + (a.y / TILE_SIZE) * 100;
    const x2 = 50 + (b.x / TILE_SIZE) * 100;
    const y2 = 50 + (b.y / TILE_SIZE) * 100;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("class", "tile-guide-wall-face-seg");
    line.setAttribute("data-face-index", String(i));
    line.setAttribute("x1", x1.toFixed(2));
    line.setAttribute("y1", y1.toFixed(2));
    line.setAttribute("x2", x2.toFixed(2));
    line.setAttribute("y2", y2.toFixed(2));
    wallFaces.appendChild(line);
  }
  svg.appendChild(wallFaces);
  refreshWallGuideDom(svg, tile.wallFaceSet);

  const contactFaces = document.createElementNS("http://www.w3.org/2000/svg", "g");
  contactFaces.setAttribute("class", "tile-guide-contact-faces");
  for (let i = 0; i < guidePoints.length; i += 1) {
    const a = guidePoints[i];
    const b = guidePoints[(i + 1) % guidePoints.length];
    const x1 = 50 + (a.x / TILE_SIZE) * 100;
    const y1 = 50 + (a.y / TILE_SIZE) * 100;
    const x2 = 50 + (b.x / TILE_SIZE) * 100;
    const y2 = 50 + (b.y / TILE_SIZE) * 100;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("class", "tile-guide-contact-seg");
    line.setAttribute("data-face-index", String(i));
    line.setAttribute("x1", x1.toFixed(2));
    line.setAttribute("y1", y1.toFixed(2));
    line.setAttribute("x2", x2.toFixed(2));
    line.setAttribute("y2", y2.toFixed(2));
    contactFaces.appendChild(line);
  }
  svg.appendChild(contactFaces);

  const sideTicks = document.createElementNS("http://www.w3.org/2000/svg", "g");
  sideTicks.setAttribute("class", "tile-guide-ticks");
  const labels = document.createElementNS("http://www.w3.org/2000/svg", "g");
  labels.setAttribute("class", "tile-guide-labels");
  const tickIn = 4;
  const tickOut = 8;
  const labelOffset = 12;

  for (let i = 0; i < guidePoints.length; i += 1) {
    const p = guidePoints[i];
    const n = guideNormals[i];
    const x1 = 50 + ((p.x - n.nx * tickIn) / TILE_SIZE) * 100;
    const y1 = 50 + ((p.y - n.ny * tickIn) / TILE_SIZE) * 100;
    const x2 = 50 + ((p.x + n.nx * tickOut) / TILE_SIZE) * 100;
    const y2 = 50 + ((p.y + n.ny * tickOut) / TILE_SIZE) * 100;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    const hue = (i * 360) / guidePoints.length;
    const faceColor = `hsl(${hue.toFixed(1)} 78% 45%)`;
    line.setAttribute("x1", x1.toFixed(2));
    line.setAttribute("y1", y1.toFixed(2));
    line.setAttribute("x2", x2.toFixed(2));
    line.setAttribute("y2", y2.toFixed(2));
    line.style.stroke = faceColor;
    sideTicks.appendChild(line);

    const lx = 50 + ((p.x + n.nx * labelOffset) / TILE_SIZE) * 100;
    const ly = 50 + ((p.y + n.ny * labelOffset) / TILE_SIZE) * 100;
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", lx.toFixed(2));
    label.setAttribute("y", ly.toFixed(2));
    if (tile.id === "molten_entrance" && i === 12) {
      label.textContent = "A";
    } else if (tile.id === "molten_entrance" && i === 11) {
      label.textContent = "B";
    } else {
      label.textContent = String(i);
    }
    labels.appendChild(label);
  }

  svg.appendChild(sideTicks);
  svg.appendChild(labels);
  return svg;
}

function getGuideFacePoints(tile) {
  const points = tile.faceGeometry.points.map((p) => ({ ...p }));
  if (tile.id === "molten_entrance") {
    const templateTile =
      state.tiles.get("tile1")
      || Array.from(state.tiles.values()).find((t) => t.id !== "molten_entrance");
    if (!templateTile) return points;

    const templateBase = templateTile.faceGeometry.points.map((p) => ({ ...p }));
    const reference = applyNormalTileGuideAdjustments(
      templateTile.faceGeometry.points.map((p) => ({ ...p })),
    );
    const sourceIndices = [17, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const targetIndices = [15, 0, 1, 2, 3, 4, 5, 6, 7, 8];

    for (let i = 0; i < targetIndices.length; i += 1) {
      const srcIdx = sourceIndices[i];
      const dstIdx = targetIndices[i];
      if (!reference[srcIdx] || !templateBase[srcIdx] || !points[dstIdx]) continue;
      const dx = reference[srcIdx].x - templateBase[srcIdx].x;
      const dy = reference[srcIdx].y - templateBase[srcIdx].y;
      points[dstIdx].x += dx;
      points[dstIdx].y += dy;
    }

    if (points[0]) {
      points[0].x -= 1;
      points[0].y -= 7;
    }
    if (points[1]) {
      points[1].x += 6;
      points[1].y -= 8;
    }
    if (points[2]) {
      points[2].x += 7;
      points[2].y -= 3;
    }
    if (points[3]) {
      points[3].x += 3;
      points[3].y -= 6;
    }
    if (points[4]) {
      points[4].x -= 2;
      points[4].y -= 4;
    }
    if (points[5]) {
      points[5].x -= 5;
      points[5].y -= 1;
    }
    if (points[3] && points[6]) {
      points[6].x = -points[3].x;
      points[6].y = points[3].y;
    }
    if (points[2] && points[7]) {
      points[7].x = -points[2].x;
      points[7].y = points[2].y;
    }
    if (points[1] && points[8]) {
      points[8].x = -points[1].x;
      points[8].y = points[1].y;
    }
    if (points[0] && points[9]) {
      points[9].x = -points[0].x;
      points[9].y = points[0].y;
    }
    if (points[15]) {
      points[15].x += 13;
      points[15].y -= 21;
    }
    if (points[15] && points[10]) {
      points[10].x = -points[15].x;
      points[10].y = points[15].y;
    }
    if (points[11]) {
      points[11].x -= 69;
      points[11].y += 3;
    }
    if (points[11] && points[14]) {
      points[14].x = -points[11].x;
      points[14].y = points[11].y;
    }
    if (points[12]) {
      points[12].x += 69;
      points[12].y += 3;
    }
    if (points[14]) points.splice(14, 1);
    if (points[13]) points.splice(13, 1);
    return points;
  }

  return applyNormalTileGuideAdjustments(points);
}

function applyNormalTileGuideAdjustments(points) {

  let bottomIdx = 0;
  for (let i = 1; i < points.length; i += 1) {
    if (points[i].y > points[bottomIdx].y) bottomIdx = i;
  }

  const clockwiseIdx = (bottomIdx + 1) % points.length;
  const counterClockwiseIdx = (bottomIdx - 1 + points.length) % points.length;
  const furtherLeftIdx = (bottomIdx - 2 + points.length) % points.length;
  points[clockwiseIdx].x -= 1;
  points[counterClockwiseIdx].x -= 5;
  points[furtherLeftIdx].x -= 6;
  points[furtherLeftIdx].y += 8;

  // Insert one extra debug point at the next-left location, then nudge it up.
  const insertIdx = (bottomIdx - 3 + points.length) % points.length;
  const prevIdx = (insertIdx - 1 + points.length) % points.length;
  const pA = points[prevIdx];
  const pB = points[insertIdx];
  points.splice(insertIdx, 0, {
    x: (pA.x + pB.x) / 2,
    y: (pA.y + pB.y) / 2 - 15,
  });


  if (points[0]) {
    points[0].x -= 12;
    points[0].y += 13;
  }
  if (points[1]) {
    points[1].x += 5;
    points[1].y += 13;
  }
  if (points[2]) {
    points[2].x -= 2;
    points[2].y += 2;
  }
  if (points[3]) {
    points[3].x -= 2;
  }
  if (points[16]) {
    points[16].x += 6;
    points[16].y -= 13;
  }

  // Mirror points 2/3/4 to 15/14/13 across the horizontal centerline.
  const mirroredPairs = [
    [2, 15],
    [3, 14],
    [4, 13],
  ];
  for (const [srcIdx, dstIdx] of mirroredPairs) {
    if (!points[srcIdx] || !points[dstIdx]) continue;
    points[dstIdx].x = points[srcIdx].x;
    points[dstIdx].y = -points[srcIdx].y;
  }

  if (points[14]) {
    points[14].x -= 2;
  }
  if (points[15]) {
    points[15].x -= 1;
  }

  // Mirror specific debug points across the Y axis.
  const yAxisMirrorMap = [
    [3, 6],
    [2, 7],
    [1, 8],
    [0, 9],
    [16, 10],
    [15, 11],
    [14, 12],
  ];
  for (const [srcIdx, dstIdx] of yAxisMirrorMap) {
    if (!points[srcIdx] || !points[dstIdx]) continue;
    points[dstIdx].x = -points[srcIdx].x;
    points[dstIdx].y = points[srcIdx].y;
  }

  if (points[12] && points[13]) {
    points.splice(13, 0, {
      x: (points[12].x + points[13].x) / 2,
      y: (points[12].y + points[13].y) / 2,
    });
  }

  if (points[5] && points[13]) {
    points[5].x += 1;
    points[13].x = points[5].x;
    points[13].y = -points[5].y;
  }

  // Keep these explicitly mirrored on the Y axis.
  if (points[3] && points[6]) {
    points[6].x = -points[3].x;
    points[6].y = points[3].y;
  }
  if (points[2] && points[7]) {
    points[7].x = -points[2].x;
    points[7].y = points[2].y;
  }

  return points;
}

function buildGuideNormals(points) {
  const normals = [];
  const count = points.length;

  for (let i = 0; i < count; i += 1) {
    const prev = points[(i - 1 + count) % count];
    const curr = points[i];
    const next = points[(i + 1) % count];
    const tx = next.x - prev.x;
    const ty = next.y - prev.y;
    const len = Math.hypot(tx, ty) || 1;
    let nx = ty / len;
    let ny = -tx / len;
    if (curr.x * nx + curr.y * ny < 0) {
      nx = -nx;
      ny = -ny;
    }
    normals.push({ nx, ny });
  }

  return normals;
}

function refreshTileWallGuide(tile) {
  refreshWallGuideDom(tile?.guideDom, tile?.wallFaceSet || new Set());
}

function refreshWallGuideDom(guideDom, wallFaceSet) {
  if (!guideDom) return;
  const lines = guideDom.querySelectorAll(".tile-guide-wall-face-seg");
  for (const line of lines) {
    const idx = Number.parseInt(line.dataset.faceIndex || "", 10);
    if (!Number.isInteger(idx)) continue;
    line.classList.toggle("is-wall", wallFaceSet.has(idx));
  }
}

function loadWallOverrides() {
  try {
    const raw = localStorage.getItem(WALL_OVERRIDES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch (error) {
    console.warn("Could not load wall overrides from storage.", error);
    return {};
  }
}

function saveWallOverrides() {
  try {
    localStorage.setItem(WALL_OVERRIDES_STORAGE_KEY, JSON.stringify(state.wallOverrides));
  } catch (error) {
    console.warn("Could not save wall overrides to storage.", error);
  }
}

function getStoredWallFaces(themeId, tileId) {
  const theme = state.wallOverrides?.[themeId];
  const arr = theme?.[tileId];
  if (!Array.isArray(arr)) return [];
  return arr.filter((n) => Number.isInteger(n) && n >= 0).sort((a, b) => a - b);
}

function exportWallOverridesBackup() {
  try {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      wallOverrides: state.wallOverrides,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `hts-wall-overrides-${date}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("Wall data exported.");
  } catch (error) {
    console.error(error);
    setStatus("Failed to export wall data.", true);
  }
}

async function importWallOverridesBackup(file) {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const raw = parsed?.wallOverrides ?? parsed;
    const sanitized = sanitizeWallOverrides(raw);
    state.wallOverrides = sanitized;
    saveWallOverrides();
    syncSelectedThemeWallsFromOverrides();
    if (state.wallEditMode) {
      await renderWallEditorPage();
      if (state.wallEditorActiveThemeId && state.wallEditorActiveTileId) {
        setActiveWallEditorTile(state.wallEditorActiveThemeId, state.wallEditorActiveTileId);
      }
    }
    setStatus("Wall data imported.");
  } catch (error) {
    console.error(error);
    setStatus("Invalid wall data file. Import failed.", true);
  }
}

function sanitizeWallOverrides(input) {
  if (!input || typeof input !== "object") return {};
  const clean = {};
  for (const theme of THEME_OPTIONS) {
    const themeValue = input[theme.id];
    if (!themeValue || typeof themeValue !== "object") continue;
    const themeOut = {};
    const defs = buildTileDefs(theme.id);
    for (const def of defs) {
      const arr = themeValue[def.id];
      if (!Array.isArray(arr)) continue;
      const uniq = [...new Set(
        arr
          .filter((n) => Number.isInteger(n) && n >= 0 && n < 64)
          .map((n) => Number(n)),
      )].sort((a, b) => a - b);
      themeOut[def.id] = uniq;
    }
    if (Object.keys(themeOut).length) clean[theme.id] = themeOut;
  }
  return clean;
}

function persistTileWallFaces(themeId, tileId, faceSet) {
  if (!state.wallOverrides[themeId]) state.wallOverrides[themeId] = {};
  const sorted = Array.from(faceSet).sort((a, b) => a - b);
  state.wallOverrides[themeId][tileId] = sorted;
  saveWallOverrides();

  if (themeId === state.selectedThemeId) {
    const activeTile = state.tiles.get(tileId);
    if (activeTile) {
      activeTile.wallFaceSet = new Set(sorted);
      refreshTileWallGuide(activeTile);
    }
  }
}

function getActiveTileForWallEditing() {
  const editorKey = state.wallEditorActiveThemeId && state.wallEditorActiveTileId
    ? `${state.wallEditorActiveThemeId}:${state.wallEditorActiveTileId}`
    : null;
  if (editorKey && state.wallEditorTileRefs.has(editorKey)) {
    const ref = state.wallEditorTileRefs.get(editorKey);
    return { themeId: ref.themeId, tile: ref.tile };
  }

  const id = state.hoveredTileId || state.selectedTileId;
  const tile = id ? state.tiles.get(id) : null;
  if (!tile) return null;
  return { themeId: state.selectedThemeId, tile };
}

async function renderWallEditorPage() {
  if (!wallEditorPage) return;

  wallEditorPage.innerHTML = "";
  const intro = document.createElement("div");
  intro.className = "wall-editor-intro";
  intro.textContent = "Wall Editor: click face segments to toggle wall ON/OFF. Saved per theme + tile.";
  wallEditorPage.appendChild(intro);

  const trays = document.createElement("div");
  trays.className = "wall-editor-trays";
  wallEditorPage.appendChild(trays);

  const panels = await Promise.all(THEME_OPTIONS.map((theme) => buildWallEditorThemePanel(theme)));
  for (const panel of panels) trays.appendChild(panel);
}

async function buildWallEditorThemePanel(theme) {
  const panel = document.createElement("section");
  panel.className = "theme-wall-panel";

  const title = document.createElement("h3");
  title.textContent = theme.label;
  panel.appendChild(title);

  const tray = document.createElement("div");
  tray.className = "theme-wall-tray";
  panel.appendChild(tray);

  const defs = buildTileDefs(theme.id);
  let missingCount = 0;

  for (const def of defs) {
    try {
      const img = await loadImage(def.src);
      const faceGeometry = getFaceGeometry(img, SIDES);
      const tile = {
        id: def.id,
        src: def.src,
        img,
        faceGeometry,
        wallFaceSet: new Set(getStoredWallFaces(theme.id, def.id)),
      };
      const tileEl = createWallEditorTileElement(theme.id, tile);
      tray.appendChild(tileEl);
      state.wallEditorTileRefs.set(`${theme.id}:${tile.id}`, {
        themeId: theme.id,
        tile,
        el: tileEl,
      });
    } catch (error) {
      console.warn(`Missing asset for ${theme.id}/${def.id}`, error);
      missingCount += 1;
    }
  }

  if (missingCount > 0) {
    const note = document.createElement("p");
    note.className = "theme-wall-note";
    note.textContent = `${missingCount} tile asset(s) missing in this theme.`;
    panel.appendChild(note);
  }

  return panel;
}

function createWallEditorTileElement(themeId, tile) {
  const tileEl = document.createElement("div");
  tileEl.className = "tile wall-editor-tile";
  tileEl.dataset.themeId = themeId;
  tileEl.dataset.tileId = tile.id;

  const body = document.createElement("div");
  body.className = "tile-body";

  const img = document.createElement("img");
  img.src = tile.src;
  img.alt = `${themeId} ${tile.id}`;
  img.draggable = false;
  img.addEventListener("dragstart", (event) => event.preventDefault());
  body.appendChild(img);

  const guideOverlay = createTileGuideOverlay(tile);
  body.appendChild(guideOverlay);
  tile.guideDom = guideOverlay;
  tileEl.appendChild(body);

  const assignActive = () => setActiveWallEditorTile(themeId, tile.id);
  tileEl.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
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
    persistTileWallFaces(themeId, tile.id, tile.wallFaceSet);
    refreshTileWallGuide(tile);
    const list = Array.from(tile.wallFaceSet).sort((a, b) => a - b).join(", ") || "none";
    setStatus(`${getThemeConfig(themeId).label} ${tile.id} wall faces: ${list}.`);
  });
  tileEl.addEventListener("click", assignActive);

  return tileEl;
}

function setActiveWallEditorTile(themeId, tileId) {
  state.wallEditorActiveThemeId = themeId;
  state.wallEditorActiveTileId = tileId;
  for (const ref of state.wallEditorTileRefs.values()) {
    ref.el.classList.remove("selected");
  }
  const key = `${themeId}:${tileId}`;
  const ref = state.wallEditorTileRefs.get(key);
  if (ref) ref.el.classList.add("selected");
}

function syncSelectedThemeWallsFromOverrides() {
  for (const tile of state.tiles.values()) {
    tile.wallFaceSet = new Set(getStoredWallFaces(state.selectedThemeId, tile.id));
    refreshTileWallGuide(tile);
  }
}

function polygonPoints(facePoints) {
  const points = [];
  for (let i = 0; i < facePoints.length; i += 1) {
    const x = 50 + (facePoints[i].x / TILE_SIZE) * 100;
    const y = 50 + (facePoints[i].y / TILE_SIZE) * 100;
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }

  return points.join(" ");
}

function selectTile(id) {
  state.selectedTileId = id;
  for (const tile of state.tiles.values()) {
    if (!tile.dom) continue;
    tile.dom.classList.toggle("selected", tile.id === id);
  }
}

function beginDrag(tile, event) {
  selectTile(null);
  clearInvalidReturnTimer(tile);
  const boardRect = board.getBoundingClientRect();
  const workspaceRect = workspace.getBoundingClientRect();
  const startedFromBoard = isOnBoardLayer(tile.dom.parentElement);
  const tileRect = tile.dom.getBoundingClientRect();
  const pointerOffsetX = event.clientX - (tileRect.left + tileRect.width / 2);
  const pointerOffsetY = event.clientY - (tileRect.top + tileRect.height / 2);

  tile.drag = {
    offsetX: pointerOffsetX,
    offsetY: pointerOffsetY,
    previousX: tile.x,
    previousY: tile.y,
    previousPlaced: tile.placed,
    pointerId: event.pointerId,
    startedFromBoard,
    moved: false,
  };

  let cleanedUp = false;

  const cleanupDrag = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    tile.dom.classList.remove("dragging");
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
    window.removeEventListener("pointercancel", handleUp);
  };

  const handleMove = (moveEvent) => {
    if (!tile.drag || moveEvent.pointerId !== tile.drag.pointerId) return;

    if (moveEvent.pointerType === "mouse" && moveEvent.buttons === 0) {
      cleanupDrag();
      tile.drag = null;
      return;
    }

    if (!tile.drag.startedFromBoard && tile.dom.parentElement !== dragLayer) {
      updateTileParent(tile, dragLayer);
      tile.dom.classList.add("floating");
    }

    tile.drag.moved = true;
    tile.dom.classList.add("dragging");
    const zoom = getBoardZoom();
    const boardOriginX = boardRect.left + board.clientLeft;
    const boardOriginY = boardRect.top + board.clientTop;
    const parentRect =
      tile.dom.parentElement === dragLayer
        ? workspaceRect
        : tile.dom.parentElement.getBoundingClientRect();
    const x = moveEvent.clientX - parentRect.left - tile.drag.offsetX;
    const y = moveEvent.clientY - parentRect.top - tile.drag.offsetY;
    const pointerInsideBoard =
      moveEvent.clientX >= boardRect.left
      && moveEvent.clientX <= boardRect.right
      && moveEvent.clientY >= boardRect.top
      && moveEvent.clientY <= boardRect.bottom;

    if (isOnBoardLayer(tile.dom.parentElement)) {
      const rawBoardX = (moveEvent.clientX - boardOriginX - tile.drag.offsetX) / zoom;
      const rawBoardY = (moveEvent.clientY - boardOriginY - tile.drag.offsetY) / zoom;
      const clampedX = clamp(rawBoardX, 0, board.clientWidth);
      const clampedY = clamp(rawBoardY, 0, board.clientHeight);
      const snapped = snapTileCenterToHex(tile, clampedX, clampedY);
      positionTile(tile, snapped.x, snapped.y);
    } else {
      if (pointerInsideBoard) {
        const boardX = (moveEvent.clientX - boardOriginX - tile.drag.offsetX) / zoom;
        const boardY = (moveEvent.clientY - boardOriginY - tile.drag.offsetY) / zoom;
        const clampedBoardX = clamp(boardX, 0, board.clientWidth);
        const clampedBoardY = clamp(boardY, 0, board.clientHeight);
        const snapped = snapTileCenterToHex(tile, clampedBoardX, clampedBoardY);
        const boardOffsetX = boardOriginX - workspaceRect.left;
        const boardOffsetY = boardOriginY - workspaceRect.top;
        positionTile(
          tile,
          snapped.x * zoom + boardOffsetX,
          snapped.y * zoom + boardOffsetY,
        );
      } else {
        positionTile(tile, x, y);
      }
    }

    updateTileTransform(tile);
    updatePlacementFeedback(tile, moveEvent.clientX, moveEvent.clientY, boardRect, workspaceRect);
  };

  const handleUp = (upEvent) => {
    if (!tile.drag || upEvent.pointerId !== tile.drag.pointerId) return;
    cleanupDrag();
    tile.dom.classList.remove("floating");

    if (!tile.drag.moved) {
      setPlacementFeedback(tile, null);
      tile.drag = null;
      return;
    }

    if (tile.dom.parentElement === dragLayer) {
      const isInsideBoard =
        upEvent.clientX >= boardRect.left &&
        upEvent.clientX <= boardRect.right &&
        upEvent.clientY >= boardRect.top &&
        upEvent.clientY <= boardRect.bottom;

      if (!isInsideBoard) {
        tile.placed = false;
        positionTileAtTrayCenter(tile);
        updateTileParent(tile, tile.traySlot);
        updateTileTransform(tile);
        setPlacementFeedback(tile, null);
        tile.drag = null;
        return;
      }

      const boardOffsetX = (boardRect.left + board.clientLeft) - workspaceRect.left;
      const boardOffsetY = (boardRect.top + board.clientTop) - workspaceRect.top;
      const zoom = getBoardZoom();
      const boardX = (tile.x - boardOffsetX) / zoom;
      const boardY = (tile.y - boardOffsetY) / zoom;
      updateTileParent(tile, board);
      positionTile(tile, clamp(boardX, 0, board.clientWidth), clamp(boardY, 0, board.clientHeight));
      updateTileTransform(tile);
    }

    setPlacementFeedback(tile, null);
    finishDrop(tile);
    tile.drag = null;
  };

  window.addEventListener("pointermove", handleMove);
  window.addEventListener("pointerup", handleUp);
  window.addEventListener("pointercancel", handleUp);
}

function finishDrop(tile) {
  const snappedCenter = snapTileCenterToHex(tile, tile.x, tile.y);
  positionTile(tile, snappedCenter.x, snappedCenter.y);
  updateTileTransform(tile);

  if (tile.id === "molten_entrance") {
    tile.placed = true;
    setPlacementFeedback(tile, null);
    setStatus("molten_entrance placed. Now add the other 6 tiles.");
    return;
  }

  const placedTiles = getPlacedTiles().filter((t) => t.id !== tile.id);

  if (placedTiles.length === 0) {
    revertToTray(tile, "Place molten_entrance first.");
    return;
  }

  if (hasAnyOverlap(tile, placedTiles)) {
    handleInvalidDrop(
      tile,
      placedTiles,
      "Invalid placement: tiles cannot overlap. Returning to tray in 10s.",
      true,
    );
    return;
  }

  let result = findBestContact(tile, placedTiles);
  if (!result.valid) {
    if (!state.ignoreContactRule) {
      handleInvalidDrop(tile, placedTiles);
      return;
    }
  }

  tile.placed = true;
  if (result.valid) {
    setStatus(`Placed ${tile.id} with ${result.count} point contacts.`);
  } else {
    setStatus(`Placed ${tile.id} with ${result.count} contacts (4-point rule ignored).`, true);
  }
  selectTile(null);
}

function snapTileCenterToHex(tile, tileCenterX, tileCenterY) {
  const anchor = getTileSnapAnchorForRotation(tile, tile.rotation || 0);
  const desiredGuideX = tileCenterX + anchor.x;
  const desiredGuideY = tileCenterY + anchor.y;
  const snappedGuide = snapBoardPointToHex(desiredGuideX, desiredGuideY);
  const entranceYOffset = tile.id === "molten_entrance" ? 9 : 0;
  return {
    x: snappedGuide.x - anchor.x,
    y: snappedGuide.y - anchor.y + entranceYOffset,
  };
}

function getTileSnapAnchorForRotation(tile, rotationDeg) {
  if (tile.id !== "molten_entrance") return { x: 0, y: 0 };
  const local = getTileGuideLocalCenter(tile);
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  // Entrance art is vertically biased; use a damped Y-only anchor correction.
  const entranceAnchorScaleY = 0.32;
  return {
    x: 0,
    y: (local.x * sin + local.y * cos) * entranceAnchorScaleY,
  };
}

function getTileGuideLocalCenter(tile) {
  const points = getGuideFacePoints(tile);
  if (!points?.length) return { x: 0, y: 0 };
  let sx = 0;
  let sy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
  }
  return {
    x: sx / points.length,
    y: sy / points.length,
  };
}

function rotateTile(tile, delta) {
  if (state.wallEditMode) {
    setStatus("Rotation is disabled in wall edit mode.", true);
    return;
  }
  if (tile.id === "molten_entrance") {
    const hasOtherPlaced = getPlacedTiles().some((t) => t.id !== "molten_entrance");
    if (hasOtherPlaced) {
      setStatus("molten_entrance rotation is locked once another tile is placed.", true);
      return;
    }
  }

  tile.rotation = normalizeAngle(tile.rotation + delta);
  updateTileTransform(tile);

  if (tile.placed && tile.id !== "molten_entrance") {
    const placedTiles = getPlacedTiles().filter((t) => t.id !== tile.id);
    const result = findBestContact(tile, placedTiles);
    if (!result.valid) {
      setStatus(`Rotation broke contact for ${tile.id}. Need at least ${MIN_CONTACT_POINTS} points.`, true);
    } else {
      setStatus(`${tile.id} rotated to ${tile.rotation}°. Contact points: ${result.count}.`);
    }
  }
}

function findBestContact(tile, otherTiles) {
  let best = { count: 0, other: null, match: null };
  const matchedTileFaceIdx = new Set();

  for (const other of otherTiles) {
    const match = getContactMatchDetails(tile, other);
    if (match.count > best.count) {
      best = {
        count: match.count,
        other,
        match,
      };
    }
    for (const pair of match.matchedPairs || []) {
      matchedTileFaceIdx.add(pair.i);
    }
  }

  const touchesBlockedAB = isTouchingMoltenEntranceBlockedPoints(tile);
  const totalCount = matchedTileFaceIdx.size * 2;
  return {
    valid: totalCount >= MIN_CONTACT_POINTS && !touchesBlockedAB,
    count: totalCount,
    other: best.other,
    match: best.match,
    faceIndices: Array.from(matchedTileFaceIdx),
  };
}

function countSideContacts(a, b) {
  return getContactMatchDetails(a, b).count;
}

function getContactMatchDetails(a, b) {
  const aFaces = getContactFaces(a);
  const bFaces = getContactFaces(b);
  const threshold = Math.min(a.sideLength, b.sideLength) * CONTACT_DISTANCE_RATIO;

  const blockedTouchRadius = BLOCKED_POINT_TOUCH_RADIUS;
  if (isTouchingTileStartBlockedPoints(a, b, blockedTouchRadius) || isTouchingTileStartBlockedPoints(b, a, blockedTouchRadius)) {
    return {
      count: 0,
      matchedPairs: [],
      aFaces,
      bFaces,
    };
  }

  const aContinuity = getContinuityFaceIndexMap(aFaces);
  const bContinuity = getContinuityFaceIndexMap(bFaces);
  const candidates = [];
  for (let i = 0; i < aFaces.length; i += 1) {
    for (let j = 0; j < bFaces.length; j += 1) {
      const af = aFaces[i];
      const bf = bFaces[j];
      if (af.isWall || bf.isWall) continue;
      if (isBlockedContactFace(a, af) || isBlockedContactFace(b, bf)) continue;
      const normalDot = af.nx * bf.nx + af.ny * bf.ny;
      if (normalDot > OPPOSITE_NORMAL_THRESHOLD) continue;

      const tangentDot = Math.abs(af.tx * bf.tx + af.ty * bf.ty);
      if (tangentDot < FACE_TANGENT_ALIGNMENT) continue;

      const midpointDistance = Math.hypot(af.mx - bf.mx, af.my - bf.my);
      if (midpointDistance > threshold) continue;

      const ci = aContinuity.indexMap.get(i);
      const cj = bContinuity.indexMap.get(j);
      if (ci == null || cj == null) continue;
      candidates.push({
        i: ci,
        j: cj,
        ai: i,
        bj: j,
        midpointDistance,
        normalDot,
      });
    }
  }

  candidates.sort((x, y) => x.midpointDistance - y.midpointDistance || x.normalDot - y.normalDot);

  const matchedPairs = getBestOrderedMatchedPairs(candidates, aContinuity.count, bContinuity.count);
  const matchedFaces = matchedPairs.length;

  return {
    count: matchedFaces * 2,
    matchedPairs,
    aFaces,
    bFaces,
  };
}

function getBestOrderedMatchedPairs(candidates, aCount, bCount) {
  if (!candidates.length) return [];

  const byPair = new Map();
  for (const c of candidates) {
    const key = `${c.i}:${c.j}`;
    const prev = byPair.get(key);
    if (!prev || c.midpointDistance < prev.midpointDistance) {
      byPair.set(key, c);
    }
  }

  const mod = (n, size) => ((n % size) + size) % size;
  let bestChain = [];
  let bestDistance = Infinity;

  const uniquePairs = Array.from(byPair.values());
  for (const start of uniquePairs) {
    for (const bStep of [1, -1]) {
      const projected = uniquePairs
        .map((pair) => {
          const da = mod(pair.i - start.i, aCount);
          const db = bStep === 1
            ? mod(pair.j - start.j, bCount)
            : mod(start.j - pair.j, bCount);
          return { ...pair, da, db };
        })
        .sort((a, b) => a.da - b.da || a.db - b.db || a.midpointDistance - b.midpointDistance);

      const n = projected.length;
      const dpLen = new Array(n).fill(1);
      const dpDist = projected.map((p) => p.midpointDistance);
      const prev = new Array(n).fill(-1);

      for (let i = 0; i < n; i += 1) {
        for (let j = 0; j < i; j += 1) {
          if (projected[j].da < projected[i].da && projected[j].db < projected[i].db) {
            const nextLen = dpLen[j] + 1;
            const nextDist = dpDist[j] + projected[i].midpointDistance;
            if (nextLen > dpLen[i] || (nextLen === dpLen[i] && nextDist < dpDist[i])) {
              dpLen[i] = nextLen;
              dpDist[i] = nextDist;
              prev[i] = j;
            }
          }
        }
      }

      let endIdx = 0;
      for (let i = 1; i < n; i += 1) {
        if (dpLen[i] > dpLen[endIdx] || (dpLen[i] === dpLen[endIdx] && dpDist[i] < dpDist[endIdx])) {
          endIdx = i;
        }
      }

      const chain = [];
      for (let i = endIdx; i >= 0; i = prev[i]) {
        chain.unshift(projected[i]);
        if (prev[i] === -1) break;
      }

      if (chain.length > bestChain.length || (chain.length === bestChain.length && dpDist[endIdx] < bestDistance)) {
        bestChain = chain;
        bestDistance = dpDist[endIdx];
      }
    }
  }

  return bestChain.map((pair) => ({ i: pair.ai, j: pair.bj }));
}

function getContinuityFaceIndexMap(faces) {
  const indexMap = new Map();
  let count = 0;
  for (let i = 0; i < faces.length; i += 1) {
    if (faces[i].isWall) continue;
    indexMap.set(i, count);
    count += 1;
  }
  return { indexMap, count };
}

function computeBestSnap(
  tile,
  otherTiles,
  targetX,
  targetY,
  maxDelta = SNAP_SEARCH_RADIUS,
  requireNoOverlap = true,
) {
  let best = null;
  const aDirs = getSideDirections(tile);

  for (const other of otherTiles) {
    const bDirs = getSideDirections(other);

    for (let i = 0; i < aDirs.length; i += 1) {
      const aDir = aDirs[i];
      for (let j = 0; j < bDirs.length; j += 1) {
        const bDir = bDirs[j];
        const dot = aDir.nx * bDir.nx + aDir.ny * bDir.ny;
        if (dot > OPPOSITE_NORMAL_THRESHOLD) continue;

        let cx = other.x + bDir.nx * bDir.offset - aDir.nx * aDir.offset;
        let cy = other.y + bDir.ny * bDir.offset - aDir.ny * aDir.offset;
        const vx = cx - other.x;
        const vy = cy - other.y;
        const vLen = Math.hypot(vx, vy);
        if (vLen > 0) {
          cx -= (vx / vLen) * SNAP_VISUAL_GAP;
          cy -= (vy / vLen) * SNAP_VISUAL_GAP;
        }
        const delta = Math.hypot(cx - targetX, cy - targetY);

        if (delta > maxDelta) continue;

        const evalResult = evaluatePlacementAt(tile, otherTiles, cx, cy);
        if (!evalResult.valid) continue;
        if (requireNoOverlap && evalResult.overlaps) continue;

        if (!best) {
          best = { x: cx, y: cy, count: evalResult.count, delta };
          continue;
        }

        // Prefer nearest valid snap to release position to avoid large jumps.
        if (delta < best.delta - 0.5 || (Math.abs(delta - best.delta) <= 0.5 && evalResult.count > best.count)) {
          best = { x: cx, y: cy, count: evalResult.count, delta };
        }
      }
    }
  }

  return best;
}

function evaluatePlacementAt(tile, otherTiles, x, y) {
  const oldX = tile.x;
  const oldY = tile.y;
  positionTile(tile, x, y);
  const contact = findBestContact(tile, otherTiles);
  const touchingFaceIndices = getTouchingFaceIndices(tile, otherTiles);
  const overlaps = hasAnyOverlap(tile, otherTiles);
  positionTile(tile, oldX, oldY);
  return {
    valid: contact.valid,
    count: contact.count,
    overlaps,
    faceIndices: contact.faceIndices || [],
    touchingFaceIndices,
  };
}

function getTouchingFaceIndices(tile, otherTiles) {
  const touching = new Set();
  const aFaces = getContactFaces(tile);
  for (const other of otherTiles) {
    const bFaces = getContactFaces(other);
    const threshold = Math.min(tile.sideLength, other.sideLength) * CONTACT_DISTANCE_RATIO;
    for (let i = 0; i < aFaces.length; i += 1) {
      const af = aFaces[i];
      for (let j = 0; j < bFaces.length; j += 1) {
        const bf = bFaces[j];
        const normalDot = af.nx * bf.nx + af.ny * bf.ny;
        if (normalDot > OPPOSITE_NORMAL_THRESHOLD) continue;
        const tangentDot = Math.abs(af.tx * bf.tx + af.ty * bf.ty);
        if (tangentDot < FACE_TANGENT_ALIGNMENT) continue;
        const midpointDistance = Math.hypot(af.mx - bf.mx, af.my - bf.my);
        if (midpointDistance > threshold) continue;
        touching.add(i);
      }
    }
  }
  return Array.from(touching);
}

function getMatchAlignmentCorrection(match) {
  if (!match?.matchedPairs?.length) return null;
  let dx = 0;
  let dy = 0;
  for (const pair of match.matchedPairs) {
    const a = match.aFaces[pair.i];
    const b = match.bFaces[pair.j];
    dx += b.mx - a.mx;
    dy += b.my - a.my;
  }

  const count = match.matchedPairs.length;
  let avgDx = dx / count;
  let avgDy = dy / count;
  const mag = Math.hypot(avgDx, avgDy);
  if (mag > 1e-6) {
    avgDx -= (avgDx / mag) * SNAP_POINT_GAP;
    avgDy -= (avgDy / mag) * SNAP_POINT_GAP;
  }
  return {
    dx: avgDx,
    dy: avgDy,
  };
}

function getSideSamples(tile) {
  return getContactFaces(tile).map((f) => ({
    px: f.mx,
    py: f.my,
    nx: f.nx,
    ny: f.ny,
  }));
}

function getSideDirections(tile) {
  return getContactFaces(tile).map((f) => ({
    nx: f.nx,
    ny: f.ny,
    offset: f.offset,
  }));
}

function getContactFaces(tile) {
  const points = getGuideFacePoints(tile);
  const rotationRad = (tile.rotation * Math.PI) / 180;
  const cos = Math.cos(rotationRad);
  const sin = Math.sin(rotationRad);
  const world = points.map((p) => ({
    x: tile.x + p.x * cos - p.y * sin,
    y: tile.y + p.x * sin + p.y * cos,
  }));

  const faces = [];
  for (let i = 0; i < world.length; i += 1) {
    const a = world[i];
    const b = world[(i + 1) % world.length];
    const ex = b.x - a.x;
    const ey = b.y - a.y;
    const len = Math.hypot(ex, ey) || 1;
    const tx = ex / len;
    const ty = ey / len;
    let nx = ty;
    let ny = -tx;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;

    if ((mx - tile.x) * nx + (my - tile.y) * ny < 0) {
      nx = -nx;
      ny = -ny;
    }

    const offset = (mx - tile.x) * nx + (my - tile.y) * ny;
    faces.push({
      mx,
      my,
      nx,
      ny,
      tx,
      ty,
      len,
      offset,
      startIdx: i,
      endIdx: (i + 1) % world.length,
      isWall: tile.wallFaceSet?.has(i) ?? false,
    });
  }

  return faces;
}

function isBlockedContactFace(tile, face) {
  if (tile.id !== "molten_entrance") return false;
  return (
    TILE_START_NON_NUMERIC_POINTS.has(face.startIdx)
    || TILE_START_NON_NUMERIC_POINTS.has(face.endIdx)
  );
}

function isTouchingTileStartBlockedPoints(tile, otherTile, touchRadius) {
  if (tile.id !== "molten_entrance") return false;
  const points = getGuideFacePoints(tile);
  const rotationRad = (tile.rotation * Math.PI) / 180;
  const cos = Math.cos(rotationRad);
  const sin = Math.sin(rotationRad);

  for (const idx of TILE_START_NON_NUMERIC_POINTS) {
    const p = points[idx];
    if (!p) continue;
    const wx = tile.x + p.x * cos - p.y * sin;
    const wy = tile.y + p.x * sin + p.y * cos;
    if (isWorldPointOnOpaquePixel(otherTile, wx, wy, touchRadius)) return true;
  }

  return false;
}

function isTouchingMoltenEntranceBlockedPoints(tile) {
  if (!tile || tile.id === "molten_entrance") return false;
  const entrance = state.tiles.get("molten_entrance");
  if (!entrance || !entrance.placed) return false;
  return isTouchingTileStartBlockedPoints(entrance, tile, BLOCKED_POINT_TOUCH_RADIUS);
}

function isWorldPointOnOpaquePixel(tile, wx, wy, radius = 0, minAlpha = 24) {
  if (!tile?.img || !tile.alphaMask) return false;
  const theta = (tile.rotation * Math.PI) / 180;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const dx = wx - tile.x;
  const dy = wy - tile.y;

  // Inverse-rotate from world space into tile-local space.
  const lx = dx * cos + dy * sin;
  const ly = -dx * sin + dy * cos;

  const iw = tile.alphaMask.width || 0;
  const ih = tile.alphaMask.height || 0;
  if (!iw || !ih) return false;

  const pxCenter = ((lx / TILE_SIZE) + 0.5) * iw;
  const pyCenter = ((ly / TILE_SIZE) + 0.5) * ih;
  const sampleRadius = Math.max(0, Math.ceil((radius / TILE_SIZE) * Math.max(iw, ih)));

  const x0 = Math.max(0, Math.floor(pxCenter - sampleRadius));
  const x1 = Math.min(iw - 1, Math.ceil(pxCenter + sampleRadius));
  const y0 = Math.max(0, Math.floor(pyCenter - sampleRadius));
  const y1 = Math.min(ih - 1, Math.ceil(pyCenter + sampleRadius));

  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const alpha = tile.alphaMask.alpha[y * iw + x];
      if (alpha >= minAlpha) return true;
    }
  }
  return false;
}

function getPlacedTiles() {
  return Array.from(state.tiles.values()).filter((tile) => tile.active && tile.placed);
}

function revertToTray(tile, message, warn = false) {
  clearInvalidReturnTimer(tile);
  tile.placed = false;
  tile.rotation = 0;
  positionTileAtTrayCenter(tile);
  updateTileParent(tile, tile.traySlot);
  updateTileTransform(tile);
  selectTile(null);
  setPlacementFeedback(tile, null);
  setStatus(message, warn);
}

function handleInvalidDrop(tile, placedTiles, message = null, force = false) {
  if (state.ignoreContactRule && !force) {
    clearInvalidReturnTimer(tile);
    setPlacementFeedback(tile, null);
    return;
  }
  clearInvalidReturnTimer(tile);
  tile.placed = false;
  moveAwayFromPlacedTiles(tile, placedTiles);
  updateTileParent(tile, board);
  updateTileTransform(tile);
  selectTile(null);
  setPlacementFeedback(tile, false);
  setStatus(
    message ?? `Invalid placement: this tile needs at least ${MIN_CONTACT_POINTS} point contacts. Returning to tray in 10s.`,
    true,
  );

  tile.invalidReturnTimer = setTimeout(() => {
    tile.invalidReturnTimer = null;
    if (tile.placed) return;
    tile.rotation = 0;
    positionTileAtTrayCenter(tile);
    updateTileParent(tile, tile.traySlot);
    updateTileTransform(tile);
    selectTile(null);
    setPlacementFeedback(tile, null);
    setStatus(`${tile.id} returned to tray after invalid placement.`, true);
  }, INVALID_RETURN_DELAY_MS);
}

function moveAwayFromPlacedTiles(tile, placedTiles) {
  if (!placedTiles.length) return;

  // Move away from the densest local area (weighted by inverse distance), not just one nearest tile.
  let wx = 0;
  let wy = 0;
  let wSum = 0;
  for (const other of placedTiles) {
    const d = Math.hypot(tile.x - other.x, tile.y - other.y);
    const w = 1 / Math.max(1, d);
    wx += other.x * w;
    wy += other.y * w;
    wSum += w;
  }
  const denseX = wSum > 0 ? wx / wSum : board.clientWidth / 2;
  const denseY = wSum > 0 ? wy / wSum : board.clientHeight / 2;
  const anchorTile = getNearestTile(tile.x, tile.y, placedTiles);

  let vx = tile.x - denseX;
  let vy = tile.y - denseY;
  let vLen = Math.hypot(vx, vy);
  if (vLen < 1e-6) {
    vx = tile.x - board.clientWidth / 2;
    vy = tile.y - board.clientHeight / 2;
    vLen = Math.hypot(vx, vy) || 1;
  }

  const nx = vx / vLen;
  const ny = vy / vLen;
  const push = INVALID_DROP_PUSH_PX * 1.15;
  const targetX = clamp(tile.x + nx * push, 0, board.clientWidth);
  const targetY = clamp(tile.y + ny * push, 0, board.clientHeight);
  const fallback = snapTileCenterToHex(tile, targetX, targetY);
  const candidate = findBestOpenHex(tile, placedTiles, fallback.x, fallback.y, anchorTile);
  positionTile(tile, candidate.x, candidate.y);
}

function findBestOpenHex(tile, placedTiles, preferredX, preferredY, anchorTile = null) {
  const layout = getBoardHexLayout();
  const start = snapTileCenterToHex(tile, preferredX, preferredY);
  const directions = [
    { x: layout.dx, y: layout.dy / 2 },
    { x: layout.dx, y: -layout.dy / 2 },
    { x: 0, y: -layout.dy },
    { x: -layout.dx, y: -layout.dy / 2 },
    { x: -layout.dx, y: layout.dy / 2 },
    { x: 0, y: layout.dy },
  ];

  const oldX = tile.x;
  const oldY = tile.y;
  const visited = new Set();
  const queue = [{ x: start.x, y: start.y, depth: 0 }];
  const maxDepth = 12;

  const keyOf = (x, y) => `${Math.round(x * 100) / 100}:${Math.round(y * 100) / 100}`;
  const minCenterDistance = layout.hexHeight * 2.25;
  const minFaceDistance = layout.hexHeight * 1.95;
  const minAnchorCenterDistance = layout.hexHeight * 3.0;
  let bestStrict = null;
  let bestLoose = null;

  while (queue.length) {
    const cur = queue.shift();
    const key = keyOf(cur.x, cur.y);
    if (visited.has(key)) continue;
    visited.add(key);

    const cx = clamp(cur.x, 0, board.clientWidth);
    const cy = clamp(cur.y, 0, board.clientHeight);
    const snapped = snapTileCenterToHex(tile, cx, cy);

    positionTile(tile, snapped.x, snapped.y);
    const overlaps = hasAnyOverlap(tile, placedTiles);
    if (!overlaps) {
      const metrics = getCandidateClearanceMetrics(tile, placedTiles, snapped.x, snapped.y);
      const anchorCenterDistance = anchorTile
        ? Math.hypot(snapped.x - anchorTile.x, snapped.y - anchorTile.y)
        : Number.POSITIVE_INFINITY;
      const score = metrics.minCenterDist * 2.0 + metrics.avgCenterDist * 0.4 + metrics.minFaceDist * 0.7 - cur.depth * 2.6;

      if (
        metrics.minCenterDist >= minCenterDistance
        && metrics.minFaceDist >= minFaceDistance
        && anchorCenterDistance >= minAnchorCenterDistance
      ) {
        // BFS queue order means first strict hit is typically the nearest valid ring.
        if (cur.depth <= 8) {
          positionTile(tile, oldX, oldY);
          return { x: snapped.x, y: snapped.y };
        }
        if (!bestStrict || score > bestStrict.score) bestStrict = { x: snapped.x, y: snapped.y, score };
      } else if (!bestLoose || score > bestLoose.score) {
        bestLoose = { x: snapped.x, y: snapped.y, score };
      }
    }

    if (cur.depth >= maxDepth) continue;
    for (const dir of directions) {
      queue.push({
        x: cur.x + dir.x,
        y: cur.y + dir.y,
        depth: cur.depth + 1,
      });
    }
  }

  positionTile(tile, oldX, oldY);
  if (bestStrict) return { x: bestStrict.x, y: bestStrict.y };
  if (bestLoose) return { x: bestLoose.x, y: bestLoose.y };
  return start;
}

function getNearestTile(x, y, tiles) {
  if (!tiles?.length) return null;
  let nearest = tiles[0];
  let best = Math.hypot(x - nearest.x, y - nearest.y);
  for (let i = 1; i < tiles.length; i += 1) {
    const t = tiles[i];
    const d = Math.hypot(x - t.x, y - t.y);
    if (d < best) {
      best = d;
      nearest = t;
    }
  }
  return nearest;
}

function getCandidateClearanceMetrics(tile, otherTiles, x, y) {
  const oldX = tile.x;
  const oldY = tile.y;
  positionTile(tile, x, y);

  let minCenterDist = Number.POSITIVE_INFINITY;
  let sumCenterDist = 0;
  for (const other of otherTiles) {
    const d = Math.hypot(x - other.x, y - other.y);
    if (d < minCenterDist) minCenterDist = d;
    sumCenterDist += d;
  }
  const avgCenterDist = otherTiles.length ? sumCenterDist / otherTiles.length : 0;
  const minFaceDist = getMinFaceDistanceToTiles(tile, otherTiles);

  positionTile(tile, oldX, oldY);
  return { minCenterDist, avgCenterDist, minFaceDist };
}

function getMinFaceDistanceToTiles(tile, otherTiles) {
  const facesA = getContactFaces(tile);
  let minDist = Number.POSITIVE_INFINITY;
  for (const other of otherTiles) {
    const facesB = getContactFaces(other);
    for (const af of facesA) {
      for (const bf of facesB) {
        const d = Math.hypot(af.mx - bf.mx, af.my - bf.my);
        if (d < minDist) minDist = d;
      }
    }
  }
  return Number.isFinite(minDist) ? minDist : 0;
}

function clearInvalidReturnTimer(tile) {
  if (!tile?.invalidReturnTimer) return;
  clearTimeout(tile.invalidReturnTimer);
  tile.invalidReturnTimer = null;
}

function positionTile(tile, x, y) {
  tile.x = x;
  tile.y = y;
}

function positionTileAtTrayCenter(tile) {
  const slot = tile?.traySlot;
  if (!slot) {
    positionTile(tile, TILE_SIZE / 2, TILE_SIZE / 2);
    return;
  }
  const cx = slot.clientWidth / 2;
  const cy = slot.clientHeight / 2;
  positionTile(tile, cx, cy);
}

function updateTileParent(tile, parent) {
  const target = parent === board ? getBoardContentLayer() : parent;
  if (tile.dom.parentElement !== target) {
    target.appendChild(tile.dom);
  }
}

function isOnBoardLayer(parent) {
  if (!parent) return false;
  if (parent === board) return true;
  return parent.classList?.contains("board-content") ?? false;
}

function updateTileTransform(tile) {
  if (!tile.dom) return;
  const scale = tile.dom.parentElement === dragLayer ? getBoardZoom() : 1;
  tile.dom.style.left = `${tile.x}px`;
  tile.dom.style.top = `${tile.y}px`;
  tile.dom.style.transformOrigin = "50% 50%";
  tile.dom.style.transform =
    scale !== 1
      ? `translate(-50%, -50%) scale(${scale})`
      : "translate(-50%, -50%)";
  if (tile.bodyDom) {
    tile.bodyDom.style.transform = `rotate(${tile.rotation}deg)`;
  }
}

function setStatus(message, warn = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("warn", warn);
}

function normalizeAngle(value) {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  });
}

function getOpaqueBounds(image) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);

  const { data, width, height } = ctx.getImageData(0, 0, image.width, image.height);

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha < 24) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  const boundWidth = maxX - minX;
  const boundHeight = maxY - minY;
  const radius = (Math.max(boundWidth, boundHeight) / image.width) * (TILE_SIZE / 2);

  return {
    minX,
    minY,
    maxX,
    maxY,
    radius: Math.max(radius, TILE_SIZE * 0.3),
  };
}

function getAlphaMask(image) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, image.width, image.height);
  const alpha = new Uint8Array(width * height);
  for (let i = 0; i < alpha.length; i += 1) {
    alpha[i] = data[i * 4 + 3];
  }
  return { width, height, alpha };
}

function getFaceGeometry(image, sideCount) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, image.width, image.height);

  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.hypot(width, height);
  const step = (Math.PI * 2) / sideCount;
  const scaleX = TILE_SIZE / width;
  const scaleY = TILE_SIZE / height;

  const points = [];
  for (let i = 0; i < sideCount; i += 1) {
    const angle = (i + 0.5) * step;
    const radius = traceOpaqueRadius(data, width, height, cx, cy, angle, maxRadius);
    points.push({
      x: Math.cos(angle) * radius * scaleX,
      y: Math.sin(angle) * radius * scaleY,
    });
  }

  const normals = [];
  let sideSum = 0;
  let offsetSum = 0;

  for (let i = 0; i < sideCount; i += 1) {
    const prev = points[(i - 1 + sideCount) % sideCount];
    const curr = points[i];
    const next = points[(i + 1) % sideCount];
    const tx = next.x - prev.x;
    const ty = next.y - prev.y;
    const tLen = Math.hypot(tx, ty) || 1;
    let nx = ty / tLen;
    let ny = -tx / tLen;

    if (curr.x * nx + curr.y * ny < 0) {
      nx = -nx;
      ny = -ny;
    }

    normals.push({ nx, ny });
    sideSum += Math.hypot(next.x - curr.x, next.y - curr.y);
    offsetSum += curr.x * nx + curr.y * ny;
  }

  return {
    points,
    normals,
    avgSideLength: sideSum / sideCount,
    avgOffset: offsetSum / sideCount,
  };
}

function traceOpaqueRadius(data, width, height, cx, cy, angle, maxRadius) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let lastOpaque = 0;

  for (let r = 0; r <= maxRadius; r += 0.5) {
    const x = Math.round(cx + dx * r);
    const y = Math.round(cy + dy * r);
    if (x < 0 || y < 0 || x >= width || y >= height) break;
    const alpha = data[(y * width + x) * 4 + 3];
    if (alpha >= 24) {
      lastOpaque = r;
    } else if (r > 0) {
      break;
    }
  }

  return lastOpaque;
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function dist(a, b) {
  const dx = a.px - b.px;
  const dy = a.py - b.py;
  return Math.hypot(dx, dy);
}

function hasAnyOverlap(tile, otherTiles) {
  for (const other of otherTiles) {
    if (Math.hypot(tile.x - other.x, tile.y - other.y) < TILE_SIZE * 0.42) return true;
    if (tilesAlphaOverlap(tile, other)) return true;
  }
  return false;
}

function tilesAlphaOverlap(a, b) {
  if (!a?.alphaMask || !b?.alphaMask) return false;

  const ar = a.shape?.radius ?? TILE_SIZE * 0.5;
  const br = b.shape?.radius ?? TILE_SIZE * 0.5;
  if (Math.hypot(a.x - b.x, a.y - b.y) > ar + br) return false;

  const half = TILE_SIZE * 0.5;
  const minX = Math.max(a.x - half, b.x - half);
  const maxX = Math.min(a.x + half, b.x + half);
  const minY = Math.max(a.y - half, b.y - half);
  const maxY = Math.min(a.y + half, b.y + half);
  if (minX >= maxX || minY >= maxY) return false;

  const step = 3;
  let hitCount = 0;
  for (let y = minY; y <= maxY; y += step) {
    for (let x = minX; x <= maxX; x += step) {
      if (
        isWorldPointOnOpaquePixel(a, x, y, 0, 220)
        && isWorldPointOnOpaquePixel(b, x, y, 0, 220)
      ) {
        hitCount += 1;
        // Require substantial interior overlap; edge touch should stay valid.
        if (hitCount >= 14) return true;
      }
    }
  }

  return false;
}

function getWorldPolygon(tile) {
  const points = getGuideFacePoints(tile);
  const rotationRad = (tile.rotation * Math.PI) / 180;
  const cos = Math.cos(rotationRad);
  const sin = Math.sin(rotationRad);
  return points.map((p) => ({
    x: tile.x + p.x * cos - p.y * sin,
    y: tile.y + p.x * sin + p.y * cos,
  }));
}

function polygonsOverlap(polyA, polyB) {
  for (let i = 0; i < polyA.length; i += 1) {
    const a1 = polyA[i];
    const a2 = polyA[(i + 1) % polyA.length];
    for (let j = 0; j < polyB.length; j += 1) {
      const b1 = polyB[j];
      const b2 = polyB[(j + 1) % polyB.length];
      if (segmentsIntersectStrict(a1, a2, b1, b2)) return true;
    }
  }

  if (pointInPolygonStrict(polyA[0], polyB)) return true;
  if (pointInPolygonStrict(polyB[0], polyA)) return true;
  return false;
}

function segmentsIntersectStrict(a, b, c, d) {
  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);
  const eps = 1e-6;

  const s1 = Math.sign(Math.abs(o1) < eps ? 0 : o1);
  const s2 = Math.sign(Math.abs(o2) < eps ? 0 : o2);
  const s3 = Math.sign(Math.abs(o3) < eps ? 0 : o3);
  const s4 = Math.sign(Math.abs(o4) < eps ? 0 : o4);

  // Strict crossing only; shared endpoints/collinear touch doesn't count as overlap.
  return s1 !== s2 && s3 !== s4 && s1 !== 0 && s2 !== 0 && s3 !== 0 && s4 !== 0;
}

function orient(a, b, c) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function pointInPolygonStrict(p, poly) {
  if (pointOnPolygonEdge(p, poly)) return false;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const pi = poly[i];
    const pj = poly[j];
    const intersects =
      ((pi.y > p.y) !== (pj.y > p.y)) &&
      p.x < ((pj.x - pi.x) * (p.y - pi.y)) / ((pj.y - pi.y) || 1e-9) + pi.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointOnPolygonEdge(p, poly) {
  const eps = 1e-6;
  for (let i = 0; i < poly.length; i += 1) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const cross = orient(a, b, p);
    if (Math.abs(cross) > eps) continue;
    const dot = (p.x - a.x) * (p.x - b.x) + (p.y - a.y) * (p.y - b.y);
    if (dot <= eps) return true;
  }
  return false;
}



function updatePlacementFeedback(tile, pointerClientX, pointerClientY, boardRect, workspaceRect) {
  if (tile.id === "molten_entrance") {
    setPlacementFeedback(tile, null);
    return;
  }

  const isInsideBoard =
    pointerClientX >= boardRect.left &&
    pointerClientX <= boardRect.right &&
    pointerClientY >= boardRect.top &&
    pointerClientY <= boardRect.bottom;

  if (!isInsideBoard) {
    setPlacementFeedback(tile, null);
    return;
  }

  const placedTiles = getPlacedTiles().filter((t) => t.id !== tile.id);
  if (placedTiles.length === 0) {
    setPlacementFeedback(tile, null);
    return;
  }

  const boardOffsetX = (boardRect.left + board.clientLeft) - workspaceRect.left;
  const boardOffsetY = (boardRect.top + board.clientTop) - workspaceRect.top;
  const zoom = getBoardZoom();
  const candidateX =
    isOnBoardLayer(tile.dom.parentElement) ? tile.x : (tile.x - boardOffsetX) / zoom;
  const candidateY =
    isOnBoardLayer(tile.dom.parentElement) ? tile.y : (tile.y - boardOffsetY) / zoom;

  const result = evaluatePlacementAt(tile, placedTiles, candidateX, candidateY);
  if (!result.overlaps && result.touchingFaceIndices.length === 0) {
    setPlacementFeedback(tile, null);
    return;
  }
  const faceIndices = result.valid ? result.faceIndices : result.touchingFaceIndices;
  setPlacementFeedback(tile, result.valid, faceIndices);
}

function setPlacementFeedback(tile, isValid, faceIndices = []) {
  if (!tile.dom) return;
  tile.dom.classList.remove("valid-placement", "invalid-placement");
  if (isValid === true) tile.dom.classList.add("valid-placement");
  if (isValid === false) tile.dom.classList.add("invalid-placement");
  refreshPlacementGuideDom(tile.guideDom, isValid, faceIndices);
}

function refreshPlacementGuideDom(guideDom, isValid, faceIndices) {
  if (!guideDom) return;
  const lines = guideDom.querySelectorAll(".tile-guide-contact-seg");
  const active = new Set((faceIndices || []).filter((v) => Number.isInteger(v)));
  lines.forEach((line) => {
    const idx = Number.parseInt(line.dataset.faceIndex || "", 10);
    line.classList.toggle("is-contact", Number.isInteger(idx) && active.has(idx));
  });
  guideDom.classList.toggle("contact-valid", isValid === true);
  guideDom.classList.toggle("contact-invalid", isValid === false);
}
