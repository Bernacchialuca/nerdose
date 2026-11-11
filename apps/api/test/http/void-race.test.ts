import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { adminAuth, ADMIN_HEADERS, buildDbApp, MUTATION_HEADERS } from '../helpers/app';
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

type App = { request: (u: string, i?: RequestInit) => Response | Promise<Response> };
const NONE = { void_reason: 'x', culprit: { kind: 'none' } };
const voidCall = async (app: App, id: string) =>
  app.request(`/api/admin/challenges/${id}/void`, {
    method: 'POST',
    headers: { ...ADMIN_HEADERS, ...(await adminAuth()) },
    body: JSON.stringify(NONE),
  });
const seed = () =>
  dbs.insertChallenge({ gameId: 'devdle', date: '2026-12-01', number: 8, payload: PAYLOAD });

/** Espera hasta que haya una sesión bloqueada por un lock (condición observable, sin sleeps). */
async function waitForLockWait() {
  const deadline = performance.now() + 10_000;
  while (performance.now() < deadline) {
    const rows = await sql`SELECT 1 FROM pg_locks WHERE NOT granted`;
    if (rows.length > 0) return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error('La anulación nunca esperó el lock');
}

describe('carreras de la anulación', () => {
  it('TS-35 dos anulaciones simultáneas: una 200 y una 409', async () => {
    const c = await seed();
    const { app } = await buildDbApp(dbs);
    const results = await Promise.all([voidCall(app, c.id), voidCall(app, c.id)]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    const loser = results.find((r) => r.status === 409)!;
    expect(((await loser.json()) as { error: { code: string } }).error.code).toBe('not_voidable');
    const [row] = await sql`SELECT count(*)::int AS n FROM challenges WHERE status = 'voided'`;
    expect(row!.n).toBe(1);
  });

  it('TS-36 la anulación espera el FOR SHARE de una jugada y luego move da 409', async () => {
    const c = await seed();
    const player = await dbs.insertPlayer();
    const other = await dbs.insertPlayer();
    await dbs.insertPlay({
      playerId: player.id,
      challengeId: c.id,
      gameId: 'devdle',
      date: '2026-12-01',
      state: { guesses: [] },
    });
    const { app } = await buildDbApp(dbs);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    let locked!: () => void;
    const hasLock = new Promise<void>((resolve) => (locked = resolve));
    const holder = sql.begin(async (tx) => {
      await tx`SELECT 1 FROM challenges WHERE id = ${c.id} FOR SHARE`;
      locked();
      await gate;
    });
    await hasLock;
    const pending = voidCall(app, c.id);
    await waitForLockWait();
    release();
    await holder;
    const res = await pending;
    expect(res.status).toBe(200);
    expect(((await res.json()) as { affected_plays: number }).affected_plays).toBe(1);

    const move = await app.request('/api/games/devdle/today/move', {
      method: 'POST',
      headers: { ...MUTATION_HEADERS, Cookie: `nd_pid=${other.id}` },
      body: JSON.stringify({ challenge_number: 8, move: { guess: 'CACHE' } }),
    });
    expect(move.status).toBe(409);
    expect(((await move.json()) as { error: { code: string } }).error.code).toBe(
      'challenge_voided',
    );
    const [play] = await sql`SELECT status FROM plays WHERE player_id = ${player.id}`;
    expect(play!.status).toBe('voided');
    const [gs] =
      await sql`SELECT current_streak FROM player_game_stats WHERE player_id = ${player.id}`;
    expect(gs!.current_streak).toBe(1);
  });
});
