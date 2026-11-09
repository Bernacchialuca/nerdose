import type { GameId } from '@nerdose/core';
import { plays } from '@nerdose/db';
import type { Db, Play, Tx } from '@nerdose/db';
import { and, eq } from 'drizzle-orm';

export class GameplayRepository {
  constructor(private readonly db: Db | Tx) {}

  async findPlay(playerId: string, challengeId: string): Promise<Play | null> {
    const [row] = await this.db
      .select()
      .from(plays)
      .where(and(eq(plays.playerId, playerId), eq(plays.challengeId, challengeId)));
    return row ?? null;
  }

  async findPlaysOfDay(playerId: string, day: string): Promise<Play[]> {
    return this.db
      .select()
      .from(plays)
      .where(and(eq(plays.playerId, playerId), eq(plays.date, day)));
  }

  /** INSERT … ON CONFLICT (player_id, challenge_id) DO NOTHING: `inserted` es null si ya existía. */
  async insertPlayIfAbsent(values: {
    playerId: string;
    challengeId: string;
    gameId: GameId;
    date: string;
    state: unknown;
  }): Promise<{ inserted: Play | null }> {
    const [row] = await this.db
      .insert(plays)
      .values({ ...values, status: 'in_progress' })
      .onConflictDoNothing({ target: [plays.playerId, plays.challengeId] })
      .returning();
    return { inserted: row ?? null };
  }
}
