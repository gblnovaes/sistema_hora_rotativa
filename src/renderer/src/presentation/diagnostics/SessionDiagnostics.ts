import type { CoverageSettingsStore } from '@presentation/rules/coverageSettings';
import { LocalStorageCoverageSettings } from '@presentation/rules/LocalStorageCoverageSettings';
import type {
  AppIdentity,
  DiagnosticEvent,
  DiagnosticMetrics,
  DiagnosticPackage,
  DiagnosticsSink,
  DiagnosticsSource,
} from './diagnosticsTypes';

const MAX_EVENTS = 200;
const FALLBACK_APP: AppIdentity = { name: 'sistema-hora-rotativa', version: '0.1.0' };

const PRIVATE_KEYS = new Set(['name', 'nome']);

function redact(
  context: Readonly<Record<string, string | number | boolean>> | undefined,
): DiagnosticEvent['context'] {
  if (context === undefined) {
    return undefined;
  }
  const clean: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(context)) {
    if (PRIVATE_KEYS.has(key) || value === undefined) {
      continue;
    }
    clean[key] = value;
  }
  return Object.keys(clean).length === 0 ? undefined : clean;
}

async function readAppInfo(): Promise<AppIdentity> {
  if (typeof window === 'undefined') {
    return FALLBACK_APP;
  }
  try {
    return await window.api.getAppInfo();
  } catch {
    return FALLBACK_APP;
  }
}

/**
 * Log e métricas da sessão do renderer. Nomes de pessoas são descartados na entrada.
 * Não fala com o processo main: é a fonte da tela de Diagnóstico nesta fase.
 */
export class SessionDiagnostics implements DiagnosticsSink, DiagnosticsSource {
  private readonly buffer: DiagnosticEvent[] = [];
  private nextId = 0;
  private readonly counters = new Map<string, number>();
  private readonly timings = new Map<string, number[]>();

  constructor(
    private readonly clock: () => Date = () => new Date(),
    private readonly info: () => Promise<AppIdentity> = readAppInfo,
    private readonly coverage: CoverageSettingsStore | null = null,
    private readonly limit = MAX_EVENTS,
  ) {}

  record(event: Omit<DiagnosticEvent, 'id' | 'at'>): void {
    const context = redact(event.context);
    const entry: DiagnosticEvent = {
      id: this.nextId,
      at: this.clock().toISOString(),
      level: event.level,
      message: event.message,
    };
    this.nextId += 1;
    this.buffer.push(context === undefined ? entry : { ...entry, context });
    if (this.buffer.length > this.limit) {
      this.buffer.shift();
    }
  }

  increment(name: string, value = 1): void {
    this.counters.set(name, (this.counters.get(name) ?? 0) + value);
  }

  timing(name: string, milliseconds: number): void {
    const series = this.timings.get(name) ?? [];
    series.push(milliseconds);
    this.timings.set(name, series);
  }

  events(): readonly DiagnosticEvent[] {
    return [...this.buffer];
  }

  metrics(): DiagnosticMetrics {
    return {
      counters: Object.fromEntries(this.counters),
      timings: Object.fromEntries([...this.timings].map(([name, series]) => [name, [...series]])),
    };
  }

  appInfo(): Promise<AppIdentity> {
    return this.info();
  }

  async exportPackage(): Promise<DiagnosticPackage> {
    const coverage = this.coverage === null ? null : (await this.coverage.load()).minimumByUnit;
    return {
      exportedAt: this.clock().toISOString(),
      app: await this.info(),
      coverage,
      metrics: this.metrics(),
      events: this.events(),
    };
  }
}

function browserCoverage(): CoverageSettingsStore | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return new LocalStorageCoverageSettings(window.localStorage);
}

/** Instância única da sessão, compartilhada pelas telas do renderer. */
export const sessionDiagnostics = new SessionDiagnostics(
  () => new Date(),
  readAppInfo,
  browserCoverage(),
);
