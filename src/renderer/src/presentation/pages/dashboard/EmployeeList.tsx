import { Avatar, Box, Chip, Stack, Typography } from '@mui/material';
import { palette } from '@presentation/theme/tokens';
import type { EmployeeSummary } from './dashboardViewData';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

interface EmployeeListProps {
  readonly employees: readonly EmployeeSummary[];
}

/** Colaboradores em destaque, no estilo "Linked Teachers" do modelo. */
export function EmployeeList({ employees }: EmployeeListProps): JSX.Element {
  return (
    <Stack spacing={1.5}>
      {employees.map((employee) => (
        <Box key={employee.registration} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              bgcolor: palette.primary.light,
              color: palette.primary.dark,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {initials(employee.name)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography noWrap sx={{ fontSize: 13, fontWeight: 600 }}>
              {employee.name}
            </Typography>
            <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
              Matrícula {employee.registration} · Folga {employee.restDays}
            </Typography>
          </Box>
          <Chip
            label={employee.unit}
            size="small"
            sx={{ fontSize: 10, fontWeight: 600, bgcolor: palette.neutral[100] }}
          />
        </Box>
      ))}
    </Stack>
  );
}
