import { describe, expect, it } from 'vitest';

import { AdminMetricsService } from '@/domain/admin/admin-metrics.service';
import type {
  ChallengeQualityRow,
  DailyPlayersRow,
  RetentionRow,
  StreakRow,
} from '@/domain/admin/admin.repository';

type Fakes = {
  daily?: DailyPlayersRow[];
  cohorts?: RetentionRow[];
  streaks?: StreakRow[];
  quality?: ChallengeQualityRow[];
  totals?: { uniquePlayers: number; completed: number };
  prevGlobal?: string | null;
};

function build(f: Fakes = {}) {
  const calls: string[] = [];
  const svc = new AdminMetricsService({
    repo: {
      metricsDailyPlayers: async () => f.daily ?? [],
      metricsRetention: async () => f.cohorts ?? [],
      metricsStreakDistribution: async () => f.streaks ?? [],
      metricsChallengeQuality: async () => f.quality ?? [],
      playsSummary: async () => f.totals ?? { uniquePlayers: 0, completed: 0 },
    },
    activeDays: {
      prevActiveDays: async (day) => {
        calls.push(day);
        return { byGame: {}, global: f.prevGlobal ?? null };
      },
    },
    clock: { now: () => new Date('2026-12-01T23:59:59Z') },
  });
  return { svc, calls };
}

const cohort = (d1Players: number, d7Players: number): RetentionRow => ({
  cohortDate: '2026-12-01',
  cohortSize: 100,
  d1Players,
  d7Players,
});

describe('AdminMetricsService', () => {
  it('currentDay usa el reloj inyectado', () => {
    expect(build().svc.currentDay()).toBe('2026-12-01');
  });

  it('d1/d7 de una cohorte con hoy a mitad de camino (S-053 TS-6)', async () => {
    const { svc } = build({ cohorts: [cohort(40, 0)] });
    const r = await svc.metrics('2026-12-01', '2026-12-01', '2026-12-05');
    expect(r.retention).toEqual([
      { cohort_date: '2026-12-01', cohort_size: 100, d1: 0.4, d7: null },
    ]);
  });

  it('borde de "el día +N terminó" (S-053 TS-7)', async () => {
    const { svc } = build({ cohorts: [cohort(40, 25)] });
    const at = async (today: string) =>
      (await svc.metrics('2026-12-01', '2026-12-01', today)).retention[0];
    expect(await at('2026-12-02')).toMatchObject({ d1: null, d7: null });
    expect(await at('2026-12-03')).toMatchObject({ d1: 0.4, d7: null });
    expect(await at('2026-12-08')).toMatchObject({ d1: 0.4, d7: null });
    expect(await at('2026-12-09')).toMatchObject({ d1: 0.4, d7: 0.25 });
  });

  it('tramos vivos con días neutros (S-053 TS-8)', async () => {
    const { svc, calls } = build({
      prevGlobal: '2026-12-07',
      streaks: [
        { bucket: '0', lastActiveDate: null, players: 1 },
        { bucket: '1', lastActiveDate: '2026-12-07', players: 1 },
        { bucket: '2-6', lastActiveDate: '2026-12-10', players: 1 },
        { bucket: '7-29', lastActiveDate: '2026-12-07', players: 1 },
        { bucket: '30+', lastActiveDate: '2026-12-07', players: 1 },
        { bucket: '2-6', lastActiveDate: '2026-12-05', players: 2 },
      ],
    });
    const r = await svc.metrics('2026-12-01', '2026-12-10', '2026-12-10');
    expect(r.streak_distribution).toEqual([
      { bucket: '0', players: 3 },
      { bucket: '1', players: 1 },
      { bucket: '2-6', players: 1 },
      { bucket: '7-29', players: 1 },
      { bucket: '30+', players: 1 },
    ]);
    expect(calls).toEqual(['2026-12-10']);
  });

  it('siempre 5 tramos en orden (S-053 TS-9)', async () => {
    const zeros = ['0', '1', '2-6', '7-29', '30+'].map((bucket) => ({ bucket, players: 0 }));
    const empty = await build().svc.metrics('2026-12-01', '2026-12-10', '2026-12-10');
    expect(empty.streak_distribution).toEqual(zeros);
    const one = await build({
      streaks: [{ bucket: '30+', lastActiveDate: '2026-12-10', players: 2 }],
    }).svc.metrics('2026-12-01', '2026-12-10', '2026-12-10');
    expect(one.streak_distribution).toEqual(
      zeros.map((z) => (z.bucket === '30+' ? { ...z, players: 2 } : z)),
    );
  });

  it('summary ponderado por cohort_size (S-053 TS-10)', async () => {
    const { svc } = build({
      cohorts: [
        { cohortDate: '2026-12-01', cohortSize: 100, d1Players: 40, d7Players: 10 },
        { cohortDate: '2026-12-02', cohortSize: 50, d1Players: 5, d7Players: 5 },
        { cohortDate: '2026-12-09', cohortSize: 20, d1Players: 0, d7Players: 0 },
      ],
      totals: { uniquePlayers: 170, completed: 400 },
    });
    const r = await svc.metrics('2026-12-01', '2026-12-09', '2026-12-10');
    expect(r.summary.unique_players).toBe(170);
    expect(r.summary.completed).toBe(400);
    expect(r.summary.d1).toBeCloseTo(0.3, 10);
    expect(r.summary.d7).toBeCloseTo(0.1, 10);
    expect(r.retention[2]).toEqual({
      cohort_date: '2026-12-09',
      cohort_size: 20,
      d1: null,
      d7: null,
    });
  });

  it('summary sin cohortes con valor (S-053 TS-11)', async () => {
    const a = await build({
      cohorts: [{ cohortDate: '2026-12-01', cohortSize: 10, d1Players: 3, d7Players: 0 }],
      totals: { uniquePlayers: 10, completed: 10 },
    }).svc.metrics('2026-12-01', '2026-12-01', '2026-12-02');
    expect(a.summary).toEqual({ unique_players: 10, completed: 10, d1: null, d7: null });
    const b = await build().svc.metrics('2026-12-01', '2026-12-01', '2026-12-02');
    expect(b.summary).toEqual({ unique_players: 0, completed: 0, d1: null, d7: null });
  });

  it('mapea a snake_case daily_players y challenge_quality (S-053 TS-12)', async () => {
    const { svc } = build({
      daily: [{ date: '2026-12-01', gameId: null, players: 3 }],
      quality: [
        {
          challengeId: 'c1',
          gameId: 'big-o',
          date: '2026-12-01',
          number: 8,
          started: 4,
          finished: 2,
          completionRate: 0.5,
          winRate: 0.5,
          reports: 1,
          status: 'published',
        },
      ],
    });
    const r = await svc.metrics('2026-12-01', '2026-12-01', '2026-12-02');
    expect(r.daily_players).toEqual([{ date: '2026-12-01', game_id: null, players: 3 }]);
    expect(r.challenge_quality).toEqual([
      {
        challenge_id: 'c1',
        game_id: 'big-o',
        date: '2026-12-01',
        number: 8,
        started: 4,
        finished: 2,
        completion_rate: 0.5,
        win_rate: 0.5,
        reports: 1,
        status: 'published',
      },
    ]);
    expect(Object.keys(r).sort()).toEqual([
      'challenge_quality',
      'daily_players',
      'retention',
      'streak_distribution',
      'summary',
    ]);
  });
});
