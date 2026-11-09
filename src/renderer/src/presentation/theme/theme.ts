import { createTheme, type Theme } from '@mui/material/styles';
import { palette, radius, spacing, typography } from './tokens';

type Mode = 'light' | 'dark';

/**
 * Constrói o tema MUI a partir dos design tokens.
 * Um único ponto de verdade para os dois modos (claro e escuro).
 */
export function buildTheme(mode: Mode): Theme {
  const isLight = mode === 'light';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: palette.primary.main,
        dark: palette.primary.dark,
        light: palette.primary.light,
      },
      success: { main: palette.semantic.success },
      warning: { main: palette.semantic.warning },
      error: { main: palette.semantic.error },
      info: { main: palette.semantic.info },
      background: {
        default: isLight ? palette.neutral[50] : palette.neutral[900],
        paper: isLight ? palette.neutral[0] : palette.neutral[700],
      },
      text: {
        primary: isLight ? palette.neutral[900] : palette.neutral[50],
        secondary: isLight ? palette.neutral[500] : palette.neutral[300],
      },
    },
    shape: { borderRadius: radius.md },
    spacing,
    typography: {
      fontFamily: typography.fontFamily,
      fontSize: typography.sizes.sm,
      h1: { fontSize: typography.sizes.xxl, fontWeight: 600 },
      h2: { fontSize: typography.sizes.xl, fontWeight: 600 },
      h3: { fontSize: typography.sizes.lg, fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 500 },
    },
  });
}
