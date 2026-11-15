import type { GameId } from '@nerdose/core';

import type { ProgressRepository } from './progress.repository';

export type GameStatsView = {
  game_id: GameId;
  current_streak: number;
  max_streak: number;
  played: number;
  wins: number;
  win_rate: number | null;
  extra: unknown;
};

export type Streak = { current: number; max: number };
export type Streaks = { game: Streak; global: Streak };

export type Outcome = { status: 'won' | 'lost'; result: unknown } | { status: 'voided' };

/** Subconjunto del repositorio que usa el recálculo por lote (anulación), ligado a una transacción. */
export type ProgressRecomputeRepo = Pick<
  ProgressRepository,
  | 'lockGameStats'
  | 'lockPlayerStats'
  | 'activeDays'
  | 'completedPlays'
  | 'saveGameStats'
  | 'savePlayerStats'
>;

/** Subconjunto del repositorio que usa el cierre, ligado a una transacción. */
export type ProgressWriteRepo = Pick<
  ProgressRepository,
  'prevActiveDays' | 'lockGameStats' | 'lockPlayerStats' | 'saveGameStats' | 'savePlayerStats'
>;

export type HeatmapDay = { date: string; completed: number };

export type HistoryRow = {
  date: string;
  number: number;
  gameId: GameId;
  status: 'won' | 'lost' | 'voided';
  result: unknown;
};

export type HistoryEntry = {
  date: string;
  number: number;
  game_id: GameId;
  status: 'won' | 'lost' | 'voided';
  label: string;
};

export type MyStats = {
  today: string;
  global: { current_streak: number; max_streak: number; total_completed: number };
  games: GameStatsView[];
  heatmap: HeatmapDay[];
  history: HistoryEntry[];
  history_next_before: string | null;
};
