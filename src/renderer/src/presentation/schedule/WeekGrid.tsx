import { Box, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { DayAssignment } from '@domain/scheduling/DayAssignment';
import type { WeekDay } from '@domain/scheduling/WeekDay';
import type { ScheduleCell, ScheduleRow } from './scheduleGateway';
import { assignmentMeta, DAY_LABEL, UNIT_LABEL } from './scheduleLabels';

interface WeekGridProps {
  readonly rows: readonly ScheduleRow[];
  /** Clique num dia de trabalho de quem tem folga rotativa move essa folga para o dia. */
  readonly onMoveRest?: (registration: string, day: WeekDay) => void;
}

/** Grade colaboradores × dias. A cor acompanha um texto, nunca é o único sinal. */
export function WeekGrid({ rows, onMoveRest }: WeekGridProps): JSX.Element {
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small" aria-label="Escala semanal por colaborador e dia">
        <TableHead>
          <TableRow>
            <TableCell>Matrícula</TableCell>
            <TableCell>Nome</TableCell>
            <TableCell>Unidade</TableCell>
            {rows[0]?.days.map((cell) => (
              <TableCell key={cell.day} align="center">
                {DAY_LABEL[cell.day]}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.registration} hover>
              <TableCell>{row.registration}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{UNIT_LABEL[row.unit]}</TableCell>
              {row.days.map((cell) => (
                <AssignmentCell
                  key={cell.day}
                  registration={row.registration}
                  name={row.name}
                  cell={cell}
                  movable={row.days.some((day) => day.assignment === DayAssignment.RotatingRest)}
                  onMoveRest={onMoveRest}
                />
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

function AssignmentCell({
  registration,
  name,
  cell,
  movable,
  onMoveRest,
}: {
  readonly registration: string;
  readonly name: string;
  readonly cell: ScheduleCell;
  readonly movable: boolean;
  readonly onMoveRest: ((registration: string, day: WeekDay) => void) | undefined;
}): JSX.Element {
  const meta = assignmentMeta(cell.assignment);
  const canMove = movable && cell.assignment === DayAssignment.Work && onMoveRest !== undefined;
  const label = `${name}, ${DAY_LABEL[cell.day]}: ${meta.label}`;
  const sx = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
    px: 1,
    py: 0.5,
    borderRadius: 1,
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.4,
    bgcolor: meta.background,
    color: meta.color,
  } as const;

  return (
    <TableCell align="center" sx={{ px: 0.5 }}>
      {canMove ? (
        <Box
          component="button"
          type="button"
          aria-label={`Mover a folga rotativa de ${name} para ${DAY_LABEL[cell.day]}`}
          onClick={() => onMoveRest(registration, cell.day)}
          sx={{
            ...sx,
            border: 0,
            font: 'inherit',
            cursor: 'pointer',
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: 'primary.dark',
              outlineOffset: 2,
            },
          }}
        >
          {meta.label}
        </Box>
      ) : (
        <Box component="span" aria-label={label} sx={sx}>
          {meta.label}
        </Box>
      )}
    </TableCell>
  );
}
