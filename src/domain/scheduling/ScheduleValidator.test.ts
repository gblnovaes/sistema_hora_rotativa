import { describe, expect, it } from 'vitest';
import { defaultScheduleRules, ScheduleValidator } from './ScheduleValidator';
import { Employee } from './Employee';
import { EmployeeWeek } from './EmployeeWeek';
import { Unit } from './Unit';
import { DayAssignment } from './DayAssignment';
import { WeekDay } from './WeekDay';

const admin = Employee.create({
  registration: '1315',
  name: 'Claudenilson',
  unit: Unit.Administrativo,
});
const mooca = Employee.create({ registration: '1377', name: 'Agatha', unit: Unit.Mooca });

describe('ScheduleValidator', () => {
  const validator = new ScheduleValidator(defaultScheduleRules());

  it('aprova um conjunto de semanas válidas', () => {
    const weeks = [EmployeeWeek.create(admin), EmployeeWeek.create(mooca, WeekDay.Thursday)];
    expect(validator.isValid(weeks)).toBe(true);
    expect(validator.validate(weeks)).toEqual([]);
  });

  it('agrega violações de várias regras e vários colaboradores', () => {
    // MOOCA trabalhando no domingo e sem folga de domingo: viola R4 e R2/R3.
    const broken = EmployeeWeek.fromAssignments(mooca, {
      [WeekDay.Monday]: DayAssignment.RotatingRest,
      [WeekDay.Tuesday]: DayAssignment.Work,
      [WeekDay.Wednesday]: DayAssignment.Work,
      [WeekDay.Thursday]: DayAssignment.Work,
      [WeekDay.Friday]: DayAssignment.Work,
      [WeekDay.Saturday]: DayAssignment.Work,
      [WeekDay.Sunday]: DayAssignment.Work,
    });
    const weeks = [EmployeeWeek.create(admin), broken];
    const violations = validator.validate(weeks);

    expect(validator.isValid(weeks)).toBe(false);
    expect(violations.every((violation) => violation.employee === '1377')).toBe(true);
    expect(violations.map((violation) => violation.rule)).toContain('no-sunday-work');
    expect(violations.map((violation) => violation.rule)).toContain('fixed-rest-matches-policy');
  });

  it('sem regras, qualquer semana é válida', () => {
    const empty = new ScheduleValidator([]);
    expect(empty.isValid([EmployeeWeek.create(admin)])).toBe(true);
  });
});
