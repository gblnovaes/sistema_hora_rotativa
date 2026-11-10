import type { WeekDay } from '@domain/scheduling/WeekDay';
import { createStore, type StoreApi } from 'zustand/vanilla';
import type { DiagnosticsSink } from '@presentation/diagnostics/diagnosticsTypes';
import type { GeneratedSchedule, ScheduleGateway, ScheduleRow } from './scheduleGateway';

export interface WeeklyScheduleState {
  readonly rows: readonly ScheduleRow[];
  readonly violations: readonly string[];
  readonly loading: boolean;
  readonly error: string | null;
}

/**
 * ViewModel da escala semanal (MVVM). Pede a semana pela porta `ScheduleGateway`
 * e expõe o estado num store Zustand. Não conhece React, DOM nem Electron.
 */
export class WeeklyScheduleViewModel {
  readonly store: StoreApi<WeeklyScheduleState>;

  constructor(
    private readonly gateway: ScheduleGateway,
    private readonly diagnostics?: DiagnosticsSink,
    private readonly now: () => number = Date.now,
  ) {
    this.store = createStore<WeeklyScheduleState>()(() => ({
      rows: [],
      violations: [],
      loading: false,
      error: null,
    }));
  }

  async generate(): Promise<void> {
    this.store.setState({ loading: true, error: null });
    const start = this.now();
    let schedule: GeneratedSchedule;
    try {
      schedule = await this.gateway.generate();
    } catch (error) {
      this.diagnostics?.increment('schedule.errors');
      this.diagnostics?.timing('schedule.generate', this.now() - start);
      this.diagnostics?.record({ level: 'error', message: 'falha ao gerar escala' });
      this.store.setState({
        loading: false,
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }
    this.diagnostics?.increment('schedule.generate');
    this.diagnostics?.timing('schedule.generate', this.now() - start);
    this.diagnostics?.record({
      level: 'info',
      message: 'escala gerada',
      context: { rows: schedule.rows.length, violations: schedule.violations.length },
    });
    this.store.setState({
      rows: schedule.rows,
      violations: schedule.violations,
      loading: false,
      error: null,
    });
  }

  async moveRotatingRest(registration: string, day: WeekDay): Promise<void> {
    this.store.setState({ error: null });
    let schedule: GeneratedSchedule;
    try {
      schedule = await this.gateway.moveRotatingRest(registration, day);
    } catch (error) {
      this.diagnostics?.record({
        level: 'warn',
        message: 'troca de folga recusada',
        context: { registration },
      });
      this.store.setState({
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }
    this.diagnostics?.record({
      level: 'info',
      message: 'folga rotativa movida',
      context: { registration },
    });
    this.store.setState({
      rows: schedule.rows,
      violations: schedule.violations,
      error: null,
    });
  }
}
