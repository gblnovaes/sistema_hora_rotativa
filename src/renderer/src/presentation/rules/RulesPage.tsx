import { useEffect, useMemo, useState } from 'react';
import { useStore } from 'zustand';
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { Unit } from '@domain/scheduling/Unit';
import { SectionHeader } from '@presentation/components/SectionHeader';
import { SurfaceCard } from '@presentation/components/SurfaceCard';
import { UNIT_LABEL } from '@presentation/schedule/scheduleLabels';
import { LocalStorageCoverageSettings } from './LocalStorageCoverageSettings';
import { RulesViewModel } from './RulesViewModel';

const UNITS = [Unit.Administrativo, Unit.Mooca] as const;

export function RulesPage(): JSX.Element {
  const viewModel = useMemo(
    () => new RulesViewModel(new LocalStorageCoverageSettings(window.localStorage)),
    [],
  );
  useEffect(() => {
    void viewModel.load();
  }, [viewModel]);

  const minimumByUnit = useStore(viewModel.store, (state) => state.minimumByUnit);
  const shifts = useStore(viewModel.store, (state) => state.shifts);
  const rules = useStore(viewModel.store, (state) => state.rules);
  const error = useStore(viewModel.store, (state) => state.error);
  const saved = useStore(viewModel.store, (state) => state.saved);

  const [draft, setDraft] = useState<Record<Unit, string>>({
    [Unit.Administrativo]: '1',
    [Unit.Mooca]: '1',
  });

  useEffect(() => {
    setDraft({
      [Unit.Administrativo]: String(minimumByUnit[Unit.Administrativo]),
      [Unit.Mooca]: String(minimumByUnit[Unit.Mooca]),
    });
  }, [minimumByUnit]);

  const submit = async (): Promise<void> => {
    const parsed = {} as Record<Unit, number>;
    for (const unit of UNITS) {
      const raw = draft[unit].trim();
      if (!/^\d+$/.test(raw)) {
        return;
      }
      parsed[unit] = Number(raw);
    }
    await viewModel.save({ minimumByUnit: parsed });
  };

  const draftInvalid = UNITS.some((unit) => !/^\d+$/.test(draft[unit].trim()));

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h2" component="h2">
          Regras e cobertura
        </Typography>
        <Typography variant="body2" color="text.secondary">
          As regras de folga e a jornada são fixas. O piso de cobertura entra na próxima geração da
          escala.
        </Typography>
      </Box>

      <SurfaceCard>
        <SectionHeader title="Regras da escala" />
        <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.5 }}>
          {rules.map((rule) => (
            <Typography key={rule.id} component="li" variant="body2">
              <strong>{rule.id}.</strong> {rule.text}
            </Typography>
          ))}
        </Stack>
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeader title="Jornada" />
        <Box
          component="table"
          sx={{
            width: '100%',
            borderCollapse: 'collapse',
            '& td, & th': { textAlign: 'left', py: 1, pr: 2, fontSize: 14 },
          }}
        >
          <thead>
            <tr>
              <th>Turno</th>
              <th>Horário</th>
              <th>Almoço</th>
              <th>Presença</th>
              <th>Líquido</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift) => (
              <tr key={shift.id}>
                <td>{shift.label}</td>
                <td>{shift.window}</td>
                <td>{shift.lunch}</td>
                <td>{shift.gross}</td>
                <td>{shift.net}</td>
              </tr>
            ))}
          </tbody>
        </Box>
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeader
          title="Cobertura mínima por dia"
          action={
            <Button variant="contained" disabled={draftInvalid} onClick={() => void submit()}>
              Salvar piso
            </Button>
          }
        />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Quantas pessoas precisam estar trabalhando em cada dia útil da unidade. 0 não restringe.
          Com uma só pessoa na Mooca, o piso 1 impede a folga rotativa — use 0 nesse caso.
        </Typography>
        {error !== null && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {saved && error === null && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Piso salvo. Gere a escala de novo para aplicá-lo.
          </Alert>
        )}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {UNITS.map((unit) => (
            <TextField
              key={unit}
              label={UNIT_LABEL[unit]}
              value={draft[unit]}
              onChange={(event) => setDraft({ ...draft, [unit]: event.target.value })}
              inputProps={{ inputMode: 'numeric', 'aria-label': `Piso ${UNIT_LABEL[unit]}` }}
              sx={{ width: 180 }}
            />
          ))}
        </Box>
      </SurfaceCard>
    </Stack>
  );
}
