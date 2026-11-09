import type { Clock } from './Clock';
import type { Metrics } from './Metrics';

/**
 * Executa `operation`, mede sua duração pelo relógio e registra a métrica de
 * tempo em `name`. A duração é registrada mesmo que a operação lance um erro.
 */
export function measure<T>(clock: Clock, metrics: Metrics, name: string, operation: () => T): T {
  const start = clock.monotonic();
  try {
    return operation();
  } finally {
    metrics.timing(name, clock.monotonic() - start);
  }
}
