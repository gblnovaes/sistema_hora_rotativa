import { createStore, type StoreApi } from 'zustand/vanilla';
import type { Unit } from '@domain/scheduling/Unit';
import type { DiagnosticsSink } from '@presentation/diagnostics/diagnosticsTypes';
import type { EmployeeDirectory } from '@presentation/employees/employeeDirectory';
import type { ScheduleGateway, ScheduleWeekView } from '@presentation/schedule/scheduleGateway';
import type { FileSaver } from './fileSaver';
import { buildScheduleCsv, parseScheduleCsv, type ParsedSpreadsheet } from './scheduleCsv';

/** Semanas oferecidas para exportar: a atual e as quatro seguintes (1 mês). */
export const EXPORT_WEEKS = 5;

export type ExportSelection = number | 'all';

export interface ImportExportState {
  readonly fileName: string | null;
  /** Resultado da leitura do arquivo escolhido; `null` antes de escolher um. */
  readonly preview: ParsedSpreadsheet | null;
  /** Unidade forçada para todos; `null` deduz pelas folgas da planilha. */
  readonly unit: Unit | null;
  readonly weeks: readonly ScheduleWeekView[];
  readonly message: string | null;
  readonly error: string | null;
}

/**
 * ViewModel de importar e exportar planilha (MVVM). Lê o CSV, mostra o que seria
 * importado e só grava no cadastro quando o usuário confirma. A exportação gera a
 * escala do cadastro no padrão da planilha base. Não conhece React nem o DOM.
 */
export class ImportExportViewModel {
  readonly store: StoreApi<ImportExportState>;
  private sourceText = '';

  constructor(
    private readonly directory: EmployeeDirectory,
    private readonly schedule: ScheduleGateway,
    private readonly saver: FileSaver,
    private readonly diagnostics?: DiagnosticsSink,
  ) {
    this.store = createStore<ImportExportState>()(() => ({
      fileName: null,
      preview: null,
      unit: null,
      weeks: [],
      message: null,
      error: null,
    }));
  }

  previewImport(fileName: string, text: string): void {
    this.sourceText = text;
    const { unit } = this.store.getState();
    this.store.setState({
      fileName,
      preview: this.parse(unit),
      message: null,
      error: null,
    });
  }

  setUnit(unit: Unit | null): void {
    this.store.setState({ unit });
    if (this.store.getState().preview !== null) {
      this.store.setState({ preview: this.parse(unit) });
    }
  }

  async confirmImport(): Promise<void> {
    const { preview } = this.store.getState();
    if (preview === null || preview.employees.length === 0) {
      this.store.setState({ error: 'Não há colaboradores válidos para importar.' });
      return;
    }
    const existing = new Set((await this.directory.list()).map((item) => item.registration));
    for (const record of preview.employees) {
      await this.directory.save(record);
    }
    const updated = preview.employees.filter((item) => existing.has(item.registration)).length;
    const added = preview.employees.length - updated;
    this.diagnostics?.increment('spreadsheet.imported', preview.employees.length);
    this.diagnostics?.record({
      level: 'info',
      message: 'planilha importada',
      context: { added, updated, ignored: preview.issues.length },
    });
    this.sourceText = '';
    this.store.setState({
      preview: null,
      fileName: null,
      message: `Importação concluída: ${added} novo(s), ${updated} atualizado(s).`,
      error: null,
    });
    await this.loadWeeks();
  }

  /** Planeja as semanas que poderão ser exportadas, a partir do cadastro atual. */
  async loadWeeks(): Promise<void> {
    try {
      const { weeks } = await this.schedule.generate(EXPORT_WEEKS);
      this.store.setState({ weeks });
    } catch (error) {
      this.store.setState({
        weeks: [],
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async exportCsv(selection: ExportSelection): Promise<void> {
    const { weeks } = this.store.getState();
    const chosen = selection === 'all' ? weeks : weeks.filter((week) => week.index === selection);
    const first = chosen[0];
    const last = chosen[chosen.length - 1];
    if (first === undefined || last === undefined || first.rows.length === 0) {
      this.store.setState({
        error: 'Cadastre ou importe colaboradores antes de exportar a escala.',
        message: null,
      });
      return;
    }

    const records = await this.directory.list();
    const shifts = new Map(
      records.flatMap((record) =>
        record.shift === undefined ? [] : [[record.registration, record.shift] as const],
      ),
    );
    const name =
      first === last
        ? `escala-${first.startDate}.csv`
        : `escala-${first.startDate}_a_${last.startDate}.csv`;
    this.saver.save(name, buildScheduleCsv(chosen, shifts), 'text/csv');
    this.diagnostics?.increment('spreadsheet.exported');
    this.diagnostics?.record({
      level: 'info',
      message: 'escala exportada',
      context: { weeks: chosen.length },
    });
    this.store.setState({ message: `Arquivo ${name} gerado.`, error: null });
  }

  private parse(unit: Unit | null): ParsedSpreadsheet {
    return parseScheduleCsv(this.sourceText, unit === null ? {} : { unit });
  }
}
