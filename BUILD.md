# Building and updating the Financial Snapshot app

When you change the Electron wrapper (e.g. `electron-app/main.js`) or want to refresh the app in Applications/Dock, build and install in one step:

## Option 1: From project root (easiest)

```bash
./build-and-install-app.sh
```

## Option 2: From electron-app

```bash
cd electron-app
npm run update
```

`npm run update` = build (`make`) + copy to `/Applications/Financial Snapshot.app`. Your Dock icon will then launch the updated app.

## When to run

- After editing anything in `electron-app/` (main.js, preload.js, package.json, icon).
- After pulling repo changes that touch the Electron app.
- You do **not** need to rebuild when you only change `financial-snapshot.html` or your CSVs; the app loads those from disk each time.

## Scripts reference (in electron-app)

| Command | What it does |
|--------|----------------|
| `npm start` | Run the app in dev mode (no install). |
| `npm run make` | Build the .app (and DMG) only. |
| `npm run install-app` | Copy the already-built .app to /Applications. |
| `npm run update` | make + install-app. |
