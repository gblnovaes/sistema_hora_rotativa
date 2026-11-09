import type {
  RotationHistoryRepository,
  RotationRestEntry,
} from '@application/scheduling/RotationHistoryRepository';
import { RotationHistory } from '@domain/scheduling/RotationHistory';
import type { Db } from './Database';
import { parseWeekDay } from './parsers';

interface RestRow {
  readonly registration: string;
  readonly weekday: string;
}

/**
 * Histórico de folgas rotativas sobre SQLite, append-only.
 * `load` reconstrói o `RotationHistory` reproduzindo os registros em ordem.
 */
export class SqliteRotationHistoryRepository implements RotationHistoryRepository {
  constructor(private readonly db: Db) {}

  load(): Promise<RotationHistory> {
    const rows = this.db
      .prepare('SELECT registration, weekday FROM rotation_rest ORDER BY id')
      .all() as RestRow[];

    const history = rows.reduce(
      (acc, row) => acc.withRotatingRest(row.registration, parseWeekDay(row.weekday)),
      RotationHistory.empty(),
    );
    return Promise.resolve(history);
  }

  append(entries: readonly RotationRestEntry[]): Promise<void> {
    const insert = this.db.prepare(
      'INSERT INTO rotation_rest (registration, weekday, created_at) VALUES (?, ?, ?)',
    );
    const now = Date.now();

    const insertAll = this.db.transaction((items: readonly RotationRestEntry[]): void => {
      for (const entry of items) {
        insert.run(entry.registration, entry.day, now);
      }
    });

    insertAll(entries);
    return Promise.resolve();
  }
}
