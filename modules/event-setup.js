export function bindGlobalControls(ctx) {
  const {
    state,
    localDataNoticeDismissBtn,
    dismissLocalDataNotice,
    localDataNoticeActionBtn,
    openTileEditorForLocalExport,
    exportCustomTileSet,
    setStatus,
    exportWallOverridesBackup,
    autoBuildBtn,
    markDevQaCheck,
    triggerDiceSpin,
    runAutoBuild,
    rerollBtn,
    rerollTrayTiles,
    resetAllBtn,
    triggerResetSpin,
    resetTilesAndBossCards,
    copyShareLinkBtn,
    copyShareLayoutLink,
    exportPdfBtn,
    exportCurrentLayoutPdf,
    chooseDataFolderRow,
    getStoredDataFolderPath,
    chooseDataFolder,
    syncChooseDataFolderAction,
    finalizeDataFolderSelection,
    requestDataFolderDialog,
    resetToDefaultDataFolder,
    openDebugLogBtn,
    toggleDebugConsole,
    debugConsoleCopyBtn,
    copyDebugConsole,
    nativeConsole,
    debugConsoleClearBtn,
    clearDebugConsole,
    debugConsoleCloseBtn,
    closeDebugConsole,
    toggleLabelsCheckbox,
    saveDataSetting,
    SHOW_GUIDE_LABELS_STORAGE_KEY,
    toggleWallsCheckbox,
    SHOW_WALL_FACES_STORAGE_KEY,
    togglePortalFlagsCheckbox,
    syncTilePortalFlag,
    SHOW_PORTAL_FLAGS_STORAGE_KEY,
    toggleIgnoreContactCheckbox,
    clearInvalidReturnTimer,
    setPlacementFeedback,
    IGNORE_CONTACT_RULE_STORAGE_KEY,
    toggleHalfBoardCheckbox,
    HALF_BOARD_BUILD_STORAGE_KEY,
    toggleFaceFeedbackCheckbox,
    applyFeedbackMode,
    USE_FACE_FEEDBACK_STORAGE_KEY,
    toggleAllBossesCheckbox,
    scheduleRender,
    syncBossTileSetHeading,
    USE_ALL_BOSSES_STORAGE_KEY,
    resetTilePointsBtn,
    resetGuidePointTemplatesForActiveEditorTileSet,
    closeAdvancedMenuForElement,
    importCustomTileSetInput,
    importCustomTileSetPackage,
    toggleWallEditBtn,
    setWallEditMode,
    clearTileWallsBtn,
    getActiveTileForWallEditing,
    persistTileWallFaces,
    refreshTileWallGuide,
    getTileDisplayLabel,
    getTileSetConfig,
    tileSetSelect,
    setTileSetMenuOpen,
    runTileSetCrossfade,
    applyTileSet,
    syncTileSetMenuOptions,
    selectedTileSetMenuTrigger,
    tileSetDropdown,
    DEFAULT_TILE_SET_ID,
    uiThemeSelect,
    DEFAULT_UI_THEME_ID,
    isDarkUiTheme,
    sanitizeDarkUiThemeId,
    saveLastDarkUiThemeId,
    sanitizeLightUiThemeId,
    saveLastLightUiThemeId,
    applyAppearanceMode,
    uiThemeTrigger,
    uiThemeDropdown,
    setUiThemeMenuOpen,
    appearanceModeTrigger,
    appearanceModeDropdown,
    DEFAULT_APPEARANCE_MODE,
    setAppearanceModeMenuOpen,
    quickActionsTrigger,
    quickActionsDropdown,
    setQuickActionsMenuOpen,
    autoThemeToggleBtn,
    syncAutoThemeToggleButton,
    setAutoThemeByTileSet,
    exportWallDataBtn,
    importWallDataBtn,
    importWallDataInput,
    importWallOverridesBackup,
    copyGuideTemplateBtn,
    copyGuidePointTemplateExport,
    reserveEditCheckbox,
    updateModeIndicators,
    randomizeCurrentInactiveReserveOrder,
    clearPendingReserveSwap,
    renderReservePile,
    reservePile,
    isClickInTopRightCloseHit,
    toggleLeftDrawerBtn,
    applyDrawerCollapseState,
    toggleRightDrawerBtn,
    bossRandomBtn,
    spawnRandomBossAtReferenceTopMagnet,
    closeHeaderMenus,
    isEventInsideHeaderMenu,
    board,
    clamp,
    BOARD_WHEEL_ZOOM_SENSITIVITY,
    zoomBoardAtPoint,
    updateCompactSidePanelMode,
    recenterTrayAndReserveTiles,
    scheduleBoardHexGridRender,
    scheduleBoardAutoCenterOnViewportResize,
    initAutoBuildTuningPanel,
    rotateTile,
    ROTATION_STEP,
    resetBoardView,
    toggleBothDrawers,
  } = ctx;

  if (localDataNoticeDismissBtn) {
    localDataNoticeDismissBtn.addEventListener("click", () => {
      dismissLocalDataNotice();
    });
  }
  if (localDataNoticeActionBtn) {
    localDataNoticeActionBtn.addEventListener("click", async () => {
      const action = ctx.localDataNoticeActionContext;
      if (!action?.type) return;
      if (action.type === "open_tile_editor_export") {
        openTileEditorForLocalExport(action.tileSetId);
        return;
      }
      if (action.type === "export_custom_tile_set" && action.tileSetId) {
        try {
          await exportCustomTileSet(action.tileSetId);
        } catch (error) {
          console.error(error);
          setStatus(error?.message || "Could not export custom tile set.", true);
        }
        return;
      }
      if (action.type === "export_debug_walls") {
        exportWallOverridesBackup();
      }
    });
  }
  if (autoBuildBtn) {
    autoBuildBtn.addEventListener("click", () => {
      markDevQaCheck("auto_build");
      triggerDiceSpin(autoBuildBtn);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          runAutoBuild();
        });
      });
    });
  }
  rerollBtn.addEventListener("click", () => {
    markDevQaCheck("reroll_tiles");
    rerollTrayTiles();
  });
  if (resetAllBtn) {
    resetAllBtn.addEventListener("click", () => {
      markDevQaCheck("reset_tiles_and_bosses");
      triggerResetSpin(resetAllBtn);
      resetTilesAndBossCards();
    });
  }
  if (copyShareLinkBtn) {
    copyShareLinkBtn.addEventListener("click", () => {
      copyShareLayoutLink();
    });
  }
  if (exportPdfBtn) {
    exportPdfBtn.addEventListener("click", () => {
      markDevQaCheck("export_pdf");
      exportCurrentLayoutPdf();
    });
  }
  if (chooseDataFolderRow) {
    chooseDataFolderRow.addEventListener("click", async (event) => {
      event.preventDefault();
      const isEnabled = typeof window.__TAURI__?.core?.invoke === "function";
      if (!isEnabled) return;
      try {
        const currentPath = getStoredDataFolderPath();
        const { action } = await requestDataFolderDialog(currentPath);
        if (action === "cancel") return;
        if (action === "default") {
          await resetToDefaultDataFolder();
          return;
        }
        const selectedPath = await chooseDataFolder(currentPath, { persist: false });
        if (!selectedPath) {
          setStatus("Choose Data Folder canceled.");
          return;
        }
        syncChooseDataFolderAction();
        await finalizeDataFolderSelection(selectedPath);
      } catch (error) {
        console.error(error);
        setStatus(error?.message || "Could not choose a data folder.", true);
      }
    });
  }
  if (openDebugLogBtn) {
    openDebugLogBtn.addEventListener("click", () => {
      toggleDebugConsole();
    });
  }
  if (debugConsoleCopyBtn) {
    debugConsoleCopyBtn.addEventListener("click", () => {
      copyDebugConsole().catch((error) => {
        nativeConsole.warn("Could not copy debug log.", error);
        setStatus("Could not copy debug log.", true);
      });
    });
  }
  if (debugConsoleClearBtn) {
    debugConsoleClearBtn.addEventListener("click", () => {
      clearDebugConsole();
    });
  }
  if (debugConsoleCloseBtn) {
    debugConsoleCloseBtn.addEventListener("click", () => {
      closeDebugConsole();
    });
  }
  if (toggleLabelsCheckbox) {
    toggleLabelsCheckbox.checked = state.showGuideLabels;
    toggleLabelsCheckbox.addEventListener("change", () => {
      markDevQaCheck("show_numbers_toggle");
      state.showGuideLabels = toggleLabelsCheckbox.checked;
      document.body.classList.toggle("show-guide-labels", state.showGuideLabels);
      void saveDataSetting(SHOW_GUIDE_LABELS_STORAGE_KEY, state.showGuideLabels);
    });
  }
  if (toggleWallsCheckbox) {
    toggleWallsCheckbox.checked = state.showWallFaces;
    toggleWallsCheckbox.addEventListener("change", () => {
      markDevQaCheck("show_walls_toggle");
      state.showWallFaces = toggleWallsCheckbox.checked;
      document.body.classList.toggle("show-wall-faces", state.showWallFaces);
      void saveDataSetting(SHOW_WALL_FACES_STORAGE_KEY, state.showWallFaces);
    });
  }
  if (togglePortalFlagsCheckbox) {
    togglePortalFlagsCheckbox.checked = state.showPortalFlags;
    togglePortalFlagsCheckbox.addEventListener("change", () => {
      markDevQaCheck("show_portal_flags_toggle");
      state.showPortalFlags = togglePortalFlagsCheckbox.checked;
      document.body.classList.toggle("show-portal-flags", state.showPortalFlags);
      for (const tile of state.tiles.values()) {
        syncTilePortalFlag(tile);
      }
      void saveDataSetting(SHOW_PORTAL_FLAGS_STORAGE_KEY, state.showPortalFlags);
    });
  }
  if (toggleIgnoreContactCheckbox) {
    toggleIgnoreContactCheckbox.checked = state.ignoreContactRule;
    toggleIgnoreContactCheckbox.addEventListener("change", () => {
      markDevQaCheck("ignore_contact_toggle");
      state.ignoreContactRule = toggleIgnoreContactCheckbox.checked;
      if (state.ignoreContactRule) {
        for (const tile of state.tiles.values()) {
          clearInvalidReturnTimer(tile);
          if (tile.placed) setPlacementFeedback(tile, null);
        }
      }
      setStatus(
        state.ignoreContactRule
          ? "Ignore 2 face connection rule: ON (placement allowed without minimum contact)."
          : "Ignore 2 face connection rule: OFF.",
      );
      void saveDataSetting(IGNORE_CONTACT_RULE_STORAGE_KEY, state.ignoreContactRule);
    });
  }
  if (toggleHalfBoardCheckbox) {
    toggleHalfBoardCheckbox.checked = state.halfBoardBuild;
    toggleHalfBoardCheckbox.addEventListener("change", () => {
      state.halfBoardBuild = toggleHalfBoardCheckbox.checked;
      setStatus(
        state.halfBoardBuild
          ? "Auto Build: Default Mode ON (dungeon stays in the lower part of the board)."
          : "Auto Build: Default Mode OFF (dungeon can expand in any direction).",
      );
      void saveDataSetting(HALF_BOARD_BUILD_STORAGE_KEY, state.halfBoardBuild);
    });
  }
  if (toggleFaceFeedbackCheckbox) {
    toggleFaceFeedbackCheckbox.checked = state.useFaceFeedback;
    toggleFaceFeedbackCheckbox.addEventListener("change", () => {
      markDevQaCheck("face_feedback_toggle");
      state.useFaceFeedback = toggleFaceFeedbackCheckbox.checked;
      applyFeedbackMode(state.useFaceFeedback);
      setStatus(
        state.useFaceFeedback
          ? "Placement feedback: Faces ON."
          : "Placement feedback: Faces OFF (classic full outline).",
      );
      void saveDataSetting(USE_FACE_FEEDBACK_STORAGE_KEY, state.useFaceFeedback);
    });
  }
  if (toggleAllBossesCheckbox) {
    toggleAllBossesCheckbox.checked = state.useAllBosses;
    toggleAllBossesCheckbox.addEventListener("change", () => {
      markDevQaCheck("all_bosses_toggle");
      state.useAllBosses = toggleAllBossesCheckbox.checked;
      scheduleRender("bossPile");
      syncBossTileSetHeading();
      setStatus(
        state.useAllBosses
          ? "Random Boss: All Sets ON."
          : "Random Boss: All Sets OFF (current tile set only).",
      );
      void saveDataSetting(USE_ALL_BOSSES_STORAGE_KEY, state.useAllBosses);
    });
  }
  if (resetTilePointsBtn) {
    resetTilePointsBtn.addEventListener("click", () => {
      resetGuidePointTemplatesForActiveEditorTileSet().catch((error) => {
        console.error(error);
        setStatus("Could not reset tile points.", true);
      });
      closeAdvancedMenuForElement(resetTilePointsBtn);
    });
  }
  if (importCustomTileSetInput) {
    importCustomTileSetInput.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      try {
        await importCustomTileSetPackage(file);
      } catch (error) {
        console.error(error);
        setStatus(error?.message || "Could not import custom tileset.", true);
      }
    });
  }
  if (toggleWallEditBtn) {
    toggleWallEditBtn.addEventListener("click", () => {
      markDevQaCheck("toggle_tile_editor");
      setWallEditMode(!state.wallEditMode);
      closeAdvancedMenuForElement(toggleWallEditBtn);
    });
  }
  if (clearTileWallsBtn) {
    clearTileWallsBtn.addEventListener("click", () => {
      if (!state.wallEditMode) {
        setStatus("Clear Tile Walls is available only in Tile Editor.", true);
        closeAdvancedMenuForElement(clearTileWallsBtn);
        return;
      }
      const active = getActiveTileForWallEditing();
      if (!active) {
        setStatus("Select or hover a tile to clear its wall faces.", true);
        closeAdvancedMenuForElement(clearTileWallsBtn);
        return;
      }
      const { tileSetId, tile } = active;
      tile.wallFaceSet.clear();
      persistTileWallFaces(tileSetId, tile.tileId, tile.wallFaceSet);
      refreshTileWallGuide(tile);
      setStatus(`Cleared wall faces for ${getTileDisplayLabel(tile.tileId)} (${getTileSetConfig(tileSetId).label}).`);
      closeAdvancedMenuForElement(clearTileWallsBtn);
    });
  }
  if (tileSetSelect) {
    tileSetSelect.addEventListener("change", async (event) => {
      const nextTileSetId = event.target.value;
      if (nextTileSetId === state.selectedTileSetId) {
        setTileSetMenuOpen(false);
        return;
      }
      await runTileSetCrossfade(() => applyTileSet(nextTileSetId, true));
      markDevQaCheck("tile_set_change", { detail: nextTileSetId });
      syncTileSetMenuOptions();
      setTileSetMenuOpen(false);
    });
  }
  if (selectedTileSetMenuTrigger && tileSetDropdown) {
    selectedTileSetMenuTrigger.addEventListener("click", () => {
      closeHeaderMenus({ except: "tileSet" });
      const shouldOpen = tileSetDropdown.hidden;
      setTileSetMenuOpen(shouldOpen);
    });
    tileSetDropdown.addEventListener("click", (event) => {
      const option = event.target.closest("[data-tile-set]");
      if (!option || option.disabled) return;
      const nextTileSetId = option.dataset.tileSet || DEFAULT_TILE_SET_ID;
      if (nextTileSetId === state.selectedTileSetId) {
        setTileSetMenuOpen(false);
        return;
      }
      if (tileSetSelect) tileSetSelect.value = nextTileSetId;
      void runTileSetCrossfade(() => applyTileSet(nextTileSetId, true));
      markDevQaCheck("tile_set_change", { detail: nextTileSetId });
      syncTileSetMenuOptions();
      setTileSetMenuOpen(false);
    });
  }
  if (uiThemeSelect) {
    uiThemeSelect.addEventListener("change", (event) => {
      const nextUiThemeId = event.target.value || DEFAULT_UI_THEME_ID;
      markDevQaCheck("ui_theme_change", { detail: nextUiThemeId });
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
      closeHeaderMenus({ except: "uiTheme" });
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
  }
  if (appearanceModeTrigger && appearanceModeDropdown) {
    appearanceModeTrigger.addEventListener("click", () => {
      closeHeaderMenus({ except: "appearanceMode" });
      const shouldOpen = appearanceModeDropdown.hidden;
      setAppearanceModeMenuOpen(shouldOpen);
    });
    appearanceModeDropdown.addEventListener("click", (event) => {
      const modeOption = event.target.closest("[data-appearance-mode]");
      if (modeOption) {
        const nextMode = modeOption.dataset.appearanceMode || DEFAULT_APPEARANCE_MODE;
        markDevQaCheck("appearance_mode_change", { detail: nextMode });
        applyAppearanceMode(nextMode);
        setAppearanceModeMenuOpen(false);
        return;
      }
      const themeOption = event.target.closest("[data-ui-theme]");
      if (themeOption) {
        const nextUiThemeId = themeOption.dataset.uiTheme || DEFAULT_UI_THEME_ID;
        uiThemeSelect.value = nextUiThemeId;
        uiThemeSelect.dispatchEvent(new Event("change", { bubbles: true }));
        setAppearanceModeMenuOpen(false);
      }
    });
  }
  if (quickActionsTrigger && quickActionsDropdown) {
    quickActionsTrigger.addEventListener("click", () => {
      closeHeaderMenus({ except: "quickActions" });
      const shouldOpen = quickActionsDropdown.hidden;
      setQuickActionsMenuOpen(shouldOpen);
    });
    quickActionsDropdown.addEventListener("click", (event) => {
      if (!event.target.closest(".quick-action-option")) return;
      setQuickActionsMenuOpen(false);
    });
  }
  if (autoThemeToggleBtn) {
    syncAutoThemeToggleButton();
    autoThemeToggleBtn.addEventListener("click", () => {
      markDevQaCheck("auto_theme_toggle");
      setAutoThemeByTileSet(!state.autoThemeByTileSet, {
        save: true,
        showStatus: true,
        applyNow: true,
      });
    });
  }
  if (exportWallDataBtn) {
    exportWallDataBtn.addEventListener("click", () => {
      if (!state.wallEditMode) {
        setStatus("Export Debug Walls JSON is available only in Tile Editor.", true);
        closeAdvancedMenuForElement(exportWallDataBtn);
        return;
      }
      exportWallOverridesBackup();
      closeAdvancedMenuForElement(exportWallDataBtn);
    });
  }
  if (importWallDataBtn && importWallDataInput) {
    importWallDataBtn.addEventListener("click", () => {
      if (!state.wallEditMode) {
        setStatus("Import Debug Walls JSON is available only in Tile Editor.", true);
        closeAdvancedMenuForElement(importWallDataBtn);
        return;
      }
      importWallDataInput.click();
      closeAdvancedMenuForElement(importWallDataBtn);
    });
    importWallDataInput.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      await importWallOverridesBackup(file);
    });
  }
  if (copyGuideTemplateBtn) {
    copyGuideTemplateBtn.addEventListener("click", () => {
      if (!state.wallEditMode) {
        setStatus("Copy Guide Template JSON is available only in Tile Editor.", true);
        closeAdvancedMenuForElement(copyGuideTemplateBtn);
        return;
      }
      copyGuidePointTemplateExport();
      closeAdvancedMenuForElement(copyGuideTemplateBtn);
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
      setStatus(state.leftDrawerCollapsed ? "Info drawer collapsed." : "Info drawer expanded.");
    });
  }
  if (toggleRightDrawerBtn) {
    toggleRightDrawerBtn.addEventListener("click", () => {
      state.rightDrawerCollapsed = !state.rightDrawerCollapsed;
      applyDrawerCollapseState({ preserveBoardScreenPosition: true });
      setStatus(state.rightDrawerCollapsed ? "Tile drawer collapsed." : "Tile drawer expanded.");
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

    if (key === "a") {
      event.preventDefault();
      state.leftDrawerCollapsed = !state.leftDrawerCollapsed;
      applyDrawerCollapseState({ preserveBoardScreenPosition: true });
      setStatus(state.leftDrawerCollapsed ? "Info drawer collapsed." : "Info drawer expanded.");
      return;
    }

    if (key === "s") {
      event.preventDefault();
      state.rightDrawerCollapsed = !state.rightDrawerCollapsed;
      applyDrawerCollapseState({ preserveBoardScreenPosition: true });
      setStatus(state.rightDrawerCollapsed ? "Tile drawer collapsed." : "Tile drawer expanded.");
      return;
    }

    if (key === "d") {
      event.preventDefault();
      toggleBothDrawers();
      return;
    }

    if (key === "r") {
      event.preventDefault();
      if (autoBuildBtn) triggerDiceSpin(autoBuildBtn);
      runAutoBuild();
      return;
    }

    if (key === "x") {
      event.preventDefault();
      if (resetAllBtn) triggerResetSpin(resetAllBtn);
      resetTilesAndBossCards();
      return;
    }

    if (key === "z") {
      event.preventDefault();
      resetBoardView();
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
    if (!isEventInsideHeaderMenu(event.target)) {
      closeHeaderMenus();
    }
    if (event.target.closest(".advanced-menu")) return;
    const openMenus = document.querySelectorAll(".advanced-menu[open]");
    openMenus.forEach((menu) => {
      menu.open = false;
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeHeaderMenus();
    }
  });

  board.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    if (state.wallEditMode) return;
    if (event.target.closest(".tile, .boss-token")) return;
    if (event.target.closest(".advanced-menu")) return;
    beginBoardPan(event, ctx);
  });
  board.addEventListener(
    "wheel",
    (event) => {
      if (state.wallEditMode) return;
      event.preventDefault();
      const rect = board.getBoundingClientRect();
      const anchorX = clamp(event.clientX - rect.left, 0, rect.width);
      const anchorY = clamp(event.clientY - rect.top, 0, rect.height);
      const delta = -event.deltaY * BOARD_WHEEL_ZOOM_SENSITIVITY;
      zoomBoardAtPoint(delta, anchorX, anchorY);
    },
    { passive: false },
  );

  setupDelegatedTileEvents(ctx);

  window.addEventListener(
    "resize",
    () => {
      updateCompactSidePanelMode();
      applyDrawerCollapseState({ save: false, rerender: false });
      recenterTrayAndReserveTiles();
      scheduleBoardHexGridRender();
      scheduleBoardAutoCenterOnViewportResize();
    },
    { passive: true },
  );

  const systemModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  systemModeQuery.addEventListener("change", () => {
    if (state.selectedAppearanceMode !== "system") return;
    applyAppearanceMode("system", { showStatus: false, save: false });
  });

  initAutoBuildTuningPanel();
}

