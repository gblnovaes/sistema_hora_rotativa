import { describe, expect, it } from 'vitest';
import { Unit } from '@domain/scheduling/Unit';
import { WeekDay } from '@domain/scheduling/WeekDay';
import type { BalanceGateway, BalanceReport, BalanceRow } from './balanceGateway';
import { BalanceViewModel } from './BalanceViewModel';

const row: BalanceRow = {
  registration: '1',
  name: 'Ana',
  unit: Unit.Mooca,
  counts: {
    [WeekDay.Monday]: 2,
    [WeekDay.Tuesday]: 1,
    [WeekDay.Wednesday]: 1,
    [WeekDay.Thursday]: 1,
    [WeekDay.Friday]: 1,
    [WeekDay.Saturday]: 0,
    [WeekDay.Sunday]: 0,
  },
};

class FakeGateway implements BalanceGateway {
  constructor(private readonly result: BalanceReport | Error) {}
  report(): Promise<BalanceReport> {
    if (this.result instanceof Error) {
      return Promise.reject(this.result);
    }
    return Promise.resolve(this.result);
  }
}

describe('BalanceViewModel', () => {
  it('publica as linhas e a diferença máxima', async () => {
    const vm = new BalanceViewModel(new FakeGateway({ weeks: 6, rows: [row], maxSpread: 2 }));
    await vm.load(6);

    expect(vm.store.getState().loading).toBe(false);
    expect(vm.store.getState().error).toBeNull();
    expect(vm.store.getState().weeks).toBe(6);
    expect(vm.store.getState().maxSpread).toBe(2);
    expect(vm.store.getState().rows).toEqual([row]);
  });

  it('guarda o erro e preserva o relatório anterior', async () => {
    const vm = new BalanceViewModel(new FakeGateway(new Error('sem cobertura')));
    vm.store.setState({ weeks: 6, rows: [row], maxSpread: 0 });

    await vm.load(6);

    expect(vm.store.getState().error).toBe('sem cobertura');
    expect(vm.store.getState().loading).toBe(false);
    expect(vm.store.getState().rows).toEqual([row]);
  });
});
