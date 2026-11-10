export type DiagnosticLevel = 'info' | 'warn' | 'error';

export interface DiagnosticEvent {
  readonly id: number;
  readonly at: string;
  readonly level: DiagnosticLevel;
  readonly message: string;
  readonly context?: Readonly<Record<string, string | number | boolean>>;
}

export interface DiagnosticMetrics {
  readonly counters: Readonly<Record<string, number>>;
  readonly timings: Readonly<Record<string, readonly number[]>>;
}

export interface AppIdentity {
  readonly name: string;
  readonly version: string;
}

export interface DiagnosticPackage {
  readonly exportedAt: string;
  readonly app: AppIdentity;
  /** Piso de cobertura, sem nomes de colaboradores. */
  readonly coverage: Readonly<Record<string, number>> | null;
  readonly metrics: DiagnosticMetrics;
  readonly events: readonly DiagnosticEvent[];
}

/** Quem registra eventos e métricas da sessão do renderer. */
export interface DiagnosticsSink {
  record(event: Omit<DiagnosticEvent, 'id' | 'at'>): void;
  increment(name: string, value?: number): void;
  timing(name: string, milliseconds: number): void;
}

/** Quem a tela de Diagnóstico lê. */
export interface DiagnosticsSource {
  events(): readonly DiagnosticEvent[];
  metrics(): DiagnosticMetrics;
  appInfo(): Promise<AppIdentity>;
  exportPackage(): Promise<DiagnosticPackage>;
}
