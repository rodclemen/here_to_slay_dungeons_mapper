// ── Theme Manager ───────────────────────────────────────────────────
// Appearance mode (light/dark/system), UI theme selection, auto-theme
// by tile set, and theme menu UI.  Extracted from app.js.
//
// Every function that needs app.js state or helpers receives a `ctx`
// object — same pattern as wall-editor-ui.js and tile-placement.js.
// ────────────────────────────────────────────────────────────────────

// ── Pure helpers (no ctx) ──────────────────────────────────────────

export function getAppearanceModeLabel(mode) {
  if (mode === "light") return "Light";
  if (mode === "dark") return "Dark";
  return "System";
}

export function getAppearanceModeMenuItemLabel(mode) {
  if (mode === "light") return "Light Mode";
  if (mode === "dark") return "Dark Mode";
  return "System";
}

export function getUiThemesForMode(mode, ctx) {
  if (mode !== "light" && mode !== "dark") return [...ctx.UI_THEME_CATALOG];
  return ctx.UI_THEME_CATALOG.filter((theme) => theme.mode === mode);
}

export function isSupportedUiThemeId(uiThemeId, ctx) {
  return ctx.UI_THEME_IDS.has(uiThemeId);
}

export function isDarkUiTheme(uiThemeId, ctx) {
  return ctx.getUiThemeById(uiThemeId)?.mode === "dark";
}

export function getUiThemeLabel(uiThemeId, ctx) {
  return ctx.getUiThemeById(uiThemeId)?.label || ctx.getUiThemeById(ctx.DEFAULT_UI_THEME_ID)?.label || "Molten - Light";
}

// ── Load / save ────────────────────────────────────────────────────

export function loadAppearanceMode(ctx) {
  try {
    const saved = localStorage.getItem(ctx.APPEARANCE_MODE_STORAGE_KEY);
    if (ctx.APPEARANCE_MODE_IDS.has(saved)) return saved;
  } catch (error) {
    console.warn("Could not load appearance mode preference.", error);
  }
  return ctx.DEFAULT_APPEARANCE_MODE;
}

export function saveAppearanceMode(mode, ctx) {
  void ctx.saveDataSetting(ctx.APPEARANCE_MODE_STORAGE_KEY, mode).catch((error) => {
    console.warn("Could not save appearance mode preference.", error);
  });
}

export function loadAutoThemeByTileSet(ctx) {
  try {
    const saved = localStorage.getItem(ctx.AUTO_THEME_BY_TILE_SET_STORAGE_KEY);
    if (saved == null) return true;
    if (saved === "true") return true;
    if (saved === "false") return false;
  } catch (error) {
    console.warn("Could not load auto theme preference.", error);
  }
  return true;
}

export function saveAutoThemeByTileSet(enabled, ctx) {
  void ctx.saveDataSetting(ctx.AUTO_THEME_BY_TILE_SET_STORAGE_KEY, Boolean(enabled)).catch((error) => {
    console.warn("Could not save auto theme preference.", error);
  });
}

export function loadUiThemeId(ctx) {
  try {
    const saved = localStorage.getItem(ctx.UI_THEME_STORAGE_KEY);
    if (saved === "current") return ctx.DEFAULT_UI_THEME_ID;
    if (isSupportedUiThemeId(saved, ctx)) return saved;
  } catch (error) {
    console.warn("Could not load UI theme preference.", error);
  }
  return ctx.DEFAULT_UI_THEME_ID;
}

export function loadLastLightUiThemeId(ctx) {
  try {
    const saved = localStorage.getItem(ctx.LAST_LIGHT_UI_THEME_STORAGE_KEY);
    if (saved === "current") return ctx.DEFAULT_UI_THEME_ID;
    const sanitized = ctx.sanitizeLightUiThemeId(saved);
    if (sanitized) return sanitized;
  } catch (error) {
    console.warn("Could not load light theme preference.", error);
  }
  return ctx.DEFAULT_UI_THEME_ID;
}

export function loadLastDarkUiThemeId(ctx) {
  try {
    const saved = localStorage.getItem(ctx.LAST_DARK_UI_THEME_STORAGE_KEY);
    const sanitized = ctx.sanitizeDarkUiThemeId(saved);
    if (sanitized) return sanitized;
  } catch (error) {
    console.warn("Could not load dark theme preference.", error);
  }
  return ctx.DEFAULT_DARK_THEME;
}

