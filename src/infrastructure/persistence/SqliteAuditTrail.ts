import type { AuditTrail, ScheduleGeneratedEvent } from '@application/scheduling/AuditTrail';
import type { Db } from './Database';

/** Auditoria sobre SQLite: guarda cada evento com um payload em JSON. */
export class SqliteAuditTrail implements AuditTrail {
  constructor(private readonly db: Db) {}

  record(event: ScheduleGeneratedEvent): Promise<void> {
    const payload = JSON.stringify({
      employeeCount: event.employeeCount,
      violationCount: event.violationCount,
    });

    this.db
      .prepare('INSERT INTO audit_event (type, correlation_id, payload, at) VALUES (?, ?, ?, ?)')
      .run(event.type, event.correlationId, payload, event.at);
    return Promise.resolve();
  }
}
