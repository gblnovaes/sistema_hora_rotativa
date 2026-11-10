import { addDays, fromIsoDate } from '@domain/scheduling/CalendarWeek';
import { isRest } from '@domain/scheduling/DayAssignment';
import { Employee } from '@domain/scheduling/Employee';
import { Unit } from '@domain/scheduling/Unit';
import { WEEK_DAYS, WeekDay } from '@domain/scheduling/WeekDay';
import type { EmployeeRecord } from '@presentation/employees/employeeDirectory';
import type { ScheduleWeekView } from '@presentation/schedule/scheduleGateway';
import { CSV_BOM, formatCsvRow, parseCsv } from './csv';

const TITLE = 'ESCALA DE TRABALHO — JORNADA 5x2';
const REST = 'Folga';
const WORK = 'Trabalho';

const DAY_NAME: Record<WeekDay, string> = {
  [WeekDay.Monday]: 'Segunda',
  [WeekDay.Tuesday]: 'Terça',
  [WeekDay.Wednesday]: 'Quarta',
  [WeekDay.Thursday]: 'Quinta',
  [WeekDay.Friday]: 'Sexta',
  [WeekDay.Saturday]: 'Sábado',
  [WeekDay.Sunday]: 'Domingo',
};

const HEADER = [
  'Nº',
  'Colaborador',
  'Horário / Turno',
  ...WEEK_DAYS.map((day) => DAY_NAME[day]),
  'Total de folgas',
];
const COLUMNS = HEADER.length;

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// ─── Exportação ──────────────────────────────────────────────────────────────

function brDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

function padded(cells: readonly string[]): string[] {
  return [...cells, ...Array<string>(COLUMNS - cells.length).fill('')];
}

function block(week: ScheduleWeekView, shifts: ReadonlyMap<string, string>): string[] {
  const start = fromIsoDate(week.startDate);
  const lines = [
    formatCsvRow(padded([TITLE])),
    formatCsvRow(padded([`Período de ${brDate(start)} a ${brDate(addDays(start, 6))}`])),
    formatCsvRow(padded([])),
    formatCsvRow(HEADER),
  ];
  for (const row of week.rows) {
    const cells = WEEK_DAYS.map((day) => {
      const cell = row.days.find((item) => item.day === day);
      return cell !== undefined && isRest(cell.assignment) ? REST : WORK;
    });
    const rests = cells.filter((cell) => cell === REST).length;
    lines.push(
      formatCsvRow([
        row.registration,
        row.name,
        shifts.get(row.registration) ?? '',
        ...cells,
        String(rests),
      ]),
    );
  }
  return lines;
}

/**
 * Gera o CSV no padrão da planilha base: título, período, linha em branco, cabeçalho
 * e uma linha por colaborador (Trabalho/Folga de segunda a domingo e o total de
 * folgas). Várias semanas viram blocos separados por uma linha vazia.
 */
export function buildScheduleCsv(
  weeks: readonly ScheduleWeekView[],
  shifts: ReadonlyMap<string, string> = new Map(),
): string {
  const blocks = weeks.map((week) => block(week, shifts).join('\r\n'));
  return `${CSV_BOM}${blocks.join('\r\n\r\n')}\r\n`;
}

// ─── Importação ──────────────────────────────────────────────────────────────

export interface ImportIssue {
  /** Linha do arquivo (1 = primeira). */
  readonly line: number;
  readonly message: string;
}

export interface ParsedSpreadsheet {
  readonly employees: readonly EmployeeRecord[];
  readonly issues: readonly ImportIssue[];
}

export interface ParseOptions {
  /** Força a unidade de todos; sem isso ela é deduzida das folgas da planilha. */
  readonly unit?: Unit;
}

interface Layout {
  readonly headerRow: number;
  readonly registration: number;
  readonly name: number;
  readonly shift: number | null;
  readonly days: ReadonlyMap<WeekDay, number>;
}

