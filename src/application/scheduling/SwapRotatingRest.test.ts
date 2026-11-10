import { describe, expect, it } from 'vitest';
import { Employee } from '@domain/scheduling/Employee';
import { EmployeeWeek } from '@domain/scheduling/EmployeeWeek';
import { DayAssignment } from '@domain/scheduling/DayAssignment';
import type { RuleViolation } from '@domain/scheduling/RuleViolation';
import type { ScheduleRule } from '@domain/scheduling/ScheduleRule';
import { ScheduleValidator, defaultScheduleRules } from '@domain/scheduling/ScheduleValidator';
import { Unit } from '@domain/scheduling/Unit';
import { WeekDay } from '@domain/scheduling/WeekDay';
import { SwapRotatingRest } from './SwapRotatingRest';

function mooca(registration: string): Employee {
  return Employee.create({ registration, name: `Mooca ${registration}`, unit: Unit.Mooca });
}

function admin(registration: string): Employee {
  return Employee.create({
    registration,
    name: `Admin ${registration}`,
    unit: Unit.Administrativo,
  });
}

class FlagFriday implements ScheduleRule {
  readonly name = 'flag-friday';

  validate(week: EmployeeWeek): readonly RuleViolation[] {
    if (week.assignmentOf(WeekDay.Friday) === DayAssignment.RotatingRest) {
      return [{ rule: this.name, employee: week.employee.registration, message: 'sexta marcada' }];
    }
    return [];
  }
}

const rules = new SwapRotatingRest({ validator: new ScheduleValidator(defaultScheduleRules()) });

describe('SwapRotatingRest', () => {
  it('move a folga rotativa e devolve o dia anterior para trabalho', () => {
    const weeks = [
      EmployeeWeek.create(mooca('2'), WeekDay.Monday),
      EmployeeWeek.create(admin('1')),
    ];

    const result = rules.execute({ weeks, registration: '2', day: WeekDay.Friday });
    const moved = result.weeks[0];

    expect(result.violations).toEqual([]);
    expect(moved?.assignmentOf(WeekDay.Friday)).toBe(DayAssignment.RotatingRest);
    expect(moved?.assignmentOf(WeekDay.Monday)).toBe(DayAssignment.Work);
    expect(moved?.assignmentOf(WeekDay.Sunday)).toBe(DayAssignment.FixedRest);
    expect(result.weeks[1]).toBe(weeks[1]);
  });

  it('revalida a semana já trocada', () => {
    const swap = new SwapRotatingRest({ validator: new ScheduleValidator([new FlagFriday()]) });
    const weeks = [EmployeeWeek.create(mooca('2'), WeekDay.Monday)];

    const toFriday = swap.execute({ weeks, registration: '2', day: WeekDay.Friday });
    const toTuesday = swap.execute({ weeks, registration: '2', day: WeekDay.Tuesday });

    expect(toFriday.violations).toEqual([
      { rule: 'flag-friday', employee: '2', message: 'sexta marcada' },
    ]);
    expect(toTuesday.violations).toEqual([]);
  });

  it('não altera a escala quando o dia pedido já é a folga rotativa', () => {
    const weeks = [EmployeeWeek.create(mooca('2'), WeekDay.Wednesday)];
    const result = rules.execute({ weeks, registration: '2', day: WeekDay.Wednesday });
    expect(result.weeks).toBe(weeks);
    expect(result.violations).toEqual([]);
  });

  it('recusa colaborador fora da escala, unidade sem rotativa e dia proibido', () => {
    const weeks = [
      EmployeeWeek.create(mooca('2'), WeekDay.Monday),
      EmployeeWeek.create(admin('1')),
    ];

    expect(() => rules.execute({ weeks, registration: '9', day: WeekDay.Tuesday })).toThrow(
      /não está na escala/,
    );
    expect(() => rules.execute({ weeks, registration: '1', day: WeekDay.Wednesday })).toThrow(
      /não tem folga rotativa/,
    );
    expect(() => rules.execute({ weeks, registration: '2', day: WeekDay.Sunday })).toThrow();
    expect(weeks[0]?.assignmentOf(WeekDay.Monday)).toBe(DayAssignment.RotatingRest);
  });
});
