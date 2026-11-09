import type { Logger } from '@application/observability/Logger';
import { reportError } from '@application/observability/reportError';
import type { IpcResult } from '@shared/ipc';

/**
 * Executa um handler de IPC e devolve um resultado tipado. Um erro nunca cruza
 * o IPC como exceção crua: é registrado e vira `{ ok: false, error }`.
 */
export async function runIpc<T>(
  logger: Logger,
  scope: string,
  handler: () => Promise<T>,
): Promise<IpcResult<T>> {
  try {
    return { ok: true, data: await handler() };
  } catch (error) {
    reportError(logger, scope, error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
