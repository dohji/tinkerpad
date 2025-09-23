const { app, Menu, shell } = require('electron');

const buildMenu = (mainWindow) => {
  const template = [
    // macOS App Menu
    ...(process.platform === 'darwin' ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        // { type: 'separator' },
        // { label: 'Preferences...', accelerator: 'CmdOrCtrl+,', click: () => mainWindow.webContents.send('open-preferences') },
        // { type: 'separator' },
        // { role: 'services' },
        // { type: 'separator' },
        // { role: 'hide' },
        // { role: 'hideothers' },
        // { role: 'unhide' },
        // { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),

    // File Menu 
    {
      label: 'File',
      submenu: [
        { label: 'New Playground', accelerator: 'CmdOrCtrl+N', click: () => mainWindow.webContents.send('new-playground') },
        // { label: 'Open Playground...', accelerator: 'CmdOrCtrl+O', click: () => mainWindow.webContents.send('file-open') },
        { type: 'separator' },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => mainWindow.webContents.send('save-playground') },
        // { label: 'Save As...', accelerator: 'Shift+CmdOrCtrl+S', click: () => mainWindow.webContents.send('file-save-as') },
        // { type: 'separator' },
        process.platform === 'darwin' ? { role: 'close' } : { role: 'quit' }
      ]
    },

    // Edit Menu
    {
      label: 'Edit',
      submenu: [
        // { role: 'undo' },
        // { role: 'redo' },
        // { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        // ...(process.platform === 'darwin'
        //   ? [
        //       { role: 'pasteAndMatchStyle' },
        //       { role: 'delete' },
        //       { role: 'selectAll' },
        //       { type: 'separator' },
        //       {
        //         label: 'Speech',
        //         submenu: [
        //           { role: 'startspeaking' },
        //           { role: 'stopspeaking' }
        //         ]
        //       }
        //     ]
        //   : [
        //       { role: 'delete' },
        //       { type: 'separator' },
        //       { role: 'selectAll' }
        //     ])
      ]
    },

    // View Menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        // { role: 'forcereload' },
        // { role: 'toggledevtools' },
        // { type: 'separator' },
        // { role: 'resetzoom' },
        // { role: 'zoomin' },
        // { role: 'zoomout' },
        // { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },

    // Run Menu
    {
      label: 'Run',
      submenu: [
        { label: 'Run Code', accelerator: 'CmdOrCtrl+Enter', click: () => mainWindow.webContents.send('run-code') },
        { label: 'Clear Console', accelerator: 'CmdOrCtrl+K', click: () => mainWindow.webContents.send('clear-console') }
      ]
    },

    // Window Menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(process.platform === 'darwin'
          ? [
              { type: 'separator' },
              { role: 'front' },
              { type: 'separator' },
              { role: 'window' }
            ]
          : [{ role: 'close' }])
      ]
    },

    // Help Menu
    {
      role: 'help',
      submenu: [
        {
          label: 'Documentation',
          click: async () => {
            await shell.openExternal('https://tinkerpad.dev/docs');
          }
        },
        {
          label: 'Report Issue',
          click: async () => {
            await shell.openExternal('https://github.com/tinkerpad/issues');
          }
        },
        { type: 'separator' },
        {
          label: 'Buy Me a Coffee ☕',
          click: async () => {
            await shell.openExternal('https://buymeacoffee.com/richdodzi');
          }
        }
      ]
    }
  ];

  return Menu.buildFromTemplate(template);
};

module.exports = buildMenu;