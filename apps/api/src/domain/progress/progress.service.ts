import { liveStreak, nextStreak, type AnyGameDefinition, type GameId } from '@nerdose/core';

import type { ProgressRepository } from './progress.repository';
import type { GameStatsView, Outcome, ProgressWriteRepo, Streaks } from './progress.types';

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

  /**
   * ADR-011: aplica una Play completada (won/lost/voided) a las rachas y contadores.
   * `repo` está ligado a la transacción de cierre.
   */
  async applyResult(
    repo: ProgressWriteRepo,
    input: { playerId: string; game: AnyGameDefinition; date: string; outcome: Outcome },
  ): Promise<{ streaks: Streaks; gameStats: GameStatsView }> {
    const { playerId, game, date, outcome } = input;
    const prev = await repo.prevActiveDays(date);
    const gs = await repo.lockGameStats(playerId, game.id, game.initialStats() as unknown);
    const ps = await repo.lockPlayerStats(playerId);

    const currentStreak = nextStreak(
      {
        current: gs.currentStreak,
        lastCompleted: gs.lastCompletedDate,
        prevActiveDay: prev.byGame[game.id] ?? null,
      },
      date,
    );
    const maxStreak = Math.max(gs.maxStreak, currentStreak);
    const globalStreak = nextStreak(
      {
        current: ps.globalStreak,
        lastCompleted: ps.lastActiveDate,
        prevActiveDay: prev.global,
      },
      date,
    );
    const maxGlobalStreak = Math.max(ps.maxGlobalStreak, globalStreak);

    let { played, wins } = gs;
    let extra: unknown = gs.extra;
    if (outcome.status !== 'voided') {
      played += 1;
      if (outcome.status === 'won') wins += 1;
      extra = game.reduceStats(gs.extra, outcome.result) as unknown;
    }

    await repo.saveGameStats({
      playerId,
      gameId: game.id,
      currentStreak,
      maxStreak,
      played,
      wins,
      lastCompletedDate: date,
      extra,
    });
    await repo.savePlayerStats({
      playerId,
      globalStreak,
      maxGlobalStreak,
      lastActiveDate: date,
      totalCompleted: ps.totalCompleted + 1,
    });

    return {
      streaks: {
        game: { current: currentStreak, max: maxStreak },
        global: { current: globalStreak, max: maxGlobalStreak },
      },
      gameStats: {
        game_id: game.id,
        current_streak: currentStreak,
        max_streak: maxStreak,
        played,
        wins,
        win_rate: played === 0 ? null : wins / played,
        extra,
      },
    };
  }
}
