import { createZipArchive } from "./zip-reader.js";

export function sanitizeCustomTileSetFilename(value) {
  return String(value || "custom_tileset")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "custom_tileset";
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
  }[char] || char));
}

export function buildCustomShareHelperHtml({ tileSetLabel, shareUrl }) {
  const safeTitle = escapeHtml(tileSetLabel || "Custom Tileset");
  const safeUrl = escapeHtml(shareUrl || "");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle} Shared Layout</title>
    <style>
      :root { color-scheme: light dark; }
      body {
        margin: 0;
        padding: 32px 20px;
        font: 16px/1.5 "Avenir Next", "Segoe UI", sans-serif;
        background: #efe0cf;
        color: #23180f;
      }
      main {
        max-width: 760px;
        margin: 0 auto;
        padding: 28px 24px;
        border-radius: 18px;
        background: rgba(255,255,255,0.72);
        box-shadow: 0 18px 40px rgba(45, 28, 15, 0.12);
      }
      h1 { margin-top: 0; font-size: 1.7rem; }
      ol { padding-left: 1.2rem; }
      a {
        color: #0c6f52;
        font-weight: 700;
        word-break: break-word;
      }
      code {
        padding: 0.1em 0.35em;
        border-radius: 6px;
        background: rgba(35, 24, 15, 0.08);
      }
    </style>
  </head>
  <body>
    <main>
      <h1>${safeTitle} Shared Layout</h1>
      <p>This layout depends on a browser-local custom tile set. The share link restores the layout state, but the custom art and tile metadata still need the matching custom-set package.</p>
      <ol>
        <li>Open the mapper in your browser.</li>
        <li>Import the included custom tile set <code>.zip</code> first.</li>
        <li>Then open the shared layout link below.</li>
      </ol>
      <p><a href="${safeUrl}">${safeUrl}</a></p>
      <p>If the custom tile set is not installed, the app can still offer a best-effort Molten fallback, but that only approximates the original layout and will not preserve the original custom art or exact tile metadata.</p>
    </main>
  </body>
</html>`;
}

export async function buildCustomShareBundleArchive({
  tileSetLabel,
  tileSetFilenameBase,
  tileSetArchive,
  tileSetArchiveFilename,
  shareUrl,
  date = new Date().toISOString().slice(0, 10),
}) {
  const bundle = await createZipArchive([
    {
      name: tileSetArchiveFilename,
      data: tileSetArchive,
    },
    {
      name: `${tileSetFilenameBase}-shared-layout.html`,
      data: buildCustomShareHelperHtml({ tileSetLabel, shareUrl }),
    },
  ]);
  return {
    bundle,
    filename: `${tileSetFilenameBase}-share-bundle-${date}.zip`,
  };
}

export function buildShareFallbackPayload(payload, fallbackTileSet, buildBossAssetKey) {
  if (!fallbackTileSet) return null;

  const mapTileSlotToFallbackId = (slot) => {
    if (slot === 0) return fallbackTileSet.entranceTileId;
    if (Number.isInteger(slot) && slot >= 1 && slot <= fallbackTileSet.tileIds.length) {
      return fallbackTileSet.tileIds[slot - 1];
    }
    return "";
  };

  return {
    ...payload,
    ts: fallbackTileSet.id,
    o: (payload?.o || [])
      .map((entry) => {
        if (typeof entry === "string" && fallbackTileSet.tileIds.includes(entry)) return entry;
        const slot = Number(entry?.sl);
        return mapTileSlotToFallbackId(slot);
      })
      .filter((tileId) => fallbackTileSet.tileIds.includes(tileId)),
    t: (payload?.t || [])
      .map((entry) => {
        const originalTileId = String(entry?.i || "");
        const mappedTileId = mapTileSlotToFallbackId(Number(entry?.sl))
          || (originalTileId === "entrance" ? fallbackTileSet.entranceTileId : "")
          || (fallbackTileSet.tileIds.includes(originalTileId) ? originalTileId : "");
        if (!mappedTileId) return null;
        return {
          ...entry,
          i: mappedTileId,
        };
      })
      .filter(Boolean),
    b: (payload?.b || [])
      .map((entry) => {
        const fallbackBossId = fallbackTileSet.bossIds[Number(entry?.bi)] || fallbackTileSet.bossIds[0] || "";
        if (!fallbackBossId) return null;
        return {
          ...entry,
          k: buildBossAssetKey(fallbackTileSet.id, fallbackBossId),
        };
      })
      .filter(Boolean),
  };
}
