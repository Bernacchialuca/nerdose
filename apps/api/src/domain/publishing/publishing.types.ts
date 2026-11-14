import type { GameId } from '@nerdose/core';

export type PublicChallengeStatus = 'published' | 'voided' | 'none';
export type PlayStatus = 'in_progress' | 'won' | 'lost' | 'voided';

/** `payload` lleva la solución: nunca se serializa en una respuesta de jugador. */
export type CachedChallenge = {
  id: string;
  game_id: GameId;
  date: string;
  number: number;
  status: 'published' | 'voided';
  payload: unknown;
};

export type TodayGame = {
  game_id: GameId;
  challenge_status: PublicChallengeStatus;
  play_status: PlayStatus | null;
  history_label: string | null;
  current_streak: number;
};

export type Today = {
  date: string;
  number: number | null;
  next_reset_at: string;
  seconds_to_reset: number;
  has_session: boolean;
  global_streak: { current: number; max: number };
  completed_today: number;
  games: TodayGame[];
};

export type RegenerationAccepted = {
  request_id: string;
  status: 'pending';
  requested_at: string;
};
