/** Contexto estruturado anexado a uma entrada de log (ex.: correlationId, unidade). */
export type LogContext = Readonly<Record<string, string | number | boolean>>;

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Porta de log estruturado. A aplicação depende desta interface, nunca de um
 * logger concreto (pino fica na infraestrutura).
 *
 * `child` devolve um logger com um contexto fixo embutido (ex.: um correlationId
 * que acompanha toda a operação, do renderer ao main).
 */
export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  child(context: LogContext): Logger;
}
