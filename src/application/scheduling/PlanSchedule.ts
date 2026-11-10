import type { CoveragePolicy } from '@domain/scheduling/CoveragePolicy';
import type { Employee } from '@domain/scheduling/Employee';
import type { EmployeeWeek } from '@domain/scheduling/EmployeeWeek';
import type { FairRotationScheduler } from '@domain/scheduling/FairRotationScheduler';
import { RotationHistory } from '@domain/scheduling/RotationHistory';
import type { RuleViolation } from '@domain/scheduling/RuleViolation';
import type { ScheduleValidator } from '@domain/scheduling/ScheduleValidator';
import type { WeekDay } from '@domain/scheduling/WeekDay';
import type { SwapRotatingRest } from './SwapRotatingRest';

export interface PlanScheduleDeps {
  readonly scheduler: FairRotationScheduler;
  readonly validator: ScheduleValidator;
  readonly swap: SwapRotatingRest;
}

/** Uma semana do plano: as semanas de cada colaborador e as violações das regras. */
export interface PlannedWeek {
  readonly weeks: readonly EmployeeWeek[];
  readonly violations: readonly RuleViolation[];
}

export interface PlanInput {
  readonly employees: readonly Employee[];
  readonly weekCount: number;
  readonly coverage?: CoveragePolicy;
}

export interface SwapInPlanInput {
  readonly plan: readonly PlannedWeek[];
  readonly weekIndex: number;
  readonly registration: string;
  readonly day: WeekDay;
  readonly coverage?: CoveragePolicy;
}

/**
 * Planeja várias semanas seguidas. Cada semana usa o histórico das anteriores,
 * então a rotação continua justa ao longo do período.
 *
 * Trocar uma folga numa semana refaz as semanas seguintes, porque o histórico
 * muda. As semanas anteriores à trocada ficam como estavam.
 */
export class PlanSchedule {
  constructor(private readonly deps: PlanScheduleDeps) {}

  generate(input: PlanInput): readonly PlannedWeek[] {
    if (!Number.isInteger(input.weekCount) || input.weekCount < 1) {
      throw new Error('O plano precisa de ao menos uma semana');
    }
    return this.extend(
      [],
      RotationHistory.empty(),
      input.employees,
      input.weekCount,
      input.coverage,
    );
  }

  swap(input: SwapInPlanInput): readonly PlannedWeek[] {
    const target = input.plan[input.weekIndex];
    if (target === undefined) {
      throw new Error(`Semana ${input.weekIndex} não existe no plano`);
    }
    const result = this.deps.swap.execute({
      weeks: target.weeks,
      registration: input.registration,
      day: input.day,
    });

    const kept = [
      ...input.plan.slice(0, input.weekIndex),
      { weeks: result.weeks, violations: result.violations },
    ];
    const employees = result.weeks.map((week) => week.employee);
    return this.extend(kept, this.historyOf(kept), employees, input.plan.length, input.coverage);
  }

  private extend(
    kept: readonly PlannedWeek[],
    initial: RotationHistory,
    employees: readonly Employee[],
    weekCount: number,
    coverage: CoveragePolicy | undefined,
  ): readonly PlannedWeek[] {
    const plan = [...kept];
    let history = initial;
    while (plan.length < weekCount) {
      const generated = this.deps.scheduler.generate(
        employees,
        history,
        coverage === undefined ? {} : { coverage },
      );
      history = generated.history;
      plan.push({
        weeks: generated.weeks,
        violations: this.deps.validator.validate(generated.weeks),
      });
    }
    return plan;
  }

  private historyOf(plan: readonly PlannedWeek[]): RotationHistory {
    let history = RotationHistory.empty();
    for (const planned of plan) {
      for (const week of planned.weeks) {
        for (const day of week.rotatingRestDays) {
          history = history.withRotatingRest(week.employee.registration, day);
        }
      }
    }
    return history;
  }
}
