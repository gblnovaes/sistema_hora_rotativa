import { describe, expect, it } from 'vitest';
import { Unit } from '@domain/scheduling/Unit';
import { WEEK_DAYS, WeekDay } from '@domain/scheduling/WeekDay';
import type { EmployeeDirectory, EmployeeRecord } from '@presentation/employees/employeeDirectory';
import type { CoverageSettings, CoverageSettingsStore } from '@presentation/rules/coverageSettings';
import { LocalBalanceGateway } from './LocalBalanceGateway';

class MemoryDirectory implements EmployeeDirectory {
  constructor(private readonly records: readonly EmployeeRecord[]) {}
  list(): Promise<readonly EmployeeRecord[]> {
    return Promise.resolve(this.records);
  }
  save(): Promise<void> {
    return Promise.resolve();
  }
  remove(): Promise<void> {
    return Promise.resolve();
  }
}

class FixedCoverage implements CoverageSettingsStore {
  constructor(private readonly settings: CoverageSettings) {}
  load(): Promise<CoverageSettings> {
    return Promise.resolve(this.settings);
  }
  save(): Promise<void> {
    return Promise.resolve();
  }
}

const HEAT_DAYS = WEEK_DAYS.filter((day) => day !== WeekDay.Sunday);

describe('LocalBalanceGateway', () => {
  it('distribui 6 semanas da Mooca com uma folga em cada dia e diferença zero', async () => {
    const gateway = new LocalBalanceGateway(
      new MemoryDirectory([
        { registration: '2', name: 'Bruno', unit: Unit.Mooca },
        { registration: '1', name: 'Ana', unit: Unit.Mooca },
      ]),
    );

    const report = await gateway.report(6);

    expect(report.weeks).toBe(6);
    expect(report.maxSpread).toBe(0);
    expect(report.rows.map((row) => row.registration)).toEqual(['1', '2']);
    for (const row of report.rows) {
      expect(HEAT_DAYS.map((day) => row.counts[day])).toEqual([1, 1, 1, 1, 1, 1]);
      expect(row.counts[WeekDay.Sunday]).toBe(0);
    }
  });

  it('não conta folga rotativa para o Administrativo', async () => {
    const gateway = new LocalBalanceGateway(
      new MemoryDirectory([
        { registration: '10', name: 'Carla', unit: Unit.Administrativo },
        { registration: '1', name: 'Ana', unit: Unit.Mooca },
        { registration: '2', name: 'Bruno', unit: Unit.Mooca },
      ]),
    );

    const report = await gateway.report(6);
    const admin = report.rows.find((row) => row.registration === '10');
    if (admin === undefined) {
      throw new Error('administrativo ausente');
    }

    expect(HEAT_DAYS.every((day) => admin.counts[day] === 0)).toBe(true);
    expect(report.maxSpread).toBe(0);
  });

  it('respeita o piso de cobertura ao simular as semanas', async () => {
    const gateway = new LocalBalanceGateway(
      new MemoryDirectory([
        { registration: '1', name: 'Ana', unit: Unit.Mooca },
        { registration: '2', name: 'Bruno', unit: Unit.Mooca },
      ]),
      new FixedCoverage({
        minimumByUnit: { [Unit.Administrativo]: 1, [Unit.Mooca]: 1 },
      }),
    );

    const report = await gateway.report(6);
    expect(report.maxSpread).toBe(0);
    for (const day of HEAT_DAYS) {
      const total = report.rows.reduce((sum, row) => sum + row.counts[day], 0);
      expect(total).toBe(2);
    }
  });

  it('devolve relatório vazio sem colaboradores e recusa semana inválida', async () => {
    const gateway = new LocalBalanceGateway(new MemoryDirectory([]));
    expect(await gateway.report(4)).toEqual({ weeks: 4, rows: [], maxSpread: 0 });
    await expect(gateway.report(0)).rejects.toThrow(/ao menos 1 semana/);
  });
});
