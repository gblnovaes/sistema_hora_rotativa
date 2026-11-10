import { describe, expect, it } from 'vitest';
import { Unit } from '@domain/scheduling/Unit';
import type { StorageLike } from '@presentation/employees/LocalStorageEmployeeDirectory';
import { DEFAULT_COVERAGE_SETTINGS } from './coverageSettings';
import { LocalStorageCoverageSettings } from './LocalStorageCoverageSettings';

class MapStorage implements StorageLike {
  private readonly map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  seed(key: string, value: string): void {
    this.map.set(key, value);
  }
}

const KEY = 'hora-rotativa.coverage';

describe('LocalStorageCoverageSettings', () => {
  it('começa no piso padrão de 1 pessoa por unidade', async () => {
    const store = new LocalStorageCoverageSettings(new MapStorage());
    expect(await store.load()).toEqual(DEFAULT_COVERAGE_SETTINGS);
  });

  it('grava e relê o piso de cada unidade', async () => {
    const store = new LocalStorageCoverageSettings(new MapStorage());
    const settings = {
      minimumByUnit: { [Unit.Administrativo]: 2, [Unit.Mooca]: 4 },
    };
    await store.save(settings);
    expect(await store.load()).toEqual(settings);
  });

  it('volta ao padrão quando o conteúdo está corrompido ou incompleto', async () => {
    const storage = new MapStorage();
    storage.seed(KEY, 'isto não é json');
    expect(await new LocalStorageCoverageSettings(storage).load()).toEqual(
      DEFAULT_COVERAGE_SETTINGS,
    );

    storage.seed(KEY, JSON.stringify({ minimumByUnit: { [Unit.Mooca]: 3 } }));
    expect(await new LocalStorageCoverageSettings(storage).load()).toEqual(
      DEFAULT_COVERAGE_SETTINGS,
    );

    storage.seed(
      KEY,
      JSON.stringify({
        minimumByUnit: { [Unit.Administrativo]: 1.5, [Unit.Mooca]: 1 },
      }),
    );
    expect(await new LocalStorageCoverageSettings(storage).load()).toEqual(
      DEFAULT_COVERAGE_SETTINGS,
    );
  });
});
