# Cadastro local no renderer (Fase 9)

Nesta fase o cadastro de colaboradores é **local**, persistido no `localStorage` do renderer.
Ainda **não** falamos com o backend SQLite do processo main — é uma decisão de MVP para ter o
cadastro funcionando ponta a ponta antes de integrar a persistência do main.

## Peças (MVVM)

- `EmployeeDirectory` (porta) — `list`, `save`, `remove`. É **assíncrona** de propósito: trocar
  o adaptador por um que fale com o main via IPC não muda o ViewModel.
- `LocalStorageEmployeeDirectory` (adaptador) — guarda os registros em JSON no `localStorage`,
  sob um `Storage` injetável (testável). Ignora conteúdo corrompido ou registros inválidos.
- `EmployeesViewModel` — comanda o cadastro pela porta, normaliza/valida com `Employee.create`
  do domínio (apara espaços, rejeita vazios) e expõe estado (`employees`, `loading`, `error`)
  num store Zustand.
- `EmployeesPage` — formulário de adicionar/editar e tabela, com a navegação pela sidebar.

## Próximo passo (integração)

Trocar `LocalStorageEmployeeDirectory` por um adaptador IPC que use o `EmployeeRepository`
SQLite do main (já pronto na Fase 7). O ViewModel e a tela não mudam. Opcionalmente, migrar os
registros já salvos no `localStorage` para o banco na primeira execução.
