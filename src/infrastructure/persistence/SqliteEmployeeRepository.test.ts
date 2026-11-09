import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openDatabase, type Db } from './Database';
import { SqliteEmployeeRepository } from './SqliteEmployeeRepository';
import { Employee } from '@domain/scheduling/Employee';
import { Unit } from '@domain/scheduling/Unit';

let db: Db;
let repository: SqliteEmployeeRepository;

beforeEach(() => {
  db = openDatabase(':memory:');
  repository = new SqliteEmployeeRepository(db);
});

afterEach(() => {
  db.close();
});

describe('SqliteEmployeeRepository', () => {
  it('salva e lê colaboradores, ordenados por matrícula', async () => {
    await repository.save(
      Employee.create({ registration: '667', name: 'Eliana', unit: Unit.Mooca }),
    );
    await repository.save(
      Employee.create({ registration: '1315', name: 'Claudenilson', unit: Unit.Administrativo }),
    );

    const all = await repository.findAll();
    expect(all.map((employee) => employee.registration)).toEqual(['1315', '667']);
    expect(all[1]?.unit).toBe(Unit.Mooca);
  });

  it('atualiza em vez de duplicar quando a matrícula já existe', async () => {
    await repository.save(
      Employee.create({ registration: '1', name: 'Nome Antigo', unit: Unit.Mooca }),
    );
    await repository.save(
      Employee.create({ registration: '1', name: 'Nome Novo', unit: Unit.Administrativo }),
    );

    const all = await repository.findAll();
    expect(all).toHaveLength(1);
    expect(all[0]?.name).toBe('Nome Novo');
    expect(all[0]?.unit).toBe(Unit.Administrativo);
  });

  it('começa vazio', async () => {
    expect(await repository.findAll()).toEqual([]);
  });
});
