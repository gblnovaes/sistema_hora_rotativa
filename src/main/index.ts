import { join } from 'node:path';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { IpcChannel, type AppInfo } from '@shared/ipc';
import { openDatabase } from '@infrastructure/persistence/Database';
import { PinoLogger } from '@infrastructure/observability/PinoLogger';
import { reportError } from '@application/observability/reportError';
import { createSchedulingContainer } from './composition/container';
import { registerScheduleHandlers } from './ipc/registerScheduleHandlers';

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

function bootstrap(): void {
  const logger = PinoLogger.create(isDev ? 'debug' : 'info');
  const db = openDatabase(join(app.getPath('userData'), 'hora-rotativa.db'));
  const container = createSchedulingContainer(db, { logger });

  ipcMain.handle(IpcChannel.AppGetInfo, (): AppInfo => {
    return { name: app.getName(), version: app.getVersion() };
  });
  registerScheduleHandlers(ipcMain, container.generateWeeklySchedule, logger);

  installProcessErrorHandlers(logger);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}

function installProcessErrorHandlers(logger: PinoLogger): void {
  process.on('uncaughtException', (error) => reportError(logger, 'uncaughtException', error));
  process.on('unhandledRejection', (reason) => reportError(logger, 'unhandledRejection', reason));
}

app.whenReady().then(bootstrap, (error: unknown) => {
  console.error('Falha ao inicializar o app', error);
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
