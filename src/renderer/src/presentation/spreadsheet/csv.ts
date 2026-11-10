const BOM = '﻿';

/** Escolhe `;` quando a primeira linha tem mais `;` que `,` (planilhas em pt-BR). */
function detectDelimiter(text: string): ',' | ';' {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const semicolons = firstLine.split(';').length;
  const commas = firstLine.split(',').length;
  return semicolons > commas ? ';' : ',';
}

/** Lê CSV com aspas, quebras de linha dentro de campo, BOM e `,` ou `;` como separador. */
export function parseCsv(input: string): string[][] {
  const text = input.startsWith(BOM) ? input.slice(1) : input;
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  const endCell = (): void => {
    row.push(cell);
    cell = '';
  };
  const endRow = (): void => {
    endCell();
    rows.push(row);
    row = [];
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text.charAt(index);
    if (quoted) {
      if (char === '"' && text.charAt(index + 1) === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      endCell();
    } else if (char === '\n') {
      endRow();
    } else if (char !== '\r') {
      cell += char;
    }
  }
  if (cell !== '' || row.length > 0) {
    endRow();
  }
  return rows;
}

/** Monta uma linha CSV, protegendo campos com vírgula, aspas ou quebra de linha. */
export function formatCsvRow(cells: readonly string[], delimiter = ','): string {
  return cells
    .map((value) => (/[",;\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value))
    .join(delimiter);
}

/** Prefixo que faz o Excel reconhecer UTF-8 (acentos) ao abrir o arquivo. */
export const CSV_BOM = BOM;
