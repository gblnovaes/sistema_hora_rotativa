import { Unit } from '@domain/scheduling/Unit';
import { WEEK_DAYS, type WeekDay } from '@domain/scheduling/WeekDay';

const UNITS = new Set<string>(Object.values(Unit));
const WEEK_DAY_SET = new Set<string>(WEEK_DAYS);

/** Converte a string do banco em `Unit`, validando o valor. */
export function parseUnit(value: string): Unit {
  if (!UNITS.has(value)) {
    throw new Error(`Unidade desconhecida no banco: ${value}`);
  }
  return value as Unit;
}

/** Converte a string do banco em `WeekDay`, validando o valor. */
export function parseWeekDay(value: string): WeekDay {
  if (!WEEK_DAY_SET.has(value)) {
    throw new Error(`Dia da semana desconhecido no banco: ${value}`);
  }
  return value as WeekDay;
}
