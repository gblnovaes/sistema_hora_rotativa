import type { EmployeeWeek } from '../EmployeeWeek';
import type { RuleViolation } from '../RuleViolation';
import type { ScheduleRule } from '../ScheduleRule';

/**
 * R3 — a folga rotativa respeita a política: a quantidade bate com a unidade e
 * cada folga rotativa cai em um dia permitido (candidato).
 */
export class RotatingRestMatchesPolicy implements ScheduleRule {
  readonly name = 'rotating-rest-matches-policy';

  validate(week: EmployeeWeek): readonly RuleViolation[] {
    const { rotatingRestCount, rotatingRestCandidates } = week.employee.policy;
    const actual = week.rotatingRestDays;
    const violations: RuleViolation[] = [];
    const registration = week.employee.registration;

    if (actual.length !== rotatingRestCount) {
      violations.push({
        rule: this.name,
        employee: registration,
        message: `Esperado ${rotatingRestCount} folga(s) rotativa(s), encontrado ${actual.length}`,
      });
    }

    for (const day of actual) {
      if (!rotatingRestCandidates.includes(day)) {
        violations.push({
          rule: this.name,
          employee: registration,
          message: `${day} não é um dia permitido para folga rotativa`,
        });
      }
    }

    return violations;
  }
}
