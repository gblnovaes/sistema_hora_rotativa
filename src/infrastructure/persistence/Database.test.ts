import { describe, expect, it } from 'vitest';
import { openDatabase } from './Database';
import { runMigrations } from './migrations';

interface NameRow {
  readonly name: string;
}
interface CountRow {
  readonly count: number;
}

function tableNames(db: ReturnType<typeof openDatabase>): string[] {
  const rows = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
    .all() as NameRow[];
  return rows.map((row) => row.name);
}

describe('openDatabase / migrations', () => {
  it('cria as tabelas do domínio', () => {
    const db = openDatabase(':memory:');
    const tables = tableNames(db);
    expect(tables).toContain('employees');
    expect(tables).toContain('rotation_rest');
    expect(tables).toContain('audit_event');
    db.close();
  });

  it('é idempotente: rodar as migrações de novo não duplica nada', () => {
    const db = openDatabase(':memory:');
    runMigrations(db);
    runMigrations(db);

    const { count } = db
      .prepare('SELECT COUNT(*) AS count FROM schema_migrations')
      .get() as CountRow;
    expect(count).toBe(1);
    db.close();
  });
});
