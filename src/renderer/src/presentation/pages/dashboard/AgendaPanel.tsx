import { Box, Stack, Typography } from '@mui/material';
import { palette } from '@presentation/theme/tokens';
import type { AgendaItem } from './dashboardViewData';

interface AgendaPanelProps {
  readonly items: readonly AgendaItem[];
}

/** Folgas rotativas da semana, no estilo da agenda do modelo. */
export function AgendaPanel({ items }: AgendaPanelProps): JSX.Element {
  return (
    <Stack spacing={1.5}>
      {items.map((item) => (
        <Box
          key={`${item.time}-${item.title}`}
          sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}
        >
          <Typography sx={{ width: 34, fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
            {item.time}
          </Typography>
          <Box
            sx={{
              flex: 1,
              borderRadius: 2,
              px: 2,
              py: 1.25,
              bgcolor: item.active ? palette.primary.main : palette.neutral[100],
              color: item.active ? palette.brand.onSidebar : 'text.primary',
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item.title}</Typography>
            <Typography
              sx={{
                fontSize: 11,
                color: item.active ? 'rgba(255,255,255,0.8)' : 'text.secondary',
              }}
            >
              {item.detail}
            </Typography>
          </Box>
        </Box>
      ))}
    </Stack>
  );
}
