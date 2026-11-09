import { randomUUID } from 'node:crypto';

import { scoreGuess } from '@nerdose/game-devdle/definition';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildDbApp, MUTATION_HEADERS } from '../helpers/app';
import { PAYLOAD, useDatabases } from '../helpers/db';

const dbs = useDatabases();
beforeAll(() => dbs.reset());
beforeEach(async () => {
  await dbs.reset();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-12-01T10:00:00Z'));
});
afterEach(() => vi.useRealTimers());
afterAll(() => dbs.close());

const URL = '/api/games/devdle/today/move';
const g = (w: string) => ({ guess: w, marks: scoreGuess('MERGE', w) });
const G_REACT = g('REACT');
const G_CACHE = g('CACHE');
const G_MERGE = g('MERGE');
const INITIAL_EXTRA = { guesses: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 }, losses: 0 };
const body = (w: string) => ({ challenge_number: 8, move: { guess: w } });
const err = (code: string, message: string) => ({ error: { code, message } });

type App = { request: (u: string, i?: RequestInit) => Response | Promise<Response> };
const post = (
  app: App,
  payload: unknown,
  player?: { id: string },
  extra: Record<string, string> = {},
  url = URL,
) =>
  app.request(url, {
    method: 'POST',
    headers: {
      ...MUTATION_HEADERS,
      ...(player ? { Cookie: `nd_pid=${player.id}` } : {}),
      ...extra,
    },
    body: JSON.stringify(payload),
  });

const publish = (over: Record<string, unknown> = {}) =>
  dbs.insertChallenge({
    gameId: 'devdle',
    date: '2026-12-01',
    number: 8,
    payload: PAYLOAD,
    status: 'published',
    ...over,
  });
const voidedOver = {
  status: 'voided' as const,
  voidReason: 'wrong_answer',
  voidedAt: new Date('2026-12-01T09:00:00Z'),
};
const seedPlay = async (
  challengeId: string,
  playerId: string,
  guesses: unknown[],
  extra: Record<string, unknown> = {},
) =>
  dbs.insertPlay({
    playerId,
    challengeId,
    gameId: 'devdle',
    date: '2026-12-01',
    state: { guesses },
    ...extra,
  });
const sql = dbs.owner.sql;
const count = async (t: string) =>
  Number((await sql`SELECT count(*)::int AS n FROM ${sql(t)}`)[0]!.n);
const playRows = () => sql`SELECT * FROM plays`;

/** Estado común de las rachas (TS-13 a TS-16). */
async function seedStreakBase() {
  const challenge = await publish();
  const player = await dbs.insertPlayer();
  await seedPlay(challenge.id, player.id, [G_REACT, G_CACHE, G_REACT]);
  await dbs.insertGameStats({
    playerId: player.id,
    gameId: 'devdle',
    currentStreak: 5,
    maxStreak: 5,
    played: 5,
    wins: 5,
    lastCompletedDate: '2026-11-29',
    extra: INITIAL_EXTRA,
  });
  await dbs.insertPlayerStats({
    playerId: player.id,
    globalStreak: 5,
    maxGlobalStreak: 7,
    lastActiveDate: '2026-11-29',
    totalCompleted: 9,
  });
  await dbs.insertChallenge({ gameId: 'devdle', date: '2026-11-29', number: 6 });
  return player;
}

