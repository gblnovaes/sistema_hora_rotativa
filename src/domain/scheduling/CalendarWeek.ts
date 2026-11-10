/** Segunda-feira da semana (Seg–Dom) que contém a data, à meia-noite local. */
export function mondayOf(date: Date): Date {
  const offsetFromMonday = (date.getDay() + 6) % 7;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - offsetFromMonday);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Data local no formato `AAAA-MM-DD`. */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Lê uma data `AAAA-MM-DD` como data local. */
export function fromIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
}

/** Segundas-feiras de `count` semanas consecutivas, começando na semana de `reference`. */
export function weekStarts(reference: Date, count: number): readonly string[] {
  const first = mondayOf(reference);
  return Array.from({ length: count }, (_, index) => toIsoDate(addDays(first, index * 7)));
}
