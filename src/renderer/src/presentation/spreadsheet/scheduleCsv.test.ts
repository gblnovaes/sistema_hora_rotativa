import { describe, expect, it } from 'vitest';
import { DayAssignment } from '@domain/scheduling/DayAssignment';
import { Unit } from '@domain/scheduling/Unit';
import { WEEK_DAYS, WeekDay } from '@domain/scheduling/WeekDay';
import type { ScheduleWeekView } from '@presentation/schedule/scheduleGateway';
import { parseCsv } from './csv';
import { buildScheduleCsv, parseScheduleCsv } from './scheduleCsv';

const BASE = `ESCALA DE TRABALHO — JORNADA 5x2,,,,,,,,,,
Período de 08/11/2026 a 14/11/2026,,,,,,,,,,
,,,,,,,,,,
Nº,Colaborador,Horário / Turno,Segunda,Terça,Quarta,Quinta,Sexta,Sábado,Domingo,Total de folgas
1315,Claudenilson Miranda Moreira,08:00h as 17:24h,Trabalho,Trabalho,Trabalho,Trabalho,Trabalho,Folga,Folga,2
667,Eliana Teodora Bernanrdes,08:00h as 17:24h,Trabalho,Trabalho,Trabalho,Trabalho,Trabalho,Folga,Folga,2
`;

function week(
  startDate: string,
  rests: Readonly<Record<string, readonly WeekDay[]>>,
): ScheduleWeekView {
  return {
    index: 0,
    startDate,
    violations: [],
    rows: Object.entries(rests).map(([registration, restDays]) => ({
      registration,
      name: `Nome ${registration}`,
      unit: Unit.Mooca,
      days: WEEK_DAYS.map((day) => ({
        day,
        assignment: restDays.includes(day) ? DayAssignment.FixedRest : DayAssignment.Work,
      })),
    })),
  };
}

describe('parseScheduleCsv', () => {
  it('lê a planilha base e deduz Administrativo por sábado e domingo de folga', () => {
    const result = parseScheduleCsv(BASE);

    expect(result.issues).toEqual([]);
    expect(result.employees).toEqual([
      {
        registration: '1315',
        name: 'Claudenilson Miranda Moreira',
        unit: Unit.Administrativo,
        shift: '08:00h as 17:24h',
      },
      {
        registration: '667',
        name: 'Eliana Teodora Bernanrdes',
        unit: Unit.Administrativo,
        shift: '08:00h as 17:24h',
      },
    ]);
  });

  it('deduz Mooca quando só o domingo é fixo e há mais um dia de folga', () => {
    const csv = BASE.replace(
      '1315,Claudenilson Miranda Moreira,08:00h as 17:24h,Trabalho,Trabalho,Trabalho,Trabalho,Trabalho,Folga,Folga,2',
      '1,Ana,08:00h as 14:00h,Trabalho,Folga,Trabalho,Trabalho,Trabalho,Trabalho,Folga,2',
    );
    expect(parseScheduleCsv(csv).employees[0]).toMatchObject({
      registration: '1',
      unit: Unit.Mooca,
    });
  });

  it('usa a unidade escolhida quando ela é informada', () => {
    const result = parseScheduleCsv(BASE, { unit: Unit.Mooca });
    expect(result.employees.every((employee) => employee.unit === Unit.Mooca)).toBe(true);
  });

  it('relata a linha cujo padrão de folgas não permite deduzir a unidade', () => {
    const csv = BASE.replace(
      '667,Eliana Teodora Bernanrdes,08:00h as 17:24h,Trabalho,Trabalho,Trabalho,Trabalho,Trabalho,Folga,Folga,2',
      '667,Eliana,08:00h as 17:24h,Folga,Folga,Folga,Trabalho,Trabalho,Trabalho,Trabalho,3',
    );
    const result = parseScheduleCsv(csv);

    expect(result.employees.map((employee) => employee.registration)).toEqual(['1315']);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.line).toBe(6);
    expect(result.issues[0]?.message).toMatch(/Eliana/);
  });

  it('relata dados inválidos sem barrar as outras linhas', () => {
    const csv = BASE.replace('667,Eliana Teodora Bernanrdes', '667,   ');
    const result = parseScheduleCsv(csv);

    expect(result.employees).toHaveLength(1);
    expect(result.issues).toHaveLength(1);
  });

  it('avisa quando não acha o cabeçalho', () => {
    const result = parseScheduleCsv('a,b\n1,2');
    expect(result.employees).toEqual([]);
    expect(result.issues[0]?.message).toMatch(/Cabeçalho não encontrado/);
  });

  it('aceita ponto e vírgula, BOM e colunas fora de ordem', () => {
    const csv =
      '﻿Colaborador;Nº;Segunda;Terça;Quarta;Quinta;Sexta;Sábado;Domingo\r\n' +
      'Ana Souza;10;Trabalho;Trabalho;Trabalho;Trabalho;Trabalho;Folga;Folga\r\n';
    expect(parseScheduleCsv(csv).employees).toEqual([
      { registration: '10', name: 'Ana Souza', unit: Unit.Administrativo },
    ]);
  });

  it('em planilha com várias semanas, vale a primeira ocorrência de cada colaborador', () => {
    const second = BASE.replace('08/11/2026 a 14/11/2026', '15/11/2026 a 21/11/2026');
    const result = parseScheduleCsv(`${BASE}\r\n${second}`);

    expect(result.issues).toEqual([]);
    expect(result.employees).toHaveLength(2);
  });
});

