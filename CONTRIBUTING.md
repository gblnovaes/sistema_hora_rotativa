# Guia de contribuição

## Fluxo de branches (Gitflow)

- `main` — produção. Recebe apenas merges de `release/*` e `hotfix/*`, com tag semântica.
- `develop` — integração. Base das features.
- `feature/<escopo>-<descricao>` — uma feature por branch, aberta a partir de `develop`.
- `release/x.y.z` — estabilização de versão.
- `hotfix/x.y.z` — correção urgente a partir de `main`.

## Commits (Conventional Commits)

Formato: `type(scope): subject` — em inglês, curto e sem ambiguidade.

- **Tipos**: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build`, `ci`, `perf`, `style`, `revert`.
- **Escopos**: `domain`, `application`, `infrastructure`, `presentation`, `main`, `preload`, `shared`, `ui`, `ci`, `deps`, `release`.
- **Uma feature por commit**, para mapear e reverter com facilidade.

Exemplo: `feat(domain): add weekly hours calculation`.

As regras são aplicadas pelo commitlint no hook `commit-msg`.

## TDD

1. Escreva o teste que falha.
2. Implemente o mínimo para passar.
3. Refatore mantendo o verde.

## Definition of Done

- Testes verdes (`npm run test`).
- `npm run verify` sem erros (format, lint, typecheck, dependency-cruiser, testes).
- Cobertura mínima: `domain` ≥ 95%, `application` ≥ 90%.
- Documentação atualizada quando a mudança afeta arquitetura, regras ou UI.

## Clean code

- Funções pequenas e nomes que revelam intenção.
- Sem `any`, sem números mágicos (use constantes nomeadas), sem comentário que repete o código.
- Erros tipados e tratados na borda certa.
