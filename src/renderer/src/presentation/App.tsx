import { useMemo, useState } from 'react';
import { CssBaseline, Stack, ThemeProvider, Typography } from '@mui/material';
import { buildTheme } from './theme/theme';
import { AppShell, type PageKey } from './layout/AppShell';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { EmployeesPage } from './employees/EmployeesPage';

function PlaceholderPage({ title }: { readonly title: string }): JSX.Element {
  return (
    <Stack spacing={1}>
      <Typography variant="h2" component="h2">
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Em construção.
      </Typography>
    </Stack>
  );
}

const PAGES: Record<PageKey, JSX.Element> = {
  dashboard: <DashboardPage />,
  employees: <EmployeesPage />,
  schedule: <PlaceholderPage title="Escala semanal" />,
  rules: <PlaceholderPage title="Regras e cobertura" />,
  balance: <PlaceholderPage title="Equilíbrio" />,
  diagnostics: <PlaceholderPage title="Diagnóstico" />,
};

export function App(): JSX.Element {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [page, setPage] = useState<PageKey>('dashboard');
  const theme = useMemo(() => buildTheme(mode), [mode]);

  const toggleMode = (): void => setMode((current) => (current === 'light' ? 'dark' : 'light'));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppShell mode={mode} onToggleMode={toggleMode} activePage={page} onNavigate={setPage}>
        {PAGES[page]}
      </AppShell>
    </ThemeProvider>
  );
}
