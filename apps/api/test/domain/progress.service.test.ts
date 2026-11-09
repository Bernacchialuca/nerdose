import { devdle } from '@nerdose/game-devdle/definition';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { ProgressRepository } from '@/domain/progress/progress.repository';
import { ProgressService } from '@/domain/progress/progress.service';

import { useDatabases } from '../helpers/db';

const dbs = useDatabases();
beforeAll(() => dbs.reset());
beforeEach(() => dbs.reset());
afterAll(() => dbs.close());

const service = () => new ProgressService({ repo: new ProgressRepository(dbs.api.db) });
const EXTRA = { guesses: { '1': 0, '2': 3, '3': 2, '4': 2, '5': 1, '6': 0 }, losses: 2 };

async function seed(lastCompleted: string, globalLast = lastCompleted) {
  const player = await dbs.insertPlayer();
  await dbs.insertGameStats({
    playerId: player.id,
    gameId: 'devdle',
    currentStreak: 3,
    maxStreak: 5,
    played: 10,
    wins: 8,
    lastCompletedDate: lastCompleted,
    extra: EXTRA,
  });
  await dbs.insertPlayerStats({
    playerId: player.id,
    globalStreak: 4,
    maxGlobalStreak: 9,
    lastActiveDate: globalLast,
    totalCompleted: 20,
  });
  return player;
}

const unchanged = async (playerId: string) => {
  const [g] = await dbs.owner
    .sql`SELECT current_streak FROM player_game_stats WHERE player_id = ${playerId}`;
  const [p] = await dbs.owner
    .sql`SELECT global_streak FROM player_stats WHERE player_id = ${playerId}`;
  expect([g!.current_streak, p!.global_streak]).toEqual([3, 4]);
};

describe('ProgressRepository.prevActiveDays', () => {
  it('solo cuenta published/voided anteriores al día', async () => {
    await dbs.insertChallenge({ gameId: 'devdle', date: '2026-11-29', status: 'published' });
    await dbs.insertChallenge({ gameId: 'devdle', date: '2026-11-30', status: 'approved' });
    await dbs.insertChallenge({
      gameId: 'big-o',
      date: '2026-11-30',
      status: 'voided',
      voidReason: 'x',
      voidedAt: new Date('2026-11-30T10:00:00Z'),
    });
    await dbs.insertChallenge({ gameId: 'devdle', date: '2026-12-01', status: 'published' });
    expect(await new ProgressRepository(dbs.api.db).prevActiveDays('2026-12-01')).toEqual({
      byGame: { devdle: '2026-11-29', 'big-o': '2026-11-30' },
      global: '2026-11-30',
    });
  });

  it('sin challenges: global null', async () => {
    expect(await new ProgressRepository(dbs.api.db).prevActiveDays('2026-12-01')).toEqual({
      byGame: {},
      global: null,
    });
  });
});

describe('ProgressService', () => {
  it('TS-23 gameStatsView sin fila: ceros e initialStats', async () => {
    const player = await dbs.insertPlayer();
    expect(await service().gameStatsView(player.id, devdle, '2026-12-01')).toEqual({
      game_id: 'devdle',
      current_streak: 0,
      max_streak: 0,
      played: 0,
      wins: 0,
      win_rate: null,
      extra: { guesses: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 }, losses: 0 },
    });
  });

  it('gameStatsView con fila viva', async () => {
    const player = await seed('2026-12-01');
    expect(await service().gameStatsView(player.id, devdle, '2026-12-01')).toEqual({
      game_id: 'devdle',
      current_streak: 3,
      max_streak: 5,
      played: 10,
      wins: 8,
      win_rate: 0.8,
      extra: EXTRA,
    });
  });

  it('TS-24 racha no viva: 0 sin escribir', async () => {
    const player = await seed('2026-11-29');
    await dbs.insertChallenge({ gameId: 'devdle', date: '2026-11-30', status: 'published' });
    const view = await service().gameStatsView(player.id, devdle, '2026-12-01');
    expect([view.current_streak, view.max_streak]).toEqual([0, 5]);
    await unchanged(player.id);
  });

  it('TS-46 racha no viva se muestra en 0 (juego y global)', async () => {
    const player = await seed('2026-11-29');
    await dbs.insertChallenge({ gameId: 'devdle', date: '2026-11-30', status: 'published' });
    const r = await service().todayStreaks(player.id, '2026-12-01');
    expect(r.byGame.devdle).toBe(0);
    expect(r.global).toEqual({ current: 0, max: 9 });
    await unchanged(player.id);
  });

  it('TS-47 un día neutro no corta la racha', async () => {
    const player = await seed('2026-11-29');
    await dbs.insertChallenge({ gameId: 'devdle', date: '2026-11-29', status: 'published' });
    const r = await service().todayStreaks(player.id, '2026-12-01');
    expect(r.byGame.devdle).toBe(3);
    expect(r.global.current).toBe(4);
  });

  it('TS-48 la racha global usa el último día activo de cualquier juego', async () => {
    const player = await seed('2026-11-29');
    await dbs.insertChallenge({ gameId: 'devdle', date: '2026-11-29', status: 'published' });
    await dbs.insertChallenge({ gameId: 'big-o', date: '2026-11-30', status: 'published' });
    const r = await service().todayStreaks(player.id, '2026-12-01');
    expect(r.byGame.devdle).toBe(3);
    expect(r.global.current).toBe(0);
  });

  it('todayStreaks sin filas: ceros', async () => {
    const player = await dbs.insertPlayer();
    expect(await service().todayStreaks(player.id, '2026-12-01')).toEqual({
      byGame: {},
      global: { current: 0, max: 0 },
    });
  });
});

