import { Box, Typography } from '@mui/material';
import { SurfaceCard } from '@presentation/components/SurfaceCard';
import type { KpiTile } from './dashboardViewData';

interface KpiTilesProps {
  readonly tiles: readonly KpiTile[];
}

/** Faixa de indicadores-chave. */
export function KpiTiles({ tiles }: KpiTilesProps): JSX.Element {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
      {tiles.map((tile) => (
        <SurfaceCard key={tile.label} sx={{ p: 2 }}>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{tile.label}</Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3 }}>
            {tile.value}
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{tile.hint}</Typography>
        </SurfaceCard>
      ))}
    </Box>
  );
}
