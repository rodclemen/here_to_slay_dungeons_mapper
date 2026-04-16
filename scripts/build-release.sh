#!/bin/bash
set -euo pipefail

# Build release: Tauri app + updater artifacts + custom DMG via DMG Canvas
#
# Prerequisites:
#   - TAURI_SIGNING_PRIVATE_KEY or TAURI_SIGNING_PRIVATE_KEY_PATH must be set
#   - DMG Canvas must be installed with CLI tool linked at /usr/local/bin/dmgcanvas

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATE="$PROJECT_DIR/gfx/template.dmgcanvas"
APP_BUNDLE="$PROJECT_DIR/src-tauri/target/release/bundle/macos/HtSDMapper.app"
DMG_OUTPUT="$PROJECT_DIR/src-tauri/target/release/bundle/dmg/HtSDMapper.dmg"

# Default to key file if env var not set
if [ -z "${TAURI_SIGNING_PRIVATE_KEY:-}" ] && [ -z "${TAURI_SIGNING_PRIVATE_KEY_PATH:-}" ]; then
    export TAURI_SIGNING_PRIVATE_KEY_PATH="$HOME/.tauri/signing-key.key"
    echo "Using signing key from $TAURI_SIGNING_PRIVATE_KEY_PATH"
fi

# Filter out --upload from args passed to tauri build
TAURI_ARGS=()
for arg in "$@"; do
    [[ "$arg" != "--upload" ]] && TAURI_ARGS+=("$arg")
done

echo "==> Building Tauri app + updater artifacts..."
cd "$PROJECT_DIR"
npx tauri build "${TAURI_ARGS[@]}"

if [ ! -d "$APP_BUNDLE" ]; then
    echo "Error: App bundle not found at $APP_BUNDLE"
    exit 1
fi

echo "==> Building DMG with DMG Canvas..."
mkdir -p "$(dirname "$DMG_OUTPUT")"
dmgcanvas "$TEMPLATE" "$DMG_OUTPUT" \
    -setFilePath "HtSDMapper.app" "$APP_BUNDLE"

echo ""
echo "Build complete!"
echo "  App:     $APP_BUNDLE"
echo "  DMG:     $DMG_OUTPUT"
echo "  Updater: $PROJECT_DIR/src-tauri/target/release/bundle/macos/HtSDMapper.app.tar.gz"
echo "  Sig:     $PROJECT_DIR/src-tauri/target/release/bundle/macos/HtSDMapper.app.tar.gz.sig"

# Upload DMG to GitHub release if --upload flag is passed
if [[ " $* " == *" --upload "* ]]; then
    VERSION=$(grep '"version"' "$PROJECT_DIR/src-tauri/tauri.conf.json" | head -1 | sed 's/.*: *"\(.*\)".*/\1/')
    TAG="v$VERSION"
    echo ""
    echo "==> Uploading DMG to GitHub release $TAG..."
    gh release upload "$TAG" "$DMG_OUTPUT" --clobber
    echo "Done! DMG uploaded to release $TAG."
    echo "Don't forget to publish the draft release when ready."
fi
