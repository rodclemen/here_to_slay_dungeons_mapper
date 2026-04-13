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
    beginBoardPan,
    clamp,
    BOARD_WHEEL_ZOOM_SENSITIVITY,
    zoomBoardAtPoint,
    bindDelegatedTileEvents,
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
        const previousPath = getStoredDataFolderPath();
        const selectedPath = await chooseDataFolder(previousPath, { persist: false });
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
      const option = event.target.closest("[data-appearance-mode]");
      if (!option) return;
      const nextMode = option.dataset.appearanceMode || DEFAULT_APPEARANCE_MODE;
      markDevQaCheck("appearance_mode_change", { detail: nextMode });
      applyAppearanceMode(nextMode);
      setAppearanceModeMenuOpen(false);
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
      const delta = -event.deltaY * BOARD_WHEEL_ZOOM_SENSITIVITY;
      zoomBoardAtPoint(delta, anchorX, anchorY);
    },
    { passive: false },
  );

  bindDelegatedTileEvents();

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
