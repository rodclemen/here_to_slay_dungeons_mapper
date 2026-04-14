import { access, cp, mkdir, readFile, readdir, rm, rename, stat, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const outputDir = join("dist", "tauri");
const stagingDir = join("dist", ".tauri-staging");
const versionPlaceholder = "__APP_VERSION__";
const changelogPlaceholder = "__CHANGELOG_CONTENT__";

const runtimeEntries = [
  "index.html",
  "about.html",
  "changelog.html",
  "CHANGELOG.md",
  "download.html",
  "download.php",
  "download-stats.php",
  "pdf-export.html",
  "qa-checks.html",
  "qa-checks-bridge.html",
  "app.js",
  "styles.css",
  "modules",
  "Graphics",
  "icons",
  "tiles",
];

await rm(stagingDir, { recursive: true, force: true });
await mkdir(stagingDir, { recursive: true });

for (const entry of runtimeEntries) {
  await cp(entry, join(stagingDir, entry), { recursive: true });
}

console.log(`Copied ${runtimeEntries.length} runtime entries to ${stagingDir}`);

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const appVersion = packageJson.version;
const changelogMarkdown = await readFile("CHANGELOG.md", "utf8");

function extractPublicChangelog(markdown) {
  const source = String(markdown || "").replace(/\r\n/g, "\n");
  const lines = source.split("\n");
  const collected = [];
  let includeSection = false;

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.*)$/);
    if (headingMatch) {
      includeSection = /^v\d+\.\d+\.\d+/.test(headingMatch[1].trim());
    }

    if (includeSection) {
      collected.push(line);
    }
  }

  return collected.join("\n").trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function formatInlineMarkdown(text) {
  return escapeHtml(text).replace(/`([^`]+)`/g, "<code>$1</code>");
}

function renderMarkdownToHtml(markdown) {
  const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
  const chunks = [];
  let listItems = [];
  let paragraphLines = [];

  function flushList() {
    if (!listItems.length) return;
    chunks.push(`<ul>${listItems.map((item) => `<li>${formatInlineMarkdown(item)}</li>`).join("")}</ul>`);
    listItems = [];
  }

  function flushParagraph() {
    if (!paragraphLines.length) return;
    chunks.push(`<p>${formatInlineMarkdown(paragraphLines.join(" "))}</p>`);
    paragraphLines = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      flushParagraph();
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushList();
      flushParagraph();
      const level = headingMatch[1].length;
      chunks.push(`<h${level}>${formatInlineMarkdown(headingMatch[2])}</h${level}>`);
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      listItems.push(line.slice(2).trim());
      continue;
    }

    flushList();
    paragraphLines.push(line);
  }

  flushList();
  flushParagraph();

  return chunks.join("\n");
}

const publicChangelogMarkdown = extractPublicChangelog(changelogMarkdown);
const changelogHtml = renderMarkdownToHtml(publicChangelogMarkdown);

async function injectVersion(filePath) {
  const source = await readFile(filePath, "utf8");
  const nextSource = source
    .replaceAll(versionPlaceholder, appVersion)
    .replaceAll(changelogPlaceholder, changelogHtml);
  if (nextSource === source) return;
  await writeFile(filePath, nextSource);
}

await injectVersion(join(stagingDir, "about.html"));
await injectVersion(join(stagingDir, "changelog.html"));
await injectVersion(join(stagingDir, "download.html"));

async function findLocalEsbuild() {
  const isWindows = process.platform === "win32";
  const candidates = [
    join("node_modules", ".bin", isWindows ? "esbuild.cmd" : "esbuild"),
    join("node_modules", "esbuild", "bin", "esbuild"),
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Keep trying the remaining local candidates.
    }
  }

  return null;
}

const esbuildPath = await findLocalEsbuild();

if (!esbuildPath) {
  console.log("Local esbuild not found; skipping minification.");
}

// ── Minify JS and CSS ─────────────────────────────────────────────
// If a local esbuild binary is available, minify each file individually
// (no bundling) so the browser can still resolve ES module imports.

async function collectFiles(dir, ext) {
  const results = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await collectFiles(fullPath, ext));
    } else if (entry.name.endsWith(ext)) {
      results.push(fullPath);
    }
  }
  return results;
}

const jsFiles = [
  join(stagingDir, "app.js"),
  ...await collectFiles(join(stagingDir, "modules"), ".js"),
];
const cssFiles = [join(stagingDir, "styles.css")];
const allFiles = [...jsFiles, ...cssFiles];

let totalBefore = 0;
let totalAfter = 0;

for (const filePath of allFiles) {
  const before = (await stat(filePath)).size;
  totalBefore += before;

  if (esbuildPath) {
    const useShell = process.platform === "win32" && esbuildPath.endsWith(".cmd");
    await execFileAsync(esbuildPath, [
      filePath,
      "--minify",
      `--outfile=${filePath}`,
      "--allow-overwrite",
    ], useShell ? { shell: true } : {});
  }

  const after = (await stat(filePath)).size;
  totalAfter += after;
}

if (esbuildPath) {
  const saved = totalBefore - totalAfter;
  const pct = ((saved / totalBefore) * 100).toFixed(1);
  console.log(
    `Minified ${allFiles.length} files: ${(totalBefore / 1024).toFixed(0)} KB → ${(totalAfter / 1024).toFixed(0)} KB (${pct}% smaller)`,
  );
} else {
  console.log(`Copied ${allFiles.length} files without minification.`);
}

await rm(outputDir, { recursive: true, force: true });
await rename(stagingDir, outputDir);

console.log(`Published finished Tauri web assets to ${outputDir}`);
