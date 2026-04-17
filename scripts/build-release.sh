#!/bin/bash
set -euo pipefail

# Build release: Tauri app + updater artifacts + signed/notarized DMG via DMG Canvas
#
# Prerequisites:
#   - TAURI_SIGNING_PRIVATE_KEY or key file at ~/.tauri/signing-key.key
#   - Developer ID Application certificate installed in keychain
#   - Notarization credentials stored: xcrun notarytool store-credentials "HtSDMapper-notarize"
#   - DMG Canvas installed with CLI tool linked at /usr/local/bin/dmgcanvas

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATE="$PROJECT_DIR/gfx/template.dmgcanvas"
APP_BUNDLE="$PROJECT_DIR/src-tauri/target/release/bundle/macos/HtSDMapper.app"
DMG_OUTPUT="$PROJECT_DIR/src-tauri/target/release/bundle/dmg/HtSDMapper.dmg"
SIGNING_IDENTITY="Developer ID Application: Rod Clemen (2S5TWMXL9G)"
NOTARIZE_PROFILE="HtSDMapper-notarize"

# Load signing key from file if env var not set
if [ -z "${TAURI_SIGNING_PRIVATE_KEY:-}" ]; then
    KEY_FILE="${TAURI_SIGNING_PRIVATE_KEY_PATH:-$HOME/.tauri/signing-key.key}"
    if [ -f "$KEY_FILE" ]; then
        export TAURI_SIGNING_PRIVATE_KEY="$(cat "$KEY_FILE")"
        echo "Using signing key from $KEY_FILE"
    else
        echo "Error: No signing key found. Set TAURI_SIGNING_PRIVATE_KEY or place key at $KEY_FILE"
        exit 1
    fi
fi

# Load signing key password from keychain if env var not set
if [ -z "${TAURI_SIGNING_PRIVATE_KEY_PASSWORD:-}" ]; then
    KEYCHAIN_PW="$(security find-generic-password -a "tauri-signing" -s "tauri-signing-key-password" -w 2>/dev/null || true)"
    if [ -n "$KEYCHAIN_PW" ]; then
        export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="$KEYCHAIN_PW"
        echo "Using signing key password from keychain"
    else
        echo "Warning: No signing key password found. Set TAURI_SIGNING_PRIVATE_KEY_PASSWORD or store in keychain."
    fi
fi

# Filter out script flags from args passed to tauri build
TAURI_ARGS=()
APP_ONLY=false
for arg in "$@"; do
    case "$arg" in
        --upload) ;;
        --app-only) APP_ONLY=true ;;
        *) TAURI_ARGS+=("$arg") ;;
    esac
done

echo "==> Building Tauri app + updater artifacts..."
cd "$PROJECT_DIR"
npx tauri build ${TAURI_ARGS[@]+"${TAURI_ARGS[@]}"}

if [ ! -d "$APP_BUNDLE" ]; then
    echo "Error: App bundle not found at $APP_BUNDLE"
    exit 1
fi

# --app-only: stop here, skip code-signing/notarization/DMG/upload
if [ "$APP_ONLY" = "true" ]; then
    echo ""
    echo "Build complete (app only, unsigned)."
    echo "  App:     $APP_BUNDLE"
    echo "  Updater: $PROJECT_DIR/src-tauri/target/release/bundle/macos/HtSDMapper.app.tar.gz"
    echo "  Sig:     $PROJECT_DIR/src-tauri/target/release/bundle/macos/HtSDMapper.app.tar.gz.sig"
    exit 0
fi

# --- Code-sign the .app ---
echo ""
echo "==> Code-signing $APP_BUNDLE..."
codesign --deep --force --options runtime \
    --sign "$SIGNING_IDENTITY" \
    "$APP_BUNDLE"
codesign --verify --deep --strict "$APP_BUNDLE"
echo "Code-signing verified."

# --- Notarize the .app (zip it, submit, wait, staple) ---
echo ""
echo "==> Notarizing app with Apple..."
APP_ZIP="$PROJECT_DIR/src-tauri/target/release/bundle/macos/HtSDMapper.zip"
ditto -c -k --keepParent "$APP_BUNDLE" "$APP_ZIP"

xcrun notarytool submit "$APP_ZIP" \
    --keychain-profile "$NOTARIZE_PROFILE" \
    --wait

echo "==> Stapling notarization ticket..."
xcrun stapler staple "$APP_BUNDLE"
rm -f "$APP_ZIP"
echo "Notarization complete."

# --- Build, sign, and notarize DMG with DMG Canvas ---
# DMG Canvas handles code-signing, notarization, and stapling of the DMG.
# Notarization credentials are configured in the DMG Canvas app preferences.
echo ""
echo "==> Building DMG with DMG Canvas (signing + notarizing)..."
mkdir -p "$(dirname "$DMG_OUTPUT")"
dmgcanvas "$TEMPLATE" "$DMG_OUTPUT" \
    -setFilePath "HtSDMapper.app" "$APP_BUNDLE" \
    -identity "$SIGNING_IDENTITY" \
    -notarizationAppleID "rodclemen@gmail.com" \
    -notarizationPrimaryBundleID "com.rodclemen.heretoslay.mapper"

echo ""
echo "Build complete! (signed + notarized)"
echo "  App:     $APP_BUNDLE"
echo "  DMG:     $DMG_OUTPUT"
echo "  Updater: $PROJECT_DIR/src-tauri/target/release/bundle/macos/HtSDMapper.app.tar.gz"
echo "  Sig:     $PROJECT_DIR/src-tauri/target/release/bundle/macos/HtSDMapper.app.tar.gz.sig"

# Upload DMG to GitHub release if --upload flag is passed
if [[ " $* " == *" --upload "* ]]; then
    VERSION=$(grep '"version"' "$PROJECT_DIR/src-tauri/tauri.conf.json" | head -1 | sed 's/.*: *"\(.*\)".*/\1/')
    TAG="v$VERSION"
    echo ""
    echo "==> Waiting for GitHub release $TAG to exist (CI may still be building)..."
    MAX_WAIT_SECONDS=900
    WAITED=0
    until gh release view "$TAG" >/dev/null 2>&1; do
        if [ "$WAITED" -ge "$MAX_WAIT_SECONDS" ]; then
            echo "Timed out after ${MAX_WAIT_SECONDS}s waiting for release $TAG. Upload the DMG manually:"
            echo "  gh release upload $TAG \"$DMG_OUTPUT\" --clobber"
            exit 1
        fi
        sleep 15
        WAITED=$((WAITED + 15))
        echo "  ...still waiting (${WAITED}s)"
    done
    echo "==> Uploading DMG to GitHub release $TAG..."
    gh release upload "$TAG" "$DMG_OUTPUT" --clobber
    echo "Done! DMG uploaded to release $TAG."
    echo "Don't forget to publish the draft release when ready."
fi
