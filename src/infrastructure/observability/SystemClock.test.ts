import { describe, expect, it } from 'vitest';
import { SystemClock } from './SystemClock';

describe('SystemClock', () => {
  it('now devolve um timestamp próximo do relógio real', () => {
    const clock = new SystemClock();
    const before = Date.now();
    const value = clock.now();
    expect(value).toBeGreaterThanOrEqual(before);
  });

  it('monotonic não retrocede', () => {
    const clock = new SystemClock();
    const first = clock.monotonic();
    const second = clock.monotonic();
    expect(second).toBeGreaterThanOrEqual(first);
  });
});
