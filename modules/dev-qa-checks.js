export const DEV_QA_CHECK_DEFINITIONS = [
  { id: "auto_build", label: "Auto Build", category: "Build View" },
  { id: "reroll_tiles", label: "Reroll Tiles", category: "Build View" },
  { id: "reset_tiles_and_bosses", label: "Reset Tiles + Boss Cards", category: "Build View" },
  { id: "tile_set_change", label: "Change Tile Set", category: "Build View" },
  { id: "copy_share_link", label: "Copy Share Link", category: "Build View" },
  { id: "export_pdf", label: "Export PDF", category: "Build View" },
  { id: "drag_tile_to_board", label: "Drag Tile To Board", category: "Interactions" },
  { id: "zoom_board", label: "Zoom Board", category: "Interactions" },
  { id: "compact_mode", label: "Compact Mode Triggered", category: "Interactions" },
  { id: "toggle_tile_editor", label: "Toggle Tile Editor", category: "Editor + Custom" },
  { id: "add_custom_tileset", label: "Add Custom Tile Set", category: "Editor + Custom" },
  { id: "import_custom_tileset", label: "Import Custom Tileset", category: "Editor + Custom" },
  { id: "export_all_custom_tilesets", label: "Export All Custom Tile Sets", category: "Editor + Custom" },
  { id: "show_numbers_toggle", label: "Toggle Show Numbers", category: "Settings" },
  { id: "show_walls_toggle", label: "Toggle Show Walls", category: "Settings" },
  { id: "show_portal_flags_toggle", label: "Toggle Show Portals", category: "Settings" },
  { id: "ignore_contact_toggle", label: "Toggle Ignore 4-Point Rule", category: "Settings" },
  { id: "face_feedback_toggle", label: "Toggle Placement Feedback", category: "Settings" },
  { id: "boss_selection_mode_cycle", label: "Cycle Boss Selection", category: "Settings" },
  { id: "ui_theme_change", label: "Change UI Theme", category: "Settings" },
  { id: "appearance_mode_change", label: "Change Appearance Mode", category: "Settings" },
  { id: "auto_theme_toggle", label: "Toggle Auto Theme", category: "Settings" },
];

const DEV_QA_STORAGE_KEY = "hts_dev_qa_checks_v1";
const DEV_QA_CHANNEL_NAME = "hts-dev-qa-checks";
const DEV_QA_VERSION = 1;
const CHECK_ID_SET = new Set(DEV_QA_CHECK_DEFINITIONS.map((entry) => entry.id));

function hasWindowContext() {
  return typeof window !== "undefined";
}

function buildEmptyProgress() {
  return {
    version: DEV_QA_VERSION,
    updatedAt: "",
    checks: {},
  };
}

function sanitizeProgress(value) {
  const next = buildEmptyProgress();
  if (!value || typeof value !== "object") return next;
  next.updatedAt = typeof value.updatedAt === "string" ? value.updatedAt : "";
  const sourceChecks = value.checks && typeof value.checks === "object" ? value.checks : {};
  for (const id of CHECK_ID_SET) {
    const entry = sourceChecks[id];
    if (!entry || typeof entry !== "object") continue;
    const count = Number(entry.count);
    const lastAt = typeof entry.lastAt === "string" ? entry.lastAt : "";
    const lastDetail = typeof entry.lastDetail === "string" ? entry.lastDetail : "";
    if (!Number.isFinite(count) || count <= 0) continue;
    next.checks[id] = {
      count: Math.max(1, Math.floor(count)),
      lastAt,
      lastDetail,
    };
  }
  return next;
}

function readStoredProgress() {
  if (!hasWindowContext()) return buildEmptyProgress();
  try {
    const raw = window.localStorage.getItem(DEV_QA_STORAGE_KEY);
    if (!raw) return buildEmptyProgress();
    return sanitizeProgress(JSON.parse(raw));
  } catch {
    return buildEmptyProgress();
  }
}

function getBroadcastChannel() {
  if (!hasWindowContext()) return null;
  if (!("BroadcastChannel" in window)) return null;
  if (!window.__HTS_DEV_QA_CHANNEL__) {
    window.__HTS_DEV_QA_CHANNEL__ = new BroadcastChannel(DEV_QA_CHANNEL_NAME);
  }
  return window.__HTS_DEV_QA_CHANNEL__;
}

function writeStoredProgress(progress, eventType = "update") {
  const sanitized = sanitizeProgress(progress);
  sanitized.updatedAt = new Date().toISOString();
  if (!hasWindowContext()) return sanitized;
  try {
    window.localStorage.setItem(DEV_QA_STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // Ignore storage write failures in restricted/private contexts.
  }
  const channel = getBroadcastChannel();
  if (channel) {
    channel.postMessage({
      type: eventType,
      progress: sanitized,
    });
  }
  return sanitized;
}

export function getDevQaProgress() {
  return readStoredProgress();
}

export function markDevQaCheck(id, options = {}) {
  const checkId = String(id || "").trim();
  if (!CHECK_ID_SET.has(checkId)) return getDevQaProgress();
  const progress = readStoredProgress();
  const existing = progress.checks[checkId] || {
    count: 0,
    lastAt: "",
    lastDetail: "",
  };
  progress.checks[checkId] = {
    count: existing.count + 1,
    lastAt: new Date().toISOString(),
    lastDetail: typeof options.detail === "string" ? options.detail.slice(0, 140) : (existing.lastDetail || ""),
  };
  return writeStoredProgress(progress, "mark");
}

export function resetDevQaChecks() {
  return writeStoredProgress(buildEmptyProgress(), "reset");
}

export function subscribeDevQaChecks(listener) {
  if (typeof listener !== "function") return () => {};
  if (!hasWindowContext()) {
    listener(buildEmptyProgress());
    return () => {};
  }

  const emit = (progress = readStoredProgress()) => {
    listener(sanitizeProgress(progress));
  };

  const handleStorage = (event) => {
    if (event.key !== DEV_QA_STORAGE_KEY) return;
    emit(readStoredProgress());
  };
  window.addEventListener("storage", handleStorage);

  const channel = getBroadcastChannel();
  const handleChannel = (event) => {
    emit(event?.data?.progress);
  };
  if (channel) channel.addEventListener("message", handleChannel);

  emit(readStoredProgress());
  return () => {
    window.removeEventListener("storage", handleStorage);
    if (channel) channel.removeEventListener("message", handleChannel);
  };
}
