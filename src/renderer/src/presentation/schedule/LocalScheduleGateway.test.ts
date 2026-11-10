import { describe, expect, it } from 'vitest';
import { DayAssignment } from '@domain/scheduling/DayAssignment';
import { Unit } from '@domain/scheduling/Unit';
import { WeekDay } from '@domain/scheduling/WeekDay';
import type { EmployeeDirectory, EmployeeRecord } from '@presentation/employees/employeeDirectory';
import type { CoverageSettings, CoverageSettingsStore } from '@presentation/rules/coverageSettings';
import { LocalScheduleGateway } from './LocalScheduleGateway';
import type { SavedSchedule, ScheduleStore } from './scheduleStore';

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

class MemoryScheduleStore implements ScheduleStore {
  saved: SavedSchedule | null = null;
  saves = 0;
  load(): Promise<SavedSchedule | null> {
    return Promise.resolve(this.saved);
  }
  save(schedule: SavedSchedule): Promise<void> {
    this.saved = schedule;
    this.saves += 1;
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
      new MemoryScheduleStore(),
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
      new MemoryScheduleStore(),
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
      new MemoryScheduleStore(),
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
      new MemoryScheduleStore(),
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
      new MemoryScheduleStore(),
      TUESDAY,
    );

    await expect(gateway.generate(1)).rejects.toThrow(/cobertura mínima/);
  });

  it('devolve semanas vazias quando não há colaboradores', async () => {
    const gateway = new LocalScheduleGateway(
      new MemoryDirectory([]),
      undefined,
      new MemoryScheduleStore(),
      TUESDAY,
    );
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
      new MemoryScheduleStore(),
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

describe('LocalScheduleGateway: escala salva', () => {
  const NEXT_WEEK = (): Date => new Date(2026, 10, 17); // terça seguinte

  const team = [
    { registration: '1', name: 'Ana', unit: Unit.Mooca },
    { registration: '2', name: 'Bia', unit: Unit.Administrativo },
  ];

  function gatewayOn(
    store: MemoryScheduleStore,
    today: () => Date = TUESDAY,
    records = team,
  ): LocalScheduleGateway {
    return new LocalScheduleGateway(new MemoryDirectory(records), undefined, store, today);
  }

  it('não há escala salva antes da primeira geração', async () => {
    expect(await gatewayOn(new MemoryScheduleStore()).load(5)).toBeNull();
  });

  it('gerar salva a escala', async () => {
    const store = new MemoryScheduleStore();
    const generated = await gatewayOn(store).generate(5);

    expect(store.saves).toBe(1);
    expect(store.saved?.weeks).toHaveLength(5);
    expect(generated.savedAt).toBe(store.saved?.savedAt);
    expect(generated.outdated).toBe(false);
  });

  it('reabrir devolve a mesma escala, inclusive a troca manual', async () => {
    const store = new MemoryScheduleStore();
    const first = gatewayOn(store);
    const generated = await first.generate(5);
    const previous = restDay(only(only(generated.weeks, 1).rows, 0));
    const target = previous === WeekDay.Friday ? WeekDay.Tuesday : WeekDay.Friday;
    const moved = await first.moveRotatingRest(1, '1', target);

    const reopened = await gatewayOn(store).load(5);

    expect(reopened?.weeks).toEqual(moved.weeks);
    expect(restDay(only(only(reopened?.weeks ?? [], 1).rows, 0))).toBe(target);
    expect(reopened?.savedAt).toBe(moved.savedAt);
  });

  it('cada troca manual é salva', async () => {
    const store = new MemoryScheduleStore();
    const gateway = gatewayOn(store);
    await gateway.generate(5);
    await gateway.moveRotatingRest(0, '1', WeekDay.Friday);

    expect(store.saves).toBe(2);
    expect(store.saved?.weeks[0]?.rests['1']).toBe(WeekDay.Friday);
    expect(store.saved?.weeks[0]?.rests['2']).toBeNull();
  });

  it('com o passar das semanas, esconde as passadas e acrescenta as que faltam', async () => {
    const store = new MemoryScheduleStore();
    const original = await gatewayOn(store).generate(5);
    const savedAt = store.saved?.savedAt;

    const later = await gatewayOn(store, NEXT_WEEK).load(5);

    expect(later?.weeks.map((week) => week.startDate)).toEqual([
      '2026-11-16',
      '2026-11-23',
      '2026-11-30',
      '2026-12-07',
      '2026-12-14',
    ]);
    // As semanas que já existiam continuam como estavam.
    expect(later?.weeks.slice(0, 4)).toEqual(
      original.weeks.slice(1).map((week, index) => ({ ...week, index })),
    );
    expect(store.saved?.weeks).toHaveLength(6);
    // Estender não conta como edição do usuário.
    expect(later?.savedAt).toBe(savedAt);
  });

  it('uma troca depois de semanas passadas atinge a semana certa', async () => {
    const store = new MemoryScheduleStore();
    await gatewayOn(store).generate(5);
    const gateway = gatewayOn(store, NEXT_WEEK);
    const loaded = await gateway.load(5);
    const previous = restDay(only(only(loaded?.weeks ?? [], 0).rows, 0));
    const target = previous === WeekDay.Friday ? WeekDay.Tuesday : WeekDay.Friday;

    await gateway.moveRotatingRest(0, '1', target);

    expect(store.saved?.weeks[0]?.rests['1']).not.toBe(target); // semana passada intacta
    expect(store.saved?.weeks[1]?.rests['1']).toBe(target);
  });

  it('avisa quando o cadastro mudou depois de salvar a escala', async () => {
    const store = new MemoryScheduleStore();
    await gatewayOn(store).generate(5);

    const withNewHire = await gatewayOn(store, TUESDAY, [
      ...team,
      { registration: '3', name: 'Caio', unit: Unit.Mooca },
    ]).load(5);

    expect(withNewHire?.outdated).toBe(true);
    // A grade continua mostrando a equipe salva.
    expect(only(withNewHire?.weeks ?? []).rows).toHaveLength(2);
  });

  it('descarta uma escala salva que contradiz as regras', async () => {
    const store = new MemoryScheduleStore();
    store.saved = {
      savedAt: '2026-11-10T10:00:00.000Z',
      employees: [{ registration: '1', name: 'Ana', unit: Unit.Mooca }],
      weeks: [{ startDate: '2026-11-09', rests: { '1': WeekDay.Sunday } }],
    };

    expect(await gatewayOn(store).load(5)).toBeNull();
  });
});
