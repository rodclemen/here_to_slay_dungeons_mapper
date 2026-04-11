import {
  getBuiltInTileSetAssetPath,
  getMissingDefaultWallEntries,
  getRegistryIssues,
  getTileSetAssetPaths,
  imageExists,
  loadImage,
  printTileSetReadinessReport,
  resolveTileSetStatus,
} from "./modules/assets.js";
import {
  buildCurrentLayoutExportItems,
  buildShareLayoutSnapshot as buildShareLayoutSnapshotFromPayload,
  captureShareLayoutPayload as buildShareLayoutPayload,
  createShareLayoutUrl as buildShareLayoutUrl,
  decodeBase64Url,
  getShareQueryParam,
} from "./modules/share-export.js";
import {
  clonePortalFlag as clonePortalFlagValue,
  hasPortalFlag as hasPortalFlagValue,
  loadEndTileOverrides as loadEndTileOverridesFromStorage,
  loadGuidePointTemplateOverrides as loadGuidePointTemplateOverridesFromStorage,
  loadPortalFlagOverrides as loadPortalFlagOverridesFromStorage,
  loadWallOverrides as loadWallOverridesFromStorage,
  sanitizeEndTileOverrides as sanitizeEndTileOverridesValue,
  sanitizeGuidePointTemplateOverrides as sanitizeGuidePointTemplateOverridesValue,
  sanitizeGuidePointTemplatePoints as sanitizeGuidePointTemplatePointsValue,
  sanitizePortalFlagOverrides as sanitizePortalFlagOverridesValue,
  sanitizePortalFlagPosition as sanitizePortalFlagPositionValue,
  sanitizeWallOverrides as sanitizeWallOverridesValue,
  saveJsonStorage,
} from "./modules/wall-storage.js";
import {
  buildAllBossTileSources,
  findBossTileSetIdForSrc,
  generateAllBossesOffset as generateAllBossesOffsetValue,
  getBossTileSources as getBossTileSourcesValue,
  normalizeOrderedSources,
  rotatePileTop,
  shuffleDistinctOrder,
} from "./modules/boss-pile.js";
import {
  createBoardHexLayout,
  getBoardDropPositionFromPointer as getBoardDropPositionFromPointerValue,
  quantizeBoardZoom as quantizeBoardZoomValue,
  snapBoardPointToHex as snapBoardPointToHexValue,
  worldToBoardScreen,
} from "./modules/board-math.js";
import {
  computeDragEdgeAutoPan,
  isPointInsideRect,
  isPointOverBoardSurface as isPointOverBoardSurfaceValue,
} from "./modules/board-interaction.js";
import {
  boundsOverlap,
  clamp,
  dist,
  getPolygonBounds,
  normalizeAngle,
  pointInPolygonStrict,
  polygonsOverlap,
  shuffle,
} from "./modules/geometry-utils.js";
import {
  computeBoardHexThemeMetrics,
  hexPath,
} from "./modules/board-visuals.js";
import {
  buildInsetPolygon as buildInsetPolygonValue,
  getSideDirections as getSideDirectionsValue,
  getTilePoseGeometry as getTilePoseGeometryValue,
  hasAnyOverlap as hasAnyOverlapValue,
} from "./modules/tile-pose.js";
import {
  applyNormalTileGuideAdjustments,
  buildGuideNormals,
  cloneGuidePoints,
  shouldUseTemplateGuidePoints,
} from "./modules/tile-guides.js";
import {
  countSideContacts as countSideContactsValue,
  findBestContact as findBestContactValue,
  getContactMatchDetails as getContactMatchDetailsValue,
  getMatchAlignmentCorrection as getMatchAlignmentCorrectionValue,
  getSideSamples as getSideSamplesValue,
  isWorldPointOnOpaquePixel as isWorldPointOnOpaquePixelValue,
} from "./modules/contact-analysis.js";
import {
  getAlphaMask as getAlphaMaskValue,
  getFaceGeometry as getFaceGeometryValue,
  getOpaqueBounds as getOpaqueBoundsValue,
} from "./modules/tile-assets.js";
import {
  buildCustomTileAssetStorageKey,
  clearStoredCustomTileSetBundles,
  deleteStoredCustomTileSetBundle,
  getStoredCustomTileSetEditorData,
  getStoredCustomTileSetBundle,
  listStoredCustomTileSetEditorData,
  listStoredCustomTileSetBundles,
  listStoredCustomTileSetBundlesFromLegacyStorage,
  listStoredCustomTileSetEditorDataFromLegacyStorage,
  saveStoredCustomTileSetEditorData,
  saveStoredCustomTileSetBundle,
} from "./modules/custom-tileset-storage.js";
import {
  readCustomTileSetFolderBundle,
  saveCustomTileSetFolderBundle,
} from "./modules/custom-tileset-folder.js";
import {
  createZipArchive,
} from "./modules/zip-reader.js";
import {
  buildCustomShareBundleArchive as buildCustomShareBundleArchiveValue,
  buildShareFallbackPayload as buildShareFallbackPayloadValue,
  sanitizeCustomTileSetFilename,
} from "./modules/custom-share.js";
import { buildLocalDataNotice } from "./modules/ui-notices.js";
import {
  buildExportedCustomTileSetManifest,
  buildNewCustomTileSetManifest as buildNewCustomTileSetManifestValue,
  buildStoredCustomTileSetBundleFromZip as buildStoredCustomTileSetBundleFromZipValue,
  getRequiredCustomTileAssetRefs,
  normalizeCustomTileSetRecord,
  ensureImportedCustomTileSetBundleHasUniqueId as ensureImportedCustomTileSetBundleHasUniqueIdValue,
  stripTransientCustomTileSetFields,
} from "./modules/custom-tileset-package.js";
import {
  chooseDataFolder,
  chooseFolderPath,
  ensureDataFolderPath,
  getStoredDataFolderPath,
  hasAnyDataFolderContent,
  joinDataFolderPath,
  loadDataSettingsMap,
  saveDataSetting,
  saveDataSettingsMap,
  listDirEntries,
  pathExists,
  setStoredDataFolderPath,
} from "./modules/data-folder-store.js";
import {
  APPEARANCE_MODE_STORAGE_KEY,
  AUTO_THEME_BY_TILE_SET_STORAGE_KEY,
  DEFAULT_DARK_THEME,
  DEFAULT_LIGHT_THEME,
  DEFAULT_UI_THEME_ID,
  LAST_DARK_UI_THEME_STORAGE_KEY,
  LAST_LIGHT_UI_THEME_STORAGE_KEY,
  UI_THEME_CATALOG,
  UI_THEME_IDS,
  UI_THEME_STORAGE_KEY,
  getUiThemeById,
  sanitizeDarkUiThemeId,
  sanitizeLightUiThemeId,
} from "./modules/ui-themes.js";
import { markDevQaCheck } from "./modules/dev-qa-checks.js";
import {
  beginWallEditorPortalFlagDrag as beginWallEditorPortalFlagDragUI,
  getWallEditorGroupById as getWallEditorGroupByIdUI,
  getWallEditorGroupIdForTileSet as getWallEditorGroupIdForTileSetUI,
  getWallEditorGroups as getWallEditorGroupsUI,
  patchWallEditorAssetSlot as patchWallEditorAssetSlotUI,
  renderWallEditorPage as renderWallEditorPageUI,
  rerenderWallEditorPreservingScroll as rerenderWallEditorPreservingScrollUI,
  setActiveWallEditorTile as setActiveWallEditorTileUI,
  syncWallEditorPortalFlag as syncWallEditorPortalFlagUI,
} from "./modules/wall-editor-ui.js";
import {
  applyPlacementFeedbackFromResult as applyPlacementFeedbackFromResultTP,
  computeBestSnap as computeBestSnapTP,
  countSideContacts as countSideContactsTP,
  evaluatePlacementAt as evaluatePlacementAtTP,
  findBestContact as findBestContactTP,
  findBestOpenHex as findBestOpenHexTP,
  getAlphaMask as getAlphaMaskTP,
  getCachedDragPlacementResult as getCachedDragPlacementResultTP,
  getCandidateClearanceMetrics as getCandidateClearanceMetricsTP,
  getContactFaces as getContactFacesTP,
  getContactMatchDetails as getContactMatchDetailsTP,
  getFaceGeometry as getFaceGeometryTP,
  getInvalidContactReason as getInvalidContactReasonTP,
  getInvalidPlacedTileRotationReason as getInvalidPlacedTileRotationReasonTP,
  getMatchAlignmentCorrection as getMatchAlignmentCorrectionTP,
  getMinFaceDistanceToTiles as getMinFaceDistanceToTilesTP,
  getNearestTile as getNearestTileTP,
  getOverlapWorldPolygon as getOverlapWorldPolygonTP,
  getPlacedRegularTileCount as getPlacedRegularTileCountTP,
  getPlacedTileConnectedNeighbors as getPlacedTileConnectedNeighborsTP,
  getPlacedTileRotationState as getPlacedTileRotationStateTP,
  getPlacedTiles as getPlacedTilesTP,
  getPlacedTilesExcluding as getPlacedTilesExcludingTP,
  getPlacementFeedbackFaceIndices as getPlacementFeedbackFaceIndicesTP,
  getSideDirections as getSideDirectionsTP,
  getSideSamples as getSideSamplesTP,
  getTileGuideLocalCenter as getTileGuideLocalCenterTP,
  getTilePoseGeometry as getTilePoseGeometryTP,
  getTileSnapAnchorForRotation as getTileSnapAnchorForRotationTP,
  getWorldPolygon as getWorldPolygonTP,
  handleInvalidDrop as handleInvalidDropTP,
  hasAnyOverlap as hasAnyOverlapTP,
  isBlockedContactFace as isBlockedContactFaceTP,
  isTouchingMoltenEntranceBlockedPoints as isTouchingMoltenEntranceBlockedPointsTP,
  isTouchingTileStartBlockedPoints as isTouchingTileStartBlockedPointsTP,
  isWorldPointOnOpaquePixel as isWorldPointOnOpaquePixelTP,
  moveAwayFromPlacedTiles as moveAwayFromPlacedTilesTP,
  positionTile as positionTileTP,
  quantizeSnapCoord as quantizeSnapCoordTP,
  refreshPlacementGuideDom as refreshPlacementGuideDomTP,
  revertToTray as revertToTrayTP,
  rotateTile as rotateTileTP,
  setPlacementFeedback as setPlacementFeedbackTP,
  snapTileCenterToHex as snapTileCenterToHexTP,
  tilesAlphaOverlap as tilesAlphaOverlapTP,
  updatePlacementFeedback as updatePlacementFeedbackTP,
  buildInsetPolygon as buildInsetPolygonTP,
  clearInvalidReturnTimer as clearInvalidReturnTimerTP,
} from "./modules/tile-placement.js";
import {
  applyAppearanceMode as applyAppearanceModeTM,
  applyAutoThemeForTileSet as applyAutoThemeForTileSetTM,
  applyFeedbackMode as applyFeedbackModeTM,
  applyUiTheme as applyUiThemeTM,
  getAppearanceModeLabel as getAppearanceModeLabelTM,
  getAppearanceModeMenuItemLabel as getAppearanceModeMenuItemLabelTM,
  getUiThemeLabel as getUiThemeLabelTM,
  getUiThemesForMode as getUiThemesForModeTM,
  isDarkUiTheme as isDarkUiThemeTM,
  isSupportedUiThemeId as isSupportedUiThemeIdTM,
  loadAppearanceMode as loadAppearanceModeTM,
  loadAutoThemeByTileSet as loadAutoThemeByTileSetTM,
  loadLastDarkUiThemeId as loadLastDarkUiThemeIdTM,
  loadLastLightUiThemeId as loadLastLightUiThemeIdTM,
  loadUiThemeId as loadUiThemeIdTM,
  resolvePairedUiThemeIdForMode as resolvePairedUiThemeIdForModeTM,
  resolveUiThemeForAppearanceMode as resolveUiThemeForAppearanceModeTM,
  saveAppearanceMode as saveAppearanceModeTM,
  saveAutoThemeByTileSet as saveAutoThemeByTileSetTM,
  saveLastDarkUiThemeId as saveLastDarkUiThemeIdTM,
  saveLastLightUiThemeId as saveLastLightUiThemeIdTM,
  saveUiThemeId as saveUiThemeIdTM,
  setAppearanceModeMenuOpen as setAppearanceModeMenuOpenTM,
  setAutoThemeByTileSet as setAutoThemeByTileSetTM,
  setUiThemeMenuOpen as setUiThemeMenuOpenTM,
  syncAppearanceModeMenu as syncAppearanceModeMenuTM,
  syncAutoThemeToggleButton as syncAutoThemeToggleButtonTM,
  syncThemeControlVisibility as syncThemeControlVisibilityTM,
  syncUiThemeMenuOptions as syncUiThemeMenuOptionsTM,
  syncUiThemeSelectAvailability as syncUiThemeSelectAvailabilityTM,
} from "./modules/theme-manager.js";
import {
  buildCustomShareBundleArchive as buildCustomShareBundleArchiveSF,
  buildCustomTileSetExportArchive as buildCustomTileSetExportArchiveSF,
  buildShareFallbackPayload as buildShareFallbackPayloadSF,
  buildShareLayoutSnapshot as buildShareLayoutSnapshotSF,
  captureShareLayoutPayload as captureShareLayoutPayloadSF,
  copyShareLayoutLink as copyShareLayoutLinkSF,
  createShareLayoutUrl as createShareLayoutUrlSF,
  restoreBuildViewLayout as restoreBuildViewLayoutSF,
  restoreSharedLayoutFromUrl as restoreSharedLayoutFromUrlSF,
} from "./modules/share-flow.js";
import {
  beginBossSpawnDrag as beginBossSpawnDragBM,
  beginBossTokenDrag as beginBossTokenDragBM,
  buildBossAssetKey as buildBossAssetKeyBM,
  createBossToken as createBossTokenBM,
  ensureAllBossesPileOrder as ensureAllBossesPileOrderBM,
  ensureBossPileOrder as ensureBossPileOrderBM,
  forEachBoardBossToken as forEachBoardBossTokenBM,
  generateAllBossesOffset as generateAllBossesOffsetBM,
  getAvailableBossSources as getAvailableBossSourcesBM,
  getBoardDropPositionFromPointer as getBoardDropPositionFromPointerBM,
  getBossDropMagnetBoardPosition as getBossDropMagnetBoardPositionBM,
  getBossKeyForLegacySrc as getBossKeyForLegacySrcBM,
  getBossReferenceMagnetBoardPosition as getBossReferenceMagnetBoardPositionBM,
  getBossReferenceTopMagnetBoardPosition as getBossReferenceTopMagnetBoardPositionBM,
  getBossReferenceTopMagnetBoardPositionForReference as getBossReferenceTopMagnetBoardPositionForReferenceBM,
  getBossTokenAtReferenceTopMagnet as getBossTokenAtReferenceTopMagnetBM,
  getBossTokenMagnetBoardPosition as getBossTokenMagnetBoardPositionBM,
  getBossTileSources as getBossTileSourcesBM,
  getTileSetIdForBossSrc as getTileSetIdForBossSrcBM,
  getTopBossCardCollisionPolygon as getTopBossCardCollisionPolygonBM,
  parseBossAssetKey as parseBossAssetKeyBM,
  positionBossToken as positionBossTokenBM,
  pushBossBackToPile as pushBossBackToPileBM,
  removeBossToken as removeBossTokenBM,
  renderBossPile as renderBossPileBM,
  resetTilesAndBossCards as resetTilesAndBossCardsBM,
  resolveBossAssetSrc as resolveBossAssetSrcBM,
  rotateBossPileTop as rotateBossPileTopBM,
  rotateAllBossesPileTop as rotateAllBossesPileTopBM,
  setBossEditMode as setBossEditModeBM,
  spawnRandomBossAtReferenceTopMagnet as spawnRandomBossAtReferenceTopMagnetBM,
  syncBossTileSetHeading as syncBossTileSetHeadingBM,
  triggerBossRandomizeAnimation as triggerBossRandomizeAnimationBM,
  updateBossTokenTransform as updateBossTokenTransformBM,
} from "./modules/boss-management.js";
import {
  applyBoardZoom as applyBoardZoomBV,
  applyDragEdgeAutoPan as applyDragEdgeAutoPanBV,
  centerBoardViewOnEntranceX as centerBoardViewOnEntranceXBV,
  forEachBoardTile as forEachBoardTileBV,
  getBoardRawZoom as getBoardRawZoomBV,
  getBoardZoom as getBoardZoomBV,
  isClickInTopRightCloseHit as isClickInTopRightCloseHitBV,
  isOnBoardLayer as isOnBoardLayerBV,
  isPointInsideElement as isPointInsideElementBV,
  isPointOverBoardSurface as isPointOverBoardSurfaceBV,
  lockBoardSceneDuringLayoutTransition as lockBoardSceneDuringLayoutTransitionBV,
  quantizeBoardZoom as quantizeBoardZoomBV,
  recenterBoardView as recenterBoardViewBV,
  resetBoardPan as resetBoardPanBV,
  resetBoardView as resetBoardViewBV,
  resetBoardViewToZoom as resetBoardViewToZoomBV,
  shiftBoardSceneBy as shiftBoardSceneByBV,
  stopDragEdgeAutoPan as stopDragEdgeAutoPanBV,
  syncBoardSceneTransforms as syncBoardSceneTransformsBV,
  translateBoardContent as translateBoardContentBV,
  updateBoardZoomIndicator as updateBoardZoomIndicatorBV,
  updateDragEdgeAutoPanState as updateDragEdgeAutoPanStateBV,
  worldToBoardScreenX as worldToBoardScreenXBV,
  worldToBoardScreenY as worldToBoardScreenYBV,
  zoomBoardAtPoint as zoomBoardAtPointBV,
} from "./modules/board-view.js";

const DEV_MODE_ENABLED = (() => {
  const raw = new URLSearchParams(window.location.search).get("dev");
  if (raw == null) return false;
  const normalized = raw.trim().toLowerCase();
  return normalized === "" || normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
})();

const SIDES = 16;
const SQRT_3 = Math.sqrt(3);
const ROTATION_STEP = 60;
const BOARD_SCALE = 1.15;
const TILE_SIZE = 170 * BOARD_SCALE;
const CONTACT_DISTANCE_RATIO = 0.55;
const OPPOSITE_NORMAL_THRESHOLD = -0.88;
const FACE_TANGENT_ALIGNMENT = 0.85;
const SNAP_SEARCH_RADIUS = 28 * BOARD_SCALE;
const SNAP_VISUAL_GAP = 0;
const SNAP_POINT_GAP = 0;
const SNAP_COORD_QUANTUM = 1;
const MIN_CONTACT_POINTS = 4;
const END_TILE_MAX_CONNECTED_FACES = 3;
const INVALID_RETURN_DELAY_MS = 10_000;
const INVALID_DROP_PUSH_PX = 140;
const ENTRANCE_BLOCKED_FACE_INDICES = new Set([11, 12]);
const BLOCKED_POINT_TOUCH_RADIUS = 4;
const WALL_OVERRIDES_STORAGE_KEY = "hts_wall_overrides_v1";
const END_TILE_OVERRIDES_STORAGE_KEY = "hts_end_tile_overrides_v1";
const PORTAL_FLAG_OVERRIDES_STORAGE_KEY = "hts_portal_flag_overrides_v1";
const GUIDE_POINT_TEMPLATES_STORAGE_KEY = "hts_guide_point_templates_v1";
const DEFAULT_GUIDE_POINT_TEMPLATES = {
  regular: [
    { x: 75.8046875491511, y: -0.07072368421054787 },
    { x: 94.09087175967744, y: 32.531730806071785 },
    { x: 74.81929076646703, y: 64.5865629431882 },
    { x: 38.098728908822864, y: 65.70585679355261 },
    { x: 18.80232355037274, y: 97.9954982246699 },
    { x: -18.802323550372726, y: 98.63859032993305 },
    { x: -38.098728908822864, y: 65.06276468828945 },
    { x: -74.81929076646703, y: 65.22965504845136 },
    { x: -94.09087175967744, y: 32.531730806071785 },
    { x: -74.51850333862478, y: -0.07072368421054787 },
    { x: -93.8046875491511, y: -32.53173080607183 },
    { x: -75.74856708225651, y: -64.5865629431882 },
    { x: -37.38491311934918, y: -65.06276468828945 },
    { x: -19.445415655635884, y: -97.35240611940674 },
    { x: 19.445415655635898, y: -97.35240611940674 },
    { x: 38.028005224612336, y: -65.06276468828945 },
    { x: 76.08769768464138, y: -64.76994467632964 },
    { x: 94.54072656025308, y: -32.612117319229725 },
  ],
  entrance: [
    { x: 78.64467798277255, y: -4.966338796979687 },
    { x: 98.06049607463241, y: 28.096171303214625 },
    { x: 77.5508989096908, y: 62.41853720733497 },
    { x: 39.76865519487847, y: 62.563994952528745 },
    { x: 19.20312094852766, y: 95.4967284889092 },
    { x: -18.890839588333314, y: 95.82747248881667 },
    { x: -39.41174730014163, y: 61.92090284726559 },
    { x: -77.5508989096908, y: 62.41853720733497 },
    { x: -97.41740396936925, y: 28.096171303214625 },
    { x: -78.0015858775094, y: -4.3232466917165295 },
    { x: -96.96779081518923, y: -38.02036980811189 },
    { x: -96.96779081518923, y: -94.82832771368953 },
    { x: 96.96779081518923, y: -94.82832771368955 },
    { x: 96.96779081518923, y: -38.02036980811189 },
  ],
};
const DRAWER_STATE_STORAGE_KEY = "hts_drawer_state_v1";
const AUTO_BUILD_DEV_TUNING_STORAGE_KEY = "hts_auto_build_dev_tuning_v1";
const SELECTED_TILE_SET_STORAGE_KEY = "hts_selected_tile_set_v1";
const SHOW_GUIDE_LABELS_STORAGE_KEY = "hts_show_guide_labels_v1";
const SHOW_WALL_FACES_STORAGE_KEY = "hts_show_wall_faces_v1";
const SHOW_PORTAL_FLAGS_STORAGE_KEY = "hts_show_portal_flags_v1";
const IGNORE_CONTACT_RULE_STORAGE_KEY = "hts_ignore_contact_rule_v1";
const USE_FACE_FEEDBACK_STORAGE_KEY = "hts_use_face_feedback_v1";
const USE_ALL_BOSSES_STORAGE_KEY = "hts_use_all_bosses_v1";
const DATA_FOLDER_STARTUP_PROMPT_DISMISSED_SESSION_KEY = "hts_data_folder_startup_prompt_dismissed_session_v1";
const PENDING_DATA_FOLDER_ACTION_SESSION_KEY = "hts_pending_data_folder_action_v1";
const LOCAL_DATA_NOTICE_SUPPRESSED_SESSION_KEY = "hts_local_data_notice_suppressed_until_custom_change_v1";
const LEGACY_AUTO_BUILD_TUNING_STORAGE_KEY = "hts_auto_build_tuning_v1";
const LEGACY_CUSTOM_TILE_SET_RECORDS_STORAGE_KEY = "hts_custom_tile_set_records_v1";
const CUSTOM_TILE_SET_BACKUP_NEEDED_STORAGE_KEY = "hts_custom_tile_set_backup_needed_v1";
const PDF_EXPORT_PREVIEW_STORAGE_PREFIX = "hts_pdf_export_preview_v1_";
const DEFAULT_TILE_SET_ID = "molten";
const DEFAULT_APPEARANCE_MODE = "system";
const ENTRANCE_TILE_ID = "entrance";
const TILE_IDS = Array.from({ length: 9 }, (_, i) => `tile_${String(i + 1).padStart(2, "0")}`);
const REFERENCE_CARD_ID = "reference_card";
const APPEARANCE_MODE_IDS = new Set(["light", "system", "dark"]);
const APPEARANCE_MODE_ICON_SVG = {
  light: `<svg width="19" height="19" viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="M361.5 1.2c5 2.1 8.6 6.6 9.6 11.9L391 121l107.9 19.8c5.3 1 9.8 4.6 11.9 9.6s1.5 10.7-1.6 15.2L446.9 256l62.3 90.3c3.1 4.5 3.7 10.2 1.6 15.2s-6.6 8.6-11.9 9.6L391 391 371.1 498.9c-1 5.3-4.6 9.8-9.6 11.9s-10.7 1.5-15.2-1.6L256 446.9l-90.3 62.3c-4.5 3.1-10.2 3.7-15.2 1.6s-8.6-6.6-9.6-11.9L121 391 13.1 371.1c-5.3-1-9.8-4.6-11.9-9.6s-1.5-10.7 1.6-15.2L65.1 256 2.8 165.7c-3.1-4.5-3.7-10.2-1.6-15.2s6.6-8.6 11.9-9.6L121 121 140.9 13.1c1-5.3 4.6-9.8 9.6-11.9s10.7-1.5 15.2 1.6L256 65.1 346.3 2.8c4.5-3.1 10.2-3.7 15.2-1.6zM160 256a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zm224 0a128 128 0 1 0 -256 0 128 128 0 1 0 256 0z"/></svg>`,
  dark: `<svg width="19" height="19" viewBox="0 0 384 512" aria-hidden="true"><path fill="currentColor" d="M223.5 32C100 32 0 132.3 0 256S100 480 223.5 480c60.6 0 115.5-24.2 155.8-63.4c5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6c-96.9 0-175.5-78.8-175.5-176c0-65.8 36-123.1 89.3-153.3c6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z"/></svg>`,
  system: `<svg width="19" height="19" viewBox="0 0 576 512" aria-hidden="true"><path fill="currentColor" d="M64 0C28.7 0 0 28.7 0 64L0 352c0 35.3 28.7 64 64 64l176 0-10.7 32L160 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l256 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-69.3 0L336 416l176 0c35.3 0 64-28.7 64-64l0-288c0-35.3-28.7-64-64-64L64 0zM512 64l0 224L64 288 64 64l448 0z"/></svg>`,
};

const BUILT_IN_TILE_SET_REGISTRY = [
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
    uiThemeId: "dreamscape",
    entranceTileId: ENTRANCE_TILE_ID,
    tileIds: TILE_IDS,
    referenceCardId: REFERENCE_CARD_ID,
    bossIds: ["moongrin", "sleep_walker"],
  },
  {
    id: "nightmare",
    label: "Nightmare",
    status: "not_implemented",
    gameSetId: "base_game_2",
    uiThemeId: "nightmare",
    entranceTileId: ENTRANCE_TILE_ID,
    tileIds: TILE_IDS,
    referenceCardId: REFERENCE_CARD_ID,
    bossIds: ["bloodwing", "toxolotl"],
  },
  {
    id: "submerged",
    label: "Submerged",
    status: "not_implemented",
    gameSetId: "base_game_3",
    uiThemeId: "submerged",
    entranceTileId: ENTRANCE_TILE_ID,
    tileIds: TILE_IDS,
    referenceCardId: REFERENCE_CARD_ID,
    bossIds: ["hydrocodile", "surge_spirit"],
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

let runtimeTileSetRegistry = BUILT_IN_TILE_SET_REGISTRY.map((tileSet) => ({ ...tileSet }));
let customTileSetManifestCache = [];
let customTileSetAssetUrlCache = new Map();
let customTileSetEditorDataCache = new Map();

function cloneBuiltInTileSetRegistry() {
  return BUILT_IN_TILE_SET_REGISTRY.map((tileSet) => ({ ...tileSet, source: "built_in" }));
}

document.body.classList.toggle("dev-mode", DEV_MODE_ENABLED);
const IS_TAURI_RUNTIME = typeof window.__TAURI__?.core?.invoke === "function";
document.body.classList.toggle("tauri-mode", typeof window.__TAURI__?.core?.invoke === "function");
let nativeMenuActionUnlisten = null;

function buildNewCustomTileSetManifest(name) {
  return buildNewCustomTileSetManifestValue(name, {
    takenIds: new Set(getTileSetRegistry().map((tileSet) => tileSet.id)),
    tileIds: TILE_IDS,
    entranceTileId: ENTRANCE_TILE_ID,
    referenceCardId: REFERENCE_CARD_ID,
  });
}

function normalizeTileSetNameForComparison(name) {
  return String(name || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function hasTileSetName(name, options = {}) {
  const normalizedName = normalizeTileSetNameForComparison(name);
  if (!normalizedName) return false;
  return getTileSetRegistry().some((tileSet) => {
    if (options.excludeTileSetId && tileSet.id === options.excludeTileSetId) return false;
    return normalizeTileSetNameForComparison(tileSet.label) === normalizedName;
  });
}

function requestTextInput({
  title,
  message,
  defaultValue = "",
  confirmLabel = "OK",
  cancelLabel = "Cancel",
}) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "text-input-modal-backdrop";
    overlay.setAttribute("role", "presentation");

    const modal = document.createElement("div");
    modal.className = "text-input-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "text-input-modal-title");

    const heading = document.createElement("h2");
    heading.id = "text-input-modal-title";
    heading.textContent = title || message || "Enter value";

    const body = document.createElement("p");
    body.textContent = message || "";

    const input = document.createElement("input");
    input.type = "text";
    input.value = defaultValue || "";
    input.autocomplete = "off";

    const actions = document.createElement("div");
    actions.className = "text-input-modal-actions";
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.textContent = cancelLabel;
    const confirmBtn = document.createElement("button");
    confirmBtn.type = "button";
    confirmBtn.textContent = confirmLabel;

    actions.append(cancelBtn, confirmBtn);
    modal.append(heading, body, input, actions);
    overlay.appendChild(modal);

    const close = (value) => {
      document.removeEventListener("keydown", handleKeyDown);
      overlay.remove();
      resolve(value);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(null);
      }
    };

    cancelBtn.addEventListener("click", () => close(null));
    confirmBtn.addEventListener("click", () => close(input.value));
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        close(input.value);
      }
    });
    document.addEventListener("keydown", handleKeyDown);
    document.body.appendChild(overlay);
    input.focus();
    input.select();
  });
}

function requestChoiceDialog({
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
}) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "text-input-modal-backdrop";
    overlay.setAttribute("role", "presentation");

    const modal = document.createElement("div");
    modal.className = "text-input-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "choice-modal-title");

    const heading = document.createElement("h2");
    heading.id = "choice-modal-title";
    heading.textContent = title || message || "Confirm";

    const body = document.createElement("p");
    body.textContent = message || "";

    const actions = document.createElement("div");
    actions.className = "text-input-modal-actions";
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.textContent = cancelLabel;
    const confirmBtn = document.createElement("button");
    confirmBtn.type = "button";
    confirmBtn.textContent = confirmLabel;

    actions.append(cancelBtn, confirmBtn);
    modal.append(heading, body, actions);
    overlay.appendChild(modal);

    const close = (value) => {
      document.removeEventListener("keydown", handleKeyDown);
      overlay.remove();
      resolve(value);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(false);
      }
    };

    cancelBtn.addEventListener("click", () => close(false));
    confirmBtn.addEventListener("click", () => close(true));
    document.addEventListener("keydown", handleKeyDown);
    document.body.appendChild(overlay);
    confirmBtn.focus();
  });
}

async function promptForUniqueCustomTileSetName({
  promptMessage,
  defaultValue = "",
  excludeTileSetId = "",
  duplicateMessage = "A tile set with that name already exists. Choose a different name.",
}) {
  let nextName = await requestTextInput({
    title: "Custom Tile Set",
    message: promptMessage,
    defaultValue,
    confirmLabel: "Continue",
  });
  while (nextName != null) {
    const trimmedName = nextName.trim();
    if (!trimmedName) {
      setStatus("Custom tile set name is required.", true);
      nextName = await requestTextInput({
        title: "Custom Tile Set",
        message: promptMessage,
        defaultValue: trimmedName,
        confirmLabel: "Continue",
      });
      continue;
    }
    if (!hasTileSetName(trimmedName, { excludeTileSetId })) {
      return trimmedName;
    }
    setStatus(duplicateMessage, true);
    nextName = await requestTextInput({
      title: "Custom Tile Set",
      message: duplicateMessage,
      defaultValue: trimmedName,
      confirmLabel: "Continue",
    });
  }
  return "";
}

function revokeCustomTileSetAssetUrls(cache = customTileSetAssetUrlCache) {
  for (const url of cache.values()) {
    URL.revokeObjectURL(url);
  }
}

function buildRuntimeCustomTileSetRecordsFromCache() {
  return customTileSetManifestCache
    .map((manifest) => decorateStoredCustomTileSetManifest(manifest, customTileSetAssetUrlCache))
    .filter(Boolean);
}

async function fetchCustomTileAssetBlob(src) {
  const response = await fetch(src);
  if (!response.ok) {
    throw new Error(`Could not fetch custom tile asset: ${src}`);
  }
  return response.blob();
}

async function buildStoredCustomTileSetBundle(record) {
  const normalized = normalizeCustomTileSetRecord(record, { includeAssetPaths: true });
  if (!normalized?.assetPaths) {
    throw new Error("Custom tile set record is missing assetPaths.");
  }

  const assetEntries = [];
  for (const { assetKind, assetId } of getRequiredCustomTileAssetRefs(normalized)) {
    const src =
      typeof normalized.assetPaths?.[assetKind] === "string"
        ? normalized.assetPaths[assetKind]
        : normalized.assetPaths?.[assetKind]?.[assetId];
    if (!src) {
      throw new Error(`Missing custom asset path for ${assetKind}:${assetId}`);
    }
    assetEntries.push({
      key: buildCustomTileAssetStorageKey(normalized.id, assetKind, assetId),
      tileSetId: normalized.id,
      assetKind,
      assetId,
      blob: await fetchCustomTileAssetBlob(src),
    });
  }

  return {
    manifest: stripTransientCustomTileSetFields(normalized),
    assets: assetEntries,
  };
}

async function buildStoredCustomTileSetBundleFromZip(file) {
  return buildStoredCustomTileSetBundleFromZipValue(file, {
    tileIds: TILE_IDS,
    entranceTileId: ENTRANCE_TILE_ID,
    referenceCardId: REFERENCE_CARD_ID,
    builtInTileSetIds: new Set(BUILT_IN_TILE_SET_REGISTRY.map((tileSet) => tileSet.id)),
    sanitizePortalFlagPosition,
    sanitizeGuidePointTemplateOverrides,
  });
}

function ensureImportedCustomTileSetBundleHasUniqueId(bundle) {
  return ensureImportedCustomTileSetBundleHasUniqueIdValue(
    bundle,
    new Set(getTileSetRegistry().map((tileSet) => tileSet.id)),
  );
}

function replaceTileSetOverrideMapEntry(source, tileSetId, nextValue) {
  if (!nextValue || !Object.keys(nextValue).length) {
    delete source[tileSetId];
    return;
  }
  source[tileSetId] = nextValue;
}

function cloneOverrideEntry(value) {
  if (!value || typeof value !== "object") return {};
  return JSON.parse(JSON.stringify(value));
}

function cloneOverrideMap(value) {
  if (!value || typeof value !== "object") return {};
  const out = {};
  for (const [tileSetId, tileSetValue] of Object.entries(value)) {
    if (!tileSetValue || typeof tileSetValue !== "object") continue;
    out[tileSetId] = cloneOverrideEntry(tileSetValue);
  }
  return out;
}

