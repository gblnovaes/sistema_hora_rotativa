import type { ReactNode } from 'react';
import { Paper, type SxProps, type Theme } from '@mui/material';

interface SurfaceCardProps {
  readonly children: ReactNode;
  readonly sx?: SxProps<Theme>;
}

/**
 * Card branco arredondado, base visual de todo o dashboard.
 * Sombra suave, sem borda dura, no espírito do modelo de referência.
 */
export function SurfaceCard({ children, sx }: SurfaceCardProps): JSX.Element {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2.5,
        p: 2.5,
        bgcolor: 'background.paper',
        boxShadow: '0 1px 3px rgba(34, 43, 69, 0.06), 0 8px 24px rgba(34, 43, 69, 0.05)',
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
}
