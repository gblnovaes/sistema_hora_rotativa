import { addDays, fromIsoDate } from '@domain/scheduling/CalendarWeek';

function dayMonth(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

/** Intervalo da semana (Seg–Dom), como `09/11 – 15/11`. */
export function weekRangeLabel(startDate: string): string {
  const start = fromIsoDate(startDate);
  return `${dayMonth(start)} – ${dayMonth(addDays(start, 6))}`;
}

/** Rótulo da aba: a semana atual leva esse nome; as demais, o intervalo de datas. */
export function weekTabLabel(index: number, startDate: string): string {
  return index === 0 ? `Atual · ${weekRangeLabel(startDate)}` : weekRangeLabel(startDate);
}

/** Quando a escala foi salva, como `10/11/2026 às 08:33`. */
export function savedAtLabel(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} às ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
