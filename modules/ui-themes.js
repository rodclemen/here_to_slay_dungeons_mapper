export const UI_THEME_STORAGE_KEY = "hts_ui_theme_v1";
export const APPEARANCE_MODE_STORAGE_KEY = "hts_appearance_mode_v1";
export const LAST_LIGHT_UI_THEME_STORAGE_KEY = "hts_last_light_ui_theme_v1";
export const LAST_DARK_UI_THEME_STORAGE_KEY = "hts_last_dark_ui_theme_v1";
export const AUTO_THEME_BY_TILE_SET_STORAGE_KEY = "hts_auto_theme_by_tile_set_v1";

export const DEFAULT_UI_THEME_ID = "molten";
export const DEFAULT_LIGHT_THEME = "molten";
export const DEFAULT_DARK_THEME = "overgrown_dark";

export const UI_THEME_CATALOG = [
  { id: "molten", label: "Molten - Light", mode: "light", className: "ui-theme-molten" },
  { id: "overgrown", label: "Overgrown - Light", mode: "light", className: "ui-theme-overgrown" },
  { id: "dreamscape", label: "Dreamscape - Light", mode: "light", className: "ui-theme-dreamscape" },
  { id: "nightmare", label: "Nightmare - Light", mode: "light", className: "ui-theme-nightmare" },
  { id: "submerged", label: "Submerged - Light", mode: "light", className: "ui-theme-submerged" },
  { id: "deep_freeze", label: "Deep Freeze - Light", mode: "light", className: "ui-theme-deep-freeze" },
  { id: "molten_dark", label: "Molten - Dark", mode: "dark", className: "ui-theme-molten-dark" },
  { id: "overgrown_dark", label: "Overgrown - Dark", mode: "dark", className: "ui-theme-overgrown-dark" },
  { id: "dreamscape_dark", label: "Dreamscape - Dark", mode: "dark", className: "ui-theme-dreamscape-dark" },
  { id: "nightmare_dark", label: "Nightmare - Dark", mode: "dark", className: "ui-theme-nightmare-dark" },
  { id: "submerged_dark", label: "Submerged - Dark", mode: "dark", className: "ui-theme-submerged-dark" },
  { id: "deep_freeze_dark", label: "Deep Freeze - Dark", mode: "dark", className: "ui-theme-deep-freeze-dark" },
];

export const UI_THEME_IDS = new Set(UI_THEME_CATALOG.map((theme) => theme.id));

export function getUiThemeById(uiThemeId) {
  return UI_THEME_CATALOG.find((theme) => theme.id === uiThemeId) || null;
}

export function isSupportedUiThemeId(uiThemeId) {
  return UI_THEME_IDS.has(uiThemeId);
}

export function sanitizeLightUiThemeId(uiThemeId) {
  if (uiThemeId === "current") return DEFAULT_UI_THEME_ID;
  const theme = getUiThemeById(uiThemeId);
  if (theme?.mode === "light") return theme.id;
  return DEFAULT_LIGHT_THEME;
}

export function sanitizeDarkUiThemeId(uiThemeId) {
  const theme = getUiThemeById(uiThemeId);
  if (theme?.mode === "dark") return theme.id;
  return DEFAULT_DARK_THEME;
}

export function getAppliedAboutPageThemeId(storage = globalThis.localStorage) {
  if (!storage) return null;
  const explicitTheme = storage.getItem(UI_THEME_STORAGE_KEY);
  if (isSupportedUiThemeId(explicitTheme)) return explicitTheme;

  const appearanceMode = storage.getItem(APPEARANCE_MODE_STORAGE_KEY);
  if (appearanceMode === "dark") {
    return sanitizeDarkUiThemeId(storage.getItem(LAST_DARK_UI_THEME_STORAGE_KEY));
  }
  if (appearanceMode === "light") {
    return sanitizeLightUiThemeId(storage.getItem(LAST_LIGHT_UI_THEME_STORAGE_KEY));
  }
  return null;
}

export function applyUiThemeClass(target, uiThemeId) {
  if (!target) return;
  for (const theme of UI_THEME_CATALOG) {
    target.classList.toggle(theme.className, theme.id === uiThemeId);
  }
}
