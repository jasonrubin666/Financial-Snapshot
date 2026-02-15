// main.js – Financial Snapshot Electron wrapper
// Serves your HTML + CSVs from a configurable directory via a custom protocol.
// No embedded HTTP server, no open ports – just local file access.

const { app, BrowserWindow, protocol, dialog, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

// ─── Configuration ────────────────────────────────────────────────────────────
const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function saveConfig(cfg) {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

// Auto-detect well-known paths (customize if your path differs)
function detectDataDir() {
  const home = app.getPath('home');
  const candidates = [
    path.join(home, 'Library/CloudStorage/Dropbox-jasonrubin.com/Jason Rubin/AI/Financial Snapshot'),
    path.join(home, 'Dropbox/Jason Rubin/AI/Financial Snapshot'),
    path.join(home, 'Documents/Financial Snapshot'),
  ];
  return candidates.find(p => {
    try { return fs.statSync(p).isDirectory(); } catch { return false; }
  }) || null;
}

async function getDataDir() {
  const cfg = loadConfig();
  if (cfg.dataDir && fs.existsSync(cfg.dataDir)) return cfg.dataDir;

  const detected = detectDataDir();
  if (detected) {
    saveConfig({ ...cfg, dataDir: detected });
    return detected;
  }

  // Fallback: ask the user to pick the folder
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Select your Financial Snapshot data folder',
    message: 'Choose the folder containing your HTML and CSV files',
    properties: ['openDirectory'],
  });
  if (canceled || !filePaths.length) {
    app.quit();
    return null;
  }
  saveConfig({ ...cfg, dataDir: filePaths[0] });
  return filePaths[0];
}

// ─── Custom Protocol ──────────────────────────────────────────────────────────
// Register the scheme before app is ready (Electron requirement)
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

const MIME_TYPES = {
  '.html': 'text/html',
  '.htm':  'text/html',
  '.css':  'text/css',
  '.js':   'text/javascript',
  '.json': 'application/json',
  '.csv':  'text/csv',
  '.tsv':  'text/tab-separated-values',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.pdf':  'application/pdf',
  '.txt':  'text/plain',
};

function getMime(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

// Generate an HTML directory listing that matches Python's http.server format
// so the existing find*CsvPath() functions in the HTML parse it correctly.
function directoryListingHtml(dirPath, urlPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const links = entries
    .filter(e => !e.name.startsWith('.'))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(e => {
      const name = e.name + (e.isDirectory() ? '/' : '');
      const encoded = encodeURIComponent(e.name) + (e.isDirectory() ? '/' : '');
      return `<li><a href="${encoded}">${name}</a></li>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html><head><title>Directory listing for ${urlPath}</title></head>
<body><h1>Directory listing for ${urlPath}</h1>
<ul>${links}</ul>
</body></html>`;
}

function setupProtocol(dataDir) {
  protocol.handle('app', (request) => {
    const url = new URL(request.url);
    // Decode the path, strip leading slash on Windows-style paths
    let reqPath = decodeURIComponent(url.pathname);

    // Resolve to filesystem path
    const fsPath = path.join(dataDir, reqPath);

    try {
      const stat = fs.statSync(fsPath);
      if (stat.isDirectory()) {
        // Return directory listing HTML
        const html = directoryListingHtml(fsPath, reqPath || '/');
        return new Response(html, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
      // Serve the file
      const data = fs.readFileSync(fsPath);
      return new Response(data, {
        headers: {
          'Content-Type': getMime(fsPath),
          'Cache-Control': 'no-cache',   // always read fresh CSVs
        },
      });
    } catch (err) {
      return new Response(`Not found: ${reqPath}`, { status: 404 });
    }
  });
}

// ─── Find the HTML entry point ────────────────────────────────────────────────
function findHtmlFile(dataDir) {
  const entries = fs.readdirSync(dataDir);
  // Prefer the exact name, then any .html file
  const exact = entries.find(e => e.toLowerCase() === 'financial-snapshot.html');
  if (exact) return exact;
  const fallback = entries.find(e => e.endsWith('.html') && !e.startsWith('.'));
  return fallback || 'financial-snapshot.html';
}

// ─── App ──────────────────────────────────────────────────────────────────────
let mainWindow;
let dataDir = null;

ipcMain.handle('save-csv', async (_event, { filename, content }) => {
  if (!dataDir || !filename || content == null) return { canceled: true };
  const defaultPath = path.join(dataDir, filename);
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Save CSV',
    defaultPath,
    filters: [{ name: 'CSV', extensions: ['csv'] }],
  });
  if (canceled || !filePath) return { canceled: true };
  fs.writeFileSync(filePath, content, 'utf-8');
  return { canceled: false };
});

async function createWindow() {
  dataDir = await getDataDir();
  if (!dataDir) return;

  setupProtocol(dataDir);

  const htmlFile = findHtmlFile(dataDir);

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 1000,
    title: 'Financial Snapshot',
    titleBarStyle: 'default',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Build app menu
  const template = [
    {
      label: 'Financial Snapshot',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Change Data Folder…',
          click: async () => {
            const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
              title: 'Select your Financial Snapshot data folder',
              properties: ['openDirectory'],
            });
            if (!canceled && filePaths.length) {
              saveConfig({ ...loadConfig(), dataDir: filePaths[0] });
              app.relaunch();
              app.exit();
            }
          },
        },
        {
          label: 'Open Data Folder in Finder',
          click: () => shell.openPath(dataDir),
        },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    { label: 'Edit', submenu: [
      { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
      { role: 'cut' }, { role: 'copy' }, { role: 'paste' },
      { role: 'selectAll' },
    ]},
    { label: 'View', submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' },
    ]},
    { label: 'Window', submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      { role: 'close' },
    ]},
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  // Load your HTML through the custom protocol
  mainWindow.loadURL(`app://local/${encodeURIComponent(htmlFile)}`);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
