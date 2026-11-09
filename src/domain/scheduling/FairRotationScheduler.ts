import type { CoveragePolicy } from './CoveragePolicy';
import type { Employee } from './Employee';
import { EmployeeWeek } from './EmployeeWeek';
import { RotationHistory } from './RotationHistory';
import { Unit } from './Unit';
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

export interface ScheduleOptions {
  /** Quando presente, impõe a cobertura mínima por dia (piso rígido). */
  readonly coverage?: CoveragePolicy;
}

type DayLoad = Map<WeekDay, number>;

/**
 * Escalonador com rotação justa e cobertura mínima.
 *
 * Para cada colaborador com folga rotativa, prefere o dia que:
 * 1. foi menos usado por ele no histórico (justiça);
 * 2. não repete a folga da semana anterior;
 * 3. está menos carregado nesta semana (equilibra a cobertura).
 *
 * Esses três são preferências *suaves*. A cobertura mínima é uma restrição
 * *rígida*: nenhum dia pode ficar abaixo do piso — a preferência cede ao piso.
 *
 * Como todo dia de segunda a sábado é candidato e o piso é por unidade, a busca
 * gulosa com controle de capacidade é ótima: sempre acha uma atribuição válida
 * quando ela existe, e só falha quando a demanda excede a capacidade total. Um
 * backtracking só seria necessário com candidatos restritos (ex.: indisponibilidade
 * por férias), o que entra numa fase futura. É determinístico: mesma entrada,
 * mesma escala.
 */
export class FairRotationScheduler {
  generate(
    employees: readonly Employee[],
    history: RotationHistory,
    options: ScheduleOptions = {},
  ): ScheduleResult {
    const rotating = employees.filter((employee) => employee.policy.rotatingRestCount > 0);
    const capacityByUnit = this.buildCapacities(employees, options.coverage);

    const assignment = this.assign(rotating, history, capacityByUnit);
    if (assignment === null) {
      throw new Error('Não há escala possível que respeite a cobertura mínima');
    }

    let current = history;
    const weeks = employees.map((employee) => {
      const day = assignment.get(employee.registration);
      if (day === undefined) {
        return EmployeeWeek.create(employee);
      }
      current = current.withRotatingRest(employee.registration, day);
      return EmployeeWeek.create(employee, day);
    });

    return { weeks, history: current };
  }

  private buildCapacities(
    employees: readonly Employee[],
    coverage: CoveragePolicy | undefined,
  ): Readonly<Record<Unit, number>> {
    const totals = new Map<Unit, number>();
    for (const employee of employees) {
      totals.set(employee.unit, (totals.get(employee.unit) ?? 0) + 1);
    }

    const capacity = {} as Record<Unit, number>;
    for (const unit of Object.values(Unit)) {
      const total = totals.get(unit) ?? 0;
      // Sem cobertura, o teto é o próprio total (nunca restringe).
      capacity[unit] = coverage ? Math.max(total - coverage.minimumFor(unit), 0) : total;
    }
    return capacity;
  }

  private assign(
    rotating: readonly Employee[],
    history: RotationHistory,
    capacityByUnit: Readonly<Record<Unit, number>>,
  ): Map<string, WeekDay> | null {
    const result = new Map<string, WeekDay>();
    const loadByUnit = new Map<Unit, DayLoad>();

    for (const employee of rotating) {
      const load = loadFor(loadByUnit, employee.unit);
      const capacity = capacityByUnit[employee.unit];
      const ordered = this.orderCandidates(employee, history, load);

      const day = ordered.find((candidate) => (load.get(candidate) ?? 0) < capacity);
      if (day === undefined) {
        return null;
      }

      load.set(day, (load.get(day) ?? 0) + 1);
      result.set(employee.registration, day);
    }

    return result;
  }

  private orderCandidates(
    employee: Employee,
    history: RotationHistory,
    load: DayLoad,
  ): readonly WeekDay[] {
    const score = (day: WeekDay): number =>
      history.restCount(employee.registration, day) * FAIRNESS_WEIGHT +
      (day === history.lastRest(employee.registration) ? REPEAT_PENALTY : 0) +
      (load.get(day) ?? 0) * CURRENT_LOAD_WEIGHT;

    // Ordena por preferência (menor score primeiro); empate mantém a ordem dos dias.
    return [...employee.policy.rotatingRestCandidates].sort((a, b) => score(a) - score(b));
  }
}

function loadFor(loadByUnit: Map<Unit, DayLoad>, unit: Unit): DayLoad {
  const existing = loadByUnit.get(unit);
  if (existing !== undefined) {
    return existing;
  }
  const created: DayLoad = new Map();
  loadByUnit.set(unit, created);
  return created;
}
