import type { DayAssignment } from '@domain/scheduling/DayAssignment';
import type { WeekDay } from '@domain/scheduling/WeekDay';
import type { Unit } from '@domain/scheduling/Unit';

/** Um dia da grade: o que o colaborador faz naquele dia da semana. */
export interface ScheduleCell {
  readonly day: WeekDay;
  readonly assignment: DayAssignment;
}

/** Uma linha da escala semanal, pronta para a grade. */
export interface ScheduleRow {
  readonly registration: string;
  readonly name: string;
  readonly unit: Unit;
  readonly days: readonly ScheduleCell[];
}

/** Escala gerada para a semana corrente, mais as violações encontradas. */
export interface GeneratedSchedule {
  readonly rows: readonly ScheduleRow[];
  readonly violations: readonly string[];
}

/**
 * Porta da escala no renderer.
 *
 * O ViewModel só conhece esta interface. Hoje o adaptador lê o cadastro local e
 * roda o escalonador no renderer; amanhã pode chamar o processo main via IPC.
 */
export interface ScheduleGateway {
  generate(): Promise<GeneratedSchedule>;
  /** Move a folga rotativa do colaborador para `day` e revalida a escala atual. */
  moveRotatingRest(registration: string, day: WeekDay): Promise<GeneratedSchedule>;
}
