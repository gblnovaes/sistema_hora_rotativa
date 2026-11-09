/**
 * Design tokens do sistema. Fonte única de cores, espaçamento e tipografia.
 * As três cores de domínio (trabalho, folga fixa, folga rotativa) são usadas
 * na grade de escala e devem manter contraste AA sobre o fundo.
 */

export const palette = {
  neutral: {
    0: '#ffffff',
    50: '#f7f8fa',
    100: '#eef0f4',
    200: '#dde1e8',
    300: '#c3c9d4',
    500: '#6b7280',
    700: '#374151',
    900: '#111827',
  },
  primary: {
    main: '#2563eb',
    dark: '#1d4ed8',
    light: '#60a5fa',
  },
  semantic: {
    success: '#16a34a',
    warning: '#d97706',
    error: '#dc2626',
    info: '#0891b2',
  },
  domain: {
    work: '#2563eb',
    fixedRest: '#6b7280',
    rotatingRest: '#d97706',
  },
} as const;

export const spacing = 8;

export const radius = {
  sm: 4,
  md: 8,
} as const;

export const typography = {
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  sizes: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24, xxl: 32 },
} as const;