// ─── Module-private: board pan ────────────────────────────────────────────────

function beginBoardPan(event, ctx) {
  const {
    state, board,
    forEachBoardTile, forEachBoardBossToken,
    positionTile, updateTileTransform,
    positionBossToken, updateBossTokenTransform,
    updateReferenceMarkerTransform,
    getBoardZoom, scheduleBoardHexGridRender,
  } = ctx;

  event.preventDefault();
  const startX = event.clientX;
  const startY = event.clientY;
  const boardTiles = [];
  forEachBoardTile((tile) => {
    boardTiles.push({ tile, x: tile.x, y: tile.y });
  });
  const reference = state.referenceMarker?.dom
    ? { dom: state.referenceMarker.dom, x: state.referenceMarker.x, y: state.referenceMarker.y }
    : null;
  const boardBossTokens = [];
  forEachBoardBossToken((token) => {
    boardBossTokens.push({ token, x: token.x, y: token.y });
  });

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
      if (state.referenceMarker) {
        state.referenceMarker.x = rx;
        state.referenceMarker.y = ry;
        updateReferenceMarkerTransform(state.referenceMarker);
      }
    }
    for (const entry of boardBossTokens) {
      positionBossToken(entry.token, entry.x + dx, entry.y + dy);
      updateBossTokenTransform(entry.token);
    }
    if (anchorStart) {
      state.entranceFadeAnchor = { x: anchorStart.x + dx, y: anchorStart.y + dy };
    }
    scheduleBoardHexGridRender();
  };

  const cleanup = () => {
    board.classList.remove("panning");
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
    window.removeEventListener("pointercancel", handleUp);
  };

  const handleUp = () => { cleanup(); };

  window.addEventListener("pointermove", handleMove);
  window.addEventListener("pointerup", handleUp);
  window.addEventListener("pointercancel", handleUp);
}