function getBuiltInTileSetIdSet() {
  return new Set(BUILT_IN_TILE_SET_REGISTRY.map((tileSet) => tileSet.id));
}

function pickBuiltInTileSetEntries(source) {
  const builtInIds = getBuiltInTileSetIdSet();
  const out = {};
  for (const [tileSetId, tileSetValue] of Object.entries(source || {})) {
    if (!builtInIds.has(tileSetId)) continue;
    if (!tileSetValue || typeof tileSetValue !== "object" || !Object.keys(tileSetValue).length) continue;
    out[tileSetId] = cloneOverrideEntry(tileSetValue);
  }
  return out;
}

function buildCustomTileSetEditorDataRecord(tileSetId, raw = {}) {
  const wallMap = sanitizeWallOverrides({ [tileSetId]: raw.wallOverrides || raw.wallFaces || {} });
  const endMap = sanitizeEndTileOverrides({ [tileSetId]: raw.endTileOverrides || raw.allowAsEndTile || {} });
  const portalMap = sanitizePortalFlagOverrides({ [tileSetId]: raw.portalFlagOverrides || raw.portalFlags || {} });
  const guidePointTemplateOverrides = sanitizeGuidePointTemplateOverrides(
    raw.guidePointTemplateOverrides || raw.guidePointTemplates || {},
  );
  return {
    tileSetId,
    wallOverrides: cloneOverrideEntry(wallMap[tileSetId] || {}),
    endTileOverrides: cloneOverrideEntry(endMap[tileSetId] || {}),
    portalFlagOverrides: cloneOverrideEntry(portalMap[tileSetId] || {}),
    guidePointTemplateOverrides: cloneOverrideEntry(guidePointTemplateOverrides),
    updatedAt: String(raw.updatedAt || new Date().toISOString()),
  };
}

function hasCustomTileSetEditorData(record) {
  return Boolean(
    record
    && (
      Object.keys(record.wallOverrides || {}).length
      || Object.keys(record.endTileOverrides || {}).length
      || Object.keys(record.portalFlagOverrides || {}).length
      || Object.keys(record.guidePointTemplateOverrides || {}).length
    ),
  );
}

function buildCurrentCustomTileSetEditorDataRecord(tileSetId) {
  return buildCustomTileSetEditorDataRecord(tileSetId, {
    wallOverrides: state.wallOverrides?.[tileSetId] || {},
    endTileOverrides: state.endTileOverrides?.[tileSetId] || {},
    portalFlagOverrides: state.portalFlagOverrides?.[tileSetId] || {},
    guidePointTemplateOverrides: customTileSetEditorDataCache.get(tileSetId)?.guidePointTemplateOverrides || {},
    updatedAt: new Date().toISOString(),
  });
}

function buildMergedTileSetOverrideMaps(baseWallOverrides, baseEndTileOverrides, basePortalFlagOverrides) {
  const nextWallOverrides = cloneOverrideMap(baseWallOverrides);
  const nextEndTileOverrides = cloneOverrideMap(baseEndTileOverrides);
  const nextPortalFlagOverrides = cloneOverrideMap(basePortalFlagOverrides);

  for (const [tileSetId, record] of customTileSetEditorDataCache.entries()) {
    replaceTileSetOverrideMapEntry(nextWallOverrides, tileSetId, cloneOverrideEntry(record.wallOverrides || {}));
    replaceTileSetOverrideMapEntry(nextEndTileOverrides, tileSetId, cloneOverrideEntry(record.endTileOverrides || {}));
    replaceTileSetOverrideMapEntry(nextPortalFlagOverrides, tileSetId, cloneOverrideEntry(record.portalFlagOverrides || {}));
  }

  return {
    wallOverrides: nextWallOverrides,
    endTileOverrides: nextEndTileOverrides,
    portalFlagOverrides: nextPortalFlagOverrides,
  };
}

function syncStateOverrideMapsWithCustomEditorCache(baseWallOverrides, baseEndTileOverrides, basePortalFlagOverrides) {
  const merged = buildMergedTileSetOverrideMaps(
    baseWallOverrides,
    baseEndTileOverrides,
    basePortalFlagOverrides,
  );
  state.wallOverrides = merged.wallOverrides;
  state.endTileOverrides = merged.endTileOverrides;
  state.portalFlagOverrides = merged.portalFlagOverrides;
}

async function persistCustomTileSetEditorData(tileSetId) {
  const tileSet = getTileSetConfig(tileSetId);
  if (!tileSet || tileSet.source !== "custom") return;
  const record = buildCurrentCustomTileSetEditorDataRecord(tileSetId);
  if (hasCustomTileSetEditorData(record)) {
    customTileSetEditorDataCache.set(tileSetId, record);
    await saveStoredCustomTileSetEditorData(tileSetId, record);
  } else {
    customTileSetEditorDataCache.delete(tileSetId);
    await saveStoredCustomTileSetEditorData(tileSetId, buildCustomTileSetEditorDataRecord(tileSetId, {}));
  }
}

function queuePersistCustomTileSetEditorData(tileSetId) {
  persistCustomTileSetEditorData(tileSetId).catch((error) => {
    console.warn(`Could not persist custom editor data for ${tileSetId}.`, error);
  });
}

async function syncCustomTileSetEditorDataFromStorage() {
  const localWallOverrides = loadWallOverrides();
  const localEndTileOverrides = loadEndTileOverrides();
  const localPortalFlagOverrides = loadPortalFlagOverrides();
  const customTileSetIds = getTileSetRegistry()
    .filter((tileSet) => tileSet.source === "custom")
    .map((tileSet) => tileSet.id);

  const storedRecords = await listStoredCustomTileSetEditorData();
  const nextEditorDataCache = new Map();
  for (const record of storedRecords) {
    const normalized = buildCustomTileSetEditorDataRecord(record.tileSetId, record);
    if (!customTileSetIds.includes(normalized.tileSetId)) continue;
    if (!hasCustomTileSetEditorData(normalized)) continue;
    nextEditorDataCache.set(normalized.tileSetId, normalized);
  }

  let migratedCustomLocalOverrides = false;
  for (const tileSetId of customTileSetIds) {
    if (nextEditorDataCache.has(tileSetId)) continue;
    const migratedRecord = buildCustomTileSetEditorDataRecord(tileSetId, {
      wallOverrides: localWallOverrides?.[tileSetId] || {},
      endTileOverrides: localEndTileOverrides?.[tileSetId] || {},
      portalFlagOverrides: localPortalFlagOverrides?.[tileSetId] || {},
    });
    if (!hasCustomTileSetEditorData(migratedRecord)) continue;
    nextEditorDataCache.set(tileSetId, migratedRecord);
    await saveStoredCustomTileSetEditorData(tileSetId, migratedRecord);
    migratedCustomLocalOverrides = true;
  }

  customTileSetEditorDataCache = nextEditorDataCache;
  const builtInWallOverrides = pickBuiltInTileSetEntries(localWallOverrides);
  const builtInEndTileOverrides = pickBuiltInTileSetEntries(localEndTileOverrides);
  const builtInPortalFlagOverrides = pickBuiltInTileSetEntries(localPortalFlagOverrides);

  if (migratedCustomLocalOverrides
    || Object.keys(localWallOverrides).length !== Object.keys(builtInWallOverrides).length
    || Object.keys(localEndTileOverrides).length !== Object.keys(builtInEndTileOverrides).length
    || Object.keys(localPortalFlagOverrides).length !== Object.keys(builtInPortalFlagOverrides).length) {
    saveJsonStorage(WALL_OVERRIDES_STORAGE_KEY, builtInWallOverrides, "Could not save wall overrides to storage.");
    saveJsonStorage(END_TILE_OVERRIDES_STORAGE_KEY, builtInEndTileOverrides, "Could not save end-tile overrides to storage.");
    saveJsonStorage(PORTAL_FLAG_OVERRIDES_STORAGE_KEY, builtInPortalFlagOverrides, "Could not save portal flag overrides to storage.");
  }

  syncStateOverrideMapsWithCustomEditorCache(
    builtInWallOverrides,
    builtInEndTileOverrides,
    builtInPortalFlagOverrides,
  );
}

async function applyImportedWallEditorData(tileSetId, wallEditorData) {
  if (!wallEditorData) return;

  replaceTileSetOverrideMapEntry(state.wallOverrides, tileSetId, wallEditorData.wallOverrides);
  replaceTileSetOverrideMapEntry(state.endTileOverrides, tileSetId, wallEditorData.endTileOverrides);
  replaceTileSetOverrideMapEntry(state.portalFlagOverrides, tileSetId, wallEditorData.portalFlagOverrides);

  const tileSet = getTileSetConfig(tileSetId);
  if (tileSet?.source === "custom") {
    const record = buildCustomTileSetEditorDataRecord(tileSetId, wallEditorData);
    if (hasCustomTileSetEditorData(record)) customTileSetEditorDataCache.set(tileSetId, record);
    await saveStoredCustomTileSetEditorData(tileSetId, record);
  } else {
    saveWallOverrides();
    saveEndTileOverrides();
    savePortalFlagOverrides();
  }

  if (wallEditorData.guidePointTemplateOverrides && Object.keys(wallEditorData.guidePointTemplateOverrides).length) {
    if (tileSet?.source === "custom") {
      const existingRecord = customTileSetEditorDataCache.get(tileSetId) || buildCustomTileSetEditorDataRecord(tileSetId, {});
      const nextRecord = buildCustomTileSetEditorDataRecord(tileSetId, {
        ...existingRecord,
        guidePointTemplateOverrides: wallEditorData.guidePointTemplateOverrides,
      });
      customTileSetEditorDataCache.set(tileSetId, nextRecord);
      await saveStoredCustomTileSetEditorData(tileSetId, nextRecord);
    } else {
      state.guidePointTemplateOverrides = {
        ...state.guidePointTemplateOverrides,
        ...wallEditorData.guidePointTemplateOverrides,
      };
      saveGuidePointTemplateOverrides();
    }
  }

}

function removeCustomTileSetLocalState(tileSetId) {
  delete state.wallOverrides[tileSetId];
  delete state.endTileOverrides[tileSetId];
  delete state.portalFlagOverrides[tileSetId];
  customTileSetEditorDataCache.delete(tileSetId);
  saveWallOverrides();
  saveEndTileOverrides();
  savePortalFlagOverrides();
}

async function importCustomTileSetPackage(file) {
  if (!file) return;
  setStatus(`Importing custom tileset from ${file.name}...`);
  const rawBundle = await buildStoredCustomTileSetBundleFromZip(file);
  await importCustomTileSetBundle(rawBundle);
}

async function importCustomTileSetFolder(folderPath) {
  if (!folderPath) return;
  const folderName = String(folderPath).split(/[\\/]/).filter(Boolean).at(-1) || folderPath;
  setStatus(`Importing custom tileset from ${folderName}...`);
  const rawBundle = await readCustomTileSetFolderBundle(folderPath, {
    tileIds: TILE_IDS,
    entranceTileId: ENTRANCE_TILE_ID,
    referenceCardId: REFERENCE_CARD_ID,
    builtInTileSetIds: new Set(BUILT_IN_TILE_SET_REGISTRY.map((tileSet) => tileSet.id)),
  });
  await importCustomTileSetBundle(rawBundle);
}

async function importCustomTileSetBundle(rawBundle) {
  let importBundle = rawBundle;
  const importedLabel = rawBundle?.manifest?.label || rawBundle?.manifest?.id || "";
  if (hasTileSetName(importedLabel)) {
    const nextLabel = await promptForUniqueCustomTileSetName({
      promptMessage: `The imported tile set name "${importedLabel}" is already used. Enter a new name for the imported tile set:`,
      defaultValue: importedLabel,
      duplicateMessage: "That tile set name is already used. Enter a different name for the imported tile set.",
    });
    if (!nextLabel) {
      setStatus("Custom tile set import canceled.", true);
      return;
    }
    importBundle = {
      ...rawBundle,
      manifest: {
        ...rawBundle.manifest,
        label: nextLabel,
      },
    };
  }
  const bundle = ensureImportedCustomTileSetBundleHasUniqueId(importBundle);
  await saveStoredCustomTileSetBundle(bundle.manifest, bundle.assets);
  await refreshRuntimeTileSetRegistry(null, {
    reloadActiveTileSet: false,
    rerenderWallEditor: false,
  });
  await applyImportedWallEditorData(bundle.manifest.id, bundle.wallEditorData);
  state.wallEditorGroupId = getWallEditorGroupIdForTileSet(bundle.manifest.id);
  state.wallEditorActiveTileSetId = bundle.manifest.id;
  state.wallEditorActiveTileId = bundle.manifest.entranceTileId;
  syncTileSetMenuOptions();
  syncSelectedTileSetHeading();
  syncBossTileSetHeading();

  if (tileSetSelect) tileSetSelect.value = bundle.manifest.id;
  if (getTileSetConfig(bundle.manifest.id)?.status === "ready") {
    await applyTileSet(bundle.manifest.id, false);
    syncTileSetMenuOptions();
  }
  if (state.wallEditMode) {
    await renderWallEditorPage();
    setActiveWallEditorTile(bundle.manifest.id, bundle.manifest.entranceTileId);
  }
  const importedAsCopy = rawBundle?.manifest?.id && rawBundle.manifest.id !== bundle.manifest.id;
  markDevQaCheck("import_custom_tileset", { detail: bundle.manifest.id });
  allowLocalDataNoticeAfterCustomChange();
  markCustomTileSetBackupNeeded(bundle.manifest.id);
  showLocalDataNotice("custom", bundle.manifest.id);
  setStatus(
    importedAsCopy || importedLabel !== bundle.manifest.label
      ? `Imported custom tileset as a new copy: ${bundle.manifest.label}.`
      : `Imported custom tileset: ${bundle.manifest.label}.`,
  );
}

async function openTileSetFolderImportPicker() {
  if (IS_TAURI_RUNTIME) {
    const hasFolder = await ensureDataFolderPath({ promptIfMissing: false });
    if (!hasFolder) {
      const configured = await promptForDataFolderSelection({
        title: "Choose a Data Folder",
        message: "Importing custom tile sets needs a data folder first. Choose one now, or skip for now and the import will be canceled.",
        resumeAction: "open-custom-tileset-folder-import",
      });
      if (!configured) return;
    }
  }
  const folderPath = await chooseFolderPath(getStoredDataFolderPath(), { title: "Open Tile Set Folder" });
  if (!folderPath) {
    setStatus("Tile set folder import canceled.");
    return;
  }
  await importCustomTileSetFolder(folderPath);
}

async function openCustomTileSetImportPicker() {
  if (IS_TAURI_RUNTIME) {
    const hasFolder = await ensureDataFolderPath({ promptIfMissing: false });
    if (!hasFolder) {
      const configured = await promptForDataFolderSelection({
        title: "Choose a Data Folder",
        message: "Importing custom tile sets needs a data folder first. Choose one now, or skip for now and the import will be canceled.",
        resumeAction: "open-custom-tileset-import",
      });
      if (!configured) return;
    }
  }
  if (!importCustomTileSetInput) return;
  importCustomTileSetInput.value = "";
  importCustomTileSetInput.click();
}

async function bindNativeMenuActions() {
  if (!IS_TAURI_RUNTIME) return;
  if (nativeMenuActionUnlisten || typeof window.__TAURI__?.event?.listen !== "function") return;
  nativeMenuActionUnlisten = await window.__TAURI__.event.listen("native-menu-action", async ({ payload }) => {
    const action = String(payload || "");
    try {
      if (action === "import-custom-tileset") {
        await openCustomTileSetImportPicker();
        return;
      }
      if (action === "open-guide") {
        window.location.href = "./about.html";
        return;
      }
      if (action === "open-donate") {
        const confirmed = await requestChoiceDialog({
          title: "Open PayPal?",
          message: "You are about to open a PayPal link in your browser.",
          confirmLabel: "Open",
          cancelLabel: "Cancel",
        });
        if (!confirmed) return;
        const tauriInvoke = window.__TAURI__?.core?.invoke;
        if (typeof tauriInvoke !== "function") {
          throw new Error("Could not open the browser.");
        }
        await tauriInvoke("open_external_url", {
          url: "https://www.paypal.com/donate/?business=BBGV34SWDBEXG&no_recurring=1&item_name=Buy+Me+a+Little+Dungeon+Fuel&currency_code=DKK",
        });
        return;
      }
      if (action === "export-all-custom-tile-sets") {
        await exportAllCustomTileSets();
        return;
      }
      if (action === "export-pdf") {
        markDevQaCheck("export_pdf");
        exportCurrentLayoutPdf();
      }
    } catch (error) {
      console.error(error);
      setStatus(error?.message || `Could not handle menu action: ${action}.`, true);
    }
  });
}

async function promptAndCreateCustomTileSet() {
  const trimmedName = await promptForUniqueCustomTileSetName({
    promptMessage: "Name your custom tile set:",
  });
  if (!trimmedName) return;

  const manifest = buildNewCustomTileSetManifest(trimmedName);
  await saveStoredCustomTileSetBundle(manifest, []);
  await saveStoredCustomTileSetEditorData(manifest.id, buildCustomTileSetEditorDataRecord(manifest.id, {}));
  await refreshRuntimeTileSetRegistry(null, { reloadActiveTileSet: false });
  allowLocalDataNoticeAfterCustomChange();
  markCustomTileSetBackupNeeded(manifest.id);
  state.selectedTileSetId = manifest.id;
  state.wallEditorGroupId = getWallEditorGroupIdForTileSet(manifest.id);
  if (tileSetSelect) tileSetSelect.value = manifest.id;
  syncTileSetMenuOptions();
  syncSelectedTileSetHeading();
  syncBossTileSetHeading();
  if (!state.wallEditMode) {
    setWallEditMode(true);
  }
  state.wallEditorActiveTileSetId = manifest.id;
  state.wallEditorActiveTileId = manifest.entranceTileId;
  await rerenderWallEditorPreservingScroll();
  setActiveWallEditorTile(manifest.id, manifest.entranceTileId);
  markDevQaCheck("add_custom_tileset", { detail: manifest.id });
  showLocalDataNotice("custom", manifest.id);
  setStatus(`Created custom tile set: ${manifest.label}. Load art in the editor slots.`);
}

async function replaceCustomTileSetAsset(tileSetId, assetKind, assetId, file) {
  if (!file) return;
  const blob = file instanceof Blob
    ? file
    : new Blob([file], { type: file?.type || "application/octet-stream" });
  const bundle = await getStoredCustomTileSetBundle(tileSetId);
  if (!bundle?.manifest) throw new Error(`Could not find stored custom tileset: ${tileSetId}`);

  const nextAssets = (bundle.assets || [])
    .filter((asset) => !(asset.assetKind === assetKind && asset.assetId === assetId));
  nextAssets.push({
    key: buildCustomTileAssetStorageKey(tileSetId, assetKind, assetId),
    tileSetId,
    assetKind,
    assetId,
    blob,
  });
  await saveStoredCustomTileSetBundle(bundle.manifest, nextAssets);
  const assetKey = buildCustomTileAssetStorageKey(tileSetId, assetKind, assetId);
  const previousUrl = customTileSetAssetUrlCache.get(assetKey);
  if (previousUrl) URL.revokeObjectURL(previousUrl);
  customTileSetAssetUrlCache.set(assetKey, URL.createObjectURL(blob));
  const cachedManifest = stripTransientCustomTileSetFields(bundle.manifest);
  const manifestIndex = customTileSetManifestCache.findIndex((entry) => entry.id === tileSetId);
  if (manifestIndex >= 0) customTileSetManifestCache[manifestIndex] = cachedManifest;
  else customTileSetManifestCache.push(cachedManifest);
  await refreshRuntimeTileSetRegistry(buildRuntimeCustomTileSetRecordsFromCache(), {
    reloadActiveTileSet: false,
    rerenderWallEditor: false,
  });
  state.selectedTileSetId = tileSetId;
  state.wallEditorGroupId = getWallEditorGroupIdForTileSet(tileSetId);
  state.wallEditorActiveTileSetId = tileSetId;
  state.wallEditorActiveTileId = assetKind === "tile" || assetKind === "entrance" ? assetId : state.wallEditorActiveTileId;
  if (state.wallEditMode) {
    const patchedInPlace = await patchWallEditorAssetSlot(tileSetId, assetKind, assetId);
    if (!patchedInPlace) {
      await rerenderWallEditorPreservingScroll();
    }
    if (state.wallEditorActiveTileId) setActiveWallEditorTile(tileSetId, state.wallEditorActiveTileId);
  }
  allowLocalDataNoticeAfterCustomChange();
  markCustomTileSetBackupNeeded(tileSetId);
  showLocalDataNotice("custom", tileSetId);
  setStatus(`${getTileSetConfig(tileSetId)?.label || tileSetId} ${assetId} image updated.`);
}

async function renameCustomTileSet(tileSetId) {
  const tileSet = getTileSetConfig(tileSetId);
  if (!tileSet || tileSet.source !== "custom") return;
  const trimmedLabel = await promptForUniqueCustomTileSetName({
    promptMessage: "Rename custom tile set:",
    defaultValue: tileSet.label || "",
    excludeTileSetId: tileSetId,
  });
  if (!trimmedLabel) return;

  const bundle = await getStoredCustomTileSetBundle(tileSetId);
  if (!bundle?.manifest) throw new Error(`Could not find stored custom tileset: ${tileSetId}`);
  const nextManifest = {
    ...bundle.manifest,
    label: trimmedLabel,
  };
  await saveStoredCustomTileSetBundle(nextManifest, bundle.assets || []);
  const manifestIndex = customTileSetManifestCache.findIndex((entry) => entry.id === tileSetId);
  if (manifestIndex >= 0) customTileSetManifestCache[manifestIndex] = stripTransientCustomTileSetFields(nextManifest);
  await refreshRuntimeTileSetRegistry(buildRuntimeCustomTileSetRecordsFromCache(), { reloadActiveTileSet: false });
  allowLocalDataNoticeAfterCustomChange();
  markCustomTileSetBackupNeeded(tileSetId);
  state.selectedTileSetId = tileSetId;
  state.wallEditorGroupId = getWallEditorGroupIdForTileSet(tileSetId);
  if (tileSetSelect) tileSetSelect.value = tileSetId;
  syncTileSetMenuOptions();
  syncSelectedTileSetHeading();
  syncBossTileSetHeading();
  if (state.wallEditMode) {
    await rerenderWallEditorPreservingScroll();
    if (state.wallEditorActiveTileSetId && state.wallEditorActiveTileId) {
      setActiveWallEditorTile(state.wallEditorActiveTileSetId, state.wallEditorActiveTileId);
    }
  }
  showLocalDataNotice("custom", tileSetId);
  setStatus(`Renamed custom tile set to ${trimmedLabel}.`);
}

async function saveBlobWithTauriIfAvailable(blob, filename) {
  const tauriInvoke = window.__TAURI__?.core?.invoke;
  if (typeof tauriInvoke !== "function") return false;
  const savePath = await tauriInvoke("plugin:dialog|save", {
    options: {
      title: "Export File",
      defaultPath: filename,
      filters: [
        {
          name: "Zip Archive",
          extensions: ["zip"],
        },
      ],
    },
  });
  if (!savePath) {
    setStatus("Export canceled.");
    return true;
  }
  const outputPath = filename.toLowerCase().endsWith(".zip") && !String(savePath).toLowerCase().endsWith(".zip")
    ? `${savePath}.zip`
    : savePath;
  const bytes = Array.from(new Uint8Array(await blob.arrayBuffer()));
  const savedPath = await tauriInvoke("save_blob_to_path", { path: outputPath, bytes });
  setStatus(`Saved ${filename}.`);
  console.info(`Saved ${filename} to ${savedPath}`);
  return true;
}

function downloadBlob(blob, filename) {
  const isTauriApp = typeof window.__TAURI__?.core?.invoke === "function";
  saveBlobWithTauriIfAvailable(blob, filename)
    .catch((error) => {
      console.warn("Tauri save dialog export failed.", error);
      if (isTauriApp) {
        setStatus("Could not open save dialog for export.", true);
        return true;
      }
      return false;
    })
    .then((handled) => {
      if (handled) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    });
}

function buildExportedWallEditorData(tileSet) {
  const tileIds = [tileSet.entranceTileId, ...tileSet.tileIds];
  const wallFaces = {};
  const allowAsEndTile = {};
  const portalFlags = {};

  for (const tileId of tileIds) {
    wallFaces[tileId] = getStoredWallFaces(tileSet.id, tileId);
    allowAsEndTile[tileId] = getStoredAllowAsEndTile(tileSet.id, tileId);
    const portalFlag = getStoredPortalFlag(tileSet.id, tileId);
    if (portalFlag) {
      portalFlags[tileId] = portalFlag;
    }
  }

  const payload = {
    wallFaces,
    allowAsEndTile,
    portalFlags,
  };

  const guidePointTemplateOverrides = tileSet?.source === "custom"
    ? cloneOverrideEntry(customTileSetEditorDataCache.get(tileSet.id)?.guidePointTemplateOverrides || {})
    : cloneOverrideEntry(state.guidePointTemplateOverrides || {});
  if (Object.keys(guidePointTemplateOverrides).length) {
    payload.guidePointTemplateOverrides = guidePointTemplateOverrides;
  }

  return payload;
}

async function exportCustomTileSet(tileSetId) {
  const { tileSet, archive, filename } = await buildCustomTileSetExportArchive(tileSetId);
  downloadBlob(archive, filename);
  markCustomTileSetBackedUp(tileSetId);
  setStatus(`Exported custom tile set: ${tileSet.label}.`);
}

async function saveCustomTileSetAsFolder(tileSetId, folderPath = "") {
  const tileSet = getTileSetConfig(tileSetId);
  if (!tileSet || tileSet.source !== "custom") {
    setStatus("Only custom tile sets can be saved as folders.", true);
    return;
  }
  if (!folderPath) {
    setStatus("Tile set folder save canceled.");
    return;
  }

  const bundle = await getStoredCustomTileSetBundle(tileSetId);
  if (!bundle?.manifest) {
    throw new Error(`Could not find stored custom tileset: ${tileSetId}`);
  }
  if (!bundle.assets?.length) {
    throw new Error("This custom tile set has no stored images to export yet.");
  }

  const { manifest } = buildExportedCustomTileSetManifest(bundle.manifest, bundle.assets);
  const wallEditorData = buildExportedWallEditorData(tileSet);
  await saveCustomTileSetFolderBundle(folderPath, {
    manifest,
    assetEntries: bundle.assets,
    wallEditorData,
  });
  markCustomTileSetBackedUp(tileSetId);
  setStatus(`Saved ${tileSet.label} to ${folderPath}.`);
}

function markCustomTileSetBackupNeeded(tileSetId) {
  if (!tileSetId) return;
  const wasAlreadyMarked = state.customTileSetBackupNeededIds.has(tileSetId);
  state.customTileSetBackupNeededIds.add(tileSetId);
  saveCustomTileSetBackupNeededIds();
  if (!wasAlreadyMarked && state.wallEditMode) {
    rerenderWallEditorPreservingScroll().catch((error) => {
      console.error(error);
      setStatus("Could not refresh tile editor backup indicators.", true);
    });
  }
}

function markCustomTileSetBackedUp(tileSetId) {
  if (!tileSetId) return;
  state.customTileSetBackupNeededIds.delete(tileSetId);
  saveCustomTileSetBackupNeededIds();
  if (state.wallEditMode) {
    renderWallEditorPage().catch((error) => {
      console.error(error);
      setStatus("Could not refresh tile editor backup indicators.", true);
    });
  }
}

function allowLocalDataNoticeAfterCustomChange() {
  localDataNoticeSuppressedUntilCustomChange = false;
  try {
    sessionStorage.removeItem(LOCAL_DATA_NOTICE_SUPPRESSED_SESSION_KEY);
  } catch {
    // ignore
  }
}

