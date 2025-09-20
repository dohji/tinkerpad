const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('node:path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const buildMenu = require('./menu');

const dataDir = path.join(app.getPath('userData'), 'playgrounds');

async function ensureDataDir() {
    await fs.mkdir(dataDir, { recursive: true });
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        show: false, // Keep this to prevent FOUC
        width: 1010,
        height: 650,
        minWidth: 950,
        minHeight: 650,
        icon: path.join(__dirname, 'assets', 'icon.png'),
        backgroundColor: '#0f172a', // Set background color to match your app theme
        webPreferences: {
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
            nodeIntegration: false,
        },
        frame: false, // Remove the default frame
        titleBarStyle: 'hidden', // Hide title bar but keep traffic lights on macOS
        titleBarOverlay: {
            color: '#0f172a', // Match your app's dark theme
            symbolColor: '#ffffff'
        },
        trafficLightPosition: {
            x: 15, // Adjust X-coordinate for horizontal padding
            y: 18 // Adjust Y-coordinate for vertical padding
        },
    });

    const menu = buildMenu(mainWindow);
    Menu.setApplicationMenu(menu);

    // Enhanced window showing logic to prevent FOUC
    let readyToShow = false;
    let domReady = false;

    const showWindowWhenReady = () => {
        if (readyToShow && domReady) {
            // Add a small delay to ensure all styles are applied
            setTimeout(() => {
                mainWindow.show();
                mainWindow.focus();
            }, 100);
        }
    };

    // Wait for both ready-to-show AND dom-ready to ensure styles are loaded
    mainWindow.once('ready-to-show', () => {
        readyToShow = true;
        showWindowWhenReady();
    });

    mainWindow.webContents.once('dom-ready', () => {
        domReady = true;
        showWindowWhenReady();
    });

    // Load the index.html of the app.
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    // Open the DevTools (comment out for production)
    mainWindow.webContents.openDevTools();

    // IPC handlers for playground storage
    ipcMain.handle('tinkerpad:get-playgrounds', async () => {
        await ensureDataDir();
        const files = await fs.readdir(dataDir);
        const playgrounds = [];
        
        for (const file of files) {
            if (!file.endsWith('.json')) continue;
            try {
                const raw = await fs.readFile(path.join(dataDir, file), 'utf-8');
                playgrounds.push(JSON.parse(raw));
            } catch (e) { 
                /* ignore malformed */ 
            }
        }
        
        // newest first
        playgrounds.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
        return playgrounds;
    });

    ipcMain.handle('tinkerpad:save-playground', async (event, playground) => {
        await ensureDataDir();
        const id = playground.id || uuidv4();
        const now = new Date().toISOString();
        playground.id = id;
        playground.updated_at = now;
        if (!playground.created_at) playground.created_at = now;
        
        await fs.writeFile(path.join(dataDir, `${id}.json`), JSON.stringify(playground, null, 2), 'utf-8');
        return playground;
    });

    ipcMain.handle('tinkerpad:delete-playground', async (event, id) => {
        try {
            await fs.unlink(path.join(dataDir, `${id}.json`));
            return true;
        } catch (e) { 
            return false; 
        }
    });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow();

    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
