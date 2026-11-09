import { describe, expect, it } from 'vitest';
import { CoveragePolicy } from './CoveragePolicy';
import { Unit } from './Unit';

describe('CoveragePolicy', () => {
  it('uniform aplica o mesmo mínimo a todas as unidades', () => {
    const policy = CoveragePolicy.uniform(20);
    expect(policy.minimumFor(Unit.Mooca)).toBe(20);
    expect(policy.minimumFor(Unit.Administrativo)).toBe(20);
  });

  it('perUnit usa o mínimo de cada unidade e o fallback nas demais', () => {
    const policy = CoveragePolicy.perUnit({ [Unit.Mooca]: 24 }, 5);
    expect(policy.minimumFor(Unit.Mooca)).toBe(24);
    expect(policy.minimumFor(Unit.Administrativo)).toBe(5);
  });

  it('fallback padrão é zero', () => {
    const policy = CoveragePolicy.perUnit({ [Unit.Mooca]: 10 });
    expect(policy.minimumFor(Unit.Administrativo)).toBe(0);
  });

  it('rejeita mínimo inválido', () => {
    expect(() => CoveragePolicy.uniform(-1)).toThrow();
    expect(() => CoveragePolicy.uniform(2.5)).toThrow();
    expect(() => CoveragePolicy.perUnit({ [Unit.Mooca]: -3 })).toThrow();
  });
});
