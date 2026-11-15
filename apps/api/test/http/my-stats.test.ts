import { randomUUID } from 'node:crypto';

import type { GameId } from '@nerdose/core';
import { devdle, scoreGuess } from '@nerdose/game-devdle/definition';
import { grepGrid } from '@nerdose/game-grep-grid/definition';
import { timeline } from '@nerdose/game-timeline/definition';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildDbApp, buildTestApp } from '../helpers/app';
import { boResult, WON_JAVA as BO_WON, LOST_GO as BO_LOST } from '../helpers/big-o';
import { bhResult, WON_JAVA as BH_WON } from '../helpers/bug-hunt';
import { PAYLOAD, useDatabases } from '../helpers/db';
import { found, GG_PAYLOAD, SEVEN } from '../helpers/grep-grid';
import { CORRECT, TL_PAYLOAD } from '../helpers/timeline';

const dbs = useDatabases();
beforeAll(() => dbs.reset());
beforeEach(async () => {
  await dbs.reset();
  vi.useFakeTimers({ toFake: ['Date'] });
});
afterEach(() => vi.useRealTimers());
afterAll(() => dbs.close());

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type Status = 'won' | 'lost' | 'voided' | 'in_progress';
type Player = { id: string };

const ALL: GameId[] = ['devdle', 'grep-grid', 'timeline', 'big-o', 'bug-hunt'];
const LAUNCH = Date.parse('2026-11-24T00:00:00Z');
const numberOf = (date: string) =>
  Math.max(1, Math.round((Date.parse(`${date}T00:00:00Z`) - LAUNCH) / 86_400_000) + 1);
const clock = (iso: string) => vi.setSystemTime(new Date(iso));

const EXTRA_DEVDLE = { guesses: { '1': 0, '2': 3, '3': 2, '4': 2, '5': 1, '6': 0 }, losses: 2 };
const DEVDLE_WON = devdle.result(
  PAYLOAD as never,
  { guesses: [{ guess: 'MERGE', marks: scoreGuess('MERGE', 'MERGE') }] } as never,
  'es',
);
const DEVDLE_LOST = devdle.result(
  PAYLOAD as never,
  {
    guesses: ['REACT', 'CACHE', 'LINUX', 'PROXY', 'QUERY', 'SHELL'].map((w) => ({
      guess: w,
      marks: scoreGuess('MERGE', w),
    })),
  } as never,
  'es',
);
const RESULT: Record<GameId, unknown> = {
  devdle: DEVDLE_WON,
  'grep-grid': grepGrid.result(GG_PAYLOAD, found(...SEVEN, 'PYTHON'), 'es'),
  timeline: timeline.result(TL_PAYLOAD, { order: [...CORRECT] }, 'es'),
  'big-o': boResult(BO_WON, 'es'),
  'bug-hunt': bhResult(BH_WON, 'es'),
};

type Entry = { gameId: GameId; date: string; status?: Status; result?: unknown };

/** Crea el challenge y la Play de cada entrada (fixtures con el rol owner). */
async function seed(playerId: string, entries: Entry[]) {
  for (const e of entries) {
    const status = e.status ?? 'won';
    const voided = status === 'voided';
    const c = await dbs.insertChallenge({
      gameId: e.gameId,
      date: e.date,
      number: numberOf(e.date),
      ...(voided
        ? { status: 'voided', voidReason: 'x', voidedAt: new Date(`${e.date}T00:00:00Z`) }
        : {}),
    });
    await dbs.insertPlay({
      playerId,
      challengeId: c.id,
      gameId: e.gameId,
      date: e.date,
      state: {},
      status,
      ...(status === 'in_progress'
        ? {}
        : {
            result: e.result === undefined ? RESULT[e.gameId] : e.result,
            finishedAt: new Date(`${e.date}T12:00:00Z`),
          }),
    });
  }
}

