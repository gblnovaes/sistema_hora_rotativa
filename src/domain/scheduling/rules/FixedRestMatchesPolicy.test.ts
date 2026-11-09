import { describe, expect, it } from 'vitest';
import { FixedRestMatchesPolicy } from './FixedRestMatchesPolicy';
import { Employee } from '../Employee';
import { EmployeeWeek } from '../EmployeeWeek';
import { Unit } from '../Unit';
import { DayAssignment } from '../DayAssignment';
import { WeekDay } from '../WeekDay';

const rule = new FixedRestMatchesPolicy();
const admin = Employee.create({
  registration: '1315',
  name: 'Claudenilson',
  unit: Unit.Administrativo,
});
const mooca = Employee.create({ registration: '1377', name: 'Agatha', unit: Unit.Mooca });

describe('FixedRestMatchesPolicy (R2/R3)', () => {
  it('aprova ADMINISTRATIVO com folga fixa sábado e domingo', () => {
    expect(rule.validate(EmployeeWeek.create(admin))).toEqual([]);
  });

  it('aprova MOOCA com folga fixa no domingo', () => {
    expect(rule.validate(EmployeeWeek.create(mooca, WeekDay.Friday))).toEqual([]);
  });

  it('acusa MOOCA sem a folga fixa de domingo', () => {
    const week = EmployeeWeek.fromAssignments(mooca, {
      [WeekDay.Monday]: DayAssignment.Work,
      [WeekDay.Tuesday]: DayAssignment.Work,
      [WeekDay.Wednesday]: DayAssignment.Work,
      [WeekDay.Thursday]: DayAssignment.Work,
      [WeekDay.Friday]: DayAssignment.RotatingRest,
      [WeekDay.Saturday]: DayAssignment.RotatingRest,
      [WeekDay.Sunday]: DayAssignment.Work,
    });
    const violations = rule.validate(week);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.rule).toBe('fixed-rest-matches-policy');
  });
});
