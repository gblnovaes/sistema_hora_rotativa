import type { CoveragePolicy } from '@domain/scheduling/CoveragePolicy';
import { FairRotationScheduler } from '@domain/scheduling/FairRotationScheduler';
import { defaultScheduleRules, ScheduleValidator } from '@domain/scheduling/ScheduleValidator';
import { GenerateWeeklySchedule } from '@application/scheduling/GenerateWeeklySchedule';
import type { Logger } from '@application/observability/Logger';
import type { Db } from '@infrastructure/persistence/Database';
import { SqliteEmployeeRepository } from '@infrastructure/persistence/SqliteEmployeeRepository';
import { SqliteRotationHistoryRepository } from '@infrastructure/persistence/SqliteRotationHistoryRepository';
import { SqliteAuditTrail } from '@infrastructure/persistence/SqliteAuditTrail';
import { SystemClock } from '@infrastructure/observability/SystemClock';
import { InMemoryMetrics } from '@infrastructure/observability/InMemoryMetrics';
import { NullLogger } from '@infrastructure/observability/NullLogger';
import { newCorrelationId } from '@infrastructure/observability/correlationId';

export interface ContainerOptions {
  readonly logger?: Logger;
  readonly coverage?: CoveragePolicy;
}

export interface SchedulingContainer {
  readonly generateWeeklySchedule: GenerateWeeklySchedule;
  readonly metrics: InMemoryMetrics;
}

/**
 * Composition root do agendamento: monta o grafo de dependências (banco,
 * repositórios, escalonador, regras, observabilidade) e entrega o caso de uso
 * pronto. É o único lugar que conhece todas as peças concretas.
 */
export function createSchedulingContainer(
  db: Db,
  options: ContainerOptions = {},
): SchedulingContainer {
  const logger = options.logger ?? new NullLogger();
  const metrics = new InMemoryMetrics();

  const generateWeeklySchedule = new GenerateWeeklySchedule({
    employees: new SqliteEmployeeRepository(db),
    history: new SqliteRotationHistoryRepository(db),
    scheduler: new FairRotationScheduler(),
    validator: new ScheduleValidator(defaultScheduleRules()),
    audit: new SqliteAuditTrail(db),
    clock: new SystemClock(),
    metrics,
    logger,
    newCorrelationId,
    ...(options.coverage ? { coverage: options.coverage } : {}),
  });

  return { generateWeeklySchedule, metrics };
}
