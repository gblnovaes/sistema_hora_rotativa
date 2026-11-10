import { CoveragePolicy } from '@domain/scheduling/CoveragePolicy';
import { Employee } from '@domain/scheduling/Employee';
import { FairRotationScheduler } from '@domain/scheduling/FairRotationScheduler';
import { RotationHistory } from '@domain/scheduling/RotationHistory';
import { policyOf, type Unit } from '@domain/scheduling/Unit';
import { WEEK_DAYS, type WeekDay } from '@domain/scheduling/WeekDay';
import type { EmployeeDirectory } from '@presentation/employees/employeeDirectory';
import type { CoverageSettingsStore } from '@presentation/rules/coverageSettings';
import type { BalanceGateway, BalanceReport, BalanceRow } from './balanceGateway';

/**
 * Simula várias semanas com o escalonador justo e devolve a contagem de folgas
 * rotativas. Usa o piso de cobertura quando a porta é informada.
 */
export class LocalBalanceGateway implements BalanceGateway {
  private readonly scheduler = new FairRotationScheduler();

  constructor(
    private readonly directory: EmployeeDirectory,
    private readonly coverageSettings?: CoverageSettingsStore,
  ) {}

  async report(weeks: number): Promise<BalanceReport> {
    if (!Number.isInteger(weeks) || weeks < 1) {
      throw new RangeError('Informe ao menos 1 semana');
    }

    const records = await this.directory.list();
    const employees = records.map((record) => Employee.create(record));
    const coverage = await this.coverage();

    let history = RotationHistory.empty();
    for (let index = 0; index < weeks; index += 1) {
      history = this.scheduler.generate(employees, history, { coverage }).history;
    }

    const rows = employees
      .map((employee): BalanceRow => {
        const counts = {} as Record<WeekDay, number>;
        for (const day of WEEK_DAYS) {
          counts[day] = history.restCount(employee.registration, day);
        }
        return {
          registration: employee.registration,
          name: employee.name,
          unit: employee.unit,
          counts,
        };
      })
      .sort((a, b) => a.registration.localeCompare(b.registration, undefined, { numeric: true }));

    return { weeks, rows, maxSpread: spreadOf(rows) };
  }

  private async coverage(): Promise<CoveragePolicy | undefined> {
    if (this.coverageSettings === undefined) {
      return undefined;
    }
    const settings = await this.coverageSettings.load();
    return CoveragePolicy.perUnit({ ...settings.minimumByUnit });
  }
}

function spreadOf(rows: readonly BalanceRow[]): number {
  const byUnit = new Map<Unit, BalanceRow[]>();
  for (const row of rows) {
    if (policyOf(row.unit).rotatingRestCount === 0) {
      continue;
    }
    const group = byUnit.get(row.unit) ?? [];
    group.push(row);
    byUnit.set(row.unit, group);
  }

  let spread = 0;
  for (const [unit, group] of byUnit) {
    if (group.length < 2) {
      continue;
    }
    for (const day of policyOf(unit).rotatingRestCandidates) {
      const counts = group.map((row) => row.counts[day]);
      const highest = Math.max(...counts);
      const lowest = Math.min(...counts);
      spread = Math.max(spread, highest - lowest);
    }
  }
  return spread;
}
