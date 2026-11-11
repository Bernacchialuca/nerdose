import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { adminAuth, ADMIN_HEADERS, buildDbApp } from '../helpers/app';
import { PAYLOAD, useDatabases } from '../helpers/db';

const dbs = useDatabases();
const sql = dbs.owner.sql;
beforeAll(() => dbs.reset());
beforeEach(async () => {
  await dbs.reset();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-12-01T12:00:00Z'));
});
afterEach(() => vi.useRealTimers());
afterAll(() => dbs.close());

describe('anulación con volumen', () => {
  it('TS-37 1.000 Play se anulan y recalculan en menos de 15 s', async () => {
    const c = await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-01',
      number: 8,
      payload: PAYLOAD,
    });
    await sql`INSERT INTO players (id) SELECT gen_random_uuid() FROM generate_series(1, 1000)`;
    await sql`
      INSERT INTO plays (player_id, challenge_id, game_id, date, state, status)
      SELECT id, ${c.id}, 'devdle', '2026-12-01', '{"guesses":[]}'::jsonb, 'in_progress' FROM players`;
    const { app, lines } = await buildDbApp(dbs);
    const started = performance.now();
    const res = await app.request(`/api/admin/challenges/${c.id}/void`, {
      method: 'POST',
      headers: { ...ADMIN_HEADERS, ...(await adminAuth()) },
      body: JSON.stringify({ void_reason: 'x', culprit: { kind: 'none' } }),
    });
    const elapsed = performance.now() - started;
    console.info(`void de 1000 Play: ${Math.round(elapsed)} ms`);
    expect(res.status).toBe(200);
    expect(((await res.json()) as { affected_plays: number }).affected_plays).toBe(1000);
    expect(elapsed).toBeLessThan(15_000);
    const [gs] = await sql`SELECT count(*)::int AS n FROM player_game_stats`;
    const [ps] = await sql`SELECT count(*)::int AS n FROM player_stats`;
    expect(gs!.n).toBe(1000);
    expect(ps!.n).toBe(1000);
    expect(lines().find((l) => l.event === 'StreaksUpdated')).toMatchObject({ players: 1000 });
  }, 60_000);
});
