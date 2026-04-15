/**
 * Release helper — bumps version, syncs configs, commits, tags, and pushes.
 *
 * Usage:
 *   npm run release -- patch    # 0.8.0 → 0.8.1
 *   npm run release -- minor    # 0.8.0 → 0.9.0
 *   npm run release -- major    # 0.8.0 → 1.0.0
 *   npm run release -- 1.2.3    # set an exact version
 */
import { readFile, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";

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

const bump = process.argv[2];
if (!bump) {
  console.error("Usage: npm run release -- <patch|minor|major|x.y.z>");
  process.exit(1);
}

const pkg = JSON.parse(await readFile("package.json", "utf8"));
const currentVersion = pkg.version;
const nextVersion = bumpVersion(currentVersion, bump);

console.log(`\nBumping version: ${currentVersion} → ${nextVersion}\n`);

// 1. Update package.json
pkg.version = nextVersion;
await writeFile("package.json", `${JSON.stringify(pkg, null, 2)}\n`);

// 2. Sync to tauri.conf.json and Cargo.toml
run("npm run sync:version");

// 3. Commit the version bump
run("git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml");
run(`git commit -m "Bump version to ${nextVersion}"`);

// 4. Tag and push
run(`git tag v${nextVersion}`);
run("git push && git push --tags");

console.log(`\nDone! v${nextVersion} tagged and pushed.`);
console.log("The release workflow will build, sign, and create a draft release on GitHub.");
console.log("Go to GitHub Releases to review and publish it.\n");
