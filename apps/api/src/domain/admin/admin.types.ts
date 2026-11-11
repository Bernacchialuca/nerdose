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
