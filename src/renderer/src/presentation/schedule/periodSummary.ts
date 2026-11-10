import { DayAssignment } from '@domain/scheduling/DayAssignment';
import type { Unit } from '@domain/scheduling/Unit';
import type { WeekDay } from '@domain/scheduling/WeekDay';
import type { ScheduleWeekView } from './scheduleGateway';

/** Quem folga em qual dia, semana a semana. */
export interface OverviewRow {
  readonly registration: string;
  readonly name: string;
  readonly unit: Unit;
  /** Dia da folga rotativa em cada semana; `undefined` quando a unidade não tem rotativa. */
  readonly rests: readonly (WeekDay | undefined)[];
}

/** Resume o período numa linha por colaborador, para ler a rotação de relance. */
export function periodSummary(weeks: readonly ScheduleWeekView[]): readonly OverviewRow[] {
  const first = weeks[0];
  if (first === undefined) {
    return [];
  }
  return first.rows.map((row) => ({
    registration: row.registration,
    name: row.name,
    unit: row.unit,
    rests: weeks.map(
      (week) =>
        week.rows
          .find((candidate) => candidate.registration === row.registration)
          ?.days.find((cell) => cell.assignment === DayAssignment.RotatingRest)?.day,
    ),
  }));
}
