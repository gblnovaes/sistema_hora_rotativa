import { useMemo, useState } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { buildTheme } from './theme/theme';
import { AppShell } from './layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';

export function App(): JSX.Element {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const theme = useMemo(() => buildTheme(mode), [mode]);

  const toggleMode = (): void => setMode((current) => (current === 'light' ? 'dark' : 'light'));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppShell mode={mode} onToggleMode={toggleMode}>
        <DashboardPage />
      </AppShell>
    </ThemeProvider>
  );
}
