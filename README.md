# Sistema Hora Rotativa

Aplicativo desktop (Electron) que **distribui as folgas semanais entre colaboradores** de forma justa, respeitando as regras de escala, e apresenta o resultado em um dashboard corporativo.

## Regras de negócio

| #   | Regra                                                                       |
| --- | --------------------------------------------------------------------------- |
| R1  | Todo colaborador tem **2 folgas por semana**.                               |
| R2  | **Grupo A**: folgas fixas no **sábado e domingo**.                          |
| R3  | **Grupo B**: folga fixa no **domingo** + **1 folga rotativa** na semana.    |
| R4  | Todos trabalham **42h semanais líquidas**, sem contar os dias de folga.     |
| R5  | **1h de almoço por dia trabalhado não conta** nas 42h.                      |

Derivado: 5 dias trabalhados → **8h24 líquidas/dia** (504 min), 9h24 de presença com almoço.

## Stack

- **Electron** + **TypeScript** (strict), build com **electron-vite** e empacotamento com electron-builder.
- **React 18** + **MUI** (Material UI) no renderer.
- **MVVM** com ViewModels em classes puras sobre stores vanilla do **Zustand**.
- **Clean Architecture**: `domain` → `application` → `infrastructure`/`presentation`.
- **SQLite** (processo main) atrás de portas; **pino** para logs estruturados.
- Testes com **Vitest**; qualidade com ESLint, Prettier e dependency-cruiser.

## Estrutura

```
src/
  domain/            # regras puras. Zero dependências externas.
  application/       # casos de uso + portas (interfaces)
  infrastructure/    # adaptadores: SQLite, logger, métricas
  presentation/      # (renderer) Views React + ViewModels (MVVM)
  main/              # processo main do Electron = composition root
  preload/           # ponte IPC tipada (contextBridge)
  shared/            # contrato IPC compartilhado
```

A regra de dependência é verificada no CI pelo dependency-cruiser.

## Comandos (Windows / PowerShell)

```powershell
npm install        # instala as dependências
npm run dev        # sobe o app em modo desenvolvimento
npm run test       # testes unitários
npm run verify     # format + lint + typecheck + depcruise + testes
npm run build      # typecheck + bundle de produção
```

## Documentação

- `docs/PLANO.md` — plano completo do projeto.
- `docs/architecture/` — visão de arquitetura, camadas e contrato IPC.
- `docs/design-system/` — tokens, componentes e padrões de UI.

## Licença

MIT.
