// Local data notice strip, status bar, and PDF export preview storage.
// All functions accept `ctx` as last parameter.
// ctx is built by getLocalDataNoticesCtx() in app.js.

export function setStatus(message, warn = false, ctx) {
  ctx.statusEl.textContent = message;
  ctx.statusEl.classList.toggle("warn", warn);
}

export function generatePdfExportPreviewStorageKey(ctx) {
  const suffix = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${ctx.PDF_EXPORT_PREVIEW_STORAGE_PREFIX}${suffix}`;
}

export function storePdfExportPreviewHtml(exportHtml, ctx) {
  const storageKey = generatePdfExportPreviewStorageKey(ctx);
  try {
    localStorage.setItem(storageKey, exportHtml);
    return storageKey;
  } catch (error) {
    console.error("Could not store PDF export preview HTML.", error);
    return "";
  }
}

export function hideLocalDataNotice(ctx) {
  if (!ctx.localDataNoticeEl) return;
  ctx.localDataNoticeEl.hidden = true;
  if (ctx.localDataNoticeTitleEl) {
    ctx.localDataNoticeTitleEl.textContent = "";
  }
  if (ctx.localDataNoticeBodyEl) {
    ctx.localDataNoticeBodyEl.textContent = "";
  }
  ctx.localDataNoticeActionContext = null;
  if (ctx.localDataNoticeActionBtn) {
    ctx.localDataNoticeActionBtn.hidden = true;
    ctx.localDataNoticeActionBtn.textContent = "";
  }
}

export function dismissLocalDataNotice(ctx) {
  const action = ctx.localDataNoticeActionContext;
  if (action?.type === "open_tile_editor_export" && action.tileSetId) {
    ctx.markCustomTileSetBackedUp(action.tileSetId);
  }
  ctx.localDataNoticeSuppressedUntilCustomChange = true;
  try {
    sessionStorage.setItem(ctx.LOCAL_DATA_NOTICE_SUPPRESSED_SESSION_KEY, "true");
  } catch {
    // ignore
  }
  hideLocalDataNotice(ctx);
}

export function setLocalDataNoticeBody(notice, ctx) {
  ctx.localDataNoticeBodyEl.textContent = "";
  if (!Array.isArray(notice.bodyParts) || !notice.bodyParts.length) {
    ctx.localDataNoticeBodyEl.textContent = notice.body || "";
  } else {
    for (const part of notice.bodyParts) {
      const node = part?.strong ? document.createElement("strong") : document.createTextNode("");
      node.textContent = String(part?.text || "");
      ctx.localDataNoticeBodyEl.appendChild(node);
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
    ctx.localDataNoticeBodyEl.appendChild(line);
  }
}

export function showLocalDataNotice(kind, tileSetId = "", ctx) {
  if (!ctx.localDataNoticeEl || !ctx.localDataNoticeTitleEl || !ctx.localDataNoticeBodyEl) return;
  const tileSet = tileSetId ? ctx.getTileSetConfig(tileSetId) : null;
  // The same notice types are reused in browser and Tauri, so pass runtime storage context here.
  const notice = ctx.buildLocalDataNotice(kind, {
    tileSetId,
    tileSetLabel: tileSet?.label || "",
    tileSetLabels: kind === "custom" ? ctx.getCustomTileSetBackupNeededLabels() : [],
    isTauriRuntime: ctx.IS_TAURI_RUNTIME,
    hasDataFolder: Boolean(ctx.getStoredDataFolderPath()),
  });
  if (!notice) {
    hideLocalDataNotice(ctx);
    return;
  }
  if (ctx.localDataNoticeSuppressedUntilCustomChange) {
    hideLocalDataNotice(ctx);
    return;
  }
  if (kind === "custom" && tileSetId) {
    ctx.markCustomTileSetBackupNeeded(tileSetId);
  }
  if (!ctx.DEV_MODE_ENABLED && notice.actionContext?.type === "export_debug_walls") {
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
    hideLocalDataNotice(ctx);
    return;
  }

  ctx.localDataNoticeTitleEl.textContent = notice.title;
  setLocalDataNoticeBody(notice, ctx);
  if (ctx.localDataNoticeActionBtn && notice.actionLabel && notice.actionContext) {
    ctx.localDataNoticeActionBtn.hidden = false;
    ctx.localDataNoticeActionBtn.textContent = notice.actionLabel;
    ctx.localDataNoticeActionContext = notice.actionContext;
  } else if (ctx.localDataNoticeActionBtn) {
    ctx.localDataNoticeActionBtn.hidden = true;
    ctx.localDataNoticeActionBtn.textContent = "";
    ctx.localDataNoticeActionContext = null;
  }
  ctx.localDataNoticeEl.hidden = false;
}
