import { Unit } from '@domain/scheduling/Unit';
import type { EmployeeDirectory, EmployeeRecord } from './employeeDirectory';

/** Subconjunto de `Storage` que o adaptador usa (facilita os testes). */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const DEFAULT_KEY = 'hora-rotativa.employees';
const UNITS = new Set<string>(Object.values(Unit));

function toRecord(value: unknown): EmployeeRecord | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const raw = value as Record<string, unknown>;
  if (
    typeof raw['registration'] !== 'string' ||
    typeof raw['name'] !== 'string' ||
    typeof raw['unit'] !== 'string' ||
    !UNITS.has(raw['unit'])
  ) {
    return null;
  }
  return { registration: raw['registration'], name: raw['name'], unit: raw['unit'] as Unit };
}

/** Cadastro de colaboradores persistido em `localStorage` (ou outro `Storage`). */
export class LocalStorageEmployeeDirectory implements EmployeeDirectory {
  constructor(
    private readonly storage: StorageLike,
    private readonly key: string = DEFAULT_KEY,
  ) {}

  list(): Promise<readonly EmployeeRecord[]> {
    return Promise.resolve(this.read());
  }

  save(record: EmployeeRecord): Promise<void> {
    const others = this.read().filter((item) => item.registration !== record.registration);
    this.write([...others, record]);
    return Promise.resolve();
  }

  remove(registration: string): Promise<void> {
    this.write(this.read().filter((item) => item.registration !== registration));
    return Promise.resolve();
  }

  private read(): EmployeeRecord[] {
    const raw = this.storage.getItem(this.key);
    if (raw === null) {
      return [];
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.map(toRecord).filter((item): item is EmployeeRecord => item !== null);
    } catch {
      return [];
    }
  }

  private write(records: readonly EmployeeRecord[]): void {
    this.storage.setItem(this.key, JSON.stringify(records));
  }
}
