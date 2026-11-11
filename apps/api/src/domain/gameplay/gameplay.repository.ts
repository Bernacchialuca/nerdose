import type { GameId } from '@nerdose/core';
import { challenges, plays, rejectedGuesses } from '@nerdose/db';
import type { Db, Play, Tx } from '@nerdose/db';
import { and, eq } from 'drizzle-orm';

import { ProgressRepository } from '@/domain/progress/progress.repository';

import type { MoveTx } from './gameplay.types';

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

  /** SELECT … FOR UPDATE: serializa las jugadas sobre la misma Play. */
  async lockPlay(playerId: string, challengeId: string): Promise<Play | null> {
    const [row] = await this.db
      .select()
      .from(plays)
      .where(and(eq(plays.playerId, playerId), eq(plays.challengeId, challengeId)))
      .for('update');
    return row ?? null;
  }

  async updateState(playId: string, state: unknown): Promise<Play> {
    const [row] = await this.db
      .update(plays)
      .set({ state })
      .where(eq(plays.id, playId))
      .returning();
    return row!;
  }

  /** Cierra la Play en una sola sentencia (cumple los checks de result y finished_at). */
  async closePlay(
    playId: string,
    v: {
      state: unknown;
      status: 'won' | 'lost';
      result: unknown;
      score: number;
      finishedAt: Date;
    },
  ): Promise<Play> {
    const [row] = await this.db
      .update(plays)
      .set({
        state: v.state,
        status: v.status,
        result: v.result,
        score: v.score,
        finishedAt: v.finishedAt,
      })
      .where(eq(plays.id, playId))
      .returning();
    return row!;
  }

  /** SELECT … FOR SHARE del challenge: lee el estado real y serializa contra la anulación. */
  async lockChallenge(challengeId: string): Promise<{ id: string; status: string } | null> {
    const [row] = await this.db
      .select({ id: challenges.id, status: challenges.status })
      .from(challenges)
      .where(eq(challenges.id, challengeId))
      .for('share');
    return row ?? null;
  }

  /** Play `voided` sin jugada previa: `inserted` es null si ya existía. */
  async insertVoidedPlayIfAbsent(values: {
    playerId: string;
    challengeId: string;
    gameId: GameId;
    date: string;
    finishedAt: Date;
  }): Promise<{ inserted: Play | null }> {
    const [row] = await this.db
      .insert(plays)
      .values({ ...values, state: {}, status: 'voided' })
      .onConflictDoNothing({ target: [plays.playerId, plays.challengeId] })
      .returning();
    return { inserted: row ?? null };
  }

  async insertRejectedGuess(word: string, playerId: string): Promise<void> {
    await this.db.insert(rejectedGuesses).values({ word, playerId }).onConflictDoNothing();
  }
}

/** Arma los repositorios de la jugada sobre una transacción de Drizzle. */
export const moveTransaction =
  (db: Db): MoveTx =>
  (fn) =>
    db.transaction((tx) =>
      fn({ plays: new GameplayRepository(tx), progress: new ProgressRepository(tx) }),
    );
