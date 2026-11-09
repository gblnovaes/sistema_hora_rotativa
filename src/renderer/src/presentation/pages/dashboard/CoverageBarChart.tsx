import { Box, Typography } from '@mui/material';
import { palette } from '@presentation/theme/tokens';
import type { CoverageBar } from './dashboardViewData';

const CHART_HEIGHT = 128;
const SCALE_MAX = 32;

interface CoverageBarChartProps {
  readonly bars: readonly CoverageBar[];
}

/**
 * Barras de cobertura por dia (colaboradores trabalhando). Gradiente índigo
 * vertical, valor acima e dia abaixo, no estilo do modelo de referência.
 */
export function CoverageBarChart({ bars }: CoverageBarChartProps): JSX.Element {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: CHART_HEIGHT, mt: 1 }}>
      {bars.map((bar) => {
        const height = Math.round((bar.working / SCALE_MAX) * CHART_HEIGHT);
        return (
          <Box
            key={bar.day}
            sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>
              {bar.working}
            </Typography>
            <Box
              sx={{
                width: '100%',
                maxWidth: 34,
                height,
                borderRadius: 1.5,
                background: `linear-gradient(180deg, ${palette.chart.gradientTop} 0%, ${palette.chart.gradientBottom} 100%)`,
                outline: bar.highlight ? `3px solid ${palette.primary.light}` : 'none',
                outlineOffset: 2,
              }}
            />
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{bar.day}</Typography>
          </Box>
        );
      })}
    </Box>
  );
}
