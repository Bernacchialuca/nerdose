import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildDbApp, MUTATION_HEADERS } from '../helpers/app';
import { PAYLOAD, useDatabases } from '../helpers/db';

const dbs = useDatabases();
const sql = dbs.owner.sql;
beforeAll(() => dbs.reset());
beforeEach(async () => {
  await dbs.reset();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-12-01T10:00:00Z'));
});
afterEach(() => vi.useRealTimers());
afterAll(() => dbs.close());

type App = { request: (u: string, i?: RequestInit) => Response | Promise<Response> };
const call = (app: App, player: { id: string }, action: 'start' | 'move') =>
  app.request(`/api/games/devdle/today/${action}`, {
    method: 'POST',
    headers: { ...MUTATION_HEADERS, Cookie: `nd_pid=${player.id}` },
    body: JSON.stringify(
      action === 'start'
        ? { challenge_number: 8 }
        : { challenge_number: 8, move: { guess: 'CACHE' } },
    ),
  });
const VOIDED = { error: { code: 'challenge_voided', message: 'El desafío fue anulado.' } };
const plays = async () => (await sql`SELECT id FROM plays`).length;
const challenge = (status: 'published' | 'voided') =>
  dbs.insertChallenge({
    gameId: 'devdle',
    date: '2026-12-01',
    number: 8,
    payload: PAYLOAD,
    status,
    ...(status === 'voided' ? { voidReason: 'x', voidedAt: new Date('2026-12-01T09:00:00Z') } : {}),
  });
const voidInDb = () => sql`UPDATE challenges SET status='voided', void_reason='x', voided_at=now()`;

describe('start/move: anulación del desafío', () => {
  it('TS-30 cache anulada', async () => {
    await challenge('voided');
    const p = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    for (const a of ['start', 'move'] as const) {
      const res = await call(app, p, a);
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual(VOIDED);
    }
    expect(await plays()).toBe(0);
  });

  it('TS-31 cache vieja: anulado en la base después de cargar la cache', async () => {
    await challenge('published');
    const p = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    await app.request('/api/games/devdle/today');
    await voidInDb();
    for (const a of ['start', 'move'] as const) {
      const res = await call(app, p, a);
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual(VOIDED);
    }
    expect(await plays()).toBe(0);
  });

  it('TS-32 Play voided en move: challenge_voided y no game_finished', async () => {
    const c = await challenge('published');
    const p = await dbs.insertPlayer();
    await dbs.insertPlay({
      playerId: p.id,
      challengeId: c.id,
      gameId: 'devdle',
      date: '2026-12-01',
      state: { guesses: [] },
    });
    const { app } = await buildDbApp(dbs);
    await app.request('/api/games/devdle/today');
    await sql`UPDATE plays SET status='voided', finished_at=now()`;
    // Con la base todavía `published`, la Play voided manda.
    const res = await call(app, p, 'move');
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual(VOIDED);
    expect((await sql`SELECT state FROM plays`)[0]!.state).toEqual({ guesses: [] });
  });

  it('TS-33 anulación concurrente con una jugada: la jugada espera y falla', async () => {
    const c = await challenge('published');
    const p = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    await app.request('/api/games/devdle/today');
    let pending: Response | Promise<Response> | undefined;
    await sql.begin(async (tx) => {
      await tx`SELECT id FROM challenges WHERE id = ${c.id} FOR UPDATE`;
      pending = call(app, p, 'move');
      // Espera (sin sleeps fijos) a que la jugada quede bloqueada en el lock.
      for (let i = 0; i < 200; i++) {
        const [row] = await tx`SELECT count(*)::int AS n FROM pg_locks WHERE NOT granted`;
        if (row!.n > 0) break;
        await new Promise((r) => setImmediate(r));
      }
      await tx`UPDATE challenges SET status='voided', void_reason='x', voided_at=now() WHERE id = ${c.id}`;
    });
    const res = await pending!;
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual(VOIDED);
    expect(await plays()).toBe(0);
  });
});
