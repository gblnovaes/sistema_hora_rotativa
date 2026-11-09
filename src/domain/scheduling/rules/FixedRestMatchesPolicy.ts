import type { EmployeeWeek } from '../EmployeeWeek';
import type { RuleViolation } from '../RuleViolation';
import type { ScheduleRule } from '../ScheduleRule';

function sameDays(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const setB = new Set(b);
  return a.every((day) => setB.has(day));
}

/**
 * R2 e R3 — as folgas fixas da semana batem exatamente com a política da unidade.
 * ADMINISTRATIVO: sábado e domingo. MOOCA: domingo.
 */
export class FixedRestMatchesPolicy implements ScheduleRule {
  readonly name = 'fixed-rest-matches-policy';

  validate(week: EmployeeWeek): readonly RuleViolation[] {
    const expected = week.employee.policy.fixedRestDays;
    const actual = week.fixedRestDays;

    if (sameDays(expected, actual)) {
      return [];
    }
    return [
      {
        rule: this.name,
        employee: week.employee.registration,
        message: `Folgas fixas esperadas [${expected.join(', ')}], encontradas [${actual.join(', ')}]`,
      },
    ];
  }
}
