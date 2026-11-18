import type { GameId, Locale } from '@nerdose/core';

import { api } from '@/lib/api-client';
import type { GameStatsView } from '@/modules/game-host';

export type StatsHistoryEntry = {
  date: string;
  number: number;
  game_id: GameId;
  status: 'in_progress' | 'won' | 'lost' | 'voided';
  label: string;
};

/** Espejo campo por campo de `MyStats` en `docs/apis/api.yaml`. */
export type MyStats = {
  today: string;
  global: { current_streak: number; max_streak: number; total_completed: number };
  games: GameStatsView[];
  heatmap: { date: string; completed: number }[];
  history: StatsHistoryEntry[];
  history_next_before: string | null;
};

export const statsKeys = {
  all: ['me', 'stats'] as const,
  detail: (locale: Locale) => ['me', 'stats', locale] as const,
};

export const fetchMyStats = (locale: Locale, before: string | null) =>
  api<MyStats>(`/api/me/stats?lang=${locale}${before ? `&history_before=${before}` : ''}`);
