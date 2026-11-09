import { describe, expect, it } from 'vitest';
import { TwoRestDaysPerWeek } from './TwoRestDaysPerWeek';
import { Employee } from '../Employee';
import { EmployeeWeek } from '../EmployeeWeek';
import { Unit } from '../Unit';
import { DayAssignment } from '../DayAssignment';
import { WeekDay } from '../WeekDay';

const rule = new TwoRestDaysPerWeek();
const mooca = Employee.create({ registration: '1377', name: 'Agatha', unit: Unit.Mooca });

describe('TwoRestDaysPerWeek (R1)', () => {
  it('aprova uma semana com 2 folgas', () => {
    const week = EmployeeWeek.create(mooca, WeekDay.Wednesday);
    expect(rule.validate(week)).toEqual([]);
  });

  it('acusa quando há 3 folgas', () => {
    const week = EmployeeWeek.fromAssignments(mooca, {
      [WeekDay.Monday]: DayAssignment.RotatingRest,
      [WeekDay.Tuesday]: DayAssignment.Work,
      [WeekDay.Wednesday]: DayAssignment.RotatingRest,
      [WeekDay.Thursday]: DayAssignment.Work,
      [WeekDay.Friday]: DayAssignment.Work,
      [WeekDay.Saturday]: DayAssignment.Work,
      [WeekDay.Sunday]: DayAssignment.FixedRest,
    });
    const violations = rule.validate(week);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.rule).toBe('two-rest-days-per-week');
    expect(violations[0]?.employee).toBe('1377');
  });

  it('acusa quando há apenas 1 folga', () => {
    const week = EmployeeWeek.fromAssignments(mooca, {
      [WeekDay.Monday]: DayAssignment.Work,
      [WeekDay.Tuesday]: DayAssignment.Work,
      [WeekDay.Wednesday]: DayAssignment.Work,
      [WeekDay.Thursday]: DayAssignment.Work,
      [WeekDay.Friday]: DayAssignment.Work,
      [WeekDay.Saturday]: DayAssignment.Work,
      [WeekDay.Sunday]: DayAssignment.FixedRest,
    });
    expect(rule.validate(week)).toHaveLength(1);
  });
});
