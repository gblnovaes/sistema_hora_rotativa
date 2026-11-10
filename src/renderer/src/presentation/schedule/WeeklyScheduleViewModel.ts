import type { WeekDay } from '@domain/scheduling/WeekDay';
import { DayAssignment } from '@domain/scheduling/DayAssignment';
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

/** Operação que muda a escala e só acontece depois de o usuário confirmar. */
export type PendingChange =
  | { readonly kind: 'regenerate' }
  | {
      readonly kind: 'move';
      readonly weekIndex: number;
      readonly registration: string;
      readonly name: string;
      /** Dia da folga rotativa hoje; `undefined` se a pessoa não tiver. */
      readonly from: WeekDay | undefined;
      readonly to: WeekDay;
    };

export interface WeeklyScheduleState {
  readonly weeks: readonly ScheduleWeekView[];
  readonly selectedIndex: number;
  readonly horizonWeeks: number;
  readonly loading: boolean;
  readonly error: string | null;
  /** Último salvamento (ISO 8601); `null` até existir uma escala. */
  readonly savedAt: string | null;
  /** O cadastro mudou depois de a escala ser salva. */
  readonly outdated: boolean;
  /** Mudança esperando o "sim" do usuário; `null` quando não há nenhuma. */
  readonly pending: PendingChange | null;
}

/**
 * ViewModel da escala (MVVM). Abre a escala salva (ou gera a primeira), e põe toda
 * mudança numa fila de confirmação: nada é gerado de novo nem trocado antes de
 * `confirm()`. Não conhece React, DOM nem Electron.
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
      savedAt: null,
      outdated: false,
      pending: null,
    }));
  }

  /** Abre a escala salva. Na primeira vez não há o que substituir, então ela é gerada e salva. */
  async load(): Promise<void> {
    await this.run('schedule.load', 'escala aberta', async () => {
      const { horizonWeeks } = this.store.getState();
      return (await this.gateway.load(horizonWeeks)) ?? (await this.gateway.generate(horizonWeeks));
    });
  }

  /** Mostra mais ou menos semanas. Não altera nada que já esteja salvo. */
  async setHorizon(weeks: number): Promise<void> {
    this.store.setState({ horizonWeeks: weeks });
    await this.load();
  }

  selectWeek(index: number): void {
    const { weeks } = this.store.getState();
    if (index >= 0 && index < weeks.length) {
      this.store.setState({ selectedIndex: index });
    }
  }

  /** Pede para gerar uma escala nova. Se já existe uma, antes é preciso confirmar. */
  async requestRegenerate(): Promise<void> {
    if (this.store.getState().weeks.length === 0) {
      await this.generateNow();
      return;
    }
    this.store.setState({ pending: { kind: 'regenerate' }, error: null });
  }

  /** Pede para levar a folga rotativa para `day` na semana selecionada. */
  requestMove(registration: string, day: WeekDay): void {
    const { weeks, selectedIndex } = this.store.getState();
    const row = weeks[selectedIndex]?.rows.find((item) => item.registration === registration);
    if (row === undefined) {
      return;
    }
    const from = row.days.find((cell) => cell.assignment === DayAssignment.RotatingRest)?.day;
    this.store.setState({
      error: null,
      pending: {
        kind: 'move',
        weekIndex: selectedIndex,
        registration,
        name: row.name,
        from,
        to: day,
      },
    });
  }

  /** O usuário desistiu: nada muda. */
  cancel(): void {
    const { pending } = this.store.getState();
    if (pending === null) {
      return;
    }
    this.diagnostics?.record({ level: 'info', message: 'alteração da escala cancelada' });
    this.store.setState({ pending: null });
  }

  /** O usuário confirmou: executa a mudança pendente e a salva. */
  async confirm(): Promise<void> {
    const { pending } = this.store.getState();
    if (pending === null) {
      return;
    }
    this.store.setState({ pending: null });
    if (pending.kind === 'regenerate') {
      await this.generateNow();
      return;
    }
    await this.moveNow(pending);
  }

  private async generateNow(): Promise<void> {
    await this.run('schedule.generate', 'escala gerada', () =>
      this.gateway.generate(this.store.getState().horizonWeeks),
    );
  }

  private async moveNow(change: Extract<PendingChange, { kind: 'move' }>): Promise<void> {
    this.store.setState({ error: null });
    let schedule: GeneratedSchedule;
    try {
      schedule = await this.gateway.moveRotatingRest(
        change.weekIndex,
        change.registration,
        change.to,
      );
    } catch (error) {
      this.diagnostics?.record({
        level: 'warn',
        message: 'troca de folga recusada',
        context: { registration: change.registration, week: change.weekIndex },
      });
      this.store.setState({ error: describe(error) });
      return;
    }
    this.diagnostics?.record({
      level: 'info',
      message: 'folga rotativa movida',
      context: { registration: change.registration, week: change.weekIndex },
    });
    this.apply(schedule, false);
  }

  /** Executa uma operação do gateway que devolve a escala toda, com métricas e erro tratado. */
  private async run(
    metric: string,
    message: string,
    operation: () => Promise<GeneratedSchedule>,
  ): Promise<void> {
    this.store.setState({ loading: true, error: null });
    const start = this.now();
    let schedule: GeneratedSchedule;
    try {
      schedule = await operation();
    } catch (error) {
      this.diagnostics?.increment('schedule.errors');
      this.diagnostics?.timing(metric, this.now() - start);
      this.diagnostics?.record({ level: 'error', message: `falha: ${message}` });
      this.store.setState({ loading: false, error: describe(error) });
      return;
    }
    this.diagnostics?.increment(metric);
    this.diagnostics?.timing(metric, this.now() - start);
    this.diagnostics?.record({
      level: 'info',
      message,
      context: {
        weeks: schedule.weeks.length,
        violations: schedule.weeks.reduce((sum, week) => sum + week.violations.length, 0),
      },
    });
    this.apply(schedule, true);
  }

  private apply(schedule: GeneratedSchedule, resetSelection: boolean): void {
    this.store.setState((state) => ({
      weeks: schedule.weeks,
      selectedIndex: resetSelection ? 0 : state.selectedIndex,
      savedAt: schedule.savedAt,
      outdated: schedule.outdated,
      loading: false,
      error: null,
    }));
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
