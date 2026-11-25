import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import type { GameId } from '@nerdose/core';
import { devdle, scoreGuess } from '@nerdose/game-devdle/definition';
import { grepGrid } from '@nerdose/game-grep-grid/definition';
import { timeline } from '@nerdose/game-timeline/definition';

import { MyStatsService } from '@/domain/progress/my-stats.service';
import { ProgressRepository } from '@/domain/progress/progress.repository';
import { games } from '@/games/registry';

import { boResult, WON_JAVA as BO_WON } from '../helpers/big-o';
import { bhResult, WON_JAVA as BH_WON } from '../helpers/bug-hunt';
import { PAYLOAD, useDatabases } from '../helpers/db';
import { found, GG_PAYLOAD, SEVEN } from '../helpers/grep-grid';
import { CORRECT, TL_PAYLOAD } from '../helpers/timeline';

const dbs = useDatabases();
beforeAll(() => dbs.reset());
beforeEach(() => dbs.reset());
afterAll(() => dbs.close());

const svc = (now = '2026-12-02T00:05:00Z') =>
  new MyStatsService({
    repo: new ProgressRepository(dbs.api.db),
    games,
    clock: { now: () => new Date(now) },
  });

type Status = 'won' | 'lost' | 'voided' | 'in_progress';
const ALL: GameId[] = ['devdle', 'grep-grid', 'timeline', 'big-o', 'bug-hunt'];
const LAUNCH = Date.parse('2026-11-24T00:00:00Z');
const numberOf = (date: string) =>
  Math.max(1, Math.round((Date.parse(`${date}T00:00:00Z`) - LAUNCH) / 86_400_000) + 1);
const day = (n: number) => `2026-12-${String(n).padStart(2, '0')}`;

