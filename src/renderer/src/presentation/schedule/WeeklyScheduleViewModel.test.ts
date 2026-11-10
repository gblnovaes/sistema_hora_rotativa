import { describe, expect, it } from 'vitest';
import { DayAssignment } from '@domain/scheduling/DayAssignment';
import { Unit } from '@domain/scheduling/Unit';
import { WeekDay } from '@domain/scheduling/WeekDay';
import type { GeneratedSchedule, ScheduleGateway, ScheduleWeekView } from './scheduleGateway';
import { DEFAULT_HORIZON_WEEKS, WeeklyScheduleViewModel } from './WeeklyScheduleViewModel';

const row = {
  registration: '2001',
  name: 'Camila Andrade',
  unit: Unit.Administrativo,
  days: [{ day: WeekDay.Monday, assignment: DayAssignment.Work }],
};

function week(index: number, violations: readonly string[] = []): ScheduleWeekView {
  return {
    index,
    startDate: `2026-11-${String(9 + index * 7).padStart(2, '0')}`,
    rows: [row],
    violations,
  };
}

class FakeGateway implements ScheduleGateway {
  readonly requested: number[] = [];
  readonly moves: { weekIndex: number; registration: string; day: WeekDay }[] = [];

  constructor(private readonly result: GeneratedSchedule | Error) {}

  generate(weekCount: number): Promise<GeneratedSchedule> {
    this.requested.push(weekCount);
    return this.answer();
  }
  moveRotatingRest(
    weekIndex: number,
    registration: string,
    day: WeekDay,
  ): Promise<GeneratedSchedule> {
    this.moves.push({ weekIndex, registration, day });
    return this.answer();
  }
  private answer(): Promise<GeneratedSchedule> {
    return this.result instanceof Error
      ? Promise.reject(this.result)
      : Promise.resolve(this.result);
  }
}

describe('WeeklyScheduleViewModel', () => {
  it('pede ao menos um mês por padrão e publica as semanas', async () => {
    const gateway = new FakeGateway({ weeks: [week(0), week(1, ['2001: exemplo'])] });
    const vm = new WeeklyScheduleViewModel(gateway);

    await vm.generate();

    expect(gateway.requested).toEqual([DEFAULT_HORIZON_WEEKS]);
    expect(DEFAULT_HORIZON_WEEKS).toBeGreaterThanOrEqual(5);
    const state = vm.store.getState();
    expect(state.weeks).toHaveLength(2);
    expect(state.selectedIndex).toBe(0);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('muda o horizonte e gera de novo com a nova quantidade de semanas', async () => {
    const gateway = new FakeGateway({ weeks: [week(0)] });
    const vm = new WeeklyScheduleViewModel(gateway);

    await vm.setHorizon(9);

    expect(vm.store.getState().horizonWeeks).toBe(9);
    expect(gateway.requested).toEqual([9]);
  });

  it('seleciona só semanas que existem', async () => {
    const vm = new WeeklyScheduleViewModel(new FakeGateway({ weeks: [week(0), week(1)] }));
    await vm.generate();

    vm.selectWeek(1);
    expect(vm.store.getState().selectedIndex).toBe(1);
    vm.selectWeek(9);
    vm.selectWeek(-1);
    expect(vm.store.getState().selectedIndex).toBe(1);
  });

  it('volta para a semana atual ao gerar de novo', async () => {
    const vm = new WeeklyScheduleViewModel(new FakeGateway({ weeks: [week(0), week(1)] }));
    await vm.generate();
    vm.selectWeek(1);

    await vm.generate();

    expect(vm.store.getState().selectedIndex).toBe(0);
  });

  it('guarda a mensagem de erro e preserva a escala anterior quando a geração falha', async () => {
    const failing = new WeeklyScheduleViewModel(new FakeGateway(new Error('sem cobertura')));
    failing.store.setState({ weeks: [week(0)] });

    await failing.generate();

    expect(failing.store.getState().error).toBe('sem cobertura');
    expect(failing.store.getState().loading).toBe(false);
    expect(failing.store.getState().weeks).toEqual([week(0)]);
  });

  it('troca a folga na semana selecionada e aplica o plano refeito', async () => {
    const gateway = new FakeGateway({ weeks: [week(0), week(1), week(2)] });
    const vm = new WeeklyScheduleViewModel(gateway);
    await vm.generate();
    vm.selectWeek(2);

    await vm.moveRotatingRest('2001', WeekDay.Friday);

    expect(gateway.moves).toEqual([{ weekIndex: 2, registration: '2001', day: WeekDay.Friday }]);
    expect(vm.store.getState().weeks).toHaveLength(3);
    expect(vm.store.getState().selectedIndex).toBe(2);
    expect(vm.store.getState().error).toBeNull();
  });

  it('preserva o plano quando a troca é recusada', async () => {
    const vm = new WeeklyScheduleViewModel(new FakeGateway(new Error('sem rotativa')));
    vm.store.setState({ weeks: [week(0)] });

    await vm.moveRotatingRest('2001', WeekDay.Monday);

    expect(vm.store.getState().error).toBe('sem rotativa');
    expect(vm.store.getState().weeks).toEqual([week(0)]);
  });
});
