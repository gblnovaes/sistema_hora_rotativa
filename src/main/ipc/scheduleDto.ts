import type { GenerateWeeklyScheduleResult } from '@application/scheduling/GenerateWeeklySchedule';
import type { EmployeeWeek } from '@domain/scheduling/EmployeeWeek';
import { WEEK_DAYS } from '@domain/scheduling/WeekDay';
import type { EmployeeWeekDto, ScheduleDto } from '@shared/ipc';

function toWeekDto(week: EmployeeWeek): EmployeeWeekDto {
  return {
    registration: week.employee.registration,
    name: week.employee.name,
    unit: week.employee.unit,
    days: WEEK_DAYS.map((day) => ({ day, assignment: week.assignmentOf(day) })),
    restDays: [...week.restDays],
  };
}

/** Converte o resultado do caso de uso no DTO serializável do contrato IPC. */
export function toScheduleDto(result: GenerateWeeklyScheduleResult): ScheduleDto {
  return {
    correlationId: result.correlationId,
    weeks: result.weeks.map(toWeekDto),
    violations: result.violations.map((violation) => ({
      rule: violation.rule,
      employee: violation.employee,
      message: violation.message,
    })),
  };
}
