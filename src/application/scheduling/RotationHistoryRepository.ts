import type { RotationHistory } from '@domain/scheduling/RotationHistory';
import type { WeekDay } from '@domain/scheduling/WeekDay';

export interface RotationRestEntry {
  readonly registration: string;
  readonly day: WeekDay;
}

/**
 * Porta do histórico de folgas rotativas.
 *
 * O histórico é um log append-only: cada semana registra as folgas rotativas
 * (`append`) e `load` reconstrói o `RotationHistory` reproduzindo os registros
 * em ordem. Isso evita expor o estado interno do domínio e já serve de auditoria.
 */
export interface RotationHistoryRepository {
  load(): Promise<RotationHistory>;
  append(entries: readonly RotationRestEntry[]): Promise<void>;
}
