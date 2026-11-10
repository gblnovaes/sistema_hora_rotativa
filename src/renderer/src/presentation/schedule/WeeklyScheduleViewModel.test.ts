import { describe, expect, it } from 'vitest';
import { DayAssignment } from '@domain/scheduling/DayAssignment';
import { Unit } from '@domain/scheduling/Unit';
import { WeekDay } from '@domain/scheduling/WeekDay';
import type { GeneratedSchedule, ScheduleGateway, ScheduleWeekView } from './scheduleGateway';
import { DEFAULT_HORIZON_WEEKS, WeeklyScheduleViewModel } from './WeeklyScheduleViewModel';

const moocaRow = {
  registration: '3001',
  name: 'Rafael',
  unit: Unit.Mooca,
  days: [
    { day: WeekDay.Monday, assignment: DayAssignment.Work },
    { day: WeekDay.Wednesday, assignment: DayAssignment.RotatingRest },
    { day: WeekDay.Friday, assignment: DayAssignment.Work },
  ],
};

function week(index: number): ScheduleWeekView {
  return {
    index,
    startDate: `2026-11-${String(9 + index * 7).padStart(2, '0')}`,
    rows: [moocaRow],
    violations: [],
  };
}

function schedule(weekCount: number, savedAt = '2026-11-10T11:00:00.000Z'): GeneratedSchedule {
  return {
    weeks: Array.from({ length: weekCount }, (_, index) => week(index)),
    savedAt,
    outdated: false,
  };
}

class FakeGateway implements ScheduleGateway {
  readonly calls: string[] = [];
  readonly moves: { weekIndex: number; registration: string; day: WeekDay }[] = [];
  saved: GeneratedSchedule | null;
  failWith: Error | null = null;

  constructor(saved: GeneratedSchedule | null) {
    this.saved = saved;
  }

  load(weekCount: number): Promise<GeneratedSchedule | null> {
    this.calls.push(`load:${weekCount}`);
    return this.answer(this.saved);
  }
  generate(weekCount: number): Promise<GeneratedSchedule> {
    this.calls.push(`generate:${weekCount}`);
    this.saved = schedule(weekCount, '2026-11-10T12:00:00.000Z');
    return this.answer(this.saved);
  }
  moveRotatingRest(
    weekIndex: number,
    registration: string,
    day: WeekDay,
  ): Promise<GeneratedSchedule> {
    this.calls.push('move');
    this.moves.push({ weekIndex, registration, day });
    return this.answer(schedule(5, '2026-11-10T13:00:00.000Z'));
  }
  private answer<T>(value: T): Promise<T> {
    return this.failWith === null ? Promise.resolve(value) : Promise.reject(this.failWith);
  }
}

async function opened(gateway = new FakeGateway(schedule(5))): Promise<{
  vm: WeeklyScheduleViewModel;
  gateway: FakeGateway;
}> {
  const vm = new WeeklyScheduleViewModel(gateway);
  await vm.load();
  return { vm, gateway };
}

describe('WeeklyScheduleViewModel: abrir', () => {
  it('abre a escala salva sem gerar outra', async () => {
    const { vm, gateway } = await opened();

    expect(gateway.calls).toEqual([`load:${DEFAULT_HORIZON_WEEKS}`]);
    expect(DEFAULT_HORIZON_WEEKS).toBeGreaterThanOrEqual(5);
    const state = vm.store.getState();
    expect(state.weeks).toHaveLength(5);
    expect(state.savedAt).toBe('2026-11-10T11:00:00.000Z');
    expect(state.loading).toBe(false);
  });

  it('na primeira vez, sem escala salva, gera e salva a primeira sem pedir confirmação', async () => {
    const { vm, gateway } = await opened(new FakeGateway(null));

    expect(gateway.calls).toEqual(['load:5', 'generate:5']);
    expect(vm.store.getState().pending).toBeNull();
    expect(vm.store.getState().weeks).toHaveLength(5);
  });

  it('repassa o aviso de cadastro desatualizado', async () => {
    const { vm } = await opened(new FakeGateway({ ...schedule(5), outdated: true }));
    expect(vm.store.getState().outdated).toBe(true);
  });

  it('muda o horizonte reabrindo a escala salva, sem gerar de novo', async () => {
    const { vm, gateway } = await opened();

    await vm.setHorizon(9);

    expect(vm.store.getState().horizonWeeks).toBe(9);
    expect(gateway.calls).toEqual(['load:5', 'load:9']);
  });

  it('seleciona só semanas que existem', async () => {
    const { vm } = await opened();

    vm.selectWeek(3);
    vm.selectWeek(9);
    vm.selectWeek(-1);

    expect(vm.store.getState().selectedIndex).toBe(3);
  });

  it('guarda o erro e mantém o que já estava na tela quando abrir falha', async () => {
    const { vm, gateway } = await opened();
    gateway.failWith = new Error('disco cheio');

    await vm.load();

    expect(vm.store.getState().error).toBe('disco cheio');
    expect(vm.store.getState().loading).toBe(false);
    expect(vm.store.getState().weeks).toHaveLength(5);
  });
});

