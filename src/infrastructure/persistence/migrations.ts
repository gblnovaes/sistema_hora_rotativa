import type { Database as SqliteDatabase } from 'better-sqlite3';

interface Migration {
  readonly id: number;
  readonly sql: string;
}

const MIGRATIONS: readonly Migration[] = [
  {
    id: 1,
    sql: `
      CREATE TABLE employees (
        registration TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        unit TEXT NOT NULL
      );

      CREATE TABLE rotation_rest (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registration TEXT NOT NULL,
        weekday TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE audit_event (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        correlation_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        at INTEGER NOT NULL
      );
    `,
  },
];

interface MigrationRow {
  readonly id: number;
}

/**
 * Aplica as migrações pendentes dentro de uma transação. Idempotente: migrações
 * já aplicadas (registradas em `schema_migrations`) são puladas.
 */
export function runMigrations(db: SqliteDatabase): void {
  db.exec(
    'CREATE TABLE IF NOT EXISTS schema_migrations (id INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL)',
  );

  const appliedRows = db.prepare('SELECT id FROM schema_migrations').all() as MigrationRow[];
  const applied = new Set(appliedRows.map((row) => row.id));
  const insert = db.prepare('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)');

  const apply = db.transaction((now: number): void => {
    for (const migration of MIGRATIONS) {
      if (!applied.has(migration.id)) {
        db.exec(migration.sql);
        insert.run(migration.id, now);
      }
    }
  });

  apply(Date.now());
}
