import { describe, expect, it } from 'vitest';
import { DayAssignment } from '@domain/scheduling/DayAssignment';
import { Unit } from '@domain/scheduling/Unit';
import { WeekDay } from '@domain/scheduling/WeekDay';
import type { GeneratedSchedule, ScheduleGateway } from './scheduleGateway';
import { WeeklyScheduleViewModel } from './WeeklyScheduleViewModel';

const row = {
  registration: '2001',
  name: 'Camila Andrade',
  unit: Unit.Administrativo,
  days: [{ day: WeekDay.Monday, assignment: DayAssignment.Work }],
};

class FakeGateway implements ScheduleGateway {
  constructor(private readonly result: GeneratedSchedule | Error) {}
  generate(): Promise<GeneratedSchedule> {
    return this.answer();
  }
  moveRotatingRest(): Promise<GeneratedSchedule> {
    return this.answer();
  }
  private answer(): Promise<GeneratedSchedule> {
    if (this.result instanceof Error) {
      return Promise.reject(this.result);
    }
    return Promise.resolve(this.result);
  }
}

describe('WeeklyScheduleViewModel', () => {
  it('publica as linhas e as violações ao gerar', async () => {
    const vm = new WeeklyScheduleViewModel(
      new FakeGateway({ rows: [row], violations: ['2001: exemplo'] }),
    );

    await vm.generate();

    expect(vm.store.getState().loading).toBe(false);
    expect(vm.store.getState().error).toBeNull();
    expect(vm.store.getState().rows).toEqual([row]);
    expect(vm.store.getState().violations).toEqual(['2001: exemplo']);
  });

  it('guarda a mensagem de erro e preserva a escala anterior quando a geração falha', async () => {
    const failing = new WeeklyScheduleViewModel(new FakeGateway(new Error('sem cobertura')));
    failing.store.setState({ rows: [row], violations: [] });
    await failing.generate();

    expect(failing.store.getState().error).toBe('sem cobertura');
    expect(failing.store.getState().loading).toBe(false);
    expect(failing.store.getState().rows).toEqual([row]);
  });

  it('aplica a troca e preserva a grade quando a troca é recusada', async () => {
    const moved = {
      ...row,
      days: [{ day: WeekDay.Friday, assignment: DayAssignment.RotatingRest }],
    };
    const vm = new WeeklyScheduleViewModel(new FakeGateway({ rows: [moved], violations: [] }));
    vm.store.setState({ rows: [row], violations: ['antiga'] });

    await vm.moveRotatingRest('2001', WeekDay.Friday);

    expect(vm.store.getState().rows).toEqual([moved]);
    expect(vm.store.getState().violations).toEqual([]);
    expect(vm.store.getState().error).toBeNull();

    const failing = new WeeklyScheduleViewModel(new FakeGateway(new Error('sem rotativa')));
    failing.store.setState({ rows: [row], violations: [] });
    await failing.moveRotatingRest('2001', WeekDay.Monday);

    expect(failing.store.getState().error).toBe('sem rotativa');
    expect(failing.store.getState().rows).toEqual([row]);
  });
});
