import { createStore, type StoreApi } from 'zustand/vanilla';
import { dashboardMock, type DashboardViewData } from './dashboardViewData';

export interface DashboardState {
  readonly data: DashboardViewData | null;
  readonly loading: boolean;
}

/**
 * ViewModel do dashboard (MVVM). Encapsula um store vanilla do Zustand e os
 * comandos da tela. Não conhece React nem Electron.
 *
 * A fonte dos dados é injetada (`loadData`): hoje um mock; amanhã um gateway
 * que fala com o processo main via IPC. A View apenas lê `store` e chama os comandos.
 */
export class DashboardViewModel {
  readonly store: StoreApi<DashboardState>;

  constructor(private readonly loadData: () => DashboardViewData = () => dashboardMock) {
    this.store = createStore<DashboardState>()(() => ({ data: null, loading: true }));
  }

  initialize(): void {
    this.store.setState({ data: this.loadData(), loading: false });
  }
}