async function get(player: Player | null, query = '', headers: Record<string, string> = {}) {
  const { app } = await buildDbApp(dbs);
  const res = await app.request(`/api/me/stats${query}`, {
    headers: { ...(player ? { Cookie: `nd_pid=${player.id}` } : {}), ...headers },
  });
  return { res, body: (await res.json()) as Json };
}
const ok = async (player: Player, query = '') => {
  const { res, body } = await get(player, query);
  expect(res.status).toBe(200);
  return body;
};

const day = (n: number) => `2026-12-${String(n).padStart(2, '0')}`;
const devStats = (over: Record<string, unknown> = {}) => ({
  gameId: 'devdle' as const,
  currentStreak: 3,
  maxStreak: 5,
  played: 10,
  wins: 8,
  lastCompletedDate: '2026-12-01',
  extra: EXTRA_DEVDLE,
  ...over,
});
const pStats = (over: Record<string, unknown> = {}) => ({
  globalStreak: 4,
  maxGlobalStreak: 9,
  lastActiveDate: '2026-12-01',
  totalCompleted: 20,
  ...over,
});

describe('GET /api/me/stats: rachas (CA-1)', () => {
  it('TS-1 racha global y por juego vivas', async () => {
    clock('2026-12-02T10:00:00Z');
    const p = await dbs.insertPlayer();
    await dbs.insertChallenge({ gameId: 'devdle', date: '2026-12-01', number: 8 });
    await dbs.insertPlayerStats({ playerId: p.id, ...pStats() });
    await dbs.insertGameStats({ playerId: p.id, ...devStats() });
    const b = await ok(p);
    expect(b.today).toBe('2026-12-02');
    expect(b.global).toEqual({ current_streak: 4, max_streak: 9, total_completed: 20 });
    expect(b.games[0]).toEqual({
      game_id: 'devdle',
      current_streak: 3,
      max_streak: 5,
      played: 10,
      wins: 8,
      win_rate: 0.8,
      extra: EXTRA_DEVDLE,
    });
  });

  it('TS-2 racha vieja a 0, récords intactos y sin escrituras', async () => {
    clock('2026-12-02T10:00:00Z');
    const p = await dbs.insertPlayer();
    for (const d of ['2026-11-28', '2026-11-30', '2026-12-01'])
      await dbs.insertChallenge({ gameId: 'devdle', date: d, number: numberOf(d) });
    await dbs.insertPlayerStats({ playerId: p.id, ...pStats({ lastActiveDate: '2026-11-28' }) });
    await dbs.insertGameStats({ playerId: p.id, ...devStats({ lastCompletedDate: '2026-11-28' }) });
    const b = await ok(p);
    expect(b.global).toEqual({ current_streak: 0, max_streak: 9, total_completed: 20 });
    expect(b.games[0]).toMatchObject({
      current_streak: 0,
      max_streak: 5,
      played: 10,
      wins: 8,
      win_rate: 0.8,
    });
    const gs = await dbs.owner.sql`SELECT current_streak FROM player_game_stats`;
    const ps = await dbs.owner.sql`SELECT global_streak FROM player_stats`;
    expect(gs[0]!.current_streak).toBe(3);
    expect(ps[0]!.global_streak).toBe(4);
  });

  it('TS-3 un día neutro intermedio mantiene viva la racha', async () => {
    clock('2026-12-02T10:00:00Z');
    const p = await dbs.insertPlayer();
    await dbs.insertChallenge({ gameId: 'timeline', date: '2026-11-30' });
    await dbs.insertChallenge({ gameId: 'timeline', date: '2026-12-01', status: 'approved' });
    await dbs.insertGameStats({
      playerId: p.id,
      gameId: 'timeline',
      currentStreak: 2,
      maxStreak: 2,
      played: 2,
      wins: 1,
      lastCompletedDate: '2026-11-30',
      extra: { by_category: {} },
    });
    await dbs.insertPlayerStats({
      playerId: p.id,
      globalStreak: 2,
      maxGlobalStreak: 2,
      lastActiveDate: '2026-11-30',
      totalCompleted: 2,
    });
    const b = await ok(p);
    expect(b.games[2]).toMatchObject({
      game_id: 'timeline',
      current_streak: 2,
      max_streak: 2,
      played: 2,
      wins: 1,
      win_rate: 0.5,
    });
    expect(b.global.current_streak).toBe(2);
  });
});

