import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { playerRef } from '@/shared/player-ref';

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
const ack = (app: App, player: { id: string } | null, body: unknown = { challenge_number: 8 }) =>
  app.request('/api/games/devdle/today/acknowledge-void', {
    method: 'POST',
    headers: { ...MUTATION_HEADERS, ...(player ? { Cookie: `nd_pid=${player.id}` } : {}) },
    body: JSON.stringify(body),
  });
const err = (code: string, message: string) => ({ error: { code, message } });
const EXTRA = { guesses: { '1': 0, '2': 1, '3': 2, '4': 2, '5': 0, '6': 0 }, losses: 2 };

const voided = () =>
  dbs.insertChallenge({
    gameId: 'devdle',
    date: '2026-12-01',
    number: 8,
    payload: PAYLOAD,
    status: 'voided',
    voidReason: 'wrong_answer',
    voidedAt: new Date('2026-12-01T09:00:00Z'),
  });

async function seedStreaks() {
  await dbs.insertChallenge({
    gameId: 'devdle',
    date: '2026-11-30',
    number: 7,
    payload: PAYLOAD,
    status: 'published',
  });
  const challenge = await voided();
  const player = await dbs.insertPlayer();
  await dbs.insertGameStats({
    playerId: player.id,
    gameId: 'devdle',
    currentStreak: 3,
    maxStreak: 9,
    played: 7,
    wins: 5,
    lastCompletedDate: '2026-11-30',
    extra: EXTRA,
  });
  await dbs.insertPlayerStats({
    playerId: player.id,
    globalStreak: 5,
    maxGlobalStreak: 12,
    lastActiveDate: '2026-11-30',
    totalCompleted: 10,
  });
  return { challenge, player };
}

const EXPECTED = {
  play: { status: 'voided' },
  streaks: { game: { current: 4, max: 9 }, global: { current: 6, max: 12 } },
};