const EXTRA_DEVDLE = { guesses: { '1': 0, '2': 3, '3': 2, '4': 2, '5': 1, '6': 0 }, losses: 2 };
const DEVDLE_WON = devdle.result(
  PAYLOAD as never,
  { guesses: [{ guess: 'MERGE', marks: scoreGuess('MERGE', 'MERGE') }] } as never,
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
  const rows = [];
  for (const e of entries) {
    const status = e.status ?? 'won';
    const c = await dbs.insertChallenge({
      gameId: e.gameId,
      date: e.date,
      number: numberOf(e.date),
      ...(status === 'voided'
        ? { status: 'voided', voidReason: 'x', voidedAt: new Date(`${e.date}T00:00:00Z`) }
        : {}),
    });
    rows.push({
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
  await dbs.insertPlays(rows as never);
}

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

describe('MyStatsService', () => {
  it('currentDay usa el reloj inyectado', () => {
    expect(svc().currentDay()).toBe('2026-12-02');
  });

  it('TS-1 racha global y por juego vivas', async () => {
    const p = await dbs.insertPlayer();
    await dbs.insertChallenge({ gameId: 'devdle', date: '2026-12-01', number: 8 });
    await dbs.insertPlayerStats({ playerId: p.id, ...pStats() });
    await dbs.insertGameStats({ playerId: p.id, ...devStats() });
    const r = await svc().myStats(p.id, '2026-12-02', 'es', null);
    expect(r.today).toBe('2026-12-02');
    expect(r.global).toEqual({ current_streak: 4, max_streak: 9, total_completed: 20 });
    expect(r.games[0]).toEqual({
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
    const p = await dbs.insertPlayer();
    for (const d of ['2026-11-28', '2026-11-30', '2026-12-01'])
      await dbs.insertChallenge({ gameId: 'devdle', date: d, number: numberOf(d) });
    await dbs.insertPlayerStats({ playerId: p.id, ...pStats({ lastActiveDate: '2026-11-28' }) });
    await dbs.insertGameStats({ playerId: p.id, ...devStats({ lastCompletedDate: '2026-11-28' }) });
    const r = await svc().myStats(p.id, '2026-12-02', 'es', null);
    expect(r.global).toEqual({ current_streak: 0, max_streak: 9, total_completed: 20 });
    expect(r.games[0]).toMatchObject({
      game_id: 'devdle',
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
    const r = await svc().myStats(p.id, '2026-12-02', 'es', null);
    expect(r.games[2]).toMatchObject({
      game_id: 'timeline',
      current_streak: 2,
      max_streak: 2,
      played: 2,
      wins: 1,
      win_rate: 0.5,
    });
    expect(r.global.current_streak).toBe(2);
  });

  it('TS-4 Big O con una anulada: agregados sin voided y etiqueta «anulado»', async () => {
    const p = await dbs.insertPlayer({ locale: 'es' });
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
    const r = await svc().myStats(p.id, '2026-12-02', 'es', null);
    expect(r.games[3]).toEqual({
      game_id: 'big-o',
      current_streak: 0,
      max_streak: 3,
      played: 9,
      wins: 5,
      win_rate: 0.5555555555555556,
      extra: { by_category: { nested_loops: { played: 9, correct: 5 } } },
    });
    expect(r.history[0]).toEqual({
      date: '2026-12-01',
      number: 8,
      game_id: 'big-o',
      status: 'voided',
      label: 'anulado',
    });
  });

  it('TS-6 Play voided sin result (acknowledge-void)', async () => {
    const p = await dbs.insertPlayer();
    await seed(p.id, [{ gameId: 'devdle', date: '2026-12-01', status: 'voided', result: null }]);
    const r = await svc().myStats(p.id, '2026-12-02', 'es', null);
    expect(r.history).toEqual([
      { date: '2026-12-01', number: 8, game_id: 'devdle', status: 'voided', label: 'anulado' },
    ]);
    expect(r.heatmap).toEqual([{ date: '2026-12-01', completed: 1 }]);
  });

  it('TS-7 jugador nuevo sin filas', async () => {
    const p = await dbs.insertPlayer();
    expect(await svc().myStats(p.id, '2026-12-02', 'es', null)).toEqual({
      today: '2026-12-02',
      global: { current_streak: 0, max_streak: 0, total_completed: 0 },
      games: ALL.map(empty),
      heatmap: [],
      history: [],
      history_next_before: null,
    });
  });

  it('TS-8 solo un juego con datos: 5 juegos en orden de GAME_IDS', async () => {
    const p = await dbs.insertPlayer();
    await dbs.insertChallenge({ gameId: 'devdle', date: '2026-12-01', number: 8 });
    await dbs.insertPlayerStats({ playerId: p.id, ...pStats() });
    await dbs.insertGameStats({ playerId: p.id, ...devStats() });
    const r = await svc().myStats(p.id, '2026-12-02', 'es', null);
    expect(r.games.map((g) => g.game_id)).toEqual(ALL);
    expect(r.games.slice(1)).toEqual(ALL.slice(1).map(empty));
  });

  it('TS-9 heatmap solo completadas, rango [today-364, today], orden asc', async () => {
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
    const r = await svc().myStats(p.id, '2026-12-02', 'es', null);
    expect(r.heatmap).toEqual([
      { date: '2025-12-03', completed: 1 },
      { date: '2026-11-15', completed: 1 },
      { date: '2026-12-01', completed: 3 },
    ]);
    expect(r.history.some((h) => (h.status as string) === 'in_progress')).toBe(false);
    expect(r.history.some((h) => h.date === '2026-12-01' && h.game_id === 'big-o')).toBe(false);
  });

  it('TS-11 paginación a nivel servicio: día partido entre la fila 60 y la 61', async () => {
    const p = await dbs.insertPlayer();
    const full = (from: number, to: number) =>
      Array.from({ length: from - to + 1 }, (_, i) => day(from - i)).flatMap((date) =>
        ALL.map((gameId) => ({ gameId, date })),
      );
    await seed(p.id, [
      { gameId: 'devdle', date: day(30) },
      { gameId: 'grep-grid', date: day(30) },
      ...full(29, 19),
      ...full(18, 18),
      ...ALL.slice(0, 3).map((gameId) => ({ gameId, date: day(17) })),
    ]);
    const a = await svc().myStats(p.id, '2026-12-31', 'es', null);
    expect(a.history).toHaveLength(57);
    expect(a.history[0]).toMatchObject({ date: '2026-12-30', game_id: 'devdle' });
    expect(a.history[56]).toMatchObject({ date: '2026-12-19', game_id: 'bug-hunt' });
    expect(a.history.some((h) => h.date === '2026-12-18')).toBe(false);
    expect(a.history_next_before).toBe('2026-12-19');
    const b = await svc().myStats(p.id, '2026-12-31', 'es', '2026-12-19');
    expect(b.history).toHaveLength(8);
    expect(b.history[0]).toMatchObject({ date: '2026-12-18', game_id: 'devdle' });
    expect(b.history[7]).toMatchObject({ date: '2026-12-17', game_id: 'timeline' });
    expect(b.history_next_before).toBeNull();
    const keys = [...a.history, ...b.history].map((h) => `${h.date}|${h.game_id}`);
    expect(new Set(keys).size).toBe(65);
  });
});
