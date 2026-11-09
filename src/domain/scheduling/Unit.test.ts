import { describe, expect, it } from 'vitest';
import { policyOf, REST_DAYS_PER_WEEK, Unit, UNIT_POLICIES } from './Unit';
import { WeekDay } from './WeekDay';

describe('UnitPolicy', () => {
  it('ADMINISTRATIVO folga sábado e domingo, sem folga rotativa', () => {
    const policy = policyOf(Unit.Administrativo);
    expect(policy.fixedRestDays).toEqual([WeekDay.Saturday, WeekDay.Sunday]);
    expect(policy.rotatingRestCount).toBe(0);
    expect(policy.rotatingRestCandidates).toEqual([]);
  });

  it('MOOCA folga domingo e tem 1 folga rotativa de segunda a sábado', () => {
    const policy = policyOf(Unit.Mooca);
    expect(policy.fixedRestDays).toEqual([WeekDay.Sunday]);
    expect(policy.rotatingRestCount).toBe(1);
    expect(policy.rotatingRestCandidates).not.toContain(WeekDay.Sunday);
    expect(policy.rotatingRestCandidates).toHaveLength(6);
  });

  it('toda política soma exatamente 2 folgas por semana (R1)', () => {
    for (const policy of Object.values(UNIT_POLICIES)) {
      expect(policy.fixedRestDays.length + policy.rotatingRestCount).toBe(REST_DAYS_PER_WEEK);
    }
  });

  it('nenhuma unidade trabalha no domingo (R4)', () => {
    for (const policy of Object.values(UNIT_POLICIES)) {
      expect(policy.fixedRestDays).toContain(WeekDay.Sunday);
    }
  });
});
