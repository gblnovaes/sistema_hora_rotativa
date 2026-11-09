/**
 * Contrato IPC entre o processo main e o renderer.
 * É a única superfície que o renderer conhece do backend. Tudo tipado.
 */

export const IpcChannel = {
  AppGetInfo: 'app:get-info',
} as const;

export type IpcChannelName = (typeof IpcChannel)[keyof typeof IpcChannel];

export interface AppInfo {
  readonly name: string;
  readonly version: string;
}

/**
 * API exposta no renderer via contextBridge como `window.api`.
 * Cada método corresponde a um canal IPC e retorna uma Promise tipada.
 */
export interface RendererApi {
  getAppInfo(): Promise<AppInfo>;
}
