import { describe, expect, it } from 'vitest';
import { formatCsvRow, parseCsv } from './csv';

describe('parseCsv', () => {
  it('lê linhas e campos simples, ignorando o BOM', () => {
    expect(parseCsv('﻿a,b,c\n1,2,3\n')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('aceita CRLF e a última linha sem quebra', () => {
    expect(parseCsv('a,b\r\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('lê campos entre aspas com vírgula, aspas duplas e quebra de linha', () => {
    expect(parseCsv('"Silva, Ana","diz ""oi""","l1\nl2"')).toEqual([
      ['Silva, Ana', 'diz "oi"', 'l1\nl2'],
    ]);
  });

  it('detecta ponto e vírgula como separador', () => {
    expect(parseCsv('Nº;Nome\n1;Ana, a Grande')).toEqual([
      ['Nº', 'Nome'],
      ['1', 'Ana, a Grande'],
    ]);
  });

  it('preserva campos vazios, inclusive vírgulas no fim da linha', () => {
    expect(parseCsv('a,,\n,,')).toEqual([
      ['a', '', ''],
      ['', '', ''],
    ]);
  });

  it('devolve vazio para texto vazio', () => {
    expect(parseCsv('')).toEqual([]);
  });
});

describe('formatCsvRow', () => {
  it('só coloca aspas quando o campo precisa', () => {
    expect(formatCsvRow(['a', 'Silva, Ana', 'diz "oi"', ''])).toBe('a,"Silva, Ana","diz ""oi""",');
  });

  it('volta ao mesmo conteúdo quando lido de novo', () => {
    const cells = ['Ana', 'a,b', 'x"y', 'l1\nl2', ''];
    expect(parseCsv(formatCsvRow(cells))).toEqual([cells]);
  });
});
