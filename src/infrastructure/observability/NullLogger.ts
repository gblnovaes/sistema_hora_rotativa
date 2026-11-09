import type { Logger, LogContext } from '@application/observability/Logger';

/** Logger que não faz nada. Útil como padrão quando o log está desligado. */
export class NullLogger implements Logger {
  debug(_message: string, _context?: LogContext): void {}
  info(_message: string, _context?: LogContext): void {}
  warn(_message: string, _context?: LogContext): void {}
  error(_message: string, _context?: LogContext): void {}
  child(_context: LogContext): Logger {
    return this;
  }
}
