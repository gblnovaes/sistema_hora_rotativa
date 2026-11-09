import { Box, Paper, Stack, Typography } from '@mui/material';

/**
 * Placeholder do dashboard. As telas e KPIs reais entram nas fases 10+.
 * Serve para validar o shell, o tema e a ponte com o processo main.
 */
export function DashboardPage(): JSX.Element {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h2" component="h2">
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Distribuição de folgas entre colaboradores.
        </Typography>
      </Box>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="body1">
          Scaffold ativo. As telas de escala, colaboradores e equilíbrio serão construídas nas
          próximas fases.
        </Typography>
      </Paper>
    </Stack>
  );
}
