import { describe, expect, it } from 'vitest';
import { Employee } from './Employee';
import { Unit } from './Unit';
import { WeekDay } from './WeekDay';

describe('Employee', () => {
  it('cria um colaborador com matrícula, nome e unidade', () => {
    const employee = Employee.create({
      registration: '1315',
      name: 'Claudenilson Miranda Moreira',
      unit: Unit.Administrativo,
    });
    expect(employee.registration).toBe('1315');
    expect(employee.name).toBe('Claudenilson Miranda Moreira');
    expect(employee.unit).toBe(Unit.Administrativo);
  });

  it('expõe a política da unidade', () => {
    const employee = Employee.create({ registration: '1377', name: 'Agatha', unit: Unit.Mooca });
    expect(employee.policy.fixedRestDays).toEqual([WeekDay.Sunday]);
    expect(employee.policy.rotatingRestCount).toBe(1);
  });

  it('remove espaços em volta da matrícula e do nome', () => {
    const employee = Employee.create({
      registration: '  667 ',
      name: '  Eliana  ',
      unit: Unit.Mooca,
    });
    expect(employee.registration).toBe('667');
    expect(employee.name).toBe('Eliana');
  });

  it('rejeita matrícula vazia', () => {
    expect(() => Employee.create({ registration: '   ', name: 'Ana', unit: Unit.Mooca })).toThrow();
  });

  it('rejeita nome vazio', () => {
    expect(() => Employee.create({ registration: '1', name: '  ', unit: Unit.Mooca })).toThrow();
  });
});
