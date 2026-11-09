import BetterSqlite3, { type Database as SqliteDatabase } from 'better-sqlite3';
import { runMigrations } from './migrations';

export type Db = SqliteDatabase;

/**
 * Abre o banco SQLite, liga as pragmas de segurança e aplica as migrações.
 * Use `:memory:` para um banco efêmero (testes).
 */
export function openDatabase(filename: string): Db {
  const db = new BetterSqlite3(filename);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  runMigrations(db);
  return db;
}
