import type { EmployeeWeek } from './EmployeeWeek';
import type { RuleViolation } from './RuleViolation';
import type { ScheduleRule } from './ScheduleRule';
import { TwoRestDaysPerWeek } from './rules/TwoRestDaysPerWeek';
import { FixedRestMatchesPolicy } from './rules/FixedRestMatchesPolicy';
import { RotatingRestMatchesPolicy } from './rules/RotatingRestMatchesPolicy';
import { NoSundayWork } from './rules/NoSundayWork';

/**
 * Roda um conjunto de regras sobre as semanas dos colaboradores e agrega as
 * violações. As regras são injetadas (Dependency Inversion): o validador não
 * conhece nenhuma regra concreta.
 */
export class ScheduleValidator {
  constructor(private readonly rules: readonly ScheduleRule[]) {}

  validate(weeks: readonly EmployeeWeek[]): readonly RuleViolation[] {
    return weeks.flatMap((week) => this.rules.flatMap((rule) => rule.validate(week)));
  }

  isValid(weeks: readonly EmployeeWeek[]): boolean {
    return this.validate(weeks).length === 0;
  }
}

/** Conjunto padrão de regras por colaborador (R1–R4). */
export function defaultScheduleRules(): readonly ScheduleRule[] {
  return [
    new TwoRestDaysPerWeek(),
    new FixedRestMatchesPolicy(),
    new RotatingRestMatchesPolicy(),
    new NoSundayWork(),
  ];
}
