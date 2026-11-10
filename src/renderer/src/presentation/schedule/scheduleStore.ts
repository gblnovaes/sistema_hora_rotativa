import type { Unit } from '@domain/scheduling/Unit';
import type { WeekDay } from '@domain/scheduling/WeekDay';

/** Uma semana salva: a segunda-feira e a folga rotativa de cada colaborador (`null` = sem rotativa). */
export interface SavedWeek {
  readonly startDate: string;
  readonly rests: Readonly<Record<string, WeekDay | null>>;
}

/** Colaborador como estava quando a escala foi salva. */
export interface SavedEmployee {
  readonly registration: string;
  readonly name: string;
  readonly unit: Unit;
}

/** Escala salva: a equipe da época e todas as semanas planejadas, com as trocas manuais. */
export interface SavedSchedule {
  /** Momento do último salvamento, ISO 8601. */
  readonly savedAt: string;
  readonly employees: readonly SavedEmployee[];
  readonly weeks: readonly SavedWeek[];
}

/** Porta onde a escala fica guardada entre as aberturas do app. */
export interface ScheduleStore {
  load(): Promise<SavedSchedule | null>;
  save(schedule: SavedSchedule): Promise<void>;
}
