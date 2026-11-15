import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { ProgressRepository } from '@/domain/progress/progress.repository';

import { useDatabases } from '../helpers/db';

const dbs = useDatabases();
beforeAll(() => dbs.reset());
beforeEach(() => dbs.reset());
afterAll(() => dbs.close());

const EXTRA = { guesses: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 }, losses: 0 };
const repo = () => new ProgressRepository(dbs.api.db);

describe('ProgressRepository (escrituras)', () => {
  it('TS-20 lockGameStats y lockPlayerStats crean con valores iniciales y no pisan', async () => {
    const player = await dbs.insertPlayer();
    await dbs.api.db.transaction(async (tx) => {
      const r = new ProgressRepository(tx);
      const gs = await r.lockGameStats(player.id, 'devdle', EXTRA);
      expect(gs).toMatchObject({
        currentStreak: 0,
        maxStreak: 0,
        played: 0,
        wins: 0,
        lastCompletedDate: null,
        extra: EXTRA,
      });
      const ps = await r.lockPlayerStats(player.id);
      expect(ps).toMatchObject({
        globalStreak: 0,
        maxGlobalStreak: 0,
        lastActiveDate: null,
        totalCompleted: 0,
      });
      await r.saveGameStats({ ...gs, played: 3, extra: { x: 1 } });
    });
    await dbs.api.db.transaction(async (tx) => {
      const gs = await new ProgressRepository(tx).lockGameStats(player.id, 'devdle', EXTRA);
      expect(gs.played).toBe(3);
      expect(gs.extra).toEqual({ x: 1 });
    });
  });

  it('saveGameStats y savePlayerStats actualizan solo la fila del jugador', async () => {
    const a = await dbs.insertPlayer();
    const b = await dbs.insertPlayer();
    for (const p of [a, b]) {
      await dbs.insertGameStats({ playerId: p.id, gameId: 'devdle', extra: EXTRA });
      await dbs.insertPlayerStats({ playerId: p.id });
    }
    await repo().saveGameStats({
      playerId: a.id,
      gameId: 'devdle',
      currentStreak: 2,
      maxStreak: 3,
      played: 4,
      wins: 3,
      lastCompletedDate: '2026-12-01',
      extra: EXTRA,
    });
    await repo().savePlayerStats({
      playerId: a.id,
      globalStreak: 2,
      maxGlobalStreak: 3,
      lastActiveDate: '2026-12-01',
      totalCompleted: 4,
    });
    const gs = await dbs.owner.sql`SELECT player_id, played FROM player_game_stats`;
    expect(gs.find((r) => r.player_id === a.id)!.played).toBe(4);
    expect(gs.find((r) => r.player_id === b.id)!.played).toBe(0);
    const ps = await dbs.owner.sql`SELECT player_id, total_completed FROM player_stats`;
    expect(ps.find((r) => r.player_id === a.id)!.total_completed).toBe(4);
    expect(ps.find((r) => r.player_id === b.id)!.total_completed).toBe(0);
  });
});

describe('ProgressRepository (lecturas de stats)', () => {
  const play = (
    playerId: string,
    c: { id: string },
    gameId: 'devdle' | 'grep-grid' | 'timeline' | 'big-o' | 'bug-hunt',
    date: string,
    status: 'won' | 'lost' | 'voided' | 'in_progress',
  ) => ({
    playerId,
    challengeId: c.id,
    gameId,
    date,
    state: {},
    status,
    ...(status === 'in_progress'
      ? {}
      : { result: { k: 1 }, finishedAt: new Date(`${date}T12:00:00Z`) }),
  });
  const ch = (
    gameId: 'devdle' | 'grep-grid' | 'timeline' | 'big-o' | 'bug-hunt',
    date: string,
    number = 1,
    extra = {},
  ) => dbs.insertChallenge({ gameId, date, number, ...extra });
  const voidedExtra = {
    status: 'voided',
    voidReason: 'x',
    voidedAt: new Date('2026-12-02T00:00:00Z'),
  };

  it('TS-27 heatmap: cuenta completadas por día, rango inclusivo y solo del jugador', async () => {
    const a = await dbs.insertPlayer();
    const b = await dbs.insertPlayer();
    const d1 = await ch('devdle', '2026-12-01');
    const g1 = await ch('grep-grid', '2026-12-01');
    const v = await ch('devdle', '2026-11-30', 1, voidedExtra);
    const t = await ch('timeline', '2026-11-30');
    const old = await ch('devdle', '2026-11-01');
    await dbs.insertPlays([
      play(a.id, d1, 'devdle', '2026-12-01', 'won'),
      play(a.id, g1, 'grep-grid', '2026-12-01', 'won'),
      play(a.id, v, 'devdle', '2026-11-30', 'voided'),
      play(a.id, t, 'timeline', '2026-11-30', 'in_progress'),
      play(a.id, old, 'devdle', '2026-11-01', 'lost'),
      play(b.id, d1, 'devdle', '2026-12-01', 'won'),
    ]);
    expect(await repo().heatmap(a.id, '2026-11-02', '2026-12-02')).toEqual([
      { date: '2026-11-30', completed: 1 },
      { date: '2026-12-01', completed: 2 },
    ]);
  });

  it('TS-28 historyPage: orden, number del challenge, cursor estricto y limit', async () => {
    const a = await dbs.insertPlayer();
    const d = await ch('devdle', '2026-12-01', 8);
    const bo = await ch('big-o', '2026-12-01', 8, voidedExtra);
    const g = await ch('grep-grid', '2026-11-30', 7);
    const ip = await ch('timeline', '2026-11-29', 6);
    await dbs.insertPlays([
      play(a.id, bo, 'big-o', '2026-12-01', 'voided'),
      play(a.id, g, 'grep-grid', '2026-11-30', 'lost'),
      play(a.id, d, 'devdle', '2026-12-01', 'won'),
      play(a.id, ip, 'timeline', '2026-11-29', 'in_progress'),
    ]);
    const all = await repo().historyPage(a.id, null, 61);
    expect(all.map((r) => [r.date, r.number, r.gameId, r.status])).toEqual([
      ['2026-12-01', 8, 'devdle', 'won'],
      ['2026-12-01', 8, 'big-o', 'voided'],
      ['2026-11-30', 7, 'grep-grid', 'lost'],
    ]);
    expect(all[0]!.result).toEqual({ k: 1 });
    const before = await repo().historyPage(a.id, '2026-12-01', 61);
    expect(before.map((r) => r.date)).toEqual(['2026-11-30']);
    expect(await repo().historyPage(a.id, null, 2)).toHaveLength(2);
  });
});