// ─── Module-private: delegated tile events ────────────────────────────────────

function getTileFromEvent(event, ctx) {
  const tileEl = event.target.closest(".tile");
  if (!tileEl) return null;
  const tileId = tileEl.dataset.tileId;
  return tileId ? ctx.state.tiles.get(tileId) || null : null;
}

function handleDelegatedTilePointerDown(event, ctx) {
  const {
    state, isTraySwapTarget, handleSwapClick, isEntranceTile,
    persistTileWallFaces, refreshTileWallGuide, getTileDisplayLabel,
    clearPendingReserveSwap, isReserveSwapSource, performReserveToTraySwap,
    selectTile, rotateTile, ROTATION_STEP, setStatus,
  } = ctx;

  const tile = getTileFromEvent(event, ctx);
  if (!tile || tile.previewOnly) return;
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
  beginDrag(tile, event, ctx);
}

function handleDelegatedTileClick(event, ctx) {
  const { state, rotateTile, ROTATION_STEP, selectTile } = ctx;
  const tile = getTileFromEvent(event, ctx);
  if (!tile || tile.previewOnly) return;
  if (event.target.closest(".rotate-ccw")) {
    event.stopPropagation();
    rotateTile(tile, -ROTATION_STEP);
    return;
  }
  if (event.target.closest(".rotate-cw")) {
    event.stopPropagation();
    rotateTile(tile, ROTATION_STEP);
    return;
  }
  if (state.pendingSwapSource) return;
  selectTile(tile.tileId);
}

