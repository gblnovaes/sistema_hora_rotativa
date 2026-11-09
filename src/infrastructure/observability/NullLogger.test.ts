import { describe, expect, it } from 'vitest';
import { NullLogger } from './NullLogger';

describe('NullLogger', () => {
  it('não lança em nenhum nível', () => {
    const logger = new NullLogger();
    expect(() => {
      logger.debug('a');
      logger.info('b');
      logger.warn('c');
      logger.error('d');
    }).not.toThrow();
  });

  it('child devolve um logger utilizável', () => {
    const child = new NullLogger().child({ correlationId: 'x' });
    expect(() => child.info('ok')).not.toThrow();
  });
});
