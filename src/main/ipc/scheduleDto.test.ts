import { describe, expect, it } from 'vitest';
import { toScheduleDto } from './scheduleDto';
import type { GenerateWeeklyScheduleResult } from '@application/scheduling/GenerateWeeklySchedule';
import { Employee } from '@domain/scheduling/Employee';
import { EmployeeWeek } from '@domain/scheduling/EmployeeWeek';
import { Unit } from '@domain/scheduling/Unit';
import { WeekDay } from '@domain/scheduling/WeekDay';

describe('toScheduleDto', () => {
  it('converte semanas e violações em DTO serializável', () => {
    const admin = Employee.create({
      registration: '1315',
      name: 'Claudenilson',
      unit: Unit.Administrativo,
    });
    const result: GenerateWeeklyScheduleResult = {
      correlationId: 'corr-1',
      weeks: [EmployeeWeek.create(admin)],
      violations: [{ rule: 'two-rest-days-per-week', employee: '1315', message: 'erro' }],
    };

    const dto = toScheduleDto(result);

    expect(dto.correlationId).toBe('corr-1');
    expect(dto.weeks).toHaveLength(1);
    const [week] = dto.weeks;
    expect(week?.registration).toBe('1315');
    expect(week?.unit).toBe('ADMINISTRATIVO');
    expect(week?.days).toHaveLength(7);
    expect(week?.restDays).toEqual([WeekDay.Saturday, WeekDay.Sunday]);
    expect(dto.violations[0]?.rule).toBe('two-rest-days-per-week');
  });
});