describe('GET /api/me/stats: anuladas (CA-2)', () => {
  const setup = async (locale: 'es' | 'en' = 'es') => {
    clock('2026-12-02T10:00:00Z');
    const p = await dbs.insertPlayer({ locale });
    await dbs.insertGameStats({
      playerId: p.id,
      gameId: 'big-o',
      currentStreak: 0,
      maxStreak: 3,
      played: 9,
      wins: 5,
      lastCompletedDate: '2026-11-20',
      extra: { by_category: { nested_loops: { played: 9, correct: 5 } } },
    });
    await seed(p.id, [{ gameId: 'big-o', date: '2026-12-01', status: 'voided' }]);
    return p;
  };

  it('TS-4 agregados sin voided y etiqueta «anulado»', async () => {
    const p = await setup();
    const b = await ok(p);
    expect(b.games[3]).toEqual({
      game_id: 'big-o',
      current_streak: 0,
      max_streak: 3,
      played: 9,
      wins: 5,
      win_rate: 5 / 9,
      extra: { by_category: { nested_loops: { played: 9, correct: 5 } } },
    });
    expect(b.history[0]).toEqual({
      date: '2026-12-01',
      number: 8,
      game_id: 'big-o',
      status: 'voided',
      label: 'anulado',
    });
  });

  it('TS-5 etiqueta «voided» con ?lang=en y con players.locale en', async () => {
    const p = await setup();
    expect((await ok(p, '?lang=en')).history[0].label).toBe('voided');
    await dbs.owner.sql`DELETE FROM plays`;
    await dbs.owner.sql`DELETE FROM challenges`;
    clock('2026-12-02T10:00:00Z');
    const en = await dbs.insertPlayer({ locale: 'en' });
    await seed(en.id, [{ gameId: 'big-o', date: '2026-12-01', status: 'voided' }]);
    expect((await ok(en)).history[0].label).toBe('voided');
  });

  it('TS-6 Play voided sin result', async () => {
    clock('2026-12-02T10:00:00Z');
    const p = await dbs.insertPlayer();
    await seed(p.id, [{ gameId: 'devdle', date: '2026-12-01', status: 'voided', result: null }]);
    const b = await ok(p);
    expect(b.history).toEqual([
      { date: '2026-12-01', number: 8, game_id: 'devdle', status: 'voided', label: 'anulado' },
    ]);
    expect(b.heatmap).toEqual([{ date: '2026-12-01', completed: 1 }]);
  });

  it('TS-24 sin { es, en } ni payload en la respuesta', async () => {
    clock('2026-12-31T12:00:00Z');
    const p = await dbs.insertPlayer();
    await seed(
      p.id,
      ALL.map((gameId) => ({ gameId, date: '2026-12-30' })),
    );
    const text = JSON.stringify(await ok(p));
    expect(text).not.toContain('"payload"');
    expect(text).not.toContain('"es":');
    expect(text).not.toContain('"en":');
  });
});

