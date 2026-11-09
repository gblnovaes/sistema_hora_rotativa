import { describe, expect, it } from 'vitest';
import { InMemoryMetrics } from './InMemoryMetrics';

describe('InMemoryMetrics', () => {
  it('acumula contadores, com incremento padrão 1', () => {
    const metrics = new InMemoryMetrics();
    metrics.increment('violations');
    metrics.increment('violations');
    metrics.increment('backtracks', 3);

    const snapshot = metrics.snapshot();
    expect(snapshot.counters['violations']).toBe(2);
    expect(snapshot.counters['backtracks']).toBe(3);
  });

  it('agrupa durações por nome', () => {
    const metrics = new InMemoryMetrics();
    metrics.timing('scheduler.generate', 12);
    metrics.timing('scheduler.generate', 18);

    expect(metrics.snapshot().timings['scheduler.generate']).toEqual([12, 18]);
  });

  it('o snapshot é um retrato isolado do estado atual', () => {
    const metrics = new InMemoryMetrics();
    metrics.increment('violations');
    const snapshot = metrics.snapshot();

    metrics.increment('violations');
    expect(snapshot.counters['violations']).toBe(1);
  });
});
