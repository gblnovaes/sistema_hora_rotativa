import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openDatabase, type Db } from './Database';
import { SqliteRotationHistoryRepository } from './SqliteRotationHistoryRepository';
import { WeekDay } from '@domain/scheduling/WeekDay';

let db: Db;
let repository: SqliteRotationHistoryRepository;

beforeEach(() => {
  db = openDatabase(':memory:');
  repository = new SqliteRotationHistoryRepository(db);
});

afterEach(() => {
  db.close();
});

describe('SqliteRotationHistoryRepository', () => {
  it('começa vazio', async () => {
    const history = await repository.load();
    expect(history.restCount('2', WeekDay.Monday)).toBe(0);
    expect(history.lastRest('2')).toBeUndefined();
  });

  it('acumula registros e reconstrói as contagens e a última folga', async () => {
    await repository.append([
      { registration: '2', day: WeekDay.Monday },
      { registration: '3', day: WeekDay.Tuesday },
    ]);
    await repository.append([{ registration: '2', day: WeekDay.Friday }]);

    const history = await repository.load();
    expect(history.restCount('2', WeekDay.Monday)).toBe(1);
    expect(history.restCount('2', WeekDay.Friday)).toBe(1);
    expect(history.lastRest('2')).toBe(WeekDay.Friday);
    expect(history.restCount('3', WeekDay.Tuesday)).toBe(1);
  });

  it('persiste entre instâncias do repositório (mesmo banco)', async () => {
    await repository.append([{ registration: '2', day: WeekDay.Wednesday }]);

    const other = new SqliteRotationHistoryRepository(db);
    const history = await other.load();
    expect(history.restCount('2', WeekDay.Wednesday)).toBe(1);
  });
});
