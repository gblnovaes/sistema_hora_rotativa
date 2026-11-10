import { describe, expect, it } from 'vitest';
import { adoptedShifts } from './adoptedShifts';

describe('adoptedShifts', () => {
  it('calcula 8h24 líquidas no dia útil e 6h no sábado', () => {
    const [weekday, saturday] = adoptedShifts();
    if (weekday === undefined || saturday === undefined) {
      throw new Error('turnos ausentes');
    }

    expect(weekday.window).toBe('08:00–17:24');
    expect(weekday.lunch).toBe('1h00');
    expect(weekday.gross).toBe('9h24');
    expect(weekday.net).toBe('8h24');

    expect(saturday.window).toBe('08:00–14:00');
    expect(saturday.lunch).toBe('0h00');
    expect(saturday.net).toBe('6h00');
  });
});
