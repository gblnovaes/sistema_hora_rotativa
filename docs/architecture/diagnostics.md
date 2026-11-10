# Diagnóstico (Fase 13)

A tela **Diagnóstico** mostra o que aconteceu nesta sessão do renderer e exporta um
pacote sem dados pessoais.

## Peças (MVVM)

- `DiagnosticsSink` — `record`, `increment` e `timing`. As telas de escala, cadastro e
  regras registram ações (matrícula e números, nunca o nome).
- `SessionDiagnostics` — buffer circular de 200 eventos, contadores e durações. Na
  entrada, chaves `name` e `nome` são descartadas. `exportPackage` junta versão do app,
  piso de cobertura, métricas e eventos.
- `DiagnosticsViewModel` — filtra por nível e texto. A exportação ignora o filtro e leva
  a sessão inteira.
- `DiagnosticsPage` — métricas, lista filtrada, atualizar e baixar
  `diagnostico-hora-rotativa.json`.

## O que esta fase ainda não faz

Os logs do processo main (pino em arquivo) e o `snapshot()` de `InMemoryMetrics` continuam
no backend. A tela lê a sessão do renderer. Ligar as duas fontes é o passo seguinte, via IPC.
