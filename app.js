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
const DEFAULT_THEME_ID = "molten";
const THEME_OPTIONS = [
  { id: "molten", label: "Molten", folder: "molten", prefix: "molten" },
  { id: "overgrown", label: "Overgrown", folder: "overgrown", prefix: "overgrown" },
  { id: "dreamscape", label: "Dreamscape", folder: "dreamscape", prefix: "dreamscape" },
  { id: "nightmare", label: "Nightmare", folder: "nightmare", prefix: "nightmare" },
  { id: "submerged", label: "Submerged", folder: "submerged", prefix: "submerged" },
  { id: "deep_freeze", label: "Deep Freeze", folder: "deep_freeze", prefix: "deep_freeze" },
];
const TRAY_CENTER_X = TILE_SIZE / 2;
const TRAY_CENTER_Y = TILE_SIZE / 2 + 10;

const board = document.getElementById("board");
const tray = document.getElementById("tray");
const reserveStack = document.getElementById("reserve-stack");
const themeSelect = document.getElementById("theme-select");
const workspace = document.querySelector(".workspace");
const statusEl = document.getElementById("status");
const rerollBtn = document.getElementById("reroll-btn");
const resetBtn = document.getElementById("reset-btn");
const toggleLabelsBtn = document.getElementById("toggle-labels-btn");
const dragLayer = document.createElement("div");
dragLayer.className = "drag-layer";
workspace.appendChild(dragLayer);

const state = {
  tiles: new Map(),
  selectedTileId: null,
  hoveredTileId: null,
  selectedThemeId: DEFAULT_THEME_ID,
  tileDefs: [],
  showGuideLabels: false,
};

init().catch((error) => {
  console.error(error);
  setStatus("Failed to initialize app. Check image paths.", true);
});

