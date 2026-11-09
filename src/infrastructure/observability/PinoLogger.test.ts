import { describe, expect, it } from 'vitest';
import type { DestinationStream } from 'pino';
import { PinoLogger } from './PinoLogger';

interface LogEntry {
  level: number;
  msg: string;
  correlationId?: string;
  unit?: string;
}

function capture(): { stream: DestinationStream; entries: () => LogEntry[] } {
  const lines: string[] = [];
  const stream: DestinationStream = {
    write: (chunk: string): void => {
      lines.push(chunk);
    },
  };
  return { stream, entries: () => lines.map((line) => JSON.parse(line) as LogEntry) };
}

describe('PinoLogger', () => {
  it('emite a mensagem e o contexto como JSON estruturado', () => {
    const { stream, entries } = capture();
    const logger = PinoLogger.create('debug', stream);

    logger.info('escala gerada', { unit: 'MOOCA' });

    const [entry] = entries();
    expect(entry?.msg).toBe('escala gerada');
    expect(entry?.level).toBe(30);
    expect(entry?.unit).toBe('MOOCA');
  });

  it('respeita o nível mínimo configurado', () => {
    const { stream, entries } = capture();
    const logger = PinoLogger.create('warn', stream);

    logger.info('isto não deve aparecer');
    logger.warn('isto deve aparecer');

    const logged = entries();
    expect(logged).toHaveLength(1);
    expect(logged[0]?.msg).toBe('isto deve aparecer');
    expect(logged[0]?.level).toBe(40);
  });

  it('o child carrega o correlationId em todas as entradas', () => {
    const { stream, entries } = capture();
    const logger = PinoLogger.create('debug', stream).child({ correlationId: 'abc-123' });

    logger.debug('passo 1');
    logger.error('passo 2 falhou');

    const logged = entries();
    expect(logged.every((entry) => entry.correlationId === 'abc-123')).toBe(true);
    expect(logged.map((entry) => entry.level)).toEqual([20, 50]);
  });
});
