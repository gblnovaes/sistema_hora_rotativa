/** Evento registrado quando uma escala é gerada. */
export interface ScheduleGeneratedEvent {
  readonly type: 'schedule-generated';
  readonly correlationId: string;
  readonly employeeCount: number;
  readonly violationCount: number;
  readonly at: number;
}

/** Porta de auditoria: guarda o histórico do que aconteceu, para rastreio. */
export interface AuditTrail {
  record(event: ScheduleGeneratedEvent): Promise<void>;
}
