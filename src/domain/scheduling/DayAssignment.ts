/**
 * O que um colaborador faz em um dia da semana.
 * - `Work`: dia de trabalho.
 * - `FixedRest`: folga fixa definida pela política da unidade (ex.: domingo).
 * - `RotatingRest`: folga rotativa, escolhida pelo escalonador a cada semana.
 */
export const DayAssignment = {
  Work: 'WORK',
  FixedRest: 'FIXED_REST',
  RotatingRest: 'ROTATING_REST',
} as const;

export type DayAssignment = (typeof DayAssignment)[keyof typeof DayAssignment];

/** Verdadeiro para qualquer tipo de folga (fixa ou rotativa). */
export function isRest(assignment: DayAssignment): boolean {
  return assignment === DayAssignment.FixedRest || assignment === DayAssignment.RotatingRest;
}
