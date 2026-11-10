import { useEffect, useMemo } from 'react';
import { useStore } from 'zustand';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { SectionHeader } from '@presentation/components/SectionHeader';
import { SurfaceCard } from '@presentation/components/SurfaceCard';
import { LocalStorageEmployeeDirectory } from '@presentation/employees/LocalStorageEmployeeDirectory';
import { LocalStorageCoverageSettings } from '@presentation/rules/LocalStorageCoverageSettings';
import { sessionDiagnostics } from '@presentation/diagnostics/SessionDiagnostics';
import { LocalScheduleGateway } from './LocalScheduleGateway';
import { LocalStorageScheduleStore } from './LocalStorageScheduleStore';
import { confirmationCopy } from './confirmationCopy';
import {
  HORIZON_OPTIONS,
  WeeklyScheduleViewModel,
  type PendingChange,
} from './WeeklyScheduleViewModel';
import type { ScheduleWeekView } from './scheduleGateway';
import { PeriodOverview } from './PeriodOverview';
import { savedAtLabel, weekRangeLabel, weekTabLabel } from './weekLabels';
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
          new LocalStorageScheduleStore(window.localStorage),
        ),
        sessionDiagnostics,
      ),
    [],
  );
  useEffect(() => {
    void viewModel.load();
  }, [viewModel]);

  const weeks = useStore(viewModel.store, (state) => state.weeks);
  const selectedIndex = useStore(viewModel.store, (state) => state.selectedIndex);
  const horizonWeeks = useStore(viewModel.store, (state) => state.horizonWeeks);
  const savedAt = useStore(viewModel.store, (state) => state.savedAt);
  const outdated = useStore(viewModel.store, (state) => state.outdated);
  const pending = useStore(viewModel.store, (state) => state.pending);
  const selected = weeks[selectedIndex];
  const rows = selected?.rows ?? [];
  const violations = selected?.violations ?? [];
  const loading = useStore(viewModel.store, (state) => state.loading);
  const error = useStore(viewModel.store, (state) => state.error);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h2" component="h2">
          Escala semanal
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Semana atual e semanas futuras, geradas a partir do cadastro deste computador. Na Mooca,
          clique num dia de trabalho para levar a folga rotativa para lá. A escala fica salva neste
          computador e toda alteração pede a sua confirmação.
        </Typography>
      </Box>

      <SurfaceCard>
        <SectionHeader
          title={
            loading
              ? 'Gerando escala…'
              : selected === undefined
                ? 'Semana'
                : `Semana ${weekRangeLabel(selected.startDate)} (${rows.length})`
          }
          action={
            <Stack direction="row" spacing={2} alignItems="center">
              <ToggleButtonGroup
                size="small"
                exclusive
                value={horizonWeeks}
                disabled={loading}
                aria-label="Período planejado"
                onChange={(_, weeks: number | null) => {
                  if (weeks !== null) {
                    void viewModel.setHorizon(weeks);
                  }
                }}
              >
                {HORIZON_OPTIONS.map((option) => (
                  <ToggleButton key={option.weeks} value={option.weeks}>
                    {option.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <Button
                variant="contained"
                disabled={loading}
                onClick={() => void viewModel.requestRegenerate()}
              >
                Gerar novamente
              </Button>
            </Stack>
          }
        />

        {weeks.length > 0 && (
          <Tabs
            value={selectedIndex}
            onChange={(_, index: number) => viewModel.selectWeek(index)}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="Semanas do período"
            sx={{ mb: 2 }}
          >
            {weeks.map((week) => (
              <Tab
                key={week.index}
                value={week.index}
                label={weekTabLabel(week.index, week.startDate)}
              />
            ))}
          </Tabs>
        )}

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

        {savedAt !== null && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            {`Escala salva em ${savedAtLabel(savedAt)}.`}
          </Typography>
        )}
        {outdated && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            O cadastro de colaboradores mudou depois que esta escala foi salva. Use &ldquo;Gerar
            novamente&rdquo; para incluir as mudanças.
          </Alert>
        )}
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

        {rows.length === 0 && !loading && error === null ? (
          <Typography variant="body2" color="text.secondary">
            Nenhum colaborador cadastrado. Inclua a equipe em Colaboradores para gerar a escala.
          </Typography>
        ) : rows.length === 0 ? null : (
          <WeekGrid
            rows={rows}
            onMoveRest={(registration, day) => viewModel.requestMove(registration, day)}
          />
        )}
      </SurfaceCard>

      <ConfirmChange
        change={pending}
        weeks={weeks}
        onConfirm={() => void viewModel.confirm()}
        onCancel={() => viewModel.cancel()}
      />

      {weeks.length > 0 && rows.length > 0 && (
        <SurfaceCard>
          <SectionHeader title="Visão do período" />
          <PeriodOverview
            weeks={weeks}
            selectedIndex={selectedIndex}
            onSelectWeek={(index) => viewModel.selectWeek(index)}
          />
        </SurfaceCard>
      )}
    </Stack>
  );
}

interface ConfirmChangeProps {
  readonly change: PendingChange | null;
  readonly weeks: readonly ScheduleWeekView[];
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

/** Aviso antes de alterar a escala. O foco inicial fica em "Cancelar", a opção segura. */
function ConfirmChange({ change, weeks, onConfirm, onCancel }: ConfirmChangeProps): JSX.Element {
  const copy = change === null ? null : confirmationCopy(change, weeks);
  return (
    <Dialog
      open={copy !== null}
      onClose={onCancel}
      aria-labelledby="confirm-change-title"
      aria-describedby="confirm-change-body"
    >
      <DialogTitle id="confirm-change-title">{copy?.title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-change-body">{copy?.body}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={onConfirm}>
          {copy?.confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
