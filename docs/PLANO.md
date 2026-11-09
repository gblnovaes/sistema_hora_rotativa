# Sistema Hora Rotativa — Plano do Projeto

> Versão 0.2 — planejamento. Nenhum código foi escrito ainda.

## 1. Objetivo

Aplicativo desktop (Electron) que **distribui as folgas semanais entre colaboradores** de forma justa, respeitando as regras de escala, e mostra o resultado em um dashboard corporativo.

## 2. Regras de negócio (fonte: anotações manuscritas)

| # | Regra |
|---|-------|
| R1 | Todo colaborador tem **2 folgas por semana**. |
| R2 | **Grupo A**: folgas fixas no **sábado e domingo**. |
| R3 | **Grupo B** (demais): folga fixa no **domingo** + **1 folga rotativa** na semana. |
| R4 | Todos trabalham **42h semanais líquidas**, sem contar os dias de folga. |
| R5 | **1h de almoço por dia trabalhado não conta** nas 42h. |

### Cálculo derivado

- 7 dias − 2 folgas = **5 dias trabalhados**.
- 42h ÷ 5 = **8h24 líquidas/dia** (504 min).
- Presença diária com almoço = **9h24** (564 min).
- Horas sempre em **minutos inteiros** (42h = 2520 min). Nunca usar ponto flutuante.
- Grupo A trabalha de segunda a sexta. Grupo B trabalha 5 dos 6 dias de segunda a sábado.

### Implicações a confirmar

- Pelas regras, **ninguém trabalha aos domingos**. O estabelecimento fecha aos domingos?
- O sábado é coberto **apenas pelo Grupo B**. Cada folga rotativa no sábado reduz a equipe do dia.
- Conferir CLT, convenção coletiva e regras do setor sobre descanso semanal. Este plano não é parecer jurídico.

### Premissas adotadas (configuráveis, ajustáveis depois)

- Domingo fechado.
- Cobertura mínima por dia configurável (padrão: 1 pessoa).
- Todos no mesmo turno nesta primeira versão.
- Folga rotativa pode cair de segunda a sábado.

## 3. Stack e decisões

| Tema | Decisão |
|------|---------|
| Plataforma | Electron + TypeScript (`strict`) |
| Build | electron-vite (main, preload e renderer) + electron-builder para empacotar |
| UI | **React 18 + TypeScript** (decisão D1: React é o padrão para Electron nos meus projetos) |
| Componentes | **MUI (Material UI)** com tema próprio por tokens: biblioteca comum em dashboards corporativos |
| MVVM no React | ViewModels são **classes TypeScript puras** com estado observável (**MobX**); componentes são `observer` e só renderizam. Injeção por React Context (sem lógica de negócio nas views) |
| Testes de UI | Testing Library (componentes) + Vitest (ViewModels, sem DOM) |
| Persistência | SQLite (`better-sqlite3`) no processo main, atrás de portas (interfaces) |
| Testes | Vitest (unitários), fast-check (propriedades do escalonador), Playwright for Electron (smoke e2e, fase final) |
| Logs | pino, em JSON, com rotação de arquivo |
| Qualidade | ESLint (strict), Prettier, dependency-cruiser, commitlint, husky, lint-staged |
| Versionamento | Gitflow + Conventional Commits |

Cada decisão relevante vira um **ADR** em `docs/architecture/adr/`.

## 4. Arquitetura

### 4.1 Camadas (Clean Architecture)

```
src/
  domain/            # regras puras. Zero dependências externas.
  application/       # casos de uso + portas (interfaces)
  infrastructure/    # adaptadores: SQLite, logger, exportação, métricas
  presentation/      # renderer: Views + ViewModels (MVVM) + design system
  main/              # processo main do Electron = composition root
  preload/           # ponte IPC tipada (contextBridge)
  shared/            # contrato IPC (tipos/DTOs)
```

