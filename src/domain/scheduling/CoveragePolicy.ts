import type { Unit } from './Unit';

/**
 * Cobertura mínima: quantos colaboradores precisam estar trabalhando em cada
 * dia útil de uma unidade. O piso vale para todos os dias de trabalho da unidade.
 *
 * É daqui que o escalonador deriva quantas folgas rotativas cabem em cada dia:
 * `maxRestsPerDay = totalDaUnidade − mínimo`.
 */
export class CoveragePolicy {
  private constructor(
    private readonly minimumByUnit: ReadonlyMap<Unit, number>,
    private readonly fallback: number,
  ) {}

  /** Mesmo mínimo para todas as unidades. */
  static uniform(minimum: number): CoveragePolicy {
    assertValid(minimum);
    return new CoveragePolicy(new Map(), minimum);
  }

  /** Mínimo por unidade; unidades não listadas usam `fallback` (padrão 0). */
  static perUnit(minimums: Partial<Record<Unit, number>>, fallback = 0): CoveragePolicy {
    assertValid(fallback);
    const entries = new Map<Unit, number>();
    for (const [unit, minimum] of Object.entries(minimums) as [Unit, number | undefined][]) {
      if (minimum !== undefined) {
        assertValid(minimum);
        entries.set(unit, minimum);
      }
    }
    return new CoveragePolicy(entries, fallback);
  }

  minimumFor(unit: Unit): number {
    return this.minimumByUnit.get(unit) ?? this.fallback;
  }
}

function assertValid(minimum: number): void {
  if (!Number.isInteger(minimum) || minimum < 0) {
    throw new RangeError(`Cobertura mínima deve ser inteiro não negativo, recebido ${minimum}`);
  }
}
