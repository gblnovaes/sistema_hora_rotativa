import { describe, expect, it } from 'vitest';
import { measure } from './measure';
import type { Clock } from './Clock';
import type { Metrics } from './Metrics';

class FakeClock implements Clock {
  private readonly ticks: number[];
  constructor(ticks: number[]) {
    this.ticks = [...ticks];
  }
  now(): number {
    return 0;
  }
  monotonic(): number {
    return this.ticks.shift() ?? 0;
  }
}

class RecordingMetrics implements Metrics {
  readonly timings: { name: string; ms: number }[] = [];
  increment(): void {}
  timing(name: string, milliseconds: number): void {
    this.timings.push({ name, ms: milliseconds });
  }
}

describe('measure', () => {
  it('retorna o resultado e registra a duração', () => {
    const clock = new FakeClock([100, 130]);
    const metrics = new RecordingMetrics();

    const result = measure(clock, metrics, 'scheduler.generate', () => 42);

    expect(result).toBe(42);
    expect(metrics.timings).toEqual([{ name: 'scheduler.generate', ms: 30 }]);
  });

  it('registra a duração mesmo quando a operação lança erro', () => {
    const clock = new FakeClock([10, 25]);
    const metrics = new RecordingMetrics();

    expect(() =>
      measure(clock, metrics, 'scheduler.generate', () => {
        throw new Error('falhou');
      }),
    ).toThrow('falhou');
    expect(metrics.timings).toEqual([{ name: 'scheduler.generate', ms: 15 }]);
  });
});
