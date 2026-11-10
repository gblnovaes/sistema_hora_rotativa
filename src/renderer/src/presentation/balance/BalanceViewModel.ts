import { createStore, type StoreApi } from 'zustand/vanilla';
import type { BalanceGateway, BalanceRow } from './balanceGateway';

export interface BalanceState {
  readonly weeks: number;
  readonly rows: readonly BalanceRow[];
  readonly maxSpread: number;
  readonly loading: boolean;
  readonly error: string | null;
}

/**
 * ViewModel do equilíbrio (MVVM). Pede o relatório pela porta `BalanceGateway`
 * e expõe o estado num store Zustand. Não conhece React nem o escalonador.
 */
export class BalanceViewModel {
  readonly store: StoreApi<BalanceState>;

  constructor(private readonly gateway: BalanceGateway) {
    this.store = createStore<BalanceState>()(() => ({
      weeks: 0,
      rows: [],
      maxSpread: 0,
      loading: false,
      error: null,
    }));
  }

  async load(weeks: number): Promise<void> {
    this.store.setState({ loading: true, error: null });
    try {
      const report = await this.gateway.report(weeks);
      this.store.setState({
        weeks: report.weeks,
        rows: report.rows,
        maxSpread: report.maxSpread,
        loading: false,
        error: null,
      });
    } catch (error) {
      this.store.setState({
        loading: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
