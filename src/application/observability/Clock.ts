/**
 * Porta de tempo. Isola a aplicação do relógio real, deixando o tempo
 * testável (um relógio falso nos testes).
 */
export interface Clock {
  /** Instante atual em milissegundos desde a época (para timestamps). */
  now(): number;
  /** Relógio monotônico em milissegundos (para medir durações). */
  monotonic(): number;
}
