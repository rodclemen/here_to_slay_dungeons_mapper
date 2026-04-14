// Tileset selector UI helpers — status labels, dropdown population, open/close state.
// All functions accept `ctx` as last parameter (except getTileSetStatusSuffix which is pure).
// ctx is built by getTileSetSelectorCtx() in app.js.

export function getTileSetStatusSuffix(status) {
  if (status === "ready") return "";
  if (status === "assets_missing") return " - Assets Missing";
  if (status === "wall_data_missing") return " - Wall Data Missing";
  return " - Coming Soon";
}

export function getReadyTileSets(ctx) {
  return ctx.getTileSetRegistry().filter((tileSet) => tileSet.status === "ready");
}

export function hydrateTileSetSelector(ctx) {
  if (!ctx.tileSetSelect) return;
  ctx.tileSetSelect.innerHTML = "";
  for (const tileSet of ctx.getTileSetRegistry()) {
    const option = document.createElement("option");
    option.value = tileSet.id;
    option.disabled = tileSet.source === "custom" && tileSet.status !== "ready";
    option.textContent = `${tileSet.label}${getTileSetStatusSuffix(tileSet.status)}`;
    ctx.tileSetSelect.appendChild(option);
  }
  syncTileSetMenuOptions(ctx);
}

export function syncTileSetMenuOptions(ctx) {
  if (!ctx.tileSetDropdown) return;
  ctx.tileSetDropdown.innerHTML = "";
  for (const tileSet of ctx.getTileSetRegistry()) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "tile-set-option";
    item.dataset.tileSet = tileSet.id;
    item.textContent = `${tileSet.label}${getTileSetStatusSuffix(tileSet.status)}`;
    item.disabled = tileSet.source === "custom" && tileSet.status !== "ready";
    item.setAttribute("role", "menuitem");
    if (tileSet.id === ctx.state.selectedTileSetId) item.classList.add("is-current");
    ctx.tileSetDropdown.appendChild(item);
  }
}

export function setTileSetMenuOpen(open, ctx) {
  if (!ctx.tileSetDropdown || !ctx.selectedTileSetMenuTrigger) return;
  const shouldOpen = Boolean(open);
  ctx.tileSetDropdown.hidden = !shouldOpen;
  ctx.tileSetMenu?.classList.toggle("is-open", shouldOpen);
  ctx.selectedTileSetMenuTrigger?.setAttribute("aria-expanded", String(shouldOpen));
  if (!shouldOpen) {
    ctx.selectedTileSetMenuTrigger?.blur();
  }
}

export function closeHeaderMenus({ except = null } = {}, ctx) {
  if (except !== "tileSet") setTileSetMenuOpen(false, ctx);
  if (except !== "uiTheme") ctx.setUiThemeMenuOpen(false);
  if (except !== "appearanceMode") ctx.setAppearanceModeMenuOpen(false);
  if (except !== "quickActions") ctx.setQuickActionsMenuOpen(false);
}

export function isEventInsideHeaderMenu(target, ctx) {
  return Boolean(
    ctx.tileSetMenu?.contains(target)
    || ctx.selectedTileSetMenuTrigger?.contains(target)
    || ctx.uiThemeMenu?.contains(target)
    || ctx.appearanceModeMenu?.contains(target)
    || ctx.quickActionsMenu?.contains(target),
  );
}
