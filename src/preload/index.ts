import { contextBridge, ipcRenderer } from 'electron';
import {
  IpcChannel,
  type AppInfo,
  type IpcResult,
  type RendererApi,
  type ScheduleDto,
} from '@shared/ipc';

const api: RendererApi = {
  getAppInfo: (): Promise<AppInfo> => ipcRenderer.invoke(IpcChannel.AppGetInfo) as Promise<AppInfo>,
  generateSchedule: (): Promise<IpcResult<ScheduleDto>> =>
    ipcRenderer.invoke(IpcChannel.ScheduleGenerate) as Promise<IpcResult<ScheduleDto>>,
};

contextBridge.exposeInMainWorld('api', api);
