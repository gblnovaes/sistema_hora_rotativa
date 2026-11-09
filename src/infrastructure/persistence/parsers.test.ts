import { describe, expect, it } from 'vitest';
import { parseUnit, parseWeekDay } from './parsers';
import { Unit } from '@domain/scheduling/Unit';
import { WeekDay } from '@domain/scheduling/WeekDay';

describe('parsers', () => {
  it('converte strings válidas', () => {
    expect(parseUnit('MOOCA')).toBe(Unit.Mooca);
    expect(parseWeekDay('MONDAY')).toBe(WeekDay.Monday);
  });

  it('rejeita unidade desconhecida', () => {
    expect(() => parseUnit('OUTRA')).toThrow();
  });

  it('rejeita dia desconhecido', () => {
    expect(() => parseWeekDay('FUNDAY')).toThrow();
  });
});