function handleDelegatedTileMouseOver(event, ctx) {
  const { state, selectTile } = ctx;
  const tileEl = event.target.closest(".tile");
  if (!tileEl) return;
  const tile = state.tiles.get(tileEl.dataset.tileId);
  if (!tile || tile.previewOnly) return;
  if (state.hoveredTileId === tile.tileId) return;
  state.hoveredTileId = tile.tileId;
  if (state.selectedTileId && state.selectedTileId !== tile.tileId) {
    selectTile(null);
  }
}

function handleDelegatedTileMouseOut(event, ctx) {
  const { state, selectTile } = ctx;
  const tileEl = event.target.closest(".tile");
  if (!tileEl) return;
  const tile = state.tiles.get(tileEl.dataset.tileId);
  if (!tile || tile.previewOnly) return;
  const related = event.relatedTarget;
  if (related && tileEl.contains(related)) return;
  if (state.hoveredTileId === tile.tileId) state.hoveredTileId = null;
  if (state.selectedTileId && !state.hoveredTileId) selectTile(null);
}

function handleDelegatedReserveClick(event, ctx) {
  const { state, handleSwapClick } = ctx;
  const card = event.target.closest(".reserve-card");
  if (!card) return;
  const tileId = card.dataset.tileId;
  if (!tileId) return;
  if (state.wallEditMode) return;
  if (!state.reserveEditMode) return;
  handleSwapClick("reserve", tileId);
}