describe('buildScheduleCsv', () => {
  const shifts = new Map([['1', '08:00h as 14:00h']]);

  it('segue o padrão da planilha base: título, período, linha vazia, cabeçalho e dados', () => {
    const csv = buildScheduleCsv(
      [week('2026-11-09', { '1': [WeekDay.Wednesday, WeekDay.Sunday] })],
      shifts,
    );
    const lines = csv.replace('﻿', '').trimEnd().split('\r\n');

    expect(lines[0]).toBe('ESCALA DE TRABALHO — JORNADA 5x2,,,,,,,,,,');
    expect(lines[1]).toBe('Período de 09/11/2026 a 15/11/2026,,,,,,,,,,');
    expect(lines[2]).toBe(',,,,,,,,,,');
    expect(lines[3]).toBe(
      'Nº,Colaborador,Horário / Turno,Segunda,Terça,Quarta,Quinta,Sexta,Sábado,Domingo,Total de folgas',
    );
    expect(lines[4]).toBe(
      '1,Nome 1,08:00h as 14:00h,Trabalho,Trabalho,Folga,Trabalho,Trabalho,Trabalho,Folga,2',
    );
  });

  it('começa com BOM para o Excel abrir os acentos', () => {
    expect(buildScheduleCsv([week('2026-11-09', {})]).startsWith('﻿')).toBe(true);
  });

  it('deixa o horário vazio quando o colaborador não tem', () => {
    const csv = buildScheduleCsv([week('2026-11-09', { '9': [WeekDay.Sunday, WeekDay.Monday] })]);
    expect(parseCsv(csv.replace('﻿', ''))[4]?.[2]).toBe('');
  });

  it('separa várias semanas em blocos com uma linha vazia entre eles', () => {
    const csv = buildScheduleCsv([
      week('2026-11-09', { '1': [WeekDay.Sunday, WeekDay.Monday] }),
      week('2026-11-16', { '1': [WeekDay.Sunday, WeekDay.Tuesday] }),
    ]);

    expect(csv).toContain('Período de 09/11/2026 a 15/11/2026');
    expect(csv).toContain('Período de 16/11/2026 a 22/11/2026');
    expect(csv).toMatch(/\r\n\r\nESCALA DE TRABALHO/);
  });

  it('o que se exporta pode ser importado de volta', () => {
    const csv = buildScheduleCsv(
      [week('2026-11-09', { '1': [WeekDay.Wednesday, WeekDay.Sunday] })],
      shifts,
    );
    const imported = parseScheduleCsv(csv);

    expect(imported.issues).toEqual([]);
    expect(imported.employees).toEqual([
      { registration: '1', name: 'Nome 1', unit: Unit.Mooca, shift: '08:00h as 14:00h' },
    ]);
  });
});
