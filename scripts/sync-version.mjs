import { readFile, writeFile } from "node:fs/promises";

const packageJsonPath = "package.json";
const tauriConfigPath = "src-tauri/tauri.conf.json";
const cargoTomlPath = "src-tauri/Cargo.toml";

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function replaceCargoVersion(source, version) {
  return source.replace(
    /^version = ".*"$/m,
    `version = "${version}"`,
  );
}

async function main() {
  const packageJson = await readJson(packageJsonPath);
  const version = packageJson.version;

  if (!version || typeof version !== "string") {
    throw new Error("package.json is missing a valid version string.");
  }

  const tauriConfig = await readJson(tauriConfigPath);
  if (tauriConfig.version !== version) {
    tauriConfig.version = version;
    await writeFile(tauriConfigPath, `${JSON.stringify(tauriConfig, null, 2)}\n`);
  }

  const cargoToml = await readFile(cargoTomlPath, "utf8");
  const nextCargoToml = replaceCargoVersion(cargoToml, version);
  if (nextCargoToml !== cargoToml) {
    await writeFile(cargoTomlPath, nextCargoToml);
  }

  console.log(`Synced app version ${version} to Tauri config and Cargo manifest.`);
}

await main();
