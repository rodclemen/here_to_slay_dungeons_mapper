const SIDES = 16;
const ROTATION_STEP = 60;
const BOARD_SCALE = 1.15;
const TILE_SIZE = 170 * BOARD_SCALE;
const CONTACT_DISTANCE_RATIO = 0.55;
const OPPOSITE_NORMAL_THRESHOLD = -0.88;
const FACE_TANGENT_ALIGNMENT = 0.85;
const SNAP_SEARCH_RADIUS = 28 * BOARD_SCALE;
const SNAP_VISUAL_GAP = 0;
const SNAP_POINT_GAP = 0;
const SNAP_COORD_QUANTUM = 0.5;
const MIN_CONTACT_POINTS = 4;
const END_TILE_MAX_CONNECTED_FACES = 3;
const INVALID_RETURN_DELAY_MS = 10_000;
const INVALID_DROP_PUSH_PX = 140;
const ENTRANCE_BLOCKED_FACE_INDICES = new Set([11, 12]);
const BLOCKED_POINT_TOUCH_RADIUS = 4;
const WALL_OVERRIDES_STORAGE_KEY = "hts_wall_overrides_v1";
const END_TILE_OVERRIDES_STORAGE_KEY = "hts_end_tile_overrides_v1";
const UI_THEME_STORAGE_KEY = "hts_ui_theme_v1";
const APPEARANCE_MODE_STORAGE_KEY = "hts_appearance_mode_v1";
const LAST_LIGHT_UI_THEME_STORAGE_KEY = "hts_last_light_ui_theme_v1";
const LAST_DARK_UI_THEME_STORAGE_KEY = "hts_last_dark_ui_theme_v1";
const AUTO_THEME_BY_TILE_SET_STORAGE_KEY = "hts_auto_theme_by_tile_set_v1";
const DRAWER_STATE_STORAGE_KEY = "hts_drawer_state_v1";
const DEFAULT_TILE_SET_ID = "molten";
const DEFAULT_UI_THEME_ID = "molten";
const DEFAULT_APPEARANCE_MODE = "system";
const ENTRANCE_TILE_ID = "entrance";
const TILE_IDS = Array.from({ length: 9 }, (_, i) => `tile_${String(i + 1).padStart(2, "0")}`);
const REFERENCE_CARD_ID = "reference_card";
const UI_THEME_IDS = new Set([
  "molten",
  "overgrown",
  "deep_freeze",
  "nightmare",
  "submerged",
  "dreamscape",
  "molten_dark",
  "overgrown_dark",
  "submerged_dark",
  "deep_freeze_dark",
  "dreamscape_dark",
  "nightmare_dark",
]);
const APPEARANCE_MODE_IDS = new Set(["light", "system", "dark"]);
const APPEARANCE_MODE_ICON_SVG = {
  light: `<svg width="19" height="19" viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="M361.5 1.2c5 2.1 8.6 6.6 9.6 11.9L391 121l107.9 19.8c5.3 1 9.8 4.6 11.9 9.6s1.5 10.7-1.6 15.2L446.9 256l62.3 90.3c3.1 4.5 3.7 10.2 1.6 15.2s-6.6 8.6-11.9 9.6L391 391 371.1 498.9c-1 5.3-4.6 9.8-9.6 11.9s-10.7 1.5-15.2-1.6L256 446.9l-90.3 62.3c-4.5 3.1-10.2 3.7-15.2 1.6s-8.6-6.6-9.6-11.9L121 391 13.1 371.1c-5.3-1-9.8-4.6-11.9-9.6s-1.5-10.7 1.6-15.2L65.1 256 2.8 165.7c-3.1-4.5-3.7-10.2-1.6-15.2s6.6-8.6 11.9-9.6L121 121 140.9 13.1c1-5.3 4.6-9.8 9.6-11.9s10.7-1.5 15.2 1.6L256 65.1 346.3 2.8c4.5-3.1 10.2-3.7 15.2-1.6zM160 256a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zm224 0a128 128 0 1 0 -256 0 128 128 0 1 0 256 0z"/></svg>`,
  dark: `<svg width="19" height="19" viewBox="0 0 384 512" aria-hidden="true"><path fill="currentColor" d="M223.5 32C100 32 0 132.3 0 256S100 480 223.5 480c60.6 0 115.5-24.2 155.8-63.4c5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6c-96.9 0-175.5-78.8-175.5-176c0-65.8 36-123.1 89.3-153.3c6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z"/></svg>`,
  system: `<svg width="19" height="19" viewBox="0 0 576 512" aria-hidden="true"><path fill="currentColor" d="M64 0C28.7 0 0 28.7 0 64L0 352c0 35.3 28.7 64 64 64l176 0-10.7 32L160 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l256 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-69.3 0L336 416l176 0c35.3 0 64-28.7 64-64l0-288c0-35.3-28.7-64-64-64L64 0zM512 64l0 224L64 288 64 64l448 0z"/></svg>`,
};

const TILE_SET_REGISTRY = [
  {
    id: "molten",
    label: "Molten",
    status: "not_implemented",
    gameSetId: "base_game_1",
    uiThemeId: "molten",
    entranceTileId: ENTRANCE_TILE_ID,
    tileIds: TILE_IDS,
    referenceCardId: REFERENCE_CARD_ID,
    bossIds: ["flamebeard", "abyss_empress"],
  },
  {
    id: "overgrown",
    label: "Overgrown",
    status: "not_implemented",
    gameSetId: "base_game_1",
    uiThemeId: "overgrown",
    entranceTileId: ENTRANCE_TILE_ID,
    tileIds: TILE_IDS,
    referenceCardId: REFERENCE_CARD_ID,
    bossIds: ["bloom_brute", "rootgnaw"],
  },
  {
    id: "dreamscape",
    label: "Dreamscape",
    status: "not_implemented",
    gameSetId: "base_game_2",
    uiThemeId: "molten",
    entranceTileId: ENTRANCE_TILE_ID,
    tileIds: TILE_IDS,
    referenceCardId: REFERENCE_CARD_ID,
    bossIds: [],
  },
  {
    id: "nightmare",
    label: "Nightmare",
    status: "not_implemented",
    gameSetId: "base_game_2",
    uiThemeId: "molten",
    entranceTileId: ENTRANCE_TILE_ID,
    tileIds: TILE_IDS,
    referenceCardId: REFERENCE_CARD_ID,
    bossIds: [],
  },
  {
    id: "submerged",
    label: "Submerged",
    status: "not_implemented",
    gameSetId: "base_game_3",
    uiThemeId: "molten",
    entranceTileId: ENTRANCE_TILE_ID,
    tileIds: TILE_IDS,
    referenceCardId: REFERENCE_CARD_ID,
    bossIds: [],
  },
  {
    id: "deep_freeze",
    label: "Deep Freeze",
    status: "not_implemented",
    gameSetId: "base_game_3",
    uiThemeId: "deep_freeze",
    entranceTileId: ENTRANCE_TILE_ID,
    tileIds: TILE_IDS,
    referenceCardId: REFERENCE_CARD_ID,
    bossIds: ["dracos", "tundratuga"],
  },
];
const DEFAULT_WALL_FACE_DATA = buildDefaultWallFaceData();
const BOARD_HEX_SVG_NS = "http://www.w3.org/2000/svg";
const REFERENCE_OFFSET_Y = TILE_SIZE * 0.86;
const START_TILE_DEFAULT_Y_OFFSET = 232;
const BOSS_REFERENCE_MAGNET_GAP = 15 * BOARD_SCALE;
const BOSS_REFERENCE_MAGNET_RADIUS = 72 * BOARD_SCALE;
const BOSS_REFERENCE_MAGNET_TOP_GAP = -56 * BOARD_SCALE;
const BOSS_REFERENCE_MAGNET_SIDE_RADIUS = 44 * BOARD_SCALE;
const BOSS_REFERENCE_MAGNET_SIDE_Y_TOLERANCE = 24 * BOARD_SCALE;
const BOSS_REFERENCE_MAGNET_TOP_RADIUS = 56 * BOARD_SCALE;
const BOSS_REFERENCE_MAGNET_TOP_X_TOLERANCE = 24 * BOARD_SCALE;
const BOSS_SHUFFLE_PREVIEW_MS = 0;
const BOSS_PILE_CYCLE_ANIMATION_MS = 320;
const DICE_SPIN_DURATION_MS = 460;
const RESET_SPIN_DURATION_MS = 460;
const DRAG_EDGE_AUTO_PAN_ZONE = 64;
const DRAG_EDGE_AUTO_PAN_MAX_SPEED = 4.5;
const COMPACT_SIDE_PANEL_MAX_WIDTH = 980;
const AUTO_BUILD_MAX_ATTEMPTS = 600;
const AUTO_BUILD_TOP_BUCKET_SIZE = 8;
const AUTO_BUILD_TOP_BUCKET_SCORE_DELTA = 22;
const AUTO_BUILD_LINE_EXTENSION_PENALTY = 28;
const AUTO_BUILD_LOCAL_DENSITY_PENALTY = 16;
const AUTO_BUILD_CANDIDATE_SOFT_LIMIT = 180;
const AUTO_BUILD_CANDIDATE_HARD_LIMIT = 280;
const AUTO_BUILD_NOVELTY_RETRY_LIMIT = 120;
const AUTO_BUILD_HISTORY_LIMIT = 36;
const HEX_FRONT_LIGHT_BONUS_HEXES = 2.5;
const HEX_BACK_LIGHT_REDUCTION_HEXES = 1.1;
const HEX_BACK_DARKEN_BIAS = 0.14;
const DEFAULT_BOARD_ZOOM = 1;
const BOARD_ITEM_SCALE = 1;
document.documentElement.style.setProperty("--tile-size", `${TILE_SIZE}px`);

const board = document.getElementById("board");
const tray = document.getElementById("tray");
const reservePile = document.getElementById("reserve-pile");
const bossPile = document.getElementById("boss-pile");
const tileSetInlineBtn = document.querySelector(".tile-set-inline-btn");
const tileSetInlineLabel = tileSetInlineBtn?.querySelector("span") || null;
const reserveEditCheckbox = document.getElementById("reserve-edit-checkbox");
const wallEditorPage = document.getElementById("wall-editor-page");
const tileSetSelect = document.getElementById("tile-set-select");
const appearanceModeMenu = document.getElementById("appearance-mode-menu");
const appearanceModeTrigger = document.getElementById("appearance-mode-trigger");
const appearanceModeDropdown = document.getElementById("appearance-mode-dropdown");
const quickActionsMenu = document.getElementById("quick-actions-menu");
const quickActionsTrigger = document.getElementById("quick-actions-trigger");
const quickActionsDropdown = document.getElementById("quick-actions-dropdown");
const autoThemeToggleCheckbox = document.getElementById("auto-theme-toggle-checkbox");
const uiThemeMenu = document.getElementById("ui-theme-menu");
const uiThemeTrigger = document.getElementById("ui-theme-trigger");
const uiThemeDropdown = document.getElementById("ui-theme-dropdown");
const uiThemeSelect = document.getElementById("ui-theme-select");
let uiThemeOptionCatalog = null;
const workspace = document.querySelector(".workspace");
const leftDrawer = document.getElementById("left-drawer");
const rightDrawer = document.getElementById("right-drawer");
const leftDrawerContent = document.getElementById("left-drawer-content");
const rightDrawerContent = document.getElementById("right-drawer-content");
const bossSectionPanel = document.getElementById("boss-section-panel");
const bossSectionPanelMountMarker = document.createComment("boss-section-panel-mount");
if (bossSectionPanel?.parentElement) {
  bossSectionPanel.parentElement.insertBefore(bossSectionPanelMountMarker, bossSectionPanel);
}
const toggleLeftDrawerBtn = document.getElementById("toggle-left-drawer-btn");
const toggleRightDrawerBtn = document.getElementById("toggle-right-drawer-btn");
const statusEl = document.getElementById("status");
const placedProgressEl = document.getElementById("placed-progress");
const feedbackTilesRowEl = document.getElementById("feedback-tiles-row");
const feedbackBossRowEl = document.getElementById("feedback-boss-row");
const feedbackTilesCheckEl = document.getElementById("feedback-tiles-check");
const feedbackBossCheckEl = document.getElementById("feedback-boss-check");
const bossRandomBtn = document.getElementById("boss-random-btn");
const modeIndicatorsEl = document.getElementById("mode-indicators");
const autoBuildBtn = document.getElementById("auto-build-btn");
const rerollBtn = document.getElementById("reroll-btn");
const resetAllBtn = document.getElementById("reset-all-btn");
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
const toggleWallsCheckbox = document.getElementById("toggle-walls-checkbox");
const toggleIgnoreContactCheckbox = document.getElementById("toggle-ignore-contact-checkbox");
const toggleFaceFeedbackCheckbox = document.getElementById("toggle-face-feedback-checkbox");
const dragLayer = document.createElement("div");
dragLayer.className = "drag-layer";
workspace.appendChild(dragLayer);
let boardHexRenderRaf = 0;
let leftDrawerClosingTimer = null;
let compactModeTransitionTimer = null;
const diceSpinTimers = new WeakMap();

const state = {
  tiles: new Map(),
  selectedTileId: null,
  hoveredTileId: null,
  selectedTileSetId: DEFAULT_TILE_SET_ID,
  selectedAppearanceMode: loadAppearanceMode(),
  selectedUiThemeId: loadUiThemeId(),
  autoThemeByTileSet: loadAutoThemeByTileSet(),
  lastLightUiThemeId: loadLastLightUiThemeId(),
  lastDarkUiThemeId: loadLastDarkUiThemeId(),
  tileDefs: [],
  showGuideLabels: false,
  showWallFaces: false,
  wallEditMode: false,
  wallOverrides: loadWallOverrides(),
  endTileOverrides: loadEndTileOverrides(),
  wallEditorTileRefs: new Map(),
  wallEditorActiveTileSetId: null,
  wallEditorActiveTileId: null,
  pendingSwapSource: null,
  reserveEditMode: false,
  reserveOrder: [],
  ignoreContactRule: false,
  useFaceFeedback: false,
  bossEditMode: true,
  bossPileOrderByTileSet: {},
  bossTokens: [],
  nextBossTokenId: 1,
  boardPanX: 0,
  boardPanY: 0,
  activeTileDragCount: 0,
  buildViewSnapshot: null,
  referenceTileSrc: "",
  referenceMarker: null,
  boardZoom: DEFAULT_BOARD_ZOOM,
  compactSidePanelMode: false,
  compactTileActiveSnapshot: null,
  leftDrawerCollapsed: false,
  rightDrawerCollapsed: false,
  autoBuildHistoryBySet: {},
  readinessByTileSet: {},
  entranceFadeAnchor: null,
  bossPileCycleInProgress: false,
  legacyMigrationStats: {
    themeIdLayoutMigrations: 0,
    tileIdMigrations: 0,
    wallOverrideTileIdMigrations: 0,
  },
};

init().catch((error) => {
  console.error(error);
  setStatus("Failed to initialize app. Check image paths.", true);
});

async function init() {
  const initialDrawerState = loadDrawerState();
  state.leftDrawerCollapsed = initialDrawerState.left;
  state.rightDrawerCollapsed = initialDrawerState.right;
  bindGlobalControls();
  await auditTileSetReadiness();
  hydrateTileSetSelector();

  const readyTileSetId = getFirstReadyTileSetId();
  if (readyTileSetId && getTileSetConfig(state.selectedTileSetId)?.status !== "ready") {
    state.selectedTileSetId = readyTileSetId;
  }

  if (tileSetSelect) tileSetSelect.value = state.selectedTileSetId;
  updateTileSetControlWidth();
  applyAppearanceMode(state.selectedAppearanceMode, { showStatus: false, save: false });
  setAutoThemeByTileSet(state.autoThemeByTileSet, {
    save: false,
    showStatus: false,
    applyNow: state.autoThemeByTileSet,
  });
  applyFeedbackMode(state.useFaceFeedback);
  setBossEditMode(true);
  applyDrawerCollapseState({ save: false, rerender: false });
  updateCompactSidePanelMode();
  updateModeIndicators();
  applyBoardZoom(state.boardZoom);

  if (!readyTileSetId) {
    setStatus("No ready Tile Sets available yet. Check readiness report in console.", true);
    return;
  }

  state.referenceTileSrc = getReferenceTileSrc(state.selectedTileSetId);
  await applyTileSet(state.selectedTileSetId, false);
  scheduleBoardHexGridRender();
}

async function loadTiles(tileSetId = state.selectedTileSetId) {
  const defs = buildTileDefs(tileSetId);
  state.tileDefs = defs;
  state.tiles.clear();
  for (const def of defs) {
    const img = await loadImage(def.imageSrc);
    const shape = getOpaqueBounds(img);
    const alphaMask = getAlphaMask(img);
    const faceGeometry = getFaceGeometry(img, SIDES);

    state.tiles.set(def.tileId, {
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
      wallFaceSet: new Set(getStoredWallFaces(tileSetId, def.tileId)),
      allowAsEndTile: getStoredAllowAsEndTile(tileSetId, def.tileId),
    });
  }
}

function getTileSetConfig(tileSetId) {
  return TILE_SET_REGISTRY.find((tileSet) => tileSet.id === tileSetId) || TILE_SET_REGISTRY[0];
}

function getFirstReadyTileSetId() {
  const readyTileSet = TILE_SET_REGISTRY.find((tileSet) => tileSet.status === "ready");
  return readyTileSet?.id || null;
}

function getTileSetStatusSuffix(status) {
  if (status === "ready") return "";
  if (status === "assets_missing") return " - Assets Missing";
  if (status === "wall_data_missing") return " - Wall Data Missing";
  return " - Coming Soon";
}

function hydrateTileSetSelector() {
  if (!tileSetSelect) return;
  tileSetSelect.innerHTML = "";
  for (const tileSet of TILE_SET_REGISTRY) {
    const option = document.createElement("option");
    option.value = tileSet.id;
    option.disabled = tileSet.status !== "ready";
    option.textContent = `${tileSet.label}${getTileSetStatusSuffix(tileSet.status)}`;
    tileSetSelect.appendChild(option);
  }
  updateTileSetControlWidth();
}

function updateTileSetControlWidth() {
  if (!tileSetSelect || !tileSetInlineBtn) return;
  const selectedText = tileSetSelect.options[tileSetSelect.selectedIndex]?.textContent?.trim() || "";
  const probe = document.createElement("span");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.whiteSpace = "nowrap";
  probe.style.pointerEvents = "none";
  probe.style.inset = "-9999px auto auto -9999px";
  const selectStyles = window.getComputedStyle(tileSetSelect);
  const labelStyles = tileSetInlineLabel ? window.getComputedStyle(tileSetInlineLabel) : selectStyles;
  probe.style.font = selectStyles.font;
  probe.textContent = selectedText;
  document.body.appendChild(probe);
  const selectedWidth = Math.ceil(probe.getBoundingClientRect().width);
  probe.style.font = labelStyles.font;
  probe.textContent = tileSetInlineLabel?.textContent?.trim() || "Tile Set:";
  const labelWidth = Math.ceil(probe.getBoundingClientRect().width);
  probe.remove();

  const nameWidth = Math.max(26, selectedWidth + 18);
  const totalWidth = Math.max(120, labelWidth + nameWidth + 20);
  tileSetInlineBtn.style.width = `${totalWidth}px`;
  tileSetInlineBtn.style.minWidth = `${totalWidth}px`;
  tileSetSelect.style.width = `${nameWidth}px`;
}

function buildTileKey(tileSetId, tileId) {
  return `${tileSetId}:${tileId}`;
}

function buildTileDefs(tileSetId) {
  const tileSet = getTileSetConfig(tileSetId);
  const basePath = `./tiles/${tileSet.id}`;
  const entranceTileId = tileSet.entranceTileId || ENTRANCE_TILE_ID;
  const tileIds = Array.isArray(tileSet.tileIds) && tileSet.tileIds.length ? tileSet.tileIds : TILE_IDS;

  return [
    {
      tileSetId: tileSet.id,
      tileId: entranceTileId,
      key: buildTileKey(tileSet.id, entranceTileId),
      imageSrc: `${basePath}/${tileSet.id}_entrance.png`,
      required: true,
    },
    ...tileIds.map((tileId) => ({
      tileSetId: tileSet.id,
      tileId,
      key: buildTileKey(tileSet.id, tileId),
      imageSrc: `${basePath}/${tileSet.id}_${tileId}.png`,
      required: false,
    })),
  ];
}

function isEntranceTile(tile) {
  return Boolean(tile && tile.tileId === ENTRANCE_TILE_ID);
}

function isMoltenRegularTile(tile) {
  if (!tile || isEntranceTile(tile)) return false;
  if (tile.tileSetId !== "molten") return false;
  return /^tile_\d{2}$/.test(tile.tileId);
}

function isMoltenEntranceTile(tile) {
  return Boolean(tile && tile.tileSetId === "molten" && isEntranceTile(tile));
}

function getTileDisplayLabel(tileId) {
  if (tileId === ENTRANCE_TILE_ID) return "Entrance Tile";
  if (tileId === REFERENCE_CARD_ID) return "Reference Card";
  const match = /^tile_(\d{2})$/.exec(String(tileId || ""));
  if (match) return `Dungeon Tile ${match[1]}`;
  return String(tileId || "Tile");
}

