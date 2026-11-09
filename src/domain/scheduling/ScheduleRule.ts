import type { EmployeeWeek } from './EmployeeWeek';
import type { RuleViolation } from './RuleViolation';

/**
 * Regra de escala aplicada a uma semana de colaborador.
 *
 * Open/Closed: novas regras são novas implementações desta interface; o
 * validador não muda. Cada regra retorna as violações que encontrar (vazio = ok).
 */
export interface ScheduleRule {
  readonly name: string;
  validate(week: EmployeeWeek): readonly RuleViolation[];
}
