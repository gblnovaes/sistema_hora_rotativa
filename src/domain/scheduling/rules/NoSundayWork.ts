import { DayAssignment } from '../DayAssignment';
import type { EmployeeWeek } from '../EmployeeWeek';
import type { RuleViolation } from '../RuleViolation';
import type { ScheduleRule } from '../ScheduleRule';
import { WeekDay } from '../WeekDay';

/** R4 — ninguém trabalha no domingo. */
export class NoSundayWork implements ScheduleRule {
  readonly name = 'no-sunday-work';

  validate(week: EmployeeWeek): readonly RuleViolation[] {
    if (week.assignmentOf(WeekDay.Sunday) !== DayAssignment.Work) {
      return [];
    }
    return [
      {
        rule: this.name,
        employee: week.employee.registration,
        message: 'Domingo não pode ser dia de trabalho',
      },
    ];
  }
}
