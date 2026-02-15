// preload.js – exposes saveCsv to the renderer when running in Electron
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveCsv: (filename, content) => ipcRenderer.invoke('save-csv', { filename, content }),
});
