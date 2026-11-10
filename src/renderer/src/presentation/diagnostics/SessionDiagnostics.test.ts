import { describe, expect, it } from 'vitest';
import { Unit } from '@domain/scheduling/Unit';
import type { CoverageSettings, CoverageSettingsStore } from '@presentation/rules/coverageSettings';
import { SessionDiagnostics } from './SessionDiagnostics';

class FixedCoverage implements CoverageSettingsStore {
  load(): Promise<CoverageSettings> {
    return Promise.resolve({
      minimumByUnit: { [Unit.Administrativo]: 1, [Unit.Mooca]: 2 },
    });
  }
  save(): Promise<void> {
    return Promise.resolve();
  }
}

describe('SessionDiagnostics', () => {
  it('registra evento, contador e duração', () => {
    const clock = (): Date => new Date('2026-11-09T12:00:00.000Z');
    const session = new SessionDiagnostics(clock, () =>
      Promise.resolve({ name: 'app', version: '0.1.0' }),
    );

    session.record({ level: 'info', message: 'escala gerada', context: { rows: 2 } });
    session.increment('schedule.generate');
    session.timing('schedule.generate', 12);

    expect(session.events()).toEqual([
      {
        at: '2026-11-09T12:00:00.000Z',
        level: 'info',
        message: 'escala gerada',
        context: { rows: 2 },
      },
    ]);
    expect(session.metrics().counters['schedule.generate']).toBe(1);
    expect(session.metrics().timings['schedule.generate']).toEqual([12]);
  });

  it('descarta nome de pessoa e esquece o evento mais antigo', async () => {
    const session = new SessionDiagnostics(
      () => new Date('2026-11-09T12:00:00.000Z'),
      () => Promise.resolve({ name: 'app', version: '0.1.0' }),
      new FixedCoverage(),
      2,
    );

    session.record({ level: 'info', message: 'primeiro' });
    session.record({
      level: 'warn',
      message: 'segundo',
      context: { name: 'Ana', registration: '1' },
    });
    session.record({ level: 'error', message: 'terceiro' });

    expect(session.events().map((event) => event.message)).toEqual(['segundo', 'terceiro']);
    expect(session.events()[0]?.context).toEqual({ registration: '1' });

    const packaged = await session.exportPackage();
    expect(packaged.app).toEqual({ name: 'app', version: '0.1.0' });
    expect(packaged.coverage).toEqual({ [Unit.Administrativo]: 1, [Unit.Mooca]: 2 });
    expect(JSON.stringify(packaged)).not.toContain('Ana');
  });
});
