import { describe, expect, it } from 'vitest';
import { EmployeeWeek } from './EmployeeWeek';
import { Employee } from './Employee';
import { Unit } from './Unit';
import { DayAssignment } from './DayAssignment';
import { WeekDay } from './WeekDay';

function admin(): Employee {
  return Employee.create({ registration: '1315', name: 'Claudenilson', unit: Unit.Administrativo });
}

function mooca(): Employee {
  return Employee.create({ registration: '1377', name: 'Agatha', unit: Unit.Mooca });
}

describe('EmployeeWeek — ADMINISTRATIVO', () => {
  it('folga sábado e domingo e trabalha de segunda a sexta', () => {
    const week = EmployeeWeek.create(admin());
    expect(week.restDays).toEqual([WeekDay.Saturday, WeekDay.Sunday]);
    expect(week.workDays).toEqual([
      WeekDay.Monday,
      WeekDay.Tuesday,
      WeekDay.Wednesday,
      WeekDay.Thursday,
      WeekDay.Friday,
    ]);
    expect(week.assignmentOf(WeekDay.Saturday)).toBe(DayAssignment.FixedRest);
    expect(week.assignmentOf(WeekDay.Monday)).toBe(DayAssignment.Work);
  });

  it('rejeita folga rotativa, pois a unidade não tem', () => {
    expect(() => EmployeeWeek.create(admin(), WeekDay.Wednesday)).toThrow();
  });
});

describe('EmployeeWeek — MOOCA', () => {
  it('folga domingo mais a folga rotativa escolhida', () => {
    const week = EmployeeWeek.create(mooca(), WeekDay.Friday);
    expect(week.restDays).toEqual([WeekDay.Friday, WeekDay.Sunday]);
    expect(week.assignmentOf(WeekDay.Friday)).toBe(DayAssignment.RotatingRest);
    expect(week.assignmentOf(WeekDay.Sunday)).toBe(DayAssignment.FixedRest);
    expect(week.assignmentOf(WeekDay.Saturday)).toBe(DayAssignment.Work);
  });

  it('aceita a folga rotativa no sábado', () => {
    const week = EmployeeWeek.create(mooca(), WeekDay.Saturday);
    expect(week.restDays).toEqual([WeekDay.Saturday, WeekDay.Sunday]);
  });

  it('exige uma folga rotativa', () => {
    expect(() => EmployeeWeek.create(mooca())).toThrow();
  });

  it('rejeita folga rotativa no domingo (já é folga fixa)', () => {
    expect(() => EmployeeWeek.create(mooca(), WeekDay.Sunday)).toThrow();
  });

  it('sempre resulta em exatamente 2 folgas', () => {
    const week = EmployeeWeek.create(mooca(), WeekDay.Monday);
    expect(week.restDays).toHaveLength(2);
  });
});
