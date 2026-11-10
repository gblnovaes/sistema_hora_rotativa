import type { Unit } from '@domain/scheduling/Unit';
import type { WeekDay } from '@domain/scheduling/WeekDay';

/** Folgas rotativas acumuladas de um colaborador, por dia da semana. */
export interface BalanceRow {
  readonly registration: string;
  readonly name: string;
  readonly unit: Unit;
  readonly counts: Readonly<Record<WeekDay, number>>;
}

export interface BalanceReport {
  readonly weeks: number;
  readonly rows: readonly BalanceRow[];
  /** Maior diferença de folgas rotativas, no mesmo dia, entre colegas da mesma unidade. */
  readonly maxSpread: number;
}

/** Porta do relatório de equilíbrio. Assíncrona para poder virar IPC. */
export interface BalanceGateway {
  report(weeks: number): Promise<BalanceReport>;
}
