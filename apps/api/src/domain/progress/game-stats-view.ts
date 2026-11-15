import { liveStreak, type AnyGameDefinition } from '@nerdose/core';
import type { PlayerGameStats } from '@nerdose/db';

import type { GameStatsView } from './progress.types';

/** ADR-011: vista de stats de un juego; racha viva con `liveStreak`, sin escribir. */
export function toGameStatsView(
  game: AnyGameDefinition,
  row: PlayerGameStats | null,
  prevActiveDay: string | null,
  day: string,
): GameStatsView {
  if (!row) {
    return {
      game_id: game.id,
      current_streak: 0,
      max_streak: 0,
      played: 0,
      wins: 0,
      win_rate: null,
      extra: game.initialStats(),
    };
  }
  return {
    game_id: game.id,
    current_streak: liveStreak(
      { current: row.currentStreak, lastCompleted: row.lastCompletedDate, prevActiveDay },
      day,
    ),
    max_streak: row.maxStreak,
    played: row.played,
    wins: row.wins,
    win_rate: row.played === 0 ? null : row.wins / row.played,
    extra: row.extra,
  };
}