describe('GET /api/me/stats: juegos (CA-3)', () => {
  const INITIAL = {
    devdle: { guesses: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 }, losses: 0 },
    'grep-grid': {
      words_found: Object.fromEntries(Array.from({ length: 9 }, (_, i) => [String(i), 0])),
    },
    timeline: { by_category: {} },
    'big-o': { by_category: {} },
    'bug-hunt': { by_language: {}, by_bug_type: {} },
  };
  const empty = (g: GameId) => ({
    game_id: g,
    current_streak: 0,
    max_streak: 0,
    played: 0,
    wins: 0,
    win_rate: null,
    extra: INITIAL[g],
  });

  it('TS-7 jugador nuevo sin filas', async () => {
    clock('2026-12-02T10:00:00Z');
    const p = await dbs.insertPlayer();
    expect(await ok(p)).toEqual({
      today: '2026-12-02',
      global: { current_streak: 0, max_streak: 0, total_completed: 0 },
      games: ALL.map(empty),
      heatmap: [],
      history: [],
      history_next_before: null,
    });
  });

  it('TS-8 solo un juego con datos: 5 juegos en orden de GAME_IDS', async () => {
    clock('2026-12-02T10:00:00Z');
    const p = await dbs.insertPlayer();
    await dbs.insertChallenge({ gameId: 'devdle', date: '2026-12-01', number: 8 });
    await dbs.insertGameStats({ playerId: p.id, ...devStats() });
    const b = await ok(p);
    expect(b.games.map((g: Json) => g.game_id)).toEqual(ALL);
    expect(b.games.slice(1)).toEqual(ALL.slice(1).map(empty));
  });
});

describe('GET /api/me/stats: heatmap e in_progress (CA-4)', () => {
  it('TS-9 heatmap solo completadas, rango [today-364, today], orden asc', async () => {
    clock('2026-12-02T10:00:00Z');
    const p = await dbs.insertPlayer();
    await seed(p.id, [
      { gameId: 'devdle', date: '2026-12-01' },
      { gameId: 'grep-grid', date: '2026-12-01', status: 'lost' },
      { gameId: 'timeline', date: '2026-12-01', status: 'voided' },
      { gameId: 'big-o', date: '2026-12-01', status: 'in_progress' },
      { gameId: 'devdle', date: '2026-11-15' },
      { gameId: 'devdle', date: '2025-12-03' },
      { gameId: 'devdle', date: '2025-12-02' },
    ]);
    const b = await ok(p);
    expect(b.heatmap).toEqual([
      { date: '2025-12-03', completed: 1 },
      { date: '2026-11-15', completed: 1 },
      { date: '2026-12-01', completed: 3 },
    ]);
    expect(b.history.some((h: Json) => h.status === 'in_progress')).toBe(false);
    expect(b.history.some((h: Json) => h.date === '2026-12-01' && h.game_id === 'big-o')).toBe(
      false,
    );
  });

  it('TS-10 Play in_progress de hoy fuera de historial y heatmap', async () => {
    clock('2026-12-02T10:00:00Z');
    const p = await dbs.insertPlayer();
    await seed(p.id, [{ gameId: 'big-o', date: '2026-12-02', status: 'in_progress' }]);
    const b = await ok(p);
    expect(b.heatmap).toEqual([]);
    expect(b.history).toEqual([]);
    expect(b.history_next_before).toBeNull();
  });
});

