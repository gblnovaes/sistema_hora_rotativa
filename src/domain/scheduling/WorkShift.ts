import { Duration } from './Duration';

const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;

export interface TimeOfDay {
  readonly hour: number;
  readonly minute: number;
}

export interface WorkShiftInput {
  readonly start: TimeOfDay;
  readonly end: TimeOfDay;
  readonly lunch: Duration;
}

function toMinutesOfDay({ hour, minute }: TimeOfDay): number {
  if (!Number.isInteger(hour) || hour < 0 || hour >= HOURS_PER_DAY) {
    throw new RangeError(`Hora inválida: ${hour}`);
  }
  if (!Number.isInteger(minute) || minute < 0 || minute >= MINUTES_PER_HOUR) {
    throw new RangeError(`Minuto inválido: ${minute}`);
  }
  return hour * MINUTES_PER_HOUR + minute;
}

/**
 * Turno de trabalho de um dia: início, fim e almoço.
 *
 * - `grossSpan` é a presença bruta (fim − início).
 * - `netWork` é o trabalho líquido (presença − almoço), que conta para a jornada
 *   semanal. O almoço não conta (regra R5).
 */
export class WorkShift {
  private constructor(
    public readonly grossSpan: Duration,
    public readonly netWork: Duration,
  ) {}

  static create(input: WorkShiftInput): WorkShift {
    const startMinutes = toMinutesOfDay(input.start);
    const endMinutes = toMinutesOfDay(input.end);

    if (endMinutes <= startMinutes) {
      throw new RangeError('O término do turno deve ser depois do início');
    }

    const grossSpan = Duration.fromMinutes(endMinutes - startMinutes);
    if (input.lunch.minutes > grossSpan.minutes) {
      throw new RangeError('O almoço não pode ser maior que a presença no turno');
    }

    return new WorkShift(grossSpan, grossSpan.minus(input.lunch));
  }
}
