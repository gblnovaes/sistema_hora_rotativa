import type { Metrics } from '@application/observability/Metrics';

export interface MetricsSnapshot {
  readonly counters: Readonly<Record<string, number>>;
  readonly timings: Readonly<Record<string, readonly number[]>>;
}

/**
 * Métricas em memória. Acumula contadores e durações e expõe um snapshot.
 * Serve de fonte para a tela de Diagnóstico e para os testes.
 */
export class InMemoryMetrics implements Metrics {
  private readonly counters = new Map<string, number>();
  private readonly timings = new Map<string, number[]>();

  increment(name: string, value = 1): void {
    this.counters.set(name, (this.counters.get(name) ?? 0) + value);
  }

  timing(name: string, milliseconds: number): void {
    const series = this.timings.get(name) ?? [];
    series.push(milliseconds);
    this.timings.set(name, series);
  }

  snapshot(): MetricsSnapshot {
    return {
      counters: Object.fromEntries(this.counters),
      timings: Object.fromEntries([...this.timings].map(([name, series]) => [name, [...series]])),
    };
  }
}
