import { describe, expect, it } from 'vitest';
import { RotationHistory } from './RotationHistory';
import { WeekDay } from './WeekDay';

describe('RotationHistory', () => {
  it('começa vazio: contagem zero e sem última folga', () => {
    const history = RotationHistory.empty();
    expect(history.restCount('1377', WeekDay.Monday)).toBe(0);
    expect(history.lastRest('1377')).toBeUndefined();
  });

  it('registra uma folga rotativa e conta por dia', () => {
    const history = RotationHistory.empty().withRotatingRest('1377', WeekDay.Monday);
    expect(history.restCount('1377', WeekDay.Monday)).toBe(1);
    expect(history.restCount('1377', WeekDay.Tuesday)).toBe(0);
    expect(history.lastRest('1377')).toBe(WeekDay.Monday);
  });

  it('acumula contagens e atualiza a última folga', () => {
    const history = RotationHistory.empty()
      .withRotatingRest('1377', WeekDay.Monday)
      .withRotatingRest('1377', WeekDay.Monday)
      .withRotatingRest('1377', WeekDay.Friday);
    expect(history.restCount('1377', WeekDay.Monday)).toBe(2);
    expect(history.restCount('1377', WeekDay.Friday)).toBe(1);
    expect(history.lastRest('1377')).toBe(WeekDay.Friday);
  });

  it('é imutável: registrar não altera o histórico anterior', () => {
    const base = RotationHistory.empty();
    const next = base.withRotatingRest('1377', WeekDay.Monday);
    expect(base.restCount('1377', WeekDay.Monday)).toBe(0);
    expect(next.restCount('1377', WeekDay.Monday)).toBe(1);
  });

  it('separa o histórico por colaborador', () => {
    const history = RotationHistory.empty()
      .withRotatingRest('1377', WeekDay.Monday)
      .withRotatingRest('667', WeekDay.Tuesday);
    expect(history.restCount('1377', WeekDay.Monday)).toBe(1);
    expect(history.restCount('667', WeekDay.Monday)).toBe(0);
    expect(history.restCount('667', WeekDay.Tuesday)).toBe(1);
  });
});