describe('GET /api/me/stats: paginación y etiquetas (CA-5)', () => {
  const full = (from: number, to: number) =>
    Array.from({ length: from - to + 1 }, (_, i) => day(from - i)).flatMap((date) =>
      ALL.map((gameId) => ({ gameId, date })),
    );
  const pairs = (rows: Json[]) => rows.map((r) => `${r.date}|${r.game_id}`);

  it('TS-11 día de 5 Play partido entre la fila 60 y la 61', async () => {
    clock('2026-12-31T12:00:00Z');
    const p = await dbs.insertPlayer();
    await seed(p.id, [
      { gameId: 'devdle', date: day(30) },
      { gameId: 'grep-grid', date: day(30) },
      ...full(29, 19),
      ...full(18, 18),
      ...ALL.slice(0, 3).map((gameId) => ({ gameId, date: day(17) })),
    ]);
    const a = await ok(p);
    expect(a.history).toHaveLength(57);
    expect(a.history[0]).toMatchObject({ date: '2026-12-30', game_id: 'devdle' });
    expect(a.history[56]).toMatchObject({ date: '2026-12-19', game_id: 'bug-hunt' });
    expect(a.history.some((h: Json) => h.date === '2026-12-18')).toBe(false);
    expect(a.history_next_before).toBe('2026-12-19');
    const b = await ok(p, '?history_before=2026-12-19');
    expect(b.history).toHaveLength(8);
    expect(b.history[0]).toMatchObject({ date: '2026-12-18', game_id: 'devdle' });
    expect(b.history[7]).toMatchObject({ date: '2026-12-17', game_id: 'timeline' });
    expect(b.history_next_before).toBeNull();
    const union = new Set([...pairs(a.history), ...pairs(b.history)]);
    expect(union.size).toBe(65);
  });

  it('TS-12 exactamente 60 Play: una sola página', async () => {
    clock('2026-12-31T12:00:00Z');
    const p = await dbs.insertPlayer();
    await seed(p.id, full(30, 19));
    const b = await ok(p);
    expect(b.history).toHaveLength(60);
    expect(b.history_next_before).toBeNull();
  });

  it('TS-13 61 Play con la 61 en otro día', async () => {
    clock('2026-12-31T12:00:00Z');
    const p = await dbs.insertPlayer();
    await seed(p.id, [...full(30, 19), { gameId: 'devdle', date: day(18) }]);
    const a = await ok(p);
    expect(a.history).toHaveLength(60);
    expect(a.history_next_before).toBe('2026-12-19');
    const b = await ok(p, '?history_before=2026-12-19');
    expect(b.history).toEqual([expect.objectContaining({ date: '2026-12-18', game_id: 'devdle' })]);
    expect(b.history_next_before).toBeNull();
  });

  it('TS-14 orden dentro del día = orden de GAME_IDS', async () => {
    clock('2026-12-02T10:00:00Z');
    const p = await dbs.insertPlayer();
    await seed(
      p.id,
      [...ALL].reverse().map((gameId) => ({ gameId, date: '2026-12-01' })),
    );
    expect((await ok(p)).history.map((h: Json) => h.game_id)).toEqual(ALL);
  });

  it('TS-15 etiquetas por juego con historyLabel', async () => {
    clock('2026-12-31T12:00:00Z');
    const p = await dbs.insertPlayer();
    await seed(p.id, [
      { gameId: 'devdle', date: day(30) },
      { gameId: 'grep-grid', date: day(30) },
      { gameId: 'timeline', date: day(30) },
      { gameId: 'big-o', date: day(30) },
      { gameId: 'bug-hunt', date: day(30) },
      { gameId: 'devdle', date: day(29), status: 'lost', result: DEVDLE_LOST },
      { gameId: 'big-o', date: day(29), status: 'lost', result: boResult(BO_LOST, 'es') },
    ]);
    const labels = Object.fromEntries(
      (await ok(p)).history.map((h: Json) => [`${h.date}|${h.game_id}`, h.label]),
    );
    expect(labels).toEqual({
      '2026-12-30|devdle': '✓ 1/6',
      '2026-12-29|devdle': '✗ X/6',
      '2026-12-30|grep-grid': '8/8',
      '2026-12-30|timeline': '5/5',
      '2026-12-30|big-o': '✓ O(n log n)',
      '2026-12-29|big-o': '✗',
      '2026-12-30|bug-hunt': '✓ L4',
    });
  });

  it('TS-22 history_before válido sin filas anteriores', async () => {
    clock('2026-12-02T10:00:00Z');
    const p = await dbs.insertPlayer();
    await seed(p.id, [{ gameId: 'devdle', date: '2026-12-01', status: 'voided', result: null }]);
    const base = await ok(p);
    const b = await ok(p, '?history_before=2026-11-01');
    expect(b.history).toEqual([]);
    expect(b.history_next_before).toBeNull();
    expect(b.global).toEqual(base.global);
    expect(b.games).toEqual(base.games);
    expect(b.heatmap).toEqual(base.heatmap);
  });
});

