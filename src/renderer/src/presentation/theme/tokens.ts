/**
 * Design tokens do sistema. Fonte única de cores, espaçamento e tipografia.
 *
 * Paleta índigo baseada no dashboard de referência: sidebar índigo sólida,
 * fundo cinza muito claro, cards brancos arredondados, gráficos em gradiente índigo.
 * As três cores de domínio (trabalho, folga fixa, folga rotativa) são usadas na
 * grade de escala e mantêm contraste AA sobre o fundo.
 */

export const palette = {
  neutral: {
    0: '#ffffff',
    50: '#f5f6fa',
    100: '#eef0f6',
    200: '#e1e4ee',
    300: '#c7ccdb',
    500: '#8a94a6',
    700: '#3a4257',
    900: '#222b45',
  },
  primary: {
    main: '#5468d8',
    dark: '#3e54a0',
    light: '#8a9be8',
    contrast: '#ffffff',
  },
  /** Sidebar índigo sólida e seus estados. */
  brand: {
    sidebar: '#5b74d8',
    sidebarDeep: '#4a5fc0',
    onSidebar: '#ffffff',
    onSidebarMuted: 'rgba(255, 255, 255, 0.72)',
    activePillText: '#2a3356',
  },
  /** Gradiente vertical das barras e anéis de progresso. */
  chart: {
    gradientTop: '#6e86f0',
    gradientBottom: '#3e54a0',
    track: '#eef0f6',
  },
  semantic: {
    success: '#2fae78',
    warning: '#e8a13b',
    error: '#e2574c',
    info: '#4ba3c7',
  },
  domain: {
    work: '#5468d8',
    fixedRest: '#8a94a6',
    rotatingRest: '#e8a13b',
  },
} as const;

export const spacing = 8;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  sizes: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24, xxl: 32 },
} as const;
