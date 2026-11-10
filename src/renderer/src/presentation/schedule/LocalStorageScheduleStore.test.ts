import { describe, expect, it } from 'vitest';
import { Unit } from '@domain/scheduling/Unit';
import { WeekDay } from '@domain/scheduling/WeekDay';
import type { StorageLike } from '@presentation/employees/LocalStorageEmployeeDirectory';
import { LocalStorageScheduleStore } from './LocalStorageScheduleStore';
import type { SavedSchedule } from './scheduleStore';

class MapStorage implements StorageLike {
  readonly map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

const KEY = 'hora-rotativa.schedule';

const saved: SavedSchedule = {
  savedAt: '2026-11-10T11:33:00.000Z',
  employees: [
    { registration: '1', name: 'Ana', unit: Unit.Mooca },
    { registration: '2', name: 'Bia', unit: Unit.Administrativo },
  ],
  weeks: [
    { startDate: '2026-11-09', rests: { '1': WeekDay.Wednesday, '2': null } },
    { startDate: '2026-11-16', rests: { '1': WeekDay.Friday, '2': null } },
  ],
};

describe('LocalStorageScheduleStore', () => {
  it('começa sem escala salva', async () => {
    expect(await new LocalStorageScheduleStore(new MapStorage()).load()).toBeNull();
  });

  it('guarda e devolve a escala, inclusive a folga nula de quem não tem rotativa', async () => {
    const store = new LocalStorageScheduleStore(new MapStorage());
    await store.save(saved);

    expect(await store.load()).toEqual(saved);
  });

  it('o último salvamento substitui o anterior', async () => {
    const store = new LocalStorageScheduleStore(new MapStorage());
    const later: SavedSchedule = { ...saved, savedAt: '2026-11-11T09:00:00.000Z' };
    await store.save(saved);
    await store.save(later);

    expect(await store.load()).toEqual(later);
  });

  it('descarta uma escala sem nenhuma semana', async () => {
    const store = new LocalStorageScheduleStore(new MapStorage());
    await store.save({ ...saved, weeks: [] });

    expect(await store.load()).toBeNull();
  });

  it.each([
    ['json quebrado', 'isto não é json'],
    ['não é objeto', JSON.stringify([1, 2])],
    ['sem data de salvamento', JSON.stringify({ employees: [], weeks: [] })],
    [
      'dia da semana inválido',
      JSON.stringify({ ...saved, weeks: [{ startDate: '2026-11-09', rests: { '1': 'FUNDAY' } }] }),
    ],
    [
      'data de semana inválida',
      JSON.stringify({ ...saved, weeks: [{ startDate: '09/11/2026', rests: {} }] }),
    ],
    [
      'colaborador com unidade desconhecida',
      JSON.stringify({ ...saved, employees: [{ registration: '1', name: 'X', unit: 'OUTRA' }] }),
    ],
  ])('descarta o conteúdo quando há %s', async (_name, raw) => {
    const storage = new MapStorage();
    storage.map.set(KEY, raw);

    expect(await new LocalStorageScheduleStore(storage).load()).toBeNull();
  });
});
