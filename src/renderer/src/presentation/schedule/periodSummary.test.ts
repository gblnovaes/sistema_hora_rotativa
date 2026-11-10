import { describe, expect, it } from 'vitest';
import { DayAssignment } from '@domain/scheduling/DayAssignment';
import { Unit } from '@domain/scheduling/Unit';
import { WeekDay } from '@domain/scheduling/WeekDay';
import { periodSummary } from './periodSummary';
import type { ScheduleWeekView } from './scheduleGateway';

function week(index: number, rest: WeekDay): ScheduleWeekView {
  return {
    index,
    startDate: '2026-11-09',
    violations: [],
    rows: [
      {
        registration: '1',
        name: 'Ana',
        unit: Unit.Mooca,
        days: [
          { day: WeekDay.Monday, assignment: DayAssignment.Work },
          { day: rest, assignment: DayAssignment.RotatingRest },
        ],
      },
      {
        registration: '2',
        name: 'Bia',
        unit: Unit.Administrativo,
        days: [{ day: WeekDay.Saturday, assignment: DayAssignment.FixedRest }],
      },
    ],
  };
}

describe('periodSummary', () => {
  it('lista a folga rotativa de cada colaborador em cada semana', () => {
    const rows = periodSummary([week(0, WeekDay.Wednesday), week(1, WeekDay.Friday)]);

    expect(rows[0]?.rests).toEqual([WeekDay.Wednesday, WeekDay.Friday]);
  });

  it('deixa vazio quem não tem folga rotativa', () => {
    const rows = periodSummary([week(0, WeekDay.Wednesday)]);

    expect(rows[1]).toMatchObject({ registration: '2', rests: [undefined] });
  });

  it('devolve nada sem semanas', () => {
    expect(periodSummary([])).toEqual([]);
  });
});
