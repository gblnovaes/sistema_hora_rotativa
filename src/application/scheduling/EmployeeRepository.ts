import type { Employee } from '@domain/scheduling/Employee';

/** Porta de persistência dos colaboradores. */
export interface EmployeeRepository {
  findAll(): Promise<readonly Employee[]>;
  save(employee: Employee): Promise<void>;
}