async function init() {
  bindGlobalControls();
  if (themeSelect) themeSelect.value = state.selectedThemeId;
  await applyTheme(state.selectedThemeId, false);
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
    await loadTiles(nextTheme.id);
    startRound();
    if (showStatus) setStatus(`Theme set to ${nextTheme.label}.`);
  } catch (error) {
    console.error(error);
    const previousTheme = getThemeConfig(previousThemeId);
    state.selectedThemeId = previousTheme.id;
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
  rerollBtn.addEventListener("click", () => startRound());
  resetBtn.addEventListener("click", () => resetPositions());
  if (toggleLabelsBtn) {
    toggleLabelsBtn.addEventListener("click", () => {
      state.showGuideLabels = !state.showGuideLabels;
      document.body.classList.toggle("show-guide-labels", state.showGuideLabels);
      toggleLabelsBtn.textContent = state.showGuideLabels ? "Hide Numbers" : "Show Numbers";
    });
  }
  if (themeSelect) {
    themeSelect.addEventListener("change", async (event) => {
      const nextThemeId = event.target.value;
      await applyTheme(nextThemeId, true);
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
}

function startRound() {
  clearBoard();

  const candidateTiles = state.tileDefs.filter((t) => !t.required).map((t) => t.id);
  const selectedIds = shuffle(candidateTiles).slice(0, 6);

  for (const tile of state.tiles.values()) {
    tile.active = tile.id === "molten_entrance" || selectedIds.includes(tile.id);
    tile.placed = false;
    tile.rotation = tile.id === "molten_entrance" ? 0 : randomTrayRotation();
  }

  renderActiveTiles();
  placeStartTileAtCenter();
  setStatus("Round ready. Drag tiles to board. Each placed tile must touch at least 4 guide points of an existing tile.");
}

function resetPositions() {
  clearBoard();

  for (const tile of state.tiles.values()) {
    if (!tile.active) continue;
    tile.rotation = tile.id === "molten_entrance" ? 0 : randomTrayRotation();
    tile.placed = false;
  }

  renderActiveTiles();
  placeStartTileAtCenter();
  setStatus("Positions reset. Same 6 random tiles kept.");
}

function clearBoard() {
  for (const tile of state.tiles.values()) {
    clearInvalidReturnTimer(tile);
  }
  board.innerHTML = "";
  tray.innerHTML = "";
  reserveStack.innerHTML = "";
  state.selectedTileId = null;
  state.hoveredTileId = null;
}

function renderActiveTiles() {
  for (const tile of state.tiles.values()) {
    if (!tile.active) continue;

    const tileEl = createTileElement(tile);
    tile.dom = tileEl;

    if (tile.id === "molten_entrance") {
      board.appendChild(tileEl);
      tile.placed = true;
    } else {
      const slot = document.createElement("div");
      slot.className = "tray-slot";
      slot.appendChild(tileEl);
      tray.appendChild(slot);
      tile.traySlot = slot;
      tile.placed = false;
      positionTile(tile, TRAY_CENTER_X, TRAY_CENTER_Y);
    }

    updateTileTransform(tile);
  }

  renderInactiveTileStack();
}

function renderInactiveTileStack() {
  const inactiveTiles = Array.from(state.tiles.values())
    .filter((tile) => !tile.required && !tile.active)
    .sort((a, b) => a.id.localeCompare(b.id));

  const offsets = [
    { x: -22, y: 22, rot: -13, z: 1, scale: 0.97 },
    { x: 16, y: 8, rot: 9, z: 2, scale: 1.02 },
    { x: -8, y: -10, rot: -4, z: 3, scale: 1.0 },
  ];

  for (let i = 0; i < inactiveTiles.length; i += 1) {
    const tile = inactiveTiles[i];
    const card = document.createElement("div");
    card.className = "reserve-card";
    const offset = offsets[i] || offsets[offsets.length - 1];
    card.style.setProperty("--dx", `${offset.x}px`);
    card.style.setProperty("--dy", `${offset.y}px`);
    card.style.setProperty("--rot", `${offset.rot}deg`);
    card.style.setProperty("--z", String(offset.z));
    card.style.setProperty("--scale", String(offset.scale ?? 1));

    const img = document.createElement("img");
    img.src = tile.src;
    img.alt = `${tile.id} (inactive)`;
    img.draggable = false;
    card.appendChild(img);
    card.appendChild(createReserveGuideOverlay(tile));
    reserveStack.appendChild(card);
  }
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
  const x = rect.width / 2;
  const y = rect.height / 2;
  positionTile(start, x, y);
  updateTileParent(start, board);
  start.placed = true;
  updateTileTransform(start);
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
  body.appendChild(createTileGuideOverlay(tile));
  tileEl.appendChild(body);
  tile.bodyDom = body;

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
    if (event.target.closest(".tile-controls")) return;
    event.preventDefault();
    selectTile(tile.id);
    beginDrag(tile, event);
  });

  tileEl.addEventListener("click", () => selectTile(tile.id));
  tileEl.addEventListener("mouseenter", () => {
    state.hoveredTileId = tile.id;
  });
  tileEl.addEventListener("mouseleave", () => {
    if (state.hoveredTileId === tile.id) state.hoveredTileId = null;
  });
  tileEl.addEventListener("dragstart", (event) => event.preventDefault());
  return tileEl;
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
  clearInvalidReturnTimer(tile);
  const boardRect = board.getBoundingClientRect();
  const workspaceRect = workspace.getBoundingClientRect();
  const startedFromBoard = tile.dom.parentElement === board;
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
    const parentRect =
      tile.dom.parentElement === board
        ? boardRect
        : tile.dom.parentElement === dragLayer
          ? workspaceRect
          : tile.dom.parentElement.getBoundingClientRect();

    const x = moveEvent.clientX - parentRect.left - tile.drag.offsetX;
    const y = moveEvent.clientY - parentRect.top - tile.drag.offsetY;

    if (tile.dom.parentElement === board) {
      positionTile(tile, clamp(x, 0, boardRect.width), clamp(y, 0, boardRect.height));
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
        positionTile(tile, TRAY_CENTER_X, TRAY_CENTER_Y);
        updateTileParent(tile, tile.traySlot);
        updateTileTransform(tile);
        setPlacementFeedback(tile, null);
        tile.drag = null;
        return;
      }

      const boardOffsetX = boardRect.left - workspaceRect.left;
      const boardOffsetY = boardRect.top - workspaceRect.top;
      const boardX = tile.x - boardOffsetX;
      const boardY = tile.y - boardOffsetY;
      updateTileParent(tile, board);
      positionTile(tile, clamp(boardX, 0, boardRect.width), clamp(boardY, 0, boardRect.height));
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

  let result = findBestContact(tile, placedTiles);
  let snapped = false;
  if (result.valid && result.match) {
    const correction = getMatchAlignmentCorrection(result.match);
    if (correction && (Math.abs(correction.dx) > 0.25 || Math.abs(correction.dy) > 0.25)) {
      positionTile(tile, tile.x + correction.dx, tile.y + correction.dy);
      updateTileTransform(tile);
      result = findBestContact(tile, placedTiles);
      snapped = true;
    }
  }
  if (!result.valid) {
    handleInvalidDrop(tile, placedTiles);
    return;
  }

  tile.placed = true;
  if (snapped) {
    setStatus(`Placed ${tile.id} with auto-snap (${result.count} point contacts).`);
  } else {
    setStatus(`Placed ${tile.id} with ${result.count} point contacts.`);
  }
  selectTile(null);
}

function rotateTile(tile, delta) {
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
  let best = {
    count: 0,
    other: null,
    match: null,
  };

  for (const other of otherTiles) {
    const match = getContactMatchDetails(tile, other);
    if (match.count > best.count) {
      best = {
        count: match.count,
        other,
        match,
      };
    }
  }

  const touchesBlockedAB = isTouchingMoltenEntranceBlockedPoints(tile);
  return {
    valid: best.count >= MIN_CONTACT_POINTS && !touchesBlockedAB,
    count: best.count,
    other: best.other,
    match: best.match,
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

  const candidates = [];
  for (let i = 0; i < aFaces.length; i += 1) {
    for (let j = 0; j < bFaces.length; j += 1) {
      const af = aFaces[i];
      const bf = bFaces[j];
      if (isBlockedContactFace(a, af) || isBlockedContactFace(b, bf)) continue;
      const normalDot = af.nx * bf.nx + af.ny * bf.ny;
      if (normalDot > OPPOSITE_NORMAL_THRESHOLD) continue;

      const tangentDot = Math.abs(af.tx * bf.tx + af.ty * bf.ty);
      if (tangentDot < FACE_TANGENT_ALIGNMENT) continue;

      const midpointDistance = Math.hypot(af.mx - bf.mx, af.my - bf.my);
      if (midpointDistance > threshold) continue;

      candidates.push({ i, j, midpointDistance, normalDot });
    }
  }

  candidates.sort((x, y) => x.midpointDistance - y.midpointDistance || x.normalDot - y.normalDot);

  const matchedPairs = getBestOrderedMatchedPairs(candidates, aFaces.length, bFaces.length);
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

  for (const start of byPair.values()) {
    for (const bStep of [1, -1]) {
      const seen = new Set([`${start.i}:${start.j}`]);
      const chain = [{ i: start.i, j: start.j }];
      let distance = start.midpointDistance;

      let ai = start.i;
      let bj = start.j;
      while (true) {
        ai = mod(ai + 1, aCount);
        bj = mod(bj + bStep, bCount);
        const key = `${ai}:${bj}`;
        const next = byPair.get(key);
        if (!next || seen.has(key)) break;
        seen.add(key);
        chain.push({ i: ai, j: bj });
        distance += next.midpointDistance;
      }

      ai = start.i;
      bj = start.j;
      while (true) {
        ai = mod(ai - 1, aCount);
        bj = mod(bj - bStep, bCount);
        const key = `${ai}:${bj}`;
        const next = byPair.get(key);
        if (!next || seen.has(key)) break;
        seen.add(key);
        chain.unshift({ i: ai, j: bj });
        distance += next.midpointDistance;
      }

      if (chain.length > bestChain.length || (chain.length === bestChain.length && distance < bestDistance)) {
        bestChain = chain;
        bestDistance = distance;
      }
    }
  }

  return bestChain;
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
  const overlaps = hasAnyOverlap(tile, otherTiles);
  positionTile(tile, oldX, oldY);
  return {
    valid: contact.valid,
    count: contact.count,
    overlaps,
  };
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

function isWorldPointOnOpaquePixel(tile, wx, wy, radius = 0) {
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
      if (alpha >= 24) return true;
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
  tile.rotation = randomTrayRotation();
  positionTile(tile, TRAY_CENTER_X, TRAY_CENTER_Y);
  updateTileParent(tile, tile.traySlot);
  updateTileTransform(tile);
  selectTile(null);
  setPlacementFeedback(tile, null);
  setStatus(message, warn);
}

function handleInvalidDrop(tile, placedTiles) {
  clearInvalidReturnTimer(tile);
  tile.placed = false;
  moveAwayFromPlacedTiles(tile, placedTiles);
  updateTileParent(tile, board);
  updateTileTransform(tile);
  selectTile(null);
  setPlacementFeedback(tile, false);
  setStatus(
    `Invalid placement: this tile needs at least ${MIN_CONTACT_POINTS} point contacts. Returning to tray in 10s.`,
    true,
  );

  tile.invalidReturnTimer = setTimeout(() => {
    tile.invalidReturnTimer = null;
    if (tile.placed) return;
    tile.rotation = randomTrayRotation();
    positionTile(tile, TRAY_CENTER_X, TRAY_CENTER_Y);
    updateTileParent(tile, tile.traySlot);
    updateTileTransform(tile);
    selectTile(null);
    setPlacementFeedback(tile, null);
    setStatus(`${tile.id} returned to tray after invalid placement.`, true);
  }, INVALID_RETURN_DELAY_MS);
}

function moveAwayFromPlacedTiles(tile, placedTiles) {
  if (!placedTiles.length) return;
  let nearest = placedTiles[0];
  let bestDist = Infinity;
  for (const other of placedTiles) {
    const d = Math.hypot(tile.x - other.x, tile.y - other.y);
    if (d < bestDist) {
      bestDist = d;
      nearest = other;
    }
  }

  const boardRect = board.getBoundingClientRect();
  let vx = tile.x - nearest.x;
  let vy = tile.y - nearest.y;
  let vLen = Math.hypot(vx, vy);
  if (vLen < 1e-6) {
    vx = tile.x - boardRect.width / 2;
    vy = tile.y - boardRect.height / 2;
    vLen = Math.hypot(vx, vy) || 1;
  }

  const nx = vx / vLen;
  const ny = vy / vLen;
  positionTile(
    tile,
    clamp(tile.x + nx * INVALID_DROP_PUSH_PX, 0, boardRect.width),
    clamp(tile.y + ny * INVALID_DROP_PUSH_PX, 0, boardRect.height),
  );
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

function updateTileParent(tile, parent) {
  if (tile.dom.parentElement !== parent) {
    parent.appendChild(tile.dom);
  }
}

function updateTileTransform(tile) {
  if (!tile.dom) return;
  tile.dom.style.left = `${tile.x}px`;
  tile.dom.style.top = `${tile.y}px`;
  tile.dom.style.transform = "translate(-50%, -50%)";
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

function randomTrayRotation() {
  const steps = Math.floor(360 / ROTATION_STEP);
  return Math.floor(Math.random() * steps) * ROTATION_STEP;
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
  const polyA = getWorldPolygon(tile);
  for (const other of otherTiles) {
    const polyB = getWorldPolygon(other);
    if (polygonsOverlap(polyA, polyB)) return true;
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
    setPlacementFeedback(tile, false);
    return;
  }

  const placedTiles = getPlacedTiles().filter((t) => t.id !== tile.id);
  if (placedTiles.length === 0) {
    setPlacementFeedback(tile, false);
    return;
  }

  const boardOffsetX = boardRect.left - workspaceRect.left;
  const boardOffsetY = boardRect.top - workspaceRect.top;
  const candidateX =
    tile.dom.parentElement === board ? tile.x : tile.x - boardOffsetX;
  const candidateY =
    tile.dom.parentElement === board ? tile.y : tile.y - boardOffsetY;

  const result = evaluatePlacementAt(tile, placedTiles, candidateX, candidateY);
  setPlacementFeedback(tile, result.valid);
}

function setPlacementFeedback(tile, isValid) {
  if (!tile.dom) return;
  tile.dom.classList.remove("valid-placement", "invalid-placement");
  if (isValid === true) tile.dom.classList.add("valid-placement");
  if (isValid === false) tile.dom.classList.add("invalid-placement");
}
