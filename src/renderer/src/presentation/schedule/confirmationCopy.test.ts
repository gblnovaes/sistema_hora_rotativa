import { describe, expect, it } from 'vitest';
import { WeekDay } from '@domain/scheduling/WeekDay';
import { confirmationCopy } from './confirmationCopy';
import type { ScheduleWeekView } from './scheduleGateway';

const weeks: ScheduleWeekView[] = [
  { index: 0, startDate: '2026-11-09', rows: [], violations: [] },
  { index: 1, startDate: '2026-11-16', rows: [], violations: [] },
];

describe('confirmationCopy', () => {
  it('avisa que gerar de novo substitui a escala e perde as trocas', () => {
    const copy = confirmationCopy({ kind: 'regenerate' }, weeks);

    expect(copy.title).toBe('Gerar uma nova escala?');
    expect(copy.body).toMatch(/substituída/);
    expect(copy.body).toMatch(/trocas manuais/);
    expect(copy.confirmLabel).toBe('Gerar nova escala');
  });

  it('descreve a troca com nome, dias e semana, e o efeito nas semanas seguintes', () => {
    const copy = confirmationCopy(
      {
        kind: 'move',
        weekIndex: 1,
        registration: '1',
        name: 'Rafael',
        from: WeekDay.Wednesday,
        to: WeekDay.Friday,
      },
      weeks,
    );

    expect(copy.title).toBe('Mover a folga de Rafael?');
    expect(copy.body).toContain('de Qua para Sex na semana 16/11 – 22/11');
    expect(copy.body).toMatch(/semanas seguintes serão refeitas/);
    expect(copy.body).toMatch(/salva na hora/);
    expect(copy.confirmLabel).toBe('Mover folga');
  });

  it('não quebra quando a pessoa não tinha folga rotativa ou a semana sumiu', () => {
    const copy = confirmationCopy(
      {
        kind: 'move',
        weekIndex: 9,
        registration: '1',
        name: 'Rafael',
        from: undefined,
        to: WeekDay.Friday,
      },
      weeks,
    );

    expect(copy.body).toContain('para Sex.');
    expect(copy.body).not.toContain('semana 1');
  });
});
