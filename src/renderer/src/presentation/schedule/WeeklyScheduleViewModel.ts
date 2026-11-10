import type { WeekDay } from '@domain/scheduling/WeekDay';
import { createStore, type StoreApi } from 'zustand/vanilla';
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

  constructor(private readonly gateway: ScheduleGateway) {
    this.store = createStore<WeeklyScheduleState>()(() => ({
      rows: [],
      violations: [],
      loading: false,
      error: null,
    }));
  }

  async generate(): Promise<void> {
    this.store.setState({ loading: true, error: null });
    let schedule: GeneratedSchedule;
    try {
      schedule = await this.gateway.generate();
    } catch (error) {
      this.store.setState({
        loading: false,
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }
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
      this.store.setState({
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }
    this.store.setState({
      rows: schedule.rows,
      violations: schedule.violations,
      error: null,
    });
  }
}
