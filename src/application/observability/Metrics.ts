/**
 * Porta de métricas. Mede o que a operação faz: contagens (ex.: violações,
 * backtracks) e durações (ex.: tempo do escalonador, de uma consulta).
 */
export interface Metrics {
  /** Soma `value` (padrão 1) ao contador `name`. */
  increment(name: string, value?: number): void;
  /** Registra uma duração em milissegundos para `name`. */
  timing(name: string, milliseconds: number): void;
}