function loadLocalDataNoticeSuppressedUntilCustomChange() {
  try {
    return sessionStorage.getItem(LOCAL_DATA_NOTICE_SUPPRESSED_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

function loadCustomTileSetBackupNeededIds() {
  if (IS_TAURI_RUNTIME && !isDataFolderPersistenceActive()) return new Set();
  try {
    const raw = localStorage.getItem(CUSTOM_TILE_SET_BACKUP_NEEDED_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map((tileSetId) => String(tileSetId || "").trim()).filter(Boolean));
  } catch (error) {
    console.warn("Could not load custom tile set backup reminders.", error);
    return new Set();
  }
}

function saveCustomTileSetBackupNeededIds() {
  saveJsonStorage(
    CUSTOM_TILE_SET_BACKUP_NEEDED_STORAGE_KEY,
    [...state.customTileSetBackupNeededIds],
    "Could not save custom tile set backup reminders.",
  );
}

function pruneCustomTileSetBackupNeededIds() {
  const customTileSetIds = new Set(
    getTileSetRegistry()
      .filter((tileSet) => tileSet.source === "custom")
      .map((tileSet) => tileSet.id),
  );
  let changed = false;
  for (const tileSetId of [...state.customTileSetBackupNeededIds]) {
    if (customTileSetIds.has(tileSetId)) continue;
    state.customTileSetBackupNeededIds.delete(tileSetId);
    changed = true;
  }
  if (changed) saveCustomTileSetBackupNeededIds();
}

function showPersistedCustomTileSetBackupNotice() {
  const tileSetId = [...state.customTileSetBackupNeededIds]
    .find((candidate) => getTileSetConfig(candidate)?.source === "custom");
  if (!tileSetId) return;
  showLocalDataNotice("custom", tileSetId);
}

function getCustomTileSetBackupNeededLabels() {
  return [...state.customTileSetBackupNeededIds]
    .map((tileSetId) => getTileSetConfig(tileSetId))
    .filter((tileSet) => tileSet?.source === "custom")
    .map((tileSet) => tileSet.label || tileSet.id);
}

function buildUniqueBackupEntryName(filename, tileSetId, usedNames) {
  const normalizedUsedNames = usedNames instanceof Set ? usedNames : new Set();
  if (!normalizedUsedNames.has(filename)) {
    normalizedUsedNames.add(filename);
    return filename;
  }

  const extensionMatch = filename.match(/(\.[^.]+)$/);
  const extension = extensionMatch?.[1] || "";
  const baseName = extension ? filename.slice(0, -extension.length) : filename;
  const idSuffix = sanitizeCustomTileSetFilename(tileSetId || "copy");
  let candidate = `${baseName}-${idSuffix}${extension}`;
  let copyIndex = 2;
  while (normalizedUsedNames.has(candidate)) {
    candidate = `${baseName}-${idSuffix}-${copyIndex}${extension}`;
    copyIndex += 1;
  }
  normalizedUsedNames.add(candidate);
  return candidate;
}

async function exportAllCustomTileSets() {
  const customTileSets = getTileSetRegistry().filter((tileSet) => tileSet.source === "custom");
  if (!customTileSets.length) {
    setStatus("No custom tile sets are available to export.", true);
    return;
  }

  const exportedEntries = [];
  const skippedLabels = [];
  const usedBackupEntryNames = new Set();
  for (const tileSet of customTileSets) {
    try {
      const { archive, filename } = await buildCustomTileSetExportArchive(tileSet.id);
      exportedEntries.push({
        name: buildUniqueBackupEntryName(filename, tileSet.id, usedBackupEntryNames),
        data: archive,
        tileSetId: tileSet.id,
      });
    } catch (error) {
      console.warn(`Skipping custom tile set export for ${tileSet.id}.`, error);
      skippedLabels.push(tileSet.label || tileSet.id);
    }
  }

  if (!exportedEntries.length) {
    setStatus("No custom tile sets could be exported yet. Add images first.", true);
    return;
  }

  const date = new Date().toISOString().slice(0, 10);
  const readmeLines = [
    "Here to Slay: DUNGEONS Mapper - Custom Tile Set Backup",
    "",
    `Exported: ${new Date().toISOString()}`,
    `Included custom tile sets: ${exportedEntries.length}`,
  ];
  if (skippedLabels.length) {
    readmeLines.push("", `Skipped (not exportable yet): ${skippedLabels.join(", ")}`);
  }
  readmeLines.push(
    "",
    "Each included .zip is a single custom tile set package that can be imported independently.",
  );
  exportedEntries.unshift({
    name: "README.txt",
    data: readmeLines.join("\n"),
  });

  const bundle = await createZipArchive(exportedEntries);
  downloadBlob(bundle, `custom-tile-sets-backup-${date}.zip`);
  for (const entry of exportedEntries) {
    if (entry.tileSetId) state.customTileSetBackupNeededIds.delete(entry.tileSetId);
  }
  saveCustomTileSetBackupNeededIds();
  if (state.wallEditMode) {
    renderWallEditorPage().catch((error) => {
      console.error(error);
      setStatus("Could not refresh tile editor backup indicators.", true);
    });
  }
  markDevQaCheck("export_all_custom_tilesets", { detail: `${exportedEntries.length - 1} exported` });
  if (skippedLabels.length) {
    setStatus(`Exported ${exportedEntries.length - 1} custom tile set(s). Skipped ${skippedLabels.length} without exportable data.`);
  } else {
    setStatus(`Exported all custom tile sets (${exportedEntries.length - 1}).`);
  }
}

async function deleteCustomTileSet(tileSetId) {
  const tileSet = getTileSetConfig(tileSetId);
  if (!tileSet || tileSet.source !== "custom") return;
  const confirmed = window.confirm(`Delete custom tile set "${tileSet.label}"?`);
  if (!confirmed) return;

  const deletedWasSelected = state.selectedTileSetId === tileSetId;
  const remainingCustomTileSetId = customTileSetManifestCache
    .find((entry) => entry.id !== tileSetId)?.id || "";
  const intendedFallbackTileSetId = state.wallEditMode
    ? (remainingCustomTileSetId
      || getTileSetRegistry().find((entry) => entry.id !== tileSetId && entry.status === "ready")?.id
      || BUILT_IN_TILE_SET_REGISTRY[0]?.id
      || DEFAULT_TILE_SET_ID)
    : (getTileSetRegistry().find((entry) => entry.id !== tileSetId && entry.status === "ready")?.id
      || BUILT_IN_TILE_SET_REGISTRY[0]?.id
      || DEFAULT_TILE_SET_ID);
  await deleteStoredCustomTileSetBundle(tileSetId);
  removeCustomTileSetLocalState(tileSetId);
  if (deletedWasSelected) {
    state.selectedTileSetId = intendedFallbackTileSetId;
  }
  if (state.wallEditorActiveTileSetId === tileSetId) {
    state.wallEditorActiveTileSetId = null;
    state.wallEditorActiveTileId = null;
  }

  await refreshRuntimeTileSetRegistry(null, { reloadActiveTileSet: false });
  if (deletedWasSelected || !getTileSetRegistry().some((entry) => entry.id === state.selectedTileSetId)) {
    if (state.wallEditMode) {
      state.selectedTileSetId = getTileSetRegistry().find((entry) => entry.source === "custom")?.id
        || getTileSetRegistry().find((entry) => entry.status === "ready")?.id
        || BUILT_IN_TILE_SET_REGISTRY[0]?.id
        || DEFAULT_TILE_SET_ID;
    } else {
      state.selectedTileSetId = getTileSetRegistry().some((entry) => entry.id === intendedFallbackTileSetId)
        ? intendedFallbackTileSetId
        : (getTileSetRegistry().find((entry) => entry.status === "ready")?.id
          || BUILT_IN_TILE_SET_REGISTRY[0]?.id
          || DEFAULT_TILE_SET_ID);
    }
  }
  state.wallEditorGroupId = getWallEditorGroupIdForTileSet(state.selectedTileSetId);
  if (tileSetSelect) tileSetSelect.value = state.selectedTileSetId;
  syncTileSetMenuOptions();
  syncSelectedTileSetHeading();
  syncBossTileSetHeading();

  if (state.wallEditMode) {
    await rerenderWallEditorPreservingScroll();
  } else if (getTileSetConfig(state.selectedTileSetId)?.status === "ready") {
    await applyTileSet(state.selectedTileSetId, false);
  }

  setStatus(`Deleted custom tile set: ${tileSet.label}.`);
}

function promptForCustomTileSetAsset(tileSetId, assetKind, assetId) {
  state.wallEditorAssetScrollAnchor = { tileSetId, assetKind, assetId };
  const picker = document.createElement("input");
  picker.type = "file";
  picker.accept = "image/png,image/webp,image/jpeg";
  picker.hidden = true;
  document.body.appendChild(picker);
  picker.addEventListener("change", async () => {
    const file = picker.files?.[0];
    picker.remove();
    if (!file) return;
    try {
      await replaceCustomTileSetAsset(tileSetId, assetKind, assetId, file);
    } catch (error) {
      console.error(error);
      setStatus(error?.message || "Could not update custom tile asset.", true);
    }
  }, { once: true });
  picker.click();
}

function buildCustomTileSetAssetUrlCache(bundles) {
  const nextCache = new Map();
  for (const bundle of bundles) {
    for (const assetEntry of bundle.assets || []) {
      if (!(assetEntry.blob instanceof Blob)) continue;
      nextCache.set(assetEntry.key, URL.createObjectURL(assetEntry.blob));
    }
  }
  return nextCache;
}

function decorateStoredCustomTileSetManifest(manifest, assetUrlCache) {
  const normalized = normalizeCustomTileSetRecord(manifest);
  if (!normalized) return null;

  return {
    ...normalized,
    source: "custom",
    assetResolver: (assetKind, assetId = "") => {
      const requestedAssetId =
        assetKind === "entrance"
          ? (assetId || normalized.entranceTileId)
          : assetKind === "reference"
            ? (assetId || normalized.referenceCardId)
            : assetId;
      const key = buildCustomTileAssetStorageKey(normalized.id, assetKind, requestedAssetId);
      return assetUrlCache.get(key) || "";
    },
  };
}

async function migrateLegacyCustomTileSetRecords() {
  if (IS_TAURI_RUNTIME) return;
  try {
    const bundles = await listStoredCustomTileSetBundles();
    if (bundles.length > 0) return;
    const raw = localStorage.getItem(LEGACY_CUSTOM_TILE_SET_RECORDS_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return;
    for (const entry of parsed) {
      const bundle = await buildStoredCustomTileSetBundle(entry);
      await saveStoredCustomTileSetBundle(bundle.manifest, bundle.assets);
    }
    localStorage.removeItem(LEGACY_CUSTOM_TILE_SET_RECORDS_STORAGE_KEY);
  } catch (error) {
    console.warn("Could not migrate legacy custom tile set records.", error);
  }
}

async function loadStoredCustomTileSetRecords() {
  const bundles = await listStoredCustomTileSetBundles();
  const nextCache = buildCustomTileSetAssetUrlCache(bundles);
  customTileSetManifestCache = bundles
    .map((bundle) => stripTransientCustomTileSetFields(bundle.manifest))
    .filter(Boolean);
  customTileSetAssetUrlCache = nextCache;
  return buildRuntimeCustomTileSetRecordsFromCache();
}

function buildRuntimeTileSetRegistry(customTileSetRecords = []) {
  const builtIns = cloneBuiltInTileSetRegistry();
  const builtInIds = new Set(builtIns.map((tileSet) => tileSet.id));
  const custom = [];
  const seenIds = new Set(builtInIds);

  for (const record of customTileSetRecords) {
    const normalized = normalizeCustomTileSetRecord(record);
    if (!normalized) continue;
    if (seenIds.has(normalized.id)) continue;
    seenIds.add(normalized.id);
    custom.push(normalized);
  }

  return [...builtIns, ...custom];
}

function setRuntimeTileSetRegistry(customTileSetRecords = []) {
  runtimeTileSetRegistry = buildRuntimeTileSetRegistry(customTileSetRecords);
  state.tileSetRegistry = runtimeTileSetRegistry;
  defaultWallFaceData = buildDefaultWallFaceData();
  return runtimeTileSetRegistry;
}

// WALL_EDITOR_BASE_GROUPS and getWallEditorGroups moved to modules/wall-editor-ui.js

function getWallEditorCtx() {
  return {
    state,
    wallEditorPage,
    builtInTileSetRegistry: BUILT_IN_TILE_SET_REGISTRY,
    hasDataFolderPath: !IS_TAURI_RUNTIME || Boolean(getStoredDataFolderPath()),
    TILE_SIZE,
    SIDES,
    // Tile set helpers
    getTileSetRegistry,
    getTileSetConfig,
    getTileDisplayLabel,
    resolveTileSetAssetPath,
    buildTileDefs,
    buildTileKey,
    isEntranceTile,
    isMoltenRegularTile,
    isMoltenEntranceTile,
    // Image/geometry
    loadImage,
    getFaceGeometry,
    createTileGuideOverlay,
    createHexClusterGuideElement,
    clearTileGeometryCache,
    // Persistence
    getStoredWallFaces,
    getStoredAllowAsEndTile,
    getStoredPortalFlag,
    persistTileWallFaces,
    persistAllowAsEndTile,
    persistPortalFlag,
    // Portal
    syncTilePortalFlag,
    sanitizePortalFlagPosition,
    hasPortalFlag,
    clamp,
    // UI
    setStatus,
    refreshTileWallGuide,
    syncWallEditorPointEditModeClass,
    refreshAllGuideTemplateConsumers,
    waitForNextPaint,
    // Custom tileset actions
    promptAndCreateCustomTileSet,
    openCustomTileSetImportPicker,
    exportAllCustomTileSets,
    exportCustomTileSet,
    renameCustomTileSet,
    deleteCustomTileSet,
    promptForCustomTileSetAsset,
    copyGuidePointTemplateExport,
  };
}

function getWallEditorGroups() {
  return getWallEditorGroupsUI(getWallEditorCtx());
}

function getTilePlacementCtx() {
  return {
    state,
    board,
    get boardWidth() { return board.clientWidth; },
    get boardHeight() { return board.clientHeight; },
    // Constants
    TILE_SIZE,
    SIDES,
    SNAP_SEARCH_RADIUS,
    SNAP_VISUAL_GAP,
    SNAP_POINT_GAP,
    SNAP_COORD_QUANTUM,
    OPPOSITE_NORMAL_THRESHOLD,
    CONTACT_DISTANCE_RATIO,
    FACE_TANGENT_ALIGNMENT,
    MIN_CONTACT_POINTS,
    END_TILE_MAX_CONNECTED_FACES,
    ROTATION_STEP,
    ENTRANCE_BLOCKED_FACE_INDICES,
    BLOCKED_POINT_TOUCH_RADIUS,
    ENTRANCE_TILE_ID,
    OVERLAP_POLYGON_INSET_PX,
    TILE_POSE_GEOMETRY_CACHE_LIMIT,
    INVALID_RETURN_DELAY_MS,
    INVALID_DROP_PUSH_PX,
    // Caches
    tilePoseGeometryCache,
    tileSideDirectionsCache,
    // Module values (unwrapped)
    getTilePoseGeometryValue,
    getSideDirectionsValue,
    buildInsetPolygonValue,
    hasAnyOverlapValue,
    findBestContactValue,
    countSideContactsValue,
    getContactMatchDetailsValue,
    isWorldPointOnOpaquePixelValue,
    getAlphaMaskValue,
    getFaceGeometryValue,
    getSideSamplesValue,
    getMatchAlignmentCorrectionValue,
    // Geometry
    normalizeAngle,
    getPolygonBounds,
    boundsOverlap,
    pointInPolygonStrict,
    polygonsOverlap,
    clamp,
    // Tile helpers
    isEntranceTile,
    hasPortalFlag,
    getGuideFacePoints,
    getWallFaceSignature,
    getTileDisplayLabel,
    snapBoardPointToHex,
    getBoardHexLayout,
    // UI / DOM
    setStatus,
    updateTileTransform,
    scheduleBoardHexGridRender,
    updateTileParent,
    selectTile,
    placeTileInTray,
    updatePlacedProgress,
    syncRegularTileActivityFromSlotOrder,
  };
}

function getThemeManagerCtx() {
  return {
    state,
    // Constants
    APPEARANCE_MODE_IDS,
    APPEARANCE_MODE_ICON_SVG,
    APPEARANCE_MODE_STORAGE_KEY,
    AUTO_THEME_BY_TILE_SET_STORAGE_KEY,
    DEFAULT_APPEARANCE_MODE,
    DEFAULT_DARK_THEME,
    DEFAULT_UI_THEME_ID,
    LAST_DARK_UI_THEME_STORAGE_KEY,
    LAST_LIGHT_UI_THEME_STORAGE_KEY,
    UI_THEME_CATALOG,
    UI_THEME_IDS,
    UI_THEME_STORAGE_KEY,
    // DOM elements
    appearanceModeDropdown,
    appearanceModeMenu,
    appearanceModeTrigger,
    autoThemeToggleBtn,
    uiThemeDropdown,
    uiThemeMenu,
    uiThemeSelect,
    uiThemeTrigger,
    get uiThemeOptionCatalog() { return uiThemeOptionCatalog; },
    set uiThemeOptionCatalog(v) { uiThemeOptionCatalog = v; },
    // Helpers
    getUiThemeById,
    getTileSetConfig,
    sanitizeDarkUiThemeId,
    sanitizeLightUiThemeId,
    saveDataSetting,
    scheduleBoardHexGridRender,
    setStatus,
  };
}

function getShareFlowCtx() {
  return {
    state,
    board,
    // Constants
    BUILT_IN_TILE_SET_REGISTRY,
    DEFAULT_BOARD_ZOOM,
    DEFAULT_TILE_SET_ID,
    ENTRANCE_TILE_ID,
    TILE_SIZE,
    TRAY_SLOT_COUNT,
    // Encoding
    buildShareLayoutPayload,
    buildShareLayoutSnapshotFromPayload,
    buildShareLayoutUrl,
    buildShareFallbackPayloadValue,
    decodeBase64Url,
    getShareQueryParam,
    // Tile set helpers
    buildBossAssetKey,
    buildExportedCustomTileSetManifest,
    buildExportedWallEditorData,
    buildTileDefs,
    createZipArchive,
    deriveLegacyRegularTileOrder,
    downloadBlob,
    findTileSetConfigById,
    getBossKeyForLegacySrc,
    getStoredCustomTileSetBundle,
    getTileSetConfig,
    markDevQaCheck,
    migrateLegacyTileId,
    normalizeAngle,
    normalizeRegularTileOrder,
    sanitizeCustomTileSetFilename,
    buildCustomShareBundleArchiveValue,
    // Capture / restore helpers
    applyBoardZoom,
    applyTileSet,
    captureBuildViewLayout,
    clearBoard,
    clearCompactModeBoardReset,
    createBossToken,
    createTileElement,
    placeReferenceAboveStart,
    placeReferenceMarkerAt,
    rerenderTrayAndReserve,
    scheduleBoardHexGridRender,
    selectTile,
    setEntranceFadeAnchorFromTile,
    setRegularTileOrder,
    setStatus,
    syncRegularTileActivityFromSlotOrder,
    updateTileParent,
    updateTileTransform,
  };
}

function getBossManagementCtx() {
  return {
    state,
    board,
    // DOM elements
    bossPile,
    bossTileSetNameEl,
    dragLayer,
    leftDrawer,
    rightDrawer,
    workspace,
    // Constants
    BOARD_ITEM_SCALE,
    BOSS_CARD_ASPECT_RATIO,
    BOSS_PILE_CYCLE_ANIMATION_MS,
    BOSS_REFERENCE_MAGNET_GAP,
    BOSS_REFERENCE_MAGNET_SIDE_RADIUS,
    BOSS_REFERENCE_MAGNET_SIDE_Y_TOLERANCE,
    BOSS_REFERENCE_MAGNET_TOP_GAP,
    BOSS_REFERENCE_MAGNET_TOP_RADIUS,
    BOSS_REFERENCE_MAGNET_TOP_X_TOLERANCE,
    BOSS_SHUFFLE_PREVIEW_MS,
    BOSS_TOKEN_MAGNET_AXIS_TOLERANCE,
    BOSS_TOKEN_MAGNET_GAP,
    BOSS_TOKEN_MAGNET_RADIUS,
    BOSS_TOP_CARD_CLEARANCE_PAD_X_PX,
    BOSS_TOP_CARD_CLEARANCE_PAD_Y_PX,
    BOSS_TOP_CARD_COLLISION_INSET_X_PX,
    BOSS_TOP_CARD_COLLISION_INSET_Y_PX,
    TILE_SIZE,
    // Boss pile imports
    buildAllBossTileSources,
    findBossTileSetIdForSrc,
    generateAllBossesOffsetValue,
    getBossTileSourcesValue,
    normalizeOrderedSources,
    rotatePileTop,
    shuffleDistinctOrder,
    // Helpers
    clamp,
    getBoardContentLayer,
    getBoardDropPositionFromPointerValue,
    getBoardZoom,
    getReadyTileSets,
    getTileSetConfig,
    getTileSetRegistry,
    isOnBoardLayer,
    isPointInsideElement,
    isPointOverBoardSurface,
    resetTiles,
    resolveTileSetAssetPath,
    setStatus,
    shuffle,
    stopDragEdgeAutoPan,
    updateDragEdgeAutoPanState,
    updateModeIndicators,
    updatePlacementFeedbackChecklist,
    worldToBoardScreenX,
    worldToBoardScreenY,
  };
}

function getBoardViewCtx() {
  return {
    state,
    board,
    workspace,
    // Constants
    BOARD_ZOOM_STEP,
    DEFAULT_BOARD_ZOOM,
    DRAG_EDGE_AUTO_PAN_MAX_SPEED,
    DRAG_EDGE_AUTO_PAN_ZONE,
    ENTRANCE_TILE_ID,
    // Imported pure functions
    clamp,
    computeDragEdgeAutoPan,
    isPointOverBoardSurfaceValue,
    quantizeBoardZoomValue,
    worldToBoardScreen,
    // App-level helpers (passed so BV can call them via ctx)
    forEachBoardBossToken,
    markDevQaCheck,
    positionBossToken,
    positionTile,
    recenterTrayAndReserveTiles,
    renderBoardHexGrid,
    scheduleBoardHexGridRender,
    updateBoardAutoCenterViewportAnchor,
    updateBossTokenTransform,
    updateReferenceMarkerTransform,
    updateTileTransform,
  };
}

let defaultWallFaceData = buildDefaultWallFaceData();
const BOARD_HEX_SVG_NS = "http://www.w3.org/2000/svg";
const REFERENCE_OFFSET_Y = TILE_SIZE * 0.86;
const START_TILE_DEFAULT_Y_OFFSET = 286;
const BOSS_REFERENCE_MAGNET_GAP = 20;
const BOSS_REFERENCE_MAGNET_RADIUS = 72 * BOARD_SCALE;
const BOSS_REFERENCE_MAGNET_TOP_GAP = -56 * BOARD_SCALE;
const BOSS_REFERENCE_MAGNET_SIDE_RADIUS = 44 * BOARD_SCALE;
const BOSS_REFERENCE_MAGNET_SIDE_Y_TOLERANCE = 24 * BOARD_SCALE;
const BOSS_REFERENCE_MAGNET_TOP_RADIUS = 56 * BOARD_SCALE;
const BOSS_REFERENCE_MAGNET_TOP_X_TOLERANCE = 24 * BOARD_SCALE;
const BOSS_TOKEN_MAGNET_RADIUS = 42 * BOARD_SCALE;
const BOSS_TOKEN_MAGNET_AXIS_TOLERANCE = 24 * BOARD_SCALE;
const BOSS_TOKEN_MAGNET_GAP = 20;
const BOSS_SHUFFLE_PREVIEW_MS = 0;
const BOSS_PILE_CYCLE_ANIMATION_MS = 320;
const DICE_SPIN_DURATION_MS = 460;
const RESET_SPIN_DURATION_MS = 460;
const DRAG_EDGE_AUTO_PAN_ZONE = 64;
const DRAG_EDGE_AUTO_PAN_MAX_SPEED = 4.5;
const COMPACT_SIDE_PANEL_MAX_WIDTH = 980;
const TRAY_SLOT_COUNT = 6;
const REGULAR_TILE_SLOT_COUNT = TILE_IDS.length;
const AUTO_BUILD_MAX_ATTEMPTS = 600;
const AUTO_BUILD_LINE_EXTENSION_PENALTY = 28;
const AUTO_BUILD_LOCAL_DENSITY_PENALTY = 16;
const AUTO_BUILD_CANDIDATE_SOFT_LIMIT = 180;
const AUTO_BUILD_CANDIDATE_HARD_LIMIT = 280;
const AUTO_BUILD_HISTORY_LIMIT = 36;
const HEX_FRONT_LIGHT_BONUS_HEXES = 2.5;
const HEX_BACK_LIGHT_REDUCTION_HEXES = 1.1;
const HEX_BACK_DARKEN_BIAS = 0.14;
const DEFAULT_BOARD_ZOOM = 1;
const BOARD_ZOOM_STEP = 0.01;
const BOARD_WHEEL_ZOOM_SENSITIVITY = 0.0006;
const BOARD_AUTO_CENTER_RESIZE_DELTA_X = 400;
const BOARD_AUTO_CENTER_RESIZE_SETTLE_MS = 180;
const BOARD_ITEM_SCALE = 1;
const TILE_SET_CROSSFADE_OUT_MS = 120;
const COMPACT_DRAG_GROW_DISTANCE_PX = 100;
const COMPACT_DRAG_START_SIZE_BOOST = 1.12;
const OVERLAP_POLYGON_INSET_PX = 3;
const REFERENCE_CARD_COLLISION_INSET_PX = 10;
const REFERENCE_STACK_CLEARANCE_PAD_PX = 18;
const BOSS_CARD_ASPECT_RATIO = 327 / 556;
const BOSS_TOP_CARD_COLLISION_INSET_X_PX = 10;
const BOSS_TOP_CARD_COLLISION_INSET_Y_PX = 8;
const BOSS_TOP_CARD_CLEARANCE_PAD_X_PX = 18;
const BOSS_TOP_CARD_CLEARANCE_PAD_Y_PX = 16;
const TILE_POSE_GEOMETRY_CACHE_LIMIT = 320;
const AUTO_BUILD_DEV_TUNING_DEFAULTS = {
  layoutSpread: 0.35,
  branchiness: 0.25,
  variety: 0.15,
};
const AUTO_BUILD_DEV_TUNING_FIELDS = [
  { key: "layoutSpread", label: "Layout Spread", min: 0, max: 1, step: 0.01 },
  { key: "branchiness", label: "Branchiness", min: 0, max: 1, step: 0.01 },
  { key: "variety", label: "Variety", min: 0, max: 1, step: 0.01 },
];
document.documentElement.style.setProperty("--tile-size", `${TILE_SIZE}px`);

const board = document.getElementById("board");
const tray = document.getElementById("tray");
const reservePile = document.getElementById("reserve-pile");
const bossPile = document.getElementById("boss-pile");
const selectedTileSetNameEl = document.getElementById("selected-tileset-name");
const selectedTileSetMenuTrigger = document.getElementById("selected-tileset-menu-trigger");
const bossTileSetNameEl = document.getElementById("boss-tileset-name");
const tileSetMenu = document.getElementById("tile-set-menu");
const tileSetDropdown = document.getElementById("tile-set-dropdown");
const reserveEditCheckbox = document.getElementById("reserve-edit-checkbox");
const wallEditorPage = document.getElementById("wall-editor-page");
const tileSetSelect = document.getElementById("tile-set-select");
const appearanceModeMenu = document.getElementById("appearance-mode-menu");
const appearanceModeTrigger = document.getElementById("appearance-mode-trigger");
const appearanceModeDropdown = document.getElementById("appearance-mode-dropdown");
const quickActionsMenu = document.getElementById("quick-actions-menu");
const quickActionsTrigger = document.getElementById("quick-actions-trigger");
const quickActionsDropdown = document.getElementById("quick-actions-dropdown");
const autoThemeToggleBtn = document.getElementById("auto-theme-toggle-btn");
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
const cornerLogo = document.getElementById("corner-logo");
const statusEl = document.getElementById("status");
const localDataNoticeEl = document.getElementById("local-data-notice");
const localDataNoticeTitleEl = document.getElementById("local-data-notice-title");
const localDataNoticeBodyEl = document.getElementById("local-data-notice-body");
const localDataNoticeActionBtn = document.getElementById("local-data-notice-action-btn");
const localDataNoticeDismissBtn = document.getElementById("local-data-notice-dismiss-btn");
const placedProgressEl = document.getElementById("placed-progress");
const feedbackTilesRowEl = document.getElementById("feedback-tiles-row");
const feedbackBossRowEl = document.getElementById("feedback-boss-row");
const feedbackTilesCheckEl = document.getElementById("feedback-tiles-check");
const feedbackBossCheckEl = document.getElementById("feedback-boss-check");
const bossRandomBtn = document.getElementById("boss-random-btn");
const modeIndicatorsEl = document.getElementById("mode-indicators");
const autoBuildBtn = document.getElementById("auto-build-btn");
const exportPdfBtn = document.getElementById("export-pdf-btn");
const rerollBtn = document.getElementById("reroll-btn");
const resetAllBtn = document.getElementById("reset-all-btn");
const importCustomTileSetInput = document.getElementById("import-custom-tileset-input");
const copyShareLinkBtn = document.getElementById("copy-share-link-btn");
const toggleLabelsCheckbox = document.getElementById("toggle-labels-checkbox");
const toggleWallEditBtn = document.getElementById("toggle-wall-edit-btn");
const clearTileWallsBtn = document.getElementById("clear-tile-walls-btn");
const resetTilePointsBtn = document.getElementById("reset-tile-points-btn");
const exportWallDataBtn = document.getElementById("export-wall-data-btn");
const importWallDataBtn = document.getElementById("import-wall-data-btn");
const importWallDataInput = document.getElementById("import-wall-data-input");
const toggleWallsCheckbox = document.getElementById("toggle-walls-checkbox");
const togglePortalFlagsCheckbox = document.getElementById("toggle-portal-flags-checkbox");
const toggleIgnoreContactCheckbox = document.getElementById("toggle-ignore-contact-checkbox");
const toggleFaceFeedbackCheckbox = document.getElementById("toggle-face-feedback-checkbox");
const toggleAllBossesCheckbox = document.getElementById("toggle-all-bosses-checkbox");
const chooseDataFolderBtn = document.getElementById("choose-data-folder-btn");
const openTileSetFolderBtn = document.getElementById("open-tile-set-folder-btn");
const saveTileSetFolderBtn = document.getElementById("save-tile-set-folder-btn");
const openDebugLogBtn = document.getElementById("open-debug-log-btn");
const debugConsole = document.getElementById("debug-console");
const debugConsoleOutput = document.getElementById("debug-console-output");
const debugConsoleCopyBtn = document.getElementById("debug-console-copy-btn");
const debugConsoleClearBtn = document.getElementById("debug-console-clear-btn");
const debugConsoleCloseBtn = document.getElementById("debug-console-close-btn");
const autoBuildTuningControlsEl = document.getElementById("auto-build-tuning-controls");
const autoBuildTuningResetBtn = document.getElementById("auto-build-tuning-reset-btn");
const autoBuildTuningCopyBtn = document.getElementById("auto-build-tuning-copy-btn");
const dragLayer = document.createElement("div");
dragLayer.className = "drag-layer";
workspace.appendChild(dragLayer);
let boardHexRenderRaf = 0;
let leftDrawerClosingTimer = null;
let compactModeTransitionTimer = null;
let compactModeTransitionFrame = 0;
let boardAutoCenterResizeTimer = null;
// wallEditorToolbarHintHideTimer moved to modules/wall-editor-ui.js
let boardHexThemeCache = null;
let boardHexLayoutCache = null;
let boardContentLayer = null;
let boardHexSvg = null;
let boardHexGroup = null;
let boardHexLastRenderKey = "";
const boardHexPathPool = [];
const diceSpinTimers = new WeakMap();
const tileGuidePointsCache = new WeakMap();
const tileSideDirectionsCache = new WeakMap();
const tilePoseGeometryCache = new WeakMap();
const autoBuildTuningInputRefs = new Map();
let localDataNoticeActionContext = null;
let localDataNoticeSuppressedUntilCustomChange = loadLocalDataNoticeSuppressedUntilCustomChange();
let persistentDataBootstrapComplete = false;
const nativeConsole = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: typeof console.debug === "function" ? console.debug.bind(console) : console.log.bind(console),
};
let debugConsoleCaptureInstalled = false;
let debugConsoleEntries = [];

function formatDebugValue(value, depth = 0, seen = new WeakSet()) {
  if (value instanceof Error) {
    return value.stack || `${value.name}: ${value.message}`;
  }
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  const valueType = typeof value;
  if (valueType === "string") return JSON.stringify(value);
  if (valueType === "number" || valueType === "boolean" || valueType === "bigint") return String(value);
  if (valueType === "symbol") return value.toString();
  if (valueType === "function") return `[Function ${value.name || "anonymous"}]`;
  if (valueType !== "object") return String(value);
  if (seen.has(value)) return "[Circular]";
  if (depth >= 2) {
    if (Array.isArray(value)) return `[Array(${value.length})]`;
    return `[${value.constructor?.name || "Object"}]`;
  }
  seen.add(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => formatDebugValue(item, depth + 1, seen)).join(", ")}]`;
  }
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Set) {
    return `Set(${value.size}) { ${[...value].map((item) => formatDebugValue(item, depth + 1, seen)).join(", ")} }`;
  }
  if (value instanceof Map) {
    return `Map(${value.size}) { ${[...value.entries()].map(([key, item]) => `${formatDebugValue(key, depth + 1, seen)} => ${formatDebugValue(item, depth + 1, seen)}`).join(", ")} }`;
  }
  if (value instanceof HTMLElement) {
    const id = value.id ? `#${value.id}` : "";
    const className = typeof value.className === "string" && value.className.trim()
      ? `.${value.className.trim().replace(/\s+/g, ".")}`
      : "";
    return `<${value.tagName.toLowerCase()}${id}${className}>`;
  }
  const entries = Object.entries(value).slice(0, 8).map(([key, item]) => `${key}: ${formatDebugValue(item, depth + 1, seen)}`);
  const suffix = Object.keys(value).length > entries.length ? ", …" : "";
  return `{ ${entries.join(", ")}${suffix} }`;
}

function formatDebugLine(level, args, source = "") {
  const timestamp = new Date().toISOString().slice(11, 23);
  const prefix = `[${timestamp}] ${level.toUpperCase()}`;
  const origin = source ? ` ${source}` : "";
  const message = args.map((arg) => formatDebugValue(arg)).join(" ");
  return `${prefix}${origin}${message ? ` ${message}` : ""}`;
}

function renderDebugConsole() {
  if (!debugConsoleOutput) return;
  debugConsoleOutput.textContent = debugConsoleEntries.join("\n");
  if (!debugConsole.hidden) {
    debugConsoleOutput.scrollTop = debugConsoleOutput.scrollHeight;
  }
}

function appendDebugConsoleEntry(level, args, source = "") {
  const line = formatDebugLine(level, args, source);
  debugConsoleEntries.push(line);
  if (debugConsoleEntries.length > 1500) {
    debugConsoleEntries = debugConsoleEntries.slice(-1200);
  }
  renderDebugConsole();
}

function openDebugConsole() {
  if (!debugConsole) return;
  debugConsole.hidden = false;
  renderDebugConsole();
}

function closeDebugConsole() {
  if (!debugConsole) return;
  debugConsole.hidden = true;
}

function toggleDebugConsole() {
  if (!debugConsole) return;
  if (debugConsole.hidden) openDebugConsole();
  else closeDebugConsole();
}

async function copyDebugConsole() {
  const text = debugConsoleEntries.join("\n");
  if (!text) {
    setStatus("Debug log is empty.", true);
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    setStatus("Debug log copied.");
  } catch (error) {
    try {
      const tempTextArea = document.createElement("textarea");
      tempTextArea.value = text;
      tempTextArea.setAttribute("readonly", "true");
      tempTextArea.style.position = "fixed";
      tempTextArea.style.top = "-9999px";
      document.body.appendChild(tempTextArea);
      tempTextArea.select();
      const copied = document.execCommand("copy");
      tempTextArea.remove();
      if (copied) {
        setStatus("Debug log copied.");
        return;
      }
    } catch (fallbackError) {
      nativeConsole.warn("Could not copy debug log.", fallbackError);
    }
    setStatus("Could not copy debug log.", true);
  }
}

function clearDebugConsole() {
  debugConsoleEntries = [];
  renderDebugConsole();
}

function captureWindowError(event) {
  appendDebugConsoleEntry("error", [
    event?.message || "Uncaught error",
    event?.filename || "",
    event?.lineno ? `${event.lineno}:${event.colno || 0}` : "",
    event?.error?.stack || event?.error || "",
  ], "window");
}

function captureUnhandledRejection(event) {
  appendDebugConsoleEntry("error", [event?.reason instanceof Error ? event.reason : event?.reason || "Unhandled promise rejection"], "promise");
}

function installDebugConsoleCapture() {
  if (!IS_TAURI_RUNTIME || debugConsoleCaptureInstalled) return;
  debugConsoleCaptureInstalled = true;

  for (const level of ["log", "info", "warn", "error", "debug"]) {
    const original = nativeConsole[level];
    console[level] = (...args) => {
      appendDebugConsoleEntry(level, args);
      return original(...args);
    };
  }

  window.addEventListener("error", captureWindowError);
  window.addEventListener("unhandledrejection", captureUnhandledRejection);
}

const state = {
  tileSetRegistry: runtimeTileSetRegistry,
  tiles: new Map(),
  selectedTileId: null,
  hoveredTileId: null,
  selectedTileSetId: DEFAULT_TILE_SET_ID,
  selectedAppearanceMode: IS_TAURI_RUNTIME ? DEFAULT_APPEARANCE_MODE : loadAppearanceMode(),
  selectedUiThemeId: IS_TAURI_RUNTIME ? DEFAULT_UI_THEME_ID : loadUiThemeId(),
  autoThemeByTileSet: IS_TAURI_RUNTIME ? true : loadAutoThemeByTileSet(),
  lastLightUiThemeId: IS_TAURI_RUNTIME ? DEFAULT_UI_THEME_ID : loadLastLightUiThemeId(),
  lastDarkUiThemeId: IS_TAURI_RUNTIME ? DEFAULT_DARK_THEME : loadLastDarkUiThemeId(),
  tileDefs: [],
  showGuideLabels: IS_TAURI_RUNTIME ? false : loadShowGuideLabels(),
  showWallFaces: IS_TAURI_RUNTIME ? false : loadShowWallFaces(),
  showPortalFlags: IS_TAURI_RUNTIME ? false : loadShowPortalFlags(),
  wallEditMode: false,
  wallOverrides: IS_TAURI_RUNTIME ? {} : loadWallOverrides(),
  endTileOverrides: IS_TAURI_RUNTIME ? {} : loadEndTileOverrides(),
  portalFlagOverrides: IS_TAURI_RUNTIME ? {} : loadPortalFlagOverrides(),
  guidePointTemplateOverrides: IS_TAURI_RUNTIME ? {} : loadGuidePointTemplateOverrides(),
  wallEditorTileRefs: new Map(),
  wallEditorActiveTileSetId: null,
  wallEditorActiveTileId: null,
  wallEditorGroupId: null,
  customTileSetBackupNeededIds: IS_TAURI_RUNTIME ? new Set() : loadCustomTileSetBackupNeededIds(),
  wallEditorPointEditMode: false,
  pendingSwapSource: null,
  reserveEditMode: false,
  regularTileOrder: [],
  renderedTraySlots: [],
  ignoreContactRule: IS_TAURI_RUNTIME ? false : loadIgnoreContactRule(),
  useFaceFeedback: IS_TAURI_RUNTIME ? false : loadUseFaceFeedback(),
  useAllBosses: IS_TAURI_RUNTIME ? false : loadUseAllBosses(),
  bossEditMode: true,
  bossPileOrderByTileSet: {},
  allBossesPileOrder: [],
  bossTokens: [],
  nextBossTokenId: 1,
  boardPanX: 0,
  boardPanY: 0,
  activeTileDragCount: 0,
  buildViewSnapshot: null,
  referenceTileSrc: "",
  referenceMarker: null,
  boardZoom: DEFAULT_BOARD_ZOOM,
  boardZoomRaw: DEFAULT_BOARD_ZOOM,
  compactSidePanelMode: false,
  preCompactDrawerState: null,
  preCompactBoardZoom: null,
  preCompactBoardZoomRaw: null,
  lastAutoCenterViewportWidth: 0,
  leftDrawerCollapsed: false,
  rightDrawerCollapsed: false,
  autoBuildHistoryBySet: {},
  autoBuildPreviewPlacedCount: null,
  readinessByTileSet: {},
  entranceFadeAnchor: null,
  bossPileCycleInProgress: false,
  legacyMigrationStats: {
    themeIdLayoutMigrations: 0,
    tileIdMigrations: 0,
    wallOverrideTileIdMigrations: 0,
  },
  wallEditorAssetScrollAnchor: null,
};

let autoBuildDevTuning = IS_TAURI_RUNTIME ? { ...AUTO_BUILD_DEV_TUNING_DEFAULTS } : loadAutoBuildDevTuning();

function buildDefaultPersistentSettingsSnapshot() {
  return {
    [APPEARANCE_MODE_STORAGE_KEY]: DEFAULT_APPEARANCE_MODE,
    [AUTO_THEME_BY_TILE_SET_STORAGE_KEY]: true,
    [UI_THEME_STORAGE_KEY]: "molten_dark",
    [LAST_LIGHT_UI_THEME_STORAGE_KEY]: "molten",
    [LAST_DARK_UI_THEME_STORAGE_KEY]: "molten_dark",
    [SELECTED_TILE_SET_STORAGE_KEY]: DEFAULT_TILE_SET_ID,
    [SHOW_GUIDE_LABELS_STORAGE_KEY]: false,
    [SHOW_WALL_FACES_STORAGE_KEY]: false,
    [SHOW_PORTAL_FLAGS_STORAGE_KEY]: false,
    [IGNORE_CONTACT_RULE_STORAGE_KEY]: false,
    [USE_FACE_FEEDBACK_STORAGE_KEY]: false,
    [USE_ALL_BOSSES_STORAGE_KEY]: false,
    [DRAWER_STATE_STORAGE_KEY]: { left: false, right: false },
    [AUTO_BUILD_DEV_TUNING_STORAGE_KEY]: { ...AUTO_BUILD_DEV_TUNING_DEFAULTS },
    [WALL_OVERRIDES_STORAGE_KEY]: {},
    [END_TILE_OVERRIDES_STORAGE_KEY]: {},
    [PORTAL_FLAG_OVERRIDES_STORAGE_KEY]: {},
    [GUIDE_POINT_TEMPLATES_STORAGE_KEY]: {},
    [CUSTOM_TILE_SET_BACKUP_NEEDED_STORAGE_KEY]: [],
  };
}

