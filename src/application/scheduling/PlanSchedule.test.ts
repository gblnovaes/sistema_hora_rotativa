import { describe, expect, it } from 'vitest';
import { CoveragePolicy } from '@domain/scheduling/CoveragePolicy';
import { Employee } from '@domain/scheduling/Employee';
import { FairRotationScheduler } from '@domain/scheduling/FairRotationScheduler';
import { defaultScheduleRules, ScheduleValidator } from '@domain/scheduling/ScheduleValidator';
import { Unit } from '@domain/scheduling/Unit';
import { WeekDay } from '@domain/scheduling/WeekDay';
import { PlanSchedule, type PlannedWeek } from './PlanSchedule';
import { SwapRotatingRest } from './SwapRotatingRest';

function planner(): PlanSchedule {
  const validator = new ScheduleValidator(defaultScheduleRules());
  return new PlanSchedule({
    scheduler: new FairRotationScheduler(),
    validator,
    swap: new SwapRotatingRest({ validator }),
  });
}

const team = [
  Employee.create({ registration: '1', name: 'Ana', unit: Unit.Mooca }),
  Employee.create({ registration: '2', name: 'Bruno', unit: Unit.Mooca }),
  Employee.create({ registration: '3', name: 'Carla', unit: Unit.Administrativo }),
];

function restOf(week: PlannedWeek, registration: string): WeekDay | undefined {
  return week.weeks.find((item) => item.employee.registration === registration)
    ?.rotatingRestDays[0];
}

describe('PlanSchedule', () => {
  it('gera o número de semanas pedido, todas válidas', () => {
    const plan = planner().generate({ employees: team, weekCount: 5 });

    expect(plan).toHaveLength(5);
    expect(plan.every((week) => week.violations.length === 0)).toBe(true);
  });

  it('não repete a folga rotativa de uma semana para a seguinte', () => {
    const plan = planner().generate({ employees: team, weekCount: 5 });

    for (let index = 1; index < plan.length; index += 1) {
      const previous = plan[index - 1];
      const current = plan[index];
      if (previous === undefined || current === undefined) {
        throw new Error('semana ausente');
      }
      expect(restOf(current, '1')).not.toBe(restOf(previous, '1'));
    }
  });

  it('respeita a cobertura mínima em todas as semanas', () => {
    const plan = planner().generate({
      employees: team,
      weekCount: 5,
      coverage: CoveragePolicy.perUnit({ [Unit.Administrativo]: 1, [Unit.Mooca]: 1 }),
    });

    for (const week of plan) {
      expect(restOf(week, '1')).not.toBe(restOf(week, '2'));
    }
  });

  it('recusa um plano sem semanas', () => {
    expect(() => planner().generate({ employees: team, weekCount: 0 })).toThrow(/ao menos uma/);
  });

  it('troca uma folga: mantém as semanas anteriores e refaz as seguintes', () => {
    const service = planner();
    const plan = service.generate({ employees: team, weekCount: 5 });
    const current = restOf(plan[2] as PlannedWeek, '1');
    const target = current === WeekDay.Friday ? WeekDay.Tuesday : WeekDay.Friday;

    const swapped = service.swap({ plan, weekIndex: 2, registration: '1', day: target });

    expect(swapped).toHaveLength(5);
    expect(swapped[0]).toBe(plan[0]);
    expect(swapped[1]).toBe(plan[1]);
    expect(restOf(swapped[2] as PlannedWeek, '1')).toBe(target);
    expect(restOf(swapped[3] as PlannedWeek, '1')).not.toBe(target);
    expect(swapped.every((week) => week.violations.length === 0)).toBe(true);
  });

  it('recusa trocar numa semana que não existe', () => {
    const service = planner();
    const plan = service.generate({ employees: team, weekCount: 2 });
    expect(() =>
      service.swap({ plan, weekIndex: 7, registration: '1', day: WeekDay.Friday }),
    ).toThrow(/não existe/);
  });

  it('estende um plano mantendo as semanas existentes e a rotação justa', () => {
    const service = planner();
    const plan = service.generate({ employees: team, weekCount: 3 });

    const extended = service.extendPlan({ plan, weekCount: 6 });

    expect(extended).toHaveLength(6);
    expect(extended.slice(0, 3)).toEqual(plan);
    expect(restOf(extended[3] as PlannedWeek, '1')).not.toBe(
      restOf(extended[2] as PlannedWeek, '1'),
    );
    expect(extended.every((week) => week.violations.length === 0)).toBe(true);
  });

  it('não muda nada ao estender para um tamanho que o plano já tem', () => {
    const service = planner();
    const plan = service.generate({ employees: team, weekCount: 4 });

    expect(service.extendPlan({ plan, weekCount: 2 })).toEqual(plan);
  });

  it('recusa estender um plano vazio', () => {
    expect(() => planner().extendPlan({ plan: [], weekCount: 3 })).toThrow(/Não há plano/);
  });
});
