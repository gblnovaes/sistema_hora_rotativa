import { describe, expect, it } from 'vitest';
import { Unit } from '@domain/scheduling/Unit';
import type { StorageLike } from '@presentation/employees/LocalStorageEmployeeDirectory';
import { LocalStorageCoverageSettings } from './LocalStorageCoverageSettings';
import { RulesViewModel } from './RulesViewModel';

class MapStorage implements StorageLike {
  private readonly map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

function viewModel(): RulesViewModel {
  return new RulesViewModel(new LocalStorageCoverageSettings(new MapStorage()));
}

describe('RulesViewModel', () => {
  it('carrega o piso padrão e a jornada calculada', async () => {
    const vm = viewModel();
    await vm.load();

    expect(vm.store.getState().loading).toBe(false);
    expect(vm.store.getState().minimumByUnit).toEqual({
      [Unit.Administrativo]: 1,
      [Unit.Mooca]: 1,
    });
    expect(vm.store.getState().shifts.map((shift) => shift.net)).toEqual(['8h24', '6h00']);
    expect(vm.store.getState().rules.map((rule) => rule.id)).toEqual([
      'R1',
      'R2',
      'R3',
      'R4',
      'R5',
    ]);
  });

  it('grava um piso válido e o relê', async () => {
    const vm = viewModel();
    await vm.save({
      minimumByUnit: { [Unit.Administrativo]: 0, [Unit.Mooca]: 3 },
    });

    expect(vm.store.getState().error).toBeNull();
    expect(vm.store.getState().saved).toBe(true);
    expect(vm.store.getState().minimumByUnit[Unit.Mooca]).toBe(3);

    await vm.load();
    expect(vm.store.getState().minimumByUnit[Unit.Mooca]).toBe(3);
    expect(vm.store.getState().saved).toBe(false);
  });

  it('recusa piso negativo e mantém o valor anterior', async () => {
    const vm = viewModel();
    await vm.load();
    await vm.save({
      minimumByUnit: { [Unit.Administrativo]: -1, [Unit.Mooca]: 1 },
    });

    expect(vm.store.getState().error).toMatch(/inteiro não negativo/);
    expect(vm.store.getState().saved).toBe(false);
    expect(vm.store.getState().minimumByUnit[Unit.Administrativo]).toBe(1);
  });
});
