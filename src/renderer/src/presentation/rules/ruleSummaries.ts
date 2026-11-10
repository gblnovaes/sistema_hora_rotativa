export interface RuleSummary {
  readonly id: string;
  readonly text: string;
}

/** Texto das regras invariantes, na ordem em que o validador as aplica. */
export const RULE_SUMMARIES: readonly RuleSummary[] = [
  { id: 'R1', text: 'Cada colaborador tem exatamente 2 folgas na semana.' },
  { id: 'R2', text: 'Administrativo folga sábado e domingo.' },
  { id: 'R3', text: 'Mooca folga domingo e mais 1 dia rotativo, de segunda a sábado.' },
  { id: 'R4', text: 'Ninguém trabalha no domingo.' },
  { id: 'R5', text: '1h de almoço no dia útil não entra na jornada líquida.' },
];
