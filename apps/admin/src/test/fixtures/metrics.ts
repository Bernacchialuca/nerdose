import type { MetricsResponse } from '@/modules/metrics/api/types';

export const METRICS_OK: MetricsResponse = {
  summary: { unique_players: 1284, completed: 9730, d1: 0.413, d7: 0.182 },
  daily_players: [
    { date: '2026-12-01', game_id: null, players: 150 },
    { date: '2026-12-01', game_id: 'devdle', players: 120 },
    { date: '2026-12-01', game_id: 'bug-hunt', players: 80 },
    { date: '2026-12-03', game_id: null, players: 12 },
    { date: '2026-12-03', game_id: 'grep-grid', players: 7 },
    { date: '2026-12-03', game_id: 'timeline', players: 5 },
    { date: '2026-12-03', game_id: 'big-o', players: 3 },
  ],
  retention: [
    { cohort_date: '2026-12-01', cohort_size: 100, d1: 0.4, d7: 0.25 },
    { cohort_date: '2026-12-03', cohort_size: 20, d1: 0.35, d7: null },
  ],
  streak_distribution: [
    { bucket: '0', players: 1 },
    { bucket: '1', players: 1 },
    { bucket: '2-6', players: 1 },
    { bucket: '7-29', players: 1 },
    { bucket: '30+', players: 1 },
  ],
  challenge_quality: [
    {
      challenge_id: 'c0000000-0000-4000-8000-000000000008',
      game_id: 'big-o',
      date: '2026-12-03',
      number: 8,
      started: 300,
      finished: 290,
      completion_rate: 0.9666666666666667,
      win_rate: 0.07931034482758621,
      reports: 2,
      status: 'published',
    },
    {
      challenge_id: 'c0000000-0000-4000-8000-000000000007',
      game_id: 'devdle',
      date: '2026-12-02',
      number: 7,
      started: 120,
      finished: 0,
      completion_rate: 0,
      win_rate: null,
      reports: 5,
      status: 'voided',
    },
    {
      challenge_id: 'c0000000-0000-4000-8000-000000000006',
      game_id: 'timeline',
      date: '2026-12-01',
      number: 6,
      started: 0,
      finished: 0,
      completion_rate: null,
      win_rate: null,
      reports: 0,
      status: 'published',
    },
  ],
};

export const METRICS_EMPTY: MetricsResponse = {
  summary: { unique_players: 0, completed: 0, d1: null, d7: null },
  daily_players: [],
  retention: [],
  streak_distribution: [
    { bucket: '0', players: 412 },
    { bucket: '1', players: 35 },
    { bucket: '2-6', players: 20 },
    { bucket: '7-29', players: 8 },
    { bucket: '30+', players: 2 },
  ],
  challenge_quality: [],
};

export const STREAKS_ZERO = (['0', '1', '2-6', '7-29', '30+'] as const).map((bucket) => ({
  bucket,
  players: 0,
}));

export const metrics = (overrides: Partial<MetricsResponse>): MetricsResponse => ({
  ...METRICS_OK,
  ...overrides,
});
