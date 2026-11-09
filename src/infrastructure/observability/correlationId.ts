import { randomUUID } from 'node:crypto';

/**
 * Gera um correlationId único para uma operação. Ele acompanha os logs do
 * início ao fim (renderer → main), ligando as entradas de uma mesma ação.
 */
export function newCorrelationId(): string {
  return randomUUID();
}
