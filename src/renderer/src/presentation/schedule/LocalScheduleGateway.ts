import { PlanSchedule, type PlannedWeek } from '@application/scheduling/PlanSchedule';
import { SwapRotatingRest } from '@application/scheduling/SwapRotatingRest';
import { weekStarts } from '@domain/scheduling/CalendarWeek';
import { CoveragePolicy } from '@domain/scheduling/CoveragePolicy';
import { Employee } from '@domain/scheduling/Employee';
import { FairRotationScheduler } from '@domain/scheduling/FairRotationScheduler';
import { defaultScheduleRules, ScheduleValidator } from '@domain/scheduling/ScheduleValidator';
import { WEEK_DAYS, type WeekDay } from '@domain/scheduling/WeekDay';
import type { EmployeeDirectory } from '@presentation/employees/employeeDirectory';
import type { CoverageSettingsStore } from '@presentation/rules/coverageSettings';
import type { GeneratedSchedule, ScheduleGateway, ScheduleRow } from './scheduleGateway';

/**
 * Planeja o período a partir do cadastro local.
 *
 * O histórico começa vazio na semana atual e avança semana a semana. Quando há um
 * `CoverageSettingsStore`, o piso salvo na tela de regras vira restrição rígida.
 * Sem a porta, nada restringe a cobertura.
 */
export class LocalScheduleGateway implements ScheduleGateway {
  private readonly planner: PlanSchedule;
  private plan: readonly PlannedWeek[] | null = null;
  private starts: readonly string[] = [];

  constructor(
    private readonly directory: EmployeeDirectory,
    private readonly coverageSettings?: CoverageSettingsStore,
    private readonly today: () => Date = () => new Date(),
  ) {
    const validator = new ScheduleValidator(defaultScheduleRules());
    this.planner = new PlanSchedule({
      scheduler: new FairRotationScheduler(),
      validator,
      swap: new SwapRotatingRest({ validator }),
    });
  }

  async generate(weekCount: number): Promise<GeneratedSchedule> {
    const records = await this.directory.list();
    const employees = records.map((record) => Employee.create(record));
    const coverage = await this.coverage();
    const plan = this.planner.generate({
      employees,
      weekCount,
      ...(coverage === undefined ? {} : { coverage }),
    });
    this.plan = plan;
    this.starts = weekStarts(this.today(), weekCount);
    return this.present(plan);
  }

  async moveRotatingRest(
    weekIndex: number,
    registration: string,
    day: WeekDay,
  ): Promise<GeneratedSchedule> {
    if (this.plan === null) {
      throw new Error('Gere a escala antes de trocar uma folga');
    }
    const coverage = await this.coverage();
    const plan = this.planner.swap({
      plan: this.plan,
      weekIndex,
      registration,
      day,
      ...(coverage === undefined ? {} : { coverage }),
    });
    this.plan = plan;
    return this.present(plan);
  }

  private async coverage(): Promise<CoveragePolicy | undefined> {
    if (this.coverageSettings === undefined) {
      return undefined;
    }
    const settings = await this.coverageSettings.load();
    return CoveragePolicy.perUnit({ ...settings.minimumByUnit });
  }

  private present(plan: readonly PlannedWeek[]): GeneratedSchedule {
    return {
      weeks: plan.map((planned, index) => ({
        index,
        startDate: this.starts[index] ?? '',
        rows: planned.weeks
          .map((week): ScheduleRow => ({
            registration: week.employee.registration,
            name: week.employee.name,
            unit: week.employee.unit,
            days: WEEK_DAYS.map((day) => ({ day, assignment: week.assignmentOf(day) })),
          }))
          .sort((a, b) =>
            a.registration.localeCompare(b.registration, undefined, { numeric: true }),
          ),
        violations: planned.violations.map((item) => `${item.employee}: ${item.message}`),
      })),
    };
  }
}