**Regra de dependência:** `presentation → application → domain`. `infrastructure → application`. O domínio não importa nada. A regra é aplicada por `dependency-cruiser` no CI e quebra o build se violada.

### 4.2 MVVM

- **Model**: entidades e casos de uso (domain e application).
- **ViewModel**: classe TypeScript com estado observável (MobX) e comandos (ex.: `EscalaSemanalViewModel`). Não conhece React, DOM nem Electron. Fala com o application via uma porta (`ScheduleGateway`).
- **View**: componente React `observer` que apenas renderiza o ViewModel e dispara comandos. Sem regra de negócio e sem `useEffect` com lógica.
- ViewModels são testados unitariamente sem renderizar nada.

### 4.3 Electron (segurança e fronteiras)

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
- O renderer **nunca** acessa SQLite nem filesystem. Tudo passa por IPC tipado, exposto no preload.
- Cada canal IPC valida o payload na borda (schema).
- CSP restritiva no HTML do renderer.
- O processo main monta o grafo de dependências (composition root) e injeta os adaptadores nos casos de uso.

### 4.4 SOLID aplicado

- **S**: um caso de uso por arquivo, uma responsabilidade por validador.
- **O**: novas regras de escala = novas classes implementando `ScheduleRule`, sem alterar o escalonador.
- **L/I**: portas pequenas e específicas (`EmployeeRepository`, `RotationHistoryRepository`, `Logger`, `Clock`).
- **D**: casos de uso dependem de portas; adaptadores são injetados.

## 5. Domínio

**Entidades e objetos de valor**
- `Employee` (id, nome, `RestGroup`: `FIXED_WEEKEND` | `FIXED_SUNDAY_PLUS_ROTATING`)
- `WeekDay` (SEG..DOM), `Week` (7 dias, cada um `WORK` | `FIXED_REST` | `ROTATING_REST`)
- `Duration` (minutos inteiros), `WorkRules` (2 folgas, 2520 min, almoço 60 min)
- `RotationHistory` (contador de folgas rotativas por colaborador e dia da semana)
- `CoveragePolicy` (mínimo de pessoas por dia da semana)

**Regras como classes (`ScheduleRule`)**
`TwoRestDaysPerWeek`, `FixedWeekendForGroupA`, `SundayRestForGroupB`, `WeeklyNetHoursEquals42`, `MinimumDailyCoverage`.

**Eventos de domínio** (alimentam auditoria e observabilidade)
`ScheduleGenerated`, `RestDayManuallyChanged`, `RuleViolationDetected`.

## 6. Algoritmo do escalonador

Função pura: `generate(employees, week, history, rules, coverage) → Schedule | Violations`

1. Aplica folgas fixas (Grupo A; domingo do Grupo B).
2. Para cada colaborador do Grupo B, escolhe o dia rotativo por:
   - menor contador histórico naquele dia;
   - sem repetir o dia da semana anterior;
   - respeitando a cobertura mínima do dia.
3. Em conflito, **backtracking** (as equipes são pequenas; solver pesado é desnecessário).
4. Valida o resultado com **todas** as `ScheduleRule`.
5. Atualiza o histórico.

**Propriedades testadas com fast-check**
- Toda escala válida tem exatamente 2 folgas por colaborador.
- Grupo A nunca trabalha no sábado ou domingo.
- Ninguém trabalha no domingo.
- Soma semanal líquida = 2520 min.
- Em N semanas, a diferença de folgas por dia entre colaboradores do mesmo grupo é ≤ 1 (equilíbrio).
- Mesma entrada = mesma saída (determinismo).

## 7. Observabilidade (alto nível)

