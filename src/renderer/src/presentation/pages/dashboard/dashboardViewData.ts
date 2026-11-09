/**
 * Tipos de apresentação do dashboard e um mock derivado da planilha base
 * (unidades ADMINISTRATIVO e MOOCA). Os números reais virão do processo main
 * via IPC quando o escalonador e a persistência existirem.
 */

export interface KpiTile {
  readonly label: string;
  readonly value: string;
  readonly hint: string;
}

export interface CoverageBar {
  readonly day: string;
  /** Colaboradores trabalhando no dia. */
  readonly working: number;
  readonly highlight: boolean;
}

export interface CoverageRing {
  readonly label: string;
  /** Cobertura do dia sobre o mínimo exigido, em porcentagem. */
  readonly percent: number;
}

export interface AgendaItem {
  readonly time: string;
  readonly title: string;
  readonly detail: string;
  readonly active: boolean;
}

export interface EmployeeSummary {
  readonly registration: string;
  readonly name: string;
  readonly unit: string;
  readonly restDays: string;
}

export interface PendingItem {
  readonly title: string;
  readonly when: string;
}

export interface DashboardViewData {
  readonly greetingName: string;
  readonly summary: string;
  readonly kpis: readonly KpiTile[];
  readonly coverageByDay: readonly CoverageBar[];
  readonly coverageRings: readonly CoverageRing[];
  readonly agenda: readonly AgendaItem[];
  readonly employees: readonly EmployeeSummary[];
  readonly pending: readonly PendingItem[];
}

export const dashboardMock: DashboardViewData = {
  greetingName: 'Gabriel',
  summary:
    'São 39 colaboradores em 2 unidades. Há 11 folgas rotativas para distribuir nesta semana.',
  kpis: [
    { label: 'Colaboradores', value: '39', hint: 'ADMIN 10 · MOOCA 29' },
    { label: 'Unidades', value: '2', hint: 'Administrativo e Mooca' },
    { label: 'Folgas na semana', value: '78', hint: '2 por colaborador' },
    { label: 'Cobertura mínima', value: 'OK', hint: 'Todos os dias atendidos' },
  ],
  coverageByDay: [
    { day: 'Seg', working: 25, highlight: false },
    { day: 'Ter', working: 26, highlight: false },
    { day: 'Qua', working: 27, highlight: true },
    { day: 'Qui', working: 24, highlight: false },
    { day: 'Sex', working: 23, highlight: false },
    { day: 'Sáb', working: 18, highlight: false },
  ],
  coverageRings: [
    { label: 'Segunda', percent: 96 },
    { label: 'Terça', percent: 92 },
    { label: 'Quarta', percent: 88 },
    { label: 'Quinta', percent: 94 },
    { label: 'Sexta', percent: 90 },
    { label: 'Sábado', percent: 76 },
  ],
  agenda: [
    { time: 'Seg', title: 'Jaciara Sousa Santos', detail: 'Folga rotativa · MOOCA', active: true },
    { time: 'Qua', title: 'Erika Ferreira', detail: 'Folga rotativa · MOOCA', active: false },
    { time: 'Qui', title: 'Aline Gomes Pereira', detail: 'Folga rotativa · MOOCA', active: false },
    {
      time: 'Sex',
      title: 'Agatha Karolyne Sgarbi',
      detail: 'Folga rotativa · MOOCA',
      active: false,
    },
  ],
  employees: [
    {
      registration: '1377',
      name: 'Agatha Karolyne Sgarbi da Silva',
      unit: 'MOOCA',
      restDays: 'Sex · Dom',
    },
    { registration: '667', name: 'Eliana Teodora Bernardes', unit: 'ADMIN', restDays: 'Sáb · Dom' },
    { registration: '1319', name: 'Jaciara Sousa Santos', unit: 'MOOCA', restDays: 'Seg · Dom' },
    {
      registration: '1255',
      name: 'Rivaldo Ribeiro Nascimento',
      unit: 'ADMIN',
      restDays: 'Sáb · Dom',
    },
  ],
  pending: [
    { title: 'Sábado cobre 18 pessoas — abaixo da média da semana', when: 'Revisar rotação' },
    { title: 'Erika pediu troca da folga de quarta para sexta', when: 'Aguardando decisão' },
  ],
};
