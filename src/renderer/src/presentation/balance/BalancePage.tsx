import { useEffect, useMemo, useState } from 'react';
import { useStore } from 'zustand';
import { Alert, Box, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { WEEK_DAYS, WeekDay } from '@domain/scheduling/WeekDay';
import { SectionHeader } from '@presentation/components/SectionHeader';
import { SurfaceCard } from '@presentation/components/SurfaceCard';
import { LocalStorageEmployeeDirectory } from '@presentation/employees/LocalStorageEmployeeDirectory';
import { LocalStorageCoverageSettings } from '@presentation/rules/LocalStorageCoverageSettings';
import { DAY_LABEL, UNIT_LABEL } from '@presentation/schedule/scheduleLabels';
import { palette } from '@presentation/theme/tokens';
import { LocalBalanceGateway } from './LocalBalanceGateway';
import { BalanceViewModel } from './BalanceViewModel';

const WEEK_OPTIONS = [4, 12, 24] as const;
const HEAT_DAYS = WEEK_DAYS.filter((day) => day !== WeekDay.Sunday);

function peakOf(rows: readonly { readonly counts: Readonly<Record<WeekDay, number>> }[]): number {
  let peak = 0;
  for (const row of rows) {
    for (const day of HEAT_DAYS) {
      peak = Math.max(peak, row.counts[day]);
    }
  }
  return peak;
}

export function BalancePage(): JSX.Element {
  const viewModel = useMemo(
    () =>
      new BalanceViewModel(
        new LocalBalanceGateway(
          new LocalStorageEmployeeDirectory(window.localStorage),
          new LocalStorageCoverageSettings(window.localStorage),
        ),
      ),
    [],
  );
  const [weeks, setWeeks] = useState<number>(12);

  useEffect(() => {
    void viewModel.load(weeks);
  }, [viewModel, weeks]);

  const rows = useStore(viewModel.store, (state) => state.rows);
  const maxSpread = useStore(viewModel.store, (state) => state.maxSpread);
  const loading = useStore(viewModel.store, (state) => state.loading);
  const error = useStore(viewModel.store, (state) => state.error);
  const peak = peakOf(rows);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h2" component="h2">
          Equilíbrio
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Folgas rotativas acumuladas em várias semanas, com o cadastro e o piso salvos neste
          computador. Domingo é folga fixa e não entra na conta.
        </Typography>
      </Box>

      <SurfaceCard>
        <SectionHeader
          title={loading ? 'Calculando…' : `Diferença máxima: ${maxSpread}`}
          action={
            <TextField
              select
              label="Semanas"
              size="small"
              value={weeks}
              onChange={(event) => setWeeks(Number(event.target.value))}
              sx={{ width: 120 }}
            >
              {WEEK_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          }
        />

        {error !== null && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {rows.length === 0 && !loading ? (
          <Typography variant="body2" color="text.secondary">
            Nenhum colaborador cadastrado. Inclua a equipe em Colaboradores para ver o equilíbrio.
          </Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Box
              component="table"
              aria-label="Folgas rotativas por colaborador e dia"
              sx={{
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: '6px',
                '& th, & td': { fontSize: 13, textAlign: 'center' },
                '& th': { fontWeight: 600, color: 'text.secondary' },
              }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Colaborador</th>
                  {HEAT_DAYS.map((day) => (
                    <th key={day}>{DAY_LABEL[day]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.registration}>
                    <td style={{ textAlign: 'left' }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{row.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {UNIT_LABEL[row.unit]}
                      </Typography>
                    </td>
                    {HEAT_DAYS.map((day) => {
                      const count = row.counts[day];
                      const strength = peak === 0 ? 0 : count / peak;
                      return (
                        <td key={day}>
                          <Box
                            aria-label={`${row.name}, ${DAY_LABEL[day]}: ${count} folgas rotativas`}
                            sx={{
                              minWidth: 44,
                              py: 1,
                              borderRadius: 1,
                              fontWeight: 700,
                              bgcolor:
                                count === 0
                                  ? palette.neutral[100]
                                  : alpha(palette.domain.rotatingRest, 0.25 + strength * 0.75),
                              color: palette.neutral[900],
                            }}
                          >
                            {count}
                          </Box>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </Box>
          </Box>
        )}
      </SurfaceCard>
    </Stack>
  );
}
