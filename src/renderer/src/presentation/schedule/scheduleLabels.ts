import { DayAssignment } from '@domain/scheduling/DayAssignment';
import { WeekDay } from '@domain/scheduling/WeekDay';
import { Unit } from '@domain/scheduling/Unit';
import { palette } from '@presentation/theme/tokens';

export const DAY_LABEL: Record<WeekDay, string> = {
  [WeekDay.Monday]: 'Seg',
  [WeekDay.Tuesday]: 'Ter',
  [WeekDay.Wednesday]: 'Qua',
  [WeekDay.Thursday]: 'Qui',
  [WeekDay.Friday]: 'Sex',
  [WeekDay.Saturday]: 'Sáb',
  [WeekDay.Sunday]: 'Dom',
};

export const UNIT_LABEL: Record<Unit, string> = {
  [Unit.Administrativo]: 'Administrativo',
  [Unit.Mooca]: 'Mooca',
};

const ASSIGNMENT: Record<
  DayAssignment,
  { readonly label: string; readonly background: string; readonly color: string }
> = {
  [DayAssignment.Work]: {
    label: 'Trabalho',
    background: palette.domain.work,
    color: palette.primary.contrast,
  },
  [DayAssignment.FixedRest]: {
    label: 'Fixa',
    background: palette.domain.fixedRest,
    color: palette.neutral[0],
  },
  [DayAssignment.RotatingRest]: {
    label: 'Rotativa',
    background: palette.domain.rotatingRest,
    color: palette.neutral[900],
  },
};

export function assignmentMeta(assignment: DayAssignment): {
  readonly label: string;
  readonly background: string;
  readonly color: string;
} {
  return ASSIGNMENT[assignment];
}

export function assignmentLegend(): readonly {
  readonly assignment: DayAssignment;
  readonly label: string;
}[] {
  return (Object.values(DayAssignment) as DayAssignment[]).map((assignment) => ({
    assignment,
    label: ASSIGNMENT[assignment].label,
  }));
}
