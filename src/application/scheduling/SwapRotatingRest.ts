import { EmployeeWeek } from '@domain/scheduling/EmployeeWeek';
import type { RuleViolation } from '@domain/scheduling/RuleViolation';
import type { ScheduleValidator } from '@domain/scheduling/ScheduleValidator';
import type { WeekDay } from '@domain/scheduling/WeekDay';

export interface SwapRotatingRestDeps {
  readonly validator: ScheduleValidator;
}

export interface SwapRotatingRestInput {
  readonly weeks: readonly EmployeeWeek[];
  readonly registration: string;
  readonly day: WeekDay;
}

export interface SwapRotatingRestResult {
  readonly weeks: readonly EmployeeWeek[];
  readonly violations: readonly RuleViolation[];
}

/**
 * Troca a folga rotativa de um colaborador para outro dia e revalida a escala.
 *
 * A semana é refeita pela política da unidade (`EmployeeWeek.create`): folgas
 * fixas permanecem e o dia anterior de rotativa volta a ser trabalho. Uma troca
 * que a unidade não permite (sem rotativa, ou dia fora dos candidatos) falha
 * antes de alterar a escala. O que passar pelo modelo é revalidado.
 */
export class SwapRotatingRest {
  constructor(private readonly deps: SwapRotatingRestDeps) {}

  execute(input: SwapRotatingRestInput): SwapRotatingRestResult {
    const current = input.weeks.find((week) => week.employee.registration === input.registration);
    if (current === undefined) {
      throw new Error(`Colaborador ${input.registration} não está na escala`);
    }
    if (current.employee.policy.rotatingRestCount === 0) {
      throw new Error(`Unidade ${current.employee.unit} não tem folga rotativa`);
    }
    if (current.rotatingRestDays.includes(input.day)) {
      return { weeks: input.weeks, violations: this.deps.validator.validate(input.weeks) };
    }

    const replaced = EmployeeWeek.create(current.employee, input.day);
    const weeks = input.weeks.map((week) =>
      week.employee.registration === input.registration ? replaced : week,
    );
    return { weeks, violations: this.deps.validator.validate(weeks) };
  }
}
