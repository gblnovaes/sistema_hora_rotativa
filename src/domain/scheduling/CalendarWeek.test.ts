import { describe, expect, it } from 'vitest';
import {
  addDays,
  fromIsoDate,
  mondayOf,
  toIsoDate,
  weekStarts,
  weeksBetween,
} from './CalendarWeek';

describe('CalendarWeek', () => {
  it('acha a segunda-feira de qualquer dia da semana, inclusive o domingo', () => {
    expect(toIsoDate(mondayOf(new Date(2026, 10, 10)))).toBe('2026-11-09'); // terça
    expect(toIsoDate(mondayOf(new Date(2026, 10, 9)))).toBe('2026-11-09'); // segunda
    expect(toIsoDate(mondayOf(new Date(2026, 10, 15)))).toBe('2026-11-09'); // domingo
  });

  it('soma dias atravessando mês e ano', () => {
    expect(toIsoDate(addDays(new Date(2026, 11, 28), 7))).toBe('2027-01-04');
  });

  it('formata e lê datas locais sem deslocar o dia', () => {
    expect(toIsoDate(fromIsoDate('2026-03-05'))).toBe('2026-03-05');
  });

  it('lista segundas-feiras consecutivas a partir da semana de referência', () => {
    expect(weekStarts(new Date(2026, 10, 10), 3)).toEqual([
      '2026-11-09',
      '2026-11-16',
      '2026-11-23',
    ]);
  });

  it('conta semanas entre duas segundas-feiras, inclusive atravessando o horário de verão', () => {
    expect(weeksBetween('2026-11-09', '2026-11-09')).toBe(0);
    expect(weeksBetween('2026-11-09', '2026-12-07')).toBe(4);
    expect(weeksBetween('2026-10-05', '2026-11-09')).toBe(5);
    expect(weeksBetween('2026-11-16', '2026-11-09')).toBe(-1);
  });
});
