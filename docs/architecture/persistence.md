# Persistência (SQLite)

O banco fica no processo main. A aplicação depende de **portas**; a infraestrutura traz os
**adaptadores** SQLite (better-sqlite3).

## Portas (aplicação)

- `EmployeeRepository` — `findAll`, `save`.
- `RotationHistoryRepository` — `load`, `append`. O histórico é **append-only**: cada semana
  registra as folgas rotativas e `load` reconstrói o `RotationHistory` reproduzindo os
  registros em ordem.
- `AuditTrail` — grava eventos (ex.: `schedule-generated`).

## Caso de uso

`GenerateWeeklySchedule` orquestra tudo:

1. carrega colaboradores e histórico;
2. roda o escalonador medindo o tempo (`measure`);
3. valida com as regras (R1–R4);
4. registra as folgas rotativas no histórico e grava o evento de auditoria;
5. tudo sob um `correlationId` nos logs.

## Esquema

| Tabela              | Papel                                                      |
| ------------------- | ---------------------------------------------------------- |
| `employees`         | matrícula (PK), nome, unidade                              |
| `rotation_rest`     | log append-only das folgas rotativas (registro + dia)      |
| `audit_event`       | eventos de auditoria, com payload em JSON                  |
| `schema_migrations` | controle das migrações aplicadas                           |

## Migrações

`runMigrations` aplica as migrações pendentes dentro de uma transação e é **idempotente**
(migrações já registradas são puladas). `openDatabase(filename)` liga as pragmas (`WAL`,
`foreign_keys`) e migra; use `:memory:` para um banco efêmero nos testes.

## Fronteira com o Electron

Os adaptadores SQLite rodam só no processo main. O renderer nunca toca o banco: fala com o
caso de uso pelo IPC tipado (Fase 8). No empacotamento, `better-sqlite3` é dependência nativa
e fica externa ao bundle.
