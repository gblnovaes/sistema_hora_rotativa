import { describe, expect, it } from 'vitest';
import { reportError } from './reportError';
import type { Logger, LogContext } from './Logger';

class RecordingLogger implements Logger {
  readonly errors: { message: string; context?: LogContext }[] = [];
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(message: string, context?: LogContext): void {
    this.errors.push(context ? { message, context } : { message });
  }
  child(): Logger {
    return this;
  }
}

describe('reportError', () => {
  it('registra a mensagem e o stack de um Error', () => {
    const logger = new RecordingLogger();
    reportError(logger, 'scheduler', new Error('sem escala possível'));

    const entry = logger.errors[0];
    expect(entry?.message).toContain('Erro em scheduler');
    expect(entry?.message).toContain('sem escala possível');
    expect(entry?.context?.['scope']).toBe('scheduler');
    expect(typeof entry?.context?.['stack']).toBe('string');
  });

  it('lida com um valor que não é Error', () => {
    const logger = new RecordingLogger();
    reportError(logger, 'ipc', 'canal inválido');

    const entry = logger.errors[0];
    expect(entry?.message).toContain('canal inválido');
    expect(entry?.context).toEqual({ scope: 'ipc' });
  });
});
