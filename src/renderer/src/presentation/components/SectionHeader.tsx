import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

interface SectionHeaderProps {
  readonly title: string;
  readonly action?: ReactNode;
}

/** Título de seção com uma ação opcional à direita (ex.: "Ver tudo"). */
export function SectionHeader({ title, action }: SectionHeaderProps): JSX.Element {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 2,
      }}
    >
      <Typography variant="h3" sx={{ fontSize: 16, fontWeight: 600 }}>
        {title}
      </Typography>
      {action}
    </Box>
  );
}
