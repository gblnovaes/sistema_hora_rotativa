import { describe, expect, it } from 'vitest';
import { runIpc } from './runIpc';
import type { Logger } from '@application/observability/Logger';

class RecordingLogger implements Logger {
  readonly errors: string[] = [];
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(message: string): void {
    this.errors.push(message);
  }
  child(): Logger {
    return this;
  }
}

describe('runIpc', () => {
  it('embrulha o sucesso em { ok: true, data }', async () => {
    const logger = new RecordingLogger();
    const result = await runIpc(logger, 'scope', () => Promise.resolve(42));
    expect(result).toEqual({ ok: true, data: 42 });
    expect(logger.errors).toHaveLength(0);
  });

  it('converte um erro em { ok: false, error } e registra', async () => {
    const logger = new RecordingLogger();
    const result = await runIpc(logger, 'schedule:generate', () =>
      Promise.reject(new Error('sem escala possível')),
    );
    expect(result).toEqual({ ok: false, error: 'sem escala possível' });
    expect(logger.errors).toHaveLength(1);
  });
});
