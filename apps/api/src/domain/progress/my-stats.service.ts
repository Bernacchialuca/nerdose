import { GAME_IDS, liveStreak, today, type GameRegistry, type Locale } from '@nerdose/core';

import type { Clock } from '@/shared/clock';
import { shiftDay } from '@/shared/day';

import { toGameStatsView } from './game-stats-view';
import { HISTORY_PAGE_SIZE, VOIDED_LABEL, pageByFullDays } from './history';
import type { ProgressRepository } from './progress.repository';
import type { MyStats } from './progress.types';

type Repo = Pick<
  ProgressRepository,
  'findPlayerStats' | 'findAllGameStats' | 'prevActiveDays' | 'heatmap' | 'historyPage'
>;

/** Estadísticas del jugador (F12): solo lectura, rachas vivas sin escribir (ADR-011). */
export class MyStatsService {
  constructor(private readonly deps: { repo: Repo; games: GameRegistry; clock: Clock }) {}

  currentDay(): string {
    return today(this.deps.clock.now());
  }

  async myStats(
    playerId: string,
    day: string,
    locale: Locale,
    historyBefore: string | null,
  ): Promise<MyStats> {
    const { repo, games } = this.deps;
    const [ps, rows, prev, heatmap, historyRows] = await Promise.all([
      repo.findPlayerStats(playerId),
      repo.findAllGameStats(playerId),
      repo.prevActiveDays(day),
      repo.heatmap(playerId, shiftDay(day, -364), day),
      repo.historyPage(playerId, historyBefore, HISTORY_PAGE_SIZE + 1),
    ]);
    const byId = new Map(rows.map((r) => [r.gameId, r]));
    const { page, nextBefore } = pageByFullDays(historyRows, HISTORY_PAGE_SIZE);
    return {
      today: day,
      global: ps
        ? {
            current_streak: liveStreak(
              {
                current: ps.globalStreak,
                lastCompleted: ps.lastActiveDate,
                prevActiveDay: prev.global,
              },
              day,
            ),
            max_streak: ps.maxGlobalStreak,
            total_completed: ps.totalCompleted,
          }
        : { current_streak: 0, max_streak: 0, total_completed: 0 },
      games: GAME_IDS.map((id) =>
        toGameStatsView(games.get(id), byId.get(id) ?? null, prev.byGame[id] ?? null, day),
      ),
      heatmap,
      history: page.map((r) => ({
        date: r.date,
        number: r.number,
        game_id: r.gameId,
        status: r.status,
        label:
          r.status === 'voided' ? VOIDED_LABEL[locale] : games.get(r.gameId).historyLabel(r.result),
      })),
      history_next_before: nextBefore,
    };
  }
}