| Pilar | Implementação |
|-------|---------------|
| **Logs estruturados** | Porta `Logger` na camada application; pino (JSON) no adaptador. Níveis `debug/info/warn/error`. Arquivo com rotação em `userData/logs`. |
| **Correlação** | Cada execução de caso de uso e cada chamada IPC recebe um `correlationId` que aparece em todos os logs, do renderer ao main. |
| **Métricas** | Porta `Metrics`: duração do escalonador, nº de backtracks, nº de violações, tempo de consultas SQLite, tempo de IPC. |
| **Auditoria** | Todo evento de domínio relevante é persistido (quem/quando/o quê mudou na escala). |
| **Erros** | Handlers para `uncaughtException`, `unhandledRejection`, `render-process-gone` e erro no renderer, todos registrados com contexto. |
| **Diagnóstico in-app** | Tela "Diagnóstico": visualizador de logs com filtro, métricas recentes e botão **exportar pacote de diagnóstico** (logs + versão + config sem dados sensíveis). |
| **Privacidade** | Redação de dados pessoais nos logs (nomes viram ids). |

Documentado em `docs/observability.md`: catálogo de eventos de log, métricas e como investigar um problema.

## 8. UI e Design System

Dashboard corporativo: sidebar fixa + topbar, grade 8 px, tipografia sóbria, foco em densidade de informação e legibilidade.

### 8.1 Tokens
- **Cores**: neutras (cinzas), primária (azul corporativo), semânticas (sucesso, alerta, erro, info) e três cores de domínio: **trabalho**, **folga fixa**, **folga rotativa**. Contraste mínimo **WCAG AA**.
- **Tipografia**: Inter (ou fonte do sistema), escala de 12/14/16/20/24/32.
- **Espaçamento**: 4/8/12/16/24/32. **Raio**: 4/8. **Elevação**: 3 níveis.
- **Temas**: claro e escuro, via variáveis CSS.

### 8.2 Componentes
`AppShell`, `Sidebar`, `PageHeader`, `KpiCard`, `DataTable`, `WeekGrid` (colaboradores × dias), `RestBadge`, `Button`, `TextField`, `Select`, `Dialog`, `Toast`, `EmptyState`, `Skeleton`, `HeatmapEquilibrio`.

### 8.3 Telas
1. **Dashboard**: KPIs (colaboradores, violações abertas, cobertura mínima atingida, índice de equilíbrio) + gráfico de cobertura por dia.
2. **Escala semanal**: `WeekGrid`, botão gerar/regerar, troca manual de folga com revalidação em tempo real.
3. **Colaboradores**: CRUD e grupo (A/B).
4. **Regras e cobertura**: horas, almoço, cobertura mínima por dia.
5. **Equilíbrio**: heatmap de folgas por colaborador × dia da semana.
6. **Diagnóstico**: logs, métricas, exportação.

Acessibilidade: navegação por teclado, foco visível, `aria-*` na grade, cor nunca como único indicador (ícone/texto junto).

Documentado em `docs/design-system/` (tokens, componentes, padrões, regras de uso).

## 9. Documentação

```
README.md                    # o que é, como rodar, como testar (sem ambiguidade)
CONTRIBUTING.md              # gitflow, commits, TDD, definition of done
CHANGELOG.md                 # gerado a partir dos commits
docs/
  PLANO.md                   # este documento
  domain/regras-de-escala.md # R1..R5, exemplos e casos-limite
  architecture/
    overview.md              # C4 (contexto, contêineres, componentes) em Mermaid
    layers.md                # regra de dependência e estrutura de pastas
    ipc.md                   # contrato main <-> renderer
    adr/0001-...md           # decisões (stack, SQLite, UI, etc.)
  design-system/             # tokens, componentes, padrões, telas
  observability.md
```

## 10. Qualidade e processo

- **TDD**: teste falhando → implementação mínima → refatoração. Um commit por feature.
- **Definition of Done**: testes verdes, lint e dependency-cruiser sem erro, cobertura mínima (domain ≥ 95%, application ≥ 90%), docs atualizadas.
- **Clean code**: funções pequenas, nomes que revelam intenção, sem comentários que repetem código, sem `any`, sem números mágicos (constantes nomeadas), erros tipados.
- **CI** (GitHub Actions): lint, typecheck, testes, dependency-cruiser e build.

### Gitflow

