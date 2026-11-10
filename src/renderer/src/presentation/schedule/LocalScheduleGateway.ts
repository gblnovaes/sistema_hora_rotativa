import { SwapRotatingRest } from '@application/scheduling/SwapRotatingRest';
import { Employee } from '@domain/scheduling/Employee';
import type { EmployeeWeek } from '@domain/scheduling/EmployeeWeek';
import { FairRotationScheduler } from '@domain/scheduling/FairRotationScheduler';
import { RotationHistory } from '@domain/scheduling/RotationHistory';
import { defaultScheduleRules, ScheduleValidator } from '@domain/scheduling/ScheduleValidator';
import { WEEK_DAYS, type WeekDay } from '@domain/scheduling/WeekDay';
import type { EmployeeDirectory } from '@presentation/employees/employeeDirectory';
import type { GeneratedSchedule, ScheduleGateway, ScheduleRow } from './scheduleGateway';

/**
 * Gera a escala da primeira semana a partir do cadastro local.
 *
 * O histórico começa vazio: ainda não há semanas anteriores neste adaptador.
 * A cobertura mínima fica de fora até a tela de regras existir; sem ela o
 * escalonador só aplica justiça e as folgas fixas da unidade.
 */
export class LocalScheduleGateway implements ScheduleGateway {
  private readonly scheduler = new FairRotationScheduler();
  private readonly validator = new ScheduleValidator(defaultScheduleRules());
  private readonly swap = new SwapRotatingRest({ validator: this.validator });
  private weeks: readonly EmployeeWeek[] | null = null;

  constructor(private readonly directory: EmployeeDirectory) {}

  async generate(): Promise<GeneratedSchedule> {
    const records = await this.directory.list();
    const employees = records.map((record) => Employee.create(record));
    const generated = this.scheduler.generate(employees, RotationHistory.empty());
    this.weeks = generated.weeks;
    return this.present(generated.weeks);
  }

  moveRotatingRest(registration: string, day: WeekDay): Promise<GeneratedSchedule> {
    if (this.weeks === null) {
      return Promise.reject(new Error('Gere a escala antes de trocar uma folga'));
    }
    const result = this.swap.execute({ weeks: this.weeks, registration, day });
    this.weeks = result.weeks;
    return Promise.resolve(this.present(result.weeks, result.violations));
  }

  private present(
    weeks: readonly EmployeeWeek[],
    violations = this.validator.validate(weeks),
  ): GeneratedSchedule {
    const rows = weeks
      .map((week): ScheduleRow => {
        return {
          registration: week.employee.registration,
          name: week.employee.name,
          unit: week.employee.unit,
          days: WEEK_DAYS.map((day) => ({ day, assignment: week.assignmentOf(day) })),
        };
      })
      .sort((a, b) => a.registration.localeCompare(b.registration, undefined, { numeric: true }));

    return {
      rows,
      violations: violations.map((violation) => `${violation.employee}: ${violation.message}`),
    };
  }
}
