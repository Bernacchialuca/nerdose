import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';

import { devdle } from '@nerdose/game-devdle/definition';
import { scoreGuess } from '@nerdose/game-devdle/definition';

import { buildDbApp } from '../helpers/app';
import { CATS, PAYLOAD, useDatabases } from '../helpers/db';
import { registryWithoutBugHunt } from '../helpers/registries';

const dbs = useDatabases();
beforeAll(() => dbs.reset());
beforeEach(async () => {
  await dbs.reset();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-12-01T10:00:00Z'));
});
afterEach(() => vi.useRealTimers());
afterAll(() => dbs.close());

const G_REACT = { guess: 'REACT', marks: scoreGuess('MERGE', 'REACT') };
const G_MERGE = { guess: 'MERGE', marks: scoreGuess('MERGE', 'MERGE') };
const LOST6 = ['REACT', 'CACHE', 'LINUX', 'PROXY', 'QUERY', 'SHELL'].map((w) => ({
  guess: w,
  marks: scoreGuess('MERGE', w),
}));
const STATS = {
  current_streak: 3,
  max_streak: 5,
  played: 10,
  wins: 8,
  win_rate: 0.8,
  extra: { guesses: { '1': 0, '2': 3, '3': 2, '4': 2, '5': 1, '6': 0 }, losses: 2 },
};

const publish = (status: 'published' | 'voided' = 'published') =>
  dbs.insertChallenge({
    gameId: 'devdle',
    date: '2026-12-01',
    number: 8,
    payload: PAYLOAD,
    status,
    ...(status === 'voided'
      ? { voidReason: 'wrong_answer', voidedAt: new Date('2026-12-01T09:00:00Z') }
      : {}),
  });
const cookie = (id: string) => ({ Cookie: `nd_pid=${id}` });
const view = { length: 5, possible_categories: CATS };
const publicBase = {
  game_id: 'devdle',
  date: '2026-12-01',
  number: 8,
  challenge_status: 'published',
  public_view: view,
  play: null,
  result: null,
  game_stats: null,
  reported: false,
};

async function finishedPlay(
  playerId: string,
  challengeId: string,
  status: 'won' | 'lost',
  withStats = true,
) {
  const state = { guesses: status === 'won' ? [G_REACT, G_MERGE] : LOST6 };
  await dbs.insertPlay({
    playerId,
    challengeId,
    gameId: 'devdle',
    date: '2026-12-01',
    state,
    status,
    score: status === 'won' ? 2 : 6,
    result: devdle.result(PAYLOAD as never, state as never, 'es'),
    finishedAt: new Date('2026-12-01T09:30:00Z'),
  });
  if (withStats) {
    await dbs.insertGameStats({
      playerId,
      gameId: 'devdle',
      currentStreak: 3,
      maxStreak: 5,
      played: 10,
      wins: 8,
      lastCompletedDate: '2026-12-01',
      extra: STATS.extra,
    });
  }
}

