import { Duration } from '@domain/scheduling/Duration';
import { WorkShift, type TimeOfDay } from '@domain/scheduling/WorkShift';

export interface ShiftFact {
  readonly id: string;
  readonly label: string;
  readonly window: string;
  readonly lunch: string;
  readonly gross: string;
  readonly net: string;
}

const WEEKDAY_START: TimeOfDay = { hour: 8, minute: 0 };
const WEEKDAY_END: TimeOfDay = { hour: 17, minute: 24 };
const SATURDAY_END: TimeOfDay = { hour: 14, minute: 0 };
const LUNCH = Duration.fromHoursMinutes(1, 0);
const NO_LUNCH = Duration.fromMinutes(0);

function clock(time: TimeOfDay): string {
  const hour = String(time.hour).padStart(2, '0');
  const minute = String(time.minute).padStart(2, '0');
  return `${hour}:${minute}`;
}

function fact(
  id: string,
  label: string,
  start: TimeOfDay,
  end: TimeOfDay,
  lunch: Duration,
): ShiftFact {
  const shift = WorkShift.create({ start, end, lunch });
  return {
    id,
    label,
    window: `${clock(start)}–${clock(end)}`,
    lunch: lunch.toString(),
    gross: shift.grossSpan.toString(),
    net: shift.netWork.toString(),
  };
}

/**
 * Jornada adotada pela operação, calculada pelo domínio (nunca por número solto).
 * Dia útil: 08:00–17:24 com 1h de almoço. Sábado da Mooca: 08:00–14:00 sem almoço.
 */
export function adoptedShifts(): readonly ShiftFact[] {
  return [
    fact('weekday', 'Dia útil (seg–sex)', WEEKDAY_START, WEEKDAY_END, LUNCH),
    fact('saturday', 'Sábado (Mooca)', WEEKDAY_START, SATURDAY_END, NO_LUNCH),
  ];
}
