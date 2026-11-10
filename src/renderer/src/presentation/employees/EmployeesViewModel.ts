import { createStore, type StoreApi } from 'zustand/vanilla';
import { Employee } from '@domain/scheduling/Employee';
import type { DiagnosticsSink } from '@presentation/diagnostics/diagnosticsTypes';
import type { EmployeeDirectory, EmployeeRecord } from './employeeDirectory';

export interface EmployeesState {
  readonly employees: readonly EmployeeRecord[];
  readonly loading: boolean;
  readonly error: string | null;
}

/**
 * ViewModel do cadastro de colaboradores (MVVM). Comanda o cadastro através da
 * porta `EmployeeDirectory` e expõe o estado num store Zustand. Não conhece
 * React nem `localStorage`.
 */
export class EmployeesViewModel {
  readonly store: StoreApi<EmployeesState>;

  constructor(
    private readonly directory: EmployeeDirectory,
    private readonly diagnostics?: DiagnosticsSink,
  ) {
    this.store = createStore<EmployeesState>()(() => ({
      employees: [],
      loading: false,
      error: null,
    }));
  }

  async load(): Promise<void> {
    this.store.setState({ loading: true, error: null });
    const employees = await this.directory.list();
    this.store.setState({ employees: this.sorted(employees), loading: false });
  }

  async save(record: EmployeeRecord): Promise<void> {
    let normalized: EmployeeRecord;
    try {
      normalized = this.normalize(record);
    } catch (error) {
      this.diagnostics?.record({ level: 'warn', message: 'cadastro recusado' });
      this.store.setState({ error: error instanceof Error ? error.message : String(error) });
      return;
    }
    await this.directory.save(normalized);
    this.diagnostics?.increment('employees.saved');
    this.diagnostics?.record({
      level: 'info',
      message: 'colaborador salvo',
      context: { registration: normalized.registration },
    });
    await this.load();
  }

  async remove(registration: string): Promise<void> {
    await this.directory.remove(registration);
    this.diagnostics?.increment('employees.removed');
    this.diagnostics?.record({
      level: 'info',
      message: 'colaborador removido',
      context: { registration },
    });
    await this.load();
  }

  private normalize(record: EmployeeRecord): EmployeeRecord {
    const employee = Employee.create(record);
    const normalized = {
      registration: employee.registration,
      name: employee.name,
      unit: employee.unit,
    };
    return record.shift === undefined ? normalized : { ...normalized, shift: record.shift };
  }

  private sorted(employees: readonly EmployeeRecord[]): readonly EmployeeRecord[] {
    return [...employees].sort((a, b) =>
      a.registration.localeCompare(b.registration, undefined, { numeric: true }),
    );
  }
}
