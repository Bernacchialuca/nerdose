import type { Culprit, GameId, Locale, ReportReason, ReportStatus } from '@nerdose/core';

export type AdminChallenge = {
  id: string;
  game_id: GameId;
  date: string;
  number: number;
  status: string;
  payload: unknown;
  verification: unknown;
  void_reason: string | null;
  voided_at: string | null;
  culprits: Culprit[];
};

export type AdminReport = {
  id: string;
  reason: ReportReason;
  message: string | null;
  locale: Locale;
  context: unknown;
  status: ReportStatus;
  created_at: string;
  player_ref: string;
};

export type ReportGroup = {
  challenge: AdminChallenge;
  alerted_at: string | null;
  report_count: number;
  reasons: Partial<Record<ReportReason, number>>;
  reports: AdminReport[];
};

export type GenerationFailureView = {
  game_id: GameId;
  date: string;
  attempts: number;
  last_reason: string | null;
  updated_at: string;
};

export type RejectedItem = {
  kind: 'term' | 'timeline_fact';
  id: string;
  label: string;
  rejection_reason: string;
};

export type UpcomingChallenge = {
  id: string;
  status: 'approved';
  payload: unknown;
  verification: unknown;
  generator_version: string;
  attempt: number;
  rejected_items: RejectedItem[];
};

export type RegenerationView = {
  request_id: string;
  status: 'pending' | 'failed';
  error: string | null;
  requested_at: string;
  processed_at: string | null;
};

export type FailureView = {
  attempts: number;
  last_reason: string | null;
  updated_at: string;
};

export type UpcomingGame = {
  game_id: GameId;
  challenge: UpcomingChallenge | null;
  regeneration: RegenerationView | null;
  failure: FailureView | null;
};

export type UpcomingDay = { date: string; number: number; games: UpcomingGame[] };

export type BankConsumerStock = {
  game_id: GameId;
  window_days: number;
  items_per_challenge: number;
  approved_available: number;
  days_of_stock: number;
  cycle_ok: boolean;
};

export type BankStock = {
  bank: 'terms' | 'timeline_facts';
  approved_available: number;
  approved_total: number;
  rejected_total: number;
  days_of_stock: number;
  cycle_ok: boolean;
  consumers: BankConsumerStock[];
  rejections: Array<{ wikidata_id: string; label: string; reason: string }>;
};

export type LastSync = {
  finished_at: string;
  dataset_version: string;
  inserted: number;
  updated: number;
  unchanged: number;
  kept_rejected: number;
};

export type ContentStock = {
  banks: BankStock[];
  last_sync: LastSync | null;
  top_rejected_guesses: Array<{ word: string; distinct_players: number }>;
};

export type ContentItem = {
  id: string;
  label: string;
  category: string;
  status: 'approved' | 'rejected';
  rejection_reason: string | null;
  sitelinks: number;
  wikidata_id: string;
  /** `definition.es` (terms) o `note.es` (timeline_facts). */
  description: string | null;
  /** Solo timeline_facts; null en terms. */
  event_date: string | null;
  /** Por juego que consume el banco (`bankUsage`), en el orden del registry. */
  last_used: Partial<Record<GameId, string | null>>;
  /** Juegos cuyo generator nunca elige este ítem (`bankUsage.excludedItems`). */
  excluded_from: GameId[];
};

export type ContentItemsPage = {
  bank: 'terms' | 'timeline_facts';
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  items: ContentItem[];
};

export type StreakBucket = '0' | '1' | '2-6' | '7-29' | '30+';

export type MetricsSummary = {
  unique_players: number;
  completed: number;
  d1: number | null;
  d7: number | null;
};
export type DailyPlayers = { date: string; game_id: GameId | null; players: number };
export type RetentionCohort = {
  cohort_date: string;
  cohort_size: number;
  d1: number | null;
  d7: number | null;
};
export type StreakDistribution = { bucket: StreakBucket; players: number };
export type ChallengeQuality = {
  challenge_id: string;
  game_id: GameId;
  date: string;
  number: number;
  started: number;
  finished: number;
  completion_rate: number | null;
  win_rate: number | null;
  reports: number;
  status: 'published' | 'voided';
};
export type Metrics = {
  summary: MetricsSummary;
  daily_players: DailyPlayers[];
  retention: RetentionCohort[];
  streak_distribution: StreakDistribution[];
  challenge_quality: ChallengeQuality[];
};
