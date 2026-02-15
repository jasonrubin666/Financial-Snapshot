# Financial Snapshot – Desktop App

A lightweight Electron wrapper that turns your Financial Snapshot HTML dashboard into a standalone macOS app. No terminal, no server, no rebuilds when you update your data.

## How It Works

The app opens a window and loads your `financial-snapshot.html` directly from your Dropbox directory. It uses a custom protocol (`app://`) to serve files from that folder, including generating directory listings so your CSV auto-discovery logic works exactly as before. Your CSVs and HTML stay external — update them anytime and just reload the app.

## One-Time Setup

### 1. Install Node.js (if you don't have it)

Check: `node --version` in Terminal. If it's not installed, grab it from https://nodejs.org (LTS version).

### 2. Install dependencies

```bash
cd /path/to/financial-snapshot-app
npm install
```

### 3. Test it

```bash
npm start
```

This launches the app in dev mode. On first launch, it auto-detects your Dropbox directory. If it can't find it, a folder picker dialog will appear — just point it at the folder containing your HTML and CSV files.

### 4. Build the .app

```bash
npm run make
```

This creates the `.app` bundle in `out/Financial Snapshot-darwin-arm64/` (or `x64` on Intel Macs). Drag it to your Applications folder. Done.

## Daily Workflow

1. Download updated CSVs from Monarch Money into your Dropbox folder (same as always).
2. Click the Financial Snapshot icon in your Dock.
3. That's it. The app reads the latest files every time.

To refresh data while the app is open: **Cmd+R** (or View → Reload).

## Menu Options

- **Financial Snapshot → Change Data Folder…** — pick a different directory if you move your files.
- **Financial Snapshot → Open Data Folder in Finder** — quick access to your CSVs.
- **View → Toggle Developer Tools** — for debugging if needed.

## Updating the HTML

Keep editing `financial-snapshot.html` in Cursor as usual. The Electron app loads it fresh from disk every time — no rebuild needed. The only reason to rebuild the `.app` is if you want to change the app wrapper itself (icon, window size, menu items, etc.).

## Custom App Icon (Optional)

To add a custom icon:

1. Create or find a `.icns` file (macOS icon format).
2. Save it as `icon.icns` in this project folder.
3. Rebuild with `npm run make`.

## Troubleshooting

**"Cannot find module electron"** — Run `npm install` first.

**App shows blank screen** — Check that your Dropbox directory has the HTML file. Use the menu to verify/change the data folder.

**External data not loading (CPI, Fed Rate, etc.)** — These come from FRED/BLS APIs and require an internet connection. The rest of the app works offline.

**Config location** — Settings are stored at `~/Library/Application Support/Financial Snapshot/config.json`. Delete this file to reset.
