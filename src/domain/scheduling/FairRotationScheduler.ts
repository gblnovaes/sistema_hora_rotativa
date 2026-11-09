import type { Employee } from './Employee';
import { EmployeeWeek } from './EmployeeWeek';
import { RotationHistory } from './RotationHistory';
import type { WeekDay } from './WeekDay';

/** Pesos do critério de escolha da folga rotativa (justiça em primeiro lugar). */
const FAIRNESS_WEIGHT = 100;
const REPEAT_PENALTY = 1000;
const CURRENT_LOAD_WEIGHT = 10;

export interface ScheduleResult {
  readonly weeks: readonly EmployeeWeek[];
  /** Histórico atualizado com as folgas desta semana, para a próxima rodada. */
  readonly history: RotationHistory;
}

/**
 * Escalonador com rotação justa.
 *
 * Para cada colaborador com folga rotativa, escolhe o dia que:
 * 1. foi menos usado por ele no histórico (justiça);
 * 2. não repete a folga da semana anterior;
 * 3. está menos carregado nesta semana (equilibra a cobertura).
 *
 * É determinístico: a mesma entrada produz a mesma escala. A escolha de QUAL
 * dia é feita aqui; a validação das regras continua a cargo das `ScheduleRule`.
 */
export class FairRotationScheduler {
  generate(employees: readonly Employee[], history: RotationHistory): ScheduleResult {
    let current = history;
    const currentWeekLoad = new Map<WeekDay, number>();
    const weeks: EmployeeWeek[] = [];

    for (const employee of employees) {
      if (employee.policy.rotatingRestCount === 0) {
        weeks.push(EmployeeWeek.create(employee));
        continue;
      }

      const day = this.chooseRotatingDay(employee, current, currentWeekLoad);
      weeks.push(EmployeeWeek.create(employee, day));
      current = current.withRotatingRest(employee.registration, day);
      currentWeekLoad.set(day, (currentWeekLoad.get(day) ?? 0) + 1);
    }

    return { weeks, history: current };
  }

  private chooseRotatingDay(
    employee: Employee,
    history: RotationHistory,
    currentWeekLoad: ReadonlyMap<WeekDay, number>,
  ): WeekDay {
    const candidates = employee.policy.rotatingRestCandidates;
    const score = (day: WeekDay): number =>
      history.restCount(employee.registration, day) * FAIRNESS_WEIGHT +
      (day === history.lastRest(employee.registration) ? REPEAT_PENALTY : 0) +
      (currentWeekLoad.get(day) ?? 0) * CURRENT_LOAD_WEIGHT;

    // Empate mantém o dia de menor índice (ordem de WEEK_DAYS): determinístico.
    return candidates.reduce((best, day) => (score(day) < score(best) ? day : best));
  }
}
