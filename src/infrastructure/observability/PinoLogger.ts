import { pino, type DestinationStream, type Logger as PinoInstance } from 'pino';
import type { Logger, LogContext, LogLevel } from '@application/observability/Logger';

/**
 * Adaptador da porta `Logger` sobre o pino. Emite logs estruturados em JSON.
 * `child` usa o child logger do pino para carregar um contexto fixo (correlationId).
 */
export class PinoLogger implements Logger {
  private constructor(private readonly instance: PinoInstance) {}

  static create(level: LogLevel = 'info', destination?: DestinationStream): PinoLogger {
    const instance = destination ? pino({ level }, destination) : pino({ level });
    return new PinoLogger(instance);
  }

  debug(message: string, context: LogContext = {}): void {
    this.instance.debug(context, message);
  }

  info(message: string, context: LogContext = {}): void {
    this.instance.info(context, message);
  }

  warn(message: string, context: LogContext = {}): void {
    this.instance.warn(context, message);
  }

  error(message: string, context: LogContext = {}): void {
    this.instance.error(context, message);
  }

  child(context: LogContext): Logger {
    return new PinoLogger(this.instance.child(context));
  }
}
