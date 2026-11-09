import type { Logger } from '@application/observability/Logger';
import type { GenerateWeeklySchedule } from '@application/scheduling/GenerateWeeklySchedule';
import { IpcChannel, type IpcResult, type ScheduleDto } from '@shared/ipc';
import { runIpc } from './runIpc';
import { toScheduleDto } from './scheduleDto';

/** Registro mínimo de handlers IPC (compatível com o `ipcMain` do Electron). */
export interface IpcHandlerRegistry {
  handle(channel: string, listener: () => Promise<IpcResult<ScheduleDto>>): void;
}

/** Liga o canal `schedule:generate` ao caso de uso, com erros tratados. */
export function registerScheduleHandlers(
  registry: IpcHandlerRegistry,
  useCase: GenerateWeeklySchedule,
  logger: Logger,
): void {
  registry.handle(IpcChannel.ScheduleGenerate, () =>
    runIpc(logger, IpcChannel.ScheduleGenerate, async () => toScheduleDto(await useCase.execute())),
  );
}
