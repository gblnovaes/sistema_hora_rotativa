import { Box, Button, Typography } from '@mui/material';
import { palette } from '@presentation/theme/tokens';

interface GreetingCardProps {
  readonly name: string;
  readonly summary: string;
}

/** Cabeçalho de boas-vindas, no lugar do "Hello Grace!" do modelo. */
export function GreetingCard({ name, summary }: GreetingCardProps): JSX.Element {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        borderRadius: 2.5,
        p: 3,
        color: palette.brand.onSidebar,
        background: `linear-gradient(120deg, ${palette.primary.main} 0%, ${palette.primary.dark} 100%)`,
        boxShadow: '0 10px 28px rgba(62, 84, 160, 0.3)',
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Typography variant="h2" sx={{ color: 'inherit', fontSize: 24, fontWeight: 700 }}>
          Olá, {name}!
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.85)', mt: 1, maxWidth: 420, fontSize: 14 }}>
          {summary}
        </Typography>
        <Button
          variant="contained"
          sx={{
            mt: 2.5,
            bgcolor: '#ffffff',
            color: palette.primary.dark,
            fontWeight: 600,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
          }}
        >
          Gerar escala da semana
        </Button>
      </Box>
      <WeekMotif />
    </Box>
  );
}

/** Motivo decorativo: uma semana 5x2 estilizada (5 dias cheios, 2 vazados). */
function WeekMotif(): JSX.Element {
  const days = [1, 1, 1, 1, 1, 0, 0];
  return (
    <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, pr: 1 }} aria-hidden>
      {days.map((filled, index) => (
        <Box
          key={index}
          sx={{
            width: 18,
            height: 56 + (index % 3) * 12,
            borderRadius: 1,
            bgcolor: filled ? 'rgba(255,255,255,0.9)' : 'transparent',
            border: '2px solid rgba(255,255,255,0.6)',
            alignSelf: 'flex-end',
          }}
        />
      ))}
    </Box>
  );
}
