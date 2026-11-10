import type { ScheduleWeekView } from './scheduleGateway';
import { DAY_LABEL } from './scheduleLabels';
import type { PendingChange } from './WeeklyScheduleViewModel';
import { weekRangeLabel } from './weekLabels';

export interface ConfirmationCopy {
  readonly title: string;
  readonly body: string;
  readonly confirmLabel: string;
}

/** Texto do aviso de confirmação: diz o que vai mudar e o que se perde. */
export function confirmationCopy(
  change: PendingChange,
  weeks: readonly ScheduleWeekView[],
): ConfirmationCopy {
  if (change.kind === 'regenerate') {
    return {
      title: 'Gerar uma nova escala?',
      body: 'A escala atual será substituída e todas as trocas manuais salvas serão perdidas. Não dá para desfazer.',
      confirmLabel: 'Gerar nova escala',
    };
  }

  const week = weeks[change.weekIndex];
  const range = week === undefined ? '' : ` na semana ${weekRangeLabel(week.startDate)}`;
  const movement =
    change.from === undefined ? 'vai para' : `passa de ${DAY_LABEL[change.from]} para`;
  return {
    title: `Mover a folga de ${change.name}?`,
    body: `A folga rotativa de ${change.name} ${movement} ${DAY_LABEL[change.to]}${range}. As semanas seguintes serão refeitas para manter a rotação justa, e trocas manuais que existam nelas serão perdidas. A alteração é salva na hora.`,
    confirmLabel: 'Mover folga',
  };
}