function buildCurrentPersistentSettingsSnapshot() {
  return {
    [APPEARANCE_MODE_STORAGE_KEY]: state.selectedAppearanceMode,
    [AUTO_THEME_BY_TILE_SET_STORAGE_KEY]: Boolean(state.autoThemeByTileSet),
    [UI_THEME_STORAGE_KEY]: state.selectedUiThemeId,
    [LAST_LIGHT_UI_THEME_STORAGE_KEY]: state.lastLightUiThemeId,
    [LAST_DARK_UI_THEME_STORAGE_KEY]: state.lastDarkUiThemeId,
    [SELECTED_TILE_SET_STORAGE_KEY]: state.selectedTileSetId,
    [SHOW_GUIDE_LABELS_STORAGE_KEY]: Boolean(state.showGuideLabels),
    [SHOW_WALL_FACES_STORAGE_KEY]: Boolean(state.showWallFaces),
    [SHOW_PORTAL_FLAGS_STORAGE_KEY]: Boolean(state.showPortalFlags),
    [IGNORE_CONTACT_RULE_STORAGE_KEY]: Boolean(state.ignoreContactRule),
    [USE_FACE_FEEDBACK_STORAGE_KEY]: Boolean(state.useFaceFeedback),
    [USE_ALL_BOSSES_STORAGE_KEY]: Boolean(state.useAllBosses),
    [DRAWER_STATE_STORAGE_KEY]: {
      left: Boolean(state.leftDrawerCollapsed),
      right: Boolean(state.rightDrawerCollapsed),
    },
    [AUTO_BUILD_DEV_TUNING_STORAGE_KEY]: { ...autoBuildDevTuning },
    [WALL_OVERRIDES_STORAGE_KEY]: pickBuiltInTileSetEntries(state.wallOverrides),
    [END_TILE_OVERRIDES_STORAGE_KEY]: pickBuiltInTileSetEntries(state.endTileOverrides),
    [PORTAL_FLAG_OVERRIDES_STORAGE_KEY]: pickBuiltInTileSetEntries(state.portalFlagOverrides),
    [GUIDE_POINT_TEMPLATES_STORAGE_KEY]: cloneOverrideEntry(state.guidePointTemplateOverrides || {}),
    [CUSTOM_TILE_SET_BACKUP_NEEDED_STORAGE_KEY]: [...state.customTileSetBackupNeededIds],
  };
}

function applyPersistentSettingsSnapshot(snapshot, { useDefaults = false } = {}) {
  const defaults = buildDefaultPersistentSettingsSnapshot();
  const source = useDefaults ? defaults : {
    ...defaults,
    ...(snapshot || {}),
  };
  state.selectedAppearanceMode = APPEARANCE_MODE_IDS.has(source[APPEARANCE_MODE_STORAGE_KEY])
    ? source[APPEARANCE_MODE_STORAGE_KEY]
    : DEFAULT_APPEARANCE_MODE;
  state.autoThemeByTileSet = Boolean(source[AUTO_THEME_BY_TILE_SET_STORAGE_KEY]);
  state.selectedUiThemeId = isSupportedUiThemeId(source[UI_THEME_STORAGE_KEY])
    ? source[UI_THEME_STORAGE_KEY]
    : DEFAULT_UI_THEME_ID;
  state.lastLightUiThemeId = sanitizeLightUiThemeId(source[LAST_LIGHT_UI_THEME_STORAGE_KEY]) || DEFAULT_UI_THEME_ID;
  state.lastDarkUiThemeId = sanitizeDarkUiThemeId(source[LAST_DARK_UI_THEME_STORAGE_KEY]) || DEFAULT_DARK_THEME;
  state.selectedTileSetId = hasTileSetId(source[SELECTED_TILE_SET_STORAGE_KEY])
    ? source[SELECTED_TILE_SET_STORAGE_KEY]
    : DEFAULT_TILE_SET_ID;
  state.showGuideLabels = Boolean(source[SHOW_GUIDE_LABELS_STORAGE_KEY]);
  state.showWallFaces = Boolean(source[SHOW_WALL_FACES_STORAGE_KEY]);
  state.showPortalFlags = Boolean(source[SHOW_PORTAL_FLAGS_STORAGE_KEY]);
  state.ignoreContactRule = Boolean(source[IGNORE_CONTACT_RULE_STORAGE_KEY]);
  state.useFaceFeedback = Boolean(source[USE_FACE_FEEDBACK_STORAGE_KEY]);
  state.useAllBosses = Boolean(source[USE_ALL_BOSSES_STORAGE_KEY]);
  state.leftDrawerCollapsed = Boolean(source[DRAWER_STATE_STORAGE_KEY]?.left);
  state.rightDrawerCollapsed = Boolean(source[DRAWER_STATE_STORAGE_KEY]?.right);
  autoBuildDevTuning = sanitizeAutoBuildDevTuning(source[AUTO_BUILD_DEV_TUNING_STORAGE_KEY] || {});
  state.wallOverrides = sanitizeWallOverrides(source[WALL_OVERRIDES_STORAGE_KEY] || {});
  state.endTileOverrides = sanitizeEndTileOverrides(source[END_TILE_OVERRIDES_STORAGE_KEY] || {});
  state.portalFlagOverrides = sanitizePortalFlagOverrides(source[PORTAL_FLAG_OVERRIDES_STORAGE_KEY] || {});
  state.guidePointTemplateOverrides = sanitizeGuidePointTemplateOverrides(source[GUIDE_POINT_TEMPLATES_STORAGE_KEY] || {});
  state.customTileSetBackupNeededIds = new Set(
    Array.isArray(source[CUSTOM_TILE_SET_BACKUP_NEEDED_STORAGE_KEY])
      ? source[CUSTOM_TILE_SET_BACKUP_NEEDED_STORAGE_KEY].map((tileSetId) => String(tileSetId || "").trim()).filter(Boolean)
      : [],
  );
}

async function migrateCurrentLegacyDataToDataFolder() {
  const customTileSetBundles = await listStoredCustomTileSetBundlesFromLegacyStorage();
  for (const bundle of customTileSetBundles) {
    await saveStoredCustomTileSetBundle(bundle.manifest, bundle.assets || []);
  }
  const customTileSetEditorData = await listStoredCustomTileSetEditorDataFromLegacyStorage();
  for (const record of customTileSetEditorData) {
    if (!record?.tileSetId) continue;
    await saveStoredCustomTileSetEditorData(record.tileSetId, record);
  }
}

async function bootstrapPersistentData() {
  const folderPath = await ensureDataFolderPath({ promptIfMissing: false });
  if (!folderPath) {
    persistentDataBootstrapComplete = true;
    return;
  }

  const hasData = await hasAnyDataFolderContent();
  if (!hasData) {
    await saveDataSettingsMap(buildDefaultPersistentSettingsSnapshot());
    persistentDataBootstrapComplete = true;
    return;
  }

  const storedSettings = await loadDataSettingsMap();
  const nextSettings = {
    ...buildDefaultPersistentSettingsSnapshot(),
    ...(storedSettings || {}),
  };
  await saveDataSettingsMap(nextSettings);
  applyPersistentSettingsSnapshot(nextSettings);
  persistentDataBootstrapComplete = true;
}

function setPendingDataFolderAction(action) {
  try {
    if (action) {
      sessionStorage.setItem(PENDING_DATA_FOLDER_ACTION_SESSION_KEY, action);
    } else {
      sessionStorage.removeItem(PENDING_DATA_FOLDER_ACTION_SESSION_KEY);
    }
  } catch {
    // ignore
  }
}

function setStartupDataFolderPromptDismissed(dismissed) {
  try {
    if (dismissed) {
      sessionStorage.setItem(DATA_FOLDER_STARTUP_PROMPT_DISMISSED_SESSION_KEY, "true");
    } else {
      sessionStorage.removeItem(DATA_FOLDER_STARTUP_PROMPT_DISMISSED_SESSION_KEY);
    }
  } catch {
    // ignore
  }
}

