import type { GameId } from '@nerdose/core';

import type { ChallengeStatus } from '@/modules/reports';

export type MetricsSummary = {
  unique_players: number;
  completed: number;
  d1: number | null;
  d7: number | null;
};

export type DailyPlayersRow = {
  date: string;
  game_id: GameId | null;
  players: number;
};

export type RetentionRow = {
  cohort_date: string;
  cohort_size: number;
  d1: number | null;
  d7: number | null;
};

export type StreakBucket = '0' | '1' | '2-6' | '7-29' | '30+';

export type StreakBucketRow = {
  bucket: StreakBucket;
  players: number;
};

export type ChallengeQualityRow = {
  challenge_id: string;
  game_id: GameId;
  date: string;
  number: number;
  started: number;
  finished: number;
  completion_rate: number | null;
  win_rate: number | null;
  reports: number;
  status: ChallengeStatus;
};

export type MetricsResponse = {
  summary: MetricsSummary;
  daily_players: DailyPlayersRow[];
  retention: RetentionRow[];
  streak_distribution: StreakBucketRow[];
  challenge_quality: ChallengeQualityRow[];
};
