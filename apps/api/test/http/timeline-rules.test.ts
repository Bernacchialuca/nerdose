import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildDbApp } from '../helpers/app';
import { useDatabases } from '../helpers/db';
import {
  CORRECT,
  SWAP,
  seedTimeline,
  seedTimelinePlay,
  tlGet,
  tlMove,
  tlPost,
} from '../helpers/timeline';

const dbs = useDatabases();
beforeAll(() => dbs.reset());
beforeEach(async () => {
  await dbs.reset();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-12-01T10:00:00Z'));
});
afterEach(() => vi.useRealTimers());
afterAll(() => dbs.close());

const sql = dbs.owner.sql;
const err = (code: string, message: string) => ({ error: { code, message } });
const GAME_FINISHED = err('game_finished', 'La partida ya terminó.');

async function seedFinished() {
  const challenge = await seedTimeline(dbs);
  const player = await dbs.insertPlayer();
  await seedTimelinePlay(
    dbs,
    challenge.id,
    player.id,
    { order: SWAP },
    {
      status: 'lost',
      score: 3,
      result: { win: false },
      finishedAt: new Date('2026-12-01T09:00:00Z'),
    },
  );
  return { player };
}

async function seedOpen() {
  const challenge = await seedTimeline(dbs);
  const player = await dbs.insertPlayer();
  await seedTimelinePlay(dbs, challenge.id, player.id, {});
  return { player };
}

describe('Timeline: partida terminada', () => {
  it('TS-26 jugada sobre Play terminada: 409 game_finished sin cambios', async () => {
    const { player } = await seedFinished();
    const { app } = await buildDbApp(dbs);
    const res = await tlMove(app, CORRECT, player);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual(GAME_FINISHED);
    expect((await sql`SELECT state, status, score FROM plays`)[0]).toMatchObject({
      state: { order: SWAP },
      status: 'lost',
      score: 3,
    });
    expect(await sql`SELECT 1 FROM player_game_stats`).toHaveLength(0);
    expect(await sql`SELECT 1 FROM player_stats`).toHaveLength(0);
  });

  it('TS-27 reintento de la confirmación', async () => {
    const { player } = await seedOpen();
    const { app } = await buildDbApp(dbs);
    expect((await tlMove(app, SWAP, player)).status).toBe(200);
    const again = await tlMove(app, SWAP, player);
    expect(again.status).toBe(409);
    expect(await again.json()).toEqual(GAME_FINISHED);
    expect((await sql`SELECT played FROM player_game_stats`)[0]!.played).toBe(1);
    expect((await sql`SELECT total_completed FROM player_stats`)[0]!.total_completed).toBe(1);
  });
});

