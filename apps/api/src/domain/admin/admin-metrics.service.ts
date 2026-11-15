import { isStreakAlive, today } from '@nerdose/core';

import type { AdminRepository, RetentionRow } from '@/domain/admin/admin.repository';
import type { ProgressRepository } from '@/domain/progress/progress.repository';
import type { Clock } from '@/shared/clock';
import { shiftDay } from '@/shared/day';

import type { Metrics, StreakBucket } from './admin.types';

export const STREAK_BUCKETS: readonly StreakBucket[] = ['0', '1', '2-6', '7-29', '30+'];

type Repo = Pick<
  AdminRepository,
  | 'metricsDailyPlayers'
  | 'metricsRetention'
  | 'metricsStreakDistribution'
  | 'metricsChallengeQuality'
  | 'playsSummary'
>;

/** El día cohort+N terminó si es anterior a hoy (REQ-011, decisión 1). */
const dayEnded = (cohortDate: string, offset: number, day: string) =>
  shiftDay(cohortDate, offset) < day;

export class AdminMetricsService {
  constructor(
    private readonly deps: {
      repo: Repo;
      activeDays: Pick<ProgressRepository, 'prevActiveDays'>;
      clock: Clock;
    },
  ) {}

  currentDay(): string {
    return today(this.deps.clock.now());
  }

  async metrics(from: string, to: string, day: string): Promise<Metrics> {
    const { repo, activeDays } = this.deps;
    const [daily, cohorts, streaks, quality, totals, prev] = await Promise.all([
      repo.metricsDailyPlayers(from, to),
      repo.metricsRetention(from, to),
      repo.metricsStreakDistribution(),
      repo.metricsChallengeQuality(from, to),
      repo.playsSummary(from, to),
      activeDays.prevActiveDays(day),
    ]);

    const rate = (c: RetentionRow, offset: 1 | 7, players: number) =>
      c.cohortSize > 0 && dayEnded(c.cohortDate, offset, day) ? players / c.cohortSize : null;

    const weighted = (offset: 1 | 7, pick: (c: RetentionRow) => number) => {
      let num = 0;
      let den = 0;
      for (const c of cohorts) {
        if (!dayEnded(c.cohortDate, offset, day)) continue;
        num += pick(c);
        den += c.cohortSize;
      }
      return den === 0 ? null : num / den;
    };

    const counts = new Map<StreakBucket, number>(STREAK_BUCKETS.map((b) => [b, 0]));
    for (const r of streaks) {
      const bucket = isStreakAlive(r.lastActiveDate, prev.global, day) ? r.bucket : '0';
      counts.set(bucket, (counts.get(bucket) ?? 0) + r.players);
    }

    return {
      summary: {
        unique_players: totals.uniquePlayers,
        completed: totals.completed,
        d1: weighted(1, (c) => c.d1Players),
        d7: weighted(7, (c) => c.d7Players),
      },
      daily_players: daily.map((r) => ({ date: r.date, game_id: r.gameId, players: r.players })),
      retention: cohorts.map((c) => ({
        cohort_date: c.cohortDate,
        cohort_size: c.cohortSize,
        d1: rate(c, 1, c.d1Players),
        d7: rate(c, 7, c.d7Players),
      })),
      streak_distribution: STREAK_BUCKETS.map((bucket) => ({
        bucket,
        players: counts.get(bucket) ?? 0,
      })),
      challenge_quality: quality.map((q) => ({
        challenge_id: q.challengeId,
        game_id: q.gameId,
        date: q.date,
        number: q.number,
        started: q.started,
        finished: q.finished,
        completion_rate: q.completionRate,
        win_rate: q.winRate,
        reports: q.reports,
        status: q.status,
      })),
    };
  }
}