describe('POST /api/games/{game_id}/today/acknowledge-void', () => {
  it('TS-34, TS-35 y TS-43 marca como completado una sola vez', async () => {
    const { player } = await seedStreaks();
    const { app, lines } = await buildDbApp(dbs);
    const first = await ack(app, player);
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual(EXPECTED);
    const [play] = await sql`SELECT * FROM plays`;
    expect(play).toMatchObject({
      status: 'voided',
      state: {},
      result: null,
      score: null,
      date: '2026-12-01',
    });
    expect(new Date(play!.finished_at).toISOString()).toBe('2026-12-01T10:00:00.000Z');
    expect((await sql`SELECT * FROM player_game_stats`)[0]).toMatchObject({
      current_streak: 4,
      played: 7,
      wins: 5,
      extra: EXTRA,
      last_completed_date: '2026-12-01',
    });
    expect((await sql`SELECT * FROM player_stats`)[0]).toMatchObject({
      global_streak: 6,
      last_active_date: '2026-12-01',
      total_completed: 11,
    });
    expect(lines().filter((l) => l.event === 'PlayVoidAcknowledged')).toEqual([
      expect.objectContaining({
        play_id: play!.id,
        player_ref: playerRef(player.id),
        game_id: 'devdle',
      }),
    ]);
    expect(lines().filter((l) => l.event === 'StreaksUpdated')).toEqual([
      expect.objectContaining({
        player_ref: playerRef(player.id),
        game_id: 'devdle',
        current_streak: 4,
        max_streak: 9,
        global_streak: 6,
        max_global_streak: 12,
      }),
    ]);

    const second = await ack(app, player);
    expect(await second.json()).toEqual(EXPECTED);
    expect(await sql`SELECT id FROM plays`).toHaveLength(1);
    expect((await sql`SELECT total_completed FROM player_stats`)[0]!.total_completed).toBe(11);
    expect((await sql`SELECT current_streak FROM player_game_stats`)[0]!.current_streak).toBe(4);
    expect(lines().filter((l) => l.event === 'PlayVoidAcknowledged')).toHaveLength(1);
    expect(lines().filter((l) => l.event === 'StreaksUpdated')).toHaveLength(1);
  });

  it('TS-36 con Play voided previa: rachas vivas sin cambios', async () => {
    const challenge = await voided();
    const player = await dbs.insertPlayer();
    await dbs.insertPlay({
      playerId: player.id,
      challengeId: challenge.id,
      gameId: 'devdle',
      date: '2026-12-01',
      state: { guesses: [] },
      status: 'voided',
      result: { won: true },
      finishedAt: new Date('2026-12-01T09:00:00Z'),
    });
    await dbs.insertGameStats({
      playerId: player.id,
      gameId: 'devdle',
      currentStreak: 2,
      maxStreak: 5,
      played: 2,
      wins: 2,
      lastCompletedDate: '2026-12-01',
      extra: EXTRA,
    });
    await dbs.insertPlayerStats({
      playerId: player.id,
      globalStreak: 2,
      maxGlobalStreak: 7,
      lastActiveDate: '2026-12-01',
      totalCompleted: 4,
    });
    const { app } = await buildDbApp(dbs);
    const res = await ack(app, player);
    expect(await res.json()).toEqual({
      play: { status: 'voided' },
      streaks: { game: { current: 2, max: 5 }, global: { current: 2, max: 7 } },
    });
    expect((await sql`SELECT total_completed FROM player_stats`)[0]!.total_completed).toBe(4);
    expect((await sql`SELECT state FROM plays`)[0]!.state).toEqual({ guesses: [] });
  });

  it('TS-37 desafío anulado de ayer: challenge_expired', async () => {
    await voided();
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const res = await ack(app, player, { challenge_number: 7 });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual(err('challenge_expired', 'El desafío ya venció.'));
    expect(await sql`SELECT id FROM plays`).toHaveLength(0);
  });

  it('TS-38 desafío no anulado', async () => {
    await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-01',
      number: 8,
      payload: PAYLOAD,
      status: 'published',
    });
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const res = await ack(app, player);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual(err('not_voided', 'El desafío no está anulado.'));
    expect(await sql`SELECT id FROM plays`).toHaveLength(0);
  });

  it('TS-39 cache vieja publicada, base anulada', async () => {
    await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-01',
      number: 8,
      payload: PAYLOAD,
      status: 'published',
    });
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    await app.request('/api/games/devdle/today'); // carga la cache con `published`
    await sql`UPDATE challenges SET status='voided', void_reason='x', voided_at=now()`;
    const res = await ack(app, player);
    expect(res.status).toBe(200);
    expect(await sql`SELECT status FROM plays`).toEqual([{ status: 'voided' }]);
  });

  it('TS-40 sin desafío hoy', async () => {
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const res = await ack(app, player);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual(err('no_challenge_today', 'No hay desafío para hoy.'));
  });

  it('TS-41 protecciones y rate limit 30/min', async () => {
    await voided();
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const noCookie = await ack(app, null);
    expect(noCookie.status).toBe(401);
    expect((await noCookie.json()).error.code).toBe('no_session');
    const bad = await ack(app, player, {});
    expect(bad.status).toBe(422);
    expect((await bad.json()).error.code).toBe('validation_error');
    let last: Response | undefined;
    for (let i = 0; i < 30; i++) last = await ack(app, player);
    expect(last!.status).toBe(429);
    expect(last!.headers.get('Retry-After')).toBe('60');
    expect((await last!.json()).error.code).toBe('rate_limited');
  });

  it('TS-42 dos marcas simultáneas suman una sola vez', async () => {
    const { player } = await seedStreaks();
    const { app } = await buildDbApp(dbs);
    const res = await Promise.all([ack(app, player), ack(app, player)]);
    for (const r of res) {
      expect(r.status).toBe(200);
      expect(await r.json()).toEqual(EXPECTED);
    }
    expect(await sql`SELECT id FROM plays`).toHaveLength(1);
    expect((await sql`SELECT total_completed FROM player_stats`)[0]!.total_completed).toBe(11);
  });

  it('TS-44 jugador sin stats previas', async () => {
    await voided();
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const res = await ack(app, player);
    expect(await res.json()).toEqual({
      play: { status: 'voided' },
      streaks: { game: { current: 1, max: 1 }, global: { current: 1, max: 1 } },
    });
    expect((await sql`SELECT * FROM player_game_stats`)[0]).toMatchObject({
      played: 0,
      wins: 0,
    });
    expect((await sql`SELECT total_completed FROM player_stats`)[0]!.total_completed).toBe(1);
  });
});
