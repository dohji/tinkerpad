// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tinkerpad', {
    // playground storage
    getPlaygrounds: () => ipcRenderer.invoke('tinkerpad:get-playgrounds'),
    savePlayground: (playground) => ipcRenderer.invoke('tinkerpad:save-playground', playground),
    deletePlayground: (id) => ipcRenderer.invoke('tinkerpad:delete-playground', id),

    onRunCode: (callback) => ipcRenderer.on('run-code', callback),
    onClearConsole: (callback) => ipcRenderer.on('clear-console', callback),
    onSavePlayground: (callback) => ipcRenderer.on('save-playground', callback),
    onNewPlayground: (callback) => ipcRenderer.on('new-playground', callback),

    // simple UX helpers
    openExternal: (url) => ipcRenderer.invoke('tinkerpad:open-external', url)
});