import { CoveragePolicy } from '@domain/scheduling/CoveragePolicy';
import { Unit } from '@domain/scheduling/Unit';
import { createStore, type StoreApi } from 'zustand/vanilla';
import type { DiagnosticsSink } from '@presentation/diagnostics/diagnosticsTypes';
import { adoptedShifts, type ShiftFact } from './adoptedShifts';
import {
  DEFAULT_COVERAGE_SETTINGS,
  type CoverageSettings,
  type CoverageSettingsStore,
} from './coverageSettings';
import { RULE_SUMMARIES, type RuleSummary } from './ruleSummaries';

export interface RulesState {
  readonly minimumByUnit: Readonly<Record<Unit, number>>;
  readonly shifts: readonly ShiftFact[];
  readonly rules: readonly RuleSummary[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly saved: boolean;
}

/**
 * ViewModel de regras e cobertura (MVVM). A jornada e as regras invariantes vêm
 * do domínio; o piso por unidade é lido e gravado pela porta `CoverageSettingsStore`.
 */
export class RulesViewModel {
  readonly store: StoreApi<RulesState>;

  constructor(
    private readonly settings: CoverageSettingsStore,
    private readonly diagnostics?: DiagnosticsSink,
  ) {
    this.store = createStore<RulesState>()(() => ({
      minimumByUnit: DEFAULT_COVERAGE_SETTINGS.minimumByUnit,
      shifts: adoptedShifts(),
      rules: RULE_SUMMARIES,
      loading: false,
      error: null,
      saved: false,
    }));
  }

  async load(): Promise<void> {
    this.store.setState({ loading: true, error: null });
    const current = await this.settings.load();
    this.store.setState({
      minimumByUnit: current.minimumByUnit,
      loading: false,
      saved: false,
    });
  }

  async save(settings: CoverageSettings): Promise<void> {
    try {
      CoveragePolicy.perUnit({ ...settings.minimumByUnit });
      for (const unit of Object.values(Unit)) {
        if (settings.minimumByUnit[unit] === undefined) {
          throw new RangeError('Informe o piso das duas unidades');
        }
      }
    } catch (error) {
      this.diagnostics?.record({ level: 'warn', message: 'piso de cobertura recusado' });
      this.store.setState({
        error: error instanceof Error ? error.message : String(error),
        saved: false,
      });
      return;
    }

    await this.settings.save(settings);
    this.diagnostics?.increment('rules.saved');
    this.diagnostics?.record({
      level: 'info',
      message: 'piso de cobertura salvo',
      context: {
        administrativo: settings.minimumByUnit[Unit.Administrativo],
        mooca: settings.minimumByUnit[Unit.Mooca],
      },
    });
    this.store.setState({
      minimumByUnit: settings.minimumByUnit,
      error: null,
      saved: true,
    });
  }
}
