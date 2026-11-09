import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createSchedulingContainer } from './container';
import { openDatabase, type Db } from '@infrastructure/persistence/Database';
import { SqliteEmployeeRepository } from '@infrastructure/persistence/SqliteEmployeeRepository';
import { NullLogger } from '@infrastructure/observability/NullLogger';
import { Employee } from '@domain/scheduling/Employee';
import { Unit } from '@domain/scheduling/Unit';

let db: Db;

beforeEach(() => {
  db = openDatabase(':memory:');
});

afterEach(() => {
  db.close();
});

describe('createSchedulingContainer (integração)', () => {
  it('monta o caso de uso e gera a escala a partir do banco', async () => {
    const employees = new SqliteEmployeeRepository(db);
    await employees.save(
      Employee.create({ registration: '1', name: 'Admin', unit: Unit.Administrativo }),
    );
    await employees.save(Employee.create({ registration: '2', name: 'Mooca', unit: Unit.Mooca }));

    const container = createSchedulingContainer(db, { logger: new NullLogger() });
    const result = await container.generateWeeklySchedule.execute();

    expect(result.weeks).toHaveLength(2);
    expect(result.violations).toEqual([]);
    expect(container.metrics.snapshot().timings['scheduler.generate']).toHaveLength(1);
  });

  it('persiste o histórico: a segunda geração avança a rotação', async () => {
    const employees = new SqliteEmployeeRepository(db);
    await employees.save(Employee.create({ registration: '2', name: 'Mooca', unit: Unit.Mooca }));

    const container = createSchedulingContainer(db, { logger: new NullLogger() });
    const first = await container.generateWeeklySchedule.execute();
    const second = await container.generateWeeklySchedule.execute();

    expect(first.weeks[0]?.rotatingRestDays[0]).not.toBe(second.weeks[0]?.rotatingRestDays[0]);
  });
});
