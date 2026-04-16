/**
 * Release helper — bumps version, builds web deploy, syncs configs, commits, tags, and pushes.
 *
 * Usage:
 *   npm run release -- patch    # 0.8.0 → 0.8.1
 *   npm run release -- minor    # 0.8.0 → 0.9.0
 *   npm run release -- major    # 0.8.0 → 1.0.0
 *   npm run release -- 1.2.3    # set an exact version
 *   npm run release -- web      # build web app only (no version bump, no release)
 *
 * What it does (full release):
 *   1. Bumps the version in package.json
 *   2. Syncs the version to tauri.conf.json and Cargo.toml
 *   3. Builds a deploy-ready web app in dist/web/ (version + changelog injected)
 *   4. Commits everything, tags, and pushes
 *   5. GitHub Actions builds signed desktop installers and creates a draft release
 *   6. Builds local DMG via DMG Canvas and uploads it to the draft release
 *
 * After it finishes:
 *   - Upload dist/web/ to your web server
 *   - Go to GitHub Releases to review and publish the draft desktop release
 */
import { readFile, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function run(cmd) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

function bumpVersion(current, bump) {
  const [major, minor, patch] = current.split(".").map(Number);
  switch (bump) {
    case "patch": return `${major}.${minor}.${patch + 1}`;
    case "minor": return `${major}.${minor + 1}.0`;
    case "major": return `${major + 1}.0.0`;
    default: {
      if (/^\d+\.\d+\.\d+$/.test(bump)) return bump;
      throw new Error(`Invalid bump: "${bump}". Use patch, minor, major, or an exact version like 1.2.3`);
    }
  }
}

function getCommitsSinceLastTag() {
  try {
    const lastTag = execSync("git describe --tags --abbrev=0", { encoding: "utf8" }).trim();
    return execSync(`git log ${lastTag}..HEAD --pretty=format:"- %s"`, { encoding: "utf8" }).trim();
  } catch {
    // No tags yet — get all commits
    return execSync('git log --pretty=format:"- %s"', { encoding: "utf8" }).trim();
  }
}

function prependChangelog(version, commits) {
  const date = new Date().toISOString().slice(0, 10);
  const header = `## v${version} (${date})`;
  const section = commits ? `${header}\n${commits}` : header;

  let existing = "";
  try { existing = readFileSync("CHANGELOG.md", "utf8"); } catch {}

  const marker = "# Changelog";
  if (existing.startsWith(marker)) {
    return `${marker}\n\n${section}\n${existing.slice(marker.length)}`;
  }
  return `${marker}\n\n${section}\n\n${existing}`;
}

const args = process.argv.slice(2);
const webOnly = args.includes("web") || args.includes("--web");
const bump = args.find(a => !a.startsWith("--") && a !== "web");

// --web: just build the web app with current version, no release
if (webOnly) {
  console.log("\nBuilding web app (no version bump, no release)...\n");
  run("npm run build:web");
  console.log("\nDone! Web app built to dist/web/\n");
  process.exit(0);
}

if (!bump) {
  console.error("Usage: npm run release -- <patch|minor|major|x.y.z>");
  console.error("       npm run release -- web     (build web only)");
  process.exit(1);
}

const pkg = JSON.parse(await readFile("package.json", "utf8"));
const currentVersion = pkg.version;
const nextVersion = bumpVersion(currentVersion, bump);

console.log(`\nBumping version: ${currentVersion} → ${nextVersion}\n`);

// 1. Collect changelog from commits since last tag
const commits = getCommitsSinceLastTag();
console.log("Changelog entries:");
console.log(commits || "  (no commits)");
console.log();

// 2. Update package.json
pkg.version = nextVersion;
await writeFile("package.json", `${JSON.stringify(pkg, null, 2)}\n`);

// 3. Prepend changelog section
const updatedChangelog = prependChangelog(nextVersion, commits);
await writeFile("CHANGELOG.md", updatedChangelog);
console.log("Updated CHANGELOG.md\n");

// 4. Sync to tauri.conf.json and Cargo.toml
run("npm run sync:version");

// 5. Build deploy-ready web app in dist/web/
run("npm run build:web");

// 6. Commit the version bump + changelog
run("git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml src-tauri/Cargo.lock CHANGELOG.md");
run(`git commit -m "Release v${nextVersion}"`);

// 7. Tag and push — triggers GitHub Actions release workflow
run(`git tag v${nextVersion}`);
run("git push && git push --tags");

console.log(`\nv${nextVersion} pushed. GitHub Actions is building updater artifacts...`);

// 8. Build local DMG and upload to the draft release
console.log("\nBuilding local DMG via DMG Canvas...\n");
const buildScript = resolve(__dirname, "build-release.sh");
run(`"${buildScript}" --upload`);

console.log(`\nDone! v${nextVersion} released.\n`);
console.log("Next steps:");
console.log(`  1. Upload dist/web/ to your web server`);
console.log(`  2. Go to GitHub Releases to review and publish the draft desktop release\n`);