function migrateLegacyTileId(tileId) {
  if (tileId === "molten_entrance") {
    state.legacyMigrationStats.tileIdMigrations += 1;
    return ENTRANCE_TILE_ID;
  }
  const numeric = /^tile([1-9])$/.exec(String(tileId || "").trim());
  if (numeric) {
    state.legacyMigrationStats.tileIdMigrations += 1;
    return `tile_0${numeric[1]}`;
  }
  return tileId;
}

function migrateLegacyLayout(layout) {
  if (!layout || typeof layout !== "object") return layout;
  if (layout.themeId && !layout.tileSetId) {
    state.legacyMigrationStats.themeIdLayoutMigrations += 1;
  }
  const tileSetId = layout.tileSetId || layout.themeId || state.selectedTileSetId;
  const tiles = Array.isArray(layout.tiles)
    ? layout.tiles.map((tile) => ({
        ...tile,
        tileId: migrateLegacyTileId(tile?.tileId || tile?.id),
      }))
    : [];
  const reserveOrder = Array.isArray(layout.reserveOrder)
    ? layout.reserveOrder.map((tileId) => migrateLegacyTileId(tileId))
    : [];
  return {
    ...layout,
    tileSetId,
    reserveOrder,
    tiles,
  };
}

function migrateLegacyWallOverrides(raw) {
  if (!raw || typeof raw !== "object") return {};
  const migrated = {};
  for (const [tileSetId, tileMap] of Object.entries(raw)) {
    if (!tileMap || typeof tileMap !== "object") continue;
    const tileOut = {};
    for (const [tileId, faces] of Object.entries(tileMap)) {
      const migratedTileId = migrateLegacyTileId(tileId);
      if (migratedTileId !== tileId) {
        state.legacyMigrationStats.wallOverrideTileIdMigrations += 1;
      }
      tileOut[migratedTileId] = faces;
    }
    migrated[tileSetId] = tileOut;
  }
  return migrated;
}

function buildDefaultWallFaceData() {
  const defaults = {};
  for (const tileSet of TILE_SET_REGISTRY) {
    defaults[tileSet.id] = {};
    for (const def of buildTileDefs(tileSet.id)) {
      defaults[tileSet.id][def.tileId] = [];
    }
  }
  return defaults;
}

function getTileSetAssetPaths(tileSet) {
  const basePath = `./tiles/${tileSet.id}`;
  const coreAssets = [
    `${basePath}/${tileSet.id}_entrance.png`,
    ...TILE_IDS.map((tileId) => `${basePath}/${tileSet.id}_${tileId}.png`),
    `${basePath}/${tileSet.id}_${REFERENCE_CARD_ID}.png`,
  ];
  const bossAssets = (tileSet.bossIds || []).map(
    (bossId) => `${basePath}/${tileSet.id}_boss_${bossId}.png`,
  );
  return { coreAssets, bossAssets };
}

function imageExists(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = src;
  });
}

function getMissingDefaultWallEntries(tileSet) {
  const expectedTileIds = [ENTRANCE_TILE_ID, ...TILE_IDS];
  const defaults = DEFAULT_WALL_FACE_DATA?.[tileSet.id];
  if (!defaults || typeof defaults !== "object") return [...expectedTileIds];
  return expectedTileIds.filter((tileId) => !Array.isArray(defaults[tileId]));
}

function resolveTileSetStatus(tileSet, { coreMissing, bossMissing, missingWallEntries }) {
  const hasCoreMissing = coreMissing.length > 0;
  const hasBossMissing = bossMissing.length > 0;
  const hasWallMissing = missingWallEntries.length > 0;
  const allCoreMissing = coreMissing.length >= 11;
  const hasDeclaredBosses = Array.isArray(tileSet?.bossIds) && tileSet.bossIds.length > 0;

  if (!hasCoreMissing && !hasBossMissing && !hasWallMissing) return "ready";
  if (allCoreMissing && (!hasDeclaredBosses || hasBossMissing)) return "not_implemented";
  if (hasCoreMissing || hasBossMissing) return "assets_missing";
  if (hasWallMissing) return "wall_data_missing";
  return "assets_missing";
}

function printTileSetReadinessReport(report) {
  console.group("Here to Slay DUNGEONS - Tile Set Readiness");
  for (const entry of report) {
    console.group(`[${entry.tileSetId}] ${entry.tileSetLabel}`);
    console.info("status:", entry.status);
    if (entry.missingAssets.length) {
      console.warn("missing assets:");
      entry.missingAssets.forEach((asset) => console.warn(`- ${asset}`));
    } else {
      console.info("missing assets: none");
    }
    if (entry.missingWallEntries.length) {
      console.warn("missing wall entries:");
      entry.missingWallEntries.forEach((wallEntry) => console.warn(`- ${wallEntry}`));
    } else {
      console.info("missing wall entries: none");
    }
    if (entry.registryIssues.length) {
      console.warn("registry issues:");
      entry.registryIssues.forEach((issue) => console.warn(`- ${issue}`));
    } else {
      console.info("registry issues: none");
    }
    console.groupEnd();
  }

  const readyTileSets = report.filter((entry) => entry.status === "ready").map((entry) => entry.tileSetId);
  const nonReadyTileSets = report.filter((entry) => entry.status !== "ready").map((entry) => entry.tileSetId);
  console.group("Readiness Summary");
  console.info("ready sets:", readyTileSets.length ? readyTileSets.join(", ") : "none");
  console.info("non-ready sets:", nonReadyTileSets.length ? nonReadyTileSets.join(", ") : "none");
  console.info("legacy migration counters:", state.legacyMigrationStats);
  console.groupEnd();
  console.groupEnd();
}

function getRegistryIssues(tileSet, seenIds) {
  const issues = [];
  if (!tileSet?.id) issues.push("missing id");
  if (!tileSet?.label) issues.push("missing label");
  if (!tileSet?.gameSetId) issues.push("missing gameSetId");
  if (!tileSet?.uiThemeId) issues.push("missing uiThemeId");
  if (!tileSet?.entranceTileId) issues.push("missing entranceTileId");
  if (!Array.isArray(tileSet?.tileIds) || tileSet.tileIds.length !== 9) issues.push("invalid tileIds");
  if (!tileSet?.referenceCardId) issues.push("missing referenceCardId");
  if (!Array.isArray(tileSet?.bossIds)) issues.push("invalid bossIds");
  if (seenIds.has(tileSet.id)) issues.push("duplicate tileSetId");
  return issues;
}

async function auditTileSetReadiness() {
  const report = [];
  const seenIds = new Set();
  for (const tileSet of TILE_SET_REGISTRY) {
    const registryIssues = getRegistryIssues(tileSet, seenIds);
    seenIds.add(tileSet.id);
    const { coreAssets, bossAssets } = getTileSetAssetPaths(tileSet);
    const coreChecks = await Promise.all(coreAssets.map((src) => imageExists(src)));
    const bossChecks = await Promise.all(bossAssets.map((src) => imageExists(src)));
    const coreMissing = coreAssets.filter((_, idx) => !coreChecks[idx]);
    const bossMissing = bossAssets.filter((_, idx) => !bossChecks[idx]);
    const missingWallEntries = getMissingDefaultWallEntries(tileSet);
    let status = resolveTileSetStatus(tileSet, { coreMissing, bossMissing, missingWallEntries });
    // Defensive guard: required core assets and default wall entries are mandatory for "ready".
    if (status === "ready" && (coreMissing.length > 0 || missingWallEntries.length > 0)) {
      status = coreMissing.length > 0 ? "assets_missing" : "wall_data_missing";
    }

    tileSet.status = status;
    const entry = {
      tileSetId: tileSet.id,
      tileSetLabel: tileSet.label,
      status,
      registryIssues,
      missingAssets: [...coreMissing, ...bossMissing],
      missingWallEntries: missingWallEntries.map((tileId) => buildTileKey(tileSet.id, tileId)),
    };
    state.readinessByTileSet[tileSet.id] = entry;
    report.push(entry);
  }

  printTileSetReadinessReport(report);
  return report;
}

async function applyTileSet(tileSetId, showStatus = true) {
  const nextTileSet = getTileSetConfig(tileSetId);
  if (nextTileSet.status !== "ready") {
    setStatus(
      `Tile Set "${nextTileSet.label}" is unavailable (${nextTileSet.status.replaceAll("_", " ")}).`,
      true,
    );
    if (tileSetSelect) tileSetSelect.value = state.selectedTileSetId;
    updateTileSetControlWidth();
    return;
  }
  const previousTileSetId = state.selectedTileSetId;
  try {
    state.selectedTileSetId = nextTileSet.id;
    state.referenceTileSrc = getReferenceTileSrc(nextTileSet.id);
    await loadTiles(nextTileSet.id);
    startRound();
    if (state.autoThemeByTileSet) {
      applyAutoThemeForTileSet(nextTileSet.id, { save: true, showStatus: false });
    }
    if (showStatus) setStatus(`Tile Set: ${nextTileSet.label}.`);
  } catch (error) {
    console.error(error);
    const previousTileSet = getTileSetConfig(previousTileSetId);
    state.selectedTileSetId = previousTileSet.id;
    state.referenceTileSrc = getReferenceTileSrc(previousTileSet.id);
    if (tileSetSelect) tileSetSelect.value = previousTileSet.id;
    updateTileSetControlWidth();
    if (previousTileSet.id !== nextTileSet.id) {
      try {
        await loadTiles(previousTileSet.id);
        startRound();
      } catch (fallbackError) {
        console.error(fallbackError);
      }
    }
    setStatus(`Tile Set "${nextTileSet.label}" assets are missing. Keeping ${previousTileSet.label}.`, true);
  }
}