describe('WeeklyScheduleViewModel: confirmar antes de alterar', () => {
  it('gerar de novo só pede a confirmação e não executa nada ainda', async () => {
    const { vm, gateway } = await opened();

    await vm.requestRegenerate();

    expect(vm.store.getState().pending).toEqual({ kind: 'regenerate' });
    expect(gateway.calls).toEqual(['load:5']);
  });

  it('confirmar gera a nova escala, salva e limpa o pedido', async () => {
    const { vm, gateway } = await opened();
    vm.selectWeek(2);
    await vm.requestRegenerate();

    await vm.confirm();

    expect(gateway.calls).toEqual(['load:5', 'generate:5']);
    expect(vm.store.getState().pending).toBeNull();
    expect(vm.store.getState().selectedIndex).toBe(0);
    expect(vm.store.getState().savedAt).toBe('2026-11-10T12:00:00.000Z');
  });

  it('cancelar gerar de novo não muda nada', async () => {
    const { vm, gateway } = await opened();
    await vm.requestRegenerate();

    vm.cancel();

    expect(vm.store.getState().pending).toBeNull();
    expect(gateway.calls).toEqual(['load:5']);
    expect(vm.store.getState().savedAt).toBe('2026-11-10T11:00:00.000Z');
  });

  it('trocar uma folga descreve a mudança e espera a confirmação', async () => {
    const { vm, gateway } = await opened();
    vm.selectWeek(2);

    vm.requestMove('3001', WeekDay.Friday);

    expect(vm.store.getState().pending).toEqual({
      kind: 'move',
      weekIndex: 2,
      registration: '3001',
      name: 'Rafael',
      from: WeekDay.Wednesday,
      to: WeekDay.Friday,
    });
    expect(gateway.moves).toEqual([]);
  });

  it('confirmar a troca executa na semana selecionada e atualiza o horário salvo', async () => {
    const { vm, gateway } = await opened();
    vm.selectWeek(2);
    vm.requestMove('3001', WeekDay.Friday);

    await vm.confirm();

    expect(gateway.moves).toEqual([{ weekIndex: 2, registration: '3001', day: WeekDay.Friday }]);
    expect(vm.store.getState().pending).toBeNull();
    expect(vm.store.getState().selectedIndex).toBe(2);
    expect(vm.store.getState().savedAt).toBe('2026-11-10T13:00:00.000Z');
  });

  it('cancelar a troca não chama o gateway', async () => {
    const { vm, gateway } = await opened();
    vm.requestMove('3001', WeekDay.Friday);

    vm.cancel();

    expect(vm.store.getState().pending).toBeNull();
    expect(gateway.moves).toEqual([]);
  });

  it('ignora o pedido de troca de quem não está na semana', async () => {
    const { vm } = await opened();

    vm.requestMove('999', WeekDay.Friday);

    expect(vm.store.getState().pending).toBeNull();
  });

  it('confirmar sem nada pendente não faz nada', async () => {
    const { vm, gateway } = await opened();

    await vm.confirm();
    vm.cancel();

    expect(gateway.calls).toEqual(['load:5']);
  });

  it('se a troca confirmada for recusada, mostra o erro e preserva a escala', async () => {
    const { vm, gateway } = await opened();
    vm.requestMove('3001', WeekDay.Friday);
    gateway.failWith = new Error('sem rotativa');

    await vm.confirm();

    expect(vm.store.getState().error).toBe('sem rotativa');
    expect(vm.store.getState().weeks).toHaveLength(5);
    expect(vm.store.getState().pending).toBeNull();
  });

  it('sem escala na tela, gerar não precisa de confirmação', async () => {
    const gateway = new FakeGateway(null);
    gateway.failWith = new Error('sem cobertura');
    const vm = new WeeklyScheduleViewModel(gateway);
    await vm.load();
    gateway.failWith = null;

    await vm.requestRegenerate();

    expect(vm.store.getState().pending).toBeNull();
    expect(vm.store.getState().weeks).toHaveLength(5);
  });
});