describe('ProgressService.applyResult (unit)', () => {
  const INITIAL = { guesses: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 }, losses: 0 };
  const G_MERGE = { guess: 'MERGE', marks: Array(5).fill('correct') };
  const PAYLOAD_U = {
    term_id: 't',
    word: 'MERGE',
    category: 'git',
    definition: { es: 'd', en: 'd' },
    summary: { es: 's', en: 's' },
    date: '2026-12-01',
  };

  function fakeRepo(opts: {
    gs?: Partial<Record<string, unknown>>;
    ps?: Partial<Record<string, unknown>>;
    prev?: { byGame: Record<string, string>; global: string | null };
  }) {
    const saved: { game?: Record<string, unknown>; player?: Record<string, unknown> } = {};
    const repo = {
      prevActiveDays: async () => opts.prev ?? { byGame: {}, global: null },
      lockGameStats: async () => ({
        playerId: 'p',
        gameId: 'devdle',
        currentStreak: 0,
        maxStreak: 0,
        played: 0,
        wins: 0,
        lastCompletedDate: null,
        extra: INITIAL,
        ...opts.gs,
      }),
      lockPlayerStats: async () => ({
        playerId: 'p',
        globalStreak: 0,
        maxGlobalStreak: 0,
        lastActiveDate: null,
        totalCompleted: 0,
        ...opts.ps,
      }),
      saveGameStats: async (r: Record<string, unknown>) => void (saved.game = r),
      savePlayerStats: async (r: Record<string, unknown>) => void (saved.player = r),
    };
    return { repo: repo as never, saved };
  }
  const svc = () => new ProgressService({ repo: {} as never });
  const run = (
    f: ReturnType<typeof fakeRepo>,
    outcome: Parameters<ProgressService['applyResult']>[1]['outcome'],
    date = '2026-12-01',
  ) => svc().applyResult(f.repo, { playerId: 'p', game: devdle as never, date, outcome });
  const won = (n: number) => ({
    status: 'won' as const,
    result: devdle.result(
      PAYLOAD_U as never,
      {
        guesses: Array(n - 1)
          .fill({ guess: 'REACT', marks: [] })
          .concat(G_MERGE),
      } as never,
      'es',
    ),
  });

  it('TS-17 voided: rachas y total_completed, sin played, wins ni extra', async () => {
    const f = fakeRepo({
      gs: {
        currentStreak: 2,
        maxStreak: 2,
        played: 4,
        wins: 3,
        lastCompletedDate: '2026-11-30',
      },
      ps: {
        globalStreak: 2,
        maxGlobalStreak: 2,
        lastActiveDate: '2026-11-30',
        totalCompleted: 4,
      },
      prev: { byGame: { devdle: '2026-11-30' }, global: '2026-11-30' },
    });
    const res = await run(f, { status: 'voided' });
    expect(f.saved.game).toEqual({
      playerId: 'p',
      gameId: 'devdle',
      currentStreak: 3,
      maxStreak: 3,
      played: 4,
      wins: 3,
      lastCompletedDate: '2026-12-01',
      extra: INITIAL,
    });
    expect(f.saved.player).toEqual({
      playerId: 'p',
      globalStreak: 3,
      maxGlobalStreak: 3,
      lastActiveDate: '2026-12-01',
      totalCompleted: 5,
    });
    expect(res.streaks).toEqual({
      game: { current: 3, max: 3 },
      global: { current: 3, max: 3 },
    });
  });

  it('TS-18 won después de un voided reconocido', async () => {
    const f = fakeRepo({
      gs: { currentStreak: 2, maxStreak: 2, played: 4, wins: 3, lastCompletedDate: '2026-11-30' },
      ps: { globalStreak: 2, maxGlobalStreak: 2, lastActiveDate: '2026-11-30', totalCompleted: 4 },
      prev: { byGame: { devdle: '2026-11-30' }, global: '2026-11-30' },
    });
    const res = await run(f, won(1));
    expect(f.saved.game).toMatchObject({ currentStreak: 3, played: 5, wins: 4 });
    expect((res.gameStats.extra as typeof INITIAL).guesses['1']).toBe(1);
  });

  it('TS-19 mismo día: la racha no cambia pero played suma', async () => {
    const f = fakeRepo({
      gs: { currentStreak: 4, maxStreak: 4, lastCompletedDate: '2026-12-01' },
      prev: { byGame: { devdle: '2026-11-30' }, global: '2026-11-30' },
    });
    await run(f, won(2));
    expect(f.saved.game).toMatchObject({ currentStreak: 4, played: 1 });
  });

  it('sin filas previas: 1/1', async () => {
    const f = fakeRepo({});
    const res = await run(f, won(3));
    expect(res.streaks).toEqual({ game: { current: 1, max: 1 }, global: { current: 1, max: 1 } });
  });

  it('corta: lastCompleted < prevActiveDay reinicia en 1 y conserva el máximo', async () => {
    const f = fakeRepo({
      gs: { currentStreak: 5, maxStreak: 5, played: 5, wins: 5, lastCompletedDate: '2026-11-29' },
      ps: { globalStreak: 5, maxGlobalStreak: 7, lastActiveDate: '2026-11-29', totalCompleted: 9 },
      prev: { byGame: { devdle: '2026-11-30' }, global: '2026-11-30' },
    });
    const res = await run(f, won(3));
    expect(res.streaks).toEqual({ game: { current: 1, max: 5 }, global: { current: 1, max: 7 } });
  });

  it('día neutro: continúa; prevActiveDay null con lastCompleted no nulo suma', async () => {
    const neutral = fakeRepo({
      gs: { currentStreak: 5, maxStreak: 5, played: 5, wins: 5, lastCompletedDate: '2026-11-29' },
      ps: { globalStreak: 5, maxGlobalStreak: 7, lastActiveDate: '2026-11-29', totalCompleted: 9 },
      prev: { byGame: { devdle: '2026-11-29' }, global: '2026-11-29' },
    });
    expect((await run(neutral, won(3))).streaks).toEqual({
      game: { current: 6, max: 6 },
      global: { current: 6, max: 7 },
    });
    const nullPrev = fakeRepo({
      gs: { currentStreak: 1, maxStreak: 1, lastCompletedDate: '2026-11-20' },
      ps: { globalStreak: 1, maxGlobalStreak: 1, lastActiveDate: '2026-11-20' },
    });
    expect((await run(nullPrev, won(3))).streaks.game.current).toBe(2);
  });

  it('lost: wins igual, losses + 1 y win_rate correcto', async () => {
    const f = fakeRepo({ gs: { played: 4, wins: 3, extra: INITIAL } });
    const res = await run(f, {
      status: 'lost',
      result: devdle.result(
        PAYLOAD_U as never,
        {
          guesses: Array(6).fill({
            guess: 'REACT',
            marks: ['absent', 'absent', 'absent', 'absent', 'absent'],
          }),
        } as never,
        'es',
      ),
    });
    expect(res.gameStats).toMatchObject({ played: 5, wins: 3, win_rate: 3 / 5 });
    expect((res.gameStats.extra as typeof INITIAL).losses).toBe(1);
  });

  it('won con score 4 suma guesses["4"]', async () => {
    const f = fakeRepo({});
    const res = await run(f, won(4));
    expect((res.gameStats.extra as typeof INITIAL).guesses['4']).toBe(1);
    expect(res.gameStats.win_rate).toBe(1);
  });
});
