# Escala semanal (Fase 10)

A tela **Escala semanal** mostra a grade colaboradores × dias da primeira semana
e permite trocar a folga rotativa de um colaborador, revalidando a escala.

## Peças (MVVM)

- `ScheduleGateway` (porta) — `generate()`. Devolve as linhas da grade e as violações das
  regras R1–R4. É assíncrona para poder ser trocada por IPC sem mudar o ViewModel.
- `LocalScheduleGateway` (adaptador) — lê o `EmployeeDirectory` local, roda o
  `FairRotationScheduler` com histórico vazio e valida com `defaultScheduleRules()`.
  Sem cobertura mínima: essa política ainda não tem tela.
- `WeeklyScheduleViewModel` — dispara a geração e expõe `rows`, `violations`, `loading` e
  `error`. Uma falha preserva a escala anterior.
- `SwapRotatingRest` (caso de uso) — move a folga rotativa para outro dia candidato,
  mantém as folgas fixas e revalida a escala. Unidade sem rotativa, colaborador ausente
  ou dia proibido (domingo) recusam a troca sem alterar a semana.
- `WeeklySchedulePage` + `WeekGrid` — legenda (trabalho, folga fixa, folga rotativa) e a
  grade. O texto da célula acompanha a cor. Um dia de trabalho de quem tem folga rotativa
  é um botão: o clique chama a troca. Gerar novamente descarta as trocas manuais.

## O que a grade mostra

- **Administrativo**: sábado e domingo como folga fixa; os outros dias são trabalho.
- **Mooca**: domingo como folga fixa e mais um dia rotativo, escolhido pelo escalonador.

Os colaboradores vêm do cadastro local (Fase 9). Quando o cadastro passar a falar com o
SQLite do processo main, só o adaptador muda.
