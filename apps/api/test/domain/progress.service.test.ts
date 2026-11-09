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
