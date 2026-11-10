import { PlanSchedule, type PlannedWeek } from '@application/scheduling/PlanSchedule';
import { SwapRotatingRest } from '@application/scheduling/SwapRotatingRest';
import { fromIsoDate, weekStarts, weeksBetween } from '@domain/scheduling/CalendarWeek';
import { CoveragePolicy } from '@domain/scheduling/CoveragePolicy';
import { Employee } from '@domain/scheduling/Employee';
import { EmployeeWeek } from '@domain/scheduling/EmployeeWeek';
import { FairRotationScheduler } from '@domain/scheduling/FairRotationScheduler';
import { defaultScheduleRules, ScheduleValidator } from '@domain/scheduling/ScheduleValidator';
import { WEEK_DAYS, type WeekDay } from '@domain/scheduling/WeekDay';
import type { EmployeeDirectory } from '@presentation/employees/employeeDirectory';
import type { CoverageSettingsStore } from '@presentation/rules/coverageSettings';
import type { GeneratedSchedule, ScheduleGateway, ScheduleRow } from './scheduleGateway';
import type { SavedEmployee, SavedSchedule, ScheduleStore } from './scheduleStore';

/** Plano completo em memória: todas as semanas salvas, inclusive as que já passaram. */
interface Session {
  readonly plan: readonly PlannedWeek[];
  /** Segunda-feira de cada semana de `plan`. */
  readonly starts: readonly string[];
  readonly employees: readonly SavedEmployee[];
  readonly savedAt: string;
}

/**
 * Planeja o período a partir do cadastro local e guarda a escala numa `ScheduleStore`.
 *
 * O histórico começa vazio na semana atual e avança semana a semana. Quando há um
 * `CoverageSettingsStore`, o piso salvo na tela de regras vira restrição rígida.
 * Toda alteração (gerar, trocar uma folga, estender o período) é salva na hora.
 */
export class LocalScheduleGateway implements ScheduleGateway {
  private readonly planner: PlanSchedule;
  private readonly validator = new ScheduleValidator(defaultScheduleRules());
  private session: Session | null = null;
  /** Quantas semanas a tela está mostrando (o horizonte pedido por último). */
  private weekCount = 0;

  constructor(
    private readonly directory: EmployeeDirectory,
    private readonly coverageSettings: CoverageSettingsStore | undefined,
    private readonly store: ScheduleStore,
    private readonly today: () => Date = () => new Date(),
  ) {
    this.planner = new PlanSchedule({
      scheduler: new FairRotationScheduler(),
      validator: this.validator,
      swap: new SwapRotatingRest({ validator: this.validator }),
    });
  }

  async load(weekCount: number): Promise<GeneratedSchedule | null> {
    const saved = await this.store.load();
    const restored = saved === null ? null : this.restore(saved);
    if (restored === null) {
      return null;
    }
    this.session = restored;
    this.weekCount = weekCount;

    // O tempo passou desde o último salvamento: acrescenta as semanas que faltam.
    const needed = this.offset(restored) + weekCount;
    if (restored.plan.length < needed) {
      const coverage = await this.coverage();
      const plan = this.planner.extendPlan({
        plan: restored.plan,
        weekCount: needed,
        ...(coverage === undefined ? {} : { coverage }),
      });
      // Estender não é uma edição: o horário de "salvo em" não muda.
      await this.persist(
        {
          ...restored,
          plan,
          starts: weekStarts(fromIsoDate(restored.starts[0] ?? ''), plan.length),
        },
        restored.savedAt,
      );
    }
    return this.present();
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
    this.weekCount = weekCount;
    await this.persist({
      plan,
      starts: weekStarts(this.today(), weekCount),
      employees: employees.map(toSavedEmployee),
      savedAt: '',
    });
    return this.present();
  }

  async moveRotatingRest(
    weekIndex: number,
    registration: string,
    day: WeekDay,
  ): Promise<GeneratedSchedule> {
    const session = this.session;
    if (session === null) {
      throw new Error('Gere a escala antes de trocar uma folga');
    }
    const coverage = await this.coverage();
    const plan = this.planner.swap({
      plan: session.plan,
      weekIndex: this.offset(session) + weekIndex,
      registration,
      day,
      ...(coverage === undefined ? {} : { coverage }),
    });
    await this.persist({ ...session, plan });
    return this.present();
  }

  private async persist(
    session: Session,
    savedAt: string = this.today().toISOString(),
  ): Promise<void> {
    const saved: SavedSchedule = {
      savedAt,
      employees: session.employees,
      weeks: session.plan.map((planned, index) => ({
        startDate: session.starts[index] ?? '',
        rests: Object.fromEntries(
          planned.weeks.map((week) => [
            week.employee.registration,
            week.rotatingRestDays[0] ?? null,
          ]),
        ),
      })),
    };
    await this.store.save(saved);
    this.session = { ...session, savedAt };
  }

  /** Reconstrói o plano salvo; um arquivo incoerente com as regras é descartado. */
  private restore(saved: SavedSchedule): Session | null {
    try {
      const employees = saved.employees.map((item) => Employee.create(item));
      const plan = saved.weeks.map((week): PlannedWeek => {
        const weeks = employees.map((employee) =>
          EmployeeWeek.create(employee, week.rests[employee.registration] ?? undefined),
        );
        return { weeks, violations: this.validator.validate(weeks) };
      });
      return {
        plan,
        starts: saved.weeks.map((week) => week.startDate),
        employees: saved.employees,
        savedAt: saved.savedAt,
      };
    } catch {
      return null;
    }
  }

  /** Quantas semanas do plano já ficaram para trás em relação à semana atual. */
  private offset(session: Session): number {
    const current = weekStarts(this.today(), 1)[0] ?? '';
    return Math.max(0, weeksBetween(session.starts[0] ?? current, current));
  }

  private async coverage(): Promise<CoveragePolicy | undefined> {
    if (this.coverageSettings === undefined) {
      return undefined;
    }
    const settings = await this.coverageSettings.load();
    return CoveragePolicy.perUnit({ ...settings.minimumByUnit });
  }

  private async present(): Promise<GeneratedSchedule> {
    const session = this.session;
    if (session === null) {
      throw new Error('Não há escala aberta');
    }
    const offset = this.offset(session);
    const records = await this.directory.list();
    return {
      weeks: session.plan.slice(offset, offset + this.weekCount).map((planned, index) => ({
        index,
        startDate: session.starts[offset + index] ?? '',
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
      savedAt: session.savedAt,
      outdated: signature(session.employees) !== signature(records.map(toSavedEmployee)),
    };
  }
}

function toSavedEmployee(source: {
  readonly registration: string;
  readonly name: string;
  readonly unit: SavedEmployee['unit'];
}): SavedEmployee {
  return { registration: source.registration, name: source.name, unit: source.unit };
}

/** Identifica a equipe (matrícula, nome e unidade), ignorando a ordem. */
function signature(employees: readonly SavedEmployee[]): string {
  return employees
    .map((item) => `${item.registration}|${item.name}|${item.unit}`)
    .sort()
    .join('\n');
}
