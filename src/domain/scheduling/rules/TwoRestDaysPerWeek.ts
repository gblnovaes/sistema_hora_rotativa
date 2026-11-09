import type { EmployeeWeek } from '../EmployeeWeek';
import type { RuleViolation } from '../RuleViolation';
import type { ScheduleRule } from '../ScheduleRule';
import { REST_DAYS_PER_WEEK } from '../Unit';

/** R1 — cada colaborador tem exatamente 2 folgas por semana. */
export class TwoRestDaysPerWeek implements ScheduleRule {
  readonly name = 'two-rest-days-per-week';

  validate(week: EmployeeWeek): readonly RuleViolation[] {
    const count = week.restDays.length;
    if (count === REST_DAYS_PER_WEEK) {
      return [];
    }
    return [
      {
        rule: this.name,
        employee: week.employee.registration,
        message: `Esperado ${REST_DAYS_PER_WEEK} folgas na semana, encontrado ${count}`,
      },
    ];
  }
}
