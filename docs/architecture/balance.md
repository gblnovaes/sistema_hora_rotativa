# Equilíbrio (Fase 12)

A tela **Equilíbrio** mostra um heatmap de folgas rotativas por colaborador e dia da
semana, acumuladas em várias semanas simuladas.

## Peças (MVVM)

- `BalanceGateway` (porta) — `report(weeks)` devolve as contagens e a `maxSpread`: a
  maior diferença, no mesmo dia, entre colegas da mesma unidade que têm folga rotativa.
- `LocalBalanceGateway` (adaptador) — lê o cadastro local, aplica o piso de cobertura
  salvo (quando a porta existe) e roda o `FairRotationScheduler` semana a semana,
  carregando o `RotationHistory`. Domingo fica em zero: é folga fixa, não rotativa.
  O Administrativo também fica em zero, porque não tem folga rotativa.
- `BalanceViewModel` — dispara o relatório e expõe `rows`, `weeks`, `maxSpread`,
  `loading` e `error`. Uma falha preserva o relatório anterior.
- `BalancePage` — seletor de 4, 12 ou 24 semanas e a grade. O número aparece em cada
  célula; a cor só reforça a leitura.

## Leitura

Diferença 0 significa que, naquele horizonte, ninguém da mesma unidade folgou mais vezes
que o colega num mesmo dia. Um piso alto demais impede a simulação e a tela mostra o erro
do escalonador.
