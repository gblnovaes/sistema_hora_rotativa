/**
 * Dias da semana, em ordem. Segunda é o início da semana de trabalho;
 * domingo é sempre folga nas duas unidades.
 */
export const WeekDay = {
  Monday: 'MONDAY',
  Tuesday: 'TUESDAY',
  Wednesday: 'WEDNESDAY',
  Thursday: 'THURSDAY',
  Friday: 'FRIDAY',
  Saturday: 'SATURDAY',
  Sunday: 'SUNDAY',
} as const;

export type WeekDay = (typeof WeekDay)[keyof typeof WeekDay];

/** Todos os dias, de segunda a domingo. */
export const WEEK_DAYS: readonly WeekDay[] = [
  WeekDay.Monday,
  WeekDay.Tuesday,
  WeekDay.Wednesday,
  WeekDay.Thursday,
  WeekDay.Friday,
  WeekDay.Saturday,
  WeekDay.Sunday,
];

/** Dias de segunda a sexta. */
export const WEEKDAYS: readonly WeekDay[] = WEEK_DAYS.slice(0, 5);
