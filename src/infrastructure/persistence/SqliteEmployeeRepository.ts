import type { EmployeeRepository } from '@application/scheduling/EmployeeRepository';
import { Employee } from '@domain/scheduling/Employee';
import type { Db } from './Database';
import { parseUnit } from './parsers';

interface EmployeeRow {
  readonly registration: string;
  readonly name: string;
  readonly unit: string;
}

/** Repositório de colaboradores sobre SQLite. */
export class SqliteEmployeeRepository implements EmployeeRepository {
  constructor(private readonly db: Db) {}

  findAll(): Promise<readonly Employee[]> {
    const rows = this.db
      .prepare('SELECT registration, name, unit FROM employees ORDER BY registration')
      .all() as EmployeeRow[];

    const employees = rows.map((row) =>
      Employee.create({
        registration: row.registration,
        name: row.name,
        unit: parseUnit(row.unit),
      }),
    );
    return Promise.resolve(employees);
  }

  save(employee: Employee): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO employees (registration, name, unit) VALUES (?, ?, ?)
         ON CONFLICT(registration) DO UPDATE SET name = excluded.name, unit = excluded.unit`,
      )
      .run(employee.registration, employee.name, employee.unit);
    return Promise.resolve();
  }
}
