import { describe, expect, it } from 'vitest';
import type {
  AppIdentity,
  DiagnosticEvent,
  DiagnosticMetrics,
  DiagnosticPackage,
  DiagnosticsSource,
} from './diagnosticsTypes';
import { DiagnosticsViewModel } from './DiagnosticsViewModel';

const events: readonly DiagnosticEvent[] = [
  { id: 0, at: '2026-11-09T12:00:00.000Z', level: 'info', message: 'escala gerada' },
  { id: 1, at: '2026-11-09T12:01:00.000Z', level: 'error', message: 'falha ao gerar escala' },
];

class FakeSource implements DiagnosticsSource {
  events(): readonly DiagnosticEvent[] {
    return events;
  }
  metrics(): DiagnosticMetrics {
    return { counters: { 'schedule.generate': 1 }, timings: {} };
  }
  appInfo(): Promise<AppIdentity> {
    return Promise.resolve({ name: 'app', version: '0.1.0' });
  }
  exportPackage(): Promise<DiagnosticPackage> {
    return Promise.resolve({
      exportedAt: '2026-11-09T12:02:00.000Z',
      app: { name: 'app', version: '0.1.0' },
      coverage: null,
      metrics: this.metrics(),
      events,
    });
  }
}

describe('DiagnosticsViewModel', () => {
  it('carrega a identidade e filtra por nível e texto', async () => {
    const vm = new DiagnosticsViewModel(new FakeSource());
    await vm.load();

    expect(vm.store.getState().app).toEqual({ name: 'app', version: '0.1.0' });
    expect(vm.store.getState().events).toHaveLength(2);
    expect(vm.store.getState().metrics.counters['schedule.generate']).toBe(1);

    vm.setLevel('error');
    expect(vm.store.getState().events.map((event) => event.message)).toEqual([
      'falha ao gerar escala',
    ]);

    vm.setLevel('all');
    vm.setQuery('ESCALA GERADA');
    expect(vm.store.getState().events).toHaveLength(1);
    expect(vm.store.getState().events[0]?.message).toBe('escala gerada');
  });

  it('exporta o pacote inteiro, não só o filtro', async () => {
    const vm = new DiagnosticsViewModel(new FakeSource());
    vm.setLevel('error');
    const packaged = await vm.exportPackage();
    expect(packaged.events).toHaveLength(2);
    expect(packaged.coverage).toBeNull();
  });
});
