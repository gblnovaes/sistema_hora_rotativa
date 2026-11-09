import type { CoveragePolicy } from '@domain/scheduling/CoveragePolicy';
import type { EmployeeWeek } from '@domain/scheduling/EmployeeWeek';
import type { FairRotationScheduler } from '@domain/scheduling/FairRotationScheduler';
import type { RuleViolation } from '@domain/scheduling/RuleViolation';
import type { ScheduleValidator } from '@domain/scheduling/ScheduleValidator';
import type { Clock } from '@application/observability/Clock';
import type { Logger } from '@application/observability/Logger';
import type { Metrics } from '@application/observability/Metrics';
import { measure } from '@application/observability/measure';
import type { AuditTrail } from './AuditTrail';
import type { EmployeeRepository } from './EmployeeRepository';
import type { RotationHistoryRepository, RotationRestEntry } from './RotationHistoryRepository';

export interface GenerateWeeklyScheduleDeps {
  readonly employees: EmployeeRepository;
  readonly history: RotationHistoryRepository;
  readonly scheduler: FairRotationScheduler;
  readonly validator: ScheduleValidator;
  readonly audit: AuditTrail;
  readonly clock: Clock;
  readonly metrics: Metrics;
  readonly logger: Logger;
  readonly newCorrelationId: () => string;
  readonly coverage?: CoveragePolicy;
}

export interface GenerateWeeklyScheduleResult {
  readonly weeks: readonly EmployeeWeek[];
  readonly violations: readonly RuleViolation[];
  readonly correlationId: string;
}

/**
 * Caso de uso: gera a escala da semana.
 *
 * Carrega colaboradores e histórico, roda o escalonador (medindo o tempo),
 * valida com as regras, registra as folgas rotativas no histórico e grava um
 * evento de auditoria. Toda a operação carrega um `correlationId` nos logs.
 */
export class GenerateWeeklySchedule {
  constructor(private readonly deps: GenerateWeeklyScheduleDeps) {}

  async execute(): Promise<GenerateWeeklyScheduleResult> {
    const { clock, metrics, scheduler, validator, coverage } = this.deps;
    const correlationId = this.deps.newCorrelationId();
    const logger = this.deps.logger.child({ correlationId });

    const employees = await this.deps.employees.findAll();
    const history = await this.deps.history.load();
    logger.info('gerando escala da semana', { employees: employees.length });

    const generated = measure(clock, metrics, 'scheduler.generate', () =>
      scheduler.generate(employees, history, coverage ? { coverage } : {}),
    );

    const violations = validator.validate(generated.weeks);
    if (violations.length > 0) {
      metrics.increment('schedule.violations', violations.length);
      logger.warn('escala gerada com violações', { violations: violations.length });
    }

    const entries: RotationRestEntry[] = generated.weeks.flatMap((week) =>
      week.rotatingRestDays.map((day) => ({ registration: week.employee.registration, day })),
    );
    await this.deps.history.append(entries);

    await this.deps.audit.record({
      type: 'schedule-generated',
      correlationId,
      employeeCount: employees.length,
      violationCount: violations.length,
      at: clock.now(),
    });

    logger.info('escala gerada', { employees: employees.length, violations: violations.length });
    return { weeks: generated.weeks, violations, correlationId };
  }
}
