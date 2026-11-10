import { useMemo, useState } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { buildTheme } from './theme/theme';
import { AppShell, type PageKey } from './layout/AppShell';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { EmployeesPage } from './employees/EmployeesPage';
import { WeeklySchedulePage } from './schedule/WeeklySchedulePage';
import { RulesPage } from './rules/RulesPage';
import { BalancePage } from './balance/BalancePage';
import { DiagnosticsPage } from './diagnostics/DiagnosticsPage';

const PAGES: Record<PageKey, JSX.Element> = {
  dashboard: <DashboardPage />,
  employees: <EmployeesPage />,
  schedule: <WeeklySchedulePage />,
  rules: <RulesPage />,
  balance: <BalancePage />,
  diagnostics: <DiagnosticsPage />,
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
