import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const outputDir = join("dist", "tauri");

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

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

for (const entry of runtimeEntries) {
  await cp(entry, join(outputDir, entry), { recursive: true });
}

console.log(`Copied ${runtimeEntries.length} runtime entries to ${outputDir}`);
