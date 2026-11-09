import { Box, Typography } from '@mui/material';
import { palette } from '@presentation/theme/tokens';
import type { CoverageRing } from './dashboardViewData';

const SIZE = 84;
const STROKE = 9;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function Ring({ label, percent }: CoverageRing): JSX.Element {
  const dash = (percent / 100) * CIRCUMFERENCE;
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <Box sx={{ position: 'relative', width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          role="img"
          aria-label={`${label}: ${percent}% de cobertura`}
        >
          <defs>
            <linearGradient id={`ring-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.chart.gradientTop} />
              <stop offset="100%" stopColor={palette.chart.gradientBottom} />
            </linearGradient>
          </defs>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={palette.chart.track}
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={`url(#ring-${label})`}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </svg>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{percent}%</Typography>
        </Box>
      </Box>
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{label}</Typography>
    </Box>
  );
}

interface CoverageRingsProps {
  readonly rings: readonly CoverageRing[];
}

/** Grade de anéis de cobertura por dia, no estilo "My visit" do modelo. */
export function CoverageRings({ rings }: CoverageRingsProps): JSX.Element {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        rowGap: 2.5,
        columnGap: 1,
        justifyItems: 'center',
      }}
    >
      {rings.map((ring) => (
        <Ring key={ring.label} {...ring} />
      ))}
    </Box>
  );
}
