import { describe, expect, it } from 'vitest';
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
  seed(key: string, value: string): void {
    this.map.set(key, value);
  }
}

const KEY = 'hora-rotativa.employees';

describe('LocalStorageEmployeeDirectory', () => {
  it('começa vazio', async () => {
    const directory = new LocalStorageEmployeeDirectory(new MapStorage());
    expect(await directory.list()).toEqual([]);
  });

  it('salva e lê um colaborador', async () => {
    const directory = new LocalStorageEmployeeDirectory(new MapStorage());
    await directory.save({ registration: '1377', name: 'Agatha', unit: Unit.Mooca });
    expect(await directory.list()).toEqual([
      { registration: '1377', name: 'Agatha', unit: Unit.Mooca },
    ]);
  });

  it('atualiza em vez de duplicar quando a matrícula se repete', async () => {
    const directory = new LocalStorageEmployeeDirectory(new MapStorage());
    await directory.save({ registration: '1', name: 'Antigo', unit: Unit.Mooca });
    await directory.save({ registration: '1', name: 'Novo', unit: Unit.Administrativo });

    const all = await directory.list();
    expect(all).toHaveLength(1);
    expect(all[0]).toEqual({ registration: '1', name: 'Novo', unit: Unit.Administrativo });
  });

  it('remove um colaborador', async () => {
    const directory = new LocalStorageEmployeeDirectory(new MapStorage());
    await directory.save({ registration: '1', name: 'A', unit: Unit.Mooca });
    await directory.save({ registration: '2', name: 'B', unit: Unit.Mooca });
    await directory.remove('1');

    expect((await directory.list()).map((item) => item.registration)).toEqual(['2']);
  });

  it('ignora conteúdo corrompido ou registros inválidos', async () => {
    const storage = new MapStorage();
    storage.seed(KEY, 'isto não é json');
    expect(await new LocalStorageEmployeeDirectory(storage).list()).toEqual([]);

    storage.seed(KEY, JSON.stringify([{ registration: '1', name: 'X', unit: 'OUTRA' }, 42]));
    expect(await new LocalStorageEmployeeDirectory(storage).list()).toEqual([]);
  });
});
