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
