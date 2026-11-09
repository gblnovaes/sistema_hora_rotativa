# Regras de escala

Fonte: anotações manuscritas + planilha base `escala_trabalho_5x2_1.xlsx`
(período de exemplo: 08/11/2026 a 14/11/2026).

## Jornada 5x2

Cada colaborador trabalha **5 dias** e folga **2 dias** por semana. A coluna
"Total de folgas" da planilha confirma 2 folgas para todos.

## Unidades

A operação tem **duas unidades**, cada uma com uma política de folga própria.

### ADMINISTRATIVO (10 colaboradores)

- Folga fixa no **sábado e domingo**.
- Trabalha **segunda a sexta**, turno **08:00–17:24**.
- Com 1h de almoço: 8h24 líquidas/dia × 5 = **42h00 na semana**.

### MOOCA (29 colaboradores)

- Folga fixa no **domingo**.
- Mais **1 folga rotativa** entre segunda e sábado (varia por colaborador e semana).
- Turno de **segunda a sexta**: **08:00–17:24** (8h24 líquidas).
- Turno de **sábado**: **08:00–14:00** (jornada reduzida, 6h).

## Regras invariantes

| #   | Regra                                                                 |
| --- | --------------------------------------------------------------------- |
| R1  | Exatamente **2 folgas** por colaborador por semana.                   |
| R2  | ADMINISTRATIVO folga **sábado e domingo**.                            |
| R3  | MOOCA folga **domingo** + **1 dia rotativo** (seg–sáb).               |
| R4  | **Ninguém trabalha no domingo** (as duas unidades folgam).            |
| R5  | 1h de almoço por dia **não conta** na jornada líquida.                |

## Cálculo de horas (implementado)

- `Duration`: minutos inteiros (42h = 2520 min; 8h24 = 504 min).
- `WorkShift`: início, fim e almoço → presença bruta e trabalho líquido.
  - Dia útil 08:00–17:24, almoço 60 min → **504 min** (8h24).
  - Sábado 08:00–14:00, sem almoço → **360 min** (6h).

## Questão em aberto — jornada semanal no MOOCA

O sábado reduzido (6h) faz a soma semanal depender de **qual** é a folga rotativa:

- Folga rotativa no **sábado** (trabalha seg–sex): 5 × 8h24 = **42h00**.
- Folga rotativa num **dia útil** (trabalha 4 úteis + sábado): 4 × 8h24 + 6h = **39h36**.

Antes de tratar as 42h como restrição rígida, confirmar com a operação:

1. A meta é **42h líquidas exatas** por semana, ou **"5 dias de trabalho" (5x2)** com o
   sábado curto aceito mesmo abaixo de 42h?
2. No sábado, o almoço de 1h também não conta (tornando o líquido 5h), ou as 6h já são
   líquidas? A planilha sugere 6h diretas.

Enquanto não confirmado, a regra de horas semanais fica como **política configurável por
unidade**, não como invariante global.

## Modelo de domínio (implementado)

- `WeekDay` / `WEEK_DAYS` — os sete dias, em ordem; `WEEKDAYS` isola segunda a sexta.
- `DayAssignment` — `Work`, `FixedRest` ou `RotatingRest` (`isRest` cobre as duas folgas).
- `Unit` + `UnitPolicy` — política por unidade: folgas fixas, nº de folgas rotativas e os
  dias candidatos. Invariante: folgas fixas + rotativas = 2 por semana.
  - `ADMINISTRATIVO`: fixas sábado e domingo; 0 rotativas.
  - `MOOCA`: fixa domingo; 1 rotativa entre segunda e sábado.
- `Employee` — matrícula, nome e unidade; expõe a política da unidade.
- `EmployeeWeek` — monta a semana a partir da política mais a folga rotativa escolhida,
  valida (2 folgas, rotativa só em dia candidato) e expõe `restDays` e `workDays`.

A escolha de **qual** dia é a folga rotativa de cada colaborador é do escalonador (Fase 4);
o modelo apenas recebe e valida.
