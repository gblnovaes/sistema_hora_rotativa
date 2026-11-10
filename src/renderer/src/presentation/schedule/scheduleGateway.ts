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

/** Uma semana do período: a grade e as violações encontradas nela. */
export interface ScheduleWeekView {
  /** Posição no período; 0 é a semana atual. */
  readonly index: number;
  /** Segunda-feira da semana, `AAAA-MM-DD`. */
  readonly startDate: string;
  readonly rows: readonly ScheduleRow[];
  readonly violations: readonly string[];
}

/** Escala do período planejado, da semana atual em diante. */
export interface GeneratedSchedule {
  readonly weeks: readonly ScheduleWeekView[];
}

/**
 * Porta da escala no renderer.
 *
 * O ViewModel só conhece esta interface. Hoje o adaptador lê o cadastro local e
 * roda o escalonador no renderer; amanhã pode chamar o processo main via IPC.
 */
export interface ScheduleGateway {
  /** Gera `weekCount` semanas seguidas, começando na semana atual. */
  generate(weekCount: number): Promise<GeneratedSchedule>;
  /**
   * Move a folga rotativa do colaborador para `day` na semana `weekIndex`.
   * As semanas seguintes são refeitas; as anteriores ficam como estavam.
   */
  moveRotatingRest(
    weekIndex: number,
    registration: string,
    day: WeekDay,
  ): Promise<GeneratedSchedule>;
}
