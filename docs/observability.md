# Observabilidade

Objetivo: entender o que o sistema faz e investigar um problema sem depurar às cegas.
As portas ficam na aplicação; os adaptadores, na infraestrutura.

## Portas (camada de aplicação)

| Porta     | Papel                                                        |
| --------- | ------------------------------------------------------------ |
| `Logger`  | log estruturado com níveis e contexto; `child` fixa contexto |
| `Metrics` | contadores (`increment`) e durações (`timing`)               |
| `Clock`   | tempo testável: `now` (timestamp) e `monotonic` (duração)    |

Helpers:

- `measure(clock, metrics, name, fn)` — mede a duração de `fn` e registra em `name`, mesmo
  que `fn` lance um erro.
- `reportError(logger, scope, error)` — formato único de erro, com escopo e stack.

## Adaptadores (camada de infraestrutura)

- `PinoLogger` — log em JSON (pino). `child({ correlationId })` carrega o id em todas as
  entradas da operação.
- `SystemClock` — `Date.now()` e `performance.now()`.
- `InMemoryMetrics` — acumula contadores e durações e expõe `snapshot()`; é a fonte da futura
  tela de Diagnóstico.
- `NullLogger` — no-op, padrão quando o log está desligado.
- `newCorrelationId()` — gera um UUID por operação.

## Correlação

Cada operação (uma ação do renderer, uma geração de escala) recebe um `correlationId` via
`newCorrelationId()`. Um `logger.child({ correlationId })` acompanha a operação do início ao
fim, ligando todas as entradas — do renderer ao main.

## Métricas previstas

`scheduler.generate` (duração), `schedule.violations` (contagem), tempo de IPC e de consultas
ao SQLite entram quando o caso de uso e a persistência existirem (Fases 7–8).

## O que falta (fases seguintes)

- Instrumentar o caso de uso de geração de escala (Fase 7) com `measure` e `correlationId`.
- Handlers de erro do processo main (`uncaughtException`, `unhandledRejection`,
  `render-process-gone`) chamando `reportError`, na composição do main.
- Tela de Diagnóstico lendo o `snapshot()` das métricas e os logs (Fase 13).
