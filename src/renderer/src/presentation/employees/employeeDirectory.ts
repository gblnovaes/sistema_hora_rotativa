import type { Unit } from '@domain/scheduling/Unit';

/** Colaborador como a tela de cadastro o manipula. */
export interface EmployeeRecord {
  readonly registration: string;
  readonly name: string;
  readonly unit: Unit;
}

/**
 * Porta do cadastro de colaboradores no renderer.
 *
 * Hoje é implementada sobre `localStorage`; amanhã pode ser trocada por uma que
 * fale com o processo main via IPC, sem mudar o ViewModel. Por isso é assíncrona.
 */
export interface EmployeeDirectory {
  list(): Promise<readonly EmployeeRecord[]>;
  /** Insere ou atualiza pelo número de matrícula. */
  save(record: EmployeeRecord): Promise<void>;
  remove(registration: string): Promise<void>;
}
