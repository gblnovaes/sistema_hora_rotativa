import { describe, expect, it } from 'vitest';
import { WorkShift } from './WorkShift';
import { Duration } from './Duration';

describe('WorkShift', () => {
  it('turno de dia útil 08:00–17:24 com 1h de almoço resulta em 8h24 líquidos', () => {
    const shift = WorkShift.create({
      start: { hour: 8, minute: 0 },
      end: { hour: 17, minute: 24 },
      lunch: Duration.fromHoursMinutes(1, 0),
    });
    expect(shift.netWork.minutes).toBe(504);
  });

  it('turno de sábado 08:00–14:00 sem almoço resulta em 6h líquidas', () => {
    const shift = WorkShift.create({
      start: { hour: 8, minute: 0 },
      end: { hour: 14, minute: 0 },
      lunch: Duration.fromMinutes(0),
    });
    expect(shift.netWork.minutes).toBe(360);
  });

  it('expõe a presença bruta (sem descontar o almoço)', () => {
    const shift = WorkShift.create({
      start: { hour: 8, minute: 0 },
      end: { hour: 17, minute: 24 },
      lunch: Duration.fromHoursMinutes(1, 0),
    });
    expect(shift.grossSpan.minutes).toBe(564);
  });

  it('rejeita término anterior ou igual ao início', () => {
    expect(() =>
      WorkShift.create({
        start: { hour: 17, minute: 0 },
        end: { hour: 8, minute: 0 },
        lunch: Duration.fromMinutes(0),
      }),
    ).toThrow();
  });

  it('rejeita almoço maior que a presença', () => {
    expect(() =>
      WorkShift.create({
        start: { hour: 8, minute: 0 },
        end: { hour: 9, minute: 0 },
        lunch: Duration.fromHoursMinutes(2, 0),
      }),
    ).toThrow();
  });

  it('rejeita hora do dia inválida', () => {
    expect(() =>
      WorkShift.create({
        start: { hour: 24, minute: 0 },
        end: { hour: 25, minute: 0 },
        lunch: Duration.fromMinutes(0),
      }),
    ).toThrow();
  });

  it('rejeita minuto do dia inválido', () => {
    expect(() =>
      WorkShift.create({
        start: { hour: 8, minute: 60 },
        end: { hour: 17, minute: 24 },
        lunch: Duration.fromMinutes(0),
      }),
    ).toThrow();
  });
});
