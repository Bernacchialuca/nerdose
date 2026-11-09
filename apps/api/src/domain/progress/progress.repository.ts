import type { GameId } from '@nerdose/core';
import { challenges, playerGameStats, playerStats } from '@nerdose/db';
import type { Db, PlayerGameStats, PlayerStats, Tx } from '@nerdose/db';
import { and, eq, inArray, lt, max } from 'drizzle-orm';

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
