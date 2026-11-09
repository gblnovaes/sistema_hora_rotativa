import { describe, expect, it } from 'vitest';
import { FairRotationScheduler } from './FairRotationScheduler';
import { CoveragePolicy } from './CoveragePolicy';
import { RotationHistory } from './RotationHistory';
import { Employee } from './Employee';
import { Unit } from './Unit';
import { DayAssignment } from './DayAssignment';
import { WeekDay } from './WeekDay';
import { defaultScheduleRules, ScheduleValidator } from './ScheduleValidator';
import type { EmployeeWeek } from './EmployeeWeek';

const scheduler = new FairRotationScheduler();
const validator = new ScheduleValidator(defaultScheduleRules());

const MOOCA_WORK_DAYS = [
  WeekDay.Monday,
  WeekDay.Tuesday,
  WeekDay.Wednesday,
  WeekDay.Thursday,
  WeekDay.Friday,
  WeekDay.Saturday,
];

function moocaTeam(size: number): Employee[] {
  return Array.from({ length: size }, (_, index) =>
    Employee.create({ registration: `m${index}`, name: `Colab ${index}`, unit: Unit.Mooca }),
  );
}

function workersOn(weeks: readonly EmployeeWeek[], day: WeekDay): number {
  return weeks.filter((week) => week.assignmentOf(day) === DayAssignment.Work).length;
}

describe('FairRotationScheduler — cobertura mínima', () => {
  it('mantém todos os dias úteis no piso de cobertura', () => {
    const team = moocaTeam(8);
    const coverage = CoveragePolicy.perUnit({ [Unit.Mooca]: 5 });
    const { weeks } = scheduler.generate(team, RotationHistory.empty(), { coverage });

    for (const day of MOOCA_WORK_DAYS) {
      expect(workersOn(weeks, day)).toBeGreaterThanOrEqual(5);
    }
    expect(validator.isValid(weeks)).toBe(true);
  });

  it('com piso apertado, espalha as folgas (nenhum dia abaixo do mínimo)', () => {
    const team = moocaTeam(6);
    // 6 colaboradores, mínimo 5 → no máximo 1 folga por dia.
    const coverage = CoveragePolicy.perUnit({ [Unit.Mooca]: 5 });
    const { weeks } = scheduler.generate(team, RotationHistory.empty(), { coverage });

    for (const day of MOOCA_WORK_DAYS) {
      expect(workersOn(weeks, day)).toBeGreaterThanOrEqual(5);
    }
  });

  it('falha quando a cobertura mínima torna a escala impossível', () => {
    const team = moocaTeam(3);
    // mínimo 3 de 3 → capacidade 0 folgas/dia, mas cada um precisa de 1 folga.
    const coverage = CoveragePolicy.perUnit({ [Unit.Mooca]: 3 });
    expect(() => scheduler.generate(team, RotationHistory.empty(), { coverage })).toThrow();
  });

  it('não impõe piso quando não há política de cobertura', () => {
    const team = moocaTeam(6);
    expect(() => scheduler.generate(team, RotationHistory.empty())).not.toThrow();
  });
});