describe('POST /api/games/{game_id}/today/move', () => {
  it('TS-1 primera jugada sin Play previa crea la Play', async () => {
    const challenge = await publish();
    const player = await dbs.insertPlayer();
    const { app, lines } = await buildDbApp(dbs);
    const res = await post(app, body('REACT'), player);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      feedback: G_REACT,
      play: { status: 'in_progress', state: { guesses: [G_REACT] }, score: null },
      result: null,
      streaks: null,
      game_stats: null,
    });
    const rows = await playRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      player_id: player.id,
      challenge_id: challenge.id,
      status: 'in_progress',
      state: { guesses: [G_REACT] },
    });
    expect(String(rows[0]!.date)).toContain('2026-12-01');
    expect(lines().filter((l) => l.event === 'PlayStarted')).toHaveLength(1);
    expect(await count('player_game_stats')).toBe(0);
    expect(await count('player_stats')).toBe(0);
  });

  it('TS-2 jugada válida sobre Play en curso', async () => {
    const challenge = await publish();
    const player = await dbs.insertPlayer();
    await seedPlay(challenge.id, player.id, [G_REACT]);
    const { app, lines } = await buildDbApp(dbs);
    const res = await post(app, body('CACHE'), player);
    expect(await res.json()).toEqual({
      feedback: G_CACHE,
      play: { status: 'in_progress', state: { guesses: [G_REACT, G_CACHE] }, score: null },
      result: null,
      streaks: null,
      game_stats: null,
    });
    expect((await playRows())[0]!.state).toEqual({ guesses: [G_REACT, G_CACHE] });
    expect(lines().filter((l) => l.event === 'PlayStarted')).toHaveLength(0);
  });

  it('TS-3 y TS-4 palabra fuera de la lista: ROLLBACK, registro único y 422', async () => {
    const challenge = await publish();
    const player = await dbs.insertPlayer();
    await seedPlay(challenge.id, player.id, [G_REACT, G_CACHE]);
    const { app, lines } = await buildDbApp(dbs);
    for (let i = 0; i < 2; i++) {
      const res = await post(app, body('ZZZZZ'), player);
      expect(res.status).toBe(422);
      expect(await res.json()).toEqual(err('not_in_word_list', 'La palabra no está en la lista.'));
    }
    expect((await playRows())[0]!.state).toEqual({ guesses: [G_REACT, G_CACHE] });
    const rej = await sql`SELECT * FROM rejected_guesses`;
    expect(rej).toHaveLength(1);
    expect(rej[0]).toMatchObject({ word: 'ZZZZZ', player_id: player.id });
    const rejected = lines().filter((l) => l.event === 'GuessRejected');
    expect(rejected[0]).toMatchObject({ level: 'info', player_id: player.id });
    expect(JSON.stringify(lines())).not.toContain('ZZZZZ');
  });

  it('TS-5 rechazo sin Play previa no deja Play creada', async () => {
    await publish();
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const res = await post(app, body('ZZZZZ'), player);
    expect(res.status).toBe(422);
    expect(await count('plays')).toBe(0);
    expect(await count('rejected_guesses')).toBe(1);
  });

  it('TS-7 largo incorrecto devuelve invalid_move sin registro', async () => {
    const challenge = await publish();
    const player = await dbs.insertPlayer();
    await seedPlay(challenge.id, player.id, [G_REACT, G_CACHE]);
    const { app } = await buildDbApp(dbs);
    const res = await post(app, body('REACTS'), player);
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual(err('invalid_move', 'Jugada inválida.'));
    expect((await playRows())[0]!.state).toEqual({ guesses: [G_REACT, G_CACHE] });
    expect(await count('rejected_guesses')).toBe(0);
  });

  it('TS-8 move que no pasa moveSchema', async () => {
    await publish();
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    for (const b of [
      { challenge_number: 8, move: { guess: 'react' } },
      { challenge_number: 8, move: {} },
      { challenge_number: 8 },
    ]) {
      const res = await post(app, b, player);
      expect(res.status).toBe(422);
      expect(await res.json()).toEqual(err('invalid_move', 'Jugada inválida.'));
    }
    expect(await count('plays')).toBe(0);
  });

  it('TS-9 body sin challenge_number válido', async () => {
    await publish();
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    for (const b of [
      { move: { guess: 'REACT' } },
      { challenge_number: 0, move: { guess: 'REACT' } },
      { challenge_number: '8', move: { guess: 'REACT' } },
    ]) {
      const res = await post(app, b, player);
      expect(res.status).toBe(422);
      expect(await res.json()).toEqual(err('validation_error', 'Datos inválidos.'));
    }
  });

  it('TS-10 victoria en el 4.º intento: cierre completo', async () => {
    const challenge = await publish();
    const player = await dbs.insertPlayer();
    await seedPlay(challenge.id, player.id, [G_REACT, G_CACHE, G_REACT]);
    const { app, lines } = await buildDbApp(dbs);
    const res = await post(app, body('MERGE'), player);
    expect(res.status).toBe(200);
    const guesses = [G_REACT, G_CACHE, G_REACT, G_MERGE];
    const result = {
      win: true,
      score: 4,
      word: 'MERGE',
      category: 'git',
      definition: 'Combinar los cambios de dos ramas en una.',
      summary: 'Operación de Git que integra historias.',
      guesses,
    };
    const gameStats = {
      game_id: 'devdle',
      current_streak: 1,
      max_streak: 1,
      played: 1,
      wins: 1,
      win_rate: 1,
      extra: { guesses: { ...INITIAL_EXTRA.guesses, '4': 1 }, losses: 0 },
    };
    expect(await res.json()).toEqual({
      feedback: G_MERGE,
      play: { status: 'won', state: { guesses }, score: 4 },
      result,
      streaks: { game: { current: 1, max: 1 }, global: { current: 1, max: 1 } },
      game_stats: gameStats,
    });
    const [p] = await playRows();
    expect(p).toMatchObject({ status: 'won', score: 4, code_language: null });
    expect(p!.result).not.toBeNull();
    expect(new Date(p!.finished_at as string).toISOString()).toBe('2026-12-01T10:00:00.000Z');
    const [gs] = await sql`SELECT * FROM player_game_stats`;
    expect(gs).toMatchObject({ current_streak: 1, max_streak: 1, played: 1, wins: 1 });
    expect(String(gs!.last_completed_date)).toContain('2026-12-01');
    expect(gs!.extra).toEqual(gameStats.extra);
    const [ps] = await sql`SELECT * FROM player_stats`;
    expect(ps).toMatchObject({ global_streak: 1, max_global_streak: 1, total_completed: 1 });
    const finished = lines().find((l) => l.event === 'PlayFinished');
    expect(finished).toMatchObject({ status: 'won', score: 4 });
    expect(lines().find((l) => l.event === 'StreaksUpdated')).toBeDefined();
    const logs = JSON.stringify(lines());
    expect(logs).not.toContain('MERGE');
    expect(logs).not.toContain(PAYLOAD.term_id);

    // TS-41 coherencia con las lecturas
    const today = await app.request('/api/games/devdle/today', {
      headers: { Cookie: `nd_pid=${player.id}` },
    });
    const t = await today.json();
    expect(t.play).toMatchObject({ status: 'won', score: 4 });
    expect(t.result).toEqual(result);
    expect(t.game_stats).toEqual(gameStats);
    const home = await (
      await app.request('/api/today', { headers: { Cookie: `nd_pid=${player.id}` } })
    ).json();
    expect(home.games[0]).toEqual({
      game_id: 'devdle',
      challenge_status: 'published',
      play_status: 'won',
      history_label: '✓ 4/6',
      current_streak: 1,
    });
    expect(home.global_streak).toEqual({ current: 1, max: 1 });
    expect(home.completed_today).toBe(1);

    // TS-23 reintento de la jugada final
    const again = await post(app, body('MERGE'), player);
    expect(again.status).toBe(409);
    expect(await count('player_game_stats')).toBe(1);
    expect((await sql`SELECT played FROM player_game_stats`)[0]!.played).toBe(1);
    expect((await sql`SELECT total_completed FROM player_stats`)[0]!.total_completed).toBe(1);
  });

  it('TS-11 derrota con el 6.º intento válido', async () => {
    const challenge = await publish();
    const player = await dbs.insertPlayer();
    await dbs.insertChallenge({ gameId: 'devdle', date: '2026-11-30', number: 7 });
    const five = [G_REACT, G_CACHE, G_REACT, G_CACHE, G_REACT];
    await seedPlay(challenge.id, player.id, five);
    const extra = { guesses: { '1': 0, '2': 1, '3': 2, '4': 1, '5': 1, '6': 0 }, losses: 1 };
    await dbs.insertGameStats({
      playerId: player.id,
      gameId: 'devdle',
      currentStreak: 2,
      maxStreak: 4,
      played: 6,
      wins: 5,
      lastCompletedDate: '2026-11-30',
      extra,
    });
    await dbs.insertPlayerStats({
      playerId: player.id,
      globalStreak: 2,
      maxGlobalStreak: 3,
      lastActiveDate: '2026-11-30',
      totalCompleted: 6,
    });
    const { app } = await buildDbApp(dbs);
    const res = await post(app, body('CACHE'), player);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.play).toEqual({
      status: 'lost',
      state: { guesses: [...five, G_CACHE] },
      score: 6,
    });
    expect(json.result).toMatchObject({ win: false, score: 6, word: 'MERGE' });
    expect(json.streaks).toEqual({
      game: { current: 3, max: 4 },
      global: { current: 3, max: 3 },
    });
    expect(json.game_stats).toMatchObject({
      current_streak: 3,
      max_streak: 4,
      played: 7,
      wins: 5,
      extra: { ...extra, losses: 2 },
    });
    expect(json.game_stats.win_rate).toBeCloseTo(5 / 7);
    expect((await sql`SELECT total_completed FROM player_stats`)[0]!.total_completed).toBe(7);
  });

  it('TS-13 día neutro: la racha continúa', async () => {
    const player = await seedStreakBase();
    const { app } = await buildDbApp(dbs);
    const json = await (await post(app, body('MERGE'), player)).json();
    expect(json.streaks).toEqual({ game: { current: 6, max: 6 }, global: { current: 6, max: 7 } });
    expect((await sql`SELECT total_completed FROM player_stats`)[0]!.total_completed).toBe(10);
  });

  it('TS-14 día con desafío no completado reinicia en 1', async () => {
    const player = await seedStreakBase();
    await dbs.insertChallenge({ gameId: 'devdle', date: '2026-11-30', number: 7 });
    const { app } = await buildDbApp(dbs);
    const json = await (await post(app, body('MERGE'), player)).json();
    expect(json.streaks).toEqual({ game: { current: 1, max: 5 }, global: { current: 1, max: 7 } });
  });

  it('TS-15 desafío de otro juego: neutro para el juego, corta la global', async () => {
    const player = await seedStreakBase();
    await dbs.insertChallenge({ gameId: 'big-o', date: '2026-11-30', number: 7 });
    const { app } = await buildDbApp(dbs);
    const json = await (await post(app, body('MERGE'), player)).json();
    expect(json.streaks).toEqual({ game: { current: 6, max: 6 }, global: { current: 1, max: 7 } });
  });

  it('TS-16 un día voided es activo para las rachas', async () => {
    const player = await seedStreakBase();
    await dbs.insertChallenge({ gameId: 'devdle', date: '2026-11-30', number: 7, ...voidedOver });
    const { app } = await buildDbApp(dbs);
    const json = await (await post(app, body('MERGE'), player)).json();
    expect(json.streaks.game).toEqual({ current: 1, max: 5 });
  });

  it('TS-21 y TS-22 Play terminada devuelve game_finished sin tocar nada', async () => {
    const challenge = await publish();
    const player = await dbs.insertPlayer();
    await seedPlay(challenge.id, player.id, [G_REACT, G_MERGE], {
      status: 'won',
      score: 2,
      result: { win: true },
      finishedAt: new Date('2026-12-01T09:00:00Z'),
    });
    await dbs.insertGameStats({ playerId: player.id, gameId: 'devdle', played: 1, wins: 1 });
    await dbs.insertPlayerStats({ playerId: player.id, totalCompleted: 1 });
    const before = [
      await playRows(),
      await sql`SELECT * FROM player_game_stats`,
      await sql`SELECT * FROM player_stats`,
    ];
    const { app } = await buildDbApp(dbs);
    const res = await post(app, body('REACT'), player);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual(err('game_finished', 'La partida ya terminó.'));
    expect([
      await playRows(),
      await sql`SELECT * FROM player_game_stats`,
      await sql`SELECT * FROM player_stats`,
    ]).toEqual(before);

    await sql`UPDATE plays SET status = 'lost'`;
    expect((await post(app, body('REACT'), player)).status).toBe(409);
  });

  it('TS-24 jugada tardía: Play vieja intacta', async () => {
    vi.setSystemTime(new Date('2026-12-02T00:00:05Z'));
    const challenge = await publish();
    const player = await dbs.insertPlayer();
    await seedPlay(challenge.id, player.id, [G_REACT]);
    const { app } = await buildDbApp(dbs);
    const res = await post(app, { challenge_number: 8, move: { guess: 'CACHE' } }, player);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual(err('challenge_expired', 'El desafío ya venció.'));
    const [p] = await playRows();
    expect(p).toMatchObject({ status: 'in_progress', state: { guesses: [G_REACT] } });
  });

  it('TS-25 número viejo con desafío hoy', async () => {
    await publish();
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const res = await post(app, { challenge_number: 7, move: { guess: 'REACT' } }, player);
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe('challenge_expired');
    expect(await count('plays')).toBe(0);
  });

  it('TS-26 desafío anulado', async () => {
    const challenge = await publish(voidedOver);
    const player = await dbs.insertPlayer();
    await seedPlay(challenge.id, player.id, [G_REACT]);
    const { app } = await buildDbApp(dbs);
    const res = await post(app, body('CACHE'), player);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual(err('challenge_voided', 'El desafío fue anulado.'));
    expect((await playRows())[0]!.state).toEqual({ guesses: [G_REACT] });
  });

  it('TS-27 sin desafío hoy', async () => {
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const res = await post(app, body('REACT'), player);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual(err('no_challenge_today', 'No hay desafío para hoy.'));
  });

  it('TS-28 antes del lanzamiento', async () => {
    vi.setSystemTime(new Date('2026-11-20T10:00:00Z'));
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const res = await post(app, { challenge_number: 1, move: { guess: 'REACT' } }, player);
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe('challenge_expired');
  });

  it('TS-29 juego sin paquete o inexistente', async () => {
    await dbs.insertChallenge({ gameId: 'grep-grid', date: '2026-12-01', number: 8 });
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    for (const game of ['grep-grid', 'foo']) {
      const res = await post(app, body('REACT'), player, {}, `/api/games/${game}/today/move`);
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual(err('not_found', 'Recurso no encontrado.'));
    }
    expect(await count('plays')).toBe(0);
  });

  it('TS-30 sin sesión', async () => {
    await publish();
    const { app } = await buildDbApp(dbs);
    for (const player of [undefined, { id: randomUUID() }]) {
      const res = await post(app, body('REACT'), player);
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual(err('no_session', 'No hay una sesión activa.'));
    }
  });

  it('TS-38 origen y Content-Type', async () => {
    await publish();
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const bad = await post(app, body('REACT'), player, { Origin: 'https://evil.example' });
    expect(bad.status).toBe(403);
    expect((await bad.json()).error.code).toBe('forbidden_origin');
    const noCt = await app.request(URL, {
      method: 'POST',
      headers: { Origin: 'http://localhost:5173', Cookie: `nd_pid=${player.id}` },
      body: JSON.stringify(body('REACT')),
    });
    expect(noCt.status).toBe(415);
    expect((await noCt.json()).error.code).toBe('unsupported_media_type');
  });

  it('TS-39 resultado en inglés por ?lang=en', async () => {
    const challenge = await publish();
    const player = await dbs.insertPlayer();
    await seedPlay(challenge.id, player.id, [G_REACT, G_CACHE, G_REACT]);
    const { app } = await buildDbApp(dbs);
    const res = await post(app, body('MERGE'), player, {}, `${URL}?lang=en`);
    const json = await res.json();
    expect(json.result).toMatchObject({
      word: 'MERGE',
      definition: 'Combine the changes of two branches into one.',
      summary: 'Git operation that integrates histories.',
    });
    expect(json.streaks.game.current).toBe(1);
  });

  it('TS-40 resultado en inglés por players.locale', async () => {
    const challenge = await publish();
    const player = await dbs.insertPlayer({ locale: 'en' });
    await seedPlay(challenge.id, player.id, [G_REACT, G_CACHE, G_REACT]);
    const { app } = await buildDbApp(dbs);
    const res = await post(app, body('MERGE'), player, { 'Accept-Language': 'es' });
    expect((await res.json()).result.definition).toBe(
      'Combine the changes of two branches into one.',
    );
  });
});