function setupDelegatedTileEvents(ctx) {
  const { board, tray, reservePile } = ctx;
  for (const container of [board, tray]) {
    container.addEventListener("pointerdown", (e) => handleDelegatedTilePointerDown(e, ctx));
    container.addEventListener("click", (e) => handleDelegatedTileClick(e, ctx));
    container.addEventListener("mouseover", (e) => handleDelegatedTileMouseOver(e, ctx));
    container.addEventListener("mouseout", (e) => handleDelegatedTileMouseOut(e, ctx));
    container.addEventListener("dragstart", (e) => {
      if (e.target.closest(".tile")) e.preventDefault();
    });
  }
  reservePile.addEventListener("click", (e) => handleDelegatedReserveClick(e, ctx));
}

// ─── Module-private: tile drag ────────────────────────────────────────────────

function finishDrop(tile, placedTiles, ctx) {
  const {
    snapTileCenterToHex, positionTile, updateTileTransform,
    isEntranceTile, markDevQaCheck, syncRegularTileActivityFromSlotOrder,
    setEntranceFadeAnchorFromTile, scheduleBoardHexGridRender,
    setPlacementFeedback, setStatus, updatePlacedProgress,
    ENTRANCE_TILE_ID, state, revertToTray, getPlacedTilesExcluding,
    hasAnyOverlap, handleInvalidDrop, findBestContact, getInvalidContactReason,
    getTileDisplayLabel, ensureReferenceCardVisibleAfterAutoBuild, selectTile,
  } = ctx;

  const snappedCenter = snapTileCenterToHex(tile, tile.x, tile.y);
  positionTile(tile, snappedCenter.x, snappedCenter.y);
  updateTileTransform(tile);

  if (isEntranceTile(tile)) {
    tile.placed = true;
    markDevQaCheck("drag_tile_to_board", { detail: tile.tileId });
    syncRegularTileActivityFromSlotOrder();
    setEntranceFadeAnchorFromTile(tile);
    scheduleBoardHexGridRender();
    setPlacementFeedback(tile, null);
    setStatus("Entrance tile placed. Now add the other 6 tiles.");
    updatePlacedProgress();
    return;
  }

  const otherPlacedTiles = placedTiles || getPlacedTilesExcluding(tile);

  if (otherPlacedTiles.length === 0) {
    revertToTray(tile, "Place the Entrance Tile first.");
    return;
  }

  if (hasAnyOverlap(tile, otherPlacedTiles)) {
    handleInvalidDrop(
      tile,
      otherPlacedTiles,
      "Invalid placement: tiles cannot overlap. Returning to tray in 10s.",
      true,
    );
    return;
  }

  let result = findBestContact(tile, otherPlacedTiles);
  if (!result.valid) {
    if (!state.ignoreContactRule) {
      handleInvalidDrop(tile, otherPlacedTiles, `Invalid placement: ${getInvalidContactReason(result)} Returning to tray in 10s.`);
      return;
    }
  }

  tile.placed = true;
  markDevQaCheck("drag_tile_to_board", { detail: tile.tileId });
  syncRegularTileActivityFromSlotOrder();
  const entrance = state.tiles.get(ENTRANCE_TILE_ID);
  const placedRegularTiles = Array.from(state.tiles.values()).filter(
    (entry) => entry.placed && !isEntranceTile(entry),
  );
  const movedReferenceSide = entrance
    ? ensureReferenceCardVisibleAfterAutoBuild(placedRegularTiles, entrance)
    : false;
  if (result.valid) {
    setStatus(
      movedReferenceSide
        ? `Placed ${getTileDisplayLabel(tile.tileId)} with ${result.count} point contacts. Reference card moved to side for visibility.`
        : `Placed ${getTileDisplayLabel(tile.tileId)} with ${result.count} point contacts.`,
    );
  } else {
    setStatus(
      movedReferenceSide
        ? `Placed ${getTileDisplayLabel(tile.tileId)} with ${result.count} contacts (2 face connection rule ignored). Reference card moved to side for visibility.`
        : `Placed ${getTileDisplayLabel(tile.tileId)} with ${result.count} contacts (2 face connection rule ignored).`,
      true,
    );
  }
  selectTile(null);
  updatePlacedProgress();
}

