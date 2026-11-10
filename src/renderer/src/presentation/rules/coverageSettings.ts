import { Unit } from '@domain/scheduling/Unit';

/** Piso de pessoas trabalhando por dia, em cada unidade. */
export interface CoverageSettings {
  readonly minimumByUnit: Readonly<Record<Unit, number>>;
}

/**
 * Padrão do plano: 1 pessoa por dia. Zero não restringe a folga rotativa.
 * Com equipe pequena, um piso alto pode tornar a escala impossível.
 */
export const DEFAULT_COVERAGE_SETTINGS: CoverageSettings = {
  minimumByUnit: {
    [Unit.Administrativo]: 1,
    [Unit.Mooca]: 1,
  },
};

/**
 * Porta da política de cobertura no renderer.
 * Assíncrona para poder ser trocada por IPC sem mudar o ViewModel.
 */
export interface CoverageSettingsStore {
  load(): Promise<CoverageSettings>;
  save(settings: CoverageSettings): Promise<void>;
}
