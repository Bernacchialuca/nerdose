import type { GameId, Locale } from '@nerdose/core';

import { api } from '@/lib/api-client';

export type { GameId };
export type PlayStatus = 'in_progress' | 'won' | 'lost' | 'voided';

export type TodayGame = {
  game_id: GameId;
  challenge_status: 'published' | 'voided' | 'none';
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

export const todayKeys = {
  all: ['today'] as const,
  detail: (lang: Locale) => ['today', lang] as const,
};

export const fetchToday = (lang: Locale) => api<Today>(`/api/today?lang=${lang}`);