describe('GET /api/me/stats: today (CA-6)', () => {
  it('TS-16 a las 00:05 UTC el día nuevo es hoy', async () => {
    clock('2026-12-02T00:05:00Z');
    const p = await dbs.insertPlayer();
    await seed(p.id, [{ gameId: 'devdle', date: '2026-12-02' }]);
    await dbs.insertPlayerStats({
      playerId: p.id,
      globalStreak: 5,
      maxGlobalStreak: 5,
      lastActiveDate: '2026-12-02',
      totalCompleted: 5,
    });
    const b = await ok(p);
    expect(b.today).toBe('2026-12-02');
    expect(b.heatmap).toContainEqual({ date: '2026-12-02', completed: 1 });
    expect(b.global.current_streak).toBe(5);
    expect(b.history[0].date).toBe('2026-12-02');
  });

  it('TS-17 un segundo antes del cambio de día', async () => {
    clock('2026-12-01T23:59:59Z');
    const p = await dbs.insertPlayer();
    expect((await ok(p)).today).toBe('2026-12-01');
  });
});

describe('GET /api/me/stats: aislamiento y errores (CA-7)', () => {
  const setup = async () => {
    clock('2026-12-02T10:00:00Z');
    const a = await dbs.insertPlayer();
    const b = await dbs.insertPlayer();
    await seed(a.id, [{ gameId: 'devdle', date: '2026-12-01' }]);
    await dbs.insertPlayerStats({ playerId: a.id, totalCompleted: 1 });
    await seed(b.id, [
      { gameId: 'grep-grid', date: '2026-11-30', status: 'lost' },
      { gameId: 'timeline', date: '2026-11-30' },
    ]);
    await dbs.insertPlayerStats({ playerId: b.id, totalCompleted: 2 });
    return { a, b };
  };

  it('TS-18 cada jugador ve solo lo suyo', async () => {
    const { a, b } = await setup();
    const ra = await ok(a);
    expect(ra.history.map((h: Json) => [h.date, h.game_id])).toEqual([['2026-12-01', 'devdle']]);
    expect(ra.heatmap).toEqual([{ date: '2026-12-01', completed: 1 }]);
    expect(ra.global.total_completed).toBe(1);
    const rb = await ok(b);
    expect(rb.history.map((h: Json) => [h.date, h.game_id])).toEqual([
      ['2026-11-30', 'grep-grid'],
      ['2026-11-30', 'timeline'],
    ]);
    expect(rb.heatmap).toEqual([{ date: '2026-11-30', completed: 2 }]);
    expect(rb.global.total_completed).toBe(2);
  });

  it('TS-19 un player_id en la query se ignora', async () => {
    const { a, b } = await setup();
    expect(await ok(a, `?player_id=${b.id}`)).toEqual(await ok(a));
  });

  it('TS-20 sin sesión: 401 no_session', async () => {
    clock('2026-12-02T10:00:00Z');
    const bad = [null, { id: 'xyz' }, { id: randomUUID() }];
    for (const p of bad) {
      const { res, body } = await get(p);
      expect(res.status).toBe(401);
      expect(body).toEqual({ error: { code: 'no_session', message: 'No hay una sesión activa.' } });
    }
    expect((await get(null, '?history_before=x')).res.status).toBe(401);
  });

  it('TS-21 history_before inválido: 422', async () => {
    clock('2026-12-02T10:00:00Z');
    const p = await dbs.insertPlayer();
    for (const q of ['2026-13-01', 'ayer', '2026-12-1']) {
      const { res, body } = await get(p, `?history_before=${q}`);
      expect(res.status).toBe(422);
      expect(body).toEqual({ error: { code: 'validation_error', message: 'Datos inválidos.' } });
    }
  });

  it('TS-23 rate limit de lecturas por IP', async () => {
    const identity = { find: async () => null } as never;
    const { app } = buildTestApp({ identity });
    const headers = { 'x-forwarded-for': '9.9.9.9' };
    for (let i = 0; i < 600; i += 1) {
      expect((await app.request('/api/me/stats', { headers })).status).toBe(401);
    }
    const res = await app.request('/api/me/stats', { headers });
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('60');
    expect(await res.json()).toEqual({
      error: { code: 'rate_limited', message: 'Demasiadas solicitudes.' },
    });
  });
});
