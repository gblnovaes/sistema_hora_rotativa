import { Box, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import type { ScheduleWeekView } from './scheduleGateway';
import { periodSummary } from './periodSummary';
import { DAY_LABEL, UNIT_LABEL } from './scheduleLabels';
import { weekRangeLabel } from './weekLabels';

interface PeriodOverviewProps {
  readonly weeks: readonly ScheduleWeekView[];
  readonly selectedIndex: number;
  readonly onSelectWeek: (index: number) => void;
}

function highlight(selected: boolean): { readonly bgcolor?: string } {
  return selected ? { bgcolor: 'action.selected' } : {};
}

/** Folga rotativa de cada colaborador ao longo do período. Clicar numa semana a abre. */
export function PeriodOverview({
  weeks,
  selectedIndex,
  onSelectWeek,
}: PeriodOverviewProps): JSX.Element {
  const rows = periodSummary(weeks);
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small" aria-label="Folga rotativa por colaborador em cada semana">
        <TableHead>
          <TableRow>
            <TableCell>Colaborador</TableCell>
            <TableCell>Unidade</TableCell>
            {weeks.map((week) => (
              <TableCell
                key={week.index}
                align="center"
                sx={highlight(week.index === selectedIndex)}
              >
                <Box
                  component="button"
                  type="button"
                  aria-label={`Abrir a semana ${weekRangeLabel(week.startDate)}`}
                  aria-current={week.index === selectedIndex ? 'true' : undefined}
                  onClick={() => onSelectWeek(week.index)}
                  sx={{
                    border: 0,
                    bgcolor: 'transparent',
                    font: 'inherit',
                    fontWeight: week.index === selectedIndex ? 700 : 500,
                    color: 'primary.main',
                    cursor: 'pointer',
                    '&:focus-visible': { outline: '2px solid', outlineOffset: 2 },
                  }}
                >
                  {weekRangeLabel(week.startDate)}
                </Box>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.registration} hover>
              <TableCell>{row.name}</TableCell>
              <TableCell>{UNIT_LABEL[row.unit]}</TableCell>
              {row.rests.map((rest, index) => (
                <TableCell
                  key={weeks[index]?.index ?? index}
                  align="center"
                  sx={highlight(index === selectedIndex)}
                >
                  {rest === undefined ? 'Sáb e Dom' : DAY_LABEL[rest]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
