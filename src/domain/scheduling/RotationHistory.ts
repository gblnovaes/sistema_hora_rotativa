import type { WeekDay } from './WeekDay';

interface EmployeeHistory {
  readonly counts: ReadonlyMap<WeekDay, number>;
  readonly last?: WeekDay;
}

/**
 * Histórico de folgas rotativas por colaborador, usado para distribuir as
 * folgas de forma justa. Imutável: cada registro gera um novo histórico.
 *
 * - `restCount` conta quantas vezes o colaborador folgou naquele dia da semana.
 * - `lastRest` é a folga rotativa da semana anterior (para não repetir o dia).
 */
export class RotationHistory {
  private constructor(private readonly byEmployee: ReadonlyMap<string, EmployeeHistory>) {}

  static empty(): RotationHistory {
    return new RotationHistory(new Map());
  }

  restCount(registration: string, day: WeekDay): number {
    return this.byEmployee.get(registration)?.counts.get(day) ?? 0;
  }

  lastRest(registration: string): WeekDay | undefined {
    return this.byEmployee.get(registration)?.last;
  }

  withRotatingRest(registration: string, day: WeekDay): RotationHistory {
    const previous = this.byEmployee.get(registration);
    const counts = new Map(previous?.counts);
    counts.set(day, (counts.get(day) ?? 0) + 1);

    const next = new Map(this.byEmployee);
    next.set(registration, { counts, last: day });
    return new RotationHistory(next);
  }
}
