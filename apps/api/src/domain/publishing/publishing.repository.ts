import type { GameId } from '@nerdose/core';
import { challenges, generationRequests, terms } from '@nerdose/db';
import type { Db, Tx } from '@nerdose/db';
import { and, eq, inArray, sql } from 'drizzle-orm';

import type { CachedChallenge } from './publishing.types';

export interface ChallengesReadRepository {
  findTodayVisible(day: string): Promise<CachedChallenge[]>;
}

export interface ChallengesPublishRepository {
  publishApproved(
    day: string,
  ): Promise<Array<{ id: string; game_id: GameId; date: string; number: number }>>;
}

export interface TermsReadRepository {
  findApprovedTerms(): Promise<Array<{ term: string }>>;
}

export class PublishingRepository
  implements ChallengesReadRepository, ChallengesPublishRepository, TermsReadRepository
{
  constructor(private readonly db: Db | Tx) {}

  async findTodayVisible(day: string): Promise<CachedChallenge[]> {
    const rows = await this.db
      .select({
        id: challenges.id,
        gameId: challenges.gameId,
        date: challenges.date,
        number: challenges.number,
        status: challenges.status,
        payload: challenges.payload,
      })
      .from(challenges)
      .where(and(eq(challenges.date, day), inArray(challenges.status, ['published', 'voided'])));
    return rows.map((r) => ({
      id: r.id,
      game_id: r.gameId,
      date: r.date,
      number: r.number,
      status: r.status as 'published' | 'voided',
      payload: r.payload as unknown,
    }));
  }

  /** UPDATE challenges SET status = 'published' WHERE status = 'approved' AND date = :day (ADR-008). */
  async publishApproved(day: string) {
    const rows = await this.db
      .update(challenges)
      .set({ status: 'published' })
      .where(and(eq(challenges.status, 'approved'), eq(challenges.date, day)))
      .returning({
        id: challenges.id,
        gameId: challenges.gameId,
        date: challenges.date,
        number: challenges.number,
      });
    return rows.map((r) => ({ id: r.id, game_id: r.gameId, date: r.date, number: r.number }));
  }

  async findApprovedTerms(): Promise<Array<{ term: string }>> {
    return this.db.select({ term: terms.term }).from(terms).where(eq(terms.status, 'approved'));
  }

  /** Sin lock: la api no cambia el challenge salvo la publicación de hoy (decisión 5). */
  async findChallengeStatus(
    id: string,
  ): Promise<{ id: string; status: string; date: string } | null> {
    const [row] = await this.db
      .select({ id: challenges.id, status: challenges.status, date: challenges.date })
      .from(challenges)
      .where(eq(challenges.id, id))
      .limit(1);
    return row ?? null;
  }

  async insertPendingRequest(
    challengeId: string,
  ): Promise<{ id: string; status: 'pending'; requestedAt: Date } | null> {
    const [row] = await this.db
      .insert(generationRequests)
      .values({ challengeId })
      // uq_generation_requests_pending es un índice parcial: inferencia por columna + predicado.
      .onConflictDoNothing({
        target: generationRequests.challengeId,
        where: sql`${generationRequests.status} = 'pending'`,
      })
      .returning({
        id: generationRequests.id,
        status: generationRequests.status,
        requestedAt: generationRequests.requestedAt,
      });
    return row ? { id: row.id, status: 'pending', requestedAt: row.requestedAt } : null;
  }

  async findPendingRequest(
    challengeId: string,
  ): Promise<{ id: string; status: 'pending'; requestedAt: Date } | null> {
    const [row] = await this.db
      .select({ id: generationRequests.id, requestedAt: generationRequests.requestedAt })
      .from(generationRequests)
      .where(
        and(
          eq(generationRequests.challengeId, challengeId),
          eq(generationRequests.status, 'pending'),
        ),
      )
      .limit(1);
    return row ? { id: row.id, status: 'pending', requestedAt: row.requestedAt } : null;
  }

  /** SQL crudo: Drizzle no expresa pg_notify (ADR-005). */
  async notify(requestId: string): Promise<void> {
    await this.db.execute(sql`SELECT pg_notify('generation_requests', ${requestId})`);
  }
}
