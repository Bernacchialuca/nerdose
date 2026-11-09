import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { PublishingRepository } from '@/domain/publishing/publishing.repository';
import { PublishingService } from '@/domain/publishing/publishing.service';
import { games } from '@/games/registry';
import { TodayCache } from '@/infra/cache/today-cache';
import { systemClock } from '@/shared/clock';

import { buildDbApp, buildTestApp } from '../helpers/app';
import { PAYLOAD, useDatabases } from '../helpers/db';
import { captureLogger } from '../helpers/logger';

const dbs = useDatabases();
beforeAll(() => dbs.reset());
beforeEach(async () => {
  await dbs.reset();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-12-01T10:00:00Z'));
});
afterEach(() => vi.useRealTimers());
afterAll(() => dbs.close());

const statusOf = async (date: string) =>
  (await dbs.owner.sql`SELECT status FROM challenges WHERE date = ${date}`).map((r) => r.status);

describe('publicación perezosa del día', () => {
  it('TS-1 publica el approved de hoy en el primer request', async () => {
    const challenge = await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-01',
      number: 8,
      payload: PAYLOAD,
      status: 'approved',
    });
    const { app, lines } = await buildDbApp(dbs);
    const res = await app.request('/api/today');
    expect(res.status).toBe(200);
    expect(await statusOf('2026-12-01')).toEqual(['published']);
    const body = await res.json();
    expect(body.games[0]).toEqual({
      game_id: 'devdle',
      challenge_status: 'published',
      play_status: null,
      history_label: null,
      current_streak: 0,
    });
    expect(lines()).toContainEqual(
      expect.objectContaining({
        level: 'info',
        event: 'ChallengePublished',
        challenge_id: challenge.id,
        game_id: 'devdle',
        date: '2026-12-01',
        number: 8,
      }),
    );
  });

  it('TS-2 nunca publica fechas pasadas ni futuras', async () => {
    for (const date of ['2026-11-30', '2026-12-01', '2026-12-02']) {
      await dbs.insertChallenge({ gameId: 'devdle', date, status: 'approved' });
    }
    const { app } = await buildDbApp(dbs);
    await app.request('/api/today');
    expect(await statusOf('2026-12-01')).toEqual(['published']);
    expect(await statusOf('2026-11-30')).toEqual(['approved']);
    expect(await statusOf('2026-12-02')).toEqual(['approved']);
  });

  it('TS-6 falla de publicación: 500 y reintento', async () => {
    const real = new PublishingRepository(dbs.api.db);
    let n = 0;
    const repo = {
      publishApproved: async (day: string) => {
        n += 1;
        if (n === 1) throw new Error('db down');
        return real.publishApproved(day);
      },
    };
    const captured = captureLogger();
    const publishing = new PublishingService({
      repo,
      cache: new TodayCache(real),
      wordList: { reload: async () => undefined },
      terms: real,
      clock: systemClock,
      launchDate: '2026-11-24',
      logger: captured.logger,
      games,
      gameplay: { findPlaysOfDay: async () => [] },
      progress: { todayStreaks: async () => ({ byGame: {}, global: { current: 0, max: 0 } }) },
    });
    const { app } = buildTestApp({
      publishing,
      identity: dbs.identity(),
      logger: captured.logger,
    });
    const lines = captured.lines;
    const first = await app.request('/api/today');
    expect(first.status).toBe(500);
    expect(await first.json()).toEqual({
      error: { code: 'internal_error', message: 'Error interno del servidor.' },
    });
    expect(lines().some((l) => l.level === 'error')).toBe(true);
    const second = await app.request('/api/today');
    expect(second.status).toBe(200);
    expect(n).toBe(2);
  });

  it('no publica en /api/health ni /api/session', async () => {
    await dbs.insertChallenge({ gameId: 'devdle', date: '2026-12-01', status: 'approved' });
    const { app } = await buildDbApp(dbs);
    await app.request('/api/health');
    expect(await statusOf('2026-12-01')).toEqual(['approved']);
  });
});
