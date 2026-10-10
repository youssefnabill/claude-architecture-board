#!/usr/bin/env bash
# Render an architecture-board HTML file to PDF + per-page PNGs + Mermaid, with layout warnings.
# Usage: render.sh board.html board.pdf
# Needs Node.js (preferred). Uses an installed Chrome/Chromium/Edge if present,
# otherwise downloads Playwright's Chromium once into the cache directory.
set -euo pipefail
[ $# -eq 2 ] || { echo "usage: $0 board.html board.pdf" >&2; exit 2; }
HERE="$(cd "$(dirname "$0")" && pwd)"
DEPS="${XDG_CACHE_HOME:-$HOME/.cache}/architecture-board"
PW_VERSION="1.52.0"

CHROME=""
for c in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
         "/Applications/Chromium.app/Contents/MacOS/Chromium" \
         "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" \
         "$(command -v google-chrome || true)" "$(command -v google-chrome-stable || true)" \
         "$(command -v chromium || true)" "$(command -v chromium-browser || true)"; do
  [ -n "$c" ] && [ -x "$c" ] && CHROME="$c" && break
done

if command -v node >/dev/null && command -v npm >/dev/null; then
  if [ ! -f "$DEPS/node_modules/playwright-core/package.json" ]; then
    mkdir -p "$DEPS"
    npm install --prefix "$DEPS" --silent --no-audit --no-fund "playwright-core@$PW_VERSION" >&2
  fi
  if [ -z "$CHROME" ]; then
    node "$DEPS/node_modules/playwright-core/cli.js" install chromium >&2
  fi
  AB_DEPS="$DEPS" AB_CHROME="$CHROME" node "$HERE/render.mjs" "$1" "$2"
  exit
fi

# Fallback without Node: Chrome CLI gives the PDF; previews need pdftoppm (poppler).
[ -n "$CHROME" ] || { echo "Need Node.js (recommended) or Chrome/Chromium installed." >&2; exit 1; }
IN="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="$2" "file://$IN" 2>/dev/null
echo "PDF: $2"
if command -v pdftoppm >/dev/null; then
  pdftoppm -png -r 110 "$2" "${2%.pdf}-page" && echo "PNGs: ${2%.pdf}-page-*.png"
else
  echo "WARNING: no Node.js and no pdftoppm, so no PNG previews or layout checks. Install Node.js or poppler." >&2
fi
