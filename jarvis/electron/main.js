const {
  app, BrowserWindow, globalShortcut, ipcMain,
  Tray, Menu, nativeImage, screen, desktopCapturer,
} = require('electron');
const path = require('path');

let mainWindow;
let tray;
let isAlwaysOnTop = true;
let isVisible = true;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(1280, width),
    height: Math.min(860, height),
    x: Math.round((width - Math.min(1280, width)) / 2),
    y: Math.round((height - Math.min(860, height)) / 2),
    frame: false,
    transparent: true,
    alwaysOnTop: isAlwaysOnTop,
    vibrancy: 'dark',
    backgroundMaterial: 'acrylic',
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

  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
}

function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('JARVIS');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show JARVIS',   click: () => { mainWindow?.show(); isVisible = true; } },
    { label: 'Hide JARVIS',   click: () => { mainWindow?.hide(); isVisible = false; } },
    { label: 'Always on Top', type: 'checkbox', checked: true,
      click: (item) => { isAlwaysOnTop = item.checked; mainWindow?.setAlwaysOnTop(isAlwaysOnTop); }
    },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]));
  tray.on('click', () => {
    if (isVisible) { mainWindow?.hide(); isVisible = false; }
    else           { mainWindow?.show(); isVisible = true; }
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    if (!mainWindow) return;
    if (isVisible) { mainWindow.hide(); isVisible = false; }
    else           { mainWindow.show(); mainWindow.focus(); isVisible = true; }
  });

  globalShortcut.register('CommandOrControl+Shift+S', () => {
    mainWindow?.webContents.send('trigger-capture');
  });
});

// ── desktopCapturer: list all screens + open windows ──
ipcMain.handle('get-sources', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['screen', 'window'],
    thumbnailSize: { width: 320, height: 200 },
    fetchWindowIcons: true,
  });
  return sources.map(s => ({
    id:          s.id,
    name:        s.name,
    thumbnail:   s.thumbnail.toDataURL(),
    appIcon:     s.appIcon?.toDataURL() || null,
    isScreen:    s.id.startsWith('screen:'),
  }));
});

// ── Capture a specific source by ID ──
ipcMain.handle('capture-source', async (_, sourceId) => {
  const sources = await desktopCapturer.getSources({
    types: ['screen', 'window'],
    thumbnailSize: { width: 1920, height: 1200 },
  });
  const src = sources.find(s => s.id === sourceId);
  if (!src) return null;
  return src.thumbnail.toDataURL().split(',')[1]; // base64 PNG
});

// ── Window management ──
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

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('will-quit', () => globalShortcut.unregisterAll());
