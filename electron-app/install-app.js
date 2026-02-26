#!/usr/bin/env node
// Copies the built .app to /Applications so the Dock/spotlight app is updated.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const src = path.join(__dirname, 'out', 'Financial Snapshot-darwin-arm64', 'Financial Snapshot.app');
const dest = path.join('/Applications', 'Financial Snapshot.app');

if (!fs.existsSync(src)) {
  console.error('Built app not found. Run: npm run make');
  process.exit(1);
}
execSync(`rm -rf "${dest}" && cp -R "${src}" "${dest}"`, { stdio: 'inherit' });
console.log('Installed to /Applications/Financial Snapshot.app');
