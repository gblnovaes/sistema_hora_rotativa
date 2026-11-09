import { describe, expect, it } from 'vitest';
import { NoSundayWork } from './NoSundayWork';
import { Employee } from '../Employee';
import { EmployeeWeek } from '../EmployeeWeek';
import { Unit } from '../Unit';
import { DayAssignment } from '../DayAssignment';
import { WeekDay } from '../WeekDay';

const rule = new NoSundayWork();
const mooca = Employee.create({ registration: '1377', name: 'Agatha', unit: Unit.Mooca });

describe('NoSundayWork (R4)', () => {
  it('aprova uma semana que folga no domingo', () => {
    const week = EmployeeWeek.create(mooca, WeekDay.Wednesday);
    expect(rule.validate(week)).toEqual([]);
  });

  it('acusa trabalho no domingo', () => {
    const week = EmployeeWeek.fromAssignments(mooca, {
      [WeekDay.Monday]: DayAssignment.RotatingRest,
      [WeekDay.Tuesday]: DayAssignment.FixedRest,
      [WeekDay.Wednesday]: DayAssignment.Work,
      [WeekDay.Thursday]: DayAssignment.Work,
      [WeekDay.Friday]: DayAssignment.Work,
      [WeekDay.Saturday]: DayAssignment.Work,
      [WeekDay.Sunday]: DayAssignment.Work,
    });
    const violations = rule.validate(week);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.rule).toBe('no-sunday-work');
  });
});