function beginDrag(tile, event, ctx) {
  const {
    state, board, workspace, dragLayer, tileDrawer,
    isOnBoardLayer, getCompactTrayTileSize, getPlacedTilesExcluding,
    normalizeAngle, updateTileParent, positionTile, updateTileTransform,
    stopDragEdgeAutoPan, updateDragEdgeAutoPanState, getBoardZoom,
    isPointOverBoardSurface, clamp, snapTileCenterToHex,
    updatePlacementFeedback, setPlacementFeedback, placeTileInTray,
    isPointInsideElement, clearInvalidReturnTimer, selectTile,
    updatePlacedProgress, COMPACT_DRAG_START_SIZE_BOOST, COMPACT_DRAG_GROW_DISTANCE_PX,
  } = ctx;

  selectTile(null);
  clearInvalidReturnTimer(tile);
  const boardRect = board.getBoundingClientRect();
  const workspaceRect = workspace.getBoundingClientRect();
  const startedFromBoard = isOnBoardLayer(tile.dom.parentElement);
  const tileRect = tile.dom.getBoundingClientRect();
  const startedFromCompactTray = state.compactSidePanelMode && !startedFromBoard;
  const compactDragGrowAnchorX = tileDrawer.getBoundingClientRect().right;
  const compactTraySize = getCompactTrayTileSize(tile);
  const pointerOffsetX = event.clientX - (tileRect.left + tileRect.width / 2);
  const pointerOffsetY = event.clientY - (tileRect.top + tileRect.height / 2);
  const placedTilesExcludingSelf = getPlacedTilesExcluding(tile);
  const buildDragPlacementLayoutKey = (tiles) => tiles
    .map((entry) => `${entry.tileId}@${normalizeAngle(entry.rotation || 0)}:${entry.x.toFixed(2)},${entry.y.toFixed(2)}`)
    .sort()
    .join("|");

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
    startedFromCompactTray,
    compactDragGrowAnchorX,
    compactDragProgress: startedFromBoard ? 1 : 0,
    compactStartWidth: tileRect.width * COMPACT_DRAG_START_SIZE_BOOST,
    compactStartHeight: tileRect.height * COMPACT_DRAG_START_SIZE_BOOST,
    compactTrayWidth: compactTraySize.width,
    compactTrayHeight: compactTraySize.height,
    placedTilesExcludingSelf,
    feedbackRafId: null,
    feedbackCache: new Map(),
    feedbackLayoutKey: buildDragPlacementLayoutKey(placedTilesExcludingSelf),
    feedbackInsideBoard: false,
    feedbackCandidateX: null,
    feedbackCandidateY: null,
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
    if (tile.drag?.feedbackRafId != null) {
      cancelAnimationFrame(tile.drag.feedbackRafId);
      tile.drag.feedbackRafId = null;
    }
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
    window.removeEventListener("pointercancel", handleUp);
  };

  const scheduleFeedbackUpdate = () => {
    if (!tile.drag || tile.drag.feedbackRafId != null) return;
    tile.drag.feedbackRafId = requestAnimationFrame(() => {
      if (!tile.drag) return;
      tile.drag.feedbackRafId = null;
      updatePlacementFeedback(tile);
    });
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
    if (state.compactSidePanelMode && (tile.drag.startedFromCompactTray || tile.drag.startedFromBoard)) {
      tile.drag.compactDragProgress = clamp(
        (moveEvent.clientX - tile.drag.compactDragGrowAnchorX) / COMPACT_DRAG_GROW_DISTANCE_PX,
        0,
        1,
      );
    }
    if (pointerInsideBoard) {
      const boardX = (moveEvent.clientX - boardOriginX - tile.drag.offsetX) / zoom;
      const boardY = (moveEvent.clientY - boardOriginY - tile.drag.offsetY) / zoom;
      const clampedBoardX = clamp(boardX, 0, board.clientWidth);
      const clampedBoardY = clamp(boardY, 0, board.clientHeight);
      const snapped = snapTileCenterToHex(tile, clampedBoardX, clampedBoardY);
      tile.drag.feedbackInsideBoard = true;
      tile.drag.feedbackCandidateX = snapped.x;
      tile.drag.feedbackCandidateY = snapped.y;
      const boardOffsetX = boardOriginX - workspaceRect.left;
      const boardOffsetY = boardOriginY - workspaceRect.top;
      positionTile(tile, snapped.x * zoom + boardOffsetX, snapped.y * zoom + boardOffsetY);
    } else {
      tile.drag.feedbackInsideBoard = false;
      tile.drag.feedbackCandidateX = null;
      tile.drag.feedbackCandidateY = null;
      positionTile(tile, x, y);
    }
    updateTileTransform(tile);
    scheduleFeedbackUpdate();
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
      const droppedInsideTileDrawer = isPointInsideElement(upEvent.clientX, upEvent.clientY, tileDrawer);
      const isInsideBoard = isPointOverBoardSurface(upEvent.clientX, upEvent.clientY, boardRect);

      if (!isInsideBoard && (droppedInsideTileDrawer || !tile.drag.startedFromBoard)) {
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
    finishDrop(tile, tile.drag?.placedTilesExcludingSelf, ctx);
    tile.drag = null;
  };

  window.addEventListener("pointermove", handleMove);
  window.addEventListener("pointerup", handleUp);
  window.addEventListener("pointercancel", handleUp);
}

