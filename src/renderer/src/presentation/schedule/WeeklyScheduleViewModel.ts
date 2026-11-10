import type { WeekDay } from '@domain/scheduling/WeekDay';
import { createStore, type StoreApi } from 'zustand/vanilla';
import type { DiagnosticsSink } from '@presentation/diagnostics/diagnosticsTypes';
import type { GeneratedSchedule, ScheduleGateway, ScheduleWeekView } from './scheduleGateway';

/**
 * Horizontes oferecidos, em semanas. O menor (5) cobre ao menos um mês a partir de
 * hoje: a semana atual mais as quatro seguintes terminam 28+ dias depois de qualquer
 * dia da semana atual.
 */
export const HORIZON_OPTIONS = [
  { weeks: 5, label: '1 mês' },
  { weeks: 9, label: '2 meses' },
  { weeks: 13, label: '3 meses' },
] as const;

export const DEFAULT_HORIZON_WEEKS: number = HORIZON_OPTIONS[0].weeks;

export interface WeeklyScheduleState {
  readonly weeks: readonly ScheduleWeekView[];
  readonly selectedIndex: number;
  readonly horizonWeeks: number;
  readonly loading: boolean;
  readonly error: string | null;
}

/**
 * ViewModel da escala (MVVM). Planeja o período pela porta `ScheduleGateway` e expõe
 * o estado num store Zustand. Não conhece React, DOM nem Electron.
 */
export class WeeklyScheduleViewModel {
  readonly store: StoreApi<WeeklyScheduleState>;

  constructor(
    private readonly gateway: ScheduleGateway,
    private readonly diagnostics?: DiagnosticsSink,
    private readonly now: () => number = Date.now,
  ) {
    this.store = createStore<WeeklyScheduleState>()(() => ({
      weeks: [],
      selectedIndex: 0,
      horizonWeeks: DEFAULT_HORIZON_WEEKS,
      loading: false,
      error: null,
    }));
  }

  async generate(): Promise<void> {
    this.store.setState({ loading: true, error: null });
    const start = this.now();
    const { horizonWeeks } = this.store.getState();
    let schedule: GeneratedSchedule;
    try {
      schedule = await this.gateway.generate(horizonWeeks);
    } catch (error) {
      this.diagnostics?.increment('schedule.errors');
      this.diagnostics?.timing('schedule.generate', this.now() - start);
      this.diagnostics?.record({ level: 'error', message: 'falha ao gerar escala' });
      this.store.setState({ loading: false, error: describe(error) });
      return;
    }
    this.diagnostics?.increment('schedule.generate');
    this.diagnostics?.timing('schedule.generate', this.now() - start);
    this.diagnostics?.record({
      level: 'info',
      message: 'escala gerada',
      context: {
        weeks: schedule.weeks.length,
        violations: schedule.weeks.reduce((sum, week) => sum + week.violations.length, 0),
      },
    });
    this.store.setState({
      weeks: schedule.weeks,
      selectedIndex: 0,
      loading: false,
      error: null,
    });
  }

  async setHorizon(weeks: number): Promise<void> {
    this.store.setState({ horizonWeeks: weeks });
    await this.generate();
  }

  selectWeek(index: number): void {
    const { weeks } = this.store.getState();
    if (index >= 0 && index < weeks.length) {
      this.store.setState({ selectedIndex: index });
    }
  }

  /** Move a folga rotativa na semana selecionada; as semanas seguintes são refeitas. */
  async moveRotatingRest(registration: string, day: WeekDay): Promise<void> {
    this.store.setState({ error: null });
    const { selectedIndex } = this.store.getState();
    let schedule: GeneratedSchedule;
    try {
      schedule = await this.gateway.moveRotatingRest(selectedIndex, registration, day);
    } catch (error) {
      this.diagnostics?.record({
        level: 'warn',
        message: 'troca de folga recusada',
        context: { registration, week: selectedIndex },
      });
      this.store.setState({ error: describe(error) });
      return;
    }
    this.diagnostics?.record({
      level: 'info',
      message: 'folga rotativa movida',
      context: { registration, week: selectedIndex },
    });
    this.store.setState({ weeks: schedule.weeks, error: null });
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
