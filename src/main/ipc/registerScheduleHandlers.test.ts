import { describe, expect, it } from 'vitest';
import { registerScheduleHandlers, type IpcHandlerRegistry } from './registerScheduleHandlers';
import { IpcChannel, type IpcResult, type ScheduleDto } from '@shared/ipc';
import type { GenerateWeeklySchedule } from '@application/scheduling/GenerateWeeklySchedule';
import type { Logger } from '@application/observability/Logger';
import { Employee } from '@domain/scheduling/Employee';
import { EmployeeWeek } from '@domain/scheduling/EmployeeWeek';
import { Unit } from '@domain/scheduling/Unit';

const silentLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  child: () => silentLogger,
};

class CapturingRegistry implements IpcHandlerRegistry {
  private readonly handlers = new Map<string, () => Promise<IpcResult<ScheduleDto>>>();
  handle(channel: string, listener: () => Promise<IpcResult<ScheduleDto>>): void {
    this.handlers.set(channel, listener);
  }
  invoke(channel: string): Promise<IpcResult<ScheduleDto>> {
    const handler = this.handlers.get(channel);
    if (!handler) {
      throw new Error(`Canal não registrado: ${channel}`);
    }
    return handler();
  }
}

function fakeUseCase(execute: () => Promise<unknown>): GenerateWeeklySchedule {
  return { execute } as unknown as GenerateWeeklySchedule;
}

describe('registerScheduleHandlers', () => {
  it('registra o canal e devolve o DTO em caso de sucesso', async () => {
    const registry = new CapturingRegistry();
    const admin = Employee.create({ registration: '1', name: 'Admin', unit: Unit.Administrativo });
    const useCase = fakeUseCase(() =>
      Promise.resolve({ correlationId: 'c', weeks: [EmployeeWeek.create(admin)], violations: [] }),
    );

    registerScheduleHandlers(registry, useCase, silentLogger);
    const result = await registry.invoke(IpcChannel.ScheduleGenerate);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.correlationId).toBe('c');
      expect(result.data.weeks).toHaveLength(1);
    }
  });

  it('converte um erro do caso de uso em resultado de falha', async () => {
    const registry = new CapturingRegistry();
    const useCase = fakeUseCase(() => Promise.reject(new Error('falhou')));

    registerScheduleHandlers(registry, useCase, silentLogger);
    const result = await registry.invoke(IpcChannel.ScheduleGenerate);

    expect(result).toEqual({ ok: false, error: 'falhou' });
  });
});
