import { access, cp, mkdir, readdir, rm, rename, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const outputDir = join("dist", "tauri");
const stagingDir = join("dist", ".tauri-staging");

const runtimeEntries = [
  "index.html",
  "about.html",
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

async function findLocalEsbuild() {
  const candidates = [
    join("node_modules", ".bin", "esbuild"),
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
    await execFileAsync(esbuildPath, [
      filePath,
      "--minify",
      `--outfile=${filePath}`,
      "--allow-overwrite",
    ]);
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
