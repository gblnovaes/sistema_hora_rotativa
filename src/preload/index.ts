import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannel, type AppInfo, type RendererApi } from '@shared/ipc';

const api: RendererApi = {
  getAppInfo: (): Promise<AppInfo> => ipcRenderer.invoke(IpcChannel.AppGetInfo) as Promise<AppInfo>,
};

contextBridge.exposeInMainWorld('api', api);
