import type { GameId } from '@nerdose/core';

export type PublicChallengeStatus = 'published' | 'voided' | 'none';
export type PlayStatus = 'in_progress' | 'won' | 'lost' | 'voided';

// FG-3 lo amplía (id, number, payload).
export type CachedChallenge = { game_id: GameId; status: 'published' | 'voided' };

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
