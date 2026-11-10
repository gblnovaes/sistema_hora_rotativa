import { describe, expect, it } from 'vitest';
import { Unit } from '@domain/scheduling/Unit';
import type { EmployeeDirectory, EmployeeRecord } from '@presentation/employees/employeeDirectory';
import { LocalScheduleGateway } from '@presentation/schedule/LocalScheduleGateway';
import type { FileSaver } from './fileSaver';
import { ImportExportViewModel } from './ImportExportViewModel';

class MemoryDirectory implements EmployeeDirectory {
  private records: EmployeeRecord[];
  constructor(initial: readonly EmployeeRecord[] = []) {
    this.records = [...initial];
  }
  list(): Promise<readonly EmployeeRecord[]> {
    return Promise.resolve(this.records);
  }
  save(record: EmployeeRecord): Promise<void> {
    this.records = [...this.records.filter((r) => r.registration !== record.registration), record];
    return Promise.resolve();
  }
  remove(): Promise<void> {
    return Promise.resolve();
  }
}

class RecordingSaver implements FileSaver {
  readonly saved: { fileName: string; content: string; mimeType: string }[] = [];
  save(fileName: string, content: string, mimeType: string): void {
    this.saved.push({ fileName, content, mimeType });
  }
}

const CSV = `Nº,Colaborador,Horário / Turno,Segunda,Terça,Quarta,Quinta,Sexta,Sábado,Domingo,Total de folgas
1315,Claudenilson,08:00h as 17:24h,Trabalho,Trabalho,Trabalho,Trabalho,Trabalho,Folga,Folga,2
667,Eliana,08:00h as 17:24h,Trabalho,Trabalho,Trabalho,Trabalho,Trabalho,Folga,Folga,2
`;

function setup(initial: readonly EmployeeRecord[] = []): {
  vm: ImportExportViewModel;
  directory: MemoryDirectory;
  saver: RecordingSaver;
} {
  const directory = new MemoryDirectory(initial);
  const saver = new RecordingSaver();
  const schedule = new LocalScheduleGateway(directory, undefined, () => new Date(2026, 10, 10));
  return { vm: new ImportExportViewModel(directory, schedule, saver), directory, saver };
}

describe('ImportExportViewModel', () => {
  it('mostra o que seria importado sem gravar nada ainda', async () => {
    const { vm, directory } = setup();

    vm.previewImport('base.csv', CSV);

    expect(vm.store.getState().fileName).toBe('base.csv');
    expect(vm.store.getState().preview?.employees).toHaveLength(2);
    expect(await directory.list()).toEqual([]);
  });

  it('importa ao confirmar, contando novos e atualizados', async () => {
    const { vm, directory } = setup([{ registration: '667', name: 'Antigo', unit: Unit.Mooca }]);
    vm.previewImport('base.csv', CSV);

    await vm.confirmImport();

    const saved = await directory.list();
    expect(saved).toHaveLength(2);
    expect(saved.find((item) => item.registration === '667')).toMatchObject({
      name: 'Eliana',
      unit: Unit.Administrativo,
      shift: '08:00h as 17:24h',
    });
    expect(vm.store.getState().message).toBe('Importação concluída: 1 novo(s), 1 atualizado(s).');
    expect(vm.store.getState().preview).toBeNull();
    expect(vm.store.getState().weeks).toHaveLength(5);
  });

  it('reinterpreta o arquivo ao forçar a unidade', () => {
    const { vm } = setup();
    vm.previewImport('base.csv', CSV);

    vm.setUnit(Unit.Mooca);

    expect(vm.store.getState().preview?.employees.every((e) => e.unit === Unit.Mooca)).toBe(true);
  });

  it('guarda a unidade escolhida mesmo antes de haver arquivo', () => {
    const { vm } = setup();
    vm.setUnit(Unit.Mooca);
    vm.previewImport('base.csv', CSV);

    expect(vm.store.getState().preview?.employees[0]?.unit).toBe(Unit.Mooca);
  });

  it('recusa confirmar sem colaboradores válidos', async () => {
    const { vm } = setup();
    vm.previewImport('vazio.csv', 'a,b\n1,2');

    await vm.confirmImport();

    expect(vm.store.getState().error).toMatch(/Não há colaboradores/);
  });

  it('exporta uma semana no padrão da planilha, com o horário do cadastro', async () => {
    const { vm, saver } = setup([
      { registration: '667', name: 'Eliana', unit: Unit.Administrativo, shift: '08:00h as 17:24h' },
    ]);
    await vm.loadWeeks();

    await vm.exportCsv(0);

    expect(saver.saved).toHaveLength(1);
    expect(saver.saved[0]?.fileName).toBe('escala-2026-11-09.csv');
    expect(saver.saved[0]?.mimeType).toBe('text/csv');
    expect(saver.saved[0]?.content).toContain('Período de 09/11/2026 a 15/11/2026');
    expect(saver.saved[0]?.content).toContain(
      '667,Eliana,08:00h as 17:24h,Trabalho,Trabalho,Trabalho,Trabalho,Trabalho,Folga,Folga,2',
    );
  });

  it('exporta todas as semanas num arquivo só', async () => {
    const { vm, saver } = setup([{ registration: '1', name: 'Ana', unit: Unit.Mooca }]);
    await vm.loadWeeks();

    await vm.exportCsv('all');

    expect(saver.saved[0]?.fileName).toBe('escala-2026-11-09_a_2026-12-07.csv');
    expect(saver.saved[0]?.content.match(/Período de/g)).toHaveLength(5);
  });

  it('não exporta sem colaboradores', async () => {
    const { vm, saver } = setup();
    await vm.loadWeeks();

    await vm.exportCsv(0);

    expect(saver.saved).toEqual([]);
    expect(vm.store.getState().error).toMatch(/Cadastre ou importe/);
  });

  it('expõe o erro quando a escala não pode ser planejada', async () => {
    const { vm } = setup();
    const failing = new ImportExportViewModel(
      new MemoryDirectory(),
      {
        generate: () => Promise.reject(new Error('sem cobertura')),
        moveRotatingRest: () => Promise.reject(new Error('n/a')),
      },
      new RecordingSaver(),
    );
    await failing.loadWeeks();

    expect(failing.store.getState().error).toBe('sem cobertura');
    expect(vm.store.getState().error).toBeNull();
  });
});