// ─── Exported: guide point handle drag ────────────────────────────────────────

export function beginGuidePointHandleDrag(tile, pointIndex, event, ctx) {
  const {
    state, TILE_SIZE,
    isGuidePointTemplateEditableTile, getGuidePointTemplateType,
    getGuidePointTemplateOverride, getGuideFacePoints, cloneGuidePoints,
    persistGuidePointTemplate, showLocalDataNotice, getTileSetConfig, setStatus,
  } = ctx;

  if (!state.wallEditMode || !isGuidePointTemplateEditableTile(tile)) return;
  const templateType = getGuidePointTemplateType(tile);
  if (!templateType) return;

  const startPoints = getGuidePointTemplateOverride(templateType, tile.tileSetId)
    || cloneGuidePoints(getGuideFacePoints(tile));
  if (!startPoints?.[pointIndex]) return;

  event.preventDefault();
  event.stopPropagation();

  const rect = tile.dom?.getBoundingClientRect();
  if (!rect) return;
  const pxToGuideUnits = TILE_SIZE / rect.width;
  const startClientX = event.clientX;
  const startClientY = event.clientY;
  const startPoint = { ...startPoints[pointIndex] };

  const handleMove = (moveEvent) => {
    const dx = (moveEvent.clientX - startClientX) * pxToGuideUnits;
    const dy = (moveEvent.clientY - startClientY) * pxToGuideUnits;
    const nextPoints = cloneGuidePoints(startPoints);
    nextPoints[pointIndex] = { x: startPoint.x + dx, y: startPoint.y + dy };
    persistGuidePointTemplate(templateType, nextPoints, tile.tileSetId);
  };

  const cleanup = () => {
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
    window.removeEventListener("pointercancel", handleUp);
  };

  const handleUp = () => {
    cleanup();
    showLocalDataNotice(
      getTileSetConfig(tile.tileSetId)?.source === "custom" ? "custom" : "built_in",
      tile.tileSetId,
    );
    setStatus(
      `${templateType === "entrance" ? "Entrance" : "Regular"} guide point ${pointIndex} updated.`,
    );
  };

  window.addEventListener("pointermove", handleMove);
  window.addEventListener("pointerup", handleUp);
  window.addEventListener("pointercancel", handleUp);
}
