import { WeekDay, WEEK_DAYS } from './WeekDay';

/** Unidades da operação, cada uma com uma política de folga própria. */
export const Unit = {
  Administrativo: 'ADMINISTRATIVO',
  Mooca: 'MOOCA',
} as const;

export type Unit = (typeof Unit)[keyof typeof Unit];

/** Toda semana tem exatamente 2 folgas por colaborador (regra R1). */
export const REST_DAYS_PER_WEEK = 2;

/**
 * Política de folga de uma unidade.
 * - `fixedRestDays`: folgas fixas (ex.: domingo, ou sábado e domingo).
 * - `rotatingRestCount`: quantas folgas rotativas a unidade distribui por semana.
 * - `rotatingRestCandidates`: dias em que a folga rotativa pode cair.
 *
 * Invariante: `fixedRestDays.length + rotatingRestCount === REST_DAYS_PER_WEEK`.
 */
export interface UnitPolicy {
  readonly unit: Unit;
  readonly fixedRestDays: readonly WeekDay[];
  readonly rotatingRestCount: number;
  readonly rotatingRestCandidates: readonly WeekDay[];
}

const administrativo: UnitPolicy = {
  unit: Unit.Administrativo,
  fixedRestDays: [WeekDay.Saturday, WeekDay.Sunday],
  rotatingRestCount: 0,
  rotatingRestCandidates: [],
};

const mooca: UnitPolicy = {
  unit: Unit.Mooca,
  fixedRestDays: [WeekDay.Sunday],
  rotatingRestCount: 1,
  // Pode folgar em qualquer dia de segunda a sábado (todos menos domingo).
  rotatingRestCandidates: WEEK_DAYS.filter((day) => day !== WeekDay.Sunday),
};

export const UNIT_POLICIES: Readonly<Record<Unit, UnitPolicy>> = {
  [Unit.Administrativo]: administrativo,
  [Unit.Mooca]: mooca,
};

export function policyOf(unit: Unit): UnitPolicy {
  return UNIT_POLICIES[unit];
}
