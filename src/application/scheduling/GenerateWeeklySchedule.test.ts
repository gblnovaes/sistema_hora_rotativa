import { describe, expect, it } from 'vitest';
import { GenerateWeeklySchedule, type GenerateWeeklyScheduleDeps } from './GenerateWeeklySchedule';
import type { EmployeeRepository } from './EmployeeRepository';
import type { RotationHistoryRepository, RotationRestEntry } from './RotationHistoryRepository';
import type { AuditTrail, ScheduleGeneratedEvent } from './AuditTrail';
import type { Logger } from '@application/observability/Logger';
import type { Metrics } from '@application/observability/Metrics';
import type { Clock } from '@application/observability/Clock';
import { Employee } from '@domain/scheduling/Employee';
import { Unit } from '@domain/scheduling/Unit';
import { RotationHistory } from '@domain/scheduling/RotationHistory';
import { FairRotationScheduler } from '@domain/scheduling/FairRotationScheduler';
import { CoveragePolicy } from '@domain/scheduling/CoveragePolicy';
import { defaultScheduleRules, ScheduleValidator } from '@domain/scheduling/ScheduleValidator';

class FakeEmployeeRepository implements EmployeeRepository {
  constructor(private readonly employees: Employee[]) {}
  findAll(): Promise<readonly Employee[]> {
    return Promise.resolve(this.employees);
  }
  save(employee: Employee): Promise<void> {
    this.employees.push(employee);
    return Promise.resolve();
  }
}

class FakeHistoryRepository implements RotationHistoryRepository {
  readonly appended: RotationRestEntry[] = [];
  load(): Promise<RotationHistory> {
    const history = this.appended.reduce(
      (acc, entry) => acc.withRotatingRest(entry.registration, entry.day),
      RotationHistory.empty(),
    );
    return Promise.resolve(history);
  }
  append(entries: readonly RotationRestEntry[]): Promise<void> {
    this.appended.push(...entries);
    return Promise.resolve();
  }
}

class RecordingAudit implements AuditTrail {
  readonly events: ScheduleGeneratedEvent[] = [];
  record(event: ScheduleGeneratedEvent): Promise<void> {
    this.events.push(event);
    return Promise.resolve();
  }
}

class RecordingMetrics implements Metrics {
  readonly counters: Record<string, number> = {};
  readonly timings: string[] = [];
  increment(name: string, value = 1): void {
    this.counters[name] = (this.counters[name] ?? 0) + value;
  }
  timing(name: string): void {
    this.timings.push(name);
  }
}

const silentLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  child: () => silentLogger,
};

const fixedClock: Clock = { now: () => 1_700_000_000, monotonic: () => 0 };

function deps(
  employees: Employee[],
  coverage?: CoveragePolicy,
): {
  deps: GenerateWeeklyScheduleDeps;
  history: FakeHistoryRepository;
  audit: RecordingAudit;
  metrics: RecordingMetrics;
} {
  const history = new FakeHistoryRepository();
  const audit = new RecordingAudit();
  const metrics = new RecordingMetrics();
  let counter = 0;
  const base = {
    employees: new FakeEmployeeRepository(employees),
    history,
    scheduler: new FairRotationScheduler(),
    validator: new ScheduleValidator(defaultScheduleRules()),
    audit,
    clock: fixedClock,
    metrics,
    logger: silentLogger,
    newCorrelationId: (): string => `corr-${(counter += 1)}`,
  };
  return { deps: coverage ? { ...base, coverage } : base, history, audit, metrics };
}

const mooca = (id: string): Employee =>
  Employee.create({ registration: id, name: `Colab ${id}`, unit: Unit.Mooca });
const admin = (id: string): Employee =>
  Employee.create({ registration: id, name: `Admin ${id}`, unit: Unit.Administrativo });

describe('GenerateWeeklySchedule', () => {
  it('gera uma semana por colaborador, sem violações, com correlationId', async () => {
    const { deps: d } = deps([admin('1'), mooca('2'), mooca('3')]);
    const result = await new GenerateWeeklySchedule(d).execute();

    expect(result.weeks).toHaveLength(3);
    expect(result.violations).toEqual([]);
    expect(result.correlationId).toBe('corr-1');
  });

  it('registra as folgas rotativas no histórico', async () => {
    const { deps: d, history } = deps([admin('1'), mooca('2'), mooca('3')]);
    await new GenerateWeeklySchedule(d).execute();

    // Só os colaboradores do MOOCA têm folga rotativa.
    expect(history.appended.map((entry) => entry.registration).sort()).toEqual(['2', '3']);
  });

  it('grava um evento de auditoria e mede o tempo do escalonador', async () => {
    const { deps: d, audit, metrics } = deps([mooca('2'), mooca('3')]);
    await new GenerateWeeklySchedule(d).execute();

    expect(audit.events[0]).toMatchObject({
      type: 'schedule-generated',
      employeeCount: 2,
      violationCount: 0,
      at: 1_700_000_000,
    });
    expect(metrics.timings).toContain('scheduler.generate');
  });

  it('usa o histórico acumulado entre execuções (rotação avança)', async () => {
    const employees = [mooca('2')];
    const { deps: d, history } = deps(employees);
    const service = new GenerateWeeklySchedule(d);

    const first = await service.execute();
    const second = await service.execute();

    expect(first.weeks[0]?.rotatingRestDays[0]).not.toBe(second.weeks[0]?.rotatingRestDays[0]);
    expect(history.appended).toHaveLength(2);
  });

  it('propaga a política de cobertura ao escalonador', async () => {
    const team = [mooca('2'), mooca('3'), mooca('4')];
    const coverage = CoveragePolicy.perUnit({ [Unit.Mooca]: 3 });
    const { deps: d } = deps(team, coverage);
    // 3 de 3 com mínimo 3 → impossível: o caso de uso propaga e o escalonador falha.
    await expect(new GenerateWeeklySchedule(d).execute()).rejects.toThrow();
  });
});
