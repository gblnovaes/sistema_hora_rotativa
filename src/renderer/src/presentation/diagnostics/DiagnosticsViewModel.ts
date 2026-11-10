import { createStore, type StoreApi } from 'zustand/vanilla';
import type {
  AppIdentity,
  DiagnosticEvent,
  DiagnosticLevel,
  DiagnosticMetrics,
  DiagnosticPackage,
  DiagnosticsSource,
} from './diagnosticsTypes';

export type LevelFilter = 'all' | DiagnosticLevel;

export interface DiagnosticsState {
  readonly events: readonly DiagnosticEvent[];
  readonly metrics: DiagnosticMetrics;
  readonly app: AppIdentity;
  readonly level: LevelFilter;
  readonly query: string;
  readonly loading: boolean;
}

const EMPTY_METRICS: DiagnosticMetrics = { counters: {}, timings: {} };

/**
 * ViewModel do diagnóstico (MVVM). Filtra os eventos da sessão e monta o pacote
 * de exportação. Não conhece React, DOM nem o filesystem.
 */
export class DiagnosticsViewModel {
  readonly store: StoreApi<DiagnosticsState>;

  constructor(private readonly source: DiagnosticsSource) {
    this.store = createStore<DiagnosticsState>()(() => ({
      events: [],
      metrics: EMPTY_METRICS,
      app: { name: '', version: '' },
      level: 'all',
      query: '',
      loading: false,
    }));
  }

  async load(): Promise<void> {
    this.store.setState({ loading: true });
    const app = await this.source.appInfo();
    this.store.setState({ app, loading: false });
    this.publish();
  }

  setLevel(level: LevelFilter): void {
    this.store.setState({ level });
    this.publish();
  }

  setQuery(query: string): void {
    this.store.setState({ query });
    this.publish();
  }

  exportPackage(): Promise<DiagnosticPackage> {
    return this.source.exportPackage();
  }

  private publish(): void {
    const { level, query } = this.store.getState();
    const needle = query.trim().toLowerCase();
    const events = this.source.events().filter((event) => {
      if (level !== 'all' && event.level !== level) {
        return false;
      }
      if (needle.length === 0) {
        return true;
      }
      return event.message.toLowerCase().includes(needle);
    });
    this.store.setState({ events, metrics: this.source.metrics() });
  }
}
