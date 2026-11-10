import { describe, expect, it } from 'vitest';
import { DayAssignment } from '@domain/scheduling/DayAssignment';
import { Unit } from '@domain/scheduling/Unit';
import { WeekDay } from '@domain/scheduling/WeekDay';
import type { EmployeeDirectory, EmployeeRecord } from '@presentation/employees/employeeDirectory';
import type { CoverageSettings, CoverageSettingsStore } from '@presentation/rules/coverageSettings';
import { LocalScheduleGateway } from './LocalScheduleGateway';

class FixedCoverage implements CoverageSettingsStore {
  constructor(private readonly settings: CoverageSettings) {}
  load(): Promise<CoverageSettings> {
    return Promise.resolve(this.settings);
  }
  save(): Promise<void> {
    return Promise.resolve();
  }
}

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

function cell(
  row: { readonly days: readonly { readonly day: WeekDay; readonly assignment: DayAssignment }[] },
  day: WeekDay,
): DayAssignment {
  const found = row.days.find((item) => item.day === day);
  if (found === undefined) {
    throw new Error(`Dia ${day} ausente`);
  }
  return found.assignment;
}

describe('LocalScheduleGateway', () => {
  it('monta a semana a partir do cadastro: admin fixo no fim de semana, Mooca com uma rotativa', async () => {
    const gateway = new LocalScheduleGateway(
      new MemoryDirectory([
        { registration: '3001', name: 'Rafael Oliveira', unit: Unit.Mooca },
        { registration: '2001', name: 'Camila Andrade', unit: Unit.Administrativo },
      ]),
    );

    const schedule = await gateway.generate();

    expect(schedule.rows.map((row) => row.registration)).toEqual(['2001', '3001']);
    expect(schedule.violations).toEqual([]);

    const admin = schedule.rows[0];
    const mooca = schedule.rows[1];
    if (admin === undefined || mooca === undefined) {
      throw new Error('linhas ausentes');
    }

    expect(cell(admin, WeekDay.Saturday)).toBe(DayAssignment.FixedRest);
    expect(cell(admin, WeekDay.Sunday)).toBe(DayAssignment.FixedRest);
    expect(admin.days.filter((day) => day.assignment === DayAssignment.RotatingRest)).toEqual([]);

    expect(cell(mooca, WeekDay.Sunday)).toBe(DayAssignment.FixedRest);
    expect(mooca.days.filter((day) => day.assignment === DayAssignment.RotatingRest)).toHaveLength(
      1,
    );
    expect(cell(mooca, WeekDay.Monday)).not.toBe(DayAssignment.FixedRest);
  });

  it('aplica o piso de cobertura: duas pessoas na Mooca não folgam no mesmo dia', async () => {
    const gateway = new LocalScheduleGateway(
      new MemoryDirectory([
        { registration: '1', name: 'Ana', unit: Unit.Mooca },
        { registration: '2', name: 'Bruno', unit: Unit.Mooca },
      ]),
      new FixedCoverage({
        minimumByUnit: { [Unit.Administrativo]: 1, [Unit.Mooca]: 1 },
      }),
    );

    const schedule = await gateway.generate();
    const rests = schedule.rows.map(
      (row) => row.days.find((day) => day.assignment === DayAssignment.RotatingRest)?.day,
    );

    expect(schedule.violations).toEqual([]);
    expect(rests[0]).toBeDefined();
    expect(rests[0]).not.toBe(rests[1]);
  });

  it('recusa gerar quando o piso torna a folga rotativa impossível', async () => {
    const gateway = new LocalScheduleGateway(
      new MemoryDirectory([{ registration: '1', name: 'Ana', unit: Unit.Mooca }]),
      new FixedCoverage({
        minimumByUnit: { [Unit.Administrativo]: 1, [Unit.Mooca]: 1 },
      }),
    );

    await expect(gateway.generate()).rejects.toThrow(/cobertura mínima/);
  });

  it('devolve uma escala vazia quando não há colaboradores', async () => {
    const gateway = new LocalScheduleGateway(new MemoryDirectory([]));
    const schedule = await gateway.generate();
    expect(schedule).toEqual({ rows: [], violations: [] });
  });

  it('move a folga rotativa da escala já gerada e recusa troca sem escala', async () => {
    const gateway = new LocalScheduleGateway(
      new MemoryDirectory([{ registration: '3001', name: 'Rafael Oliveira', unit: Unit.Mooca }]),
    );
    await expect(gateway.moveRotatingRest('3001', WeekDay.Friday)).rejects.toThrow(/Gere a escala/);

    const generated = await gateway.generate();
    const mooca = generated.rows[0];
    if (mooca === undefined) {
      throw new Error('linha ausente');
    }
    const previous = mooca.days.find((day) => day.assignment === DayAssignment.RotatingRest)?.day;
    const target = previous === WeekDay.Friday ? WeekDay.Tuesday : WeekDay.Friday;

    const moved = await gateway.moveRotatingRest('3001', target);
    const row = moved.rows[0];
    if (row === undefined || previous === undefined) {
      throw new Error('troca incompleta');
    }

    expect(cell(row, target)).toBe(DayAssignment.RotatingRest);
    expect(cell(row, previous)).toBe(DayAssignment.Work);
    expect(cell(row, WeekDay.Sunday)).toBe(DayAssignment.FixedRest);
    expect(moved.violations).toEqual([]);
  });
});
