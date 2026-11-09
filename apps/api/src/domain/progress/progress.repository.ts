import type { GameId } from '@nerdose/core';
import { challenges, playerGameStats, playerStats } from '@nerdose/db';
import type { Db, PlayerGameStats, PlayerStats, Tx } from '@nerdose/db';
import { and, eq, inArray, lt, max } from 'drizzle-orm';

/** Solo lecturas: este módulo nunca escribe. */
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
}
