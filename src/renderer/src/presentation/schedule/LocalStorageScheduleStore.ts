import { Unit } from '@domain/scheduling/Unit';
import { WEEK_DAYS, type WeekDay } from '@domain/scheduling/WeekDay';
import type { StorageLike } from '@presentation/employees/LocalStorageEmployeeDirectory';
import type { SavedEmployee, SavedSchedule, SavedWeek, ScheduleStore } from './scheduleStore';

const DEFAULT_KEY = 'hora-rotativa.schedule';
const UNITS = new Set<string>(Object.values(Unit));
const DAYS = new Set<string>(WEEK_DAYS);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toEmployee(value: unknown): SavedEmployee | null {
  if (!isRecord(value)) {
    return null;
  }
  const { registration, name, unit } = value;
  if (
    typeof registration !== 'string' ||
    typeof name !== 'string' ||
    typeof unit !== 'string' ||
    !UNITS.has(unit)
  ) {
    return null;
  }
  return { registration, name, unit: unit as Unit };
}

function toWeek(value: unknown): SavedWeek | null {
  if (!isRecord(value) || typeof value['startDate'] !== 'string') {
    return null;
  }
  const startDate = value['startDate'];
  const rawRests = value['rests'];
  if (!ISO_DATE.test(startDate) || !isRecord(rawRests)) {
    return null;
  }
  const rests: Record<string, WeekDay | null> = {};
  for (const [registration, day] of Object.entries(rawRests)) {
    if (day === null) {
      rests[registration] = null;
    } else if (typeof day === 'string' && DAYS.has(day)) {
      rests[registration] = day as WeekDay;
    } else {
      return null;
    }
  }
  return { startDate, rests };
}

/** Lê tudo ou nada: um arquivo parcialmente inválido é descartado por inteiro. */
function toSchedule(value: unknown): SavedSchedule | null {
  if (!isRecord(value) || typeof value['savedAt'] !== 'string') {
    return null;
  }
  const rawEmployees = value['employees'];
  const rawWeeks = value['weeks'];
  if (!Array.isArray(rawEmployees) || !Array.isArray(rawWeeks) || rawWeeks.length === 0) {
    return null;
  }
  const employees = rawEmployees.map(toEmployee);
  const weeks = rawWeeks.map(toWeek);
  if (employees.includes(null) || weeks.includes(null)) {
    return null;
  }
  return {
    savedAt: value['savedAt'],
    employees: employees as SavedEmployee[],
    weeks: weeks as SavedWeek[],
  };
}

/** Escala salva em `localStorage` (ou outro `Storage`). */
export class LocalStorageScheduleStore implements ScheduleStore {
  constructor(
    private readonly storage: StorageLike,
    private readonly key: string = DEFAULT_KEY,
  ) {}

  load(): Promise<SavedSchedule | null> {
    const raw = this.storage.getItem(this.key);
    if (raw === null) {
      return Promise.resolve(null);
    }
    try {
      return Promise.resolve(toSchedule(JSON.parse(raw)));
    } catch {
      return Promise.resolve(null);
    }
  }

  save(schedule: SavedSchedule): Promise<void> {
    this.storage.setItem(this.key, JSON.stringify(schedule));
    return Promise.resolve();
  }
}
