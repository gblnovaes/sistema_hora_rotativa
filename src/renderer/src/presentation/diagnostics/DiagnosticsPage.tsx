import { useEffect, useMemo } from 'react';
import { useStore } from 'zustand';
import { Alert, Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { SectionHeader } from '@presentation/components/SectionHeader';
import { SurfaceCard } from '@presentation/components/SurfaceCard';
import { sessionDiagnostics } from './SessionDiagnostics';
import { DiagnosticsViewModel } from './DiagnosticsViewModel';
import type { LevelFilter } from './DiagnosticsViewModel';

const LEVELS: readonly { readonly value: LevelFilter; readonly label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'info', label: 'Info' },
  { value: 'warn', label: 'Alerta' },
  { value: 'error', label: 'Erro' },
];

async function downloadPackage(viewModel: DiagnosticsViewModel): Promise<void> {
  const packaged = await viewModel.exportPackage();
  const blob = new Blob([JSON.stringify(packaged, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'diagnostico-hora-rotativa.json';
  anchor.click();
  URL.revokeObjectURL(url);
}

export function DiagnosticsPage(): JSX.Element {
  const viewModel = useMemo(() => new DiagnosticsViewModel(sessionDiagnostics), []);
  useEffect(() => {
    void viewModel.load();
  }, [viewModel]);

  const events = useStore(viewModel.store, (state) => state.events);
  const metrics = useStore(viewModel.store, (state) => state.metrics);
  const app = useStore(viewModel.store, (state) => state.app);
  const level = useStore(viewModel.store, (state) => state.level);
  const query = useStore(viewModel.store, (state) => state.query);

  const counters = Object.entries(metrics.counters);
  const timings = Object.entries(metrics.timings);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h2" component="h2">
          Diagnóstico
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Eventos e métricas desta sessão
          {app.version.length > 0 ? ` · ${app.name} ${app.version}` : ''}. O pacote exportado não
          leva nomes de colaboradores.
        </Typography>
      </Box>

      <SurfaceCard>
        <SectionHeader title="Métricas" />
        {counters.length === 0 && timings.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nenhuma métrica nesta sessão. Gere uma escala ou salve um cadastro para começar.
          </Typography>
        ) : (
          <Stack spacing={0.5}>
            {counters.map(([name, value]) => (
              <Typography key={name} variant="body2">
                {name}: {value}
              </Typography>
            ))}
            {timings.map(([name, series]) => (
              <Typography key={name} variant="body2">
                {name}: {series.join(' ms, ')} ms
              </Typography>
            ))}
          </Stack>
        )}
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeader
          title={`Eventos (${events.length})`}
          action={
            <Stack direction="row" spacing={1}>
              <Button onClick={() => void viewModel.load()}>Atualizar</Button>
              <Button variant="contained" onClick={() => void downloadPackage(viewModel)}>
                Exportar pacote
              </Button>
            </Stack>
          }
        />
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <TextField
            select
            label="Nível"
            size="small"
            value={level}
            onChange={(event) => viewModel.setLevel(event.target.value as LevelFilter)}
            sx={{ width: 140 }}
          >
            {LEVELS.map((item) => (
              <MenuItem key={item.value} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Filtrar mensagem"
            size="small"
            value={query}
            onChange={(event) => viewModel.setQuery(event.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
          />
        </Box>

        {events.length === 0 ? (
          <Alert severity="info">Nenhum evento com esse filtro.</Alert>
        ) : (
          <Stack spacing={1}>
            {events.map((event) => (
              <Box key={`${event.at}-${event.message}`}>
                <Typography variant="body2">
                  <strong>{event.level}</strong> · {event.at} · {event.message}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </SurfaceCard>
    </Stack>
  );
}
