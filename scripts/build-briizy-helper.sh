#!/usr/bin/env bash
#
# Build the briizy capture/OCR helper (PLAN-BRIIZY.md §7).
#
# swiftc directly — no Xcode project, no Swift package. One source file in,
# one unsigned arm64 binary out, dropped in electron/bin/ (gitignored) and
# rebuilt at postinstall. The helper is a supervised child process (I5), so it
# needs no bundle, no Info.plist, and no separate code signature: Screen
# Recording TCC attaches to the responsible parent (Electron in dev, the
# briizOS app bundle when packaged).
#
# Skips silently on non-macOS so `npm install` stays portable.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/electron/briizy-helper/BriizyHelper.swift"
OUT_DIR="$ROOT/electron/bin"
OUT="$OUT_DIR/briizy-helper"
# ScreenCaptureKit's SCScreenshotManager is macOS 14+; that is the floor the
# plan sets (§3) and the helper refuses to run below it.
DEPLOYMENT_TARGET="14.0"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "[build-briizy-helper] not macOS — skipping (screen capture is macOS-only)"
  exit 0
fi

if ! command -v swiftc >/dev/null 2>&1; then
  echo "[build-briizy-helper] swiftc not found — skipping."
  echo "[build-briizy-helper] Install the Xcode command line tools (xcode-select --install)"
  echo "[build-briizy-helper] then re-run: npm run helper:build"
  exit 0
fi

if [[ ! -f "$SRC" ]]; then
  echo "[build-briizy-helper] source missing: $SRC" >&2
  exit 1
fi

# Skip the rebuild when the binary is newer than its source — postinstall runs
# on every npm install and swiftc -O takes a few seconds.
if [[ "${FORCE:-0}" != "1" && -x "$OUT" && "$OUT" -nt "$SRC" ]]; then
  echo "[build-briizy-helper] up to date: $OUT"
  exit 0
fi

ARCH="$(uname -m)"
mkdir -p "$OUT_DIR"

echo "[build-briizy-helper] compiling $ARCH helper (macOS $DEPLOYMENT_TARGET+)"
swiftc \
  -O \
  -target "${ARCH}-apple-macos${DEPLOYMENT_TARGET}" \
  -framework ScreenCaptureKit \
  -framework Vision \
  -framework AppKit \
  -framework ImageIO \
  -o "$OUT" \
  "$SRC"

chmod +x "$OUT"
echo "[build-briizy-helper] built $OUT ($(du -h "$OUT" | cut -f1))"