function bindGlobalControls() {
  if (autoBuildBtn) {
    autoBuildBtn.addEventListener("click", () => {
      triggerDiceSpin(autoBuildBtn);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          autoBuildSelectedTiles();
        });
      });
    });
  }
  rerollBtn.addEventListener("click", () => rerollTrayTiles());
  if (resetAllBtn) {
    resetAllBtn.addEventListener("click", () => {
      triggerResetSpin(resetAllBtn);
      resetTilesAndBossCards();
    });
  }
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
      const { tileSetId, tile } = active;
      tile.wallFaceSet.clear();
      persistTileWallFaces(tileSetId, tile.tileId, tile.wallFaceSet);
      refreshTileWallGuide(tile);
      setStatus(`Cleared wall faces for ${getTileDisplayLabel(tile.tileId)} (${getTileSetConfig(tileSetId).label}).`);
    });
  }
  if (tileSetSelect) {
    tileSetSelect.addEventListener("change", async (event) => {
      const nextTileSetId = event.target.value;
      await applyTileSet(nextTileSetId, true);
      updateTileSetControlWidth();
    });
  }
  if (uiThemeSelect) {
    uiThemeSelect.addEventListener("change", (event) => {
      const nextUiThemeId = event.target.value || DEFAULT_UI_THEME_ID;
      if (isDarkUiTheme(nextUiThemeId)) {
        state.lastDarkUiThemeId = sanitizeDarkUiThemeId(nextUiThemeId);
        saveLastDarkUiThemeId(state.lastDarkUiThemeId);
        applyAppearanceMode("dark");
        return;
      }

      const nextLightTheme = sanitizeLightUiThemeId(nextUiThemeId);
      state.lastLightUiThemeId = nextLightTheme;
      saveLastLightUiThemeId(nextLightTheme);
      applyAppearanceMode("light");
    });
  }
  if (uiThemeTrigger && uiThemeDropdown && uiThemeSelect) {
    uiThemeTrigger.addEventListener("click", () => {
      setAppearanceModeMenuOpen(false);
      setQuickActionsMenuOpen(false);
      const shouldOpen = uiThemeDropdown.hidden;
      setUiThemeMenuOpen(shouldOpen);
    });
    uiThemeDropdown.addEventListener("click", (event) => {
      const option = event.target.closest("[data-ui-theme]");
      if (!option) return;
      const nextUiThemeId = option.dataset.uiTheme || DEFAULT_UI_THEME_ID;
      uiThemeSelect.value = nextUiThemeId;
      uiThemeSelect.dispatchEvent(new Event("change", { bubbles: true }));
      setUiThemeMenuOpen(false);
    });
    document.addEventListener("click", (event) => {
      if (!uiThemeMenu?.contains(event.target)) {
        setUiThemeMenuOpen(false);
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setUiThemeMenuOpen(false);
    });
  }
  if (appearanceModeTrigger && appearanceModeDropdown) {
    appearanceModeTrigger.addEventListener("click", () => {
      setUiThemeMenuOpen(false);
      setQuickActionsMenuOpen(false);
      const shouldOpen = appearanceModeDropdown.hidden;
      setAppearanceModeMenuOpen(shouldOpen);
    });
    appearanceModeDropdown.addEventListener("click", (event) => {
      const option = event.target.closest("[data-appearance-mode]");
      if (!option) return;
      const nextMode = option.dataset.appearanceMode || DEFAULT_APPEARANCE_MODE;
      applyAppearanceMode(nextMode);
      setAppearanceModeMenuOpen(false);
    });
    document.addEventListener("click", (event) => {
      if (!appearanceModeMenu?.contains(event.target)) {
        setAppearanceModeMenuOpen(false);
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setAppearanceModeMenuOpen(false);
    });
  }
  if (quickActionsTrigger && quickActionsDropdown) {
    quickActionsTrigger.addEventListener("click", () => {
      setUiThemeMenuOpen(false);
      setAppearanceModeMenuOpen(false);
      const shouldOpen = quickActionsDropdown.hidden;
      setQuickActionsMenuOpen(shouldOpen);
    });
    quickActionsDropdown.addEventListener("click", (event) => {
      if (!event.target.closest(".quick-action-option")) return;
      setQuickActionsMenuOpen(false);
    });
    document.addEventListener("click", (event) => {
      if (!quickActionsMenu?.contains(event.target)) {
        setQuickActionsMenuOpen(false);
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setQuickActionsMenuOpen(false);
    });
  }
  if (autoThemeToggleCheckbox) {
    autoThemeToggleCheckbox.checked = state.autoThemeByTileSet;
    autoThemeToggleCheckbox.addEventListener("change", () => {
      setAutoThemeByTileSet(autoThemeToggleCheckbox.checked, {
        save: true,
        showStatus: true,
        applyNow: true,
      });
    });
  }
  if (exportWallDataBtn) {
    exportWallDataBtn.addEventListener("click", () => {
      if (!state.wallEditMode) {
        setStatus("Export Debug Walls is available only in Wall Editor mode.", true);
        return;
      }
      exportWallOverridesBackup();
    });
  }
  if (importWallDataBtn && importWallDataInput) {
    importWallDataBtn.addEventListener("click", () => {
      if (!state.wallEditMode) {
        setStatus("Import Debug Walls is available only in Wall Editor mode.", true);
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
      const menu = saveDungeonBtn.closest(".advanced-menu");
      if (menu) menu.open = false;
    });
  }
  if (loadDungeonBtn && loadDungeonInput) {
    loadDungeonBtn.addEventListener("click", () => {
      loadDungeonInput.click();
      const menu = loadDungeonBtn.closest(".advanced-menu");
      if (menu) menu.open = false;
    });
    loadDungeonInput.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      await importDungeonLayout(file);
    });
  }
  if (reserveEditCheckbox) {
    reserveEditCheckbox.checked = state.reserveEditMode;
    document.body.classList.toggle("reserve-edit-mode", state.reserveEditMode);
    reserveEditCheckbox.addEventListener("change", () => {
      if (state.compactSidePanelMode) {
        reserveEditCheckbox.checked = false;
        state.reserveEditMode = false;
        document.body.classList.remove("reserve-edit-mode");
        return;
      }
      state.reserveEditMode = reserveEditCheckbox.checked;
      document.body.classList.toggle("reserve-edit-mode", state.reserveEditMode);
      updateModeIndicators();
      if (state.reserveEditMode) {
        randomizeCurrentInactiveReserveOrder();
      } else {
        clearPendingReserveSwap();
      }
      renderReservePile();
      if (state.reserveEditMode) {
        setStatus("Reserve edit mode on: inactive tiles are shown side by side.");
      } else {
        setStatus("Reserve edit mode off: inactive tiles shown as reserve pile.");
      }
    });
  }
  if (reserveEditCheckbox && reservePile) {
    reservePile.addEventListener("click", (event) => {
      if (state.compactSidePanelMode) return;
      if (state.reserveEditMode) {
        if (!isClickInTopRightCloseHit(event, reservePile)) return;
      }
      reserveEditCheckbox.checked = !state.reserveEditMode;
      reserveEditCheckbox.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }
  if (toggleLeftDrawerBtn) {
    toggleLeftDrawerBtn.addEventListener("click", () => {
      state.leftDrawerCollapsed = !state.leftDrawerCollapsed;
      applyDrawerCollapseState({ preserveBoardScreenPosition: true });
      setStatus(state.leftDrawerCollapsed ? "Left drawer collapsed." : "Left drawer expanded.");
    });
  }
  if (toggleRightDrawerBtn) {
    toggleRightDrawerBtn.addEventListener("click", () => {
      state.rightDrawerCollapsed = !state.rightDrawerCollapsed;
      applyDrawerCollapseState({ preserveBoardScreenPosition: true });
      setStatus(state.rightDrawerCollapsed ? "Right drawer collapsed." : "Right drawer expanded.");
    });
  }
  if (bossRandomBtn) {
    bossRandomBtn.addEventListener("click", () => {
      triggerDiceSpin(bossRandomBtn);
      spawnRandomBossAtReferenceTopMagnet();
    });
  }

  document.addEventListener("keydown", (event) => {
    const isTypingTarget = event.target instanceof HTMLElement
      && (event.target.tagName === "INPUT"
        || event.target.tagName === "TEXTAREA"
        || event.target.tagName === "SELECT"
        || event.target.isContentEditable);
    if (
      isTypingTarget
      || event.metaKey
      || event.ctrlKey
      || event.altKey
    ) {
      return;
    }

    const key = event.key.toLowerCase();

    if (key === "d") {
      event.preventDefault();
      toggleBothDrawers();
      return;
    }

    if (key === "r") {
      event.preventDefault();
      if (autoBuildBtn) triggerDiceSpin(autoBuildBtn);
      autoBuildSelectedTiles();
      return;
    }

    if (key === "x") {
      event.preventDefault();
      if (resetAllBtn) triggerResetSpin(resetAllBtn);
      resetTilesAndBossCards();
      return;
    }

    if (key === "b") {
      event.preventDefault();
      if (bossRandomBtn) triggerDiceSpin(bossRandomBtn);
      spawnRandomBossAtReferenceTopMagnet();
      return;
    }

    const activeTileId = state.hoveredTileId || state.selectedTileId;
    if (!activeTileId) return;

    const tile = state.tiles.get(activeTileId);
    if (!tile) return;

    if (key === "e") {
      rotateTile(tile, ROTATION_STEP);
    }

    if (key === "w") {
      rotateTile(tile, -ROTATION_STEP);
    }
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest(".advanced-menu")) return;
    const openMenus = document.querySelectorAll(".advanced-menu[open]");
    openMenus.forEach((menu) => {
      menu.open = false;
    });
  });

  board.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    if (state.wallEditMode) return;
    if (event.target.closest(".tile, .boss-token")) return;
    if (event.target.closest(".advanced-menu")) return;
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

  window.addEventListener(
    "resize",
    () => {
      updateCompactSidePanelMode();
      applyDrawerCollapseState({ save: false, rerender: false });
      recenterTrayAndReserveTiles();
      scheduleBoardHexGridRender();
    },
    { passive: true },
  );

  const systemModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  systemModeQuery.addEventListener("change", () => {
    if (state.selectedAppearanceMode !== "system") return;
    applyAppearanceMode("system", { showStatus: false, save: false });
  });

}

function triggerDiceSpin(buttonEl) {
  if (!buttonEl || !buttonEl.classList?.contains("icon-dice-btn")) return;
  const existingTimer = diceSpinTimers.get(buttonEl);
  if (existingTimer) {
    clearTimeout(existingTimer);
    diceSpinTimers.delete(buttonEl);
  }
  buttonEl.classList.remove("is-spinning");
  void buttonEl.offsetWidth;
  buttonEl.classList.add("is-spinning");
  const timer = window.setTimeout(() => {
    buttonEl.classList.remove("is-spinning");
    diceSpinTimers.delete(buttonEl);
  }, DICE_SPIN_DURATION_MS);
  diceSpinTimers.set(buttonEl, timer);
}

function triggerResetSpin(buttonEl) {
  if (!buttonEl || !buttonEl.classList?.contains("icon-reset-btn")) return;
  const existingTimer = diceSpinTimers.get(buttonEl);
  if (existingTimer) {
    clearTimeout(existingTimer);
    diceSpinTimers.delete(buttonEl);
  }
  buttonEl.classList.remove("is-spinning");
  void buttonEl.offsetWidth;
  buttonEl.classList.add("is-spinning");
  const timer = window.setTimeout(() => {
    buttonEl.classList.remove("is-spinning");
    diceSpinTimers.delete(buttonEl);
  }, RESET_SPIN_DURATION_MS);
  diceSpinTimers.set(buttonEl, timer);
}

function shouldUseCompactSidePanelMode() {
  return window.innerWidth <= COMPACT_SIDE_PANEL_MAX_WIDTH;
}

function updateCompactSidePanelMode() {
  const shouldCompact = shouldUseCompactSidePanelMode();
  if (state.compactSidePanelMode === shouldCompact) return;
  setCompactSidePanelMode(shouldCompact);
}

function setCompactSidePanelMode(enabled) {
  const useCompact = Boolean(enabled);
  state.compactSidePanelMode = useCompact;
  document.body.classList.toggle("compact-sidepanel-mode", useCompact);

  if (useCompact) {
    if (!state.compactTileActiveSnapshot) {
      state.compactTileActiveSnapshot = new Map(
        Array.from(state.tiles.values())
          .filter((tile) => !tile.required)
          .map((tile) => [tile.tileId, Boolean(tile.active)]),
      );
    }
    if (state.reserveEditMode) {
      state.reserveEditMode = false;
      document.body.classList.remove("reserve-edit-mode");
      clearPendingReserveSwap();
    }
    if (reserveEditCheckbox) reserveEditCheckbox.checked = false;
    for (const tile of state.tiles.values()) {
      if (tile.required) continue;
      tile.active = true;
    }
    state.leftDrawerCollapsed = false;
    state.rightDrawerCollapsed = true;
    if (
      bossSectionPanel
      && leftDrawerContent
      && bossSectionPanel.parentElement !== leftDrawerContent
    ) {
      leftDrawerContent.appendChild(bossSectionPanel);
    }
    rerenderTrayAndReserve();
  } else if (
    bossSectionPanel
    && bossSectionPanelMountMarker.parentElement
    && bossSectionPanel.parentElement !== bossSectionPanelMountMarker.parentElement
  ) {
    restoreRegularTileActivesAfterCompactMode();
    state.leftDrawerCollapsed = false;
    state.rightDrawerCollapsed = false;
    bossSectionPanelMountMarker.parentElement.insertBefore(
      bossSectionPanel,
      bossSectionPanelMountMarker.nextSibling,
    );
    rerenderTrayAndReserve();
  } else {
    restoreRegularTileActivesAfterCompactMode();
    state.leftDrawerCollapsed = false;
    state.rightDrawerCollapsed = false;
    rerenderTrayAndReserve();
  }

  if (compactModeTransitionTimer) {
    clearTimeout(compactModeTransitionTimer);
    compactModeTransitionTimer = null;
  }
  requestAnimationFrame(() => {
    resetBoardView();
    scheduleBoardHexGridRender();
  });
  if (!useCompact) {
    // Run a second recenter after drawer/layout transition settles.
    compactModeTransitionTimer = setTimeout(() => {
      resetBoardView();
      scheduleBoardHexGridRender();
      compactModeTransitionTimer = null;
    }, 260);
  }
}

function restoreRegularTileActivesAfterCompactMode() {
  const snapshot = state.compactTileActiveSnapshot;
  for (const tile of state.tiles.values()) {
    if (tile.required) continue;
    tile.active = tile.placed || Boolean(snapshot?.get(tile.tileId));
  }
  state.compactTileActiveSnapshot = null;
}

function applyDrawerCollapseState({ save = true, rerender = true, preserveBoardScreenPosition = false } = {}) {
  const beforeRect = preserveBoardScreenPosition ? board.getBoundingClientRect() : null;
  const wasLeftCollapsed = document.body.classList.contains("left-drawer-collapsed");
  const canCollapse = window.matchMedia("(min-width: 981px)").matches;
  const leftCollapsed = canCollapse && state.leftDrawerCollapsed;
  const rightCollapsed = canCollapse && state.rightDrawerCollapsed;

  document.body.classList.toggle("left-drawer-collapsed", leftCollapsed);
  document.body.classList.toggle("right-drawer-collapsed", rightCollapsed);

  if (leftCollapsed && !wasLeftCollapsed) {
    document.body.classList.add("left-drawer-closing");
    if (leftDrawerClosingTimer) clearTimeout(leftDrawerClosingTimer);
    leftDrawerClosingTimer = setTimeout(() => {
      document.body.classList.remove("left-drawer-closing");
      leftDrawerClosingTimer = null;
    }, 220);
  } else if (!leftCollapsed) {
    document.body.classList.remove("left-drawer-closing");
    if (leftDrawerClosingTimer) {
      clearTimeout(leftDrawerClosingTimer);
      leftDrawerClosingTimer = null;
    }
  }

  if (leftDrawer) leftDrawer.setAttribute("aria-expanded", String(!leftCollapsed));
  if (rightDrawer) rightDrawer.setAttribute("aria-expanded", String(!rightCollapsed));
  if (leftDrawerContent) leftDrawerContent.setAttribute("aria-hidden", String(leftCollapsed));
  if (rightDrawerContent) rightDrawerContent.setAttribute("aria-hidden", String(rightCollapsed));

  if (toggleLeftDrawerBtn) {
    toggleLeftDrawerBtn.setAttribute("aria-expanded", String(!leftCollapsed));
    toggleLeftDrawerBtn.setAttribute("aria-label", leftCollapsed ? "Expand tile drawer" : "Collapse tile drawer");
    toggleLeftDrawerBtn.setAttribute("title", leftCollapsed ? "Expand tile drawer" : "Collapse tile drawer");
  }
  if (toggleRightDrawerBtn) {
    toggleRightDrawerBtn.setAttribute("aria-expanded", String(!rightCollapsed));
    toggleRightDrawerBtn.setAttribute("aria-label", rightCollapsed ? "Expand info drawer" : "Collapse info drawer");
    toggleRightDrawerBtn.setAttribute("title", rightCollapsed ? "Expand info drawer" : "Collapse info drawer");
  }

  if (save) saveDrawerState({ left: leftCollapsed, right: rightCollapsed });
  const completeRerender = () => {
    if (!rerender) return;
    if (!preserveBoardScreenPosition) {
      recenterTrayAndReserveTiles();
    }
    scheduleBoardHexGridRender();
    setTimeout(scheduleBoardHexGridRender, 220);
  };

  if (beforeRect) {
    lockBoardSceneDuringLayoutTransition(beforeRect, 260, completeRerender);
    return;
  }

  completeRerender();
}

function recenterTrayAndReserveTiles() {
  for (const tile of state.tiles.values()) {
    if (tile.placed) continue;
    positionTileAtTrayCenter(tile);
    updateTileTransform(tile);
  }
}

function loadDrawerState() {
  try {
    const raw = localStorage.getItem(DRAWER_STATE_STORAGE_KEY);
    if (!raw) return { left: false, right: false };
    const parsed = JSON.parse(raw);
    return {
      left: Boolean(parsed?.left),
      right: Boolean(parsed?.right),
    };
  } catch (error) {
    console.warn("Could not load drawer collapse state.", error);
    return { left: false, right: false };
  }
}

function saveDrawerState(next) {
  try {
    localStorage.setItem(
      DRAWER_STATE_STORAGE_KEY,
      JSON.stringify({
        left: Boolean(next?.left),
        right: Boolean(next?.right),
      }),
    );
  } catch (error) {
    console.warn("Could not save drawer collapse state.", error);
  }
}

function shiftBoardSceneBy(dx, dy) {
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
  if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return;

  state.boardPanX += dx;
  state.boardPanY += dy;

  const boardTiles = Array.from(state.tiles.values())
    .filter((tile) => tile.dom && isOnBoardLayer(tile.dom.parentElement));
  for (const tile of boardTiles) {
    positionTile(tile, tile.x + dx, tile.y + dy);
    updateTileTransform(tile);
  }

  if (state.referenceMarker?.dom) {
    const nextX = state.referenceMarker.x + dx;
    const nextY = state.referenceMarker.y + dy;
    state.referenceMarker.dom.style.left = `${nextX}px`;
    state.referenceMarker.dom.style.top = `${nextY}px`;
    state.referenceMarker.x = nextX;
    state.referenceMarker.y = nextY;
  }

  const boardBossTokens = state.bossTokens
    .filter((token) => token?.dom && isOnBoardLayer(token.dom.parentElement));
  for (const token of boardBossTokens) {
    positionBossToken(token, token.x + dx, token.y + dy);
    updateBossTokenTransform(token);
  }
}

function lockBoardSceneDuringLayoutTransition(startRect, durationMs, onDone) {
  let lastLeft = startRect.left;
  let lastTop = startRect.top;
  const endAt = performance.now() + durationMs;

  const step = () => {
    const rect = board.getBoundingClientRect();
    const zoom = getBoardZoom();
    const dx = (lastLeft - rect.left) / zoom;
    const dy = (lastTop - rect.top) / zoom;
    if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
      shiftBoardSceneBy(dx, dy);
    }
    lastLeft = rect.left;
    lastTop = rect.top;
    renderBoardHexGrid();

    if (performance.now() < endAt) {
      requestAnimationFrame(step);
      return;
    }
    if (typeof onDone === "function") onDone();
  };

  requestAnimationFrame(step);
}

function toggleBothDrawers() {
  const collapseBoth = !(state.leftDrawerCollapsed && state.rightDrawerCollapsed);
  state.leftDrawerCollapsed = collapseBoth;
  state.rightDrawerCollapsed = collapseBoth;
  applyDrawerCollapseState({ preserveBoardScreenPosition: true });
  setStatus(collapseBoth ? "Both drawers collapsed." : "Both drawers expanded.");
}

function loadAppearanceMode() {
  try {
    const saved = localStorage.getItem(APPEARANCE_MODE_STORAGE_KEY);
    if (APPEARANCE_MODE_IDS.has(saved)) return saved;
  } catch (error) {
    console.warn("Could not load appearance mode preference.", error);
  }
  return DEFAULT_APPEARANCE_MODE;
}

function loadAutoThemeByTileSet() {
  try {
    const saved = localStorage.getItem(AUTO_THEME_BY_TILE_SET_STORAGE_KEY);
    if (saved == null) return true;
    if (saved === "true") return true;
    if (saved === "false") return false;
  } catch (error) {
    console.warn("Could not load auto theme preference.", error);
  }
  return true;
}

function saveAutoThemeByTileSet(enabled) {
  try {
    localStorage.setItem(AUTO_THEME_BY_TILE_SET_STORAGE_KEY, String(Boolean(enabled)));
  } catch (error) {
    console.warn("Could not save auto theme preference.", error);
  }
}

function saveAppearanceMode(mode) {
  try {
    localStorage.setItem(APPEARANCE_MODE_STORAGE_KEY, mode);
  } catch (error) {
    console.warn("Could not save appearance mode preference.", error);
  }
}

function syncThemeControlVisibility() {
  const autoMode = Boolean(state.autoThemeByTileSet);
  if (autoMode) {
    setAppearanceModeMenuOpen(false);
    setUiThemeMenuOpen(false);
  }
  if (appearanceModeMenu) appearanceModeMenu.hidden = autoMode;
  if (uiThemeMenu) uiThemeMenu.hidden = autoMode;
}

function loadUiThemeId() {
  try {
    const saved = localStorage.getItem(UI_THEME_STORAGE_KEY);
    if (saved === "current") return DEFAULT_UI_THEME_ID;
    if (UI_THEME_IDS.has(saved)) return saved;
  } catch (error) {
    console.warn("Could not load UI theme preference.", error);
  }
  return DEFAULT_UI_THEME_ID;
}

function loadLastLightUiThemeId() {
  try {
    const saved = localStorage.getItem(LAST_LIGHT_UI_THEME_STORAGE_KEY);
    if (saved === "current") return DEFAULT_UI_THEME_ID;
    if (saved === "molten" || saved === "overgrown" || saved === "deep_freeze" || saved === "dreamscape" || saved === "nightmare" || saved === "submerged") return saved;
  } catch (error) {
    console.warn("Could not load light theme preference.", error);
  }
  return DEFAULT_UI_THEME_ID;
}

function loadLastDarkUiThemeId() {
  try {
    const saved = localStorage.getItem(LAST_DARK_UI_THEME_STORAGE_KEY);
    if (saved === "molten_dark" || saved === "overgrown_dark" || saved === "submerged_dark" || saved === "deep_freeze_dark" || saved === "dreamscape_dark" || saved === "nightmare_dark") return saved;
  } catch (error) {
    console.warn("Could not load dark theme preference.", error);
  }
  return "overgrown_dark";
}

function saveLastLightUiThemeId(uiThemeId) {
  try {
    localStorage.setItem(LAST_LIGHT_UI_THEME_STORAGE_KEY, sanitizeLightUiThemeId(uiThemeId));
  } catch (error) {
    console.warn("Could not save light theme preference.", error);
  }
}

function saveLastDarkUiThemeId(uiThemeId) {
  try {
    localStorage.setItem(LAST_DARK_UI_THEME_STORAGE_KEY, sanitizeDarkUiThemeId(uiThemeId));
  } catch (error) {
    console.warn("Could not save dark theme preference.", error);
  }
}

function saveUiThemeId(uiThemeId) {
  try {
    localStorage.setItem(UI_THEME_STORAGE_KEY, uiThemeId);
  } catch (error) {
    console.warn("Could not save UI theme preference.", error);
  }
}

function sanitizeLightUiThemeId(uiThemeId) {
  if (uiThemeId === "current") return DEFAULT_UI_THEME_ID;
  if (uiThemeId === "overgrown") return "overgrown";
  if (uiThemeId === "deep_freeze") return "deep_freeze";
  if (uiThemeId === "dreamscape") return "dreamscape";
  if (uiThemeId === "nightmare") return "nightmare";
  if (uiThemeId === "submerged") return "submerged";
  return uiThemeId === "molten" ? "molten" : DEFAULT_UI_THEME_ID;
}

function sanitizeDarkUiThemeId(uiThemeId) {
  if (uiThemeId === "molten_dark") return "molten_dark";
  if (uiThemeId === "overgrown_dark") return "overgrown_dark";
  if (uiThemeId === "submerged_dark") return "submerged_dark";
  if (uiThemeId === "deep_freeze_dark") return "deep_freeze_dark";
  if (uiThemeId === "dreamscape_dark") return "dreamscape_dark";
  if (uiThemeId === "nightmare_dark") return "nightmare_dark";
  return "overgrown_dark";
}

function isDarkUiTheme(uiThemeId) {
  return uiThemeId === "molten_dark" || uiThemeId === "overgrown_dark" || uiThemeId === "submerged_dark" || uiThemeId === "deep_freeze_dark" || uiThemeId === "dreamscape_dark" || uiThemeId === "nightmare_dark";
}

function resolvePairedUiThemeIdForMode(uiThemeId, mode) {
  const baseThemeId = isDarkUiTheme(uiThemeId)
    ? uiThemeId.replace(/_dark$/, "")
    : uiThemeId;
  if (mode === "dark") {
    return sanitizeDarkUiThemeId(`${baseThemeId}_dark`);
  }
  if (mode === "light") {
    return sanitizeLightUiThemeId(baseThemeId);
  }
  return uiThemeId;
}

function resolveUiThemeForAppearanceMode(mode) {
  if (mode === "dark") return sanitizeDarkUiThemeId(state.lastDarkUiThemeId || state.selectedUiThemeId);
  if (mode === "light") return sanitizeLightUiThemeId(state.lastLightUiThemeId || state.selectedUiThemeId);
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? sanitizeDarkUiThemeId(state.lastDarkUiThemeId || state.selectedUiThemeId)
    : sanitizeLightUiThemeId(state.lastLightUiThemeId || state.selectedUiThemeId);
}

function applyAutoThemeForTileSet(tileSetId, { save = true, showStatus = false } = {}) {
  const linkedLightThemeId = sanitizeLightUiThemeId(tileSetId);
  const linkedDarkThemeId = sanitizeDarkUiThemeId(`${linkedLightThemeId}_dark`);
  state.lastLightUiThemeId = linkedLightThemeId;
  state.lastDarkUiThemeId = linkedDarkThemeId;
  if (save) {
    saveLastLightUiThemeId(linkedLightThemeId);
    saveLastDarkUiThemeId(linkedDarkThemeId);
  }
  applyAppearanceMode(state.selectedAppearanceMode, { showStatus, save });
}

function setAutoThemeByTileSet(enabled, { save = true, showStatus = true, applyNow = true } = {}) {
  state.autoThemeByTileSet = Boolean(enabled);
  if (autoThemeToggleCheckbox) autoThemeToggleCheckbox.checked = state.autoThemeByTileSet;
  syncThemeControlVisibility();
  if (state.autoThemeByTileSet && applyNow) {
    applyAutoThemeForTileSet(state.selectedTileSetId, { save, showStatus: false });
  }
  if (save) saveAutoThemeByTileSet(state.autoThemeByTileSet);
  if (showStatus) {
    setStatus(
      state.autoThemeByTileSet
        ? "Auto Theme: ON (theme follows tile set)."
        : "Auto Theme: OFF (manual theme controls enabled).",
    );
  }
}

function syncUiThemeSelectAvailability(mode) {
  if (!uiThemeSelect) return;
  if (!Array.isArray(uiThemeOptionCatalog)) {
    uiThemeOptionCatalog = Array.from(uiThemeSelect.options).map((option) => ({
      value: option.value,
      label: option.textContent || option.value,
    }));
  }
  const effectiveMode =
    mode === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : mode;
  const optionCatalog = uiThemeOptionCatalog;
  const selectedBefore = state.selectedUiThemeId;
  const allowedOptions = optionCatalog.filter((entry) => {
    const darkOption = isDarkUiTheme(entry.value);
    if (effectiveMode === "dark") return darkOption;
    if (effectiveMode === "light") return !darkOption;
    return true;
  });

  uiThemeSelect.innerHTML = "";
  for (const entry of allowedOptions) {
    const option = document.createElement("option");
    option.value = entry.value;
    option.textContent = entry.label;
    uiThemeSelect.appendChild(option);
  }

  if (allowedOptions.some((entry) => entry.value === selectedBefore)) {
    uiThemeSelect.value = selectedBefore;
  }
  syncUiThemeMenuOptions();
}

function getAppearanceModeLabel(mode) {
  if (mode === "light") return "Light";
  if (mode === "dark") return "Dark";
  return "System";
}

function getAppearanceModeMenuItemLabel(mode) {
  if (mode === "light") return "Light Mode";
  if (mode === "dark") return "Dark Mode";
  return "System";
}

function applyAppearanceMode(mode, { showStatus = true, save = true } = {}) {
  const nextMode = APPEARANCE_MODE_IDS.has(mode) ? mode : DEFAULT_APPEARANCE_MODE;
  const previousMode = state.selectedAppearanceMode;
  const previousThemeId = state.selectedUiThemeId;
  state.selectedAppearanceMode = nextMode;

  let resolvedUiThemeId = resolveUiThemeForAppearanceMode(nextMode);
  const changedToExplicitMode =
    (nextMode === "light" || nextMode === "dark") &&
    previousMode !== nextMode;
  if (changedToExplicitMode && previousThemeId) {
    resolvedUiThemeId = resolvePairedUiThemeIdForMode(previousThemeId, nextMode);
  }
  syncUiThemeSelectAvailability(nextMode);
  state.selectedUiThemeId = resolvedUiThemeId;
  if (isDarkUiTheme(resolvedUiThemeId)) {
    state.lastDarkUiThemeId = sanitizeDarkUiThemeId(resolvedUiThemeId);
    if (save) saveLastDarkUiThemeId(state.lastDarkUiThemeId);
  } else {
    state.lastLightUiThemeId = sanitizeLightUiThemeId(resolvedUiThemeId);
    if (save) saveLastLightUiThemeId(state.lastLightUiThemeId);
  }

  applyUiTheme(resolvedUiThemeId);
  if (uiThemeSelect) uiThemeSelect.value = resolvedUiThemeId;
  syncUiThemeMenuOptions();
  if (save) {
    saveUiThemeId(resolvedUiThemeId);
    saveAppearanceMode(nextMode);
  }
  if (showStatus) {
    setStatus(`Appearance mode: ${getAppearanceModeLabel(nextMode)}. Theme: ${getUiThemeLabel(resolvedUiThemeId)}.`);
  }
  syncAppearanceModeMenu(nextMode);
}

function syncAppearanceModeMenu(mode) {
  if (!appearanceModeTrigger || !appearanceModeDropdown) return;
  const nextMode = APPEARANCE_MODE_IDS.has(mode) ? mode : DEFAULT_APPEARANCE_MODE;
  const nextLabel = getAppearanceModeLabel(nextMode);
  appearanceModeTrigger.innerHTML = APPEARANCE_MODE_ICON_SVG[nextMode] || APPEARANCE_MODE_ICON_SVG.system;
  appearanceModeTrigger.dataset.appearanceMode = nextMode;
  const triggerSvg = appearanceModeTrigger.querySelector("svg");
  if (triggerSvg) {
    const triggerIconSize = nextMode === "dark" ? 20 : 38;
    triggerSvg.setAttribute("width", String(triggerIconSize));
    triggerSvg.setAttribute("height", String(triggerIconSize));
    triggerSvg.style.width = `${triggerIconSize}px`;
    triggerSvg.style.height = `${triggerIconSize}px`;
  }
  appearanceModeTrigger.setAttribute("aria-label", `${nextLabel} Mode`);
  appearanceModeTrigger.setAttribute("title", `${nextLabel} Mode`);

  const remainingModes = ["light", "system", "dark"].filter((modeId) => modeId !== nextMode);
  appearanceModeDropdown.innerHTML = remainingModes
    .map((modeId) => {
      const label = getAppearanceModeMenuItemLabel(modeId);
      const icon = APPEARANCE_MODE_ICON_SVG[modeId] || "";
      return `<button class="appearance-mode-option" type="button" data-appearance-mode="${modeId}" role="menuitem" aria-label="${label}">${icon}<span>${label}</span></button>`;
    })
    .join("");
}

function setAppearanceModeMenuOpen(open) {
  if (!appearanceModeDropdown || !appearanceModeTrigger) return;
  const shouldOpen = Boolean(open);
  appearanceModeDropdown.hidden = !shouldOpen;
  appearanceModeMenu?.classList.toggle("is-open", shouldOpen);
  appearanceModeTrigger.setAttribute("aria-expanded", String(shouldOpen));
  if (!shouldOpen) {
    appearanceModeTrigger.blur();
  }
}

function setQuickActionsMenuOpen(open) {
  if (!quickActionsDropdown || !quickActionsTrigger) return;
  const shouldOpen = Boolean(open);
  quickActionsDropdown.hidden = !shouldOpen;
  quickActionsMenu?.classList.toggle("is-open", shouldOpen);
  quickActionsTrigger.setAttribute("aria-expanded", String(shouldOpen));
  if (!shouldOpen) {
    quickActionsTrigger.blur();
  }
}

function syncUiThemeMenuOptions() {
  if (!uiThemeDropdown || !uiThemeTrigger || !uiThemeSelect) return;
  const stripModeSuffix = (label) => label.replace(/\s*-\s*(Light|Dark)\s*$/i, "").trim();
  const options = Array.from(uiThemeSelect.options);
  uiThemeDropdown.innerHTML = options
    .map((option) => {
      const value = option.value;
      const label = stripModeSuffix(option.textContent || value);
      const selectedClass = value === state.selectedUiThemeId ? " is-selected" : "";
      return `<button class="ui-theme-option${selectedClass}" type="button" data-ui-theme="${value}" role="menuitemradio" aria-checked="${value === state.selectedUiThemeId ? "true" : "false"}">${label}</button>`;
    })
    .join("");
  const selectedLabel = stripModeSuffix(getUiThemeLabel(state.selectedUiThemeId));
  uiThemeTrigger.textContent = selectedLabel;
  uiThemeTrigger.setAttribute("title", selectedLabel);
  uiThemeTrigger.setAttribute("aria-label", `Theme: ${selectedLabel}`);
}

function setUiThemeMenuOpen(open) {
  if (!uiThemeDropdown || !uiThemeTrigger) return;
  const shouldOpen = Boolean(open);
  uiThemeDropdown.hidden = !shouldOpen;
  uiThemeMenu?.classList.toggle("is-open", shouldOpen);
  uiThemeTrigger.setAttribute("aria-expanded", String(shouldOpen));
  if (!shouldOpen) {
    uiThemeTrigger.blur();
  }
}

function applyUiTheme(uiThemeId) {
  document.body.classList.toggle("ui-theme-molten", uiThemeId === "molten");
  document.body.classList.toggle("ui-theme-overgrown", uiThemeId === "overgrown");
  document.body.classList.toggle("ui-theme-submerged", uiThemeId === "submerged");
  document.body.classList.toggle("ui-theme-deep-freeze", uiThemeId === "deep_freeze");
  document.body.classList.toggle("ui-theme-nightmare", uiThemeId === "nightmare");
  document.body.classList.toggle("ui-theme-dreamscape", uiThemeId === "dreamscape");
  document.body.classList.toggle("ui-theme-molten-dark", uiThemeId === "molten_dark");
  document.body.classList.toggle("ui-theme-overgrown-dark", uiThemeId === "overgrown_dark");
  document.body.classList.toggle("ui-theme-submerged-dark", uiThemeId === "submerged_dark");
  document.body.classList.toggle("ui-theme-deep-freeze-dark", uiThemeId === "deep_freeze_dark");
  document.body.classList.toggle("ui-theme-dreamscape-dark", uiThemeId === "dreamscape_dark");
  document.body.classList.toggle("ui-theme-nightmare-dark", uiThemeId === "nightmare_dark");
  scheduleBoardHexGridRender();
}

function getUiThemeLabel(uiThemeId) {
  if (uiThemeId === "molten") return "Molten - Light";
  if (uiThemeId === "overgrown") return "Overgrown - Light";
  if (uiThemeId === "deep_freeze") return "Deep Freeze - Light";
  if (uiThemeId === "dreamscape") return "Dreamscape - Light";
  if (uiThemeId === "nightmare") return "Nightmare - Light";
  if (uiThemeId === "submerged") return "Submerged - Light";
  if (uiThemeId === "molten_dark") return "Molten - Dark";
  if (uiThemeId === "overgrown_dark") return "Overgrown - Dark";
  if (uiThemeId === "submerged_dark") return "Submerged - Dark";
  if (uiThemeId === "deep_freeze_dark") return "Deep Freeze - Dark";
  if (uiThemeId === "dreamscape_dark") return "Dreamscape - Dark";
  if (uiThemeId === "nightmare_dark") return "Nightmare - Dark";
  return "Molten - Light";
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
  applyBoardZoom(DEFAULT_BOARD_ZOOM);
  const dx = -state.boardPanX;
  const dy = -state.boardPanY;
  translateBoardContent(dx, dy);
  centerBoardViewOnEntranceX();
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
  if (state.entranceFadeAnchor) {
    state.entranceFadeAnchor = {
      x: state.entranceFadeAnchor.x + dx,
      y: state.entranceFadeAnchor.y + dy,
    };
  }

  scheduleBoardHexGridRender();
}

function resetBoardPan() {
  state.boardPanX = 0;
  state.boardPanY = 0;
  scheduleBoardHexGridRender();
}

function updateBoardZoomIndicator() {
  let badge = workspace.querySelector(".board-zoom-indicator");
  if (!badge) {
    badge = document.createElement("button");
    badge.type = "button";
    badge.className = "board-zoom-indicator";
    badge.addEventListener("click", () => {
      resetBoardView();
    });
    workspace.appendChild(badge);
  }
  const percent = Math.round(getBoardZoom() * 100);
  badge.textContent = `Zoom ${percent}%`;
  badge.setAttribute("aria-label", `Reset zoom (${percent} percent)`);
  // Force a paint flush so rapid zoom updates don't leave stale/missing glyphs.
  void badge.offsetWidth;
}

function setWallEditMode(enabled) {
  clearPendingReserveSwap();
  state.wallEditMode = enabled;
  document.body.classList.toggle("wall-edit-mode", enabled);
  if (toggleWallEditBtn) {
    toggleWallEditBtn.textContent = enabled ? "Build View" : "Wall Editor";
  }
  if (enabled) {
    state.buildViewSnapshot = captureBuildViewLayout();
    startWallEditSession();
    setStatus("Wall edit mode: click a face segment to toggle wall ON/OFF. Changes are saved per tile set + tile.");
  } else {
    syncSelectedTileSetWallsFromOverrides();
    const restored = restoreBuildViewLayout(state.buildViewSnapshot);
    state.buildViewSnapshot = null;
    if (restored) {
      setStatus("Wall edit mode off. Restored previous layout.");
    } else {
      startRound();
      setStatus("Wall edit mode off. Round reset.");
    }
  }
  updateModeIndicators();
}

function startWallEditSession() {
  clearBoard();
  state.wallEditorTileRefs = new Map();
  state.wallEditorActiveTileSetId = null;
  state.wallEditorActiveTileId = null;
  renderWallEditorPage().catch((error) => {
    console.error(error);
    setStatus("Failed to build wall editor page. Check tile assets.", true);
  });
  updatePlacedProgress();
}

function captureBuildViewLayout() {
  const tiles = [];
  for (const tile of state.tiles.values()) {
    tiles.push({
      tileId: tile.tileId,
      key: tile.key,
      active: Boolean(tile.active),
      placed: Boolean(tile.placed),
      x: Number(tile.x) || 0,
      y: Number(tile.y) || 0,
      rotation: Number(tile.rotation) || 0,
    });
  }
  return {
    tileSetId: state.selectedTileSetId,
    boardPanX: Number(state.boardPanX) || 0,
    boardPanY: Number(state.boardPanY) || 0,
    boardZoom: Number(state.boardZoom) || 1,
    reserveOrder: Array.isArray(state.reserveOrder) ? [...state.reserveOrder] : [],
    tiles,
  };
}

function restoreBuildViewLayout(snapshot) {
  if (!snapshot || snapshot.tileSetId !== state.selectedTileSetId) return false;

  const byId = new Map((snapshot.tiles || []).map((t) => [t.tileId || t.id, t]));
  if (!byId.size) return false;

  for (const tile of state.tiles.values()) {
    const saved = byId.get(tile.tileId);
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
  const start = state.tiles.get(ENTRANCE_TILE_ID);
  if (start?.placed) {
    setEntranceFadeAnchorFromTile(start);
    placeReferenceAboveStart(start);
  }

  selectTile(null);
  return true;
}

function exportDungeonLayout() {
  if (state.wallEditMode) {
    setStatus("Save Dungeon is available on Build View only.", true);
    return;
  }
  try {
    const snapshot = captureBuildViewLayout();
    const payload = {
      schema: "hts-dungeon-layout-v2",
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
    setStatus("Load Dungeon is available on Build View only.", true);
    return;
  }
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const layout = migrateLegacyLayout(parsed?.layout ?? parsed);
    if (!layout || typeof layout !== "object") {
      setStatus("Invalid dungeon file.", true);
      return;
    }

    const targetTileSetId = layout.tileSetId || state.selectedTileSetId;
    if (targetTileSetId !== state.selectedTileSetId) {
      await applyTileSet(targetTileSetId, false);
      if (tileSetSelect) tileSetSelect.value = state.selectedTileSetId;
    }
    const ok = restoreBuildViewLayout(layout);
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

  const candidateTiles = state.tileDefs.filter((t) => !t.required).map((t) => t.tileId);
  const selectedIds = shuffle(candidateTiles).slice(0, 6);

  for (const tile of state.tiles.values()) {
    if (state.compactSidePanelMode) {
      tile.active = true;
    } else {
      tile.active = isEntranceTile(tile) || selectedIds.includes(tile.tileId);
    }
    tile.placed = false;
    tile.rotation = 0;
  }
  resetReserveOrderForCurrentInactive();

  renderActiveTiles();
  renderBossPile();
  placeStartTileAtCenter();
  updatePlacedProgress();
}

function rerollTrayTiles() {
  if (state.wallEditMode) {
    startWallEditSession();
    return;
  }

  const placedRegularIds = new Set(
    Array.from(state.tiles.values())
      .filter((tile) => !tile.required && tile.active && tile.placed)
      .map((tile) => tile.tileId),
  );
  const trayTargetCount = Math.max(0, 6 - placedRegularIds.size);
  const candidateIds = state.tileDefs
    .filter((def) => !def.required)
    .map((def) => def.tileId)
    .filter((id) => !placedRegularIds.has(id));
  const selectedTrayIds = new Set(shuffle(candidateIds).slice(0, trayTargetCount));

  for (const tile of state.tiles.values()) {
    if (tile.required) continue;
    if (placedRegularIds.has(tile.tileId)) {
      tile.active = true;
      tile.placed = true;
      continue;
    }
    if (selectedTrayIds.has(tile.tileId)) {
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

function autoBuildSelectedTiles() {
  if (state.wallEditMode) {
    setStatus("Auto build is unavailable in wall edit mode.", true);
    return;
  }

  const allRegularTiles = Array.from(state.tiles.values()).filter((tile) => !isEntranceTile(tile));
  if (allRegularTiles.length < 6) {
    setStatus("Not enough tiles available for auto build.", true);
    return;
  }

  const selectedAutoBuildIds = new Set(
    shuffle(allRegularTiles.map((tile) => tile.tileId)).slice(0, 6),
  );
  for (const tile of allRegularTiles) {
    clearInvalidReturnTimer(tile);
    tile.active = selectedAutoBuildIds.has(tile.tileId);
    tile.placed = false;
    tile.rotation = 0;
  }
  resetReserveOrderForCurrentInactive();
  clearBoard();
  renderActiveTiles();
  placeStartTileAtCenter();
  updatePlacedProgress();

  const entrance = state.tiles.get(ENTRANCE_TILE_ID);
  if (!entrance) {
    setStatus("Entrance tile is unavailable.", true);
    return;
  }
  if (!entrance.placed) {
    placeStartTileAtCenter();
  }

  const activeRegularTiles = Array.from(state.tiles.values()).filter(
    (tile) => !isEntranceTile(tile) && tile.active,
  );
  if (!activeRegularTiles.length) {
    setStatus("No selected tiles available for auto build.", true);
    return;
  }

  const originalTileState = new Map(
    activeRegularTiles.map((tile) => [
      tile.tileId,
      {
        x: tile.x,
        y: tile.y,
        rotation: tile.rotation,
        placed: tile.placed,
      },
    ]),
  );
  const autoBuildHistoryKey = getAutoBuildHistoryKey(activeRegularTiles);
  const recentShapeHistory = getAutoBuildHistoryForKey(autoBuildHistoryKey);

  const restoreOriginalState = () => {
    for (const tile of activeRegularTiles) {
      const snapshot = originalTileState.get(tile.tileId);
      if (!snapshot) continue;
      tile.rotation = snapshot.rotation;
      tile.placed = snapshot.placed;
      positionTile(tile, snapshot.x, snapshot.y);
      updateTileParent(tile, snapshot.placed ? board : tile.traySlot);
      updateTileTransform(tile);
      setPlacementFeedback(tile, null);
    }
    selectTile(null);
    updatePlacedProgress();
  };

  const sideDirCache = new Map();
  const placementEvalCache = new Map();

  const getWallFaceSignature = (tile) => {
    if (!tile?.wallFaceSet || !tile.wallFaceSet.size) return "";
    return [...tile.wallFaceSet].sort((a, b) => a - b).join(",");
  };

  const getSideDirectionsCached = (tile) => {
    const key = `${tile.tileId}|${tile.rotation}|${getWallFaceSignature(tile)}`;
    const cached = sideDirCache.get(key);
    if (cached) return cached;
    const dirs = getSideDirections(tile);
    sideDirCache.set(key, dirs);
    return dirs;
  };

  const roundForCache = (value) => Math.round(value * 10) / 10;
  const buildPlacedSignature = (tiles) => tiles
    .map((t) => `${t.tileId}@${t.rotation}:${roundForCache(t.x)},${roundForCache(t.y)}`)
    .sort()
    .join("|");

  const evaluatePlacementAtCached = (
    tile,
    placedTiles,
    x,
    y,
    options,
    placedSignature,
  ) => {
    const enforceEnd = options?.enforceEndTileRule ? 1 : 0;
    const key = `${placedSignature}|${tile.tileId}|${tile.rotation}|${roundForCache(x)},${roundForCache(y)}|e:${enforceEnd}`;
    const cached = placementEvalCache.get(key);
    if (cached) return cached;
    const result = evaluatePlacementAt(tile, placedTiles, x, y, options);
    placementEvalCache.set(key, result);
    return result;
  };

  const getRotationOptions = () => shuffle(
    Array.from({ length: 360 / ROTATION_STEP }, (_, idx) => idx * ROTATION_STEP),
  );

  const getPlacementCandidates = (tile, placedTiles, placedSignature) => {
    const candidates = [];
    const seen = new Set();
    const anchors = shuffle([...placedTiles]);
    const registerCandidate = (x, y) => {
      if (candidates.length >= AUTO_BUILD_CANDIDATE_HARD_LIMIT) return;
      const snapped = snapTileCenterToHex(tile, x, y);
      const candidateX = clamp(snapped.x, 0, board.clientWidth);
      const candidateY = clamp(snapped.y, 0, board.clientHeight);
      const key = `${candidateX.toFixed(2)}:${candidateY.toFixed(2)}`;
      if (seen.has(key)) return;
      seen.add(key);
      const placement = evaluatePlacementAtCached(
        tile,
        placedTiles,
        candidateX,
        candidateY,
        { enforceEndTileRule: true },
        placedSignature,
      );
      if (!placement.valid || placement.overlaps) return;
      candidates.push({
        x: candidateX,
        y: candidateY,
        count: placement.count,
      });
    };

    // Primary pass: derive candidate targets from face pairing, then let computeBestSnap
    // search nearby valid placements using existing app snap/contact logic.
    const tileDirs = getSideDirectionsCached(tile);
    const tileDirOrder = shuffle(Array.from({ length: tileDirs.length }, (_, idx) => idx));
    primaryCandidateLoop:
    for (const anchorTile of anchors) {
      const anchorDirs = getSideDirectionsCached(anchorTile);
      const anchorDirOrder = shuffle(Array.from({ length: anchorDirs.length }, (_, idx) => idx));
      for (const tileDirIdx of tileDirOrder) {
        if (candidates.length >= AUTO_BUILD_CANDIDATE_HARD_LIMIT) break primaryCandidateLoop;
        const aDir = tileDirs[tileDirIdx];
        for (const anchorDirIdx of anchorDirOrder) {
          if (candidates.length >= AUTO_BUILD_CANDIDATE_HARD_LIMIT) break primaryCandidateLoop;
          const bDir = anchorDirs[anchorDirIdx];
          const dot = aDir.nx * bDir.nx + aDir.ny * bDir.ny;
          if (dot > OPPOSITE_NORMAL_THRESHOLD) continue;
          const rawX = anchorTile.x + bDir.nx * bDir.offset - aDir.nx * aDir.offset;
          const rawY = anchorTile.y + bDir.ny * bDir.offset - aDir.ny * aDir.offset;
          const snapped = computeBestSnap(
            tile,
            placedTiles,
            rawX,
            rawY,
            Math.max(SNAP_SEARCH_RADIUS * 8, 224),
            true,
            {
              enforceEndTileRule: true,
              evalFn: (cx, cy) => evaluatePlacementAtCached(
                tile,
                placedTiles,
                cx,
                cy,
                { enforceEndTileRule: true },
                placedSignature,
              ),
            },
          );
          if (snapped) registerCandidate(snapped.x, snapped.y);
          registerCandidate(rawX, rawY);
        }
      }
    }

    // Fallback pass: sample nearby hex rings around already placed tiles.
    const layout = getBoardHexLayout();
    if (candidates.length < AUTO_BUILD_CANDIDATE_SOFT_LIMIT) {
      const ringDirs = [
        { x: layout.dx, y: layout.dy / 2 },
        { x: layout.dx, y: -layout.dy / 2 },
        { x: 0, y: -layout.dy },
        { x: -layout.dx, y: -layout.dy / 2 },
        { x: -layout.dx, y: layout.dy / 2 },
        { x: 0, y: layout.dy },
      ];
      const maxRingDepth = 7;
      ringCandidateLoop:
      for (const anchorTile of anchors) {
        for (let depth = 1; depth <= maxRingDepth; depth += 1) {
          if (candidates.length >= AUTO_BUILD_CANDIDATE_SOFT_LIMIT) break ringCandidateLoop;
          for (let dirIdx = 0; dirIdx < ringDirs.length; dirIdx += 1) {
            const dir = ringDirs[dirIdx];
            const next = ringDirs[(dirIdx + 1) % ringDirs.length];
            registerCandidate(anchorTile.x + dir.x * depth, anchorTile.y + dir.y * depth);
            for (let t = 1; t < depth; t += 1) {
              registerCandidate(
                anchorTile.x + dir.x * (depth - t) + next.x * t,
                anchorTile.y + dir.y * (depth - t) + next.y * t,
              );
            }
          }
        }
      }
    }

    // Last-resort fallback: broad randomized probing near board center.
    if (!candidates.length) {
      const cx = board.clientWidth / 2;
      const cy = board.clientHeight / 2;
      for (let i = 0; i < 120; i += 1) {
        const rx = cx + (Math.random() - 0.5) * board.clientWidth * 0.95;
        const ry = cy + (Math.random() - 0.5) * board.clientHeight * 0.95;
        registerCandidate(rx, ry);
      }
    }

    const randomized = shuffle(candidates).slice(0, AUTO_BUILD_CANDIDATE_SOFT_LIMIT);
    if (!randomized.length) return randomized;

    let centroidX = 0;
    let centroidY = 0;
    let minPlacedX = Number.POSITIVE_INFINITY;
    let maxPlacedX = Number.NEGATIVE_INFINITY;
    let minPlacedY = Number.POSITIVE_INFINITY;
    let maxPlacedY = Number.NEGATIVE_INFINITY;
    for (const placed of placedTiles) {
      centroidX += placed.x;
      centroidY += placed.y;
      if (placed.x < minPlacedX) minPlacedX = placed.x;
      if (placed.x > maxPlacedX) maxPlacedX = placed.x;
      if (placed.y < minPlacedY) minPlacedY = placed.y;
      if (placed.y > maxPlacedY) maxPlacedY = placed.y;
    }
    centroidX /= placedTiles.length;
    centroidY /= placedTiles.length;

    let avgPlacedRadius = 0;
    for (const placed of placedTiles) {
      avgPlacedRadius += Math.hypot(placed.x - centroidX, placed.y - centroidY);
    }
    avgPlacedRadius = placedTiles.length ? (avgPlacedRadius / placedTiles.length) : 0;
    const targetRadius = Math.max(layout.dx * 1.35, avgPlacedRadius + layout.dx * 0.7);
    const targetMinRadius = Math.max(layout.dx * 0.95, targetRadius * 0.6);
    const targetMaxRadius = targetRadius * 1.5;

    const getRecentHeading = () => {
      if (placedTiles.length < 3) return null;
      const prev = placedTiles[placedTiles.length - 1];
      const prevPrev = placedTiles[placedTiles.length - 2];
      if (!prev || !prevPrev) return null;
      const vx = prev.x - prevPrev.x;
      const vy = prev.y - prevPrev.y;
      const len = Math.hypot(vx, vy);
      if (len < 1e-6) return null;
      return { x: vx / len, y: vy / len };
    };
    const recentHeading = getRecentHeading();
    const localDensityRadius = layout.dx * 1.6;

    for (const candidate of randomized) {
      const clearance = getCandidateClearanceMetrics(tile, placedTiles, candidate.x, candidate.y);
      const distFromClusterCenter = Math.hypot(candidate.x - centroidX, candidate.y - centroidY);
      const nextMinX = Math.min(minPlacedX, candidate.x);
      const nextMaxX = Math.max(maxPlacedX, candidate.x);
      const nextMinY = Math.min(minPlacedY, candidate.y);
      const nextMaxY = Math.max(maxPlacedY, candidate.y);
      const width = Math.max(1, nextMaxX - nextMinX);
      const height = Math.max(1, nextMaxY - nextMinY);
      const roundness = Math.min(width, height) / Math.max(width, height);
      const radialPenalty = Math.abs(distFromClusterCenter - targetRadius);
      const nearCenterPenalty = Math.max(0, targetMinRadius - distFromClusterCenter);
      const farOutPenalty = Math.max(0, distFromClusterCenter - targetMaxRadius);
      let lineExtensionPenalty = 0;
      if (recentHeading && placedTiles.length >= 2) {
        const lastPlaced = placedTiles[placedTiles.length - 1];
        const dx = candidate.x - lastPlaced.x;
        const dy = candidate.y - lastPlaced.y;
        const dLen = Math.hypot(dx, dy);
        if (dLen > 1e-6) {
          const dirX = dx / dLen;
          const dirY = dy / dLen;
          const dot = dirX * recentHeading.x + dirY * recentHeading.y;
          if (dot > 0.86) {
            lineExtensionPenalty = (dot - 0.86) / (1 - 0.86) * AUTO_BUILD_LINE_EXTENSION_PENALTY;
          }
        }
      }
      let localNeighborCount = 0;
      for (const placed of placedTiles) {
        const d = Math.hypot(candidate.x - placed.x, candidate.y - placed.y);
        if (d <= localDensityRadius) localNeighborCount += 1;
      }
      const localDensityPenalty = Math.max(0, localNeighborCount - 2) * AUTO_BUILD_LOCAL_DENSITY_PENALTY;

      candidate.layoutScore =
        roundness * 150
        + candidate.count * 22
        + clearance.minFaceDist * 0.55
        + clearance.minCenterDist * 0.5
        + clearance.avgCenterDist * 0.22
        - radialPenalty * 0.35
        - nearCenterPenalty * 1.15
        - farOutPenalty * 0.7
        - lineExtensionPenalty
        - localDensityPenalty;
    }

    randomized.sort(
      (a, b) => (b.layoutScore - a.layoutScore) || (b.count - a.count),
    );
    return randomized;
  };

  const tryBuildLayout = () => {
    for (const tile of activeRegularTiles) {
      clearInvalidReturnTimer(tile);
      tile.placed = false;
    }

    const tileOrder = shuffle([...activeRegularTiles]);
    const placedTiles = [entrance];

    const placeAtIndex = (index) => {
      if (index >= tileOrder.length) return true;
      const tile = tileOrder[index];
      const prevX = tile.x;
      const prevY = tile.y;
      const prevRotation = tile.rotation;
      const prevPlaced = tile.placed;
      const placedSignature = buildPlacedSignature(placedTiles);

      for (const rotation of getRotationOptions()) {
        tile.rotation = normalizeAngle(rotation);
        const candidates = getPlacementCandidates(tile, placedTiles, placedSignature);
        if (!candidates.length) continue;

        const bestScore = candidates[0].layoutScore;
        const scoreFloor = bestScore - AUTO_BUILD_TOP_BUCKET_SCORE_DELTA;
        const topBucket = [];
        const remainder = [];
        for (let i = 0; i < candidates.length; i += 1) {
          const candidate = candidates[i];
          if (i < AUTO_BUILD_TOP_BUCKET_SIZE || candidate.layoutScore >= scoreFloor) {
            topBucket.push(candidate);
          } else {
            remainder.push(candidate);
          }
        }
        const orderedCandidates = [...shuffle(topBucket), ...remainder];

        for (const candidate of orderedCandidates) {
          positionTile(tile, candidate.x, candidate.y);
          tile.placed = true;
          placedTiles.push(tile);
          if (placeAtIndex(index + 1)) return true;
          placedTiles.pop();
          tile.placed = false;
        }
      }

      tile.rotation = prevRotation;
      tile.placed = prevPlaced;
      positionTile(tile, prevX, prevY);
      return false;
    };

    return placeAtIndex(0);
  };

  let built = false;
  let chosenSignature = "";
  let noveltyRetryCount = 0;
  for (let attempt = 0; attempt < AUTO_BUILD_MAX_ATTEMPTS; attempt += 1) {
    if (tryBuildLayout()) {
      const signature = getAutoBuildLayoutSignature(activeRegularTiles, entrance);
      const isRecentShape = recentShapeHistory.includes(signature);
      if (
        isRecentShape
        && noveltyRetryCount < AUTO_BUILD_NOVELTY_RETRY_LIMIT
        && attempt < AUTO_BUILD_MAX_ATTEMPTS - 1
      ) {
        noveltyRetryCount += 1;
        continue;
      }
      built = true;
      chosenSignature = signature;
      break;
    }
  }

  if (!built) {
    restoreOriginalState();
    setStatus("Auto build could not find a valid full layout. Try rerolling tiles and run again.", true);
    return;
  }

  for (const tile of activeRegularTiles) {
    clearInvalidReturnTimer(tile);
    updateTileParent(tile, board);
    updateTileTransform(tile);
    setPlacementFeedback(tile, null);
  }
  const movedReferenceSide = ensureReferenceCardVisibleAfterAutoBuild(activeRegularTiles, entrance);

  selectTile(null);
  updatePlacedProgress();
  if (chosenSignature) {
    pushAutoBuildHistory(autoBuildHistoryKey, chosenSignature);
  }
  if (noveltyRetryCount > 0) {
    setStatus(`Auto build complete: selected tiles placed with valid contact rules (${noveltyRetryCount} extra attempts for shape variety)${movedReferenceSide ? ". Reference card moved to side for visibility." : ""}.`);
  } else {
    setStatus(`Auto build complete: selected tiles placed with valid contact rules${movedReferenceSide ? ". Reference card moved to side for visibility." : ""}.`);
  }
  spawnRandomBossAtReferenceTopMagnet({
    showStatus: false,
    silentNoReference: true,
    silentNoBoss: true,
  });
}

function resetTiles() {
  if (state.wallEditMode) {
    startWallEditSession();
    setStatus("Wall edit mode refreshed.");
    return;
  }

  const entrance = state.tiles.get(ENTRANCE_TILE_ID);
  if (entrance) {
    entrance.rotation = 0;
    entrance.placed = false;
  }
  applyBoardZoom(DEFAULT_BOARD_ZOOM);
  resetBoardPan();
  clearBoard();
  renderActiveTiles();
  renderBossPile();
  placeStartTileAtCenter();
  setStatus("Tiles reset to tray.");
  updatePlacedProgress();
}

function resetTilesAndBossCards() {
  const tileSetId = state.selectedTileSetId;
  resetTiles();
  state.bossPileOrderByTileSet[tileSetId] = getBossTileSources(tileSetId);
  renderBossPile();
  setStatus("Tiles and boss cards reset.");
}

function clearBoard() {
  for (const tile of state.tiles.values()) {
    clearInvalidReturnTimer(tile);
  }
  board.querySelector(".board-content")?.remove();
  state.referenceMarker = null;
  state.bossTokens = [];
  state.entranceFadeAnchor = null;
  updateBoardZoomIndicator();
  getBoardContentLayer();
  mountBoardHexGrid();
  tray.innerHTML = "";
  reservePile.innerHTML = "";
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

  const entranceTileForScale = state.tiles.get(ENTRANCE_TILE_ID);
  if (
    entranceTileForScale?.placed
    && entranceTileForScale.dom
    && isOnBoardLayer(entranceTileForScale.dom.parentElement)
  ) {
    updateTileTransform(entranceTileForScale);
  }
  if (state.referenceMarker?.dom) {
    state.referenceMarker.dom.style.transform = `translate(-50%, -50%) scale(${BOARD_ITEM_SCALE})`;
  }

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
  svg.style.transformOrigin = "0 0";
  svg.style.transform = "none";
  svg.setAttribute("viewBox", `0 0 ${drawW} ${drawH}`);
  svg.replaceChildren();

  const cssVars = getComputedStyle(document.body);
  const isDarkTheme = isDarkUiTheme(state.selectedUiThemeId);
  const parseRgbTripletVar = (name, fallback) => {
    const raw = cssVars.getPropertyValue(name).trim();
    if (!raw) return fallback;
    const parts = raw.split(",").map((part) => Number.parseInt(part.trim(), 10));
    if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return fallback;
    return { r: parts[0], g: parts[1], b: parts[2] };
  };
  const parseNumberVar = (name, fallback) => {
    const raw = cssVars.getPropertyValue(name).trim();
    if (!raw) return fallback;
    const value = Number.parseFloat(raw);
    return Number.isFinite(value) ? value : fallback;
  };
  const strokeColor = cssVars.getPropertyValue("--hex-stroke").trim() || "rgba(216, 198, 180, 0.45)";
  const borderRgb = parseRgbTripletVar("--hex-border-rgb", { r: 196, g: 206, b: 213 });
  const fadeAnchor = state.entranceFadeAnchor;
  const hasEntranceAnchor = Boolean(
    fadeAnchor
      && Number.isFinite(fadeAnchor.x)
      && Number.isFinite(fadeAnchor.y),
  );
  const entranceTile = state.tiles.get(ENTRANCE_TILE_ID);
  const entranceRotationRad = hasEntranceAnchor && entranceTile
    ? (normalizeAngle(entranceTile.rotation || 0) * Math.PI) / 180
    : 0;
  // Default opening direction points down the board; rotate it with entrance rotation.
  const openingDirX = -Math.sin(entranceRotationRad);
  const openingDirY = Math.cos(entranceRotationRad);
  const fadeAnchorScreenX = hasEntranceAnchor ? fadeAnchor.x * zoom : w / 2;
  const fadeAnchorScreenY = hasEntranceAnchor ? fadeAnchor.y * zoom : h / 2;
  const maxDistScreen = Math.max(
    Math.hypot(fadeAnchorScreenX, fadeAnchorScreenY),
    Math.hypot(w - fadeAnchorScreenX, fadeAnchorScreenY),
    Math.hypot(fadeAnchorScreenX, h - fadeAnchorScreenY),
    Math.hypot(w - fadeAnchorScreenX, h - fadeAnchorScreenY),
    1,
  );
  const darkestTargetHexes = isDarkTheme
    ? parseNumberVar("--hex-dark-target-hexes", 9)
    : 4;
  const darkestTargetDist = Math.max(layout.dx * darkestTargetHexes, layout.radius * darkestTargetHexes);
  const lightRgb = parseRgbTripletVar("--hex-center-rgb", { r: 255, g: 248, b: 240 });
  const darkEndpoint = isDarkTheme
    ? {
        r: Math.round(lightRgb.r * 0.62),
        g: Math.round(lightRgb.g * 0.62),
        b: Math.round(lightRgb.b * 0.62),
      }
    : {
        // Light-mode only: soften the edge tone by blending border color toward center color.
        r: Math.round(borderRgb.r + (lightRgb.r - borderRgb.r) * 0.4),
        g: Math.round(borderRgb.g + (lightRgb.g - borderRgb.g) * 0.4),
        b: Math.round(borderRgb.b + (lightRgb.b - borderRgb.b) * 0.4),
      };

  const group = document.createElementNS(BOARD_HEX_SVG_NS, "g");
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
      const screenX = x * zoom;
      const screenY = y * zoom;
      const vx = screenX - fadeAnchorScreenX;
      const vy = screenY - fadeAnchorScreenY;
      const distScreen = Math.hypot(vx, vy);
      // Cave-opening light direction: default "front" points downward from entrance.
      const dirDotOpening = distScreen > 1e-6
        ? clamp((vx * openingDirX + vy * openingDirY) / distScreen, -1, 1)
        : 1;
      const frontness = Math.max(0, dirDotOpening);
      const backness = Math.max(0, -dirDotOpening);
      const directionalRangeAdjust =
        layout.dx * zoom * (HEX_FRONT_LIGHT_BONUS_HEXES * frontness - HEX_BACK_LIGHT_REDUCTION_HEXES * backness);
      const localTargetDist = isDarkTheme
        ? Math.max(1, darkestTargetDist * zoom + directionalRangeAdjust)
        : Math.max(1, maxDistScreen + directionalRangeAdjust);
      const t = isDarkTheme
        ? clamp(distScreen / localTargetDist, 0, 1)
        : clamp(distScreen / localTargetDist, 0, 1);
      // Keep full-hex "pixel" coloring while darkening cells toward edges.
      const mixExponent = isDarkTheme ? 0.8 : 1.25;
      const directionalDarkBias = backness * HEX_BACK_DARKEN_BIAS;
      const mix = clamp(Math.pow(t, mixExponent) + directionalDarkBias, 0, 1);
      const r = Math.round(lightRgb.r + (darkEndpoint.r - lightRgb.r) * mix);
      const g = Math.round(lightRgb.g + (darkEndpoint.g - lightRgb.g) * mix);
      const b = Math.round(lightRgb.b + (darkEndpoint.b - lightRgb.b) * mix);
      const a = 1;
      const path = document.createElementNS(BOARD_HEX_SVG_NS, "path");
      path.setAttribute("d", hexPath(x, y, layout.radius));
      path.setAttribute("fill", `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`);
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
  radius = Math.max(12, Math.min(radius, 34, maxRadiusByWidth, maxRadiusByHeight)) * BOARD_SCALE * BOARD_ITEM_SCALE;
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
  return {
    x: quantizeSnapCoord(best.x),
    y: quantizeSnapCoord(best.y),
  };
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

function createTraySlotGuideElement() {
  const size = 150;
  const center = size / 2;
  const radius = 28;
  const halfH = (Math.sqrt(3) * radius) / 2;
  const dy = Math.sqrt(3) * radius;
  const centers = [
    [center, center],
    [center + 1.5 * radius, center + halfH],
    [center + 1.5 * radius, center - halfH],
    [center, center + dy],
    [center, center - dy],
    [center - 1.5 * radius, center + halfH],
    [center - 1.5 * radius, center - halfH],
  ];

  const svg = document.createElementNS(BOARD_HEX_SVG_NS, "svg");
  svg.classList.add("tray-slot-guide");
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  svg.setAttribute("aria-hidden", "true");
  for (const [cx, cy] of centers) {
    const path = document.createElementNS(BOARD_HEX_SVG_NS, "path");
    path.setAttribute("d", hexPath(cx, cy, radius));
    svg.appendChild(path);
  }
  return svg;
}

function createTraySlotElement() {
  const slot = document.createElement("div");
  slot.className = "tray-slot";
  slot.appendChild(createTraySlotGuideElement());
  return slot;
}

function getRegularTileOrder(tileSetId = state.selectedTileSetId) {
  return state.tileDefs
    .filter((def) => !def.required && def.tileSetId === tileSetId)
    .map((def) => def.tileId);
}

function getCompactTrayOrder(tileSetId = state.selectedTileSetId) {
  return getRegularTileOrder(tileSetId);
}

function getLiveTraySlotForTile(tile) {
  if (tile?.traySlot && tile.traySlot.isConnected && tile.traySlot.parentElement === tray) {
    return tile.traySlot;
  }

  const slots = Array.from(tray.querySelectorAll(".tray-slot"));
  const emptySlot = slots.find((slot) => !slot.querySelector(".tile"));
  if (emptySlot) {
    tile.traySlot = emptySlot;
    return emptySlot;
  }

  const newSlot = createTraySlotElement();
  tray.appendChild(newSlot);
  tile.traySlot = newSlot;
  return newSlot;
}

function placeTileInTray(tile) {
  const slot = getLiveTraySlotForTile(tile);
  tile.placed = false;
  updateTileParent(tile, slot);
  positionTileAtTrayCenter(tile);
  updateTileTransform(tile);
}

function renderActiveTiles() {
  for (const tile of state.tiles.values()) {
    if (!tile.active) continue;

    const tileEl = createTileElement(tile);
    tile.dom = tileEl;

    if (isEntranceTile(tile)) {
      updateTileParent(tile, board);
      tile.placed = true;
    } else {
      const slot = createTraySlotElement();
      slot.appendChild(tileEl);
      tray.appendChild(slot);
      tile.traySlot = slot;
      tile.placed = false;
      positionTileAtTrayCenter(tile);
    }

    updateTileTransform(tile);
  }

  renderReservePile();
}

function rerenderTrayAndReserve() {
  if (state.compactSidePanelMode) {
    for (const tile of state.tiles.values()) {
      if (tile.required) continue;
      tile.active = true;
    }
    if (state.reserveEditMode) {
      state.reserveEditMode = false;
      document.body.classList.remove("reserve-edit-mode");
      clearPendingReserveSwap();
    }
    if (reserveEditCheckbox) reserveEditCheckbox.checked = false;
  }
  tray.innerHTML = "";
  reservePile.innerHTML = "";
  state.hoveredTileId = null;
  selectTile(null);
  clearPendingReserveSwap();

  if (state.compactSidePanelMode) {
    const compactOrder = getCompactTrayOrder(state.selectedTileSetId);
    for (const tile of state.tiles.values()) {
      if (tile.required) continue;
      tile.traySlot = null;
      if (tile.placed) continue;
      tile.dom = null;
      tile.bodyDom = null;
      tile.guideDom = null;
    }

    for (const tileId of compactOrder) {
      const slot = createTraySlotElement();
      slot.dataset.compactTileId = tileId;
      tray.appendChild(slot);
      const tile = state.tiles.get(tileId);
      if (!tile || tile.placed || !tile.active) continue;
      const tileEl = createTileElement(tile);
      tile.dom = tileEl;
      slot.appendChild(tileEl);
      tile.traySlot = slot;
      positionTileAtTrayCenter(tile);
      updateTileTransform(tile);
    }

    renderReservePile();
    renderBossPile();
    return;
  }

  const trayTiles = [];
  for (const tile of state.tiles.values()) {
    if (tile.required) continue;
    tile.traySlot = null;
    if (tile.placed) continue;
    tile.dom = null;
    tile.bodyDom = null;
    tile.guideDom = null;

    if (!tile.active) continue;
    trayTiles.push(tile);
  }

  const traySlotCount = 6;
  for (let i = 0; i < 6; i += 1) {
    const slot = createTraySlotElement();
    tray.appendChild(slot);

    const tile = trayTiles[i];
    if (!tile || tile.placed || !tile.active) continue;
    const tileEl = createTileElement(tile);
    tile.dom = tileEl;
    slot.appendChild(tileEl);
    tile.traySlot = slot;
    positionTileAtTrayCenter(tile);
    updateTileTransform(tile);
  }

  renderReservePile();
  renderBossPile();
}

function getBossTileSources(tileSetId = state.selectedTileSetId) {
  const tileSet = getTileSetConfig(tileSetId);
  const bossIds = Array.isArray(tileSet.bossIds) ? tileSet.bossIds : [];
  return bossIds.map((bossId) => `./tiles/${tileSet.id}/${tileSet.id}_boss_${bossId}.png`);
}

function ensureBossPileOrder(tileSetId = state.selectedTileSetId) {
  const canonical = getBossTileSources(tileSetId);
  const existing = Array.isArray(state.bossPileOrderByTileSet[tileSetId])
    ? state.bossPileOrderByTileSet[tileSetId]
    : [];
  const seen = new Set();
  const normalized = [];

  for (const src of existing) {
    if (!canonical.includes(src)) continue;
    if (seen.has(src)) continue;
    seen.add(src);
    normalized.push(src);
  }
  for (const src of canonical) {
    if (seen.has(src)) continue;
    seen.add(src);
    normalized.push(src);
  }

  state.bossPileOrderByTileSet[tileSetId] = normalized;
  return normalized;
}

function rotateBossPileTop(tileSetId = state.selectedTileSetId) {
  const order = ensureBossPileOrder(tileSetId);
  if (order.length < 2) return;
  const top = order.pop();
  order.unshift(top);
  state.bossPileOrderByTileSet[tileSetId] = order;
}

function pushBossBackToPile(src, tileSetId = state.selectedTileSetId) {
  const order = ensureBossPileOrder(tileSetId);
  const filtered = order.filter((entry) => entry !== src);
  filtered.push(src);
  state.bossPileOrderByTileSet[tileSetId] = filtered;
}

function getAvailableBossSources(tileSetId = state.selectedTileSetId) {
  const placedBossSources = new Set(state.bossTokens.map((token) => token.src));
  return ensureBossPileOrder(tileSetId).filter((src) => !placedBossSources.has(src));
}

function triggerBossRandomizeAnimation(tileSetId = state.selectedTileSetId) {
  if (!bossPile) return;
  const order = ensureBossPileOrder(tileSetId);
  if (order.length <= 1) return;
  const shuffled = [...order];
  if (shuffled.length === 2) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  } else {
    const next = shuffle(shuffled);
    const unchanged = next.every((src, idx) => src === shuffled[idx]);
    if (unchanged) {
      next.push(next.shift());
    }
    for (let i = 0; i < next.length; i += 1) shuffled[i] = next[i];
  }
  state.bossPileOrderByTileSet[tileSetId] = shuffled;
  renderBossPile();
}

function removeBossToken(token, { returnToPile = true } = {}) {
  if (!token) return;
  if (returnToPile) {
    pushBossBackToPile(token.src, state.selectedTileSetId);
  }
  state.bossTokens = state.bossTokens.filter((entry) => entry.id !== token.id);
  token.dom?.remove();
}

function renderBossPile() {
  if (!bossPile) return;
  bossPile.innerHTML = "";
  const placedBossSources = new Set(state.bossTokens.map((token) => token.src));
  const order = ensureBossPileOrder(state.selectedTileSetId);
  const sources = order.filter((src) => !placedBossSources.has(src));
  if (!sources.length) {
    bossPile.classList.add("is-empty");
    updatePlacementFeedbackChecklist();
    return;
  }
  bossPile.classList.remove("is-empty");

  const offsets = [
    { dx: -20, dy: 10, rot: -9, z: 1, scale: 0.98 },
    { dx: 16, dy: -6, rot: 5, z: 2, scale: 1.0 },
  ];
  const ordered = sources;

  for (let i = 0; i < ordered.length; i += 1) {
    const card = document.createElement("div");
    card.className = "boss-card";
    const offset = offsets[i] || offsets[offsets.length - 1];
    const cycleTargetOffset = offsets[0] || offset;
    card.style.setProperty("--dx", `${offset.dx}px`);
    card.style.setProperty("--dy", `${offset.dy}px`);
    card.style.setProperty("--rot", `${offset.rot}deg`);
    card.style.setProperty("--z", String(offset.z));
    card.style.setProperty("--scale", String(offset.scale));
    const isTopStackCard = Number(offset.z) >= 2;
    card.style.setProperty("--boss-shadow-y", isTopStackCard ? "4px" : "2px");
    card.style.setProperty("--boss-shadow-blur", isTopStackCard ? "7px" : "5px");
    card.style.setProperty("--boss-shadow-alpha", isTopStackCard ? "0.24" : "0.17");
    card.style.setProperty("--cycle-target-dx", `${cycleTargetOffset.dx}px`);
    card.style.setProperty("--cycle-target-dy", `${cycleTargetOffset.dy}px`);
    card.style.setProperty("--cycle-target-rot", `${cycleTargetOffset.rot}deg`);
    card.style.setProperty("--cycle-target-scale", String(cycleTargetOffset.scale));

    const img = document.createElement("img");
    img.src = ordered[i];
    img.alt = "Boss tile";
    img.draggable = false;
    img.addEventListener("dragstart", (event) => event.preventDefault());
    img.addEventListener("error", () => {
      card.remove();
      if (!bossPile.querySelector(".boss-card")) bossPile.classList.add("is-empty");
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
      if (state.bossPileCycleInProgress) return;
      state.bossPileCycleInProgress = true;
      bossPile?.classList.add("is-cycling");
      const topDx = card.style.getPropertyValue("--dx").trim();
      const topDy = card.style.getPropertyValue("--dy").trim();
      const topRot = card.style.getPropertyValue("--rot").trim();
      const topScale = card.style.getPropertyValue("--scale").trim();
      const counterpart = card.parentElement?.querySelector(".boss-card:not(.boss-card-cycling-out)");
      if (counterpart && counterpart !== card) {
        if (topDx) counterpart.style.setProperty("--cycle-in-target-dx", topDx);
        if (topDy) counterpart.style.setProperty("--cycle-in-target-dy", topDy);
        if (topRot) counterpart.style.setProperty("--cycle-in-target-rot", topRot);
        if (topScale) counterpart.style.setProperty("--cycle-in-target-scale", topScale);
        counterpart.classList.add("boss-card-cycling-in");
      }
      card.classList.add("boss-card-cycling-out");
      const midSwapDelay = Math.round(BOSS_PILE_CYCLE_ANIMATION_MS * 0.36);
      window.setTimeout(() => {
        if (!state.bossPileCycleInProgress) return;
        bossPile?.classList.add("is-cycle-mid");
      }, midSwapDelay);
      window.setTimeout(() => {
        rotateBossPileTop(state.selectedTileSetId);
        renderBossPile();
        bossPile?.classList.remove("is-cycle-mid");
        bossPile?.classList.remove("is-cycling");
        state.bossPileCycleInProgress = false;
      }, BOSS_PILE_CYCLE_ANIMATION_MS);
    });

    card.appendChild(img);
    bossPile.appendChild(card);
  }
  updatePlacementFeedbackChecklist();
}

function setBossEditMode(enabled) {
  state.bossEditMode = Boolean(enabled);
  document.body.classList.toggle("boss-edit-mode", state.bossEditMode);
  updateModeIndicators();
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

function isPointInsideElement(clientX, clientY, element) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return (
    clientX >= rect.left
    && clientX <= rect.right
    && clientY >= rect.top
    && clientY <= rect.bottom
  );
}

function isPointOverBoardSurface(clientX, clientY, boardRect = board.getBoundingClientRect()) {
  const insideBoardRect =
    clientX >= boardRect.left
    && clientX <= boardRect.right
    && clientY >= boardRect.top
    && clientY <= boardRect.bottom;
  if (!insideBoardRect) return false;

  const topEl = document.elementFromPoint(clientX, clientY);
  if (!topEl) return false;
  return topEl === board || board.contains(topEl);
}

function getEdgeAutoPanAxisDelta(pointer, min, max, zone, maxSpeed) {
  if (pointer < min + zone) {
    const t = clamp((min + zone - pointer) / zone, 0, 1);
    return maxSpeed * t * t;
  }
  if (pointer > max - zone) {
    const t = clamp((pointer - (max - zone)) / zone, 0, 1);
    return -(maxSpeed * t * t);
  }
  return 0;
}

function applyDragEdgeAutoPan(clientX, clientY, boardRect, dragPanState) {
  if (!dragPanState) return;
  if (!isPointOverBoardSurface(clientX, clientY, boardRect)) {
    dragPanState.lastTs = null;
    return;
  }

  const now = performance.now();
  const prevTs = Number.isFinite(dragPanState.lastTs) ? dragPanState.lastTs : now;
  const dt = clamp(now - prevTs, 0, 32);
  dragPanState.lastTs = now;

  const vx = getEdgeAutoPanAxisDelta(
    clientX,
    boardRect.left,
    boardRect.right,
    DRAG_EDGE_AUTO_PAN_ZONE,
    DRAG_EDGE_AUTO_PAN_MAX_SPEED,
  );
  const vy = getEdgeAutoPanAxisDelta(
    clientY,
    boardRect.top,
    boardRect.bottom,
    DRAG_EDGE_AUTO_PAN_ZONE,
    DRAG_EDGE_AUTO_PAN_MAX_SPEED,
  );
  if (Math.abs(vx) < 1e-3 && Math.abs(vy) < 1e-3) return;

  const frameScale = dt / 16.667;
  const zoom = getBoardZoom();
  const dx = (vx * frameScale) / zoom;
  const dy = (vy * frameScale) / zoom;
  translateBoardContent(dx, dy);
}

function updateDragEdgeAutoPanState(dragPanState, clientX, clientY, boardRect) {
  if (!dragPanState) return;
  dragPanState.clientX = clientX;
  dragPanState.clientY = clientY;
  dragPanState.boardRect = boardRect;
  dragPanState.active = true;
  if (dragPanState.rafId != null) return;

  const step = () => {
    if (!dragPanState.active) {
      dragPanState.rafId = null;
      return;
    }
    applyDragEdgeAutoPan(
      dragPanState.clientX,
      dragPanState.clientY,
      dragPanState.boardRect,
      dragPanState,
    );
    dragPanState.rafId = requestAnimationFrame(step);
  };

  dragPanState.rafId = requestAnimationFrame(step);
}

function stopDragEdgeAutoPan(dragPanState) {
  if (!dragPanState) return;
  dragPanState.active = false;
  dragPanState.lastTs = null;
  if (dragPanState.rafId != null) {
    cancelAnimationFrame(dragPanState.rafId);
    dragPanState.rafId = null;
  }
}

function getBossReferenceMagnetBoardPosition(boardX, boardY) {
  const reference = state.referenceMarker;
  if (!reference) return null;
  const sideOffset = TILE_SIZE + BOSS_REFERENCE_MAGNET_GAP;
  const topOffset = TILE_SIZE + BOSS_REFERENCE_MAGNET_TOP_GAP;
  const anchors = [
    {
      type: "side",
      x: reference.x - sideOffset,
      y: reference.y,
      radius: BOSS_REFERENCE_MAGNET_SIDE_RADIUS,
    },
    {
      type: "side",
      x: reference.x + sideOffset,
      y: reference.y,
      radius: BOSS_REFERENCE_MAGNET_SIDE_RADIUS,
    },
    {
      type: "top",
      x: reference.x,
      y: reference.y - topOffset,
      radius: BOSS_REFERENCE_MAGNET_TOP_RADIUS,
    },
  ];

  let best = null;
  for (const anchor of anchors) {
    const dx = boardX - anchor.x;
    const dy = boardY - anchor.y;
    if (anchor.type === "side" && Math.abs(dy) > BOSS_REFERENCE_MAGNET_SIDE_Y_TOLERANCE) continue;
    if (anchor.type === "top" && Math.abs(dx) > BOSS_REFERENCE_MAGNET_TOP_X_TOLERANCE) continue;
    const d2 = dx * dx + dy * dy;
    const maxD2 = anchor.radius * anchor.radius;
    if (d2 > maxD2) continue;
    if (!best || d2 < best.d2) best = { ...anchor, d2 };
  }

  if (!best) return null;
  return { x: best.x, y: best.y };
}

function getBossReferenceTopMagnetBoardPosition() {
  const reference = state.referenceMarker;
  if (!reference) return null;
  const topOffset = TILE_SIZE + BOSS_REFERENCE_MAGNET_TOP_GAP;
  return {
    x: reference.x,
    y: reference.y - topOffset,
  };
}

function getBossTokenAtReferenceTopMagnet() {
  const top = getBossReferenceTopMagnetBoardPosition();
  if (!top) return null;
  const tolerance = 2;
  return state.bossTokens.find(
    (token) => Math.abs(token.x - top.x) <= tolerance && Math.abs(token.y - top.y) <= tolerance,
  ) || null;
}

async function spawnRandomBossAtReferenceTopMagnet(options = {}) {
  const {
    showStatus = true,
    silentNoReference = false,
    silentNoBoss = false,
    shufflePreviewMs = BOSS_SHUFFLE_PREVIEW_MS,
  } = options || {};
  if (!state.referenceMarker) {
    if (!silentNoReference && showStatus) {
      setStatus("Reference card is not available yet.", true);
    }
    return;
  }
  const existingTopToken = getBossTokenAtReferenceTopMagnet();
  if (existingTopToken) {
    removeBossToken(existingTopToken, { returnToPile: true });
  }

  let availableSources = getAvailableBossSources(state.selectedTileSetId);
  if (!availableSources.length) {
    if (!silentNoBoss && showStatus) {
      setStatus("No boss cards available to place.", true);
    }
    return;
  }
  triggerBossRandomizeAnimation(state.selectedTileSetId);
  if (shufflePreviewMs > 0) {
    await new Promise((resolve) => window.setTimeout(resolve, shufflePreviewMs));
  }
  availableSources = getAvailableBossSources(state.selectedTileSetId);
  if (!availableSources.length) {
    if (!silentNoBoss && showStatus) {
      setStatus("No boss cards available to place.", true);
    }
    return;
  }

  const randomSource = availableSources[Math.floor(Math.random() * availableSources.length)];
  const topMagnetPosition = getBossReferenceTopMagnetBoardPosition();
  if (!topMagnetPosition) {
    if (showStatus) {
      setStatus("Could not resolve top reference magnet position.", true);
    }
    return;
  }
  createBossToken(
    randomSource,
    topMagnetPosition.x,
    topMagnetPosition.y,
    TILE_SIZE,
  );
  renderBossPile();
  if (showStatus) {
    setStatus(existingTopToken ? "Boss card exchanged at the top reference magnet." : "Random boss placed at the top reference magnet.");
  }
}

function getBoardDropPositionFromPointer(clientX, clientY, boardRect, zoom = getBoardZoom()) {
  const boardOriginX = boardRect.left + board.clientLeft;
  const boardOriginY = boardRect.top + board.clientTop;
  const rawX = clamp((clientX - boardOriginX) / zoom, 0, board.clientWidth);
  const rawY = clamp((clientY - boardOriginY) / zoom, 0, board.clientHeight);
  const magnet = getBossReferenceMagnetBoardPosition(rawX, rawY);
  if (!magnet) return { x: rawX, y: rawY };
  return {
    x: clamp(magnet.x, 0, board.clientWidth),
    y: clamp(magnet.y, 0, board.clientHeight),
  };
}

function beginBossSpawnDrag(event, src, onDragStart = null) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  const HOLD_TO_DRAG_MS = 150;

  const cardEl = event.currentTarget;
  const workspaceRect = workspace.getBoundingClientRect();
  const boardRect = board.getBoundingClientRect();
  const pointerId = event.pointerId;
  let latestX = event.clientX;
  let latestY = event.clientY;
  let pointerActive = true;
  let moved = false;
  let droppedToBoard = false;
  let holdElapsed = false;
  const dragPanState = {
    lastTs: null,
    rafId: null,
    active: false,
    clientX: event.clientX,
    clientY: event.clientY,
    boardRect,
  };
  const startDragMode = () => {
    if (moved || !pointerActive) return;
    moved = true;
    preview.style.display = "";
    cardEl.classList.add("boss-card-drag-origin");
    if (typeof onDragStart === "function") onDragStart();
    setPreviewPos(latestX, latestY);
  };
  const holdTimer = setTimeout(() => {
    holdElapsed = true;
    startDragMode();
  }, HOLD_TO_DRAG_MS);
  document.body.classList.add("boss-drag-cursor");

  const preview = document.createElement("div");
  preview.className = "boss-token boss-token-preview";
  preview.style.width = `${TILE_SIZE}px`;
  preview.style.display = "none";
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
    pointerActive = false;
    clearTimeout(holdTimer);
    stopDragEdgeAutoPan(dragPanState);
    document.body.classList.remove("boss-drag-cursor");
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
    latestX = moveEvent.clientX;
    latestY = moveEvent.clientY;
    if (!moved) {
      if (!holdElapsed) return;
      startDragMode();
    }
    updateDragEdgeAutoPanState(dragPanState, moveEvent.clientX, moveEvent.clientY, boardRect);
    const pointerOverBoard = isPointOverBoardSurface(moveEvent.clientX, moveEvent.clientY, boardRect);
    if (pointerOverBoard) {
      const zoom = getBoardZoom();
      const boardPos = getBoardDropPositionFromPointer(moveEvent.clientX, moveEvent.clientY, boardRect, zoom);
      const boardOriginX = boardRect.left + board.clientLeft;
      const boardOriginY = boardRect.top + board.clientTop;
      const workspaceX = boardPos.x * zoom + (boardOriginX - workspaceRect.left);
      const workspaceY = boardPos.y * zoom + (boardOriginY - workspaceRect.top);
      setPreviewPos(workspaceX + workspaceRect.left, workspaceY + workspaceRect.top);
      return;
    }
    setPreviewPos(moveEvent.clientX, moveEvent.clientY);
  };

  const handleUp = (upEvent) => {
    if (upEvent.pointerId !== pointerId) return;
    const droppedInsideBoard = isPointOverBoardSurface(upEvent.clientX, upEvent.clientY, boardRect);

    if (moved && droppedInsideBoard) {
      const zoom = getBoardZoom();
      const { x: bx, y: by } = getBoardDropPositionFromPointer(upEvent.clientX, upEvent.clientY, boardRect, zoom);
      createBossToken(src, bx, by, TILE_SIZE);
      droppedToBoard = true;
      renderBossPile();
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
  return token;
}

function positionBossToken(token, x, y) {
  token.x = x;
  token.y = y;
}

function updateBossTokenTransform(token) {
  if (!token?.dom) return;
  token.dom.style.left = `${token.x}px`;
  token.dom.style.top = `${token.y}px`;
  const parent = token.dom.parentElement;
  const scale = (isOnBoardLayer(parent) || parent === dragLayer) ? BOARD_ITEM_SCALE : 1;
  token.dom.style.transform = `translate3d(-50%, -50%, 0) scale(${scale})`;
}

function beginBossTokenDrag(token, event) {
  if (!token?.dom) return;
  if (event.button !== 0) return;
  if (state.wallEditMode) return;
  event.preventDefault();
  event.stopPropagation();

  const workspaceRect = workspace.getBoundingClientRect();
  const boardRect = board.getBoundingClientRect();
  const startX = token.x;
  const startY = token.y;
  const boardOffsetX = (boardRect.left + board.clientLeft) - workspaceRect.left;
  const boardOffsetY = (boardRect.top + board.clientTop) - workspaceRect.top;
  const zoom = getBoardZoom();
  const pointerId = event.pointerId;
  const dragPanState = {
    lastTs: null,
    rafId: null,
    active: false,
    clientX: event.clientX,
    clientY: event.clientY,
    boardRect,
  };
  token.dom.classList.add("boss-token-dragging");
  document.body.classList.add("boss-drag-cursor");
  if (token.dom.parentElement !== dragLayer) {
    dragLayer.appendChild(token.dom);
  }
  positionBossToken(token, startX * zoom + boardOffsetX, startY * zoom + boardOffsetY);
  updateBossTokenTransform(token);

  const cleanup = () => {
    stopDragEdgeAutoPan(dragPanState);
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
    window.removeEventListener("pointercancel", handleUp);
    token.dom.classList.remove("boss-token-dragging");
    document.body.classList.remove("boss-drag-cursor");
  };

  const handleMove = (moveEvent) => {
    if (moveEvent.pointerId !== pointerId) return;
    if (moveEvent.pointerType === "mouse" && moveEvent.buttons === 0) {
      cleanup();
      return;
    }
    updateDragEdgeAutoPanState(dragPanState, moveEvent.clientX, moveEvent.clientY, boardRect);
    let x = moveEvent.clientX - workspaceRect.left;
    let y = moveEvent.clientY - workspaceRect.top;
    const pointerOverBoard = isPointOverBoardSurface(moveEvent.clientX, moveEvent.clientY, boardRect);
    if (pointerOverBoard) {
      const boardPos = getBoardDropPositionFromPointer(moveEvent.clientX, moveEvent.clientY, boardRect, zoom);
      x = boardPos.x * zoom + boardOffsetX;
      y = boardPos.y * zoom + boardOffsetY;
    }
    positionBossToken(token, x, y);
    updateBossTokenTransform(token);
  };

  const handleUp = (upEvent) => {
    if (upEvent.pointerId !== pointerId) return;
    const droppedInsideBossPile = isPointInsideElement(upEvent.clientX, upEvent.clientY, bossPile);
    const droppedInsideInfoDrawer = isPointInsideElement(upEvent.clientX, upEvent.clientY, rightDrawer);
    if (droppedInsideBossPile || droppedInsideInfoDrawer) {
      pushBossBackToPile(token.src, state.selectedTileSetId);
      state.bossTokens = state.bossTokens.filter((entry) => entry.id !== token.id);
      token.dom.remove();
      renderBossPile();
      cleanup();
      return;
    }

    const droppedInsideBoard = isPointOverBoardSurface(upEvent.clientX, upEvent.clientY, boardRect);
    if (droppedInsideBoard) {
      if (token.dom.parentElement !== getBoardContentLayer()) {
        getBoardContentLayer().appendChild(token.dom);
      }
      const { x: bx, y: by } = getBoardDropPositionFromPointer(upEvent.clientX, upEvent.clientY, boardRect, zoom);
      positionBossToken(token, bx, by);
      updateBossTokenTransform(token);
      cleanup();
      return;
    }

    if (!isOnBoardLayer(token.dom.parentElement)) {
      getBoardContentLayer().appendChild(token.dom);
    }
    positionBossToken(token, startX, startY);
    updateBossTokenTransform(token);
    cleanup();
  };

  window.addEventListener("pointermove", handleMove);
  window.addEventListener("pointerup", handleUp);
  window.addEventListener("pointercancel", handleUp);
}

function renderReservePile() {
  reservePile.innerHTML = "";
  reservePile.classList.toggle("edit-mode", state.reserveEditMode);
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
    card.dataset.tileId = tile.tileId;
    const isSelectedSource =
      state.pendingSwapSource?.zone === "reserve"
      && state.pendingSwapSource?.tileId === tile.tileId;
    card.classList.toggle("selected", isSelectedSource);
    card.addEventListener("click", () => {
      if (state.wallEditMode) return;
      if (!state.reserveEditMode) return;
      handleSwapClick("reserve", tile.tileId);
    });

    const img = document.createElement("img");
    img.src = tile.imageSrc;
    img.alt = `${getTileDisplayLabel(tile.tileId)} (inactive)`;
    if (isMoltenRegularTile(tile)) img.classList.add("molten-regular-img");
    img.draggable = false;
    card.appendChild(img);
    card.appendChild(createReserveGuideOverlay(tile));
    reservePile.appendChild(card);
  }

  updateReserveSwapHighlights();
  updatePlacedProgress();
}

function getInactiveTilesInReserveOrder() {
  const inactiveSet = new Set(
    Array.from(state.tiles.values())
      .filter((tile) => !tile.required && !tile.active)
      .map((tile) => tile.tileId),
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
    .map((tile) => tile.tileId);
  state.reserveOrder = shuffle(inactiveIds);
}

function randomizeCurrentInactiveReserveOrder() {
  const currentIds = getInactiveTilesInReserveOrder().map((tile) => tile.tileId);
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
  const start = state.tiles.get(ENTRANCE_TILE_ID);
  const rect = board.getBoundingClientRect();
  const desiredX = rect.width / 2;
  const desiredY = TILE_SIZE / 2 + START_TILE_DEFAULT_Y_OFFSET;
  const snapped = snapTileCenterToHex(start, desiredX, desiredY);
  positionTile(start, snapped.x, snapped.y);
  updateTileParent(start, board);
  start.placed = true;
  setEntranceFadeAnchorFromTile(start);
  updateTileTransform(start);
  placeReferenceAboveStart(start);
  centerBoardViewOnEntranceX();
  // Ensure the hex gradient re-anchors to entrance after programmatic placement flows.
  scheduleBoardHexGridRender();
}

function setEntranceFadeAnchorFromTile(tile) {
  if (!tile || !isEntranceTile(tile) || !tile.placed) {
    state.entranceFadeAnchor = null;
    return;
  }
  state.entranceFadeAnchor = { x: tile.x, y: tile.y };
}

function centerBoardViewOnEntranceX() {
  const entrance = state.tiles.get(ENTRANCE_TILE_ID);
  if (!entrance?.placed) return;
  if (!entrance.dom || !isOnBoardLayer(entrance.dom.parentElement)) return;
  const targetX = board.clientWidth / 2;
  const dx = targetX - entrance.x;
  if (Math.abs(dx) < 0.5) return;
  translateBoardContent(dx, 0);
}

function getReferenceTileSrc(tileSetId = state.selectedTileSetId) {
  const tileSet = getTileSetConfig(tileSetId);
  return `./tiles/${tileSet.id}/${tileSet.id}_${tileSet.referenceCardId}.png`;
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
  img.alt = `${getTileSetConfig(state.selectedTileSetId).label} Reference Card`;
  img.draggable = false;
  img.addEventListener("dragstart", (event) => event.preventDefault());
  marker.appendChild(img);

  const x = startTile.x;
  const y = startTile.y - REFERENCE_OFFSET_Y;
  marker.style.left = `${x}px`;
  marker.style.top = `${y}px`;
  marker.style.transform = `translate(-50%, -50%) scale(${BOARD_ITEM_SCALE})`;
  getBoardContentLayer().appendChild(marker);

  state.referenceMarker = { dom: marker, x, y };
}

function ensureReferenceCardVisibleAfterAutoBuild(placedRegularTiles, entranceTile) {
  const reference = state.referenceMarker;
  if (!reference?.dom || !entranceTile) return false;
  if (!Array.isArray(placedRegularTiles) || !placedRegularTiles.length) return false;

  const previousTopMagnet = getBossReferenceTopMagnetBoardPosition();
  const getAttachedTopBossToken = () => {
    if (!previousTopMagnet) return null;
    const tolerance = 2;
    return state.bossTokens.find(
      (token) =>
        Math.abs(token.x - previousTopMagnet.x) <= tolerance
        && Math.abs(token.y - previousTopMagnet.y) <= tolerance,
    ) || null;
  };
  const attachedTopBossToken = getAttachedTopBossToken();
  const moveAttachedTopBossToken = () => {
    if (!attachedTopBossToken) return;
    const nextTop = getBossReferenceTopMagnetBoardPosition();
    if (!nextTop) return;
    positionBossToken(attachedTopBossToken, nextTop.x, nextTop.y);
    updateBossTokenTransform(attachedTopBossToken);
  };

  const defaultX = entranceTile.x;
  const defaultY = entranceTile.y - REFERENCE_OFFSET_Y;
  const defaultClear = !isReferenceCardOverlappedByTiles(defaultX, defaultY, placedRegularTiles);
  if (defaultClear) {
    if (Math.abs(reference.x - defaultX) > 0.5 || Math.abs(reference.y - defaultY) > 0.5) {
      reference.x = defaultX;
      reference.y = defaultY;
      reference.dom.style.left = `${defaultX}px`;
      reference.dom.style.top = `${defaultY}px`;
      moveAttachedTopBossToken();
    }
    return false;
  }
  if (!isReferenceCardOverlappedByTiles(reference.x, reference.y, placedRegularTiles)) return false;

  let leftSideTiles = 0;
  let rightSideTiles = 0;
  for (const tile of placedRegularTiles) {
    if (!tile) continue;
    if (tile.x < entranceTile.x) leftSideTiles += 1;
    else rightSideTiles += 1;
  }

  const preferRight = leftSideTiles > rightSideTiles;
  const primarySign = preferRight ? 1 : -1;
  const secondarySign = -primarySign;
  const baseY = reference.y;
  const sideOffsetNear = TILE_SIZE * 1.7;
  const sideOffsetFar = TILE_SIZE * 2.35;
  const candidates = [
    { x: entranceTile.x + primarySign * sideOffsetNear, y: baseY },
    { x: entranceTile.x + primarySign * sideOffsetFar, y: baseY },
    { x: entranceTile.x + secondarySign * sideOffsetNear, y: baseY },
    { x: entranceTile.x + secondarySign * sideOffsetFar, y: baseY },
  ];

  let best = null;
  for (const candidate of candidates) {
    const snapped = snapBoardPointToHex(
      clamp(candidate.x, TILE_SIZE * 0.7, board.clientWidth - TILE_SIZE * 0.7),
      clamp(candidate.y, TILE_SIZE * 0.7, board.clientHeight - TILE_SIZE * 0.7),
    );
    const overlapCount = countReferenceCardOverlaps(snapped.x, snapped.y, placedRegularTiles);
    const distanceFromEntrance = Math.hypot(snapped.x - entranceTile.x, snapped.y - entranceTile.y);
    const score = overlapCount * 100000 + distanceFromEntrance;
    if (!best || score < best.score) {
      best = { x: snapped.x, y: snapped.y, overlapCount, score };
    }
  }
  if (!best) return false;
  if (best.overlapCount > 0) return false;

  reference.x = best.x;
  reference.y = best.y;
  reference.dom.style.left = `${best.x}px`;
  reference.dom.style.top = `${best.y}px`;
  moveAttachedTopBossToken();
  return true;
}

function isReferenceCardOverlappedByTiles(refX, refY, tiles) {
  return countReferenceCardOverlaps(refX, refY, tiles) > 0;
}

function countReferenceCardOverlaps(refX, refY, tiles) {
  let count = 0;
  const half = TILE_SIZE * 0.5;
  const refLeft = refX - half;
  const refRight = refX + half;
  const refTop = refY - half;
  const refBottom = refY + half;
  for (const tile of tiles || []) {
    if (!tile) continue;
    const tileLeft = tile.x - half;
    const tileRight = tile.x + half;
    const tileTop = tile.y - half;
    const tileBottom = tile.y + half;
    const intersects = tileLeft < refRight
      && tileRight > refLeft
      && tileTop < refBottom
      && tileBottom > refTop;
    if (intersects) count += 1;
  }
  return count;
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
  const anchorStart = state.entranceFadeAnchor
    ? { x: state.entranceFadeAnchor.x, y: state.entranceFadeAnchor.y }
    : null;
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
    if (anchorStart) {
      state.entranceFadeAnchor = {
        x: anchorStart.x + dx,
        y: anchorStart.y + dy,
      };
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
  if (isEntranceTile(tile)) tileEl.classList.add("tile-entrance");
  tileEl.dataset.tileId = tile.tileId;

  const body = document.createElement("div");
  body.className = "tile-body";

  const img = document.createElement("img");
  img.src = tile.imageSrc;
  img.alt = getTileDisplayLabel(tile.tileId);
  if (isMoltenRegularTile(tile)) img.classList.add("molten-regular-img");
  if (isMoltenEntranceTile(tile)) img.classList.add("molten-entrance-img");
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
    if (state.reserveEditMode && isTraySwapTarget(tile)) {
      event.preventDefault();
      event.stopPropagation();
      handleSwapClick("tray", tile.tileId);
      return;
    }
    const faceHit = event.target.closest(".tile-guide-face-hit");
    if (state.wallEditMode && faceHit) {
      event.preventDefault();
      event.stopPropagation();
      if (isEntranceTile(tile)) {
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
      persistTileWallFaces(state.selectedTileSetId, tile.tileId, tile.wallFaceSet);
      refreshTileWallGuide(tile);
      setStatus(
        `${getTileDisplayLabel(tile.tileId)} wall faces: ${Array.from(tile.wallFaceSet).sort((a, b) => a - b).join(", ") || "none"}.`,
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
        performReserveToTraySwap(tile.tileId, state.pendingSwapSource.tileId);
      } else if (isTraySwapTarget(tile)) {
        event.preventDefault();
        event.stopPropagation();
        performReserveToTraySwap(state.pendingSwapSource.tileId, tile.tileId);
      } else {
        setStatus("Choose a tile currently in the tray to swap with the selected reserve tile.", true);
      }
      return;
    }
    event.preventDefault();
    selectTile(tile.tileId);
    beginDrag(tile, event);
  });

  tileEl.addEventListener("click", () => {
    if (state.pendingSwapSource) return;
    selectTile(tile.tileId);
  });
  tileEl.addEventListener("mouseenter", () => {
    state.hoveredTileId = tile.tileId;
    if (state.selectedTileId && state.selectedTileId !== tile.tileId) {
      selectTile(null);
    }
  });
  tileEl.addEventListener("mouseleave", () => {
    if (state.hoveredTileId === tile.tileId) state.hoveredTileId = null;
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
      setStatus(`Reserve Tiles: ${getTileDisplayLabel(tileId)} selected. Click a Dungeon Tile to swap.`);
    } else {
      setStatus(`Dungeon Tiles: ${getTileDisplayLabel(tileId)} selected. Click a Reserve Tile to swap.`);
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
    setStatus(`Reserve Tiles: ${getTileDisplayLabel(tileId)} selected. Click a Dungeon Tile to swap.`);
  } else {
    setStatus(`Dungeon Tiles: ${getTileDisplayLabel(tileId)} selected. Click a Reserve Tile to swap.`);
  }
}

function clearPendingReserveSwap() {
  if (!state.pendingSwapSource) return;
  state.pendingSwapSource = null;
  updateReserveSwapHighlights();
}

function updateReserveSwapHighlights() {
  document.body.classList.toggle("reserve-swap-pending", Boolean(state.pendingSwapSource));
  const cards = reservePile.querySelectorAll(".reserve-card");
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
      && state.pendingSwapSource?.tileId === tile.tileId;
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
  renderReservePile();
  setStatus(
    `Swapped in ${getTileDisplayLabel(reserveTileId)}. Moved ${getTileDisplayLabel(trayTileId)} to Reserve Tiles.`,
  );
}

function createPlacementOverlay(tile) {
  const overlay = document.createElement("div");
  overlay.className = "tile-placement-overlay";
  overlay.setAttribute("aria-hidden", "true");
  overlay.style.maskImage = `url("${tile.imageSrc}")`;
  overlay.style.maskRepeat = "no-repeat";
  overlay.style.maskPosition = "center";
  overlay.style.maskSize = "contain";
  overlay.style.webkitMaskImage = `url("${tile.imageSrc}")`;
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
    if (isEntranceTile(tile) && i === 12) {
      label.textContent = "A";
    } else if (isEntranceTile(tile) && i === 11) {
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
  if (shouldUseTemplateGuidePoints(tile)) {
    const templatePoints = getTemplateGuidePointsForTile(tile);
    if (templatePoints?.length) return templatePoints;
  }

  const points = tile.faceGeometry.points.map((p) => ({ ...p }));
  if (isEntranceTile(tile)) {
    const templateTile =
      state.tiles.get("tile_01")
      || Array.from(state.tiles.values()).find((t) => !isEntranceTile(t));
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

function shouldUseTemplateGuidePoints(tile) {
  if (!tile || isEntranceTile(tile)) return false;
  if (tile.tileSetId !== "overgrown") return false;
  return ["tile_04", "tile_05", "tile_06", "tile_07", "tile_08", "tile_09"].includes(tile.tileId);
}

function getTemplateGuidePointsForTile(tile) {
  const templateTileId = "tile_01";
  const sameSetTile = state.tiles.get(templateTileId);
  if (sameSetTile?.tileSetId === tile.tileSetId && sameSetTile.faceGeometry?.points?.length) {
    return applyNormalTileGuideAdjustments(sameSetTile.faceGeometry.points.map((p) => ({ ...p })));
  }

  const editorRef = state.wallEditorTileRefs.get(`${tile.tileSetId}:${templateTileId}`);
  if (editorRef?.tile?.faceGeometry?.points?.length) {
    return applyNormalTileGuideAdjustments(editorRef.tile.faceGeometry.points.map((p) => ({ ...p })));
  }

  return null;
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
    return sanitizeWallOverrides(migrateLegacyWallOverrides(parsed));
  } catch (error) {
    console.warn("Could not load wall overrides from storage.", error);
    return {};
  }
}

function loadEndTileOverrides() {
  try {
    const raw = localStorage.getItem(END_TILE_OVERRIDES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return sanitizeEndTileOverrides(parsed);
  } catch (error) {
    console.warn("Could not load end-tile overrides from storage.", error);
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

function saveEndTileOverrides() {
  try {
    localStorage.setItem(END_TILE_OVERRIDES_STORAGE_KEY, JSON.stringify(state.endTileOverrides));
  } catch (error) {
    console.warn("Could not save end-tile overrides to storage.", error);
  }
}

function getStoredWallFaces(tileSetId, tileId) {
  const tileSetOverrides = state.wallOverrides?.[tileSetId];
  const arr = tileSetOverrides?.[tileId] ?? DEFAULT_WALL_FACE_DATA?.[tileSetId]?.[tileId] ?? [];
  if (!Array.isArray(arr)) return [];
  return arr.filter((n) => Number.isInteger(n) && n >= 0).sort((a, b) => a - b);
}

function getStoredAllowAsEndTile(tileSetId, tileId) {
  const tileSetOverrides = state.endTileOverrides?.[tileSetId];
  const value = tileSetOverrides?.[tileId];
  if (typeof value === "boolean") return value;
  return true;
}

function exportWallOverridesBackup() {
  try {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      wallOverrides: state.wallOverrides,
      endTileOverrides: state.endTileOverrides,
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
    setStatus("Debug wall override data exported.");
  } catch (error) {
    console.error(error);
    setStatus("Failed to export debug wall override data.", true);
  }
}

async function importWallOverridesBackup(file) {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const raw = parsed?.wallOverrides ?? parsed;
    const sanitized = sanitizeWallOverrides(migrateLegacyWallOverrides(raw));
    const endTileRaw = parsed?.endTileOverrides ?? {};
    const endTileSanitized = sanitizeEndTileOverrides(endTileRaw);
    state.wallOverrides = sanitized;
    state.endTileOverrides = endTileSanitized;
    saveWallOverrides();
    saveEndTileOverrides();
    syncSelectedTileSetWallsFromOverrides();
    if (state.wallEditMode) {
      await renderWallEditorPage();
      if (state.wallEditorActiveTileSetId && state.wallEditorActiveTileId) {
        setActiveWallEditorTile(state.wallEditorActiveTileSetId, state.wallEditorActiveTileId);
      }
    }
    setStatus("Debug wall override data imported.");
  } catch (error) {
    console.error(error);
    setStatus("Invalid debug wall override file. Import failed.", true);
  }
}

function sanitizeWallOverrides(input) {
  if (!input || typeof input !== "object") return {};
  const clean = {};
  for (const tileSet of TILE_SET_REGISTRY) {
    const tileSetValue = input[tileSet.id];
    if (!tileSetValue || typeof tileSetValue !== "object") continue;
    const tileSetOut = {};
    const defs = buildTileDefs(tileSet.id);
    for (const def of defs) {
      const arr = tileSetValue[def.tileId];
      if (!Array.isArray(arr)) continue;
      const uniq = [...new Set(
        arr
          .filter((n) => Number.isInteger(n) && n >= 0 && n < 64)
          .map((n) => Number(n)),
      )].sort((a, b) => a - b);
      tileSetOut[def.tileId] = uniq;
    }
    if (Object.keys(tileSetOut).length) clean[tileSet.id] = tileSetOut;
  }
  return clean;
}

function sanitizeEndTileOverrides(input) {
  if (!input || typeof input !== "object") return {};
  const clean = {};
  for (const tileSet of TILE_SET_REGISTRY) {
    const tileSetValue = input[tileSet.id];
    if (!tileSetValue || typeof tileSetValue !== "object") continue;
    const tileSetOut = {};
    const defs = buildTileDefs(tileSet.id);
    for (const def of defs) {
      const value = tileSetValue[def.tileId];
      if (typeof value !== "boolean") continue;
      tileSetOut[def.tileId] = value;
    }
    if (Object.keys(tileSetOut).length) clean[tileSet.id] = tileSetOut;
  }
  return clean;
}

function persistTileWallFaces(tileSetId, tileId, faceSet) {
  if (!state.wallOverrides[tileSetId]) state.wallOverrides[tileSetId] = {};
  const sorted = Array.from(faceSet).sort((a, b) => a - b);
  state.wallOverrides[tileSetId][tileId] = sorted;
  saveWallOverrides();

  if (tileSetId === state.selectedTileSetId) {
    const activeTile = state.tiles.get(tileId);
    if (activeTile) {
      activeTile.wallFaceSet = new Set(sorted);
      refreshTileWallGuide(activeTile);
    }
  }
}

function persistAllowAsEndTile(tileSetId, tileId, allowed) {
  if (!state.endTileOverrides[tileSetId]) state.endTileOverrides[tileSetId] = {};
  state.endTileOverrides[tileSetId][tileId] = Boolean(allowed);
  saveEndTileOverrides();

  if (tileSetId === state.selectedTileSetId) {
    const activeTile = state.tiles.get(tileId);
    if (activeTile) activeTile.allowAsEndTile = Boolean(allowed);
  }
}

function getActiveTileForWallEditing() {
  const editorKey = state.wallEditorActiveTileSetId && state.wallEditorActiveTileId
    ? `${state.wallEditorActiveTileSetId}:${state.wallEditorActiveTileId}`
    : null;
  if (editorKey && state.wallEditorTileRefs.has(editorKey)) {
    const ref = state.wallEditorTileRefs.get(editorKey);
    return { tileSetId: ref.tileSetId, tile: ref.tile };
  }

  const id = state.hoveredTileId || state.selectedTileId;
  const tile = id ? state.tiles.get(id) : null;
  if (!tile) return null;
  return { tileSetId: state.selectedTileSetId, tile };
}

async function renderWallEditorPage() {
  if (!wallEditorPage) return;

  wallEditorPage.innerHTML = "";
  const intro = document.createElement("div");
  intro.className = "wall-editor-intro";
  intro.textContent = "Wall Editor: click face segments to toggle wall ON/OFF. Use End Tile toggle to allow/disallow endpoint placement. Saved per tile set + tile.";
  wallEditorPage.appendChild(intro);

  const trays = document.createElement("div");
  trays.className = "wall-editor-trays";
  wallEditorPage.appendChild(trays);

  const panels = await Promise.all(TILE_SET_REGISTRY.map((tileSet) => buildWallEditorTileSetPanel(tileSet)));
  for (const panel of panels) trays.appendChild(panel);
}

async function buildWallEditorTileSetPanel(tileSet) {
  const panel = document.createElement("section");
  panel.className = "tile-set-wall-panel";

  const title = document.createElement("h3");
  title.textContent = tileSet.label;
  panel.appendChild(title);

  const tray = document.createElement("div");
  tray.className = "tile-set-wall-tray";
  panel.appendChild(tray);

  const defs = buildTileDefs(tileSet.id);
  let missingCount = 0;

  for (const def of defs) {
    try {
      const img = await loadImage(def.imageSrc);
      const faceGeometry = getFaceGeometry(img, SIDES);
      const tile = {
        tileSetId: def.tileSetId,
        tileId: def.tileId,
        key: def.key,
        imageSrc: def.imageSrc,
        required: def.required,
        img,
        faceGeometry,
        wallFaceSet: new Set(getStoredWallFaces(tileSet.id, def.tileId)),
        allowAsEndTile: getStoredAllowAsEndTile(tileSet.id, def.tileId),
      };
      const tileEl = createWallEditorTileElement(tileSet.id, tile);
      tray.appendChild(tileEl);
      state.wallEditorTileRefs.set(`${tileSet.id}:${tile.tileId}`, {
        tileSetId: tileSet.id,
        tile,
        el: tileEl,
      });
    } catch (error) {
      console.warn(`Missing asset for ${tileSet.id}/${def.tileId}`, error);
      missingCount += 1;
    }
  }

  if (missingCount > 0) {
    const note = document.createElement("p");
    note.className = "tile-set-wall-note";
    note.textContent = `${missingCount} tile asset(s) missing in this tile set.`;
    panel.appendChild(note);
  }

  return panel;
}

function createWallEditorTileElement(tileSetId, tile) {
  const tileEl = document.createElement("div");
  tileEl.className = "tile wall-editor-tile";
  tileEl.dataset.tileSetId = tileSetId;
  tileEl.dataset.tileId = tile.tileId;

  const body = document.createElement("div");
  body.className = "tile-body";

  const img = document.createElement("img");
  img.src = tile.imageSrc;
  img.alt = `${getTileSetConfig(tileSetId).label} ${getTileDisplayLabel(tile.tileId)}`;
  if (isMoltenRegularTile(tile)) img.classList.add("molten-regular-img");
  if (isMoltenEntranceTile(tile)) img.classList.add("molten-entrance-img");
  img.draggable = false;
  img.addEventListener("dragstart", (event) => event.preventDefault());
  body.appendChild(img);

  const guideOverlay = createTileGuideOverlay(tile);
  body.appendChild(guideOverlay);
  tile.guideDom = guideOverlay;
  tileEl.appendChild(body);

  const endToggle = document.createElement("button");
  endToggle.type = "button";
  endToggle.className = "wall-end-tile-toggle";
  const syncEndToggle = () => {
    const allowed = Boolean(tile.allowAsEndTile);
    endToggle.classList.toggle("is-on", allowed);
    endToggle.setAttribute("aria-pressed", String(allowed));
    endToggle.textContent = allowed ? "End Tile: ON" : "End Tile: OFF";
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
    persistAllowAsEndTile(tileSetId, tile.tileId, tile.allowAsEndTile);
    syncEndToggle();
    setStatus(
      `${getTileSetConfig(tileSetId).label} ${getTileDisplayLabel(tile.tileId)} end-tile allowance: ${tile.allowAsEndTile ? "ON" : "OFF"}.`,
    );
  });
  syncEndToggle();
  tileEl.appendChild(endToggle);

  const assignActive = () => setActiveWallEditorTile(tileSetId, tile.tileId);
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
    persistTileWallFaces(tileSetId, tile.tileId, tile.wallFaceSet);
    refreshTileWallGuide(tile);
    const list = Array.from(tile.wallFaceSet).sort((a, b) => a - b).join(", ") || "none";
    setStatus(`${getTileSetConfig(tileSetId).label} ${getTileDisplayLabel(tile.tileId)} wall faces: ${list}.`);
  });
  tileEl.addEventListener("click", assignActive);

  return tileEl;
}

function setActiveWallEditorTile(tileSetId, tileId) {
  state.wallEditorActiveTileSetId = tileSetId;
  state.wallEditorActiveTileId = tileId;
  for (const ref of state.wallEditorTileRefs.values()) {
    ref.el.classList.remove("selected");
  }
  const key = `${tileSetId}:${tileId}`;
  const ref = state.wallEditorTileRefs.get(key);
  if (ref) ref.el.classList.add("selected");
}

function syncSelectedTileSetWallsFromOverrides() {
  for (const tile of state.tiles.values()) {
    tile.wallFaceSet = new Set(getStoredWallFaces(state.selectedTileSetId, tile.tileId));
    tile.allowAsEndTile = getStoredAllowAsEndTile(state.selectedTileSetId, tile.tileId);
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
    tile.dom.classList.toggle("selected", tile.tileId === id);
  }
}

function updatePlacedProgress() {
  const placedCount = getPlacedTiles().filter((tile) => !isEntranceTile(tile)).length;
  if (placedProgressEl) placedProgressEl.textContent = `Placed ${placedCount} / 6 tiles`;
  updatePlacementFeedbackChecklist();
}

function updatePlacementFeedbackChecklist() {
  const placedCount = getPlacedTiles().filter((tile) => !isEntranceTile(tile)).length;
  const tilesComplete = placedCount >= 6;
  const bossSelected = state.bossTokens.length > 0;

  if (feedbackTilesCheckEl) feedbackTilesCheckEl.textContent = tilesComplete ? "✓" : "○";
  if (feedbackBossCheckEl) feedbackBossCheckEl.textContent = bossSelected ? "✓" : "○";
  if (feedbackTilesRowEl) feedbackTilesRowEl.classList.toggle("done", tilesComplete);
  if (feedbackBossRowEl) feedbackBossRowEl.classList.toggle("done", bossSelected);
}

function updateModeIndicators() {
  if (!modeIndicatorsEl) return;
  modeIndicatorsEl.innerHTML = "";
  const modes = [];
  if (state.wallEditMode) modes.push("Wall Editor Active");
  if (state.bossEditMode) modes.push("Boss Selection Active");
  if (state.reserveEditMode) modes.push("Reserve Edit Active");
  if (!modes.length) modes.push("Build Mode Active");
  for (const label of modes) {
    const chip = document.createElement("span");
    chip.className = "mode-chip";
    chip.textContent = label;
    modeIndicatorsEl.appendChild(chip);
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
    lastTs: null,
    rafId: null,
    active: false,
    clientX: event.clientX,
    clientY: event.clientY,
    boardRect,
  };

  // Enter drag visual state immediately on press/hold, before pointer movement.
  tile.dom.classList.add("dragging");
  state.activeTileDragCount += 1;
  document.body.classList.add("tile-drag-active");
  const initialX = event.clientX - workspaceRect.left - pointerOffsetX;
  const initialY = event.clientY - workspaceRect.top - pointerOffsetY;
  updateTileParent(tile, dragLayer);
  tile.dom.classList.add("floating");
  positionTile(tile, initialX, initialY);
  updateTileTransform(tile);

  let cleanedUp = false;

  const cleanupDrag = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    tile.dom.classList.remove("dragging");
    state.activeTileDragCount = Math.max(0, state.activeTileDragCount - 1);
    if (state.activeTileDragCount === 0) {
      document.body.classList.remove("tile-drag-active");
    }
    stopDragEdgeAutoPan(tile.drag);
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

    tile.drag.moved = true;
    updateDragEdgeAutoPanState(tile.drag, moveEvent.clientX, moveEvent.clientY, boardRect);
    const zoom = getBoardZoom();
    const boardOriginX = boardRect.left + board.clientLeft;
    const boardOriginY = boardRect.top + board.clientTop;
    const parentRect =
      tile.dom.parentElement === dragLayer
        ? workspaceRect
        : tile.dom.parentElement.getBoundingClientRect();
    const x = moveEvent.clientX - parentRect.left - tile.drag.offsetX;
    const y = moveEvent.clientY - parentRect.top - tile.drag.offsetY;
    const pointerInsideBoard = isPointOverBoardSurface(moveEvent.clientX, moveEvent.clientY, boardRect);

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

    updateTileTransform(tile);
    updatePlacementFeedback(tile, moveEvent.clientX, moveEvent.clientY, boardRect, workspaceRect);
  };

  const handleUp = (upEvent) => {
    if (!tile.drag || upEvent.pointerId !== tile.drag.pointerId) return;
    cleanupDrag();
    tile.dom.classList.remove("floating");

    if (!tile.drag.moved) {
      setPlacementFeedback(tile, null);
    if (!tile.drag.startedFromBoard) {
        placeTileInTray(tile);
      } else {
        // Click-without-drag on a board tile should restore it to board space.
        tile.placed = tile.drag.previousPlaced;
        updateTileParent(tile, board);
        positionTile(tile, tile.drag.previousX, tile.drag.previousY);
        updateTileTransform(tile);
      }
      tile.drag = null;
      return;
    }

    if (tile.dom.parentElement === dragLayer) {
      const droppedInsideLeftDrawer = isPointInsideElement(upEvent.clientX, upEvent.clientY, leftDrawer);
      const isInsideBoard = isPointOverBoardSurface(upEvent.clientX, upEvent.clientY, boardRect);

      if (!isInsideBoard && (droppedInsideLeftDrawer || !tile.drag.startedFromBoard)) {
        placeTileInTray(tile);
        setPlacementFeedback(tile, null);
        updatePlacedProgress();
        tile.drag = null;
        return;
      }

      if (!isInsideBoard) {
        tile.placed = tile.drag.previousPlaced;
        updateTileParent(tile, board);
        positionTile(tile, tile.drag.previousX, tile.drag.previousY);
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

  if (isEntranceTile(tile)) {
    tile.placed = true;
    setEntranceFadeAnchorFromTile(tile);
    scheduleBoardHexGridRender();
    setPlacementFeedback(tile, null);
    setStatus("Entrance tile placed. Now add the other 6 tiles.");
    updatePlacedProgress();
    return;
  }

  const placedTiles = getPlacedTiles().filter((t) => t.tileId !== tile.tileId);

  if (placedTiles.length === 0) {
    revertToTray(tile, "Place the Entrance Tile first.");
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
      handleInvalidDrop(tile, placedTiles, `Invalid placement: ${getInvalidContactReason(result)} Returning to tray in 10s.`);
      return;
    }
  }

  tile.placed = true;
  if (result.valid) {
    setStatus(`Placed ${getTileDisplayLabel(tile.tileId)} with ${result.count} point contacts.`);
  } else {
    setStatus(`Placed ${getTileDisplayLabel(tile.tileId)} with ${result.count} contacts (4-point rule ignored).`, true);
  }
  selectTile(null);
  updatePlacedProgress();
}

function snapTileCenterToHex(tile, tileCenterX, tileCenterY) {
  const anchor = getTileSnapAnchorForRotation(tile, tile.rotation || 0);
  const desiredGuideX = tileCenterX + anchor.x;
  const desiredGuideY = tileCenterY + anchor.y;
  const snappedGuide = snapBoardPointToHex(desiredGuideX, desiredGuideY);
  const entranceYOffset = isEntranceTile(tile) ? 9 : 0;
  return {
    x: quantizeSnapCoord(snappedGuide.x - anchor.x),
    y: quantizeSnapCoord(snappedGuide.y - anchor.y + entranceYOffset),
  };
}

function quantizeSnapCoord(value, quantum = SNAP_COORD_QUANTUM) {
  if (!Number.isFinite(value)) return value;
  const q = Number.isFinite(quantum) && quantum > 0 ? quantum : 1;
  return Number((Math.round(value / q) * q).toFixed(4));
}

function getTileSnapAnchorForRotation(tile, rotationDeg) {
  if (!isEntranceTile(tile)) return { x: 0, y: 0 };
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
  if (isEntranceTile(tile)) {
    const hasOtherPlaced = getPlacedTiles().some((t) => !isEntranceTile(t));
    if (hasOtherPlaced) {
      setStatus("Entrance Tile rotation is locked once another tile is placed.", true);
      return;
    }
  }

  if (isEntranceTile(tile)) {
    const direction = delta < 0 ? -1 : 1;
    tile.rotation = normalizeAngle(tile.rotation + direction * 90);
  } else {
    tile.rotation = normalizeAngle(tile.rotation + delta);
  }
  updateTileTransform(tile);
  if (isEntranceTile(tile)) {
    scheduleBoardHexGridRender();
  }

  if (tile.placed && !isEntranceTile(tile)) {
    const placedTiles = getPlacedTiles().filter((t) => t.tileId !== tile.tileId);
    const result = findBestContact(tile, placedTiles);
    if (!result.valid) {
      setStatus(`Rotation broke placement for ${getTileDisplayLabel(tile.tileId)}. ${getInvalidContactReason(result)}`, true);
    } else {
      setStatus(`${getTileDisplayLabel(tile.tileId)} rotated to ${tile.rotation}°. Contact points: ${result.count}.`);
    }
  }
}

function findBestContact(tile, otherTiles, options = {}) {
  const enforceEndTileRule = Boolean(options?.enforceEndTileRule);
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
  const connectedFaceCount = matchedTileFaceIdx.size;
  const totalCount = connectedFaceCount * 2;
  const isEndTileCandidate = connectedFaceCount > 0 && connectedFaceCount <= END_TILE_MAX_CONNECTED_FACES;
  const endTileDisallowed = enforceEndTileRule && isEndTileCandidate && !Boolean(tile.allowAsEndTile);
  return {
    valid: totalCount >= MIN_CONTACT_POINTS && !touchesBlockedAB && !endTileDisallowed,
    count: totalCount,
    other: best.other,
    match: best.match,
    faceIndices: Array.from(matchedTileFaceIdx),
    connectedFaceCount,
    isEndTileCandidate,
    endTileDisallowed,
    hasWeakConnectedNeighbor: false,
    hasLinkedFaceException: false,
    touchesBlockedAB,
  };
}

function getInvalidContactReason(result) {
  if (result?.endTileDisallowed) {
    return "This tile is an end tile (3 connected faces) but is not marked as allowed for end placement in Wall Editor.";
  }
  return "Need at least 2 connected faces total (4 points).";
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
  options = {},
) {
  let best = null;
  const aDirs = getSideDirections(tile);
  const evalPlacement = typeof options?.evalFn === "function"
    ? options.evalFn
    : (cx, cy) => evaluatePlacementAt(tile, otherTiles, cx, cy, options);

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

        const evalResult = evalPlacement(cx, cy);
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

function evaluatePlacementAt(tile, otherTiles, x, y, options = {}) {
  const oldX = tile.x;
  const oldY = tile.y;
  positionTile(tile, x, y);
  const contact = findBestContact(tile, otherTiles, options);
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
  if (!isEntranceTile(tile)) return false;
  return (
    ENTRANCE_BLOCKED_FACE_INDICES.has(face.startIdx)
    || ENTRANCE_BLOCKED_FACE_INDICES.has(face.endIdx)
  );
}

function isTouchingTileStartBlockedPoints(tile, otherTile, touchRadius) {
  if (!isEntranceTile(tile)) return false;
  const points = getGuideFacePoints(tile);
  const rotationRad = (tile.rotation * Math.PI) / 180;
  const cos = Math.cos(rotationRad);
  const sin = Math.sin(rotationRad);

  for (const idx of ENTRANCE_BLOCKED_FACE_INDICES) {
    const p = points[idx];
    if (!p) continue;
    const wx = tile.x + p.x * cos - p.y * sin;
    const wy = tile.y + p.x * sin + p.y * cos;
    if (isWorldPointOnOpaquePixel(otherTile, wx, wy, touchRadius)) return true;
  }

  return false;
}

function isTouchingMoltenEntranceBlockedPoints(tile) {
  if (!tile || isEntranceTile(tile)) return false;
  const entrance = state.tiles.get(ENTRANCE_TILE_ID);
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
  tile.rotation = 0;
  placeTileInTray(tile);
  selectTile(null);
  setPlacementFeedback(tile, null);
  setStatus(message, warn);
  updatePlacedProgress();
}

function handleInvalidDrop(tile, placedTiles, message = null, force = false) {
  if (state.ignoreContactRule && !force) {
    clearInvalidReturnTimer(tile);
    setPlacementFeedback(tile, null);
    updatePlacedProgress();
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
    message ?? "Invalid placement: this tile needs at least 2 connected faces total (4 points). Returning to tray in 10s.",
    true,
  );

  tile.invalidReturnTimer = setTimeout(() => {
    tile.invalidReturnTimer = null;
    if (tile.placed) return;
    tile.rotation = 0;
    placeTileInTray(tile);
    selectTile(null);
    setPlacementFeedback(tile, null);
    setStatus(`${getTileDisplayLabel(tile.tileId)} returned to tray after invalid placement.`, true);
    updatePlacedProgress();
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
  const parent = tile.dom.parentElement;
  const dragZoom = parent === dragLayer ? getBoardZoom() : 1;
  const boardItemScale =
    (isOnBoardLayer(parent) || (parent === dragLayer && tile.drag?.startedFromBoard))
      ? BOARD_ITEM_SCALE
      : 1;
  const scale = dragZoom * boardItemScale;
  let trayNudgeX = 0;
  let trayNudgeY = 0;
  if (
    !state.compactSidePanelMode
    && parent?.classList?.contains("tray-slot")
    && parent.parentElement === tray
  ) {
    const slotIndex = Array.prototype.indexOf.call(parent.parentElement.children, parent);
    if (slotIndex >= 0) {
      // Pull left/right tray tiles slightly inward without changing slot/card size.
      trayNudgeX = slotIndex % 2 === 0 ? 2.5 : -2.5;
      // Pull tray rows slightly toward center to reduce vertical spacing between rows.
      const row = Math.floor(slotIndex / 2);
      if (row === 0) trayNudgeY = 12;
      else if (row === 1) trayNudgeY = 0;
      else trayNudgeY = -13;
    }
  }
  const translateX = `calc(-50% + ${trayNudgeX}px)`;
  const entranceVisualOffsetY = isEntranceTile(tile) ? 1 : 0;
  const translateY = `calc(-50% + ${trayNudgeY + entranceVisualOffsetY}px)`;
  tile.dom.style.left = `${tile.x}px`;
  tile.dom.style.top = `${tile.y}px`;
  tile.dom.style.transformOrigin = "50% 50%";
  tile.dom.style.transform =
    scale !== 1
      ? `translate(${translateX}, ${translateY}) scale(${scale})`
      : `translate(${translateX}, ${translateY})`;
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

function getAutoBuildHistoryKey(activeRegularTiles) {
  const ids = (activeRegularTiles || [])
    .map((tile) => tile.tileId)
    .sort();
  return `${state.selectedTileSetId}|${ids.join(",")}`;
}

function getAutoBuildHistoryForKey(key) {
  const arr = state.autoBuildHistoryBySet?.[key];
  return Array.isArray(arr) ? arr : [];
}

function pushAutoBuildHistory(key, signature) {
  if (!key || !signature) return;
  if (!state.autoBuildHistoryBySet[key]) state.autoBuildHistoryBySet[key] = [];
  const list = state.autoBuildHistoryBySet[key];
  const existingIdx = list.indexOf(signature);
  if (existingIdx >= 0) list.splice(existingIdx, 1);
  list.push(signature);
  if (list.length > AUTO_BUILD_HISTORY_LIMIT) {
    list.splice(0, list.length - AUTO_BUILD_HISTORY_LIMIT);
  }
}

function getAutoBuildLayoutSignature(regularTiles, entranceTile) {
  const tiles = Array.isArray(regularTiles) ? regularTiles : [];
  if (!tiles.length) return "";

  const round = (n) => Math.round(n * 10) / 10;
  const allTiles = entranceTile ? [entranceTile, ...tiles] : [...tiles];
  const pairwiseDistances = [];
  for (let i = 0; i < tiles.length; i += 1) {
    for (let j = i + 1; j < tiles.length; j += 1) {
      pairwiseDistances.push(round(Math.hypot(tiles[i].x - tiles[j].x, tiles[i].y - tiles[j].y)));
    }
  }
  pairwiseDistances.sort((a, b) => a - b);

  const entranceDistances = entranceTile
    ? tiles
      .map((tile) => round(Math.hypot(tile.x - entranceTile.x, tile.y - entranceTile.y)))
      .sort((a, b) => a - b)
    : [];

  const degreeByTile = [];
  for (const tile of tiles) {
    let degree = 0;
    for (const other of allTiles) {
      if (other === tile) continue;
      if (countSideContacts(tile, other) > 0) degree += 1;
    }
    degreeByTile.push(degree);
  }
  degreeByTile.sort((a, b) => a - b);

  return [
    `pd:${pairwiseDistances.join(".")}`,
    `ed:${entranceDistances.join(".")}`,
    `deg:${degreeByTile.join(".")}`,
  ].join("|");
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
  if (isEntranceTile(tile)) {
    setPlacementFeedback(tile, null);
    return;
  }

  const isInsideBoard = isPointOverBoardSurface(pointerClientX, pointerClientY, boardRect);

  if (!isInsideBoard) {
    setPlacementFeedback(tile, null);
    return;
  }

  const placedTiles = getPlacedTiles().filter((t) => t.tileId !== tile.tileId);
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
  const validFaceIndices = (result.faceIndices || []).filter((v) => Number.isInteger(v));
  const validSet = new Set(validFaceIndices);
  const invalidFaceIndices = (result.touchingFaceIndices || []).filter(
    (v) => Number.isInteger(v) && !validSet.has(v),
  );
  if (result.valid) {
    setPlacementFeedback(tile, true, validFaceIndices, invalidFaceIndices);
    return;
  }
  setPlacementFeedback(tile, false, [], result.touchingFaceIndices || []);
}

function setPlacementFeedback(tile, isValid, validFaceIndices = [], invalidFaceIndices = []) {
  if (!tile.dom) return;
  tile.dom.classList.remove("valid-placement", "invalid-placement");
  if (isValid === true) tile.dom.classList.add("valid-placement");
  if (isValid === false) tile.dom.classList.add("invalid-placement");
  refreshPlacementGuideDom(tile.guideDom, isValid, validFaceIndices, invalidFaceIndices);
}

function refreshPlacementGuideDom(guideDom, isValid, validFaceIndices, invalidFaceIndices = []) {
  if (!guideDom) return;
  const lines = guideDom.querySelectorAll(".tile-guide-contact-seg");
  const valid = new Set((validFaceIndices || []).filter((v) => Number.isInteger(v)));
  const invalid = new Set((invalidFaceIndices || []).filter((v) => Number.isInteger(v)));
  lines.forEach((line) => {
    const idx = Number.parseInt(line.dataset.faceIndex || "", 10);
    const hasIdx = Number.isInteger(idx);
    line.classList.toggle("is-contact-valid", hasIdx && valid.has(idx));
    line.classList.toggle("is-contact-invalid", hasIdx && invalid.has(idx));
  });
  guideDom.classList.toggle("contact-valid", false);
  guideDom.classList.toggle("contact-invalid", false);
}
