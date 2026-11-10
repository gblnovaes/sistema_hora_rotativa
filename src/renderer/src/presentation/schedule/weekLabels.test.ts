import { describe, expect, it } from 'vitest';
import { weekRangeLabel, weekTabLabel } from './weekLabels';

describe('weekLabels', () => {
  it('mostra o intervalo de segunda a domingo', () => {
    expect(weekRangeLabel('2026-11-09')).toBe('09/11 – 15/11');
  });

  it('atravessa a virada de mês e de ano', () => {
    expect(weekRangeLabel('2026-12-28')).toBe('28/12 – 03/01');
  });

  it('destaca a semana atual na aba', () => {
    expect(weekTabLabel(0, '2026-11-09')).toBe('Atual · 09/11 – 15/11');
    expect(weekTabLabel(2, '2026-11-23')).toBe('23/11 – 29/11');
  });
});