describe('rate limit de move', () => {
  it('TS-34 y TS-35 60/min por jugador, sin afectar a otro', async () => {
    const challenge = await publish();
    const player = await dbs.insertPlayer();
    const other = await dbs.insertPlayer();
    await seedPlay(challenge.id, player.id, [G_REACT, G_MERGE], {
      status: 'won',
      score: 2,
      result: { win: true },
      finishedAt: new Date(),
    });
    await seedPlay(challenge.id, other.id, [G_REACT]);
    const { app } = await buildDbApp(dbs);
    for (let i = 0; i < 60; i++) {
      expect((await post(app, body('REACT'), player)).status).toBe(409);
    }
    const limited = await post(app, body('REACT'), player);
    expect(limited.status).toBe(429);
    expect(limited.headers.get('Retry-After')).toBe('60');
    expect(await limited.json()).toEqual(err('rate_limited', 'Demasiadas solicitudes.'));
    expect((await post(app, body('REACT'), other)).status).toBe(200);
  });

  it('TS-36 las jugadas rechazadas cuentan para el límite', async () => {
    const challenge = await publish();
    const player = await dbs.insertPlayer();
    await seedPlay(challenge.id, player.id, [G_CACHE]);
    const { app } = await buildDbApp(dbs);
    for (let i = 0; i < 60; i++) {
      expect((await post(app, body('ZZZZZ'), player)).status).toBe(422);
    }
    expect((await post(app, body('REACT'), player)).status).toBe(429);
    expect((await playRows())[0]!.state).toEqual({ guesses: [G_CACHE] });
  });

  it('TS-37 300/min por IP, también sin cookie', async () => {
    await publish();
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const ip = { 'x-forwarded-for': '203.0.113.7' };
    for (let i = 0; i < 300; i++) {
      expect((await post(app, body('REACT'), undefined, ip)).status).toBe(401);
    }
    const limited = await post(app, body('REACT'), player, ip);
    expect(limited.status).toBe(429);
    expect(limited.headers.get('Retry-After')).toBe('60');
    const other = await post(app, body('REACT'), player, { 'x-forwarded-for': '203.0.113.8' });
    expect(other.status).not.toBe(429);
  });
});
