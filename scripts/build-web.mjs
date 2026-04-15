/**
 * Builds a deploy-ready copy of the web app in dist/web/.
 * Replaces __APP_VERSION__ and __CHANGELOG_CONTENT__ placeholders
 * in about.html, changelog.html, and download.html.
 *
 * After running, upload the contents of dist/web/ to your server.
 */
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const outputDir = join("dist", "web");
const versionPlaceholder = "__APP_VERSION__";
const changelogPlaceholder = "__CHANGELOG_CONTENT__";

const entries = [
  "index.html",
  "about.html",
  "changelog.html",
  "download.html",
  "download.php",
  "download-stats.php",
  "pdf-export.html",
  "app.js",
  "styles.css",
  "modules",
  "Graphics",
  "icons",
  "tiles",
];

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

// Read version and changelog
const pkg = JSON.parse(await readFile("package.json", "utf8"));
const appVersion = pkg.version;
const changelogMarkdown = await readFile("CHANGELOG.md", "utf8");
const publicChangelog = extractPublicChangelog(changelogMarkdown);
const changelogHtml = renderMarkdownToHtml(publicChangelog);

// Clean and copy
await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

for (const entry of entries) {
  await cp(entry, join(outputDir, entry), { recursive: true });
}

// Inject version and changelog into HTML files
const filesToInject = ["about.html", "changelog.html", "download.html"];

for (const file of filesToInject) {
  const filePath = join(outputDir, file);
  const source = await readFile(filePath, "utf8");
  const injected = source
    .replaceAll(versionPlaceholder, appVersion)
    .replaceAll(changelogPlaceholder, changelogHtml);
  if (injected !== source) {
    await writeFile(filePath, injected);
  }
}

console.log(`Built web app v${appVersion} in ${outputDir}/`);
console.log("Upload the contents of that folder to your server.");