- Branches: `main` (produção), `develop`, `feature/<escopo>-<descricao>`, `release/x.y.z`, `hotfix/x.y.z`.
- Commits semânticos em inglês: `feat(domain): add weekly hours calculation`.
- Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build`, `ci`, `perf`.
- Tags semânticas por release (`v0.1.0`...).
- Merge de `feature/*` em `develop` via PR.

## 11. Roadmap

| Fase | Branch | Entrega | Commits principais |
|------|--------|---------|--------------------|
| 0 | `feature/project-scaffold` | Repo, electron-vite (React + TS), TS strict, lint, vitest, husky, commitlint, CI, README inicial | `chore: scaffold electron project` / `chore: add lint, format and commit hooks` / `ci: add pipeline` / `docs: add readme and contributing guide` |
| 1 | `feature/domain-hours` | `Duration`, `WorkRules`, cálculo 42h/8h24 | `feat(domain): add duration value object` / `feat(domain): add weekly hours calculation` |
| 2 | `feature/domain-model` | `Employee`, `Week`, grupos, tipos de folga | `feat(domain): add employee and rest groups` / `feat(domain): add week model` |
| 3 | `feature/schedule-rules` | Regras R1..R5 como classes | `feat(domain): add schedule rule validators` |
| 4 | `feature/fair-scheduler` | Escalonador com rotação justa e propriedades | `feat(application): add fair rotation scheduler` / `test(application): add scheduler property tests` |
| 5 | `feature/coverage-policy` | Cobertura mínima por dia | `feat(application): enforce minimum daily coverage` |
| 6 | `feature/observability-core` | Portas Logger/Metrics, pino, correlationId, handlers de erro | `feat(infra): add structured logger` / `feat(infra): add metrics port` |
| 7 | `feature/persistence` | SQLite, repositórios, migrações, auditoria | `feat(infra): add sqlite repositories` / `feat(infra): persist rotation history` |
| 8 | `feature/ipc-bridge` | Preload, contrato IPC tipado e validado | `feat(main): add typed ipc bridge` |
| 9 | `feature/design-system` | Tokens, tema, componentes base, docs do DS | `feat(ui): add design tokens and theme` / `feat(ui): add base components` |
| 10 | `feature/weekly-schedule-ui` | Tela Escala semanal + ViewModel | `feat(ui): add weekly schedule view` |
| 11 | `feature/manual-swap` | Troca manual com revalidação | `feat(application): allow manual rest swap with validation` |
| 12 | `feature/dashboard-employees` | Dashboard, Colaboradores, Regras, Equilíbrio | um commit por tela |
| 13 | `feature/diagnostics-screen` | Tela de Diagnóstico e exportação do pacote | `feat(ui): add diagnostics screen` |
| 14 | `release/0.1.0` | Smoke e2e, empacotamento, changelog, docs finais | `chore(release): 0.1.0` |

Cada fase começa pelos testes. Primeiros testes da Fase 1: "42h = 2520 min", "5 dias úteis dão 504 min por dia", "almoço de 60 min não entra no líquido".

## 12. Questões em aberto

| # | Pergunta | Impacta |
|---|----------|---------|
| D1 | ~~Angular ou Vue?~~ **Resolvido: React** (MUI + MobX para MVVM) | Fase 0, 9 |
| Q1 | Quantos colaboradores e quantos em cada grupo? | Dados de teste, Fase 4 |
| Q2 | O estabelecimento fecha aos domingos? | R3, cobertura |
| Q3 | Cobertura mínima por dia (principalmente sábado)? | Fase 5 |
| Q4 | Turnos iguais ou diferentes entre colaboradores? | Modelo de domínio |
| Q5 | A folga rotativa pode cair no sábado? Há dias proibidos? | Fase 4 |
| Q6 | Feriados, férias e atestados entram na v1? | Escopo |
| Q7 | Visão da escala: semanal, mensal ou ambas? Exportar PDF/Excel? | Fases 10, 12 |
