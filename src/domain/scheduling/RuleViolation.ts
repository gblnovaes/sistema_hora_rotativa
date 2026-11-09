/**
 * Uma violação de regra encontrada em uma semana de colaborador.
 * `rule` identifica a regra; `employee` é a matrícula; `message` descreve o problema.
 */
export interface RuleViolation {
  readonly rule: string;
  readonly employee: string;
  readonly message: string;
}
