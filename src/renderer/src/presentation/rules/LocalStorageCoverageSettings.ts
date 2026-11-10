import { Unit } from '@domain/scheduling/Unit';
import type { StorageLike } from '@presentation/employees/LocalStorageEmployeeDirectory';
import {
  DEFAULT_COVERAGE_SETTINGS,
  type CoverageSettings,
  type CoverageSettingsStore,
} from './coverageSettings';

const DEFAULT_KEY = 'hora-rotativa.coverage';

function isMinimum(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function parse(raw: string | null): CoverageSettings {
  if (raw === null) {
    return DEFAULT_COVERAGE_SETTINGS;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return DEFAULT_COVERAGE_SETTINGS;
    }
    const minimums = (parsed as Record<string, unknown>)['minimumByUnit'];
    if (typeof minimums !== 'object' || minimums === null) {
      return DEFAULT_COVERAGE_SETTINGS;
    }
    const record = minimums as Record<string, unknown>;
    const minimumByUnit = {} as Record<Unit, number>;
    for (const unit of Object.values(Unit)) {
      const value = record[unit];
      if (!isMinimum(value)) {
        return DEFAULT_COVERAGE_SETTINGS;
      }
      minimumByUnit[unit] = value;
    }
    return { minimumByUnit };
  } catch {
    return DEFAULT_COVERAGE_SETTINGS;
  }
}

/** Cobertura mínima persistida no `localStorage` do renderer. */
export class LocalStorageCoverageSettings implements CoverageSettingsStore {
  constructor(
    private readonly storage: StorageLike,
    private readonly key: string = DEFAULT_KEY,
  ) {}

  load(): Promise<CoverageSettings> {
    return Promise.resolve(parse(this.storage.getItem(this.key)));
  }

  save(settings: CoverageSettings): Promise<void> {
    this.storage.setItem(this.key, JSON.stringify(settings));
    return Promise.resolve();
  }
}
