# Design System

Dashboard corporativo: sidebar fixa + topbar, grade de 8px, tipografia sóbria, foco em
densidade de informação e legibilidade. Tema claro e escuro.

A fonte única de verdade são os tokens em
`src/renderer/src/presentation/theme/tokens.ts`, consumidos pelo tema MUI em `theme.ts`.

## Tokens

- **Cores**: neutras (cinzas), primária (azul corporativo), semânticas (sucesso, alerta, erro,
  info) e três cores de domínio — **trabalho**, **folga fixa**, **folga rotativa**.
- **Tipografia**: Inter, escala 12/14/16/20/24/32.
- **Espaçamento**: base 8 (4/8/12/16/24/32). **Raio**: 4/8.

Contraste mínimo **WCAG AA**. A cor nunca é o único indicador: ícone ou texto acompanham.

## Componentes

Base MUI com tema próprio. Componentes de domínio planejados: `AppShell`, `KpiCard`,
`WeekGrid` (colaboradores × dias), `RestBadge`, `HeatmapEquilibrio`.

## Telas

1. Dashboard — KPIs e cobertura por dia.
2. Escala semanal — `WeekGrid`, gerar/regerar, troca manual com revalidação.
3. Colaboradores — CRUD e grupo (A/B).
4. Regras e cobertura — horas, almoço, cobertura mínima por dia.
5. Equilíbrio — heatmap de folgas por colaborador × dia.
6. Diagnóstico — logs, métricas e exportação.

## Acessibilidade

Navegação por teclado, foco visível, `aria-*` na grade de escala, contraste AA.
