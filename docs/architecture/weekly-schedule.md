# Escala semanal (Fase 10)

A tela **Escala semanal** mostra a semana atual e as semanas futuras (padrão: 5 semanas,
o que cobre ao menos 1 mês a partir de hoje; também há 2 e 3 meses). Cada semana é uma
aba com a grade colaboradores × dias. Abaixo, a **Visão do período** resume a folga
rotativa de cada colaborador em cada semana. Dá para trocar a folga rotativa de um
colaborador em qualquer semana, revalidando a escala.

## Período e rotação contínua

- `PlanSchedule` (caso de uso) encadeia o `FairRotationScheduler`: cada semana usa o
  histórico das anteriores, então a rotação continua justa e não repete o dia da semana
  anterior.
- A semana 0 começa na segunda-feira da semana de hoje (`CalendarWeek.mondayOf`).
- **Trocar uma folga na semana N refaz as semanas N+1 em diante**, porque o histórico muda.
  As semanas anteriores ficam como estavam. Trocas manuais feitas depois da semana N são
  descartadas por esse motivo.
- O piso de cobertura salvo em Regras e cobertura vale para todas as semanas, inclusive
  depois de uma troca.

## Peças (MVVM)

- `ScheduleGateway` (porta) — `generate(weekCount)` e `moveRotatingRest(weekIndex, …)`. Devolve as linhas da grade e as violações das
  regras R1–R4. É assíncrona para poder ser trocada por IPC sem mudar o ViewModel.
- `LocalScheduleGateway` (adaptador) — lê o `EmployeeDirectory` local, roda o
  `PlanSchedule` com histórico vazio e valida com `defaultScheduleRules()`.
  Se receber um `CoverageSettingsStore`, aplica o piso salvo na tela de regras.
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

## Escala salva

A escala fica guardada em `localStorage` (`hora-rotativa.schedule`) pela porta
`ScheduleStore` (adaptador `LocalStorageScheduleStore`). O que é salvo: a equipe da época
(matrícula, nome, unidade) e, para cada semana, a segunda-feira e a folga rotativa de cada
colaborador, **inclusive as trocas manuais**.

- Ao abrir a tela, a escala salva é restaurada. Só na primeira vez (nada salvo) ela é gerada
  e salva, sem pedir confirmação, porque não há o que substituir.
- Gerar, trocar uma folga e estender o período são salvos na hora. O texto "Escala salva em …"
  mostra o último salvamento.
- Com o passar do tempo, as semanas passadas saem da tela e as que faltam são acrescentadas
  ao fim, continuando a rotação a partir do histórico (`PlanSchedule.extendPlan`). Estender
  não conta como edição: o horário "salva em" não muda.
- Se o cadastro de colaboradores mudar depois do salvamento, a tela avisa
  ("cadastro mudou") e continua mostrando a equipe salva até você gerar de novo.
- Um arquivo salvo inválido, ou que contradiga as regras (ex.: folga rotativa no domingo),
  é descartado por inteiro e a escala é gerada de novo.

## Confirmação antes de alterar

Nenhuma alteração acontece sem o "sim" do usuário. O `WeeklyScheduleViewModel` guarda a
mudança em `pending` e só executa em `confirm()`; `cancel()` descarta sem tocar na escala.

| Ação | Aviso |
|---|---|
| Gerar novamente | A escala atual é substituída e as trocas manuais salvas se perdem. Não dá para desfazer. |
| Mover a folga de um colaborador | Mostra nome, dia de origem e destino, a semana, e que as semanas seguintes serão refeitas. |

O diálogo abre com o foco em **Cancelar**. Mudar o período (1, 2 ou 3 meses) não pede
confirmação, porque só mostra mais ou menos semanas e nada salvo é alterado.
