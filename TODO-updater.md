# Auto-Updater — Status & Next Steps

## What was done
- Tauri auto-updater plugin installed and configured (backend + frontend)
- Release workflow (`.github/workflows/release.yml`) builds macOS + Windows on `v*` tag push
- One-command release: `npm run release -- patch|minor|major|x.y.z`
- Web deploy builder: `npm run build:web` (outputs `dist/web/`)

## Root cause fix (2026-04-16)
`latest.json` was never generated because `tauri.conf.json` was missing `"createUpdaterArtifacts": true`. Without it, no `.sig` files were produced, so `tauri-action` skipped updater JSON. Fixed and simplified the workflow from 188 to 54 lines.

## Next steps
1. Check if the v0.8.2 CI run passed: `gh run list --workflow=release.yml`
2. If passed — check the draft release on GitHub for `latest.json`
3. Merge `UpdateApp` branch into `main`
4. Publish the draft release on GitHub
5. Test end-to-end: install v0.8.2, release v0.8.3, verify in-app update works

## Key files
- `.github/workflows/release.yml` — release CI
- `src-tauri/tauri.conf.json` — updater config
- `app.js` (~line 2863) — `checkForAppUpdate()`
- `scripts/release.mjs` — release script
- `scripts/build-web.mjs` — web deploy builder

## Branch
`UpdateApp`, version 0.8.2

---
*Delete this file once the updater is verified and merged.*
