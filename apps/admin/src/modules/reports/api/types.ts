import type { Culprit, GameId, Locale, ReportReason, ReportStatus } from '@nerdose/core';

export type ChallengeStatus = 'draft' | 'approved' | 'published' | 'rejected' | 'voided';

export type AdminChallenge = {
  id: string;
  game_id: GameId;
  date: string;
  number: number;
  status: ChallengeStatus;
  payload: Record<string, unknown>;
  verification: Record<string, unknown>;
  void_reason: string | null;
  voided_at: string | null;
  culprits: Culprit[];
};

export type ReportContext = {
  code_language?: string | null;
  play_status?: string | null;
  play_state?: unknown;
  user_agent?: string | null;
  [key: string]: unknown;
};

export type AdminReport = {
  id: string;
  reason: ReportReason;
  message: string | null;
  locale: Locale;
  context: ReportContext;
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

export type ReportGroupsResponse = { groups: ReportGroup[] };

export type VoidCulprit =
  | { kind: 'term' | 'timeline_fact'; id: string }
  | { kind: 'template' | 'none' };

export type VoidRequest = { void_reason: string; culprit: VoidCulprit };

export type VoidResponse = { challenge_id: string; affected_plays: number };