describe('GET /api/games/{game_id}/today', () => {
  it('TS-13 sin desafío hoy', async () => {
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const res = await app.request('/api/games/devdle/today', { headers: cookie(player.id) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ...publicBase,
      challenge_status: 'none',
      public_view: null,
    });
  });

  it('TS-14 anulado con Play: devuelve la Play voided sin public_view ni result', async () => {
    const challenge = await publish('voided');
    const player = await dbs.insertPlayer();
    await dbs.insertPlay({
      playerId: player.id,
      challengeId: challenge.id,
      gameId: 'devdle',
      date: '2026-12-01',
      state: { guesses: [G_REACT] },
      status: 'voided',
      finishedAt: new Date('2026-12-01T09:30:00Z'),
    });
    const { app } = await buildDbApp(dbs);
    const res = await app.request('/api/games/devdle/today', { headers: cookie(player.id) });
    expect(await res.json()).toMatchObject({
      ...publicBase,
      challenge_status: 'voided',
      public_view: null,
      play: { status: 'voided', state: { guesses: [G_REACT] }, score: null, code_language: null },
      result: null,
      game_stats: { game_id: 'devdle', current_streak: 0, played: 0 },
    });
  });

  // TS-26
  it('TS-26 anulado sin Play', async () => {
    await publish('voided');
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const res = await app.request('/api/games/devdle/today', { headers: cookie(player.id) });
    expect(await res.json()).toEqual({
      ...publicBase,
      challenge_status: 'voided',
      public_view: null,
    });
  });

  // TS-27
  it('TS-27 anulado con Play voided de una victoria: stats vivas', async () => {
    const challenge = await publish('voided');
    const player = await dbs.insertPlayer();
    await dbs.insertGameStats({
      playerId: player.id,
      gameId: 'devdle',
      currentStreak: 4,
      maxStreak: 9,
      played: 9,
      wins: 7,
      lastCompletedDate: '2026-12-01',
      extra: STATS.extra,
    });
    await dbs.insertPlay({
      playerId: player.id,
      challengeId: challenge.id,
      gameId: 'devdle',
      date: '2026-12-01',
      state: { guesses: [G_REACT, G_MERGE] },
      status: 'voided',
      result: { won: true },
      score: 2,
      finishedAt: new Date('2026-12-01T09:30:00Z'),
    });
    const { app } = await buildDbApp(dbs);
    const body = await (
      await app.request('/api/games/devdle/today', { headers: cookie(player.id) })
    ).json();
    expect(body).toMatchObject({
      challenge_status: 'voided',
      public_view: null,
      result: null,
      play: { status: 'voided', score: 2, code_language: null },
      game_stats: { current_streak: 4, max_streak: 9, played: 9, wins: 7 },
      reported: false,
    });
    expect(body.game_stats.win_rate).toBeCloseTo(7 / 9);
  });

  // TS-28 y TS-29
  it('TS-28 reported true en published y voided; TS-29 false sin sesión o sin reporte', async () => {
    const challenge = await publish();
    const player = await dbs.insertPlayer();
    const other = await dbs.insertPlayer();
    await dbs.insertReport({ challengeId: challenge.id, playerId: player.id });
    const { app } = await buildDbApp(dbs);
    const get = async (h?: Record<string, string>) =>
      (await (await app.request('/api/games/devdle/today', { headers: h })).json()).reported;
    expect(await get(cookie(player.id))).toBe(true);
    expect(await get()).toBe(false);
    expect(await get(cookie(other.id))).toBe(false);

    await dbs.owner.sql`UPDATE challenges SET status='voided', void_reason='x', voided_at=now()`;
    const { app: app2 } = await buildDbApp(dbs);
    const res = await app2.request('/api/games/devdle/today', { headers: cookie(player.id) });
    expect(await res.json()).toMatchObject({ challenge_status: 'voided', reported: true });
  });

  it('TS-15 sin sesión: vista pública y sin consultas', async () => {
    await publish();
    const calls: string[] = [];
    const boom = new Proxy(
      {},
      {
        get: (_t, name) => () => {
          calls.push(String(name));
          throw new Error('db');
        },
      },
    ) as never;
    const { app } = await buildDbApp(dbs, { gameplayRepo: boom, progressRepo: boom });
    const res = await app.request('/api/games/devdle/today');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(publicBase);
    expect(calls).toEqual([]);
  });

  it('TS-16 con sesión y sin Play', async () => {
    await publish();
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const res = await app.request('/api/games/devdle/today', { headers: cookie(player.id) });
    expect(await res.json()).toEqual(publicBase);
  });

  it('TS-17 retoma la Play en curso', async () => {
    const challenge = await publish();
    const player = await dbs.insertPlayer();
    await dbs.insertPlay({
      playerId: player.id,
      challengeId: challenge.id,
      gameId: 'devdle',
      date: '2026-12-01',
      state: { guesses: [G_REACT] },
    });
    const { app } = await buildDbApp(dbs);
    const res = await app.request('/api/games/devdle/today', { headers: cookie(player.id) });
    expect(await res.json()).toEqual({
      ...publicBase,
      play: {
        status: 'in_progress',
        state: { guesses: [G_REACT] },
        score: null,
        code_language: null,
      },
    });
  });

  it('TS-19 resultado de Play ganada (es) con game_stats', async () => {
    const challenge = await publish();
    const player = await dbs.insertPlayer({ locale: 'es' });
    await finishedPlay(player.id, challenge.id, 'won');
    await dbs.insertPlayerStats({
      playerId: player.id,
      globalStreak: 4,
      maxGlobalStreak: 9,
      lastActiveDate: '2026-12-01',
      totalCompleted: 20,
    });
    const { app } = await buildDbApp(dbs);
    const res = await app.request('/api/games/devdle/today', { headers: cookie(player.id) });
    expect(await res.json()).toEqual({
      ...publicBase,
      play: {
        status: 'won',
        state: { guesses: [G_REACT, G_MERGE] },
        score: 2,
        code_language: null,
      },
      result: {
        win: true,
        score: 2,
        word: 'MERGE',
        category: 'git',
        definition: 'Combinar los cambios de dos ramas en una.',
        summary: 'Operación de Git que integra historias.',
        guesses: [G_REACT, G_MERGE],
        hint: null,
      },
      game_stats: { game_id: 'devdle', ...STATS },
    });
  });

  it('TS-20 el locale sale de ?lang', async () => {
    const challenge = await publish();
    const player = await dbs.insertPlayer({ locale: 'es' });
    await finishedPlay(player.id, challenge.id, 'won');
    const { app } = await buildDbApp(dbs);
    const res = await app.request('/api/games/devdle/today?lang=en', {
      headers: cookie(player.id),
    });
    const body = await res.json();
    expect(body.result.definition).toBe('Combine the changes of two branches into one.');
    expect(body.result.summary).toBe('Git operation that integrates histories.');
    expect(body.result.word).toBe('MERGE');
  });

  it('TS-21 players.locale gana sobre Accept-Language', async () => {
    const challenge = await publish();
    const player = await dbs.insertPlayer({ locale: 'en' });
    await finishedPlay(player.id, challenge.id, 'won');
    const { app } = await buildDbApp(dbs);
    const res = await app.request('/api/games/devdle/today', {
      headers: { ...cookie(player.id), 'Accept-Language': 'es' },
    });
    expect((await res.json()).result.definition).toBe(
      'Combine the changes of two branches into one.',
    );
  });

  it('TS-22 Play perdida', async () => {
    const challenge = await publish();
    const player = await dbs.insertPlayer();
    await finishedPlay(player.id, challenge.id, 'lost');
    const { app } = await buildDbApp(dbs);
    const body = await (
      await app.request('/api/games/devdle/today', { headers: cookie(player.id) })
    ).json();
    expect(body.play).toMatchObject({ status: 'lost', score: 6 });
    expect(body.result).toMatchObject({ win: false, score: 6, word: 'MERGE', guesses: LOST6 });
  });

  it('TS-23 game_stats sin fila de stats', async () => {
    const challenge = await publish();
    const player = await dbs.insertPlayer();
    await finishedPlay(player.id, challenge.id, 'won', false);
    const { app } = await buildDbApp(dbs);
    const body = await (
      await app.request('/api/games/devdle/today', { headers: cookie(player.id) })
    ).json();
    expect(body.game_stats).toEqual({
      game_id: 'devdle',
      current_streak: 0,
      max_streak: 0,
      played: 0,
      wins: 0,
      win_rate: null,
      extra: { guesses: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 }, losses: 0 },
    });
  });

  it('TS-24 racha no viva: 0 y no se escribe', async () => {
    const challenge = await publish();
    const player = await dbs.insertPlayer();
    await finishedPlay(player.id, challenge.id, 'won');
    await dbs.owner
      .sql`UPDATE player_game_stats SET last_completed_date = '2026-11-29' WHERE player_id = ${player.id}`;
    await dbs.insertChallenge({ gameId: 'devdle', date: '2026-11-30', status: 'published' });
    const { app } = await buildDbApp(dbs);
    const body = await (
      await app.request('/api/games/devdle/today', { headers: cookie(player.id) })
    ).json();
    expect(body.game_stats).toMatchObject({ current_streak: 0, max_streak: 5 });
    const [row] = await dbs.owner
      .sql`SELECT current_streak FROM player_game_stats WHERE player_id = ${player.id}`;
    expect(row!.current_streak).toBe(3);
  });

  it('TS-25 juego sin paquete y juego inexistente: 404 not_found', async () => {
    await dbs.insertChallenge({ gameId: 'bug-hunt', date: '2026-12-01', status: 'published' });
    const player = await dbs.insertPlayer();
    const apps = {
      'bug-hunt': (await buildDbApp(dbs, { games: registryWithoutBugHunt })).app,
      foo: (await buildDbApp(dbs)).app,
    };
    for (const id of ['bug-hunt', 'foo'] as const) {
      const app = apps[id];
      const res = await app.request(`/api/games/${id}/today`, { headers: cookie(player.id) });
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({
        error: { code: 'not_found', message: 'Recurso no encontrado.' },
      });
    }
  });

  it('TS-26 antes del lanzamiento', async () => {
    vi.setSystemTime(new Date('2026-11-20T10:00:00Z'));
    await dbs.insertChallenge({ gameId: 'devdle', date: '2026-11-20', status: 'published' });
    const { app } = await buildDbApp(dbs);
    const res = await app.request('/api/games/devdle/today');
    expect(await res.json()).toEqual({
      ...publicBase,
      date: '2026-11-20',
      number: null,
      challenge_status: 'none',
      public_view: null,
    });
  });

  it('un cookie con Player inexistente se trata como sin sesión', async () => {
    await publish();
    const { app } = await buildDbApp(dbs);
    const res = await app.request('/api/games/devdle/today', { headers: cookie(randomUUID()) });
    expect(await res.json()).toEqual(publicBase);
  });
});
