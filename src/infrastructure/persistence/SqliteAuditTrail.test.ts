import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openDatabase, type Db } from './Database';
import { SqliteAuditTrail } from './SqliteAuditTrail';

let db: Db;
let audit: SqliteAuditTrail;

beforeEach(() => {
  db = openDatabase(':memory:');
  audit = new SqliteAuditTrail(db);
});

afterEach(() => {
  db.close();
});

interface AuditRow {
  readonly type: string;
  readonly correlation_id: string;
  readonly payload: string;
  readonly at: number;
}

describe('SqliteAuditTrail', () => {
  it('grava o evento com payload em JSON', async () => {
    await audit.record({
      type: 'schedule-generated',
      correlationId: 'corr-1',
      employeeCount: 39,
      violationCount: 0,
      at: 1_700_000_000,
    });

    const row = db
      .prepare('SELECT type, correlation_id, payload, at FROM audit_event')
      .get() as AuditRow;

    expect(row.type).toBe('schedule-generated');
    expect(row.correlation_id).toBe('corr-1');
    expect(row.at).toBe(1_700_000_000);
    expect(JSON.parse(row.payload)).toEqual({ employeeCount: 39, violationCount: 0 });
  });
});
