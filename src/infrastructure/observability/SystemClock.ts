import type { Clock } from '@application/observability/Clock';

/** Relógio real do sistema. */
export class SystemClock implements Clock {
  now(): number {
    return Date.now();
  }

  monotonic(): number {
    return performance.now();
  }
}
