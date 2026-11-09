import { describe, expect, it } from 'vitest';
import { DayAssignment, isRest } from './DayAssignment';
import { WEEK_DAYS, WEEKDAYS, WeekDay } from './WeekDay';

describe('DayAssignment', () => {
  it('reconhece folga fixa e rotativa como folga', () => {
    expect(isRest(DayAssignment.FixedRest)).toBe(true);
    expect(isRest(DayAssignment.RotatingRest)).toBe(true);
  });

  it('não trata trabalho como folga', () => {
    expect(isRest(DayAssignment.Work)).toBe(false);
  });
});

describe('WeekDay', () => {
  it('tem sete dias em ordem, de segunda a domingo', () => {
    expect(WEEK_DAYS).toHaveLength(7);
    expect(WEEK_DAYS[0]).toBe(WeekDay.Monday);
    expect(WEEK_DAYS[6]).toBe(WeekDay.Sunday);
  });

  it('isola os dias úteis de segunda a sexta', () => {
    expect(WEEKDAYS).toHaveLength(5);
    expect(WEEKDAYS).not.toContain(WeekDay.Saturday);
    expect(WEEKDAYS).not.toContain(WeekDay.Sunday);
  });
});
