# Importar e exportar planilha

A página **Importar / Exportar** (menu lateral) lê e gera CSV no mesmo modelo da planilha
de escala base.

## Formato

```
ESCALA DE TRABALHO — JORNADA 5x2
Período de 09/11/2026 a 15/11/2026
(linha em branco)
Nº, Colaborador, Horário / Turno, Segunda … Domingo, Total de folgas
667, Eliana …, 08:00h as 17:24h, Trabalho … Folga, Folga, 2
```

- Separador `,` na exportação (como a base). A importação também aceita `;`, BOM e
  colunas fora de ordem: acha o cabeçalho pelos nomes.
- A exportação começa com BOM, para o Excel abrir os acentos corretamente.
- Folga fixa e folga rotativa saem como `Folga`. `Total de folgas` conta as folgas da linha.
- A semana vai de segunda a domingo (a base mostra 08/11–14/11; aqui o período é Seg–Dom).
- Várias semanas viram blocos separados por uma linha vazia.

## Importação

1. Escolher o arquivo mostra a lista do que seria importado, sem gravar nada.
2. A **unidade** sai das folgas de cada linha: sábado e domingo → Administrativo; domingo
   mais outro dia → Mooca. Padrões que não se encaixam viram avisos por linha. Dá para
   forçar a unidade de todos no seletor (necessário, por exemplo, para uma pessoa da Mooca
   cuja folga rotativa caiu no sábado).
3. Confirmar grava no cadastro. Quem já tem o mesmo Nº é atualizado, sem duplicar.
4. O **Horário / Turno** é guardado como texto no cadastro (`shift`) e volta na exportação.
5. A planilha não define a folga rotativa futura: ela é calculada pelo escalonador.

## Exportação

Gera a escala planejada a partir do cadastro (5 semanas): uma semana ou todas num arquivo.
Trocas manuais feitas na tela Escala semanal **não** entram na exportação.

## Peças

- `csv.ts` — leitor e escritor de CSV (aspas, quebras de linha, `,`/`;`, BOM).
- `scheduleCsv.ts` — `parseScheduleCsv` e `buildScheduleCsv`.
- `ImportExportViewModel` — preview, confirmação, exportação; usa as portas
  `EmployeeDirectory`, `ScheduleGateway` e `FileSaver`.
- `BrowserFileSaver` — entrega o arquivo como download.
