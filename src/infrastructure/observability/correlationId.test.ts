import { describe, expect, it } from 'vitest';
import { newCorrelationId } from './correlationId';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('newCorrelationId', () => {
  it('gera um UUID válido', () => {
    expect(newCorrelationId()).toMatch(UUID);
  });

  it('gera ids diferentes a cada chamada', () => {
    expect(newCorrelationId()).not.toBe(newCorrelationId());
  });
});
