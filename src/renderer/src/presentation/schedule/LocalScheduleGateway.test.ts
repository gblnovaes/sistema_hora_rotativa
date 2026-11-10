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

const TUESDAY = (): Date => new Date(2026, 10, 10); // 10/11/2026 → semana de 09/11

function restDay(row: {
  readonly days: readonly { readonly day: WeekDay; readonly assignment: DayAssignment }[];
}): WeekDay | undefined {
  return row.days.find((day) => day.assignment === DayAssignment.RotatingRest)?.day;
}

function only<T>(items: readonly T[], index = 0): T {
  const found = items[index];
  if (found === undefined) {
    throw new Error(`item ${index} ausente`);
  }
  return found;
}

describe('LocalScheduleGateway', () => {
  it('monta a semana a partir do cadastro: admin fixo no fim de semana, Mooca com uma rotativa', async () => {
    const gateway = new LocalScheduleGateway(
      new MemoryDirectory([
        { registration: '3001', name: 'Rafael Oliveira', unit: Unit.Mooca },
        { registration: '2001', name: 'Camila Andrade', unit: Unit.Administrativo },
      ]),
      undefined,
      TUESDAY,
    );

    const { weeks } = await gateway.generate(1);
    const first = only(weeks);

    expect(first.rows.map((row) => row.registration)).toEqual(['2001', '3001']);
    expect(first.violations).toEqual([]);

    const admin = only(first.rows, 0);
    const mooca = only(first.rows, 1);

    expect(cell(admin, WeekDay.Saturday)).toBe(DayAssignment.FixedRest);
    expect(cell(admin, WeekDay.Sunday)).toBe(DayAssignment.FixedRest);
    expect(restDay(admin)).toBeUndefined();

    expect(cell(mooca, WeekDay.Sunday)).toBe(DayAssignment.FixedRest);
    expect(mooca.days.filter((day) => day.assignment === DayAssignment.RotatingRest)).toHaveLength(
      1,
    );
  });

  it('planeja semanas seguidas a partir da segunda-feira da semana atual', async () => {
    const gateway = new LocalScheduleGateway(
      new MemoryDirectory([{ registration: '3001', name: 'Rafael', unit: Unit.Mooca }]),
      undefined,
      TUESDAY,
    );

    const { weeks } = await gateway.generate(5);

    expect(weeks.map((week) => week.index)).toEqual([0, 1, 2, 3, 4]);
    expect(weeks.map((week) => week.startDate)).toEqual([
      '2026-11-09',
      '2026-11-16',
      '2026-11-23',
      '2026-11-30',
      '2026-12-07',
    ]);
    expect(weeks.every((week) => week.violations.length === 0)).toBe(true);
  });

  it('a folga rotativa muda de dia de uma semana para a outra', async () => {
    const gateway = new LocalScheduleGateway(
      new MemoryDirectory([{ registration: '3001', name: 'Rafael', unit: Unit.Mooca }]),
      undefined,
      TUESDAY,
    );

    const { weeks } = await gateway.generate(5);
    const rests = weeks.map((week) => restDay(only(week.rows)));

    rests.slice(1).forEach((rest, index) => expect(rest).not.toBe(rests[index]));
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
      TUESDAY,
    );

    const { weeks } = await gateway.generate(5);

    for (const week of weeks) {
      expect(week.violations).toEqual([]);
      expect(restDay(only(week.rows, 0))).not.toBe(restDay(only(week.rows, 1)));
    }
  });

  it('recusa gerar quando o piso torna a folga rotativa impossível', async () => {
    const gateway = new LocalScheduleGateway(
      new MemoryDirectory([{ registration: '1', name: 'Ana', unit: Unit.Mooca }]),
      new FixedCoverage({
        minimumByUnit: { [Unit.Administrativo]: 1, [Unit.Mooca]: 1 },
      }),
      TUESDAY,
    );

    await expect(gateway.generate(1)).rejects.toThrow(/cobertura mínima/);
  });

  it('devolve semanas vazias quando não há colaboradores', async () => {
    const gateway = new LocalScheduleGateway(new MemoryDirectory([]), undefined, TUESDAY);
    const { weeks } = await gateway.generate(2);

    expect(weeks).toHaveLength(2);
    expect(weeks.every((week) => week.rows.length === 0 && week.violations.length === 0)).toBe(
      true,
    );
  });

  it('move a folga numa semana futura e refaz as seguintes; recusa troca sem escala', async () => {
    const gateway = new LocalScheduleGateway(
      new MemoryDirectory([{ registration: '3001', name: 'Rafael', unit: Unit.Mooca }]),
      undefined,
      TUESDAY,
    );
    await expect(gateway.moveRotatingRest(0, '3001', WeekDay.Friday)).rejects.toThrow(
      /Gere a escala/,
    );

    const generated = await gateway.generate(5);
    const previous = restDay(only(only(generated.weeks, 2).rows));
    const target = previous === WeekDay.Friday ? WeekDay.Tuesday : WeekDay.Friday;

    const moved = await gateway.moveRotatingRest(2, '3001', target);
    const row = only(only(moved.weeks, 2).rows);

    expect(moved.weeks).toHaveLength(5);
    expect(only(moved.weeks, 0)).toEqual(only(generated.weeks, 0));
    expect(cell(row, target)).toBe(DayAssignment.RotatingRest);
    expect(cell(row, WeekDay.Sunday)).toBe(DayAssignment.FixedRest);
    expect(restDay(only(only(moved.weeks, 3).rows))).not.toBe(target);
    expect(moved.weeks.every((week) => week.violations.length === 0)).toBe(true);
  });
});
