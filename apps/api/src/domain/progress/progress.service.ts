import { liveStreak, type AnyGameDefinition, type GameId } from '@nerdose/core';

import type { ProgressRepository } from './progress.repository';
import type { GameStatsView } from './progress.types';

type Repo = Pick<
  ProgressRepository,
  'findGameStats' | 'findAllGameStats' | 'findPlayerStats' | 'prevActiveDays'
>;

export class ProgressService {
  constructor(private readonly deps: { repo: Repo }) {}

  async gameStatsView(
    playerId: string,
    game: AnyGameDefinition,
    day: string,
  ): Promise<GameStatsView> {
    const [row, prev] = await Promise.all([
      this.deps.repo.findGameStats(playerId, game.id),
      this.deps.repo.prevActiveDays(day),
    ]);
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
        {
          current: row.currentStreak,
          lastCompleted: row.lastCompletedDate,
          prevActiveDay: prev.byGame[game.id] ?? null,
        },
        day,
      ),
      max_streak: row.maxStreak,
      played: row.played,
      wins: row.wins,
      win_rate: row.played === 0 ? null : row.wins / row.played,
      extra: row.extra,
    };
  }

  async todayStreaks(
    playerId: string,
    day: string,
  ): Promise<{
    byGame: Partial<Record<GameId, number>>;
    global: { current: number; max: number };
  }> {
    const [rows, globalRow, prev] = await Promise.all([
      this.deps.repo.findAllGameStats(playerId),
      this.deps.repo.findPlayerStats(playerId),
      this.deps.repo.prevActiveDays(day),
    ]);
    const byGame: Partial<Record<GameId, number>> = {};
    for (const r of rows) {
      byGame[r.gameId] = liveStreak(
        {
          current: r.currentStreak,
          lastCompleted: r.lastCompletedDate,
          prevActiveDay: prev.byGame[r.gameId] ?? null,
        },
        day,
      );
    }
    const global = globalRow
      ? {
          current: liveStreak(
            {
              current: globalRow.globalStreak,
              lastCompleted: globalRow.lastActiveDate,
              prevActiveDay: prev.global,
            },
            day,
          ),
          max: globalRow.maxGlobalStreak,
        }
      : { current: 0, max: 0 };
    return { byGame, global };
  }
}