export function saveLastLightUiThemeId(uiThemeId, ctx) {
  void ctx.saveDataSetting(ctx.LAST_LIGHT_UI_THEME_STORAGE_KEY, ctx.sanitizeLightUiThemeId(uiThemeId)).catch((error) => {
    console.warn("Could not save light theme preference.", error);
  });
}

export function saveLastDarkUiThemeId(uiThemeId, ctx) {
  void ctx.saveDataSetting(ctx.LAST_DARK_UI_THEME_STORAGE_KEY, ctx.sanitizeDarkUiThemeId(uiThemeId)).catch((error) => {
    console.warn("Could not save dark theme preference.", error);
  });
}

export function saveUiThemeId(uiThemeId, ctx) {
  void ctx.saveDataSetting(ctx.UI_THEME_STORAGE_KEY, uiThemeId).catch((error) => {
    console.warn("Could not save UI theme preference.", error);
  });
}

// ── Theme resolution ───────────────────────────────────────────────

export function resolvePairedUiThemeIdForMode(uiThemeId, mode, ctx) {
  const baseThemeId = isDarkUiTheme(uiThemeId, ctx)
    ? uiThemeId.replace(/_dark$/, "")
    : uiThemeId;
  if (mode === "dark") {
    return ctx.sanitizeDarkUiThemeId(`${baseThemeId}_dark`);
  }
  if (mode === "light") {
    return ctx.sanitizeLightUiThemeId(baseThemeId);
  }
  return uiThemeId;
}

export function resolveUiThemeForAppearanceMode(mode, ctx) {
  if (mode === "dark") return ctx.sanitizeDarkUiThemeId(ctx.state.lastDarkUiThemeId || ctx.state.selectedUiThemeId);
  if (mode === "light") return ctx.sanitizeLightUiThemeId(ctx.state.lastLightUiThemeId || ctx.state.selectedUiThemeId);
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? ctx.sanitizeDarkUiThemeId(ctx.state.lastDarkUiThemeId || ctx.state.selectedUiThemeId)
    : ctx.sanitizeLightUiThemeId(ctx.state.lastLightUiThemeId || ctx.state.selectedUiThemeId);
}

// ── UI sync ────────────────────────────────────────────────────────

export function syncThemeControlVisibility(ctx) {
  const autoMode = Boolean(ctx.state.autoThemeByTileSet);
  if (autoMode) {
    setAppearanceModeMenuOpen(false, ctx);
    setUiThemeMenuOpen(false, ctx);
  }
  if (ctx.appearanceModeMenu) ctx.appearanceModeMenu.hidden = autoMode;
  if (ctx.uiThemeMenu) ctx.uiThemeMenu.hidden = autoMode;
}

export function syncAutoThemeToggleButton(ctx) {
  if (!ctx.autoThemeToggleBtn) return;
  ctx.autoThemeToggleBtn.textContent = ctx.state.autoThemeByTileSet ? "Auto Theme: On" : "Auto Theme: Off";
  ctx.autoThemeToggleBtn.setAttribute("aria-pressed", String(Boolean(ctx.state.autoThemeByTileSet)));
}

export function syncAppearanceModeMenu(mode, ctx) {
  if (!ctx.appearanceModeTrigger || !ctx.appearanceModeDropdown) return;
  const nextMode = ctx.APPEARANCE_MODE_IDS.has(mode) ? mode : ctx.DEFAULT_APPEARANCE_MODE;
  const nextLabel = getAppearanceModeLabel(nextMode);
  ctx.appearanceModeTrigger.innerHTML = ctx.APPEARANCE_MODE_ICON_SVG[nextMode] || ctx.APPEARANCE_MODE_ICON_SVG.system;
  ctx.appearanceModeTrigger.dataset.appearanceMode = nextMode;
  const triggerSvg = ctx.appearanceModeTrigger.querySelector("svg");
  if (triggerSvg) {
    const triggerIconSize = nextMode === "dark" ? 20 : 38;
    triggerSvg.setAttribute("width", String(triggerIconSize));
    triggerSvg.setAttribute("height", String(triggerIconSize));
    triggerSvg.style.width = `${triggerIconSize}px`;
    triggerSvg.style.height = `${triggerIconSize}px`;
  }
  ctx.appearanceModeTrigger.setAttribute("aria-label", `${nextLabel} Mode`);
  ctx.appearanceModeTrigger.setAttribute("title", `${nextLabel} Mode`);

  const remainingModes = ["light", "system", "dark"].filter((modeId) => modeId !== nextMode);
  ctx.appearanceModeDropdown.innerHTML = remainingModes
    .map((modeId) => {
      const label = getAppearanceModeMenuItemLabel(modeId);
      const icon = ctx.APPEARANCE_MODE_ICON_SVG[modeId] || "";
      return `<button class="appearance-mode-option" type="button" data-appearance-mode="${modeId}" role="menuitem" aria-label="${label}">${icon}<span>${label}</span></button>`;
    })
    .join("");
}

