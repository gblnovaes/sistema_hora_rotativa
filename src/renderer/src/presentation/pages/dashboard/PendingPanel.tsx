import { Box, Stack, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { palette } from '@presentation/theme/tokens';
import type { PendingItem } from './dashboardViewData';

interface PendingPanelProps {
  readonly items: readonly PendingItem[];
}

/** Pendências e alertas da escala, no estilo "Upcoming events" do modelo. */
export function PendingPanel({ items }: PendingPanelProps): JSX.Element {
  return (
    <Stack spacing={1.5}>
      {items.map((item) => (
        <Box key={item.title} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              bgcolor: palette.neutral[100],
              color: palette.semantic.warning,
              flexShrink: 0,
            }}
          >
            <WarningAmberIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>
              {item.title}
            </Typography>
            <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{item.when}</Typography>
          </Box>
        </Box>
      ))}
    </Stack>
  );
}
