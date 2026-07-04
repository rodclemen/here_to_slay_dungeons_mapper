#!/bin/bash
set -euo pipefail

# Generate the macOS app-icon asset catalog (Assets.car + AppIcon.icns) from the
# source artwork, reshaped to Apple's native icon template.
#
# WHY: A macOS .app can declare its icon two ways — the legacy loose AppIcon.icns
# (CFBundleIconFile) or the modern compiled asset catalog Assets.car
# (CFBundleIconName). Finder/IconServices prefer the asset-catalog path and cache
# aggressively; with only the legacy path present, Finder draws a stale/inset
# ("smaller", gray-field) icon while the Dock looks correct. Shipping a compiled
# Assets.car + setting CFBundleIconName fixes it.
#
# Native macOS icons fill ~82.9% of the canvas as a rounded-rect (squircle) on a
# transparent background (measured off Notes.app — not guessed). Our source art is
# already a transparent squircle, so we normalize it to exactly 82.9% (uniform
# crop-to-content + rescale, which preserves the existing corners) rather than
# re-masking.
#
# Run this whenever the source artwork changes. Outputs are committed so normal
# `tauri build` (local + CI) picks them up via bundle.resources + Info.plist.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ICONS_DIR="$PROJECT_DIR/src-tauri/icons"
SOURCE="${1:-$ICONS_DIR/icon.png}"          # 1024x1024 transparent squircle source
APPICONSET="$ICONS_DIR/AppIcon.appiconset"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

CANVAS=1024
FILL_RATIO=0.829                            # native macOS fill (Notes.app)
BODY=$(printf '%.0f' "$(echo "$CANVAS * $FILL_RATIO" | bc -l)")   # ~849

echo "==> Reshaping $SOURCE to ${FILL_RATIO} template (body ${BODY}px on ${CANVAS}px canvas)..."

# Crop the source to its opaque bounding box, scale that to $BODY px on the longest
# side, and center it on a transparent $CANVAS x $CANVAS canvas.
NORMALIZED="$WORK/icon_normalized.png"
cat > "$WORK/reshape.swift" <<SWIFT
import AppKit
let args = CommandLine.arguments
let src = args[1], dst = args[2]
let canvas = CGFloat(Int(args[3])!), body = CGFloat(Int(args[4])!)

guard let img = NSImage(contentsOfFile: src),
      let tiff = img.tiffRepresentation,
      let rep = NSBitmapImageRep(data: tiff) else { fputs("cannot read \(src)\n", stderr); exit(1) }
let w = rep.pixelsWide, h = rep.pixelsHigh
var minX = w, minY = h, maxX = 0, maxY = 0
for y in 0..<h { for x in 0..<w {
    if let c = rep.colorAt(x: x, y: y), c.alphaComponent > 0.02 {
        if x < minX { minX = x }; if x > maxX { maxX = x }
        if y < minY { minY = y }; if y > maxY { maxY = y }
    }
}}
let bw = maxX - minX + 1, bh = maxY - minY + 1
let scale = body / CGFloat(max(bw, bh))
let dw = CGFloat(bw) * scale, dh = CGFloat(bh) * scale

let outW = Int(canvas), outH = Int(canvas)
guard let out = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: outW, pixelsHigh: outH,
        bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
        colorSpaceName: .deviceRGB, bytesPerRow: outW * 4, bitsPerPixel: 32) else { exit(1) }
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: out)
NSGraphicsContext.current?.imageInterpolation = .high
// Source rect in the flipped bitmap rep: NSBitmapImageRep origin is top-left, but
// draw(in:from:) treats the rep coordinate space bottom-up, so flip minY.
let srcRect = NSRect(x: minX, y: h - maxY - 1, width: bw, height: bh)
let dstRect = NSRect(x: (canvas - dw) / 2, y: (canvas - dh) / 2, width: dw, height: dh)
rep.draw(in: dstRect, from: srcRect, operation: .copy, fraction: 1.0,
         respectFlipped: false, hints: [.interpolation: NSNumber(value: NSImageInterpolation.high.rawValue)])
NSGraphicsContext.restoreGraphicsState()
guard let png = out.representation(using: .png, properties: [:]) else { exit(1) }
try! png.write(to: URL(fileURLWithPath: dst))
SWIFT
swift "$WORK/reshape.swift" "$SOURCE" "$NORMALIZED" "$CANVAS" "$BODY"

echo "==> Generating PNG sizes..."
rm -rf "$APPICONSET"
mkdir -p "$APPICONSET"
for size in 16 32 64 128 256 512 1024; do
    sips -z "$size" "$size" "$NORMALIZED" --out "$APPICONSET/icon_${size}.png" >/dev/null
done

echo "==> Writing Contents.json..."
cat > "$APPICONSET/Contents.json" <<'JSON'
{ "images":[
  {"idiom":"mac","size":"16x16","scale":"1x","filename":"icon_16.png"},
  {"idiom":"mac","size":"16x16","scale":"2x","filename":"icon_32.png"},
  {"idiom":"mac","size":"32x32","scale":"1x","filename":"icon_32.png"},
  {"idiom":"mac","size":"32x32","scale":"2x","filename":"icon_64.png"},
  {"idiom":"mac","size":"128x128","scale":"1x","filename":"icon_128.png"},
  {"idiom":"mac","size":"128x128","scale":"2x","filename":"icon_256.png"},
  {"idiom":"mac","size":"256x256","scale":"1x","filename":"icon_256.png"},
  {"idiom":"mac","size":"256x256","scale":"2x","filename":"icon_512.png"},
  {"idiom":"mac","size":"512x512","scale":"1x","filename":"icon_512.png"},
  {"idiom":"mac","size":"512x512","scale":"2x","filename":"icon_1024.png"}
], "info":{"author":"xcode","version":1} }
JSON

echo "==> Compiling asset catalog with actool..."
# Emits Assets.car + AppIcon.icns into ICONS_DIR; both are committed and copied into
# the bundle Resources via tauri.conf.json `bundle.resources`.
mkdir -p "$WORK/xcassets/AppIcon.appiconset"
cp "$APPICONSET"/*.png "$APPICONSET/Contents.json" "$WORK/xcassets/AppIcon.appiconset/"
xcrun actool "$WORK/xcassets" \
    --compile "$ICONS_DIR" \
    --app-icon AppIcon --platform macosx \
    --minimum-deployment-target 13.0 \
    --output-partial-info-plist "$WORK/partial.plist" \
    --errors --warnings >/dev/null

echo ""
echo "Done. Generated:"
echo "  $ICONS_DIR/Assets.car"
echo "  $ICONS_DIR/AppIcon.icns"
echo "  $APPICONSET/ (source PNGs + Contents.json)"
