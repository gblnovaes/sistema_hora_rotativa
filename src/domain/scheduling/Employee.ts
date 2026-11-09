import { policyOf, type Unit, type UnitPolicy } from './Unit';

export interface EmployeeInput {
  readonly registration: string;
  readonly name: string;
  readonly unit: Unit;
}

/**
 * Colaborador: matrícula, nome e unidade. A política de folga vem da unidade,
 * não é guardada no colaborador (SOLID: unidade é a dona da regra).
 */
export class Employee {
  private constructor(
    public readonly registration: string,
    public readonly name: string,
    public readonly unit: Unit,
  ) {}

  static create(input: EmployeeInput): Employee {
    const registration = input.registration.trim();
    const name = input.name.trim();

    if (registration.length === 0) {
      throw new Error('Matrícula do colaborador é obrigatória');
    }
    if (name.length === 0) {
      throw new Error('Nome do colaborador é obrigatório');
    }

    return new Employee(registration, name, input.unit);
  }

  get policy(): UnitPolicy {
    return policyOf(this.unit);
  }
}
