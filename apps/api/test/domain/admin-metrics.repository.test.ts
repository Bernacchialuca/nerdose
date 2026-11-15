import type { GameId } from '@nerdose/core';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AdminRepository } from '@/domain/admin/admin.repository';

import { useDatabases } from '../helpers/db';

const dbs = useDatabases();
beforeAll(() => dbs.reset());
beforeEach(() => dbs.reset());
afterAll(() => dbs.close());

const repo = () => new AdminRepository(dbs.api.db);
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const at = (d: string) => new Date(`${d}T12:00:00Z`);

async function play(
  playerId: string,
  challenge: { id: string; gameId: GameId; date: string },
  status: 'won' | 'lost' | 'voided' | 'in_progress' = 'won',
) {
  return dbs.insertPlay({
    playerId,
    challengeId: challenge.id,
    gameId: challenge.gameId,
    date: challenge.date,
    state: {},
    status,
    ...(status === 'in_progress' ? {} : { result: {}, finishedAt: at(challenge.date) }),
  });
}

describe('AdminRepository (métricas)', () => {
  it('metricsDailyPlayers filtra [from, to] inclusive y ordena (S-053 TS-1)', async () => {
    const [a, b] = await dbs.insertPlayers(2);
    const days = ['2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03'];
    for (const d of days) {
      const dev = await dbs.insertChallenge({ gameId: 'devdle', date: d });
      const grep = await dbs.insertChallenge({ gameId: 'grep-grid', date: d });
      await play(a!.id, dev);
      await play(b!.id, dev);
      if (d === '2026-12-01') await play(a!.id, grep);
    }
    const rows = await repo().metricsDailyPlayers('2026-12-01', '2026-12-02');
    expect(rows).toEqual([
      { date: '2026-12-01', gameId: null, players: 2 },
      { date: '2026-12-01', gameId: 'devdle', players: 2 },
      { date: '2026-12-01', gameId: 'grep-grid', players: 1 },
      { date: '2026-12-02', gameId: null, players: 2 },
      { date: '2026-12-02', gameId: 'devdle', players: 2 },
    ]);
    for (const r of rows) expect(r.date).toMatch(DAY);
  });

  it('metricsRetention filtra por cohort_date y trae conteos (S-053 TS-2)', async () => {
    const ps = await dbs.insertPlayers(4);
    const dev = async (d: string) => dbs.insertChallenge({ gameId: 'devdle', date: d });
    const c1 = await dev('2026-12-01');
    const c2 = await dev('2026-12-02');
    const c8 = await dev('2026-12-08');
    const old = await dev('2026-11-20');
    for (const p of ps.slice(0, 3)) await play(p.id, c1);
    await play(ps[0]!.id, c2);
    await play(ps[1]!.id, c8);
    await play(ps[3]!.id, old);
    expect(await repo().metricsRetention('2026-12-01', '2026-12-05')).toEqual([
      { cohortDate: '2026-12-01', cohortSize: 3, d1Players: 1, d7Players: 1 },
    ]);
  });

  it('metricsStreakDistribution devuelve la racha guardada, incluso sin player_stats (S-053 TS-3)', async () => {
    const [p0, p3, p3b] = await dbs.insertPlayers(3);
    void p0;
    await dbs.insertPlayerStats({
      playerId: p3!.id,
      globalStreak: 3,
      maxGlobalStreak: 3,
      lastActiveDate: '2026-12-09',
    });
    await dbs.insertPlayerStats({
      playerId: p3b!.id,
      globalStreak: 4,
      maxGlobalStreak: 4,
      lastActiveDate: '2026-12-09',
    });
    const rows = await repo().metricsStreakDistribution();
    expect(rows).toHaveLength(2);
    expect(rows).toEqual(
      expect.arrayContaining([
        { bucket: '0', lastActiveDate: null, players: 1 },
        { bucket: '2-6', lastActiveDate: '2026-12-09', players: 2 },
      ]),
    );
  });

  it('metricsChallengeQuality filtra, ordena y excluye approved/rejected (S-053 TS-4)', async () => {
    await dbs.insertChallenge({ gameId: 'devdle', date: '2026-12-01' });
    await dbs.insertChallenge({ gameId: 'big-o', date: '2026-12-01' });
    await dbs.insertChallenge({ gameId: 'devdle', date: '2026-12-02' });
    await dbs.insertChallenge({ gameId: 'grep-grid', date: '2026-12-01', status: 'approved' });
    await dbs.insertChallenge({ gameId: 'timeline', date: '2026-12-02', status: 'rejected' });
    await dbs.insertChallenge({ gameId: 'devdle', date: '2026-11-30' });
    const rows = await repo().metricsChallengeQuality('2026-12-01', '2026-12-02');
    expect(rows.map((r) => [r.gameId, r.date])).toEqual([
      ['devdle', '2026-12-02'],
      ['devdle', '2026-12-01'],
      ['big-o', '2026-12-01'],
    ]);
    for (const r of rows) {
      expect(r.date).toMatch(DAY);
      expect(r).toMatchObject({
        started: 0,
        finished: 0,
        completionRate: null,
        winRate: null,
        reports: 0,
        status: 'published',
      });
    }
  });

  it('playsSummary cuenta únicos (cualquier status) y completadas (S-053 TS-5)', async () => {
    const [a, b, c] = await dbs.insertPlayers(3);
    const d1 = await dbs.insertChallenge({ gameId: 'devdle', date: '2026-12-01' });
    const g1 = await dbs.insertChallenge({ gameId: 'grep-grid', date: '2026-12-01' });
    const d2 = await dbs.insertChallenge({ gameId: 'devdle', date: '2026-12-02' });
    const d0 = await dbs.insertChallenge({ gameId: 'devdle', date: '2026-11-30' });
    await play(a!.id, d1, 'won');
    await play(a!.id, g1, 'in_progress');
    await play(b!.id, d2, 'voided');
    await play(c!.id, d0, 'lost');
    expect(await repo().playsSummary('2026-12-01', '2026-12-02')).toEqual({
      uniquePlayers: 2,
      completed: 2,
    });
    expect(await repo().playsSummary('2027-01-01', '2027-01-02')).toEqual({
      uniquePlayers: 0,
      completed: 0,
    });
  });
});
