import type { Logger } from './Logger';

/**
 * Registra um erro de forma uniforme: mensagem clara, com o escopo onde ocorreu
 * e o stack quando houver. Centraliza o formato para toda a aplicação.
 */
export function reportError(logger: Logger, scope: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  const context =
    error instanceof Error && error.stack !== undefined ? { scope, stack: error.stack } : { scope };
  logger.error(`Erro em ${scope}: ${message}`, context);
}
