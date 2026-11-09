import { describe, expect, it } from 'vitest';
import { FairRotationScheduler } from './FairRotationScheduler';
import { RotationHistory } from './RotationHistory';
import { Employee } from './Employee';
import { Unit } from './Unit';
import { WeekDay, WEEKDAYS } from './WeekDay';
import { DayAssignment } from './DayAssignment';
import { defaultScheduleRules, ScheduleValidator } from './ScheduleValidator';

function mooca(registration: string): Employee {
  return Employee.create({ registration, name: `Colab ${registration}`, unit: Unit.Mooca });
}

function admin(registration: string): Employee {
  return Employee.create({
    registration,
    name: `Admin ${registration}`,
    unit: Unit.Administrativo,
  });
}

const scheduler = new FairRotationScheduler();
const validator = new ScheduleValidator(defaultScheduleRules());

describe('FairRotationScheduler', () => {
  it('ADMINISTRATIVO folga sábado e domingo; MOOCA ganha uma folga rotativa', () => {
    const { weeks } = scheduler.generate([admin('1'), mooca('2')], RotationHistory.empty());
    const [adminWeek, moocaWeek] = weeks;

    expect(adminWeek?.restDays).toEqual([WeekDay.Saturday, WeekDay.Sunday]);
    expect(moocaWeek?.rotatingRestDays).toHaveLength(1);
    expect(moocaWeek?.assignmentOf(WeekDay.Sunday)).toBe(DayAssignment.FixedRest);
  });

  it('gera uma escala que passa em todas as regras (R1–R4)', () => {
    const employees = [admin('1'), mooca('2'), mooca('3'), mooca('4'), mooca('5')];
    const { weeks } = scheduler.generate(employees, RotationHistory.empty());
    expect(validator.isValid(weeks)).toBe(true);
  });

  it('é determinístico: mesma entrada, mesma escala', () => {
    const employees = [mooca('2'), mooca('3'), mooca('4')];
    const first = scheduler.generate(employees, RotationHistory.empty());
    const second = scheduler.generate(employees, RotationHistory.empty());
    expect(first.weeks.map((w) => w.rotatingRestDays)).toEqual(
      second.weeks.map((w) => w.rotatingRestDays),
    );
  });

  it('distribui os colaboradores por dias diferentes na mesma semana (cobertura)', () => {
    const employees = [mooca('2'), mooca('3'), mooca('4'), mooca('5'), mooca('6'), mooca('7')];
    const { weeks } = scheduler.generate(employees, RotationHistory.empty());
    const chosen = weeks.map((w) => w.rotatingRestDays[0]);
    expect(new Set(chosen).size).toBe(6);
  });

  it('não repete a folga rotativa em duas semanas seguidas', () => {
    let history = RotationHistory.empty();
    let previous: WeekDay | undefined;
    for (let week = 0; week < 8; week += 1) {
      const result = scheduler.generate([mooca('2')], history);
      const day = result.weeks[0]?.rotatingRestDays[0];
      expect(day).not.toBe(previous);
      previous = day;
      history = result.history;
    }
  });

  it('equilibra as folgas entre os dias ao longo de 12 semanas', () => {
    let history = RotationHistory.empty();
    for (let week = 0; week < 12; week += 1) {
      history = scheduler.generate([mooca('2')], history).history;
    }
    // 12 semanas / 6 dias candidatos = 2 folgas por dia, distribuição perfeita.
    const candidates = [...WEEKDAYS, WeekDay.Saturday];
    for (const day of candidates) {
      expect(history.restCount('2', day)).toBe(2);
    }
  });
});
