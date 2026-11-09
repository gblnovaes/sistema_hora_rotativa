import { useEffect, useMemo } from 'react';
import { useStore } from 'zustand';
import { Box, Link, Stack, Typography } from '@mui/material';
import { SurfaceCard } from '@presentation/components/SurfaceCard';
import { SectionHeader } from '@presentation/components/SectionHeader';
import { DashboardViewModel } from './DashboardViewModel';
import { GreetingCard } from './GreetingCard';
import { KpiTiles } from './KpiTiles';
import { CoverageBarChart } from './CoverageBarChart';
import { CoverageRings } from './CoverageRings';
import { AgendaPanel } from './AgendaPanel';
import { EmployeeList } from './EmployeeList';
import { PendingPanel } from './PendingPanel';

const seeAll = (
  <Link component="button" underline="hover" sx={{ fontSize: 12, color: 'primary.main' }}>
    Ver tudo
  </Link>
);

export function DashboardPage(): JSX.Element {
  const viewModel = useMemo(() => new DashboardViewModel(), []);
  useEffect(() => viewModel.initialize(), [viewModel]);
  const data = useStore(viewModel.store, (state) => state.data);

  if (!data) {
    return <Typography>Carregando…</Typography>;
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
        gap: 3,
        alignItems: 'start',
      }}
    >
      <Stack spacing={3}>
        <GreetingCard name={data.greetingName} summary={data.summary} />
        <KpiTiles tiles={data.kpis} />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr' },
            gap: 3,
            alignItems: 'start',
          }}
        >
          <SurfaceCard>
            <SectionHeader title="Cobertura por dia" action={<DayFilter />} />
            <CoverageBarChart bars={data.coverageByDay} />
          </SurfaceCard>
          <SurfaceCard>
            <SectionHeader title="Cobertura vs. mínimo" />
            <CoverageRings rings={data.coverageRings} />
          </SurfaceCard>
        </Box>

        <SurfaceCard>
          <SectionHeader title="Colaboradores em destaque" action={seeAll} />
          <EmployeeList employees={data.employees} />
        </SurfaceCard>
      </Stack>

      <Stack spacing={3}>
        <SurfaceCard>
          <SectionHeader title="Folgas da semana" action={seeAll} />
          <AgendaPanel items={data.agenda} />
        </SurfaceCard>
        <SurfaceCard>
          <SectionHeader title="Pendências" action={seeAll} />
          <PendingPanel items={data.pending} />
        </SurfaceCard>
      </Stack>
    </Box>
  );
}

function DayFilter(): JSX.Element {
  return (
    <Box
      sx={{
        fontSize: 12,
        color: 'text.secondary',
        border: 1,
        borderColor: 'divider',
        borderRadius: 999,
        px: 1.5,
        py: 0.25,
      }}
    >
      Esta semana
    </Box>
  );
}
