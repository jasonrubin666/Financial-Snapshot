#!/usr/bin/env bash
# Build the Financial Snapshot Electron app and install it to /Applications.
# Run from the project root: ./build-and-install-app.sh
# Or: cd electron-app && npm run update

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/electron-app"

echo "Building Financial Snapshot app..."
npm run make

APP_SRC="$SCRIPT_DIR/electron-app/out/Financial Snapshot-darwin-arm64/Financial Snapshot.app"
APP_DEST="/Applications/Financial Snapshot.app"

if [[ ! -d "$APP_SRC" ]]; then
  echo "Build failed: $APP_SRC not found."
  exit 1
fi

echo "Installing to $APP_DEST..."
rm -rf "$APP_DEST"
cp -R "$APP_SRC" "$APP_DEST"
echo "Done. Financial Snapshot is updated in Applications (and in your Dock if you added it there)."
