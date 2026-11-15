import {
  liveStreak,
  nextStreak,
  rebuildGameStats,
  replayStreak,
  type AnyGameDefinition,
  type GameId,
} from '@nerdose/core';

import { toGameStatsView } from './game-stats-view';
import type { ProgressRepository } from './progress.repository';
import type {
  GameStatsView,
  Outcome,
  ProgressRecomputeRepo,
  ProgressWriteRepo,
  Streaks,
} from './progress.types';

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
    return toGameStatsView(game, row, prev.byGame[game.id] ?? null, day);
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

  /**
   * ADR-011: reconstruye `player_game_stats` (del juego) y `player_stats` desde `plays` para un
   * lote de jugadores. Bloquea en orden `player_id` asc (game_stats → player_stats), igual que
   * `applyResult`, y lee los datos una sola vez por lote.
   */
  async recompute(
    repo: ProgressRecomputeRepo,
    input: { playerIds: readonly string[]; game: AnyGameDefinition },
  ): Promise<{ players: number }> {
    const { game } = input;
    const ids = [...new Set(input.playerIds)].sort();
    for (const id of ids) {
      await repo.lockGameStats(id, game.id, game.initialStats() as unknown);
      await repo.lockPlayerStats(id);
    }
    if (ids.length === 0) return { players: 0 };

    const [active, completed] = await Promise.all([repo.activeDays(), repo.completedPlays(ids)]);
    const gameActive: string[] = [];
    const anyActive: string[] = [];
    for (const a of active) {
      anyActive.push(a.date);
      if (a.gameId === game.id) gameActive.push(a.date);
    }
    const byPlayer = new Map<string, typeof completed>();
    for (const p of completed) {
      const list = byPlayer.get(p.playerId);
      if (list) list.push(p);
      else byPlayer.set(p.playerId, [p]);
    }

    for (const id of ids) {
      const all = byPlayer.get(id) ?? [];
      const own = all.filter((p) => p.gameId === game.id);
      const streak = replayStreak(
        own.map((p) => p.date),
        gameActive,
      );
      const rebuilt = rebuildGameStats(
        game,
        own.map((p) => ({ date: p.date, status: p.status, result: p.result ?? null })),
      );
      const global = replayStreak(
        all.map((p) => p.date),
        anyActive,
      );
      await repo.saveGameStats({
        playerId: id,
        gameId: game.id,
        currentStreak: streak.current,
        maxStreak: streak.max,
        played: rebuilt.played,
        wins: rebuilt.wins,
        lastCompletedDate: streak.lastCompleted,
        extra: rebuilt.extra as unknown,
      });
      await repo.savePlayerStats({
        playerId: id,
        globalStreak: global.current,
        maxGlobalStreak: global.max,
        lastActiveDate: global.lastCompleted,
        totalCompleted: all.length,
      });
    }
    return { players: ids.length };
  }
}