export function setAppearanceModeMenuOpen(open, ctx) {
  if (!ctx.appearanceModeDropdown || !ctx.appearanceModeTrigger) return;
  const shouldOpen = Boolean(open);
  ctx.appearanceModeDropdown.hidden = !shouldOpen;
  ctx.appearanceModeMenu?.classList.toggle("is-open", shouldOpen);
  ctx.appearanceModeTrigger.setAttribute("aria-expanded", String(shouldOpen));
  if (!shouldOpen) {
    ctx.appearanceModeTrigger.blur();
  }
}

export function setUiThemeMenuOpen(open, ctx) {
  if (!ctx.uiThemeDropdown || !ctx.uiThemeTrigger) return;
  const shouldOpen = Boolean(open);
  ctx.uiThemeDropdown.hidden = !shouldOpen;
  ctx.uiThemeMenu?.classList.toggle("is-open", shouldOpen);
  ctx.uiThemeTrigger.setAttribute("aria-expanded", String(shouldOpen));
  if (!shouldOpen) {
    ctx.uiThemeTrigger.blur();
  }
}

export function syncUiThemeMenuOptions(ctx) {
  if (!ctx.uiThemeDropdown || !ctx.uiThemeTrigger || !ctx.uiThemeSelect) return;
  const stripModeSuffix = (label) => label.replace(/\s*-\s*(Light|Dark)\s*$/i, "").trim();
  const options = Array.from(ctx.uiThemeSelect.options);
  ctx.uiThemeDropdown.innerHTML = options
    .map((option) => {
      const value = option.value;
      const label = stripModeSuffix(option.textContent || value);
      const selectedClass = value === ctx.state.selectedUiThemeId ? " is-selected" : "";
      return `<button class="ui-theme-option${selectedClass}" type="button" data-ui-theme="${value}" role="menuitemradio" aria-checked="${value === ctx.state.selectedUiThemeId ? "true" : "false"}">${label}</button>`;
    })
    .join("");
  const selectedLabel = stripModeSuffix(getUiThemeLabel(ctx.state.selectedUiThemeId, ctx));
  ctx.uiThemeTrigger.textContent = selectedLabel;
  ctx.uiThemeTrigger.setAttribute("title", selectedLabel);
  ctx.uiThemeTrigger.setAttribute("aria-label", `Theme: ${selectedLabel}`);
}

export function syncUiThemeSelectAvailability(mode, ctx) {
  if (!ctx.uiThemeSelect) return;
  if (!ctx.uiThemeOptionCatalog) {
    ctx.uiThemeOptionCatalog = ctx.UI_THEME_CATALOG.map((theme) => ({
      value: theme.id,
      label: theme.label,
    }));
  }
  const effectiveMode =
    mode === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : mode;
  const optionCatalog = ctx.uiThemeOptionCatalog;
  const selectedBefore = ctx.state.selectedUiThemeId;
  const allowedOptions = optionCatalog.filter((entry) => {
    const darkOption = isDarkUiTheme(entry.value, ctx);
    if (effectiveMode === "dark") return darkOption;
    if (effectiveMode === "light") return !darkOption;
    return true;
  });

  ctx.uiThemeSelect.innerHTML = "";
  for (const entry of allowedOptions) {
    const option = document.createElement("option");
    option.value = entry.value;
    option.textContent = entry.label;
    ctx.uiThemeSelect.appendChild(option);
  }

  if (allowedOptions.some((entry) => entry.value === selectedBefore)) {
    ctx.uiThemeSelect.value = selectedBefore;
  }
  syncUiThemeMenuOptions(ctx);
}

// ── Apply ──────────────────────────────────────────────────────────

export function applyUiTheme(uiThemeId, ctx) {
  for (const theme of ctx.UI_THEME_CATALOG) {
    document.body.classList.toggle(theme.className, theme.id === uiThemeId);
  }
  syncThemeColorMeta();
  ctx.scheduleBoardHexGridRender();
}

function syncThemeColorMeta() {
  requestAnimationFrame(() => {
    const bg = getComputedStyle(document.body).getPropertyValue("--bg").trim();
    if (!bg) return;
    for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
      meta.setAttribute("content", bg);
    }
  });
}

