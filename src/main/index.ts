import { join } from 'node:path';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { IpcChannel, type AppInfo } from '@shared/ipc';

const isDev = !app.isPackaged;

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  window.on('ready-to-show', () => window.show());

  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  const devServerUrl = process.env['ELECTRON_RENDERER_URL'];
  if (isDev && devServerUrl) {
    void window.loadURL(devServerUrl);
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return window;
}

function registerIpcHandlers(): void {
  ipcMain.handle(IpcChannel.AppGetInfo, (): AppInfo => {
    return { name: app.getName(), version: app.getVersion() };
  });
}

app.whenReady().then(
  () => {
    registerIpcHandlers();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  },
  (error: unknown) => {
    console.error('Falha ao inicializar o app', error);
    app.quit();
  },
);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
