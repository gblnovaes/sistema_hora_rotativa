import { describe, expect, it } from 'vitest';
import { RotatingRestMatchesPolicy } from './RotatingRestMatchesPolicy';
import { Employee } from '../Employee';
import { EmployeeWeek } from '../EmployeeWeek';
import { Unit } from '../Unit';
import { DayAssignment } from '../DayAssignment';
import { WeekDay } from '../WeekDay';

const rule = new RotatingRestMatchesPolicy();
const admin = Employee.create({
  registration: '1315',
  name: 'Claudenilson',
  unit: Unit.Administrativo,
});
const mooca = Employee.create({ registration: '1377', name: 'Agatha', unit: Unit.Mooca });

describe('RotatingRestMatchesPolicy (R3)', () => {
  it('aprova MOOCA com exatamente 1 folga rotativa em dia válido', () => {
    expect(rule.validate(EmployeeWeek.create(mooca, WeekDay.Tuesday))).toEqual([]);
  });

  it('aprova ADMINISTRATIVO sem folga rotativa', () => {
    expect(rule.validate(EmployeeWeek.create(admin))).toEqual([]);
  });

  it('acusa ADMINISTRATIVO com uma folga rotativa indevida', () => {
    const week = EmployeeWeek.fromAssignments(admin, {
      [WeekDay.Monday]: DayAssignment.RotatingRest,
      [WeekDay.Tuesday]: DayAssignment.Work,
      [WeekDay.Wednesday]: DayAssignment.Work,
      [WeekDay.Thursday]: DayAssignment.Work,
      [WeekDay.Friday]: DayAssignment.Work,
      [WeekDay.Saturday]: DayAssignment.FixedRest,
      [WeekDay.Sunday]: DayAssignment.FixedRest,
    });
    const violations = rule.validate(week);
    // Viola a contagem (0 esperadas) e o dia (segunda não é candidato para ADMIN).
    expect(violations).toHaveLength(2);
    expect(violations.some((violation) => violation.message.includes('Esperado 0'))).toBe(true);
    expect(
      violations.some((violation) => violation.message.includes('não é um dia permitido')),
    ).toBe(true);
  });

  it('acusa MOOCA com folga rotativa em dia não permitido (domingo)', () => {
    const week = EmployeeWeek.fromAssignments(mooca, {
      [WeekDay.Monday]: DayAssignment.Work,
      [WeekDay.Tuesday]: DayAssignment.Work,
      [WeekDay.Wednesday]: DayAssignment.Work,
      [WeekDay.Thursday]: DayAssignment.Work,
      [WeekDay.Friday]: DayAssignment.Work,
      [WeekDay.Saturday]: DayAssignment.Work,
      [WeekDay.Sunday]: DayAssignment.RotatingRest,
    });
    const violations = rule.validate(week);
    expect(
      violations.some((violation) => violation.message.includes('não é um dia permitido')),
    ).toBe(true);
  });
});
