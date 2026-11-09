import { describe, expect, it } from 'vitest';
import { Duration } from './Duration';

describe('Duration', () => {
  it('cria a partir de minutos inteiros', () => {
    expect(Duration.fromMinutes(504).minutes).toBe(504);
  });

  it('cria a partir de horas e minutos', () => {
    expect(Duration.fromHoursMinutes(8, 24).minutes).toBe(504);
  });

  it('rejeita minutos não inteiros', () => {
    expect(() => Duration.fromMinutes(8.5)).toThrow();
  });

  it('rejeita duração negativa', () => {
    expect(() => Duration.fromMinutes(-1)).toThrow();
  });

  it('rejeita minutos fora de 0..59 em fromHoursMinutes', () => {
    expect(() => Duration.fromHoursMinutes(8, 60)).toThrow();
    expect(() => Duration.fromHoursMinutes(8, -1)).toThrow();
  });

  it('rejeita horas negativas ou não inteiras em fromHoursMinutes', () => {
    expect(() => Duration.fromHoursMinutes(-1, 0)).toThrow();
    expect(() => Duration.fromHoursMinutes(8.5, 0)).toThrow();
  });

  it('soma durações', () => {
    expect(Duration.fromMinutes(504).plus(Duration.fromMinutes(360)).minutes).toBe(864);
  });

  it('subtrai durações', () => {
    expect(Duration.fromHoursMinutes(9, 24).minus(Duration.fromHoursMinutes(1, 0)).minutes).toBe(
      504,
    );
  });

  it('não permite subtração que resulte em negativo', () => {
    expect(() => Duration.fromMinutes(60).minus(Duration.fromMinutes(61))).toThrow();
  });

  it('soma uma coleção de durações', () => {
    const week = Duration.sum([
      Duration.fromHoursMinutes(8, 24),
      Duration.fromHoursMinutes(8, 24),
      Duration.fromHoursMinutes(8, 24),
      Duration.fromHoursMinutes(8, 24),
      Duration.fromHoursMinutes(8, 24),
    ]);
    expect(week.minutes).toBe(2520);
  });

  it('soma vazia é zero', () => {
    expect(Duration.sum([]).minutes).toBe(0);
  });

  it('compara igualdade por valor', () => {
    expect(Duration.fromMinutes(504).equals(Duration.fromHoursMinutes(8, 24))).toBe(true);
    expect(Duration.fromMinutes(504).equals(Duration.fromMinutes(505))).toBe(false);
  });

  it('formata como HhMM', () => {
    expect(Duration.fromMinutes(504).toString()).toBe('8h24');
    expect(Duration.fromMinutes(360).toString()).toBe('6h00');
    expect(Duration.fromMinutes(2520).toString()).toBe('42h00');
  });
});
