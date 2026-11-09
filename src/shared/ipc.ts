/**
 * Contrato IPC entre o processo main e o renderer.
 * É a única superfície que o renderer conhece do backend. Tudo tipado e serializável.
 */

export const IpcChannel = {
  AppGetInfo: 'app:get-info',
  ScheduleGenerate: 'schedule:generate',
} as const;

export type IpcChannelName = (typeof IpcChannel)[keyof typeof IpcChannel];

export interface AppInfo {
  readonly name: string;
  readonly version: string;
}

/** Resultado de uma chamada IPC: sucesso com dados ou falha com mensagem. */
export type IpcResult<T> =
  { readonly ok: true; readonly data: T } | { readonly ok: false; readonly error: string };

/** Um dia da semana de um colaborador na escala (valores serializados como string). */
export interface DayAssignmentDto {
  readonly day: string;
  readonly assignment: string;
}

export interface EmployeeWeekDto {
  readonly registration: string;
  readonly name: string;
  readonly unit: string;
  readonly days: readonly DayAssignmentDto[];
  readonly restDays: readonly string[];
}

export interface RuleViolationDto {
  readonly rule: string;
  readonly employee: string;
  readonly message: string;
}

export interface ScheduleDto {
  readonly correlationId: string;
  readonly weeks: readonly EmployeeWeekDto[];
  readonly violations: readonly RuleViolationDto[];
}

/**
 * API exposta no renderer via contextBridge como `window.api`.
 * Cada método corresponde a um canal IPC e retorna uma Promise tipada.
 */
export interface RendererApi {
  getAppInfo(): Promise<AppInfo>;
  generateSchedule(): Promise<IpcResult<ScheduleDto>>;
}
