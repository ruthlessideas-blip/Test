const { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, nativeImage, screen } = require('electron');
const path = require('path');

let mainWindow;
let tray;
let isAlwaysOnTop = true;
let isVisible = true;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(1200, width),
    height: Math.min(800, height),
    x: Math.round((width - Math.min(1200, width)) / 2),
    y: Math.round((height - Math.min(800, height)) / 2),
    frame: false,
    transparent: true,
    alwaysOnTop: isAlwaysOnTop,
    vibrancy: 'dark',              // macOS glass effect
    backgroundMaterial: 'acrylic', // Windows acrylic
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
    skipTaskbar: false,
    hasShadow: true,
    resizable: true,
    minWidth: 700,
    minHeight: 500,
  });

  // Load the jarvis UI from parent directory
  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

function createTray() {
  // Minimal tray icon (1x1 placeholder — replace with real icon)
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('JARVIS');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show JARVIS',    click: () => { mainWindow?.show(); isVisible = true; } },
    { label: 'Hide JARVIS',    click: () => { mainWindow?.hide(); isVisible = false; } },
    { label: 'Always on Top',  type: 'checkbox', checked: true,
      click: (item) => {
        isAlwaysOnTop = item.checked;
        mainWindow?.setAlwaysOnTop(isAlwaysOnTop);
      }
    },
    { type: 'separator' },
    { label: 'Quit',           click: () => app.quit() },
  ]));
  tray.on('click', () => {
    if (isVisible) { mainWindow?.hide(); isVisible = false; }
    else           { mainWindow?.show(); isVisible = true; }
  });
}

// ── Global shortcuts ──
app.whenReady().then(() => {
  createWindow();
  createTray();

  // Ctrl+Shift+Space = toggle JARVIS
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    if (!mainWindow) return;
    if (isVisible) { mainWindow.hide(); isVisible = false; }
    else           { mainWindow.show(); mainWindow.focus(); isVisible = true; }
  });

  // Ctrl+Shift+S = trigger screen capture (via IPC to renderer)
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    mainWindow?.webContents.send('trigger-capture');
  });
});

// ── IPC handlers ──
ipcMain.handle('toggle-always-on-top', () => {
  isAlwaysOnTop = !isAlwaysOnTop;
  mainWindow?.setAlwaysOnTop(isAlwaysOnTop);
  return isAlwaysOnTop;
});

ipcMain.handle('set-opacity', (_, value) => {
  mainWindow?.setOpacity(Math.max(0.3, Math.min(1, value)));
});

ipcMain.handle('minimize', () => mainWindow?.minimize());
ipcMain.handle('close',    () => { isVisible = false; mainWindow?.hide(); });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