describe('Timeline: concurrencia', () => {
  it('TS-28 dos pestañas confirman a la vez', async () => {
    const { player } = await seedOpen();
    const { app, lines } = await buildDbApp(dbs);
    const res = await Promise.all([tlMove(app, SWAP, player), tlMove(app, CORRECT, player)]);
    expect(res.map((r) => r.status).sort()).toEqual([200, 409]);
    const loser = res.find((r) => r.status === 409)!;
    expect(await loser.json()).toEqual(GAME_FINISHED);
    const ok = await res.find((r) => r.status === 200)!.json();
    const [p] = await sql`SELECT state, score FROM plays`;
    expect((p!.state as { order: string[] }).order).toEqual(ok.result.submitted_order);
    expect(p!.score).toBe(ok.result.score);
    const [gs] = await sql`SELECT played, extra FROM player_game_stats`;
    expect(gs!.played).toBe(1);
    expect(
      (gs!.extra as { by_category: Record<string, { played: number }> }).by_category
        .programming_languages!.played,
    ).toBe(3);
    expect((await sql`SELECT total_completed FROM player_stats`)[0]!.total_completed).toBe(1);
    expect(lines().filter((l) => l.event === 'PlayFinished')).toHaveLength(1);
  });

  it('TS-29 dos pestañas confirman a la vez sin Play previa', async () => {
    await seedTimeline(dbs);
    const player = await dbs.insertPlayer();
    const { app, lines } = await buildDbApp(dbs);
    const res = await Promise.all([tlMove(app, CORRECT, player), tlMove(app, CORRECT, player)]);
    expect(res.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(await sql`SELECT 1 FROM plays`).toHaveLength(1);
    expect(lines().filter((l) => l.event === 'PlayStarted')).toHaveLength(1);
    expect(lines().filter((l) => l.event === 'PlayFinished')).toHaveLength(1);
    expect((await sql`SELECT total_completed FROM player_stats`)[0]!.total_completed).toBe(1);
  });
});

describe('Timeline: reglas comunes', () => {
  it('TS-30 confirmación tardía tras las 00:00 UTC', async () => {
    const { player } = await seedOpen();
    vi.setSystemTime(new Date('2026-12-02T00:00:05Z'));
    const { app } = await buildDbApp(dbs);
    const res = await tlMove(app, SWAP, player);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual(err('challenge_expired', 'El desafío ya venció.'));
    expect((await sql`SELECT state, status FROM plays`)[0]).toMatchObject({
      status: 'in_progress',
      state: {},
    });
  });

  it('TS-31 challenge anulado', async () => {
    await seedTimeline(dbs, {
      status: 'voided',
      voidReason: 'wrong_answer',
      voidedAt: new Date('2026-12-01T09:00:00Z'),
    });
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const get = await tlGet(app, player);
    expect(get.status).toBe(200);
    expect(await get.json()).toMatchObject({
      challenge_status: 'voided',
      public_view: null,
      play: null,
      result: null,
      game_stats: null,
    });
    const voided = err('challenge_voided', 'El desafío fue anulado.');
    const start = await tlPost(app, 'start', { challenge_number: 8 }, player);
    expect(start.status).toBe(409);
    expect(await start.json()).toEqual(voided);
    const move = await tlMove(app, SWAP, player);
    expect(move.status).toBe(409);
    expect(await move.json()).toEqual(voided);
    expect(await sql`SELECT 1 FROM plays`).toHaveLength(0);
    const home = await (
      await app.request('/api/today', { headers: { Cookie: `nd_pid=${player.id}` } })
    ).json();
    expect(home.games[2].challenge_status).toBe('voided');
  });

  it('TS-32 sin sesión', async () => {
    await seedTimeline(dbs);
    const { app } = await buildDbApp(dbs);
    const ghost = { id: '11111111-1111-4111-8111-111111111111' };
    for (const player of [undefined, ghost]) {
      for (const res of [
        await tlPost(app, 'start', { challenge_number: 8 }, player),
        await tlMove(app, SWAP, player),
      ]) {
        expect(res.status).toBe(401);
        expect(await res.json()).toEqual(err('no_session', 'No hay una sesión activa.'));
      }
    }
    expect(await sql`SELECT 1 FROM plays`).toHaveLength(0);
  });

  it('TS-33 sin desafío de hoy en move', async () => {
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const res = await tlMove(app, SWAP, player);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual(err('no_challenge_today', 'No hay desafío para hoy.'));
  });

  it('TS-34 61 jugadas por minuto: la 61.ª es 429', async () => {
    const { player } = await seedOpen();
    const { app } = await buildDbApp(dbs);
    const invalid = err('invalid_move', 'Jugada inválida.');
    for (let i = 0; i < 60; i++) {
      const res = await tlMove(app, ['p7k2m9'], player);
      expect(res.status).toBe(422);
      expect(await res.json()).toEqual(invalid);
    }
    const limited = await tlMove(app, ['p7k2m9'], player);
    expect(limited.status).toBe(429);
    expect(await limited.json()).toEqual(err('rate_limited', 'Demasiadas solicitudes.'));
    expect(limited.headers.get('retry-after')).not.toBeNull();
    expect((await sql`SELECT state, status FROM plays`)[0]).toMatchObject({
      status: 'in_progress',
      state: {},
    });
  });
});
