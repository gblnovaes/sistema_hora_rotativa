import { describe, expect, it } from 'vitest';
import { EmployeesViewModel } from './EmployeesViewModel';
import { LocalStorageEmployeeDirectory, type StorageLike } from './LocalStorageEmployeeDirectory';
import { Unit } from '@domain/scheduling/Unit';

class MapStorage implements StorageLike {
  private readonly map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

function viewModel(): EmployeesViewModel {
  return new EmployeesViewModel(new LocalStorageEmployeeDirectory(new MapStorage()));
}

describe('EmployeesViewModel', () => {
  it('carrega o cadastro ordenado por matrícula', async () => {
    const vm = viewModel();
    await vm.save({ registration: '1377', name: 'Agatha', unit: Unit.Mooca });
    await vm.save({ registration: '667', name: 'Eliana', unit: Unit.Mooca });
    await vm.load();

    expect(vm.store.getState().employees.map((e) => e.registration)).toEqual(['667', '1377']);
    expect(vm.store.getState().loading).toBe(false);
  });

  it('apara espaços ao salvar (normaliza pelo domínio)', async () => {
    const vm = viewModel();
    await vm.save({ registration: '  12 ', name: '  Ana  ', unit: Unit.Administrativo });

    expect(vm.store.getState().employees[0]).toEqual({
      registration: '12',
      name: 'Ana',
      unit: Unit.Administrativo,
    });
  });

  it('rejeita um registro inválido e expõe o erro, sem persistir', async () => {
    const vm = viewModel();
    await vm.save({ registration: '1', name: '   ', unit: Unit.Mooca });

    expect(vm.store.getState().error).not.toBeNull();
    expect(vm.store.getState().employees).toEqual([]);
  });

  it('remove um colaborador', async () => {
    const vm = viewModel();
    await vm.save({ registration: '1', name: 'A', unit: Unit.Mooca });
    await vm.save({ registration: '2', name: 'B', unit: Unit.Mooca });
    await vm.remove('1');

    expect(vm.store.getState().employees.map((e) => e.registration)).toEqual(['2']);
  });
});