function findLayout(rows: readonly string[][]): Layout | null {
  const dayByName = new Map(WEEK_DAYS.map((day) => [normalize(DAY_NAME[day]), day] as const));
  for (const [rowIndex, row] of rows.entries()) {
    const names = row.map(normalize);
    const name = names.findIndex((cell) => cell === 'colaborador' || cell === 'nome');
    if (name === -1) {
      continue;
    }
    const days = new Map<WeekDay, number>();
    names.forEach((cell, column) => {
      const day = dayByName.get(cell);
      if (day !== undefined) {
        days.set(day, column);
      }
    });
    if (days.size !== WEEK_DAYS.length) {
      continue;
    }
    const registration = names.findIndex((cell) =>
      ['n', 'no', 'numero', 'matricula', 'nmatricula'].includes(cell),
    );
    const shift = names.findIndex((cell) => cell.startsWith('horario') || cell === 'turno');
    return {
      headerRow: rowIndex,
      registration: registration === -1 ? 0 : registration,
      name,
      shift: shift === -1 ? null : shift,
      days,
    };
  }
  return null;
}

function inferUnit(restDays: readonly WeekDay[]): Unit | null {
  const weekend = restDays.includes(WeekDay.Saturday) && restDays.includes(WeekDay.Sunday);
  if (restDays.length === 2 && weekend) {
    return Unit.Administrativo;
  }
  if (restDays.length === 2 && restDays.includes(WeekDay.Sunday)) {
    return Unit.Mooca;
  }
  return null;
}

/**
 * Lê a planilha base (mesmo formato da exportação) e devolve os colaboradores.
 *
 * A unidade sai das folgas da linha: sábado e domingo → Administrativo; domingo mais
 * outro dia → Mooca. Linhas inválidas viram `issues` e não impedem as demais.
 * Quando o mesmo colaborador aparece em várias semanas, vale a primeira ocorrência.
 */
export function parseScheduleCsv(text: string, options: ParseOptions = {}): ParsedSpreadsheet {
  const rows = parseCsv(text);
  const layout = findLayout(rows);
  if (layout === null) {
    return {
      employees: [],
      issues: [
        {
          line: 1,
          message:
            'Cabeçalho não encontrado. Use as colunas Nº, Colaborador, Horário / Turno e os dias de Segunda a Domingo.',
        },
      ],
    };
  }

  const employees = new Map<string, EmployeeRecord>();
  const issues: ImportIssue[] = [];
  for (const [rowIndex, row] of rows.entries()) {
    const line = rowIndex + 1;
    const cell = (column: number): string => (row[column] ?? '').trim();
    const isData = rowIndex > layout.headerRow;
    // Título e período dos outros blocos só têm a primeira célula preenchida.
    const onlyFirstCell = row.slice(1).every((value) => value.trim() === '');
    if (!isData || onlyFirstCell) {
      continue;
    }
    if (normalize(cell(layout.name)) === 'colaborador') {
      continue; // cabeçalho repetido nos blocos seguintes
    }

    const restDays = WEEK_DAYS.filter((day) => {
      const column = layout.days.get(day);
      return column !== undefined && normalize(cell(column)) === normalize(REST);
    });
    const unit = options.unit ?? inferUnit(restDays);
    if (unit === null) {
      issues.push({
        line,
        message: `Não deu para identificar a unidade de ${cell(layout.name)}: as folgas não seguem Administrativo (Sáb + Dom) nem Mooca (Dom + 1 dia). Escolha a unidade manualmente.`,
      });
      continue;
    }

    const registration = cell(layout.registration);
    if (employees.has(registration)) {
      continue;
    }
    try {
      const employee = Employee.create({ registration, name: cell(layout.name), unit });
      const shift = layout.shift === null ? '' : cell(layout.shift);
      const record: EmployeeRecord = {
        registration: employee.registration,
        name: employee.name,
        unit: employee.unit,
      };
      employees.set(registration, shift === '' ? record : { ...record, shift });
    } catch (error) {
      issues.push({ line, message: error instanceof Error ? error.message : String(error) });
    }
  }
  return { employees: [...employees.values()], issues };
}
