import type { GameId } from '@nerdose/core';
import { challenges, playerGameStats, playerStats, plays } from '@nerdose/db';
import type { Db, PlayerGameStats, PlayerStats, Tx } from '@nerdose/db';
import { and, asc, between, desc, eq, inArray, lt, max, ne, sql } from 'drizzle-orm';

import type { HeatmapDay, HistoryRow } from './progress.types';

const COMPLETED = ['won', 'lost', 'voided'] as const;

/** Lecturas de progreso y escrituras del cierre de partida (siempre dentro de una transacción). */
export class ProgressRepository {
  constructor(private readonly db: Db | Tx) {}

  async findGameStats(playerId: string, gameId: GameId): Promise<PlayerGameStats | null> {
    const [row] = await this.db
      .select()
      .from(playerGameStats)
      .where(and(eq(playerGameStats.playerId, playerId), eq(playerGameStats.gameId, gameId)));
    return row ?? null;
  }

  async findAllGameStats(playerId: string): Promise<PlayerGameStats[]> {
    return this.db.select().from(playerGameStats).where(eq(playerGameStats.playerId, playerId));
  }

  async findPlayerStats(playerId: string): Promise<PlayerStats | null> {
    const [row] = await this.db
      .select()
      .from(playerStats)
      .where(eq(playerStats.playerId, playerId));
    return row ?? null;
  }

  /** ADR-011: último día con challenge `published`/`voided` anterior a `day`, por juego y global. */
  async prevActiveDays(
    day: string,
  ): Promise<{ byGame: Partial<Record<GameId, string>>; global: string | null }> {
    const rows = await this.db
      .select({ gameId: challenges.gameId, day: max(challenges.date) })
      .from(challenges)
      .where(and(lt(challenges.date, day), inArray(challenges.status, ['published', 'voided'])))
      .groupBy(challenges.gameId);
    const byGame: Partial<Record<GameId, string>> = {};
    let global: string | null = null;
    for (const r of rows) {
      if (r.day === null) continue;
      byGame[r.gameId] = r.day;
      if (global === null || r.day > global) global = r.day;
    }
    return { byGame, global };
  }

  /** Heatmap (REQ-011): Play completadas por día en [from, to]. */
  async heatmap(playerId: string, from: string, to: string): Promise<HeatmapDay[]> {
    return this.db
      .select({ date: plays.date, completed: sql<number>`count(*)::int` })
      .from(plays)
      .where(
        and(
          eq(plays.playerId, playerId),
          inArray(plays.status, [...COMPLETED]),
          between(plays.date, from, to),
        ),
      )
      .groupBy(plays.date)
      .orderBy(asc(plays.date));
  }

  /** Historial (REQ-011): Play completadas, más recientes primero y por orden de catálogo dentro del día. */
  async historyPage(playerId: string, before: string | null, limit: number): Promise<HistoryRow[]> {
    const rows = await this.db
      .select({
        date: plays.date,
        number: challenges.number,
        gameId: plays.gameId,
        status: plays.status,
        result: plays.result,
      })
      .from(plays)
      .innerJoin(challenges, eq(challenges.id, plays.challengeId))
      .where(
        and(
          eq(plays.playerId, playerId),
          inArray(plays.status, [...COMPLETED]),
          before === null ? undefined : lt(plays.date, before),
        ),
      )
      .orderBy(desc(plays.date), asc(plays.gameId))
      .limit(limit);
    return rows.map((r) => ({ ...r, status: r.status as HistoryRow['status'] }));
  }

  /** Días activos (ADR-011) de todos los juegos: challenges `published`/`voided`. */
  async activeDays(): Promise<Array<{ gameId: GameId; date: string }>> {
    return this.db
      .select({ gameId: challenges.gameId, date: challenges.date })
      .from(challenges)
      .where(inArray(challenges.status, ['published', 'voided']));
  }

  /** Play completadas (`won`/`lost`/`voided`) de los jugadores dados. */
  async completedPlays(playerIds: string[]): Promise<
    Array<{
      playerId: string;
      gameId: GameId;
      date: string;
      status: 'won' | 'lost' | 'voided';
      result: unknown;
    }>
  > {
    if (playerIds.length === 0) return [];
    const rows = await this.db
      .select({
        playerId: plays.playerId,
        gameId: plays.gameId,
        date: plays.date,
        status: plays.status,
        result: plays.result,
      })
      .from(plays)
      .where(and(inArray(plays.playerId, playerIds), ne(plays.status, 'in_progress')));
    return rows.map((r) => ({ ...r, status: r.status as 'won' | 'lost' | 'voided' }));
  }

  /** Asegura la fila (con `extra` inicial) y la bloquea con FOR UPDATE. */
  async lockGameStats(
    playerId: string,
    gameId: GameId,
    initialExtra: unknown,
  ): Promise<PlayerGameStats> {
    await this.db
      .insert(playerGameStats)
      .values({ playerId, gameId, extra: initialExtra })
      .onConflictDoNothing({ target: [playerGameStats.playerId, playerGameStats.gameId] });
    const [row] = await this.db
      .select()
      .from(playerGameStats)
      .where(and(eq(playerGameStats.playerId, playerId), eq(playerGameStats.gameId, gameId)))
      .for('update');
    return row!;
  }

  async lockPlayerStats(playerId: string): Promise<PlayerStats> {
    await this.db
      .insert(playerStats)
      .values({ playerId })
      .onConflictDoNothing({ target: [playerStats.playerId] });
    const [row] = await this.db
      .select()
      .from(playerStats)
      .where(eq(playerStats.playerId, playerId))
      .for('update');
    return row!;
  }

  async saveGameStats(
    row: Pick<
      PlayerGameStats,
      | 'playerId'
      | 'gameId'
      | 'currentStreak'
      | 'maxStreak'
      | 'played'
      | 'wins'
      | 'lastCompletedDate'
      | 'extra'
    >,
  ): Promise<void> {
    const { playerId, gameId, ...set } = row;
    await this.db
      .update(playerGameStats)
      .set(set)
      .where(and(eq(playerGameStats.playerId, playerId), eq(playerGameStats.gameId, gameId)));
  }

  async savePlayerStats(
    row: Pick<
      PlayerStats,
      'playerId' | 'globalStreak' | 'maxGlobalStreak' | 'lastActiveDate' | 'totalCompleted'
    >,
  ): Promise<void> {
    const { playerId, ...set } = row;
    await this.db.update(playerStats).set(set).where(eq(playerStats.playerId, playerId));
  }
}
