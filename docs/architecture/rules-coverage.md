# Regras e cobertura (Fase 12)

A tela **Regras e cobertura** mostra o que a escala já garante e deixa configurar o
piso de pessoas por dia.

## O que é fixo

- Regras R1–R5, no mesmo texto do domínio.
- Jornada calculada por `WorkShift`: dia útil 08:00–17:24 com 1h de almoço (8h24
  líquidas) e sábado da Mooca 08:00–14:00 sem almoço (6h).

Esses valores não são editáveis. A soma semanal da Mooca ainda depende de qual dia é a
folga rotativa (ver `docs/domain/regras-de-escala.md`).

## O que é configurável

- `CoverageSettingsStore` (porta) — `load` e `save` do piso por unidade.
- `LocalStorageCoverageSettings` — JSON no `localStorage`. Conteúdo inválido volta ao
  padrão: **1 pessoa** por unidade. `0` não restringe.
- `RulesViewModel` — valida o piso com `CoveragePolicy` antes de gravar. Um valor
  inválido não substitui o anterior.
- `RulesPage` — lista as regras, a jornada e o formulário do piso.

A geração da escala semanal lê a mesma porta. Com uma única pessoa na Mooca e piso 1,
não existe folga rotativa possível e a geração falha com erro explícito.
