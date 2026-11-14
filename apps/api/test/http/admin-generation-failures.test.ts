import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { adminAuth, buildDbApp } from '../helpers/app';
import { useDatabases } from '../helpers/db';

const dbs = useDatabases();
beforeAll(() => dbs.reset());
beforeEach(async () => {
  await dbs.reset();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-12-01T10:00:00Z'));
});
afterEach(() => vi.useRealTimers());
afterAll(() => dbs.close());

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const get = async () => {
  const { app } = await buildDbApp(dbs);
  return app.request('/api/admin/generation-failures', { headers: await adminAuth() });
};
const fail = (
  gameId: 'devdle' | 'grep-grid' | 'timeline' | 'big-o',
  date: string,
  reason: string | null,
) => dbs.insertGenerationFailure({ gameId, date, attempts: 20, lastReason: reason });

describe('GET /api/admin/generation-failures', () => {
  it('TS-27 devuelve solo las fallas activas, ordenadas, sin payload', async () => {
    await fail('timeline', '2026-12-02', 'not_enough_facts');
    await fail('devdle', '2026-12-03', 'no_candidate');
    await fail('grep-grid', '2026-12-04', 'grid_unsolvable');
    await dbs.insertChallenge({ gameId: 'grep-grid', date: '2026-12-04', status: 'approved' });
    await fail('devdle', '2026-12-01', 'x');
    await fail('devdle', '2026-11-30', 'x');
    await fail('devdle', '2026-12-16', 'x');
    await fail('big-o', '2026-12-05', null);
    await dbs.insertChallenge({ gameId: 'big-o', date: '2026-12-05', status: 'rejected' });
    const res = await get();
    expect(res.status).toBe(200);
    const raw = await res.text();
    const body = JSON.parse(raw) as Json;
    expect(body.failures).toEqual([
      {
        game_id: 'timeline',
        date: '2026-12-02',
        attempts: 20,
        last_reason: 'not_enough_facts',
        updated_at: expect.stringMatching(/Z$/),
      },
      {
        game_id: 'devdle',
        date: '2026-12-03',
        attempts: 20,
        last_reason: 'no_candidate',
        updated_at: expect.stringMatching(/Z$/),
      },
      {
        game_id: 'big-o',
        date: '2026-12-05',
        attempts: 20,
        last_reason: null,
        updated_at: expect.stringMatching(/Z$/),
      },
    ]);
    expect(raw).not.toContain('"payload"');
  });

  it('TS-28 desempata por juego alfabéticamente', async () => {
    await fail('timeline', '2026-12-02', 'a');
    await fail('devdle', '2026-12-02', 'b');
    const body = (await (await get()).json()) as Json;
    expect(body.failures.map((f: Json) => f.game_id)).toEqual(['devdle', 'timeline']);
  });

  it('TS-29 sin fallas', async () => {
    const res = await get();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ failures: [] });
  });
});
