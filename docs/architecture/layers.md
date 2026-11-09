# Camadas e regra de dependência

```
src/
  domain/            # entidades, objetos de valor, regras puras. Zero imports de outras camadas.
  application/       # casos de uso + portas (interfaces). Depende só de domain.
  infrastructure/    # adaptadores das portas: SQLite, logger, métricas. Depende de application.
  presentation/      # (renderer) Views React + ViewModels. Fala com application via IPC.
  main/              # composition root do Electron.
  preload/           # ponte IPC tipada.
  shared/            # contrato IPC (tipos/DTOs) compartilhado entre main e renderer.
```

## Regra de dependência

- `presentation → application → domain`
- `infrastructure → application → domain`
- `domain` não importa **nenhuma** outra camada.
- `renderer` nunca importa `infrastructure`, `main` ou `preload`.

A regra é verificada no CI por `npm run depcruise` (config em `.dependency-cruiser.cjs`).
Uma violação quebra o build.

## MVVM no renderer

- **Model**: entidades e casos de uso (`domain` + `application`).
- **ViewModel**: classe TypeScript com um store vanilla do Zustand (estado) e comandos como
  métodos. Não conhece React, DOM nem Electron. Testável sem renderizar.
- **View**: componente React que lê o estado com `useStore(viewModel.store, selector)` e
  dispara comandos. Sem regra de negócio.

## SOLID

- **S**: um caso de uso por arquivo, uma responsabilidade por validador.
- **O**: novas regras de escala são novas classes `ScheduleRule`, sem alterar o escalonador.
- **L/I**: portas pequenas e específicas (`EmployeeRepository`, `Logger`, `Clock`).
- **D**: casos de uso dependem de portas; os adaptadores são injetados no main.