function hasStartupDataFolderPromptBeenDismissed() {
  try {
    return sessionStorage.getItem(DATA_FOLDER_STARTUP_PROMPT_DISMISSED_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

function consumePendingDataFolderAction() {
  try {
    const action = sessionStorage.getItem(PENDING_DATA_FOLDER_ACTION_SESSION_KEY);
    sessionStorage.removeItem(PENDING_DATA_FOLDER_ACTION_SESSION_KEY);
    return action || "";
  } catch {
    return "";
  }
}

async function promptForDataFolderSelection({
  title,
  message,
  confirmLabel = "Set Dir",
  cancelLabel = "Do It Later",
  resumeAction = "",
  rememberDismissal = false,
} = {}) {
  if (!IS_TAURI_RUNTIME) return false;
  const existingFolderPath = await ensureDataFolderPath({ promptIfMissing: false });
  if (existingFolderPath) return true;
  if (rememberDismissal && hasStartupDataFolderPromptBeenDismissed()) return false;

  const confirmed = await requestChoiceDialog({
    title: title || "Choose a Data Folder",
    message: message || "This desktop app stores settings and custom tile sets in a folder you choose. If you skip this, the app will use built-in defaults and nothing can be saved.",
    confirmLabel,
    cancelLabel,
  });
  if (!confirmed) {
    if (rememberDismissal) setStartupDataFolderPromptDismissed(true);
    return false;
  }

  if (resumeAction) setPendingDataFolderAction(resumeAction);
  const selectedPath = await chooseDataFolder(getStoredDataFolderPath(), { persist: false });
  if (!selectedPath) {
    setPendingDataFolderAction("");
    if (rememberDismissal) setStartupDataFolderPromptDismissed(true);
    return false;
  }
  setStartupDataFolderPromptDismissed(false);
  await finalizeDataFolderSelection(selectedPath);
  return true;
}

async function resumePendingDataFolderAction() {
  const pendingAction = consumePendingDataFolderAction();
  if (!pendingAction) return false;
  if (pendingAction === "open-custom-tileset-import") {
    await openCustomTileSetImportPicker();
    return true;
  }
  if (pendingAction === "open-custom-tileset-folder-import") {
    await openTileSetFolderImportPicker();
    return true;
  }
  return false;
}

async function finalizeDataFolderSelection(selectedPath) {
  const normalizedPath = String(selectedPath || "").trim();
  if (!normalizedPath) return false;
  setStoredDataFolderPath(normalizedPath);
  const selectedSettingsPath = joinDataFolderPath(normalizedPath, "settings.json");
  const selectedCustomSetsPath = joinDataFolderPath(normalizedPath, "custom-tilesets");
  const selectedFolderHasData = await pathExists(selectedSettingsPath)
    || (await listDirEntries(selectedCustomSetsPath)).length > 0;
  if (!selectedFolderHasData) {
    await saveDataSettingsMap(buildDefaultPersistentSettingsSnapshot());
  }
  setStatus(`Data folder set to ${normalizedPath}. Reloading...`);
  window.location.reload();
  return true;
}

installDebugConsoleCapture();

init().catch((error) => {
  console.error(error);
  openDebugConsole();
  setStatus("Failed to initialize app. Check image paths.", true);
});

async function init() {
  window.addEventListener("beforeunload", () => {
    revokeCustomTileSetAssetUrls();
  }, { once: true });
  console.info("Startup: migrating legacy custom tile set records.");
  await migrateLegacyCustomTileSetRecords();
  console.info("Startup: bootstrapping persistent data.");
  await bootstrapPersistentData();
  document.body.classList.toggle("show-guide-labels", state.showGuideLabels);
  document.body.classList.toggle("show-wall-faces", state.showWallFaces);
  document.body.classList.toggle("show-portal-flags", state.showPortalFlags);
  console.info("Startup: loading stored custom tile sets.");
  setRuntimeTileSetRegistry(await loadStoredCustomTileSetRecords());
  pruneCustomTileSetBackupNeededIds();
  await syncCustomTileSetEditorDataFromStorage();
  exposeCustomTileSetDebugApi();
  void bindNativeMenuActions();
  bindGlobalControls();
  console.info(`Startup: registry ready with ${getTileSetRegistry().length} tile sets.`);
  await auditTileSetReadiness();
  hydrateTileSetSelector();

  const readyTileSetId = getFirstReadyTileSetId();
  if (readyTileSetId && getTileSetConfig(state.selectedTileSetId)?.status !== "ready") {
    state.selectedTileSetId = readyTileSetId;
  }
  if (getTileSetConfig(state.selectedTileSetId)?.status !== "ready") {
    state.selectedTileSetId = readyTileSetId || getTileSetRegistry().find((tileSet) => tileSet.source === "built_in")?.id || DEFAULT_TILE_SET_ID;
  }

  if (tileSetSelect) tileSetSelect.value = state.selectedTileSetId;
  syncTileSetMenuOptions();
  syncSelectedTileSetHeading();
  syncBossTileSetHeading();
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
  updateBoardAutoCenterViewportAnchor();

  state.referenceTileSrc = getReferenceTileSrc(state.selectedTileSetId);
  try {
    console.info(`Startup: loading tile set ${state.selectedTileSetId}.`);
    await applyTileSet(state.selectedTileSetId, false);
  } catch (error) {
    console.error("Initial tile set load failed.", error);
    try {
      state.selectedTileSetId = DEFAULT_TILE_SET_ID;
      state.referenceTileSrc = getReferenceTileSrc(DEFAULT_TILE_SET_ID);
      if (tileSetSelect) tileSetSelect.value = DEFAULT_TILE_SET_ID;
      syncTileSetMenuOptions();
      syncSelectedTileSetHeading();
      syncBossTileSetHeading();
      await loadTiles(DEFAULT_TILE_SET_ID);
    } catch (fallbackError) {
      console.error("Fallback tile set load failed.", fallbackError);
      throw fallbackError;
    }
  }
  try {
    const restoredSharedLayout = await restoreSharedLayoutFromUrl();
    if (!restoredSharedLayout) {
      scheduleBoardHexGridRender();
    }
  } catch (error) {
    console.error("Could not restore shared layout on startup.", error);
    scheduleBoardHexGridRender();
  }
  showPersistedCustomTileSetBackupNotice();
  void promptForDataFolderSelection({
    title: "Choose a Data Folder",
    message: "This desktop app stores settings and custom tile sets in a folder you choose. If you skip this, the app will use built-in defaults and nothing can be saved.",
    rememberDismissal: true,
  }).catch((error) => {
    console.error(error);
  });
  await resumePendingDataFolderAction();
}

async function loadTiles(tileSetId = state.selectedTileSetId) {
  const defs = buildTileDefs(tileSetId);
  state.tileDefs = defs;
  state.tiles.clear();
  const preparedTiles = await Promise.all(defs.map(async (def) => {
    let img;
    try {
      img = await loadImage(def.imageSrc);
    } catch (error) {
      const fallbackTileSet = getTileSetConfig(DEFAULT_TILE_SET_ID);
      const fallbackKind = def.required ? "entrance" : "tile";
      const fallbackAssetId = def.required ? ENTRANCE_TILE_ID : def.tileId;
      const fallbackSrc = resolveTileSetAssetPath(fallbackTileSet, fallbackKind, fallbackAssetId);
      console.warn(`Could not load tile image ${def.imageSrc}; falling back to ${fallbackSrc}.`, error);
      try {
        img = await loadImage(fallbackSrc);
      } catch (fallbackError) {
        console.warn(`Fallback tile image also failed for ${def.imageSrc}; using a blank placeholder.`, fallbackError);
        img = await loadImage("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2fK0QAAAAASUVORK5CYII=");
      }
    }
    const shape = getOpaqueBounds(img);
    const alphaMask = getAlphaMask(img);
    const faceGeometry = getFaceGeometry(img, SIDES);

    return {
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
      portalFlag: getStoredPortalFlag(tileSetId, def.tileId),
    };
  }));
  for (const tile of preparedTiles) {
    state.tiles.set(tile.tileId, tile);
  }
}

function getTileSetConfig(tileSetId) {
  return getTileSetRegistry().find((tileSet) => tileSet.id === tileSetId) || getTileSetRegistry()[0];
}

function findTileSetConfigById(tileSetId) {
  return getTileSetRegistry().find((tileSet) => tileSet.id === tileSetId) || null;
}

function getFirstReadyTileSetId() {
  const readyTileSet = getReadyTileSets()[0];
  return readyTileSet?.id || null;
}

function getTileSetRegistry() {
  return runtimeTileSetRegistry;
}

function hasTileSetId(tileSetId) {
  return getTileSetRegistry().some((tileSet) => tileSet.id === tileSetId);
}

async function refreshRuntimeTileSetRegistry(
  customTileSetRecords = null,
  { reloadActiveTileSet = false, rerenderWallEditor = true, statusMessage = "" } = {},
) {
  const previousSelectedTileSetId = state.selectedTileSetId;
  const runtimeCustomTileSetRecords = Array.isArray(customTileSetRecords)
    ? customTileSetRecords
    : await loadStoredCustomTileSetRecords();
  setRuntimeTileSetRegistry(runtimeCustomTileSetRecords);
  pruneCustomTileSetBackupNeededIds();
  await syncCustomTileSetEditorDataFromStorage();
  state.readinessByTileSet = {};

  await auditTileSetReadiness();
  hydrateTileSetSelector();

  const nextTileSetId = hasTileSetId(previousSelectedTileSetId)
    ? previousSelectedTileSetId
    : (getFirstReadyTileSetId() || getTileSetRegistry()[0]?.id || DEFAULT_TILE_SET_ID);
  state.selectedTileSetId = nextTileSetId;
  state.referenceTileSrc = getReferenceTileSrc(nextTileSetId);

  if (tileSetSelect) tileSetSelect.value = nextTileSetId;
  syncTileSetMenuOptions();
  syncSelectedTileSetHeading();
  syncBossTileSetHeading();

  if (reloadActiveTileSet && getTileSetConfig(nextTileSetId)?.status === "ready") {
    await applyTileSet(nextTileSetId, false);
  }
  if (state.wallEditMode && rerenderWallEditor) {
    await renderWallEditorPage();
  }

  if (statusMessage) setStatus(statusMessage);
  return getTileSetRegistry();
}

function exposeCustomTileSetDebugApi() {
  window.__HTS_CUSTOM_TILESETS__ = {
    backend: "indexeddb",
    legacyStorageKey: LEGACY_CUSTOM_TILE_SET_RECORDS_STORAGE_KEY,
    list: () => customTileSetManifestCache.map((record) => ({ ...record })),
    replace: async (records = []) => {
      await clearStoredCustomTileSetBundles();
      const sourceRecords = Array.isArray(records) ? records : [];
      for (const record of sourceRecords) {
        const bundle = await buildStoredCustomTileSetBundle(record);
        await saveStoredCustomTileSetBundle(bundle.manifest, bundle.assets);
      }
      return refreshRuntimeTileSetRegistry(null, {
        reloadActiveTileSet: state.tiles.size > 0,
        statusMessage: `Custom tile sets loaded: ${sourceRecords.length}.`,
      });
    },
    add: async (record) => {
      const normalized = normalizeCustomTileSetRecord(record);
      if (!normalized) throw new Error("Invalid custom tile set record.");
      const bundle = await buildStoredCustomTileSetBundle(record);
      await saveStoredCustomTileSetBundle(bundle.manifest, bundle.assets);
      return refreshRuntimeTileSetRegistry(null, {
        reloadActiveTileSet: state.tiles.size > 0,
        statusMessage: `Custom tile set loaded: ${normalized.label}.`,
      });
    },
    remove: async (tileSetId) => {
      await deleteStoredCustomTileSetBundle(tileSetId);
      removeCustomTileSetLocalState(tileSetId);
      return refreshRuntimeTileSetRegistry(null, {
        reloadActiveTileSet: state.tiles.size > 0,
        statusMessage: `Custom tile set removed: ${tileSetId}.`,
      });
    },
    clear: async () => {
      await clearStoredCustomTileSetBundles();
      for (const tileSet of getTileSetRegistry().filter((entry) => entry.source === "custom")) {
        removeCustomTileSetLocalState(tileSet.id);
      }
      return refreshRuntimeTileSetRegistry(null, {
        reloadActiveTileSet: state.tiles.size > 0,
        statusMessage: "Custom tile sets cleared.",
      });
    },
    refresh: async () => refreshRuntimeTileSetRegistry(null, {
      reloadActiveTileSet: state.tiles.size > 0,
    }),
  };
}

function getReadyTileSets() {
  return getTileSetRegistry().filter((tileSet) => tileSet.status === "ready");
}

function getUiThemesForMode(mode) {
  return getUiThemesForModeTM(mode, getThemeManagerCtx());
}

function isSupportedUiThemeId(uiThemeId) {
  return UI_THEME_IDS.has(uiThemeId);
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
  for (const tileSet of getTileSetRegistry()) {
    const option = document.createElement("option");
    option.value = tileSet.id;
    option.disabled = tileSet.source === "custom" && tileSet.status !== "ready";
    option.textContent = `${tileSet.label}${getTileSetStatusSuffix(tileSet.status)}`;
    tileSetSelect.appendChild(option);
  }
  syncTileSetMenuOptions();
}

function syncTileSetMenuOptions() {
  if (!tileSetDropdown) return;
  tileSetDropdown.innerHTML = "";
  for (const tileSet of getTileSetRegistry()) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "tile-set-option";
    item.dataset.tileSet = tileSet.id;
    item.textContent = `${tileSet.label}${getTileSetStatusSuffix(tileSet.status)}`;
    item.disabled = tileSet.source === "custom" && tileSet.status !== "ready";
    item.setAttribute("role", "menuitem");
    if (tileSet.id === state.selectedTileSetId) item.classList.add("is-current");
    tileSetDropdown.appendChild(item);
  }
}

function setTileSetMenuOpen(open) {
  if (!tileSetDropdown || !selectedTileSetMenuTrigger) return;
  const shouldOpen = Boolean(open);
  tileSetDropdown.hidden = !shouldOpen;
  tileSetMenu?.classList.toggle("is-open", shouldOpen);
  selectedTileSetMenuTrigger?.setAttribute("aria-expanded", String(shouldOpen));
  if (!shouldOpen) {
    selectedTileSetMenuTrigger?.blur();
  }
}

function closeHeaderMenus({ except = null } = {}) {
  if (except !== "tileSet") setTileSetMenuOpen(false);
  if (except !== "uiTheme") setUiThemeMenuOpen(false);
  if (except !== "appearanceMode") setAppearanceModeMenuOpen(false);
  if (except !== "quickActions") setQuickActionsMenuOpen(false);
}

function isEventInsideHeaderMenu(target) {
  return Boolean(
    tileSetMenu?.contains(target)
    || selectedTileSetMenuTrigger?.contains(target)
    || uiThemeMenu?.contains(target)
    || appearanceModeMenu?.contains(target)
    || quickActionsMenu?.contains(target),
  );
}

function buildTileKey(tileSetId, tileId) {
  return `${tileSetId}:${tileId}`;
}

function buildBossAssetKey(tileSetId, bossId) {
  return buildBossAssetKeyBM(tileSetId, bossId);
}

function parseBossAssetKey(bossKey) {
  return parseBossAssetKeyBM(bossKey);
}

function resolveTileSetAssetPath(tileSetOrId, assetKind, assetId = "") {
  const tileSet = typeof tileSetOrId === "string" ? getTileSetConfig(tileSetOrId) : tileSetOrId;
  if (!tileSet) return "";

  if (tileSet.assetResolver && typeof tileSet.assetResolver === "function") {
    return tileSet.assetResolver(assetKind, assetId);
  }

  if (tileSet.assetPaths?.[assetKind]) {
    const kindEntry = tileSet.assetPaths[assetKind];
    if (typeof kindEntry === "string") return kindEntry;
    if (kindEntry && typeof kindEntry === "object" && assetId in kindEntry) return kindEntry[assetId];
  }

  return getBuiltInTileSetAssetPath(tileSet, assetKind, assetId);
}

function resolveBossAssetSrc(bossKey) {
  return resolveBossAssetSrcBM(bossKey, getBossManagementCtx());
}

function getBossKeyForLegacySrc(src, fallbackTileSetId = state.selectedTileSetId) {
  return getBossKeyForLegacySrcBM(src, getBossManagementCtx(), fallbackTileSetId);
}

function buildTileDefs(tileSetId) {
  const tileSet = getTileSetConfig(tileSetId);
  const entranceTileId = tileSet.entranceTileId || ENTRANCE_TILE_ID;
  const tileIds = Array.isArray(tileSet.tileIds) && tileSet.tileIds.length ? tileSet.tileIds : TILE_IDS;

  return [
    {
      tileSetId: tileSet.id,
      tileId: entranceTileId,
      key: buildTileKey(tileSet.id, entranceTileId),
      imageSrc: resolveTileSetAssetPath(tileSet, "entrance", entranceTileId),
      required: true,
    },
    ...tileIds.map((tileId) => ({
      tileSetId: tileSet.id,
      tileId,
      key: buildTileKey(tileSet.id, tileId),
      imageSrc: resolveTileSetAssetPath(tileSet, "tile", tileId),
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
  for (const tileSet of getTileSetRegistry()) {
    defaults[tileSet.id] = {};
    for (const def of buildTileDefs(tileSet.id)) {
      defaults[tileSet.id][def.tileId] = [];
    }
  }
  return defaults;
}

async function auditTileSetReadiness() {
  const seenIds = new Set();
  const registryIssuesByTileSetId = new Map();
  for (const tileSet of getTileSetRegistry()) {
    registryIssuesByTileSetId.set(tileSet.id, getRegistryIssues(tileSet, seenIds));
    seenIds.add(tileSet.id);
  }

  const report = await Promise.all(getTileSetRegistry().map(async (tileSet) => {
    const registryIssues = registryIssuesByTileSetId.get(tileSet.id) || [];
    const { coreAssets, bossAssets } = getTileSetAssetPaths(tileSet, {
      tileIds: tileSet.tileIds || TILE_IDS,
      referenceCardId: tileSet.referenceCardId || REFERENCE_CARD_ID,
      resolveAssetPath: resolveTileSetAssetPath,
    });
    const [coreChecks, bossChecks] = await Promise.all([
      Promise.all(coreAssets.map((src) => imageExists(src))),
      Promise.all(bossAssets.map((src) => imageExists(src))),
    ]);
    const coreMissing = coreAssets.filter((_, idx) => !coreChecks[idx]);
    const bossMissing = bossAssets.filter((_, idx) => !bossChecks[idx]);
    const missingWallEntries = getMissingDefaultWallEntries(
      tileSet,
      defaultWallFaceData,
      [ENTRANCE_TILE_ID, ...TILE_IDS],
    );
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
    return entry;
  }));

  printTileSetReadinessReport(report, state.legacyMigrationStats);
  return report;
}

function syncSelectedTileSetHeading() {
  const label = getTileSetConfig(state.selectedTileSetId)?.label || "";
  if (selectedTileSetNameEl) {
    const visibleLabel = label || state.selectedTileSetId || "Tile Set";
    selectedTileSetNameEl.textContent = visibleLabel.length > 18
      ? `${visibleLabel.slice(0, 18)}…`
      : visibleLabel;
    selectedTileSetNameEl.title = visibleLabel;
  }
  syncCustomTileSetFolderControls();
}

function syncCustomTileSetFolderControls() {
  const isTauriApp = typeof window.__TAURI__?.core?.invoke === "function";
  if (openTileSetFolderBtn) {
    openTileSetFolderBtn.disabled = !isTauriApp;
  }
  if (saveTileSetFolderBtn) {
    saveTileSetFolderBtn.disabled = !isTauriApp || getTileSetConfig(state.selectedTileSetId)?.source !== "custom";
  }
}

function syncBossTileSetHeading() {
  syncBossTileSetHeadingBM(getBossManagementCtx());
}

function waitForTimeout(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function waitForNextPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

async function runTileSetCrossfade(task) {
  document.body.classList.add("tile-set-crossfading");
  await waitForTimeout(TILE_SET_CROSSFADE_OUT_MS);
  try {
    return await task();
  } finally {
    await waitForNextPaint();
    document.body.classList.remove("tile-set-crossfading");
  }
}

async function applyTileSet(tileSetId, showStatus = true) {
  const nextTileSet = getTileSetConfig(tileSetId);
  if (nextTileSet.status !== "ready") {
    console.warn(
      `Tile Set "${nextTileSet.label}" is marked ${nextTileSet.status.replaceAll("_", " ")}. Trying to load it anyway.`,
    );
  }

  const previousTileSetId = state.selectedTileSetId;
  try {
    state.selectedTileSetId = nextTileSet.id;
    if (tileSetSelect) tileSetSelect.value = nextTileSet.id;
    syncTileSetMenuOptions();
    state.wallEditorGroupId = getWallEditorGroupIdForTileSet(nextTileSet.id);
    syncSelectedTileSetHeading();
    syncBossTileSetHeading();
    state.referenceTileSrc = getReferenceTileSrc(nextTileSet.id);
    await loadTiles(nextTileSet.id);
    if (state.wallEditMode) {
      if (state.wallEditorActiveTileSetId !== nextTileSet.id) {
        state.wallEditorActiveTileSetId = nextTileSet.id;
        state.wallEditorActiveTileId = nextTileSet.entranceTileId;
      }
      await renderWallEditorPage();
      if (state.wallEditorActiveTileSetId && state.wallEditorActiveTileId) {
        setActiveWallEditorTile(state.wallEditorActiveTileSetId, state.wallEditorActiveTileId);
      }
    }
    applyBoardZoom(DEFAULT_BOARD_ZOOM);
    resetBoardPan();
    updateBoardAutoCenterViewportAnchor();
    startRound();
    if (state.autoThemeByTileSet) {
      applyAutoThemeForTileSet(nextTileSet.id, { save: true, showStatus: false });
    }
    void saveDataSetting(SELECTED_TILE_SET_STORAGE_KEY, nextTileSet.id);
    if (showStatus) setStatus(`Tile Set: ${nextTileSet.label}.`);
  } catch (error) {
    console.error(error);
    const previousTileSet = getTileSetConfig(previousTileSetId);
    const fallbackTileSet = previousTileSet.id !== nextTileSet.id
      ? previousTileSet
      : getTileSetRegistry().find((entry) => entry.source === "built_in" && entry.id !== nextTileSet.id)
        || getTileSetRegistry().find((entry) => entry.source === "built_in")
        || previousTileSet;

    state.selectedTileSetId = fallbackTileSet.id;
    syncSelectedTileSetHeading();
    syncBossTileSetHeading();
    state.referenceTileSrc = getReferenceTileSrc(fallbackTileSet.id);
    if (tileSetSelect) tileSetSelect.value = fallbackTileSet.id;
    syncTileSetMenuOptions();
    try {
      await loadTiles(fallbackTileSet.id);
      startRound();
    } catch (fallbackError) {
      console.error(fallbackError);
    }
    setStatus(`Tile Set "${nextTileSet.label}" assets are missing. Keeping ${fallbackTileSet.label}.`, true);
  }
}

function bindGlobalControls() {
  if (localDataNoticeDismissBtn) {
    localDataNoticeDismissBtn.addEventListener("click", () => {
      dismissLocalDataNotice();
    });
  }
  if (localDataNoticeActionBtn) {
    localDataNoticeActionBtn.addEventListener("click", async () => {
      const action = localDataNoticeActionContext;
      if (!action?.type) return;
      if (action.type === "open_tile_editor_backup") {
        openTileEditorForLocalBackup(action.tileSetId);
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
  if (chooseDataFolderBtn) {
    chooseDataFolderBtn.disabled = typeof window.__TAURI__?.core?.invoke !== "function";
    chooseDataFolderBtn.addEventListener("click", async () => {
      try {
        const previousPath = getStoredDataFolderPath();
        const selectedPath = await chooseDataFolder(previousPath, { persist: false });
        if (!selectedPath) {
          setStatus("Data folder selection canceled.");
          return;
        }
        await finalizeDataFolderSelection(selectedPath);
      } catch (error) {
        console.error(error);
        setStatus(error?.message || "Could not choose a data folder.", true);
      }
    });
  }
  if (openTileSetFolderBtn) {
    openTileSetFolderBtn.disabled = typeof window.__TAURI__?.core?.invoke !== "function";
    openTileSetFolderBtn.addEventListener("click", async () => {
      try {
        await openTileSetFolderImportPicker();
      } catch (error) {
        console.error(error);
        setStatus(error?.message || "Could not import a custom tile set folder.", true);
      }
    });
  }
  if (saveTileSetFolderBtn) {
    saveTileSetFolderBtn.disabled = typeof window.__TAURI__?.core?.invoke !== "function";
    saveTileSetFolderBtn.addEventListener("click", async () => {
      const selectedTileSet = getTileSetConfig(state.selectedTileSetId);
      if (!selectedTileSet || selectedTileSet.source !== "custom") {
        setStatus("Save Tile Set As Folder is available only for custom tile sets.", true);
        return;
      }
      try {
        const selectedFolder = await chooseFolderPath(getStoredDataFolderPath(), { title: "Save Tile Set Folder" });
        if (!selectedFolder) {
          setStatus("Tile set folder save canceled.");
          return;
        }
        await saveCustomTileSetAsFolder(selectedTileSet.id, selectedFolder);
      } catch (error) {
        console.error(error);
        setStatus(error?.message || "Could not save the custom tile set folder.", true);
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
  if (toggleFaceFeedbackCheckbox) {
    toggleFaceFeedbackCheckbox.checked = state.useFaceFeedback;
    toggleFaceFeedbackCheckbox.addEventListener("change", () => {
      markDevQaCheck("face_feedback_toggle");
      state.useFaceFeedback = toggleFaceFeedbackCheckbox.checked;
      applyFeedbackMode(state.useFaceFeedback);
      setStatus(
        state.useFaceFeedback
          ? "Connection feedback mode: face-by-face."
          : "Connection feedback mode: classic full outline.",
      );
      void saveDataSetting(USE_FACE_FEEDBACK_STORAGE_KEY, state.useFaceFeedback);
    });
  }
  if (toggleAllBossesCheckbox) {
    toggleAllBossesCheckbox.checked = state.useAllBosses;
    toggleAllBossesCheckbox.addEventListener("change", () => {
      markDevQaCheck("all_bosses_toggle");
      state.useAllBosses = toggleAllBossesCheckbox.checked;
      renderBossPile();
      syncBossTileSetHeading();
      setStatus(
        state.useAllBosses
          ? "Random boss: drawing from all tile sets."
          : "Random boss: drawing from current tile set only.",
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
        setStatus("Export Debug Walls is available only in Tile Editor.", true);
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
        setStatus("Import Debug Walls is available only in Tile Editor.", true);
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
      setStatus(state.leftDrawerCollapsed ? "Tile drawer collapsed." : "Tile drawer expanded.");
    });
  }
  if (toggleRightDrawerBtn) {
    toggleRightDrawerBtn.addEventListener("click", () => {
      state.rightDrawerCollapsed = !state.rightDrawerCollapsed;
      applyDrawerCollapseState({ preserveBoardScreenPosition: true });
      setStatus(state.rightDrawerCollapsed ? "Info drawer collapsed." : "Info drawer expanded.");
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
      state.rightDrawerCollapsed = !state.rightDrawerCollapsed;
      applyDrawerCollapseState({ preserveBoardScreenPosition: true });
      setStatus(state.rightDrawerCollapsed ? "Info drawer collapsed." : "Info drawer expanded.");
      return;
    }

    if (key === "s") {
      event.preventDefault();
      state.leftDrawerCollapsed = !state.leftDrawerCollapsed;
      applyDrawerCollapseState({ preserveBoardScreenPosition: true });
      setStatus(state.leftDrawerCollapsed ? "Tile drawer collapsed." : "Tile drawer expanded.");
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

function updateBoardAutoCenterViewportAnchor(width = window.innerWidth) {
  const nextWidth = Number(width);
  if (!Number.isFinite(nextWidth) || nextWidth <= 0) return;
  state.lastAutoCenterViewportWidth = nextWidth;
}

function clearBoardAutoCenterResizeTimer() {
  if (!boardAutoCenterResizeTimer) return;
  clearTimeout(boardAutoCenterResizeTimer);
  boardAutoCenterResizeTimer = null;
}

function scheduleBoardAutoCenterOnViewportResize() {
  const currentWidth = window.innerWidth;
  if (!Number.isFinite(currentWidth) || currentWidth <= 0) return;

  if (state.compactSidePanelMode) {
    clearBoardAutoCenterResizeTimer();
    updateBoardAutoCenterViewportAnchor(currentWidth);
    return;
  }

  const anchorWidth = Number(state.lastAutoCenterViewportWidth) || currentWidth;
  const widthDelta = currentWidth - anchorWidth;
  if (Math.abs(widthDelta) < BOARD_AUTO_CENTER_RESIZE_DELTA_X) {
    clearBoardAutoCenterResizeTimer();
    return;
  }

  clearBoardAutoCenterResizeTimer();
  boardAutoCenterResizeTimer = setTimeout(() => {
    boardAutoCenterResizeTimer = null;
    if (state.compactSidePanelMode) {
      updateBoardAutoCenterViewportAnchor();
      return;
    }
    recenterBoardView();
  }, BOARD_AUTO_CENTER_RESIZE_SETTLE_MS);
}

function updateCompactSidePanelMode() {
  const shouldCompact = shouldUseCompactSidePanelMode();
  if (state.compactSidePanelMode === shouldCompact) return;
  setCompactSidePanelMode(shouldCompact);
}

function clearCompactModeBoardReset() {
  if (compactModeTransitionFrame) {
    cancelAnimationFrame(compactModeTransitionFrame);
    compactModeTransitionFrame = 0;
  }
  if (compactModeTransitionTimer) {
    clearTimeout(compactModeTransitionTimer);
    compactModeTransitionTimer = null;
  }
}

function setCompactSidePanelMode(enabled) {
  const useCompact = Boolean(enabled);
  const compactZoom = 0.75;
  let restoreZoom = DEFAULT_BOARD_ZOOM;
  let restoreRawZoom = DEFAULT_BOARD_ZOOM;
  state.compactSidePanelMode = useCompact;
  if (useCompact) {
    markDevQaCheck("compact_mode");
  }
  document.body.classList.toggle("compact-sidepanel-mode", useCompact);
  if (useCompact) {
    clearBoardAutoCenterResizeTimer();
  }
  updateBoardAutoCenterViewportAnchor();

  if (useCompact) {
    state.preCompactDrawerState = {
      left: Boolean(state.leftDrawerCollapsed),
      right: Boolean(state.rightDrawerCollapsed),
    };
    state.preCompactBoardZoom = getBoardZoom();
    state.preCompactBoardZoomRaw = getBoardRawZoom();
    if (state.reserveEditMode) {
      state.reserveEditMode = false;
      document.body.classList.remove("reserve-edit-mode");
      clearPendingReserveSwap();
    }
    if (reserveEditCheckbox) reserveEditCheckbox.checked = false;
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
    const restored = state.preCompactDrawerState || { left: false, right: false };
    state.leftDrawerCollapsed = restored.left;
    state.rightDrawerCollapsed = restored.right;
    state.preCompactDrawerState = null;
    bossSectionPanelMountMarker.parentElement.insertBefore(
      bossSectionPanel,
      bossSectionPanelMountMarker.nextSibling,
    );
    rerenderTrayAndReserve();
  } else {
    const restored = state.preCompactDrawerState || { left: false, right: false };
    state.leftDrawerCollapsed = restored.left;
    state.rightDrawerCollapsed = restored.right;
    state.preCompactDrawerState = null;
    rerenderTrayAndReserve();
  }

  if (useCompact) {
    restoreZoom = compactZoom;
    restoreRawZoom = compactZoom;
  } else {
    restoreZoom = Number(state.preCompactBoardZoom) || DEFAULT_BOARD_ZOOM;
    restoreRawZoom = Number(state.preCompactBoardZoomRaw) || restoreZoom;
    state.preCompactBoardZoom = null;
    state.preCompactBoardZoomRaw = null;
  }

  clearCompactModeBoardReset();
  compactModeTransitionFrame = requestAnimationFrame(() => {
    compactModeTransitionFrame = 0;
    resetBoardViewToZoom(restoreZoom, restoreRawZoom);
    scheduleBoardHexGridRender();
  });
  if (!useCompact) {
    // Run a second recenter after drawer/layout transition settles.
    compactModeTransitionTimer = setTimeout(() => {
      resetBoardViewToZoom(restoreZoom, restoreRawZoom);
      scheduleBoardHexGridRender();
      compactModeTransitionTimer = null;
    }, 260);
  }
}

function syncWallEditorPointEditModeClass() {
  document.body.classList.toggle("wall-editor-point-edit-mode", Boolean(state.wallEditorPointEditMode));
}

function setAttributeIfChanged(element, name, value) {
  if (!element) return;
  if (element.getAttribute(name) === value) return;
  element.setAttribute(name, value);
}

function applyDrawerCollapseState({ save = true, rerender = true, preserveBoardScreenPosition = false } = {}) {
  const beforeRect = preserveBoardScreenPosition ? board.getBoundingClientRect() : null;
  const wasLeftCollapsed = document.body.classList.contains("left-drawer-collapsed");
  const wasRightCollapsed = document.body.classList.contains("right-drawer-collapsed");
  const canCollapse = window.matchMedia("(min-width: 981px)").matches;
  const leftCollapsed = canCollapse && state.leftDrawerCollapsed;
  const rightCollapsed = canCollapse && state.rightDrawerCollapsed;
  const collapseStateUnchanged = wasLeftCollapsed === leftCollapsed && wasRightCollapsed === rightCollapsed;

  if (collapseStateUnchanged && !save && !rerender && !preserveBoardScreenPosition) {
    return;
  }

  document.body.classList.toggle("left-drawer-collapsed", leftCollapsed);
  document.body.classList.toggle("right-drawer-collapsed", rightCollapsed);
  if (cornerLogo) {
    cornerLogo.src = leftCollapsed && rightCollapsed
      ? "./Graphics/mapper_logo.png"
      : "./Graphics/logo.png";
  }

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

  setAttributeIfChanged(leftDrawer, "aria-expanded", String(!leftCollapsed));
  setAttributeIfChanged(rightDrawer, "aria-expanded", String(!rightCollapsed));
  setAttributeIfChanged(leftDrawerContent, "aria-hidden", String(leftCollapsed));
  setAttributeIfChanged(rightDrawerContent, "aria-hidden", String(rightCollapsed));

  if (toggleLeftDrawerBtn) {
    const label = leftCollapsed ? "Expand tile drawer" : "Collapse tile drawer";
    setAttributeIfChanged(toggleLeftDrawerBtn, "aria-expanded", String(!leftCollapsed));
    setAttributeIfChanged(toggleLeftDrawerBtn, "aria-label", label);
    setAttributeIfChanged(toggleLeftDrawerBtn, "title", label);
  }
  if (toggleRightDrawerBtn) {
    const label = rightCollapsed ? "Expand info drawer" : "Collapse info drawer";
    setAttributeIfChanged(toggleRightDrawerBtn, "aria-expanded", String(!rightCollapsed));
    setAttributeIfChanged(toggleRightDrawerBtn, "aria-label", label);
    setAttributeIfChanged(toggleRightDrawerBtn, "title", label);
  }

  if (save) saveDrawerState({ left: leftCollapsed, right: rightCollapsed });
  const completeRerender = () => {
    if (!rerender) return;
    recenterTrayAndReserveTiles();
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

function forEachBoardTile(callback) {
  forEachBoardTileBV(callback, getBoardViewCtx());
}

function forEachBoardBossToken(callback) {
  forEachBoardBossTokenBM(callback, getBossManagementCtx());
}

function loadDrawerState() {
  if (IS_TAURI_RUNTIME && !isDataFolderPersistenceActive()) {
    return { left: false, right: false };
  }
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
  void saveDataSetting(DRAWER_STATE_STORAGE_KEY, {
    left: Boolean(next?.left),
    right: Boolean(next?.right),
  }).catch((error) => {
    console.warn("Could not save drawer collapse state.", error);
  });
}

function shiftBoardSceneBy(dx, dy) {
  shiftBoardSceneByBV(dx, dy, getBoardViewCtx());
}

function lockBoardSceneDuringLayoutTransition(startRect, durationMs, onDone) {
  lockBoardSceneDuringLayoutTransitionBV(startRect, durationMs, getBoardViewCtx(), onDone);
}

function toggleBothDrawers() {
  const collapseBoth = !(state.leftDrawerCollapsed && state.rightDrawerCollapsed);
  state.leftDrawerCollapsed = collapseBoth;
  state.rightDrawerCollapsed = collapseBoth;
  applyDrawerCollapseState({ preserveBoardScreenPosition: true });
  setStatus(collapseBoth ? "Both drawers collapsed." : "Both drawers expanded.");
}

function loadAppearanceMode() {
  if (IS_TAURI_RUNTIME && !isDataFolderPersistenceActive()) return DEFAULT_APPEARANCE_MODE;
  try {
    const saved = localStorage.getItem(APPEARANCE_MODE_STORAGE_KEY);
    if (APPEARANCE_MODE_IDS.has(saved)) return saved;
  } catch (error) {
    console.warn("Could not load appearance mode preference.", error);
  }
  return DEFAULT_APPEARANCE_MODE;
}

function loadAutoThemeByTileSet() {
  if (IS_TAURI_RUNTIME && !isDataFolderPersistenceActive()) return true;
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

function loadBoolStorage(storageKey, fallback = false) {
  if (IS_TAURI_RUNTIME && !isDataFolderPersistenceActive()) return Boolean(fallback);
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved == null) return Boolean(fallback);
    return saved === "true";
  } catch (error) {
    console.warn(`Could not load ${storageKey}.`, error);
    return Boolean(fallback);
  }
}

function loadShowGuideLabels() {
  return loadBoolStorage(SHOW_GUIDE_LABELS_STORAGE_KEY, false);
}

function loadShowWallFaces() {
  return loadBoolStorage(SHOW_WALL_FACES_STORAGE_KEY, false);
}

function loadShowPortalFlags() {
  return loadBoolStorage(SHOW_PORTAL_FLAGS_STORAGE_KEY, false);
}

function loadIgnoreContactRule() {
  return loadBoolStorage(IGNORE_CONTACT_RULE_STORAGE_KEY, false);
}

function loadUseFaceFeedback() {
  return loadBoolStorage(USE_FACE_FEEDBACK_STORAGE_KEY, false);
}

function loadUseAllBosses() {
  return loadBoolStorage(USE_ALL_BOSSES_STORAGE_KEY, false);
}

function saveAutoThemeByTileSet(enabled) {
  saveAutoThemeByTileSetTM(enabled, getThemeManagerCtx());
}

function sanitizeAutoBuildDevTuningValue(meta, value) {
  const fallback = AUTO_BUILD_DEV_TUNING_DEFAULTS[meta.key];
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  const clamped = clamp(numeric, meta.min, meta.max);
  const steps = Math.round((clamped - meta.min) / meta.step);
  const snapped = meta.min + steps * meta.step;
  return Number(snapped.toFixed(4));
}

function sanitizeAutoBuildDevTuning(raw) {
  const sanitized = {};
  for (const meta of AUTO_BUILD_DEV_TUNING_FIELDS) {
    sanitized[meta.key] = sanitizeAutoBuildDevTuningValue(meta, raw?.[meta.key]);
  }
  return sanitized;
}

function loadAutoBuildDevTuning() {
  if (IS_TAURI_RUNTIME && !isDataFolderPersistenceActive()) {
    return { ...AUTO_BUILD_DEV_TUNING_DEFAULTS };
  }
  try {
    localStorage.removeItem(LEGACY_AUTO_BUILD_TUNING_STORAGE_KEY);
    const raw = localStorage.getItem(AUTO_BUILD_DEV_TUNING_STORAGE_KEY);
    if (!raw) return { ...AUTO_BUILD_DEV_TUNING_DEFAULTS };
    return sanitizeAutoBuildDevTuning(JSON.parse(raw));
  } catch (error) {
    console.warn("Could not load auto build dev tuning values.", error);
    return { ...AUTO_BUILD_DEV_TUNING_DEFAULTS };
  }
}

function saveAutoBuildDevTuning() {
  void saveDataSetting(AUTO_BUILD_DEV_TUNING_STORAGE_KEY, autoBuildDevTuning).catch((error) => {
    console.warn("Could not save auto build dev tuning values.", error);
  });
}

function formatAutoBuildDevTuningValue(meta, value) {
  const stepText = String(meta.step);
  const decimals = stepText.includes(".") ? (stepText.split(".")[1]?.length || 0) : 0;
  return decimals ? Number(value).toFixed(decimals) : String(Math.round(value));
}

function getAutoBuildDevTuningExport() {
  const lines = ["const AUTO_BUILD_DEV_TUNING_DEFAULTS = {"];
  for (const meta of AUTO_BUILD_DEV_TUNING_FIELDS) {
    lines.push(`  ${meta.key}: ${formatAutoBuildDevTuningValue(meta, autoBuildDevTuning[meta.key])},`);
  }
  lines.push("};");
  return lines.join("\n");
}

async function copyAutoBuildDevTuningExport() {
  const payload = getAutoBuildDevTuningExport();
  try {
    await navigator.clipboard.writeText(payload);
    setStatus("Auto build tuning values copied.");
  } catch (error) {
    console.warn("Could not copy auto build tuning values.", error);
    setStatus(`Could not copy auto build tuning values. Use devtools localStorage key ${AUTO_BUILD_DEV_TUNING_STORAGE_KEY}.`, true);
  }
}

function updateAutoBuildTuningPanel() {
  for (const meta of AUTO_BUILD_DEV_TUNING_FIELDS) {
    const ref = autoBuildTuningInputRefs.get(meta.key);
    if (!ref) continue;
    const value = autoBuildDevTuning[meta.key];
    ref.input.value = String(value);
    ref.valueEl.textContent = formatAutoBuildDevTuningValue(meta, value);
  }
}

function resetAutoBuildTuning() {
  autoBuildDevTuning = { ...AUTO_BUILD_DEV_TUNING_DEFAULTS };
  saveAutoBuildDevTuning();
  updateAutoBuildTuningPanel();
}

function initAutoBuildTuningPanel() {
  if (!autoBuildTuningControlsEl || autoBuildTuningInputRefs.size) {
    updateAutoBuildTuningPanel();
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const meta of AUTO_BUILD_DEV_TUNING_FIELDS) {
    const row = document.createElement("div");
    row.className = "auto-build-tuning-row";

    const head = document.createElement("div");
    head.className = "auto-build-tuning-row-head";

    const label = document.createElement("label");
    label.className = "auto-build-tuning-label";
    label.textContent = meta.label;

    const valueEl = document.createElement("span");
    valueEl.className = "auto-build-tuning-value";

    head.appendChild(label);
    head.appendChild(valueEl);

    const input = document.createElement("input");
    input.type = "range";
    input.min = String(meta.min);
    input.max = String(meta.max);
    input.step = String(meta.step);
    input.dataset.tuningKey = meta.key;
    input.addEventListener("input", () => {
      autoBuildDevTuning = {
        ...autoBuildDevTuning,
        [meta.key]: sanitizeAutoBuildDevTuningValue(meta, input.value),
      };
      saveAutoBuildDevTuning();
      valueEl.textContent = formatAutoBuildDevTuningValue(meta, autoBuildDevTuning[meta.key]);
    });

    row.appendChild(head);
    row.appendChild(input);
    fragment.appendChild(row);
    autoBuildTuningInputRefs.set(meta.key, { input, valueEl });
  }

  autoBuildTuningControlsEl.appendChild(fragment);

  if (autoBuildTuningResetBtn) {
    autoBuildTuningResetBtn.addEventListener("click", () => {
      resetAutoBuildTuning();
      setStatus("Auto build tuning reset to defaults.");
    });
  }
  if (autoBuildTuningCopyBtn) {
    autoBuildTuningCopyBtn.addEventListener("click", () => {
      copyAutoBuildDevTuningExport();
    });
  }
  updateAutoBuildTuningPanel();
}

function saveAppearanceMode(mode) {
  saveAppearanceModeTM(mode, getThemeManagerCtx());
}

function syncThemeControlVisibility() {
  syncThemeControlVisibilityTM(getThemeManagerCtx());
}

function syncAutoThemeToggleButton() {
  syncAutoThemeToggleButtonTM(getThemeManagerCtx());
}

function loadUiThemeId() {
  try {
    const saved = localStorage.getItem(UI_THEME_STORAGE_KEY);
    if (saved === "current") return DEFAULT_UI_THEME_ID;
    if (isSupportedUiThemeId(saved)) return saved;
  } catch (error) {
    console.warn("Could not load UI theme preference.", error);
  }
  return DEFAULT_UI_THEME_ID;
}

function loadLastLightUiThemeId() {
  try {
    const saved = localStorage.getItem(LAST_LIGHT_UI_THEME_STORAGE_KEY);
    if (saved === "current") return DEFAULT_UI_THEME_ID;
    const sanitized = sanitizeLightUiThemeId(saved);
    if (sanitized) return sanitized;
  } catch (error) {
    console.warn("Could not load light theme preference.", error);
  }
  return DEFAULT_UI_THEME_ID;
}

function loadLastDarkUiThemeId() {
  try {
    const saved = localStorage.getItem(LAST_DARK_UI_THEME_STORAGE_KEY);
    const sanitized = sanitizeDarkUiThemeId(saved);
    if (sanitized) return sanitized;
  } catch (error) {
    console.warn("Could not load dark theme preference.", error);
  }
  return DEFAULT_DARK_THEME;
}

function saveLastLightUiThemeId(uiThemeId) {
  saveLastLightUiThemeIdTM(uiThemeId, getThemeManagerCtx());
}

function saveLastDarkUiThemeId(uiThemeId) {
  saveLastDarkUiThemeIdTM(uiThemeId, getThemeManagerCtx());
}

function saveUiThemeId(uiThemeId) {
  saveUiThemeIdTM(uiThemeId, getThemeManagerCtx());
}

function isDarkUiTheme(uiThemeId) {
  return isDarkUiThemeTM(uiThemeId, getThemeManagerCtx());
}

function resolvePairedUiThemeIdForMode(uiThemeId, mode) {
  return resolvePairedUiThemeIdForModeTM(uiThemeId, mode, getThemeManagerCtx());
}

function resolveUiThemeForAppearanceMode(mode) {
  return resolveUiThemeForAppearanceModeTM(mode, getThemeManagerCtx());
}

function applyAutoThemeForTileSet(tileSetId, { save = true, showStatus = false } = {}) {
  applyAutoThemeForTileSetTM(tileSetId, getThemeManagerCtx(), { save, showStatus });
}

function setAutoThemeByTileSet(enabled, { save = true, showStatus = true, applyNow = true } = {}) {
  setAutoThemeByTileSetTM(enabled, getThemeManagerCtx(), { save, showStatus, applyNow });
}

function syncUiThemeSelectAvailability(mode) {
  syncUiThemeSelectAvailabilityTM(mode, getThemeManagerCtx());
}

function getAppearanceModeLabel(mode) {
  return getAppearanceModeLabelTM(mode);
}

function getAppearanceModeMenuItemLabel(mode) {
  return getAppearanceModeMenuItemLabelTM(mode);
}

function applyAppearanceMode(mode, { showStatus = true, save = true } = {}) {
  applyAppearanceModeTM(mode, getThemeManagerCtx(), { showStatus, save });
}

function syncAppearanceModeMenu(mode) {
  syncAppearanceModeMenuTM(mode, getThemeManagerCtx());
}

function setAppearanceModeMenuOpen(open) {
  setAppearanceModeMenuOpenTM(open, getThemeManagerCtx());
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

function closeAdvancedMenuForElement(element) {
  const menu = element?.closest(".advanced-menu");
  if (menu) menu.open = false;
}

function syncUiThemeMenuOptions() {
  syncUiThemeMenuOptionsTM(getThemeManagerCtx());
}

function setUiThemeMenuOpen(open) {
  setUiThemeMenuOpenTM(open, getThemeManagerCtx());
}

function applyUiTheme(uiThemeId) {
  applyUiThemeTM(uiThemeId, getThemeManagerCtx());
}

function getUiThemeLabel(uiThemeId) {
  return getUiThemeLabelTM(uiThemeId, getThemeManagerCtx());
}

function applyFeedbackMode(useFaceFeedback) {
  applyFeedbackModeTM(useFaceFeedback);
}

function getBoardZoom() {
  return getBoardZoomBV(getBoardViewCtx());
}

function getBoardRawZoom() {
  return getBoardRawZoomBV(getBoardViewCtx());
}

function worldToBoardScreenX(x, zoom = getBoardZoom()) {
  return worldToBoardScreenXBV(x, getBoardViewCtx(), zoom);
}

function worldToBoardScreenY(y, zoom = getBoardZoom()) {
  return worldToBoardScreenYBV(y, getBoardViewCtx(), zoom);
}

function syncBoardSceneTransforms() {
  syncBoardSceneTransformsBV(getBoardViewCtx());
}

function quantizeBoardZoom(zoom) {
  return quantizeBoardZoomBV(zoom, getBoardViewCtx());
}

function applyBoardZoom(zoom, options = {}) {
  applyBoardZoomBV(zoom, getBoardViewCtx(), options);
}

function recenterBoardView({ resetZoom = false } = {}) {
  recenterBoardViewBV(getBoardViewCtx(), { resetZoom });
}

function resetBoardViewToZoom(zoom = DEFAULT_BOARD_ZOOM, rawZoom = zoom) {
  resetBoardViewToZoomBV(getBoardViewCtx(), zoom, rawZoom);
}

function resetBoardView() {
  resetBoardViewBV(getBoardViewCtx());
}

function zoomBoardAtPoint(delta, anchorBoardX, anchorBoardY) {
  zoomBoardAtPointBV(delta, anchorBoardX, anchorBoardY, getBoardViewCtx());
}

function translateBoardContent(dx, dy, options = {}) {
  translateBoardContentBV(dx, dy, getBoardViewCtx(), options);
}

function resetBoardPan() {
  resetBoardPanBV(getBoardViewCtx());
}

function updateBoardZoomIndicator() {
  updateBoardZoomIndicatorBV(getBoardViewCtx());
}

function setWallEditMode(enabled) {
  clearPendingReserveSwap();
  state.wallEditMode = enabled;
  document.body.classList.toggle("wall-edit-mode", enabled);
  if (!enabled) {
    state.wallEditorPointEditMode = false;
  }
  syncWallEditorPointEditModeClass();
  if (toggleWallEditBtn) {
    toggleWallEditBtn.textContent = enabled ? "Build View" : "Tile Editor";
  }
  if (enabled) {
    state.buildViewSnapshot = captureBuildViewLayout();
    startWallEditSession();
    setStatus("Tile Editor: edit walls, portals, endpoints, guide points, and custom tile assets. Changes are saved per tile set + tile.");
  } else {
    syncSelectedTileSetWallsFromOverrides();
    const snapshot = state.buildViewSnapshot;
    state.buildViewSnapshot = null;
    if (snapshot?.tileSetId) {
      applyTileSet(snapshot.tileSetId, false)
        .then(() => {
          const restored = restoreBuildViewLayout(snapshot);
          if (tileSetSelect) tileSetSelect.value = snapshot.tileSetId;
          syncTileSetMenuOptions();
          if (restored) {
            setStatus("Build view restored.");
          } else {
            startRound();
            setStatus("Build view restored. Round reset.");
          }
        })
        .catch((error) => {
          console.error(error);
          setStatus("Returned to build view, but the previous tileset could not be restored.", true);
        });
    } else {
      startRound();
      setStatus("Build view restored. Round reset.");
    }
  }
  updateModeIndicators();
}

function openTileEditorForLocalBackup(tileSetId = "") {
  const tileSet = tileSetId ? getTileSetConfig(tileSetId) : getTileSetConfig(state.selectedTileSetId);
  const activateTargetTileSet = () => {
    if (!tileSet) return;
    state.wallEditorActiveTileSetId = tileSet.id;
    state.wallEditorActiveTileId = tileSet.entranceTileId;
  };
  if (tileSet) {
    state.wallEditorGroupId = getWallEditorGroupIdForTileSet(tileSet.id);
  }

  if (!state.wallEditMode) {
    setWallEditMode(true);
    activateTargetTileSet();
  } else {
    activateTargetTileSet();
    renderWallEditorPage().catch((error) => {
      console.error(error);
      setStatus("Could not open Tile Editor backup view.", true);
    });
  }
  setStatus("Tile Editor: use the backup marker on the custom tile set to export it.");
}

function startWallEditSession() {
  clearBoard();
  state.wallEditorTileRefs = new Map();
  state.wallEditorActiveTileSetId = null;
  state.wallEditorActiveTileId = null;
  if (!state.wallEditorGroupId) {
    state.wallEditorGroupId = getWallEditorGroupIdForTileSet(state.selectedTileSetId);
  }
  syncWallEditorPointEditModeClass();
  renderWallEditorPage().catch((error) => {
    console.error(error);
    setStatus("Failed to build tile editor page. Check tile assets.", true);
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
  const bossTokens = state.bossTokens.map((token) => ({
    id: token.id,
    bossKey: token.bossKey || "",
    src: token.src,
    x: Number(token.x) || 0,
    y: Number(token.y) || 0,
    size: Number(token.size) || TILE_SIZE,
  }));
  const referenceMarker = state.referenceMarker
    ? {
        x: Number(state.referenceMarker.x) || 0,
        y: Number(state.referenceMarker.y) || 0,
      }
    : null;
  return {
    tileSetId: state.selectedTileSetId,
    boardPanX: Number(state.boardPanX) || 0,
    boardPanY: Number(state.boardPanY) || 0,
    boardZoom: Number(state.boardZoom) || 1,
    regularTileOrder: [...getRegularTileOrder(state.selectedTileSetId)],
    reserveOrder: [...getReserveTileOrder(state.selectedTileSetId)],
    referenceMarker,
    bossTokens,
    tiles,
  };
}

function captureShareLayoutPayload() {
  return captureShareLayoutPayloadSF(getShareFlowCtx());
}

function buildShareLayoutSnapshot(payload) {
  return buildShareLayoutSnapshotSF(payload, getShareFlowCtx());
}

function createShareLayoutUrl() {
  return createShareLayoutUrlSF(getShareFlowCtx());
}

async function buildCustomTileSetExportArchive(tileSetId) {
  return buildCustomTileSetExportArchiveSF(tileSetId, getShareFlowCtx());
}

async function buildCustomShareBundleArchive(tileSetId, shareUrl) {
  return buildCustomShareBundleArchiveSF(tileSetId, shareUrl, getShareFlowCtx());
}

function buildShareFallbackPayload(payload, fallbackTileSetId = DEFAULT_TILE_SET_ID) {
  return buildShareFallbackPayloadSF(payload, getShareFlowCtx(), fallbackTileSetId);
}

async function copyShareLayoutLink() {
  return copyShareLayoutLinkSF(getShareFlowCtx());
}

async function restoreSharedLayoutFromUrl() {
  return restoreSharedLayoutFromUrlSF(getShareFlowCtx());
}

function restoreBuildViewLayout(snapshot) {
  return restoreBuildViewLayoutSF(snapshot, getShareFlowCtx());
}

function getCurrentLayoutExportItems(options = {}) {
  return buildCurrentLayoutExportItems({
    placedTiles: getPlacedTiles(),
    includeReference: options.includeReference !== false,
    includeBoss: options.includeBoss !== false,
    isEntranceTile,
    tileSize: TILE_SIZE,
    referenceCardId: REFERENCE_CARD_ID,
    referenceMarker: state.referenceMarker,
    referenceTileSrc: state.referenceTileSrc,
    bossTokens: state.bossTokens,
    normalizeAngle,
  });
}

function exportCurrentLayoutPdf() {
  if (state.wallEditMode) {
    setStatus("PDF export is available on Build View only.", true);
    return;
  }

  const items = getCurrentLayoutExportItems({ includeReference: true, includeBoss: true });
  if (!items.length) {
    setStatus("Nothing is available to export.", true);
    return;
  }

  const margin = Math.max(TILE_SIZE * 0.9, 160);
  const centersX = items.map((item) => item.x);
  const centersY = items.map((item) => item.y);
  const minCenterX = Math.min(...centersX);
  const maxCenterX = Math.max(...centersX);
  const minCenterY = Math.min(...centersY);
  const maxCenterY = Math.max(...centersY);
  const exportWidth = Math.max(640, (maxCenterX - minCenterX) + margin * 2);
  const exportHeight = Math.max(640, (maxCenterY - minCenterY) + margin * 2);
  const headerLogoWidth = 180;
  const headerGapPx = 4;
  const headerHeightPx = 140;
  const frameWidth = Math.max(exportWidth, 900);
  const frameHeight = headerHeightPx + headerGapPx + exportHeight;
  const mmToPx = 96 / 25.4;
  const pageMarginPx = 12 * mmToPx;
  const portraitPage = {
    width: 210 * mmToPx,
    height: 297 * mmToPx,
    cssSize: "210mm 297mm",
    orientation: "portrait",
  };
  const landscapePage = {
    width: 297 * mmToPx,
    height: 210 * mmToPx,
    cssSize: "297mm 210mm",
    orientation: "landscape",
  };
  const computePageFit = (page) => {
    const availableWidth = page.width - (pageMarginPx * 2);
    const availableHeight = page.height - (pageMarginPx * 2);
    const scale = Math.min(availableWidth / frameWidth, availableHeight / frameHeight, 1);
    const scaledWidth = frameWidth * scale;
    const scaledHeight = frameHeight * scale;
    return {
      ...page,
      scale,
      scaledWidth,
      scaledHeight,
      availableWidth,
      availableHeight,
      emptyArea: Math.max(0, (availableWidth * availableHeight) - (scaledWidth * scaledHeight)),
      aspectDelta: Math.abs(Math.log((frameWidth / frameHeight) / (availableWidth / availableHeight))),
    };
  };
  const chooseBetterPageFit = (firstFit, secondFit) => {
    if (Math.abs(firstFit.scale - secondFit.scale) > 0.0005) {
      return firstFit.scale > secondFit.scale ? firstFit : secondFit;
    }
    if (Math.abs(firstFit.aspectDelta - secondFit.aspectDelta) > 0.0005) {
      return firstFit.aspectDelta < secondFit.aspectDelta ? firstFit : secondFit;
    }
    return firstFit.emptyArea <= secondFit.emptyArea ? firstFit : secondFit;
  };
  const portraitFit = computePageFit(portraitPage);
  const landscapeFit = computePageFit(landscapePage);
  const layoutAspectRatio = exportWidth / exportHeight;
  const frameAspectRatio = frameWidth / frameHeight;
  const orientationBias = Math.max(layoutAspectRatio, frameAspectRatio);
  const orientationPreference =
    orientationBias >= 1.08
      ? "landscape"
      : (1 / orientationBias) >= 1.08
        ? "portrait"
        : null;
  const bestFit =
    orientationPreference === "landscape"
      ? landscapeFit
      : orientationPreference === "portrait"
        ? portraitFit
        : chooseBetterPageFit(portraitFit, landscapeFit);
  const renderItems = items.map((item) => {
    const left = item.x - minCenterX + margin;
    const top = item.y - minCenterY + margin;
    return `
      <img
        class="export-item"
        src="${item.src}"
        alt=""
        style="
          left:${left.toFixed(2)}px;
          top:${top.toFixed(2)}px;
          width:${item.width.toFixed(2)}px;
          height:${item.height.toFixed(2)}px;
          transform:translate(-50%, -50%) rotate(${item.rotation.toFixed(2)}deg);
        "
      />
    `;
  }).join("");
  const tileSetLabel = getTileSetConfig(state.selectedTileSetId)?.label || "Dungeon";
  const printedAt = new Date().toLocaleString();
  const logoSrc = new URL("./Graphics/logo.png", window.location.href).href;
  const exportHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${tileSetLabel} Layout Export</title>
  <style>
    @page {
      size: ${bestFit.cssSize};
      margin: 12mm;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Avenir Next", "Segoe UI", sans-serif;
      color: #1f1b17;
      background: #f7f1ea;
    }
    .page {
      padding: 24px;
      width: max-content;
      min-width: 100%;
      margin: 0 auto;
    }
    .frame-shell {
      width: ${bestFit.scaledWidth.toFixed(2)}px;
      height: ${bestFit.scaledHeight.toFixed(2)}px;
      display: block;
      overflow: hidden;
    }
    .frame {
      position: relative;
      width: ${frameWidth.toFixed(2)}px;
      height: ${frameHeight.toFixed(2)}px;
      transform: scale(${bestFit.scale.toFixed(5)});
      transform-origin: top left;
    }
    .header {
      position: absolute;
      top: 0;
      left: 0;
      width: ${frameWidth.toFixed(2)}px;
      min-height: ${headerHeightPx.toFixed(2)}px;
      display: flex;
      align-items: center;
      gap: 18px;
    }
    .header-logo {
      width: ${headerLogoWidth.toFixed(2)}px;
      height: auto;
      object-fit: contain;
      flex: 0 0 auto;
    }
    .header-copy {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-width: 0;
    }
    .title {
      margin: 0 0 6px;
      font: 700 33px/1.1 "Palatino Linotype", "Book Antiqua", Palatino, serif;
      color: #6c4322;
    }
    .meta {
      margin: 0;
      font-size: 13px;
      color: #65584b;
    }
    .sheet {
      position: absolute;
      top: ${(headerHeightPx + headerGapPx).toFixed(2)}px;
      left: 0;
      width: ${exportWidth.toFixed(2)}px;
      height: ${exportHeight.toFixed(2)}px;
      border: 1px solid #d6c6b6;
      border-radius: 18px;
      padding: 24px;
      background:
        radial-gradient(circle at 18% 15%, rgba(255,255,255,0.6) 0%, transparent 42%),
        radial-gradient(circle at 84% 82%, rgba(241,225,208,0.55) 0%, transparent 38%),
        #fffaf3;
      box-shadow: 0 12px 28px rgba(37, 23, 13, 0.12);
    }
    .layout {
      position: relative;
      width: ${exportWidth.toFixed(2)}px;
      height: ${exportHeight.toFixed(2)}px;
      overflow: visible;
    }
    .export-item {
      position: absolute;
      display: block;
      user-select: none;
      pointer-events: none;
      object-fit: contain;
      transform-origin: center center;
      image-rendering: auto;
    }
    @media print {
      body {
        background: #ffffff;
      }
      .page {
        padding: 0;
        min-width: 0;
        width: auto;
      }
      .sheet {
        border: 0;
        border-radius: 0;
        padding: 0;
        background: transparent;
        box-shadow: none;
      }
      .meta {
        display: none;
      }
    }
  </style>
</head>
<body>
  <main class="page">
    <div class="frame-shell">
      <div class="frame">
        <header class="header">
          <img class="header-logo" src="${logoSrc}" alt="Here to Slay: DUNGEONS Mapper logo" />
          <div class="header-copy">
            <h1 class="title">${tileSetLabel} Dungeon Layout</h1>
            <p class="meta">Exported ${printedAt}</p>
          </div>
        </header>
        <section class="sheet">
          <div class="layout">
            ${renderItems}
          </div>
        </section>
      </div>
    </div>
  </main>
</body>
</html>`;
  const previewStorageKey = storePdfExportPreviewHtml(exportHtml);
  if (!previewStorageKey) {
    setStatus("Could not prepare PDF export preview.", true);
    return;
  }

  const previewUrl = new URL("./pdf-export.html", window.location.href);
  previewUrl.searchParams.set("storageKey", previewStorageKey);
  const previewWindowFeatures = "width=1280,height=1180";
  const openPreviewWindow = () => {
    const webviewWindow = window.__TAURI__?.webviewWindow?.WebviewWindow;
    if (typeof webviewWindow === "function") {
      const previewLabel = `pdf-export-preview-${Date.now()}`;
      const preview = new webviewWindow(previewLabel, {
        title: `${tileSetLabel} Layout Export`,
        url: previewUrl.href,
        width: 1280,
        height: 1180,
        resizable: true,
        minimizable: true,
        maximizable: true,
        closable: true,
        center: true,
        visible: true,
      });
      preview.once("tauri://error", (event) => {
        console.error("Could not open Tauri PDF preview window.", event);
        localStorage.removeItem(previewStorageKey);
        setStatus("Could not open PDF export preview.", true);
      });
      return preview;
    }

    const previewWindow = window.open(previewUrl.href, "_blank", previewWindowFeatures);
    if (!previewWindow) return null;
    try {
      previewWindow.focus();
    } catch {
      // ignore
    }
    return previewWindow;
  };

  const previewWindow = openPreviewWindow();
  if (!previewWindow) {
    localStorage.removeItem(previewStorageKey);
    setStatus("Could not open PDF export preview.", true);
    return;
  }

  setTimeout(() => {
    setStatus("PDF export preview opened. Use your browser's print command to save as PDF.");
  }, 50);
}

function getAutoBuildSearchProfile(tuning = autoBuildDevTuning) {
  const spread = clamp(Number(tuning.layoutSpread) || 0, 0, 1);
  const branch = clamp(Number(tuning.branchiness) || 0, 0, 1);
  const variety = clamp(Number(tuning.variety) || 0, 0, 1);
  return {
    roundnessWeight: 150 - spread * 72 - branch * 92,
    contactWeight: 22 - spread * 7 - branch * 8,
    minFaceDistWeight: 0.55,
    minCenterDistWeight: 0.5 + spread * 0.2 + branch * 0.12,
    avgCenterDistWeight: 0.22 + spread * 0.14 + branch * 0.08,
    radialPenaltyWeight: Math.max(0.05, 0.35 - spread * 0.24 - branch * 0.08),
    nearCenterPenaltyWeight: 1.15 + spread * 0.46 + branch * 0.34,
    farOutPenaltyWeight: Math.max(0.08, 0.7 - spread * 0.42 - branch * 0.08),
    lineExtensionPenalty: AUTO_BUILD_LINE_EXTENSION_PENALTY * (1 - spread * 0.58) * (1 - branch * 0.2),
    localDensityPenalty: AUTO_BUILD_LOCAL_DENSITY_PENALTY * (1 + branch * 0.95 + spread * 0.24),
    topBucketSize: 4 + Math.round(variety * 4),
    topBucketScoreDelta: 10 + variety * 18 + spread * 4 + branch * 4,
    localDensityRadiusMultiplier: 1.6 + branch * 0.12 + spread * 0.08,
    targetRadiusBaseMultiplier: 1.35 + spread * 1.0 + branch * 0.24,
    targetRadiusAvgBonusMultiplier: 0.7 + spread * 0.72 + branch * 0.18,
    targetMinRadiusMultiplier: clamp(0.6 + spread * 0.1 + branch * 0.08, 0.18, 1.5),
    targetMaxRadiusMultiplier: 1.5 + spread * 0.9 + branch * 0.22,
    targetCompletedLayouts: 4 + Math.round(variety * 4) + Math.round(spread * 1.5) + Math.round(branch * 1.5),
    minCompletedLayouts: 2 + Math.round(variety * 1.5),
    finalChoicePoolSize: 1 + Math.round(variety * 3),
    completionTimeBudgetMs: 120 + Math.round(variety * 90) + Math.round(spread * 35) + Math.round(branch * 35),
    maxCompletionAttempts: 90 + Math.round(variety * 70) + Math.round(spread * 20) + Math.round(branch * 20),
    recentShapePenalty: 0.4,
  };
}

function captureAutoBuildCandidateState(tiles) {
  return tiles.map((tile) => ({
    tileSetId: tile.tileSetId || state.selectedTileSetId,
    tileId: tile.tileId,
    x: tile.x,
    y: tile.y,
    rotation: tile.rotation,
  }));
}

function applyAutoBuildCandidateState(tiles, snapshot) {
  const byId = new Map((snapshot || []).map((entry) => [getTileInstanceKey(entry), entry]));
  for (const tile of tiles) {
    const saved = byId.get(getTileInstanceKey(tile));
    if (!saved) continue;
    tile.rotation = saved.rotation;
    tile.placed = true;
    positionTile(tile, saved.x, saved.y);
  }
}

function analyzeAutoBuildCompletedLayout(regularTiles, entranceTile) {
  const tiles = Array.isArray(regularTiles) ? regularTiles.filter(Boolean) : [];
  const allTiles = entranceTile ? [entranceTile, ...tiles] : [...tiles];
  if (!allTiles.length) {
    return {
      spreadMetric: 0,
      branchMetric: 0,
      compactnessMetric: 1,
      corridorMetric: 0,
      clusterMetric: 0,
      hubinessMetric: 0,
      leafinessMetric: 0,
    };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let centroidX = 0;
  let centroidY = 0;
  for (const tile of allTiles) {
    minX = Math.min(minX, tile.x);
    minY = Math.min(minY, tile.y);
    maxX = Math.max(maxX, tile.x);
    maxY = Math.max(maxY, tile.y);
    centroidX += tile.x;
    centroidY += tile.y;
  }
  centroidX /= allTiles.length;
  centroidY /= allTiles.length;

  let avgRadius = 0;
  let maxRadius = 0;
  for (const tile of allTiles) {
    const radius = Math.hypot(tile.x - centroidX, tile.y - centroidY);
    avgRadius += radius;
    if (radius > maxRadius) maxRadius = radius;
  }
  avgRadius = allTiles.length ? avgRadius / allTiles.length : 0;

  let diameter = 0;
  for (let i = 0; i < allTiles.length; i += 1) {
    for (let j = i + 1; j < allTiles.length; j += 1) {
      diameter = Math.max(diameter, Math.hypot(allTiles[i].x - allTiles[j].x, allTiles[i].y - allTiles[j].y));
    }
  }

  const degrees = [];
  const contactFaceTotals = [];
  for (const tile of allTiles) {
    let degree = 0;
    let contactFaces = 0;
    for (const other of allTiles) {
      if (other === tile) continue;
      const contactCount = countSideContacts(tile, other);
      if (contactCount > 0) {
        degree += 1;
        contactFaces += contactCount;
      }
    }
    degrees.push(degree);
    contactFaceTotals.push(contactFaces);
  }
  const leafCount = degrees.filter((degree) => degree === 1).length;
  const junctionCount = degrees.filter((degree) => degree >= 3).length;
  const denseTileCount = contactFaceTotals.filter((count) => count >= 4).length;
  const crowdedHubCount = contactFaceTotals.filter((count, idx) => count >= 4 && degrees[idx] >= 3).length;
  const averageContactFaces = contactFaceTotals.reduce((sum, count) => sum + count, 0) / Math.max(contactFaceTotals.length, 1);
  const maxDegree = degrees.length ? Math.max(...degrees) : 0;
  const dominantHubDegreeThreshold = Math.max(3, allTiles.length - 3);
  const dominantHubDegreeMetric = clamp((maxDegree - dominantHubDegreeThreshold + 1) / 3, 0, 1);
  const starLeafMetric = clamp((leafCount - 3) / 3, 0, 1);
  const dominantHubMetric = clamp(
    dominantHubDegreeMetric * 0.72 + starLeafMetric * 0.52 + (crowdedHubCount > 0 ? 0.18 : 0),
    0,
    1,
  );
  const fullStarHubMetric = allTiles.length >= 4 && maxDegree >= allTiles.length - 1 ? 1 : 0;

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const aspectRatio = Math.max(width, height) / Math.max(1, Math.min(width, height));
  const boardHexLayout = getBoardHexLayout();
  const spacingUnit = Math.max(boardHexLayout.dx, 1);
  const elongationMetric = clamp((aspectRatio - 1) / 2.6, 0, 1);
  const avgRadiusMetric = clamp(avgRadius / (spacingUnit * 2.45), 0, 1);
  const diameterMetric = clamp(diameter / (spacingUnit * 6.1), 0, 1);
  const extraLeavesMetric = clamp((leafCount - 2) / 4, 0, 1);
  const junctionMetric = clamp(junctionCount / 2, 0, 1);
  const denseTileMetric = clamp(denseTileCount / Math.max(2, allTiles.length * 0.45), 0, 1);
  const crowdedHubMetric = clamp(crowdedHubCount / 2, 0, 1);
  const contactDensityMetric = clamp((averageContactFaces - 2.35) / 1.75, 0, 1);
  const spreadMetric = clamp(avgRadiusMetric * 0.55 + diameterMetric * 0.25 + elongationMetric * 0.35, 0, 1);
  const hubinessMetric = clamp(crowdedHubMetric * 0.72 + denseTileMetric * 0.34 + contactDensityMetric * 0.28, 0, 1);
  const leafinessMetric = clamp(extraLeavesMetric * 0.7 + junctionMetric * 0.2, 0, 1);
  const branchMetric = clamp(junctionMetric * 0.34 + extraLeavesMetric * 0.76 - hubinessMetric * 0.28, 0, 1);
  const compactnessMetric = clamp((Math.min(width, height) / Math.max(width, height)) * 0.7 + (1 - spreadMetric) * 0.3, 0, 1);
  const corridorMetric = clamp(elongationMetric * 0.6 + diameterMetric * 0.25 + Math.max(0, 2 - junctionCount) * 0.12, 0, 1);
  const clusterMetric = clamp(denseTileMetric * 0.56 + crowdedHubMetric * 0.58 + contactDensityMetric * 0.34, 0, 1);

  return {
    width,
    height,
    aspectRatio,
    leafCount,
    junctionCount,
    spreadMetric,
    branchMetric,
    compactnessMetric,
    corridorMetric,
    clusterMetric,
    hubinessMetric,
    leafinessMetric,
    denseTileCount,
    crowdedHubCount,
    averageContactFaces,
    maxDegree,
    dominantHubMetric,
    fullStarHubMetric,
    avgRadius,
    maxRadius,
    diameter,
  };
}

function scoreAutoBuildCompletedLayout(candidate, tuning = autoBuildDevTuning, searchProfile = getAutoBuildSearchProfile(tuning)) {
  const metrics = candidate.metrics || analyzeAutoBuildCompletedLayout([], null);
  const spreadBias = clamp(tuning.layoutSpread, 0, 1);
  const branchBias = clamp(tuning.branchiness, 0, 1);
  const desiredSpread = 0.2 + spreadBias * 0.72;
  const desiredBranch = 0.1 + branchBias * 0.82;
  const spreadFit = 1 - Math.abs(metrics.spreadMetric - desiredSpread);
  const branchFit = 1 - Math.abs(metrics.branchMetric - desiredBranch);
  const baselineMetric = 0.6 * (1 - metrics.clusterMetric) + 0.25 * metrics.compactnessMetric + 0.15 * (1 - Math.abs(metrics.spreadMetric - 0.42));
  const corridorBonus = spreadBias * metrics.corridorMetric * 0.9;
  const branchBonus = branchBias * (metrics.branchMetric * 0.55 + metrics.leafinessMetric * 0.32);
  const clusterPenalty = metrics.clusterMetric * (0.85 + spreadBias * 0.55 + branchBias * 0.95);
  const hubPenalty = metrics.hubinessMetric * (0.35 + branchBias * 0.9);
  const dominantHubPenalty = metrics.dominantHubMetric * (1.7 + spreadBias * 0.65 + (1 - branchBias) * 0.95);
  const fullStarHubPenalty = metrics.fullStarHubMetric * (1.9 + spreadBias * 0.35 + branchBias * 0.55);
  const noveltyPenalty = candidate.isRecentShape ? searchProfile.recentShapePenalty : 0;
  return (
    spreadFit * 2.55
    + branchFit * 2.3
    + baselineMetric * 1.15
    + corridorBonus
    + branchBonus
    - clusterPenalty
    - hubPenalty
    - dominantHubPenalty
    - fullStarHubPenalty
    - noveltyPenalty
  );
}

function chooseAutoBuildCompletedLayout(candidates, tuning = autoBuildDevTuning) {
  if (!Array.isArray(candidates) || !candidates.length) return null;
  const searchProfile = getAutoBuildSearchProfile(tuning);
  const ranked = candidates
    .map((candidate) => ({
      ...candidate,
      finalScore: scoreAutoBuildCompletedLayout(candidate, tuning, searchProfile),
    }))
    .sort((a, b) => (
      (b.finalScore - a.finalScore)
      || ((b.placementScoreTotal || 0) - (a.placementScoreTotal || 0))
      || (a.isRecentShape - b.isRecentShape)
    ));
  if (ranked.length === 1 || searchProfile.finalChoicePoolSize <= 1) {
    return ranked[0];
  }
  const bestScore = ranked[0].finalScore;
  const eligible = ranked.filter((candidate, idx) => (
    idx < searchProfile.finalChoicePoolSize
    || candidate.finalScore >= bestScore - (0.16 + clamp(tuning.variety, 0, 1) * 0.45)
  ));
  const choicePool = eligible.slice(0, Math.max(1, searchProfile.finalChoicePoolSize));
  return choicePool[Math.floor(Math.random() * choicePool.length)];
}

function getTileInstanceKey(tile) {
  if (!tile) return "";
  if (tile.tileSetId) return buildTileKey(tile.tileSetId, tile.tileId);
  return String(tile.tileId || "");
}

async function loadAutoBuildTileRecord(def) {
  const img = await loadImage(def.imageSrc);
  const shape = getOpaqueBounds(img);
  const alphaMask = getAlphaMask(img);
  const faceGeometry = getFaceGeometry(img, SIDES);
  return {
    ...def,
    img,
    x: 0,
    y: 0,
    rotation: 0,
    placed: false,
    previewOnly: true,
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
    wallFaceSet: new Set(getStoredWallFaces(def.tileSetId, def.tileId)),
    allowAsEndTile: getStoredAllowAsEndTile(def.tileSetId, def.tileId),
    portalFlag: getStoredPortalFlag(def.tileSetId, def.tileId),
  };
}

function renderAutoBuildPreview(entranceTile, regularTiles) {
  clearBoard({ preserveEntranceFadeAnchor: true });

  const entranceEl = createTileElement(entranceTile);
  entranceTile.dom = entranceEl;
  entranceTile.placed = true;
  positionTile(entranceTile, entranceTile.x, entranceTile.y);
  updateTileParent(entranceTile, board);
  updateTileTransform(entranceTile);
  setEntranceFadeAnchorFromTile(entranceTile);
  placeReferenceAboveStart(entranceTile);
  centerBoardViewOnEntranceX();
  scheduleBoardHexGridRender();

  for (const tile of regularTiles) {
    const tileEl = createTileElement(tile);
    tile.dom = tileEl;
    tile.placed = true;
    positionTile(tile, tile.x, tile.y);
    updateTileParent(tile, board);
    updateTileTransform(tile);
  }

  selectTile(null);
  state.autoBuildPreviewPlacedCount = regularTiles.length;
  updatePlacedProgress();
}

function startRound() {
  if (state.wallEditMode) {
    startWallEditSession();
    return;
  }
  clearBoard({ preserveEntranceFadeAnchor: true });

  const slotOrder = shuffle(
    state.tileDefs.filter((tileDef) => !tileDef.required).map((tileDef) => tileDef.tileId),
  );
  setRegularTileOrder(slotOrder, state.selectedTileSetId);

  for (const tile of state.tiles.values()) {
    tile.placed = false;
    tile.rotation = 0;
  }
  syncRegularTileActivityFromSlotOrder(state.selectedTileSetId);

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

  const currentOrder = [...getRegularTileOrder(state.selectedTileSetId)];
  const unplacedIds = currentOrder.filter((tileId) => !state.tiles.get(tileId)?.placed);
  const shuffledUnplaced = shuffle(unplacedIds);
  const nextOrder = [...currentOrder];
  let nextUnplacedIndex = 0;
  for (let i = 0; i < nextOrder.length; i += 1) {
    const tile = state.tiles.get(nextOrder[i]);
    if (tile?.placed) continue;
    nextOrder[i] = shuffledUnplaced[nextUnplacedIndex];
    nextUnplacedIndex += 1;
  }
  setRegularTileOrder(nextOrder, state.selectedTileSetId);

  for (const tile of state.tiles.values()) {
    if (tile.required) continue;
    clearInvalidReturnTimer(tile);
    if (tile.placed) continue;
    tile.placed = false;
    tile.rotation = 0;
  }

  rerenderTrayAndReserve();
  setStatus("Tray tiles rerolled. Grid placements kept.");
}

function runAutoBuild() {
  state.autoBuildPreviewPlacedCount = null;
  return autoBuildSelectedTiles();
}

async function autoBuildSelectedTiles(options = {}) {
  const showStatus = options.showStatus !== false;
  const spawnBoss = options.spawnBoss !== false;

  if (state.wallEditMode) {
    if (showStatus) setStatus("Auto Build is unavailable in Tile Editor.", true);
    return { built: false, reason: "wall_edit_mode" };
  }

  const tuning = options.tuning || autoBuildDevTuning;
  const searchProfile = getAutoBuildSearchProfile(tuning);
  const softCandidateLimit = AUTO_BUILD_CANDIDATE_SOFT_LIMIT;

  const allRegularTiles = Array.from(state.tiles.values()).filter((tile) => !isEntranceTile(tile));
  if (allRegularTiles.length < 6) {
    if (showStatus) setStatus("Not enough tiles available for auto build.", true);
    return { built: false, reason: "not_enough_tiles" };
  }

  const selectedAutoBuildIds = new Set(
    shuffle(allRegularTiles.map((tile) => tile.tileId)).slice(0, 6),
  );
  const remainingAutoBuildIds = shuffle(
    allRegularTiles
      .map((tile) => tile.tileId)
      .filter((tileId) => !selectedAutoBuildIds.has(tileId)),
  );
  setRegularTileOrder(
    [...selectedAutoBuildIds, ...remainingAutoBuildIds],
    state.selectedTileSetId,
  );
  for (const tile of allRegularTiles) {
    clearInvalidReturnTimer(tile);
    tile.placed = false;
    tile.rotation = 0;
  }
  syncRegularTileActivityFromSlotOrder(state.selectedTileSetId);
  clearBoard({ preserveEntranceFadeAnchor: true });
  renderActiveTiles();
  placeStartTileAtCenter();
  updatePlacedProgress();

  const entrance = state.tiles.get(ENTRANCE_TILE_ID);
  if (!entrance) {
    if (showStatus) setStatus("Entrance tile is unavailable.", true);
    return { built: false, reason: "missing_entrance" };
  }
  if (!entrance.placed) {
    placeStartTileAtCenter();
  }

  const activeRegularTiles = getRegularTileOrder(state.selectedTileSetId)
    .slice(0, TRAY_SLOT_COUNT)
    .map((tileId) => state.tiles.get(tileId))
    .filter(Boolean);
  if (!activeRegularTiles.length) {
    if (showStatus) setStatus("No selected tiles available for auto build.", true);
    return { built: false, reason: "no_selected_tiles" };
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

  const placementEvalCache = new Map();

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
    const enforcePortal = options?.enforcePortalSpacing ? 1 : 0;
    const key = `${placedSignature}|${tile.tileId}|${tile.rotation}|${roundForCache(x)},${roundForCache(y)}|e:${enforceEnd}|p:${enforcePortal}`;
    const cached = placementEvalCache.get(key);
    if (cached) return cached;
    const result = evaluatePlacementAt(tile, placedTiles, x, y, options);
    placementEvalCache.set(key, result);
    return result;
  };

  const getRotationOptions = () => shuffle(
    Array.from({ length: 360 / ROTATION_STEP }, (_, idx) => idx * ROTATION_STEP),
  );

  const getPlacementCandidates = (tile, placedTiles, placedSignature, options = {}) => {
    const placementOptions = {
      enforceEndTileRule: true,
      enforcePortalSpacing: Boolean(options.enforcePortalSpacing),
    };
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
        placementOptions,
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
    const tileDirs = getSideDirections(tile);
    const tileDirOrder = shuffle(Array.from({ length: tileDirs.length }, (_, idx) => idx));
    primaryCandidateLoop:
    for (const anchorTile of anchors) {
      const anchorDirs = getSideDirections(anchorTile);
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
              ...placementOptions,
              evalFn: (cx, cy) => evaluatePlacementAtCached(
                tile,
                placedTiles,
                cx,
                cy,
                placementOptions,
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
    if (candidates.length < softCandidateLimit) {
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
          if (candidates.length >= softCandidateLimit) break ringCandidateLoop;
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

    const rankedCandidates = shuffle(candidates).slice(0, AUTO_BUILD_CANDIDATE_SOFT_LIMIT);
    if (!rankedCandidates.length) return rankedCandidates;

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
    const targetRadius = Math.max(
      layout.dx * searchProfile.targetRadiusBaseMultiplier,
      avgPlacedRadius + layout.dx * searchProfile.targetRadiusAvgBonusMultiplier,
    );
    const targetMinRadius = Math.max(layout.dx * 0.95, targetRadius * searchProfile.targetMinRadiusMultiplier);
    const targetMaxRadius = targetRadius * searchProfile.targetMaxRadiusMultiplier;

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
    const localDensityRadius = layout.dx * searchProfile.localDensityRadiusMultiplier;

    for (const candidate of rankedCandidates) {
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
            lineExtensionPenalty = (dot - 0.86) / (1 - 0.86) * searchProfile.lineExtensionPenalty;
          }
        }
      }
      let localNeighborCount = 0;
      for (const placed of placedTiles) {
        const d = Math.hypot(candidate.x - placed.x, candidate.y - placed.y);
        if (d <= localDensityRadius) localNeighborCount += 1;
      }
      const localDensityPenalty = Math.max(0, localNeighborCount - 2) * searchProfile.localDensityPenalty;

      candidate.layoutScore =
        roundness * searchProfile.roundnessWeight
        + candidate.count * searchProfile.contactWeight
        + clearance.minFaceDist * searchProfile.minFaceDistWeight
        + clearance.minCenterDist * searchProfile.minCenterDistWeight
        + clearance.avgCenterDist * searchProfile.avgCenterDistWeight
        - radialPenalty * searchProfile.radialPenaltyWeight
        - nearCenterPenalty * searchProfile.nearCenterPenaltyWeight
        - farOutPenalty * searchProfile.farOutPenaltyWeight
        - lineExtensionPenalty
        - localDensityPenalty;
    }

    rankedCandidates.sort(
      (a, b) => (b.layoutScore - a.layoutScore) || (b.count - a.count),
    );
    return rankedCandidates;
  };

  const tryBuildLayout = (options = {}) => {
    placementEvalCache.clear();
    for (const tile of activeRegularTiles) {
      clearInvalidReturnTimer(tile);
      tile.placed = false;
    }

    const tileOrder = shuffle([...activeRegularTiles]);
    const placedTiles = [entrance];

    const placeAtIndex = (index, placementScoreTotal) => {
      if (index >= tileOrder.length) return { placementScoreTotal };
      const tile = tileOrder[index];
      const prevX = tile.x;
      const prevY = tile.y;
      const prevRotation = tile.rotation;
      const prevPlaced = tile.placed;
      const placedSignature = buildPlacedSignature(placedTiles);

      for (const rotation of getRotationOptions()) {
        tile.rotation = normalizeAngle(rotation);
        const candidates = getPlacementCandidates(tile, placedTiles, placedSignature, options);
        if (!candidates.length) continue;

        const bestScore = candidates[0].layoutScore;
        const scoreFloor = bestScore - searchProfile.topBucketScoreDelta;
        const topBucket = [];
        const remainder = [];
        for (let i = 0; i < candidates.length; i += 1) {
          const candidate = candidates[i];
          if (i < searchProfile.topBucketSize || candidate.layoutScore >= scoreFloor) {
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
          const result = placeAtIndex(index + 1, placementScoreTotal + candidate.layoutScore);
          if (result) return result;
          placedTiles.pop();
          tile.placed = false;
        }
      }

      tile.rotation = prevRotation;
      tile.placed = prevPlaced;
      positionTile(tile, prevX, prevY);
      return null;
    };

    return placeAtIndex(0, 0);
  };

  const collectCompletedLayouts = (options = {}) => {
    const completedLayouts = [];
    const seenCompletedSignatures = new Set();
    const searchDeadline = performance.now() + searchProfile.completionTimeBudgetMs;
    const maxCompletionAttempts = Math.min(AUTO_BUILD_MAX_ATTEMPTS, searchProfile.maxCompletionAttempts);
    for (let attempt = 0; attempt < maxCompletionAttempts; attempt += 1) {
      const buildResult = tryBuildLayout(options);
      if (buildResult) {
        const signature = getAutoBuildLayoutSignature(activeRegularTiles, entrance);
        if (seenCompletedSignatures.has(signature)) continue;
        seenCompletedSignatures.add(signature);
        completedLayouts.push({
          signature,
          isRecentShape: recentShapeHistory.includes(signature),
          placementScoreTotal: buildResult.placementScoreTotal,
          metrics: analyzeAutoBuildCompletedLayout(activeRegularTiles, entrance),
          tileState: captureAutoBuildCandidateState(activeRegularTiles),
        });
        if (completedLayouts.length >= searchProfile.targetCompletedLayouts) break;
        if (
          completedLayouts.length >= searchProfile.minCompletedLayouts
          && performance.now() >= searchDeadline
        ) {
          break;
        }
      }
      if (
        completedLayouts.length >= searchProfile.minCompletedLayouts
        && performance.now() >= searchDeadline
      ) {
        break;
      }
    }
    return completedLayouts;
  };

  const hasPortalTiles = activeRegularTiles.some((tile) => hasPortalFlag(tile));
  let portalSpacingRelaxed = false;
  let completedLayouts = collectCompletedLayouts({ enforcePortalSpacing: hasPortalTiles });
  let chosenLayout = chooseAutoBuildCompletedLayout(completedLayouts, tuning);
  if (!chosenLayout && hasPortalTiles) {
    completedLayouts = collectCompletedLayouts({ enforcePortalSpacing: false });
    chosenLayout = chooseAutoBuildCompletedLayout(completedLayouts, tuning);
    portalSpacingRelaxed = Boolean(chosenLayout);
  }
  if (!chosenLayout) {
    restoreOriginalState();
    if (showStatus) {
      setStatus("Auto build could not find a valid full layout. Try rerolling tiles and run again.", true);
    }
    return { built: false, reason: "no_valid_layout" };
  }
  const chosenSignature = chosenLayout.signature;
  applyAutoBuildCandidateState(activeRegularTiles, chosenLayout.tileState);

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
  if (showStatus) {
    const statusParts = ["Auto build complete: selected tiles placed with valid contact rules"];
    if (movedReferenceSide) statusParts.push("Reference card moved to side for visibility");
    if (portalSpacingRelaxed) statusParts.push("Portal spacing was relaxed to finish the layout");
    setStatus(`${statusParts.join(". ")}.`);
  }
  if (spawnBoss) {
    spawnRandomBossAtReferenceTopMagnet({
      showStatus: false,
      silentNoReference: true,
      silentNoBoss: true,
    });
  }
  return {
    built: true,
    chosenSignature,
    candidateCount: completedLayouts.length,
    movedReferenceSide,
  };
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
  for (const tile of state.tiles.values()) {
    if (tile.required) continue;
    tile.placed = false;
    tile.rotation = 0;
  }
  syncRegularTileActivityFromSlotOrder(state.selectedTileSetId);
  applyBoardZoom(DEFAULT_BOARD_ZOOM);
  resetBoardPan();
  clearBoard({ preserveEntranceFadeAnchor: true });
  renderActiveTiles();
  renderBossPile();
  placeStartTileAtCenter();
  setStatus("Tiles reset to tray.");
  updatePlacedProgress();
}

function resetTilesAndBossCards() {
  resetTilesAndBossCardsBM(getBossManagementCtx());
}

function clearBoard(options = {}) {
  const preserveEntranceFadeAnchor = Boolean(options?.preserveEntranceFadeAnchor);
  for (const tile of state.tiles.values()) {
    clearInvalidReturnTimer(tile);
  }
  board.querySelector(".board-content")?.remove();
  boardContentLayer = null;
  boardHexSvg = null;
  boardHexGroup = null;
  boardHexLastRenderKey = "";
  boardHexPathPool.length = 0;
  state.referenceMarker = null;
  state.bossTokens = [];
  if (!preserveEntranceFadeAnchor) {
    state.entranceFadeAnchor = null;
  }
  state.autoBuildPreviewPlacedCount = null;
  state.renderedTraySlots = [];
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
  if (boardContentLayer?.isConnected && boardContentLayer.parentElement === board) {
    return boardContentLayer;
  }
  const existing = board.querySelector(".board-content");
  if (existing) {
    boardContentLayer = existing;
    return existing;
  }
  const layer = document.createElement("div");
  layer.className = "board-content";
  board.appendChild(layer);
  boardContentLayer = layer;
  return layer;
}

function mountBoardHexGrid() {
  const layer = getBoardContentLayer();
  const svg = document.createElementNS(BOARD_HEX_SVG_NS, "svg");
  svg.classList.add("board-hex-grid");
  svg.setAttribute("aria-hidden", "true");
  const group = document.createElementNS(BOARD_HEX_SVG_NS, "g");
  svg.appendChild(group);
  layer.appendChild(svg);
  boardHexSvg = svg;
  boardHexGroup = group;
  boardHexLastRenderKey = "";
  renderBoardHexGrid();
}

function scheduleBoardHexGridRender() {
  if (boardHexRenderRaf) return;
  boardHexRenderRaf = requestAnimationFrame(renderBoardHexGrid);
}

function getBoardHexThemeMetrics() {
  const cacheKey = state.selectedUiThemeId;
  if (boardHexThemeCache?.key === cacheKey) {
    return boardHexThemeCache.value;
  }

  const cssVars = getComputedStyle(document.body);
  const value = computeBoardHexThemeMetrics(cssVars, {
    isDarkTheme: isDarkUiTheme(state.selectedUiThemeId),
  });
  boardHexThemeCache = { key: cacheKey, value };
  return value;
}

function renderBoardHexGrid() {
  boardHexRenderRaf = 0;
  const svg = boardHexSvg?.isConnected ? boardHexSvg : getBoardContentLayer().querySelector(".board-hex-grid");
  if (!svg) return;
  boardHexSvg = svg;
  const group = boardHexGroup?.isConnected
    ? boardHexGroup
    : svg.querySelector("g") || (() => {
      const nextGroup = document.createElementNS(BOARD_HEX_SVG_NS, "g");
      svg.appendChild(nextGroup);
      return nextGroup;
    })();
  boardHexGroup = group;

  const w = Math.floor(board.clientWidth);
  const h = Math.floor(board.clientHeight);
  if (w <= 0 || h <= 0) return;
  const zoom = getBoardZoom();
  const drawW = w;
  const drawH = h;
  const visibleWorldW = w / zoom;
  const visibleWorldH = h / zoom;
  const layout = getBoardHexLayout(w, h);
  const panX = state.boardPanX;
  const panY = state.boardPanY;

  svg.style.width = `${drawW}px`;
  svg.style.height = `${drawH}px`;
  svg.style.transformOrigin = "0 0";
  svg.style.transform = "none";
  svg.setAttribute("viewBox", `0 0 ${drawW} ${drawH}`);

  const {
    isDarkTheme,
    strokeColor,
    darkestTargetHexes,
    lightRgb,
    darkEndpoint,
  } = getBoardHexThemeMetrics();
  const fadeAnchor = state.entranceFadeAnchor;
  const hasEntranceAnchor = Boolean(
    fadeAnchor
      && Number.isFinite(fadeAnchor.x)
      && Number.isFinite(fadeAnchor.y),
  );
  const entranceTile = state.tiles.get(ENTRANCE_TILE_ID);
  const entranceRotation = hasEntranceAnchor && entranceTile
    ? normalizeAngle(entranceTile.rotation || 0)
    : 0;
  const renderKey = [
    drawW,
    drawH,
    zoom.toFixed(4),
    panX.toFixed(3),
    panY.toFixed(3),
    state.selectedUiThemeId,
    hasEntranceAnchor ? "1" : "0",
    hasEntranceAnchor ? fadeAnchor.x.toFixed(3) : "0",
    hasEntranceAnchor ? fadeAnchor.y.toFixed(3) : "0",
    entranceRotation.toFixed(3),
  ].join("|");
  if (renderKey === boardHexLastRenderKey) return;
  boardHexLastRenderKey = renderKey;
  const entranceRotationRad = (entranceRotation * Math.PI) / 180;
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
  const darkestTargetDist = Math.max(layout.dx * darkestTargetHexes, layout.radius * darkestTargetHexes);

  group.setAttribute("stroke", strokeColor);
  group.setAttribute("stroke-width", "1");
  group.setAttribute("vector-effect", "non-scaling-stroke");

  const colStart = Math.floor((0 - panX - layout.minX) / layout.dx) - 2;
  const colEnd = Math.ceil((visibleWorldW - panX - layout.minX) / layout.dx) + 2;
  let pathIndex = 0;

  for (let col = colStart; col <= colEnd; col += 1) {
    const xBase = layout.minX + col * layout.dx;
    const x = xBase + panX;
    const yOffset = ((col % 2) + 2) % 2 ? (layout.hexHeight / 2) : 0;
    const rowStart = Math.floor((0 - panY - (layout.minY + yOffset)) / layout.dy) - 2;
    const rowEnd = Math.ceil((visibleWorldH - panY - (layout.minY + yOffset)) / layout.dy) + 2;
    for (let row = rowStart; row <= rowEnd; row += 1) {
      const yBase = layout.minY + yOffset + row * layout.dy;
      const y = yBase + panY;
      const screenX = x * zoom;
      const screenY = y * zoom;
      const screenRadius = layout.radius * zoom;
      const screenHexHeight = layout.hexHeight * zoom;
      if (screenX < -screenRadius || screenX > drawW + screenRadius) continue;
      if (screenY < -screenHexHeight || screenY > drawH + screenHexHeight) continue;
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
      let path = boardHexPathPool[pathIndex];
      if (!path) {
        path = document.createElementNS(BOARD_HEX_SVG_NS, "path");
        boardHexPathPool.push(path);
        group.appendChild(path);
      } else if (path.parentNode !== group) {
        group.appendChild(path);
      }
      path.removeAttribute("display");
      path.setAttribute("d", hexPath(screenX, screenY, screenRadius, SQRT_3));
      path.setAttribute("fill", `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`);
      pathIndex += 1;
    }
  }

  for (let i = pathIndex; i < boardHexPathPool.length; i += 1) {
    boardHexPathPool[i].setAttribute("display", "none");
  }
}

function getBoardHexLayout(width = Math.floor(board.clientWidth), height = Math.floor(board.clientHeight)) {
  const targetWidth = Math.max(0, Math.floor(width));
  const targetHeight = Math.max(0, Math.floor(height));
  if (boardHexLayoutCache?.w === targetWidth && boardHexLayoutCache?.h === targetHeight) {
    return boardHexLayoutCache.layout;
  }
  const { w, h, layout } = createBoardHexLayout({
    width: targetWidth,
    height: targetHeight,
    boardScale: BOARD_SCALE,
    boardItemScale: BOARD_ITEM_SCALE,
    sqrt3: SQRT_3,
  });
  boardHexLayoutCache = { w, h, layout };
  return layout;
}

function snapBoardPointToHex(x, y) {
  return snapBoardPointToHexValue(x, y, {
    layout: getBoardHexLayout(),
    panX: state.boardPanX,
    panY: state.boardPanY,
    quantizeSnapCoord,
  });
}

function createHexGuideElement({ size = 150, centers = [], radius = 28, className = "tray-slot-guide" } = {}) {
  const svg = document.createElementNS(BOARD_HEX_SVG_NS, "svg");
  for (const token of String(className || "").split(/\s+/).filter(Boolean)) {
    svg.classList.add(token);
  }
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  svg.setAttribute("aria-hidden", "true");
  for (const [cx, cy] of centers) {
    const path = document.createElementNS(BOARD_HEX_SVG_NS, "path");
    path.setAttribute("d", hexPath(cx, cy, radius, SQRT_3));
    svg.appendChild(path);
  }
  return svg;
}

function createHexClusterGuideElement({ size = 150, radius = 28, className = "tray-slot-guide" } = {}) {
  const center = size / 2;
  const halfH = (SQRT_3 * radius) / 2;
  const dy = SQRT_3 * radius;
  return createHexGuideElement({
    size,
    radius,
    className,
    centers: [
      [center, center],
      [center + 1.5 * radius, center + halfH],
      [center + 1.5 * radius, center - halfH],
      [center, center + dy],
      [center, center - dy],
      [center - 1.5 * radius, center + halfH],
      [center - 1.5 * radius, center - halfH],
    ],
  });
}

function createTraySlotGuideElement() {
  return createHexClusterGuideElement({ size: 150, radius: 28, className: "tray-slot-guide" });
}

function createTraySlotElement() {
  const slot = document.createElement("div");
  slot.className = "tray-slot";
  slot.appendChild(createTraySlotGuideElement());
  return slot;
}

function getCanonicalRegularTileOrder(tileSetId = state.selectedTileSetId) {
  return state.tileDefs
    .filter((def) => !def.required && def.tileSetId === tileSetId)
    .map((def) => def.tileId);
}

function normalizeRegularTileOrder(order, tileSetId = state.selectedTileSetId) {
  const canonical = getCanonicalRegularTileOrder(tileSetId);
  const seen = new Set();
  const normalized = [];

  for (const tileId of Array.isArray(order) ? order : []) {
    if (!canonical.includes(tileId)) continue;
    if (seen.has(tileId)) continue;
    seen.add(tileId);
    normalized.push(tileId);
  }
  for (const tileId of canonical) {
    if (seen.has(tileId)) continue;
    seen.add(tileId);
    normalized.push(tileId);
  }
  return normalized.slice(0, REGULAR_TILE_SLOT_COUNT);
}

function deriveLegacyRegularTileOrder(snapshot, tileSetId = state.selectedTileSetId) {
  const canonical = getCanonicalRegularTileOrder(tileSetId);
  const reserveIds = normalizeRegularTileOrder(snapshot?.reserveOrder || [], tileSetId)
    .filter((tileId) => Array.isArray(snapshot?.reserveOrder) && snapshot.reserveOrder.includes(tileId));
  const reserveSet = new Set(reserveIds);
  const activeIds = canonical.filter((tileId) => {
    if (reserveSet.has(tileId)) return false;
    const saved = (snapshot?.tiles || []).find((tile) => (tile?.tileId || tile?.id) === tileId);
    return Boolean(saved?.active) || Boolean(saved?.placed);
  });
  const ordered = [...activeIds, ...reserveIds];
  return normalizeRegularTileOrder(ordered, tileSetId);
}

function ensureRegularTileOrder(tileSetId = state.selectedTileSetId) {
  state.regularTileOrder = normalizeRegularTileOrder(state.regularTileOrder, tileSetId);
  return state.regularTileOrder;
}

function isTraySlotIndex(slotIndex) {
  return Number.isInteger(slotIndex) && slotIndex >= 0 && slotIndex < TRAY_SLOT_COUNT;
}

function getRegularTileOrder(tileSetId = state.selectedTileSetId) {
  return ensureRegularTileOrder(tileSetId);
}

function getCompactTrayOrder(tileSetId = state.selectedTileSetId) {
  return getRegularTileOrder(tileSetId);
}

function getReserveTileOrder(tileSetId = state.selectedTileSetId) {
  return getRegularTileOrder(tileSetId).slice(TRAY_SLOT_COUNT);
}

function getRegularTileSlotIndex(tileId, tileSetId = state.selectedTileSetId) {
  return getRegularTileOrder(tileSetId).indexOf(tileId);
}

function setRegularTileOrder(order, tileSetId = state.selectedTileSetId) {
  state.regularTileOrder = normalizeRegularTileOrder(order, tileSetId);
  syncRegularTileActivityFromSlotOrder(tileSetId);
  return state.regularTileOrder;
}

function syncRegularTileActivityFromSlotOrder(tileSetId = state.selectedTileSetId) {
  const indexById = new Map(
    getRegularTileOrder(tileSetId).map((tileId, index) => [tileId, index]),
  );
  for (const tile of state.tiles.values()) {
    if (isEntranceTile(tile)) {
      tile.active = true;
      continue;
    }
    if (tile.required) continue;
    const slotIndex = indexById.get(tile.tileId);
    tile.active = Boolean(tile.placed) || isTraySlotIndex(slotIndex);
  }
}

function getRenderedTraySlotByIndex(slotIndex) {
  return state.renderedTraySlots?.[slotIndex] || null;
}

function clearRenderedTileRefs(tile) {
  if (tile.dom?.parentElement) {
    tile.dom.parentElement.removeChild(tile.dom);
  }
  tile.dom = null;
  tile.bodyDom = null;
  tile.guideDom = null;
  tile.traySlot = null;
}

function renderTileIntoTraySlot(tile, slot) {
  if (!tile || !slot) return;
  const tileEl = createTileElement(tile);
  tile.dom = tileEl;
  slot.appendChild(tileEl);
  tile.traySlot = slot;
  positionTileAtTrayCenter(tile);
  updateTileTransform(tile);
}

function getLiveTraySlotForTile(tile) {
  if (tile?.traySlot && tile.traySlot.isConnected && tile.traySlot.parentElement === tray) {
    return tile.traySlot;
  }

  const slotIndex = getRegularTileSlotIndex(tile?.tileId);
  const indexedSlot = getRenderedTraySlotByIndex(slotIndex);
  if (indexedSlot) {
    tile.traySlot = indexedSlot;
    return indexedSlot;
  }

  const newSlot = createTraySlotElement();
  tray.appendChild(newSlot);
  tile.traySlot = newSlot;
  if (Number.isInteger(slotIndex) && slotIndex >= 0) {
    state.renderedTraySlots[slotIndex] = newSlot;
  }
  return newSlot;
}

function placeTileInTray(tile) {
  tile.placed = false;
  syncRegularTileActivityFromSlotOrder();
  clearRenderedTileRefs(tile);

  const slotIndex = getRegularTileSlotIndex(tile.tileId);
  const shouldRenderInTray = state.compactSidePanelMode || isTraySlotIndex(slotIndex);
  if (!shouldRenderInTray) {
    rerenderTrayAndReserve();
    return;
  }

  const slot = getLiveTraySlotForTile(tile);
  if (!slot) {
    rerenderTrayAndReserve();
    return;
  }
  slot.innerHTML = "";
  slot.appendChild(createTraySlotGuideElement());
  renderTileIntoTraySlot(tile, slot);
  if (state.compactSidePanelMode || !isTraySlotIndex(slotIndex)) {
    renderReservePile();
  } else {
    updateReserveSwapHighlights();
    updatePlacedProgress();
  }
}

function renderActiveTiles() {
  for (const tile of state.tiles.values()) {
    if (isEntranceTile(tile)) {
      const tileEl = createTileElement(tile);
      tile.dom = tileEl;
      updateTileParent(tile, board);
      tile.placed = true;
      updateTileTransform(tile);
      continue;
    }

    if (!tile.placed) {
      clearRenderedTileRefs(tile);
      continue;
    }

    const tileEl = createTileElement(tile);
    tile.dom = tileEl;
    updateTileParent(tile, board);
    updateTileTransform(tile);
  }

  syncRegularTileActivityFromSlotOrder();
  rerenderTrayAndReserve();
}

function rerenderTrayAndReserve() {
  syncRegularTileActivityFromSlotOrder();
  tray.innerHTML = "";
  reservePile.innerHTML = "";
  state.renderedTraySlots = [];
  state.hoveredTileId = null;
  selectTile(null);
  clearPendingReserveSwap();

  for (const tile of state.tiles.values()) {
    if (tile.required || tile.placed) continue;
    clearRenderedTileRefs(tile);
  }

  const visibleOrder = state.compactSidePanelMode
    ? getCompactTrayOrder(state.selectedTileSetId)
    : getRegularTileOrder(state.selectedTileSetId).slice(0, TRAY_SLOT_COUNT);
  const trayFragment = document.createDocumentFragment();
  for (let i = 0; i < visibleOrder.length; i += 1) {
    const slot = createTraySlotElement();
    slot.dataset.slotIndex = String(i);
    state.renderedTraySlots[i] = slot;
    trayFragment.appendChild(slot);
  }
  tray.appendChild(trayFragment);

  for (let i = 0; i < visibleOrder.length; i += 1) {
    const tile = state.tiles.get(visibleOrder[i]);
    const slot = state.renderedTraySlots[i];
    if (!slot || !tile || tile.placed) continue;
    renderTileIntoTraySlot(tile, slot);
  }

  renderReservePile();
}

function getBossTileSources(tileSetId = state.selectedTileSetId) {
  return getBossTileSourcesBM(getBossManagementCtx(), tileSetId);
}

function ensureBossPileOrder(tileSetId = state.selectedTileSetId) {
  return ensureBossPileOrderBM(getBossManagementCtx(), tileSetId);
}

function rotateBossPileTop(tileSetId = state.selectedTileSetId) {
  rotateBossPileTopBM(getBossManagementCtx(), tileSetId);
}

function pushBossBackToPile(bossKey, tileSetId = state.selectedTileSetId) {
  pushBossBackToPileBM(bossKey, getBossManagementCtx(), tileSetId);
}

function ensureAllBossesPileOrder() {
  return ensureAllBossesPileOrderBM(getBossManagementCtx());
}

function rotateAllBossesPileTop() {
  rotateAllBossesPileTopBM(getBossManagementCtx());
}

function getAvailableBossSources(tileSetId = state.selectedTileSetId) {
  return getAvailableBossSourcesBM(getBossManagementCtx(), tileSetId);
}

function triggerBossRandomizeAnimation(tileSetId = state.selectedTileSetId) {
  triggerBossRandomizeAnimationBM(getBossManagementCtx(), tileSetId);
}

function getTileSetIdForBossSrc(src) {
  return getTileSetIdForBossSrcBM(src, getBossManagementCtx());
}

function removeBossToken(token, { returnToPile = true } = {}) {
  removeBossTokenBM(token, getBossManagementCtx(), { returnToPile });
}

function generateAllBossesOffset(src, z, count) {
  return generateAllBossesOffsetBM(src, z, count, getBossManagementCtx());
}

function renderBossPile() {
  renderBossPileBM(getBossManagementCtx());
}

function setBossEditMode(enabled) {
  setBossEditModeBM(enabled, getBossManagementCtx());
}

function isClickInTopRightCloseHit(event, containerEl) {
  return isClickInTopRightCloseHitBV(event, containerEl);
}

function isPointInsideElement(clientX, clientY, element) {
  return isPointInsideElementBV(clientX, clientY, element);
}

function isPointOverBoardSurface(clientX, clientY, boardRect = board.getBoundingClientRect()) {
  return isPointOverBoardSurfaceBV(clientX, clientY, getBoardViewCtx(), boardRect);
}

function applyDragEdgeAutoPan(clientX, clientY, boardRect, dragPanState) {
  applyDragEdgeAutoPanBV(clientX, clientY, boardRect, dragPanState, getBoardViewCtx());
}

function updateDragEdgeAutoPanState(dragPanState, clientX, clientY, boardRect) {
  updateDragEdgeAutoPanStateBV(dragPanState, clientX, clientY, boardRect, getBoardViewCtx());
}

function stopDragEdgeAutoPan(dragPanState) {
  stopDragEdgeAutoPanBV(dragPanState);
}

function getBossReferenceMagnetBoardPosition(boardX, boardY) {
  return getBossReferenceMagnetBoardPositionBM(boardX, boardY, getBossManagementCtx());
}

function getBossTokenMagnetBoardPosition(boardX, boardY, options = {}) {
  return getBossTokenMagnetBoardPositionBM(boardX, boardY, getBossManagementCtx(), options);
}

function getBossDropMagnetBoardPosition(boardX, boardY, options = {}) {
  return getBossDropMagnetBoardPositionBM(boardX, boardY, getBossManagementCtx(), options);
}

function getBossReferenceTopMagnetBoardPosition() {
  return getBossReferenceTopMagnetBoardPositionBM(getBossManagementCtx());
}

function getBossReferenceTopMagnetBoardPositionForReference(refX, refY) {
  return getBossReferenceTopMagnetBoardPositionForReferenceBM(refX, refY, getBossManagementCtx());
}

function getBossTokenAtReferenceTopMagnet() {
  return getBossTokenAtReferenceTopMagnetBM(getBossManagementCtx());
}

async function spawnRandomBossAtReferenceTopMagnet(options = {}) {
  return spawnRandomBossAtReferenceTopMagnetBM(getBossManagementCtx(), options);
}

function getBoardDropPositionFromPointer(clientX, clientY, boardRect, zoom = getBoardZoom(), options = {}) {
  return getBoardDropPositionFromPointerBM(clientX, clientY, boardRect, getBossManagementCtx(), zoom, options);
}

function beginBossSpawnDrag(event, bossKey, onDragStart = null) {
  beginBossSpawnDragBM(event, bossKey, getBossManagementCtx(), onDragStart);
}

function createBossToken(bossKey, x, y, size = 130) {
  return createBossTokenBM(bossKey, x, y, getBossManagementCtx(), size);
}

function positionBossToken(token, x, y) {
  positionBossTokenBM(token, x, y);
}

function updateBossTokenTransform(token) {
  updateBossTokenTransformBM(token, getBossManagementCtx());
}

function beginBossTokenDrag(token, event) {
  beginBossTokenDragBM(token, event, getBossManagementCtx());
}

function renderReservePile() {
  reservePile.innerHTML = "";
  reservePile.classList.toggle("edit-mode", state.reserveEditMode);
  const inactiveTiles = getInactiveTilesInReserveOrder();
  const fragment = document.createDocumentFragment();

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
    fragment.appendChild(card);
  }

  reservePile.appendChild(fragment);

  updateReserveSwapHighlights();
  updatePlacedProgress();
}

function getInactiveTilesInReserveOrder() {
  return getReserveTileOrder(state.selectedTileSetId)
    .map((tileId) => state.tiles.get(tileId))
    .filter((tile) => tile && !tile.placed);
}

function randomizeCurrentInactiveReserveOrder() {
  const order = [...getRegularTileOrder(state.selectedTileSetId)];
  const reserveStart = TRAY_SLOT_COUNT;
  const reserveSlots = order.slice(reserveStart);
  const placedReserveIds = new Set(
    reserveSlots.filter((tileId) => state.tiles.get(tileId)?.placed),
  );
  const unplacedReserveIds = shuffle(
    reserveSlots.filter((tileId) => !state.tiles.get(tileId)?.placed),
  );
  const nextReserveSlots = reserveSlots.map((tileId) => {
    if (placedReserveIds.has(tileId)) return tileId;
    return unplacedReserveIds.shift();
  });
  setRegularTileOrder(
    [...order.slice(0, reserveStart), ...nextReserveSlots],
    state.selectedTileSetId,
  );
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

function centerBoardViewOnEntranceX(options = {}) {
  centerBoardViewOnEntranceXBV(getBoardViewCtx(), options);
}

function updateReferenceMarkerTransform(reference = state.referenceMarker) {
  if (!reference?.dom) return;
  const zoom = getBoardZoom();
  reference.dom.style.left = `${worldToBoardScreenX(reference.x, zoom)}px`;
  reference.dom.style.top = `${worldToBoardScreenY(reference.y, zoom)}px`;
  reference.dom.style.width = `${TILE_SIZE * BOARD_ITEM_SCALE * zoom}px`;
  reference.dom.style.height = `${TILE_SIZE * BOARD_ITEM_SCALE * zoom}px`;
  reference.dom.style.transform = "translate(-50%, -50%)";
}

function getReferenceTileSrc(tileSetId = state.selectedTileSetId) {
  const tileSet = getTileSetConfig(tileSetId);
  return resolveTileSetAssetPath(tileSet, "reference", tileSet.referenceCardId);
}

function placeReferenceMarkerAt(x, y) {
  if (!state.referenceTileSrc) return null;
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

  state.referenceMarker = {
    dom: marker,
    x: Number(x) || 0,
    y: Number(y) || 0,
  };
  getBoardContentLayer().appendChild(marker);
  updateReferenceMarkerTransform(state.referenceMarker);
  return state.referenceMarker;
}

function placeReferenceAboveStart(startTile) {
  if (!startTile) return null;
  return placeReferenceMarkerAt(startTile.x, startTile.y - REFERENCE_OFFSET_Y);
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
  const defaultClear = !isReferenceStackOverlappedByTiles(defaultX, defaultY, placedRegularTiles);
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
  if (!isReferenceStackOverlappedByTiles(reference.x, reference.y, placedRegularTiles)) {
    return false;
  }

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
  const layout = getBoardHexLayout();
  const ringDirs = [
    { x: layout.dx, y: layout.dy / 2 },
    { x: layout.dx, y: -layout.dy / 2 },
    { x: 0, y: -layout.dy },
    { x: -layout.dx, y: -layout.dy / 2 },
    { x: -layout.dx, y: layout.dy / 2 },
    { x: 0, y: layout.dy },
  ];
  const candidates = [];
  const seenCandidates = new Set();
  const registerCandidate = (x, y) => {
    const snapped = snapBoardPointToHex(
      clamp(x, TILE_SIZE * 0.7, board.clientWidth - TILE_SIZE * 0.7),
      clamp(y, TILE_SIZE * 0.7, board.clientHeight - TILE_SIZE * 0.7),
    );
    const key = `${snapped.x.toFixed(2)}:${snapped.y.toFixed(2)}`;
    if (seenCandidates.has(key)) return;
    seenCandidates.add(key);
    candidates.push(snapped);
  };

  const sideOffsets = [1.7, 2.35, 2.95, 3.45];
  const yOffsets = [0, -0.45, 0.45, -0.9, 0.9].map((multiplier) => TILE_SIZE * multiplier);
  for (const sign of [primarySign, secondarySign]) {
    for (const sideMultiplier of sideOffsets) {
      for (const yOffset of yOffsets) {
        registerCandidate(entranceTile.x + sign * TILE_SIZE * sideMultiplier, baseY + yOffset);
      }
    }
  }

  for (let depth = 2; depth <= 6; depth += 1) {
    for (let dirIdx = 0; dirIdx < ringDirs.length; dirIdx += 1) {
      const dir = ringDirs[dirIdx];
      const next = ringDirs[(dirIdx + 1) % ringDirs.length];
      registerCandidate(entranceTile.x + dir.x * depth, baseY + dir.y * depth);
      for (let t = 1; t < depth; t += 1) {
        registerCandidate(
          entranceTile.x + dir.x * (depth - t) + next.x * t,
          baseY + dir.y * (depth - t) + next.y * t,
        );
      }
    }
  }

  let best = null;
  for (const candidate of candidates) {
    const overlapCount = countReferenceStackOverlaps(candidate.x, candidate.y, placedRegularTiles);
    const distanceFromEntrance = Math.hypot(candidate.x - entranceTile.x, candidate.y - entranceTile.y);
    const horizontalDistance = Math.abs(candidate.x - entranceTile.x);
    const verticalPenalty = Math.abs(candidate.y - baseY) * 0.12;
    const sideBiasPenalty = horizontalDistance < TILE_SIZE * 1.2 ? 180 : 0;
    const score = overlapCount * 100000 + distanceFromEntrance + verticalPenalty + sideBiasPenalty;
    if (!best || score < best.score) {
      best = { x: candidate.x, y: candidate.y, overlapCount, score };
    }
  }
  if (!best) return false;
  if (best.overlapCount > 0) {
    return false;
  }

  reference.x = best.x;
  reference.y = best.y;
  updateReferenceMarkerTransform(reference);
  moveAttachedTopBossToken();
  return true;
}

function isReferenceCardOverlappedByTiles(refX, refY, tiles) {
  return countReferenceCardOverlaps(refX, refY, tiles) > 0;
}

function isReferenceStackOverlappedByTiles(refX, refY, tiles) {
  return countReferenceStackOverlaps(refX, refY, tiles) > 0;
}

function getReferenceCardCollisionPolygon(refX, refY, insetPx = REFERENCE_CARD_COLLISION_INSET_PX) {
  const half = Math.max(1, TILE_SIZE * 0.5 - insetPx + REFERENCE_STACK_CLEARANCE_PAD_PX);
  return [
    { x: refX - half, y: refY - half },
    { x: refX + half, y: refY - half },
    { x: refX + half, y: refY + half },
    { x: refX - half, y: refY + half },
  ];
}

function getTopBossCardCollisionPolygon(refX, refY) {
  return getTopBossCardCollisionPolygonBM(refX, refY, getBossManagementCtx());
}

function countReferenceCardOverlaps(refX, refY, tiles) {
  const refPoly = getReferenceCardCollisionPolygon(refX, refY);
  return countPolygonOverlaps(refPoly, tiles);
}

function countPolygonOverlaps(poly, tiles) {
  return collectPolygonOverlapEntries(poly, tiles).length;
}

function collectPolygonOverlapEntries(poly, tiles) {
  if (!poly?.length) return [];
  const collisions = [];
  const polyBounds = getPolygonBounds(poly);
  for (const tile of tiles || []) {
    if (!tile) continue;
    const tileGeometry = getTilePoseGeometry(tile);
    const tilePoly = tileGeometry.world;
    const tileBounds = getPolygonBounds(tilePoly);
    if (!boundsOverlap(polyBounds, tileBounds)) continue;
    if (polygonsOverlap(poly, tilePoly)) {
      collisions.push({
        tile,
        poly: tilePoly,
      });
    }
  }
  return collisions;
}

function countReferenceStackOverlaps(refX, refY, tiles) {
  const referencePoly = getReferenceCardCollisionPolygon(refX, refY);
  const topBossPoly = getTopBossCardCollisionPolygon(refX, refY);
  let count = countPolygonOverlaps(referencePoly, tiles);
  if (topBossPoly) count += countPolygonOverlaps(topBossPoly, tiles);
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
  const boardTiles = [];
  forEachBoardTile((tile) => {
    boardTiles.push({
      tile,
      x: tile.x,
      y: tile.y,
    });
  });
  const reference = state.referenceMarker?.dom
    ? {
        dom: state.referenceMarker.dom,
        x: state.referenceMarker.x,
        y: state.referenceMarker.y,
      }
    : null;
  const boardBossTokens = [];
  forEachBoardBossToken((token) => {
    boardBossTokens.push({
      token,
      x: token.x,
      y: token.y,
    });
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
  if (tile.previewOnly) tileEl.classList.add("tile-preview-only");
  if (isEntranceTile(tile)) tileEl.classList.add("tile-entrance");
  tileEl.dataset.tileId = tile.tileId;
  if (tile.tileSetId) tileEl.dataset.tileSetId = tile.tileSetId;

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
  tile.bodyDom = body;
  tile.guideDom = guideOverlay;
  syncTilePortalFlag(tile);
  tileEl.appendChild(body);

  if (tile.previewOnly) {
    return tileEl;
  }

  if (!isEntranceTile(tile)) {
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
  }

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
  return Boolean(
    tile
      && !tile.required
      && !tile.placed
      && !isTraySlotIndex(getRegularTileSlotIndex(tile.tileId)),
  );
}

function isTraySwapTarget(tile) {
  if (!tile || tile.required || tile.placed) return false;
  if (!isTraySlotIndex(getRegularTileSlotIndex(tile.tileId))) return false;
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
  if (!isReserveSwapSource(reserveTile) || !isTraySwapTarget(trayTile)) {
    setStatus("Swap unavailable for current selection.", true);
    clearPendingReserveSwap();
    return;
  }

  clearInvalidReturnTimer(reserveTile);
  clearInvalidReturnTimer(trayTile);
  const order = [...getRegularTileOrder(state.selectedTileSetId)];
  const reserveIdx = order.indexOf(reserveTileId);
  const trayIdx = order.indexOf(trayTileId);
  if (reserveIdx < 0 || trayIdx < 0) {
    setStatus("Swap unavailable for current selection.", true);
    clearPendingReserveSwap();
    return;
  }
  [order[reserveIdx], order[trayIdx]] = [order[trayIdx], order[reserveIdx]];
  trayTile.placed = false;
  trayTile.rotation = 0;
  reserveTile.placed = false;
  reserveTile.rotation = 0;
  setRegularTileOrder(order, state.selectedTileSetId);
  rerenderTrayAndReserve();

  if (state.selectedTileId === trayTileId) state.selectedTileId = null;
  if (state.hoveredTileId === trayTileId) state.hoveredTileId = null;
  selectTile(null);
  clearPendingReserveSwap();
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

  if (state.wallEditMode && state.wallEditorPointEditMode && isGuidePointTemplateEditableTile(tile)) {
    const handles = document.createElementNS("http://www.w3.org/2000/svg", "g");
    handles.setAttribute("class", "tile-guide-point-handles");
    for (let i = 0; i < guidePoints.length; i += 1) {
      const point = guidePoints[i];
      const cx = 50 + (point.x / TILE_SIZE) * 100;
      const cy = 50 + (point.y / TILE_SIZE) * 100;
      const handle = document.createElementNS("http://www.w3.org/2000/svg", "g");
      handle.setAttribute("class", "tile-guide-point-handle");
      handle.setAttribute("data-point-index", String(i));

      const hitTarget = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      hitTarget.setAttribute("class", "tile-guide-point-hit");
      hitTarget.setAttribute("cx", cx.toFixed(2));
      hitTarget.setAttribute("cy", cy.toFixed(2));
      hitTarget.setAttribute("r", "6.8");
      handle.appendChild(hitTarget);

      const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      ring.setAttribute("class", "tile-guide-point-ring");
      ring.setAttribute("cx", cx.toFixed(2));
      ring.setAttribute("cy", cy.toFixed(2));
      ring.setAttribute("r", "2.8");
      handle.appendChild(ring);

      const hLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      hLine.setAttribute("class", "tile-guide-point-cross");
      hLine.setAttribute("x1", (cx - 1.6).toFixed(2));
      hLine.setAttribute("y1", cy.toFixed(2));
      hLine.setAttribute("x2", (cx + 1.6).toFixed(2));
      hLine.setAttribute("y2", cy.toFixed(2));
      handle.appendChild(hLine);

      const vLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      vLine.setAttribute("class", "tile-guide-point-cross");
      vLine.setAttribute("x1", cx.toFixed(2));
      vLine.setAttribute("y1", (cy - 1.6).toFixed(2));
      vLine.setAttribute("x2", cx.toFixed(2));
      vLine.setAttribute("y2", (cy + 1.6).toFixed(2));
      handle.appendChild(vLine);

      handle.addEventListener("pointerdown", (event) => beginGuidePointHandleDrag(tile, i, event));
      handles.appendChild(handle);
    }
    svg.appendChild(handles);
  }

  return svg;
}

function getGuideFacePoints(tile) {
  if (!tile) return [];
  const cached = tileGuidePointsCache.get(tile);
  if (cached?.length) return cached;

  const templateType = getGuidePointTemplateType(tile);
  const templateOverride = templateType ? getGuidePointTemplateOverrideRaw(templateType, tile.tileSetId) : null;
  if (templateOverride?.length) {
    const next = cloneGuidePoints(templateOverride);
    tileGuidePointsCache.set(tile, next);
    return next;
  }

  if (shouldUseTemplateGuidePoints(tile, isEntranceTile)) {
    const templatePoints = getTemplateGuidePointsForTile(tile);
    if (templatePoints?.length) {
      tileGuidePointsCache.set(tile, templatePoints);
      return templatePoints;
    }
  }

  const points = tile.faceGeometry.points.map((p) => ({ ...p }));
  let resolved = points;
  if (isEntranceTile(tile)) {
    const templateTile =
      state.tiles.get("tile_01")
      || Array.from(state.tiles.values()).find((t) => !isEntranceTile(t));
    if (!templateTile) {
      tileGuidePointsCache.set(tile, resolved);
      return resolved;
    }

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
    if (points[11] && points[10]) {
      points[11].x = points[10].x;
    }
    if (points[11] && points[14]) {
      points[14].x = -points[11].x;
      points[14].y = points[11].y;
    }
    if (points[12]) {
      points[12].x += 69;
      points[12].y += 3;
    }
    if (points[12] && points[15]) {
      points[12].x = points[15].x;
    }
    for (const pointIndex of [0, 1, 2, 3, 6, 7, 8, 9]) {
      if (!points[pointIndex]) continue;
      points[pointIndex].y += 1;
    }
    for (const pointIndex of [1, 8]) {
      if (!points[pointIndex]) continue;
      points[pointIndex].y += 2;
    }
    if (points[1]) {
      points[1].x += 1;
      points[1].y += 1;
    }
    if (points[8]) {
      points[8].x -= 1;
      points[8].y += 1;
    }
    for (const pointIndex of [2, 3, 6, 7]) {
      if (!points[pointIndex]) continue;
      points[pointIndex].y += 1;
    }
    for (const pointIndex of [3, 4]) {
      if (!points[pointIndex]) continue;
      points[pointIndex].x += 1;
    }
    if (points[4]) {
      points[4].x += 1;
    }
    if (points[14]) points.splice(14, 1);
    if (points[13]) points.splice(13, 1);
  } else {
    resolved = applyNormalTileGuideAdjustments(points);
  }

  tileGuidePointsCache.set(tile, resolved);
  return resolved;
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

function getWallStorageDeps() {
  return {
    tileSetRegistry: getTileSetRegistry(),
    buildTileDefs,
  };
}

function getPortalFlagDeps() {
  return {
    tileSize: TILE_SIZE,
    clamp,
  };
}

function isDataFolderPersistenceActive() {
  return IS_TAURI_RUNTIME && Boolean(getStoredDataFolderPath());
}

function loadWallOverrides() {
  if (IS_TAURI_RUNTIME && !isDataFolderPersistenceActive()) return {};
  if (persistentDataBootstrapComplete && isDataFolderPersistenceActive()) return state.wallOverrides;
  return loadWallOverridesFromStorage(
    WALL_OVERRIDES_STORAGE_KEY,
    migrateLegacyWallOverrides,
    getWallStorageDeps(),
  );
}

function loadEndTileOverrides() {
  if (IS_TAURI_RUNTIME && !isDataFolderPersistenceActive()) return {};
  if (persistentDataBootstrapComplete && isDataFolderPersistenceActive()) return state.endTileOverrides;
  return loadEndTileOverridesFromStorage(
    END_TILE_OVERRIDES_STORAGE_KEY,
    getWallStorageDeps(),
  );
}

function loadPortalFlagOverrides() {
  if (IS_TAURI_RUNTIME && !isDataFolderPersistenceActive()) return {};
  if (persistentDataBootstrapComplete && isDataFolderPersistenceActive()) return state.portalFlagOverrides;
  return loadPortalFlagOverridesFromStorage(PORTAL_FLAG_OVERRIDES_STORAGE_KEY, {
    ...getWallStorageDeps(),
    portalDeps: getPortalFlagDeps(),
  });
}

function saveWallOverrides() {
  saveJsonStorage(
    WALL_OVERRIDES_STORAGE_KEY,
    pickBuiltInTileSetEntries(state.wallOverrides),
    "Could not save wall overrides to storage.",
  );
}

function saveEndTileOverrides() {
  saveJsonStorage(
    END_TILE_OVERRIDES_STORAGE_KEY,
    pickBuiltInTileSetEntries(state.endTileOverrides),
    "Could not save end-tile overrides to storage.",
  );
}

function savePortalFlagOverrides() {
  saveJsonStorage(
    PORTAL_FLAG_OVERRIDES_STORAGE_KEY,
    pickBuiltInTileSetEntries(state.portalFlagOverrides),
    "Could not save portal flag overrides to storage.",
  );
}

function getStoredWallFaces(tileSetId, tileId) {
  const tileSetOverrides = state.wallOverrides?.[tileSetId];
  const arr = tileSetOverrides?.[tileId] ?? defaultWallFaceData?.[tileSetId]?.[tileId] ?? [];
  if (!Array.isArray(arr)) return [];
  return arr.filter((n) => Number.isInteger(n) && n >= 0).sort((a, b) => a - b);
}

function getStoredAllowAsEndTile(tileSetId, tileId) {
  const tileSetOverrides = state.endTileOverrides?.[tileSetId];
  const value = tileSetOverrides?.[tileId];
  if (typeof value === "boolean") return value;
  return true;
}

function sanitizePortalFlagPosition(input) {
  return sanitizePortalFlagPositionValue(input, getPortalFlagDeps());
}

function clonePortalFlag(flag) {
  return clonePortalFlagValue(flag, getPortalFlagDeps());
}

function hasPortalFlag(tile) {
  return hasPortalFlagValue(tile, getPortalFlagDeps());
}

function getStoredPortalFlag(tileSetId, tileId) {
  const tileSetOverrides = state.portalFlagOverrides?.[tileSetId];
  return clonePortalFlag(tileSetOverrides?.[tileId] ?? null);
}

function exportWallOverridesBackup() {
  try {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      wallOverrides: state.wallOverrides,
      endTileOverrides: state.endTileOverrides,
      portalFlagOverrides: state.portalFlagOverrides,
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
    const portalFlagRaw = parsed?.portalFlagOverrides ?? {};
    const portalFlagSanitized = sanitizePortalFlagOverrides(portalFlagRaw);
    const builtInWallOverrides = pickBuiltInTileSetEntries(sanitized);
    const builtInEndTileOverrides = pickBuiltInTileSetEntries(endTileSanitized);
    const builtInPortalFlagOverrides = pickBuiltInTileSetEntries(portalFlagSanitized);
    const customTileSetIds = getTileSetRegistry()
      .filter((tileSet) => tileSet.source === "custom")
      .map((tileSet) => tileSet.id);

    for (const tileSetId of customTileSetIds) {
      const record = buildCustomTileSetEditorDataRecord(tileSetId, {
        wallOverrides: sanitized?.[tileSetId] || {},
        endTileOverrides: endTileSanitized?.[tileSetId] || {},
        portalFlagOverrides: portalFlagSanitized?.[tileSetId] || {},
      });
      if (hasCustomTileSetEditorData(record)) {
        customTileSetEditorDataCache.set(tileSetId, record);
        await saveStoredCustomTileSetEditorData(tileSetId, record);
      } else if (customTileSetEditorDataCache.has(tileSetId) || await getStoredCustomTileSetEditorData(tileSetId)) {
        customTileSetEditorDataCache.delete(tileSetId);
        await saveStoredCustomTileSetEditorData(tileSetId, buildCustomTileSetEditorDataRecord(tileSetId, {}));
      }
    }

    saveJsonStorage(WALL_OVERRIDES_STORAGE_KEY, builtInWallOverrides, "Could not save wall overrides to storage.");
    saveJsonStorage(END_TILE_OVERRIDES_STORAGE_KEY, builtInEndTileOverrides, "Could not save end-tile overrides to storage.");
    saveJsonStorage(PORTAL_FLAG_OVERRIDES_STORAGE_KEY, builtInPortalFlagOverrides, "Could not save portal flag overrides to storage.");
    syncStateOverrideMapsWithCustomEditorCache(
      builtInWallOverrides,
      builtInEndTileOverrides,
      builtInPortalFlagOverrides,
    );
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
  return sanitizeWallOverridesValue(input, getWallStorageDeps());
}

function sanitizeEndTileOverrides(input) {
  return sanitizeEndTileOverridesValue(input, getWallStorageDeps());
}

function sanitizePortalFlagOverrides(input) {
  return sanitizePortalFlagOverridesValue(input, {
    ...getWallStorageDeps(),
    portalDeps: getPortalFlagDeps(),
  });
}

function persistTileWallFaces(tileSetId, tileId, faceSet) {
  if (!state.wallOverrides[tileSetId]) state.wallOverrides[tileSetId] = {};
  const sorted = Array.from(faceSet).sort((a, b) => a - b);
  state.wallOverrides[tileSetId][tileId] = sorted;
  if (getTileSetConfig(tileSetId)?.source === "custom") {
    allowLocalDataNoticeAfterCustomChange();
    queuePersistCustomTileSetEditorData(tileSetId);
    showLocalDataNotice("custom", tileSetId);
  } else {
    saveWallOverrides();
    showLocalDataNotice("built_in", tileSetId);
  }
  const editorRef = state.wallEditorTileRefs.get(`${tileSetId}:${tileId}`);
  if (editorRef?.tile) clearTileGeometryCache(editorRef.tile);

  if (tileSetId === state.selectedTileSetId) {
    const activeTile = state.tiles.get(tileId);
    if (activeTile) {
      activeTile.wallFaceSet = new Set(sorted);
      clearTileGeometryCache(activeTile);
      refreshTileWallGuide(activeTile);
    }
  }
}

function persistAllowAsEndTile(tileSetId, tileId, allowed) {
  if (!state.endTileOverrides[tileSetId]) state.endTileOverrides[tileSetId] = {};
  state.endTileOverrides[tileSetId][tileId] = Boolean(allowed);
  if (getTileSetConfig(tileSetId)?.source === "custom") {
    allowLocalDataNoticeAfterCustomChange();
    queuePersistCustomTileSetEditorData(tileSetId);
    showLocalDataNotice("custom", tileSetId);
  } else {
    saveEndTileOverrides();
    showLocalDataNotice("built_in", tileSetId);
  }

  if (tileSetId === state.selectedTileSetId) {
    const activeTile = state.tiles.get(tileId);
    if (activeTile) activeTile.allowAsEndTile = Boolean(allowed);
  }
}

function persistPortalFlag(tileSetId, tileId, flag) {
  const next = clonePortalFlag(flag);
  if (next) {
    if (!state.portalFlagOverrides[tileSetId]) state.portalFlagOverrides[tileSetId] = {};
    state.portalFlagOverrides[tileSetId][tileId] = next;
  } else if (state.portalFlagOverrides[tileSetId]) {
    delete state.portalFlagOverrides[tileSetId][tileId];
    if (!Object.keys(state.portalFlagOverrides[tileSetId]).length) {
      delete state.portalFlagOverrides[tileSetId];
    }
  }
  if (getTileSetConfig(tileSetId)?.source === "custom") {
    allowLocalDataNoticeAfterCustomChange();
    queuePersistCustomTileSetEditorData(tileSetId);
    showLocalDataNotice("custom", tileSetId);
  } else {
    savePortalFlagOverrides();
    showLocalDataNotice("built_in", tileSetId);
  }

  if (tileSetId === state.selectedTileSetId) {
    const activeTile = state.tiles.get(tileId);
    if (activeTile) {
      activeTile.portalFlag = clonePortalFlag(next);
      syncTilePortalFlag(activeTile);
    }
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

function getWallFaceSignature(tile) {
  if (!tile?.wallFaceSet || !tile.wallFaceSet.size) return "";
  return [...tile.wallFaceSet].sort((a, b) => a - b).join(",");
}

function clearTileGeometryCache(tile) {
  if (!tile) return;
  tileGuidePointsCache.delete(tile);
  tileSideDirectionsCache.delete(tile);
  tilePoseGeometryCache.delete(tile);
}

function clearAllTileGeometryCaches() {
  for (const tile of state.tiles.values()) clearTileGeometryCache(tile);
  for (const ref of state.wallEditorTileRefs.values()) {
    clearTileGeometryCache(ref.tile);
  }
}

function sanitizeGuidePointTemplatePoints(points) {
  return sanitizeGuidePointTemplatePointsValue(points);
}

function sanitizeGuidePointTemplateOverrides(raw) {
  return sanitizeGuidePointTemplateOverridesValue(raw);
}

function loadGuidePointTemplateOverrides() {
  if (IS_TAURI_RUNTIME && !isDataFolderPersistenceActive()) return {};
  if (persistentDataBootstrapComplete && isDataFolderPersistenceActive()) return state.guidePointTemplateOverrides;
  return loadGuidePointTemplateOverridesFromStorage(GUIDE_POINT_TEMPLATES_STORAGE_KEY);
}

function saveGuidePointTemplateOverrides() {
  saveJsonStorage(
    GUIDE_POINT_TEMPLATES_STORAGE_KEY,
    state.guidePointTemplateOverrides || {},
    "Could not save guide point templates to storage.",
  );
}

function getGuidePointTemplateType(tile) {
  if (!tile) return null;
  return isEntranceTile(tile) ? "entrance" : "regular";
}

function getCustomGuidePointTemplateOverrideRaw(tileSetId, templateType) {
  if (!tileSetId || !templateType) return null;
  return customTileSetEditorDataCache.get(tileSetId)?.guidePointTemplateOverrides?.[templateType] || null;
}

function getGuidePointTemplateOverrideRaw(templateType, tileSetId = "") {
  const customOverride = getCustomGuidePointTemplateOverrideRaw(tileSetId, templateType);
  if (customOverride?.length) return customOverride;
  return state.guidePointTemplateOverrides?.[templateType]
    || DEFAULT_GUIDE_POINT_TEMPLATES?.[templateType]
    || null;
}

function getGuidePointTemplateOverride(templateType, tileSetId = "") {
  return cloneGuidePoints(getGuidePointTemplateOverrideRaw(templateType, tileSetId));
}

function isGuidePointTemplateEditableTile(tile) {
  return Boolean(tile && (isEntranceTile(tile) || tile.tileId === "tile_01"));
}

function replaceTileGuideOverlay(tile) {
  if (!tile?.bodyDom) return;
  const nextGuide = createTileGuideOverlay(tile);
  if (tile.guideDom?.parentElement === tile.bodyDom) {
    tile.bodyDom.replaceChild(nextGuide, tile.guideDom);
  } else {
    tile.bodyDom.appendChild(nextGuide);
  }
  tile.guideDom = nextGuide;
  refreshTileWallGuide(tile);
}

function refreshAllGuideTemplateConsumers() {
  for (const tile of state.tiles.values()) {
    replaceTileGuideOverlay(tile);
  }
  for (const ref of state.wallEditorTileRefs.values()) {
    replaceTileGuideOverlay(ref.tile);
  }
}

function persistGuidePointTemplate(templateType, points, tileSetId = "") {
  const sanitized = sanitizeGuidePointTemplatePoints(points);
  if (!sanitized) return;
  const tileSet = tileSetId ? getTileSetConfig(tileSetId) : null;
  if (tileSet?.source === "custom") {
    allowLocalDataNoticeAfterCustomChange();
    const existingRecord = customTileSetEditorDataCache.get(tileSetId) || buildCustomTileSetEditorDataRecord(tileSetId, {});
    const nextRecord = buildCustomTileSetEditorDataRecord(tileSetId, {
      ...existingRecord,
      guidePointTemplateOverrides: {
        ...(existingRecord.guidePointTemplateOverrides || {}),
        [templateType]: sanitized,
      },
    });
    customTileSetEditorDataCache.set(tileSetId, nextRecord);
    queuePersistCustomTileSetEditorData(tileSetId);
  } else {
    if (!state.guidePointTemplateOverrides || typeof state.guidePointTemplateOverrides !== "object") {
      state.guidePointTemplateOverrides = {};
    }
    state.guidePointTemplateOverrides[templateType] = sanitized;
    saveGuidePointTemplateOverrides();
  }
  clearAllTileGeometryCaches();
  refreshAllGuideTemplateConsumers();
}

async function resetGuidePointTemplatesForActiveEditorTileSet() {
  if (!state.wallEditMode) return;
  const tileSetId = state.wallEditorActiveTileSetId || state.selectedTileSetId;
  const tileSet = getTileSetConfig(tileSetId);
  if (!tileSet) return;
  if (tileSet.source === "custom") {
    setStatus("Reset Tile Points is only available for built-in tile sets.", true);
    return;
  }

  state.guidePointTemplateOverrides = {};
  saveGuidePointTemplateOverrides();
  showLocalDataNotice("built_in", tileSetId);
  clearAllTileGeometryCaches();
  refreshAllGuideTemplateConsumers();
  setStatus(`Tile points reset to defaults for ${tileSet.label}.`);
}

function getGuidePointTemplateExportData(tileSetId = "") {
  return {
    regular: cloneGuidePoints(
      getGuidePointTemplateOverride("regular", tileSetId)
      || null,
    ),
    entrance: cloneGuidePoints(
      getGuidePointTemplateOverride("entrance", tileSetId)
      || null,
    ),
  };
}

async function copyGuidePointTemplateExport() {
  const exportTileSetId = state.wallEditMode ? state.wallEditorActiveTileSetId || state.selectedTileSetId : state.selectedTileSetId;
  const exportData = getGuidePointTemplateExportData(exportTileSetId);
  const payload = JSON.stringify(exportData, null, 2);
  try {
    await navigator.clipboard.writeText(payload);
    setStatus("Guide template JSON copied. Paste it here and I can bake it in as the default.");
  } catch (error) {
    console.warn("Could not copy guide template JSON.", error);
    setStatus("Could not copy guide template JSON. Use devtools localStorage key hts_guide_point_templates_v1.", true);
  }
}

function beginGuidePointHandleDrag(tile, pointIndex, event) {
  if (!state.wallEditMode || !isGuidePointTemplateEditableTile(tile)) return;
  const templateType = getGuidePointTemplateType(tile);
  if (!templateType) return;

  const startPoints = getGuidePointTemplateOverride(templateType, tile.tileSetId) || cloneGuidePoints(getGuideFacePoints(tile));
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
    nextPoints[pointIndex] = {
      x: startPoint.x + dx,
      y: startPoint.y + dy,
    };
    persistGuidePointTemplate(templateType, nextPoints, tile.tileSetId);
  };

  const cleanup = () => {
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
    window.removeEventListener("pointercancel", handleUp);
  };

  const handleUp = () => {
    cleanup();
    showLocalDataNotice(getTileSetConfig(tile.tileSetId)?.source === "custom" ? "custom" : "built_in", tile.tileSetId);
    setStatus(
      `${templateType === "entrance" ? "Entrance" : "Regular"} guide point ${pointIndex} updated.`,
    );
  };

  window.addEventListener("pointermove", handleMove);
  window.addEventListener("pointerup", handleUp);
  window.addEventListener("pointercancel", handleUp);
}

function updateWallEditorPortalFlagTransform(tile) {
  if (!tile?.portalFlagDom) return;
  const portalFlag = clonePortalFlag(tile.portalFlag);
  if (!portalFlag) return;
  const left = 50 + (portalFlag.x / TILE_SIZE) * 100;
  const top = 50 + (portalFlag.y / TILE_SIZE) * 100;
  tile.portalFlagDom.style.left = `${left.toFixed(2)}%`;
  tile.portalFlagDom.style.top = `${top.toFixed(2)}%`;
  tile.portalFlagDom.style.transform = `translate(-50%, -50%) rotate(${-normalizeAngle(tile.rotation || 0)}deg)`;
}

function createPortalFlagElement() {
  const flag = document.createElement("div");
  flag.className = "tile-portal-flag";
  return flag;
}

function syncTilePortalFlag(tile, options = {}) {
  if (!tile?.bodyDom) return;
  const portalFlag = clonePortalFlag(tile.portalFlag);
  if (!portalFlag) {
    if (tile.portalFlagDom?.parentElement === tile.bodyDom) {
      tile.bodyDom.removeChild(tile.portalFlagDom);
    }
    tile.portalFlagDom = null;
    return;
  }

  if (!tile.portalFlagDom) {
    const flag = createPortalFlagElement();
    if (options.interactive) {
      flag.classList.add("tile-portal-flag-interactive");
      flag.title = "Portal flag. Drag to reposition.";
      flag.addEventListener("pointerdown", (event) => beginWallEditorPortalFlagDrag(tile, event));
    }
    tile.portalFlagDom = flag;
  }
  if (tile.portalFlagDom.parentElement !== tile.bodyDom) {
    tile.bodyDom.appendChild(tile.portalFlagDom);
  }
  updateWallEditorPortalFlagTransform(tile);
}

function syncWallEditorPortalFlag(tile) {
  syncWallEditorPortalFlagUI(tile, getWallEditorCtx());
}

function beginWallEditorPortalFlagDrag(tile, event) {
  beginWallEditorPortalFlagDragUI(tile, event, getWallEditorCtx());
}

function getWallEditorGroupById(groupId) {
  return getWallEditorGroupByIdUI(groupId, getWallEditorCtx());
}

function getWallEditorGroupIdForTileSet(tileSetId) {
  return getWallEditorGroupIdForTileSetUI(tileSetId, getWallEditorCtx());
}

// getWallEditorAssetEntries, createWallEditorAssetSlot, createWallEditorAssetPlaceholder,
// createWallEditorSupportAssetCard moved to modules/wall-editor-ui.js

async function rerenderWallEditorPreservingScroll() {
  return rerenderWallEditorPreservingScrollUI(getWallEditorCtx());
}

async function renderWallEditorPage() {
  return renderWallEditorPageUI(getWallEditorCtx());
}

// buildWallEditorCoreAssetSlot, buildWallEditorSupportAssetSlot, buildMissingWallEditorAssetSlot,
// syncWallEditorPanelMissingNote moved to modules/wall-editor-ui.js

async function patchWallEditorAssetSlot(tileSetId, assetKind, assetId) {
  return patchWallEditorAssetSlotUI(tileSetId, assetKind, assetId, getWallEditorCtx());
}

// buildWallEditorTileSetPanel, createWallEditorTileElement, createWallEditorMetaToggle
// moved to modules/wall-editor-ui.js

function setActiveWallEditorTile(tileSetId, tileId) {
  setActiveWallEditorTileUI(tileSetId, tileId, getWallEditorCtx());
}

function syncSelectedTileSetWallsFromOverrides() {
  for (const tile of state.tiles.values()) {
    tile.wallFaceSet = new Set(getStoredWallFaces(state.selectedTileSetId, tile.tileId));
    tile.allowAsEndTile = getStoredAllowAsEndTile(state.selectedTileSetId, tile.tileId);
    tile.portalFlag = getStoredPortalFlag(state.selectedTileSetId, tile.tileId);
    clearTileGeometryCache(tile);
    refreshTileWallGuide(tile);
    syncTilePortalFlag(tile);
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
  const placedCount = state.autoBuildPreviewPlacedCount ?? getPlacedRegularTileCount();
  const totalSlots = state.autoBuildPreviewPlacedCount != null && state.autoBuildPreviewPlacedCount > 6
    ? state.autoBuildPreviewPlacedCount
    : 6;
  if (placedProgressEl) placedProgressEl.textContent = `Placed ${placedCount} / ${totalSlots} tiles`;
  updatePlacementFeedbackChecklist();
}

// showWallEditorToolbarHint, hideWallEditorToolbarHintWithDelay,
// attachWallEditorToolbarHint moved to modules/wall-editor-ui.js

function updatePlacementFeedbackChecklist() {
  const placedCount = state.autoBuildPreviewPlacedCount ?? getPlacedRegularTileCount();
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
  if (state.wallEditMode) modes.push("Tile Editor Active");
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
  const startedFromCompactTray = state.compactSidePanelMode && !startedFromBoard;
  const compactDragGrowAnchorX = leftDrawer.getBoundingClientRect().right;
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
      positionTile(
        tile,
        snapped.x * zoom + boardOffsetX,
        snapped.y * zoom + boardOffsetY,
      );
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
    finishDrop(tile, tile.drag?.placedTilesExcludingSelf);
    tile.drag = null;
  };

  window.addEventListener("pointermove", handleMove);
  window.addEventListener("pointerup", handleUp);
  window.addEventListener("pointercancel", handleUp);
}

function finishDrop(tile, placedTiles = null) {
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

function snapTileCenterToHex(tile, tileCenterX, tileCenterY) {
  return snapTileCenterToHexTP(tile, tileCenterX, tileCenterY, getTilePlacementCtx());
}

function quantizeSnapCoord(value, quantum = SNAP_COORD_QUANTUM) {
  return quantizeSnapCoordTP(value, quantum);
}

function getTileSnapAnchorForRotation(tile, rotationDeg) {
  return getTileSnapAnchorForRotationTP(tile, rotationDeg, getTilePlacementCtx());
}

function getTileGuideLocalCenter(tile) {
  return getTileGuideLocalCenterTP(tile, getTilePlacementCtx());
}

function getPlacedTileRotationState(tile, otherTiles) {
  return getPlacedTileRotationStateTP(tile, otherTiles, getTilePlacementCtx());
}

function getPlacementFeedbackFaceIndices(result) {
  return getPlacementFeedbackFaceIndicesTP(result);
}

function applyPlacementFeedbackFromResult(tile, result) {
  applyPlacementFeedbackFromResultTP(tile, result, getTilePlacementCtx());
}

function getPlacedTileConnectedNeighbors(tile, otherTiles) {
  return getPlacedTileConnectedNeighborsTP(tile, otherTiles, getTilePlacementCtx());
}

function getInvalidPlacedTileRotationReason(result) {
  return getInvalidPlacedTileRotationReasonTP(result);
}

function rotateTile(tile, delta) {
  rotateTileTP(tile, delta, getTilePlacementCtx());
}

function findBestContact(tile, otherTiles, options = {}) {
  return findBestContactTP(tile, otherTiles, getTilePlacementCtx(), options);
}

function getInvalidContactReason(result) {
  return getInvalidContactReasonTP(result);
}

function countSideContacts(a, b) {
  return countSideContactsTP(a, b, getTilePlacementCtx());
}

function getContactMatchDetails(a, b) {
  return getContactMatchDetailsTP(a, b, getTilePlacementCtx());
}

function computeBestSnap(tile, otherTiles, targetX, targetY, maxDelta = SNAP_SEARCH_RADIUS, requireNoOverlap = true, options = {}) {
  return computeBestSnapTP(tile, otherTiles, targetX, targetY, getTilePlacementCtx(), maxDelta, requireNoOverlap, options);
}

function evaluatePlacementAt(tile, otherTiles, x, y, options = {}) {
  return evaluatePlacementAtTP(tile, otherTiles, x, y, getTilePlacementCtx(), options);
}

function getMatchAlignmentCorrection(match) {
  return getMatchAlignmentCorrectionTP(match, getTilePlacementCtx());
}

function getSideSamples(tile) {
  return getSideSamplesTP(tile, getTilePlacementCtx());
}

function buildInsetPolygon(tile, poly, insetPx = OVERLAP_POLYGON_INSET_PX) {
  return buildInsetPolygonTP(tile, poly, insetPx, getTilePlacementCtx());
}

function getTilePoseGeometry(tile) {
  return getTilePoseGeometryTP(tile, getTilePlacementCtx());
}

function getSideDirections(tile) {
  return getSideDirectionsTP(tile, getTilePlacementCtx());
}

function getContactFaces(tile) {
  return getContactFacesTP(tile, getTilePlacementCtx());
}

function isBlockedContactFace(tile, face) {
  return isBlockedContactFaceTP(tile, face, getTilePlacementCtx());
}

function isTouchingTileStartBlockedPoints(tile, otherTile, touchRadius) {
  return isTouchingTileStartBlockedPointsTP(tile, otherTile, touchRadius, getTilePlacementCtx());
}

function isTouchingMoltenEntranceBlockedPoints(tile) {
  return isTouchingMoltenEntranceBlockedPointsTP(tile, getTilePlacementCtx());
}

function isWorldPointOnOpaquePixel(tile, wx, wy, radius = 0, minAlpha = 24) {
  return isWorldPointOnOpaquePixelTP(tile, wx, wy, getTilePlacementCtx(), radius, minAlpha);
}

function getPlacedTiles() {
  return getPlacedTilesTP(getTilePlacementCtx());
}

function getPlacedTilesExcluding(excludedTile) {
  return getPlacedTilesExcludingTP(excludedTile, getTilePlacementCtx());
}

function getPlacedRegularTileCount() {
  return getPlacedRegularTileCountTP(getTilePlacementCtx());
}

function revertToTray(tile, message, warn = false) {
  revertToTrayTP(tile, message, getTilePlacementCtx(), warn);
}

function handleInvalidDrop(tile, placedTiles, message = null, force = false) {
  handleInvalidDropTP(tile, placedTiles, getTilePlacementCtx(), message, force);
}

function moveAwayFromPlacedTiles(tile, placedTiles) {
  moveAwayFromPlacedTilesTP(tile, placedTiles, getTilePlacementCtx());
}

function findBestOpenHex(tile, placedTiles, preferredX, preferredY, anchorTile = null) {
  return findBestOpenHexTP(tile, placedTiles, preferredX, preferredY, getTilePlacementCtx(), anchorTile);
}

function getNearestTile(x, y, tiles) {
  return getNearestTileTP(x, y, tiles);
}

function getCandidateClearanceMetrics(tile, otherTiles, x, y) {
  return getCandidateClearanceMetricsTP(tile, otherTiles, x, y, getTilePlacementCtx());
}

function getMinFaceDistanceToTiles(tile, otherTiles) {
  return getMinFaceDistanceToTilesTP(tile, otherTiles, getTilePlacementCtx());
}

function clearInvalidReturnTimer(tile) {
  clearInvalidReturnTimerTP(tile);
}

function positionTile(tile, x, y) {
  positionTileTP(tile, x, y);
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
  return isOnBoardLayerBV(parent, getBoardViewCtx());
}

function updateTileTransform(tile) {
  if (!tile.dom) return;
  const parent = tile.dom.parentElement;
  const zoom = getBoardZoom();
  const isBoardTile = isOnBoardLayer(parent);
  const isDragLayerTile = parent === dragLayer;
  const isBoardDrag = isDragLayerTile && tile.drag?.startedFromBoard;
  const isCompactTrayDrag = parent === dragLayer && tile.drag?.startedFromCompactTray;
  const isTrayDrag = isDragLayerTile && !tile.drag?.startedFromBoard && !tile.drag?.startedFromCompactTray;
  const dragZoom = isDragLayerTile ? zoom : 1;
  const boardItemScale =
    (isBoardTile || isBoardDrag)
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
      trayNudgeX = slotIndex % 2 === 0 ? 2 : -2;
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
  const screenX = isBoardTile ? worldToBoardScreenX(tile.x, zoom) : tile.x;
  const screenY = isBoardTile ? worldToBoardScreenY(tile.y, zoom) : tile.y;
  const baseWidth = isEntranceTile(tile) ? (TILE_SIZE - 3) : TILE_SIZE;
  const baseHeight = TILE_SIZE;
  let explicitScreenWidth = (isBoardTile || isBoardDrag || isTrayDrag) ? (baseWidth * zoom * boardItemScale) : null;
  let explicitScreenHeight = (isBoardTile || isBoardDrag || isTrayDrag) ? (baseHeight * zoom * boardItemScale) : null;
  if (isCompactTrayDrag) {
    const progress = clamp(tile.drag?.compactDragProgress ?? 0, 0, 1);
    const startWidth = tile.drag?.compactStartWidth ?? baseWidth;
    const startHeight = tile.drag?.compactStartHeight ?? baseHeight;
    const targetWidth = baseWidth * zoom;
    const targetHeight = baseHeight * zoom;
    explicitScreenWidth = startWidth + ((targetWidth - startWidth) * progress);
    explicitScreenHeight = startHeight + ((targetHeight - startHeight) * progress);
  } else if (isBoardDrag && state.compactSidePanelMode) {
    const progress = clamp(tile.drag?.compactDragProgress ?? 1, 0, 1);
    const compactWidth = tile.drag?.compactTrayWidth ?? getCompactTrayTileSize(tile).width;
    const compactHeight = tile.drag?.compactTrayHeight ?? getCompactTrayTileSize(tile).height;
    const boardWidth = baseWidth * zoom;
    const boardHeight = baseHeight * zoom;
    explicitScreenWidth = compactWidth + ((boardWidth - compactWidth) * progress);
    explicitScreenHeight = compactHeight + ((boardHeight - compactHeight) * progress);
  }
  tile.dom.style.left = `${screenX}px`;
  tile.dom.style.top = `${screenY}px`;
  tile.dom.style.width = explicitScreenWidth ? `${explicitScreenWidth}px` : "";
  tile.dom.style.height = explicitScreenHeight ? `${explicitScreenHeight}px` : "";
  tile.dom.style.setProperty(
    "--tile-control-scale",
    ((isBoardTile || isBoardDrag || isCompactTrayDrag) ? zoom : 1).toFixed(3),
  );
  tile.dom.style.transformOrigin = "50% 50%";
  tile.dom.style.transform =
    (!isBoardTile && !isBoardDrag && !isCompactTrayDrag && !isTrayDrag && scale !== 1)
      ? `translate(${translateX}, ${translateY}) scale(${scale})`
      : `translate(${translateX}, ${translateY})`;
  if (tile.bodyDom) {
    tile.bodyDom.style.transform = `rotate(${tile.rotation}deg)`;
    updateWallEditorPortalFlagTransform(tile);
  }
}

function getCompactTrayTileSize(tile) {
  const fallbackSize = 40;
  const slot = tile?.traySlot;
  const parsedSize = slot
    ? Number.parseFloat(getComputedStyle(slot).getPropertyValue("--tile-size"))
    : Number.NaN;
  const baseSize = Number.isFinite(parsedSize) && parsedSize > 0 ? parsedSize : fallbackSize;
  return {
    width: isEntranceTile(tile) ? baseSize - 3 : baseSize,
    height: baseSize,
  };
}

function setStatus(message, warn = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("warn", warn);
}

function generatePdfExportPreviewStorageKey() {
  const suffix = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${PDF_EXPORT_PREVIEW_STORAGE_PREFIX}${suffix}`;
}

function storePdfExportPreviewHtml(exportHtml) {
  const storageKey = generatePdfExportPreviewStorageKey();
  try {
    localStorage.setItem(storageKey, exportHtml);
    return storageKey;
  } catch (error) {
    console.error("Could not store PDF export preview HTML.", error);
    return "";
  }
}

function hideLocalDataNotice() {
  if (!localDataNoticeEl) return;
  localDataNoticeEl.hidden = true;
  if (localDataNoticeTitleEl) {
    localDataNoticeTitleEl.textContent = "";
  }
  if (localDataNoticeBodyEl) {
    localDataNoticeBodyEl.textContent = "";
  }
  localDataNoticeActionContext = null;
  if (localDataNoticeActionBtn) {
    localDataNoticeActionBtn.hidden = true;
    localDataNoticeActionBtn.textContent = "";
  }
}

function dismissLocalDataNotice() {
  const action = localDataNoticeActionContext;
  if (action?.type === "open_tile_editor_backup" && action.tileSetId) {
    markCustomTileSetBackedUp(action.tileSetId);
  }
  localDataNoticeSuppressedUntilCustomChange = true;
  try {
    sessionStorage.setItem(LOCAL_DATA_NOTICE_SUPPRESSED_SESSION_KEY, "true");
  } catch {
    // ignore
  }
  hideLocalDataNotice();
}

function setLocalDataNoticeBody(notice) {
  localDataNoticeBodyEl.textContent = "";
  if (!Array.isArray(notice.bodyParts) || !notice.bodyParts.length) {
    localDataNoticeBodyEl.textContent = notice.body || "";
  } else {
    for (const part of notice.bodyParts) {
      const node = part?.strong ? document.createElement("strong") : document.createTextNode("");
      node.textContent = String(part?.text || "");
      localDataNoticeBodyEl.appendChild(node);
    }
  }
  if (Array.isArray(notice.attentionLabels) && notice.attentionLabels.length) {
    const line = document.createElement("span");
    line.className = "local-data-notice-attention-line";
    const intro = document.createElement("span");
    intro.textContent = "Needs attention:";
    const strong = document.createElement("strong");
    strong.className = "local-data-notice-attention-list";
    strong.textContent = notice.attentionLabels.join(", ");
    line.appendChild(intro);
    line.appendChild(strong);
    localDataNoticeBodyEl.appendChild(line);
  }
}

function showLocalDataNotice(kind, tileSetId = "") {
  if (!localDataNoticeEl || !localDataNoticeTitleEl || !localDataNoticeBodyEl) return;
  const tileSet = tileSetId ? getTileSetConfig(tileSetId) : null;
  const notice = buildLocalDataNotice(kind, {
    tileSetId,
    tileSetLabel: tileSet?.label || "",
    tileSetLabels: kind === "custom" ? getCustomTileSetBackupNeededLabels() : [],
  });
  if (!notice) {
    hideLocalDataNotice();
    return;
  }
  if (localDataNoticeSuppressedUntilCustomChange) {
    hideLocalDataNotice();
    return;
  }
  if (kind === "custom" && tileSetId) {
    markCustomTileSetBackupNeeded(tileSetId);
  }
  if (!DEV_MODE_ENABLED && notice.actionContext?.type === "export_debug_walls") {
    notice.actionLabel = null;
    notice.actionContext = null;
  }

  const hasVisibleContent = Boolean(
    String(notice.title || "").trim()
    || String(notice.body || "").trim()
    || (Array.isArray(notice.bodyParts) && notice.bodyParts.length)
    || (Array.isArray(notice.attentionLabels) && notice.attentionLabels.length)
    || (notice.actionLabel && notice.actionContext),
  );
  if (!hasVisibleContent) {
    hideLocalDataNotice();
    return;
  }

  localDataNoticeTitleEl.textContent = notice.title;
  setLocalDataNoticeBody(notice);
  if (localDataNoticeActionBtn && notice.actionLabel && notice.actionContext) {
    localDataNoticeActionBtn.hidden = false;
    localDataNoticeActionBtn.textContent = notice.actionLabel;
    localDataNoticeActionContext = notice.actionContext;
  } else if (localDataNoticeActionBtn) {
    localDataNoticeActionBtn.hidden = true;
    localDataNoticeActionBtn.textContent = "";
    localDataNoticeActionContext = null;
  }
  localDataNoticeEl.hidden = false;
}

function getOpaqueBounds(image) {
  return getOpaqueBoundsValue(image, TILE_SIZE);
}

function getAutoBuildHistoryKey(activeRegularTiles) {
  const ids = (activeRegularTiles || [])
    .map((tile) => getTileInstanceKey(tile))
    .sort();
  return `set:${state.selectedTileSetId}|${ids.join(",")}`;
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
  return getAlphaMaskTP(image, getTilePlacementCtx());
}

function getFaceGeometry(image, sideCount) {
  return getFaceGeometryTP(image, sideCount, getTilePlacementCtx());
}

function hasAnyOverlap(tile, otherTiles) {
  return hasAnyOverlapTP(tile, otherTiles, getTilePlacementCtx());
}

function tilesAlphaOverlap(a, b) {
  return tilesAlphaOverlapTP(a, b, getTilePlacementCtx());
}

function getWorldPolygon(tile) {
  return getWorldPolygonTP(tile, getTilePlacementCtx());
}

function getOverlapWorldPolygon(tile, insetPx = OVERLAP_POLYGON_INSET_PX) {
  return getOverlapWorldPolygonTP(tile, getTilePlacementCtx(), insetPx);
}

function getCachedDragPlacementResult(tile, placedTiles, candidateX, candidateY) {
  return getCachedDragPlacementResultTP(tile, placedTiles, candidateX, candidateY, getTilePlacementCtx());
}

function updatePlacementFeedback(tile) {
  updatePlacementFeedbackTP(tile, getTilePlacementCtx());
}

function setPlacementFeedback(tile, isValid, validFaceIndices = [], invalidFaceIndices = []) {
  setPlacementFeedbackTP(tile, isValid, validFaceIndices, invalidFaceIndices);
}

function refreshPlacementGuideDom(guideDom, isValid, validFaceIndices, invalidFaceIndices = []) {
  refreshPlacementGuideDomTP(guideDom, isValid, validFaceIndices, invalidFaceIndices);
}
