import { useEffect, useMemo } from 'react';
import { useStore } from 'zustand';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { SectionHeader } from '@presentation/components/SectionHeader';
import { SurfaceCard } from '@presentation/components/SurfaceCard';
import { LocalStorageEmployeeDirectory } from '@presentation/employees/LocalStorageEmployeeDirectory';
import { LocalStorageCoverageSettings } from '@presentation/rules/LocalStorageCoverageSettings';
import { LocalScheduleGateway } from './LocalScheduleGateway';
import { WeeklyScheduleViewModel } from './WeeklyScheduleViewModel';
import { assignmentLegend, assignmentMeta } from './scheduleLabels';
import { WeekGrid } from './WeekGrid';

const LEGEND = assignmentLegend();

export function WeeklySchedulePage(): JSX.Element {
  const viewModel = useMemo(
    () =>
      new WeeklyScheduleViewModel(
        new LocalScheduleGateway(
          new LocalStorageEmployeeDirectory(window.localStorage),
          new LocalStorageCoverageSettings(window.localStorage),
        ),
      ),
    [],
  );
  useEffect(() => {
    void viewModel.generate();
  }, [viewModel]);

  const rows = useStore(viewModel.store, (state) => state.rows);
  const violations = useStore(viewModel.store, (state) => state.violations);
  const loading = useStore(viewModel.store, (state) => state.loading);
  const error = useStore(viewModel.store, (state) => state.error);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h2" component="h2">
          Escala semanal
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Semana gerada a partir do cadastro deste computador. Na Mooca, clique num dia de trabalho
          para levar a folga rotativa para lá. Gerar novamente desfaz as trocas.
        </Typography>
      </Box>

      <SurfaceCard>
        <SectionHeader
          title={loading ? 'Gerando escala…' : `Semana (${rows.length})`}
          action={
            <Button
              variant="contained"
              disabled={loading}
              onClick={() => void viewModel.generate()}
            >
              Gerar novamente
            </Button>
          }
        />

        <Stack direction="row" spacing={1} sx={{ mb: 2 }} aria-label="Legenda da escala">
          {LEGEND.map((item) => {
            const style = assignmentMeta(item.assignment);
            return (
              <Box
                key={item.assignment}
                sx={{
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: 12,
                  fontWeight: 600,
                  bgcolor: style.background,
                  color: style.color,
                }}
              >
                {item.label}
              </Box>
            );
          })}
        </Stack>

        {error !== null && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {violations.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {violations.join(' ')}
          </Alert>
        )}

        {rows.length === 0 && !loading ? (
          <Typography variant="body2" color="text.secondary">
            Nenhum colaborador cadastrado. Inclua a equipe em Colaboradores para gerar a escala.
          </Typography>
        ) : (
          <WeekGrid
            rows={rows}
            onMoveRest={(registration, day) => void viewModel.moveRotatingRest(registration, day)}
          />
        )}
      </SurfaceCard>
    </Stack>
  );
}
