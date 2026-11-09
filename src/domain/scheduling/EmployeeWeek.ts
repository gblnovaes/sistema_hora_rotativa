import { DayAssignment, isRest } from './DayAssignment';
import type { Employee } from './Employee';
import { WEEK_DAYS, type WeekDay } from './WeekDay';

type WeekAssignments = Readonly<Record<WeekDay, DayAssignment>>;

/**
 * Semana de um colaborador: o que ele faz em cada dia, de segunda a domingo.
 *
 * É construída a partir da política da unidade mais a folga rotativa escolhida
 * (quando a unidade tem uma). A escolha de QUAL dia é a folga rotativa é do
 * escalonador; aqui ela chega pronta e é validada.
 */
export class EmployeeWeek {
  private constructor(
    public readonly employee: Employee,
    private readonly assignments: WeekAssignments,
  ) {}

  static create(employee: Employee, rotatingRestDay?: WeekDay): EmployeeWeek {
    const { rotatingRestCount, rotatingRestCandidates, fixedRestDays } = employee.policy;

    if (rotatingRestCount === 0 && rotatingRestDay !== undefined) {
      throw new Error(`Unidade ${employee.unit} não tem folga rotativa`);
    }
    if (rotatingRestCount > 0 && rotatingRestDay === undefined) {
      throw new Error(`Unidade ${employee.unit} exige uma folga rotativa`);
    }
    // Os candidatos já excluem os dias de folga fixa, então esta checagem também
    // barra uma folga rotativa caindo no domingo.
    if (rotatingRestDay !== undefined && !rotatingRestCandidates.includes(rotatingRestDay)) {
      throw new Error(`${rotatingRestDay} não é um dia válido para a folga rotativa`);
    }

    const entries = WEEK_DAYS.map((day): readonly [WeekDay, DayAssignment] => {
      if (fixedRestDays.includes(day)) {
        return [day, DayAssignment.FixedRest];
      }
      if (day === rotatingRestDay) {
        return [day, DayAssignment.RotatingRest];
      }
      return [day, DayAssignment.Work];
    });

    const assignments = Object.fromEntries(entries) as Record<WeekDay, DayAssignment>;
    return new EmployeeWeek(employee, assignments);
  }

  assignmentOf(day: WeekDay): DayAssignment {
    return this.assignments[day];
  }

  get restDays(): readonly WeekDay[] {
    return WEEK_DAYS.filter((day) => isRest(this.assignments[day]));
  }

  get workDays(): readonly WeekDay[] {
    return WEEK_DAYS.filter((day) => this.assignments[day] === DayAssignment.Work);
  }
}