export function applyAppearanceMode(mode, ctx, { showStatus = true, save = true } = {}) {
  const nextMode = ctx.APPEARANCE_MODE_IDS.has(mode) ? mode : ctx.DEFAULT_APPEARANCE_MODE;
  const previousMode = ctx.state.selectedAppearanceMode;
  const previousThemeId = ctx.state.selectedUiThemeId;
  ctx.state.selectedAppearanceMode = nextMode;

  let resolvedUiThemeId = resolveUiThemeForAppearanceMode(nextMode, ctx);
  const changedToExplicitMode =
    (nextMode === "light" || nextMode === "dark") &&
    previousMode !== nextMode;
  if (changedToExplicitMode && previousThemeId) {
    resolvedUiThemeId = resolvePairedUiThemeIdForMode(previousThemeId, nextMode, ctx);
  }
  syncUiThemeSelectAvailability(nextMode, ctx);
  ctx.state.selectedUiThemeId = resolvedUiThemeId;
  if (isDarkUiTheme(resolvedUiThemeId, ctx)) {
    ctx.state.lastDarkUiThemeId = ctx.sanitizeDarkUiThemeId(resolvedUiThemeId);
    if (save) saveLastDarkUiThemeId(ctx.state.lastDarkUiThemeId, ctx);
  } else {
    ctx.state.lastLightUiThemeId = ctx.sanitizeLightUiThemeId(resolvedUiThemeId);
    if (save) saveLastLightUiThemeId(ctx.state.lastLightUiThemeId, ctx);
  }

  applyUiTheme(resolvedUiThemeId, ctx);
  if (ctx.uiThemeSelect) ctx.uiThemeSelect.value = resolvedUiThemeId;
  syncUiThemeMenuOptions(ctx);
  if (save) {
    saveUiThemeId(resolvedUiThemeId, ctx);
    saveAppearanceMode(nextMode, ctx);
  }
  if (showStatus) {
    ctx.setStatus(`Appearance mode: ${getAppearanceModeLabel(nextMode)}. Theme: ${getUiThemeLabel(resolvedUiThemeId, ctx)}.`);
  }
  syncAppearanceModeMenu(nextMode, ctx);
}

// ── Auto theme ─────────────────────────────────────────────────────

export function applyAutoThemeForTileSet(tileSetId, ctx, { save = true, showStatus = false } = {}) {
  const tileSet = ctx.getTileSetConfig(tileSetId);
  if (tileSet?.source === "custom") return;
  const baseThemeId = tileSet?.uiThemeId || ctx.DEFAULT_UI_THEME_ID;
  const linkedLightThemeId = ctx.sanitizeLightUiThemeId(baseThemeId);
  const linkedDarkThemeId = ctx.sanitizeDarkUiThemeId(`${linkedLightThemeId}_dark`);
  ctx.state.lastLightUiThemeId = linkedLightThemeId;
  ctx.state.lastDarkUiThemeId = linkedDarkThemeId;
  if (save) {
    saveLastLightUiThemeId(linkedLightThemeId, ctx);
    saveLastDarkUiThemeId(linkedDarkThemeId, ctx);
  }
  applyAppearanceMode(ctx.state.selectedAppearanceMode, ctx, { showStatus, save });
}

export function setAutoThemeByTileSet(enabled, ctx, { save = true, showStatus = true, applyNow = true } = {}) {
  ctx.state.autoThemeByTileSet = Boolean(enabled);
  syncAutoThemeToggleButton(ctx);
  syncThemeControlVisibility(ctx);
  if (ctx.state.autoThemeByTileSet && applyNow) {
    ctx.state.selectedAppearanceMode = "system";
    syncUiThemeSelectAvailability("system", ctx);
    syncAppearanceModeMenu("system", ctx);
    if (save) saveAppearanceMode("system", ctx);
    applyAutoThemeForTileSet(ctx.state.selectedTileSetId, ctx, { save, showStatus: false });
  }
  if (save) saveAutoThemeByTileSet(ctx.state.autoThemeByTileSet, ctx);
  if (showStatus) {
    ctx.setStatus(
      ctx.state.autoThemeByTileSet
        ? "Auto Theme: ON (theme follows tile set; appearance mode set to System)."
        : "Auto Theme: OFF (manual theme controls enabled).",
    );
  }
}

export function applyFeedbackMode(useFaceFeedback) {
  document.body.classList.toggle("feedback-legacy", !useFaceFeedback);
}
