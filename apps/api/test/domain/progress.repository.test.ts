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
