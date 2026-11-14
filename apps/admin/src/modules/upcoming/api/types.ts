import type { GameId } from '@nerdose/core';

import type { ChallengeStatus } from '@/modules/reports';

export type RejectedItem = {
  kind: 'term' | 'timeline_fact';
  id: string;
  label: string;
  rejection_reason: string;
};

export type UpcomingChallenge = {
  id: string;
  status: ChallengeStatus;
  payload: Record<string, unknown>;
  verification: Record<string, unknown>;
  generator_version: string;
  attempt: number;
  rejected_items: RejectedItem[];
};

export type Regeneration = {
  request_id: string;
  status: 'pending' | 'failed';
  error: string | null;
  requested_at: string;
  processed_at: string | null;
};

export type UpcomingFailure = {
  attempts: number;
  last_reason: string | null;
  updated_at: string;
};

export type UpcomingGame = {
  game_id: GameId;
  challenge: UpcomingChallenge | null;
  regeneration: Regeneration | null;
  failure: UpcomingFailure | null;
};

export type UpcomingDay = {
  date: string;
  number: number;
  games: UpcomingGame[];
};

export type UpcomingResponse = { days: UpcomingDay[]; active_failures: number };

export type RegenerateResponse = {
  request_id: string;
  status: 'pending';
  requested_at: string;
};

export type GenerationFailure = {
  game_id: GameId;
  date: string;
  attempts: number;
  last_reason: string | null;
  updated_at: string;
};

export type GenerationFailuresResponse = { failures: GenerationFailure[] };
