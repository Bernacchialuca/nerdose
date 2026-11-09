import type { GameId } from '@nerdose/core';

export type GameStatsView = {
  game_id: GameId;
  current_streak: number;
  max_streak: number;
  played: number;
  wins: number;
  win_rate: number | null;
  extra: unknown;
};
