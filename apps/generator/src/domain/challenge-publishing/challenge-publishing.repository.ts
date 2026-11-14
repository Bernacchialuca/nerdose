import type {
  BankName,
  GameId,
  HistorySpec,
  RecentChallenge,
  VerificationLog,
} from '@nerdose/core';
import {
  challenges,
  generationFailures,
  generationRequests,
  terms,
  timelineFacts,
} from '@nerdose/db';
import type { Db, Tx } from '@nerdose/db';
import { and, asc, between, eq, inArray, ne, sql } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import type { z } from 'zod';

const ACTIVE_STATUSES = ['approved', 'published', 'voided'] as const;
const ACTIVE_INDEX = 'uq_challenges_active_game_date';

// Única fuente de las columnas permitidas por banco (tabla, campos leídos y columnas last_used).
const BANKS = {
  terms: {
    last_used_devdle: { key: 'lastUsedDevdle', column: terms.lastUsedDevdle },
    last_used_grep: { key: 'lastUsedGrep', column: terms.lastUsedGrep },
  },
  timeline_facts: {
    last_used: { key: 'lastUsed', column: timelineFacts.lastUsed },
  },
} as const;

function lastUsedColumn(bank: BankName, field: string) {
  const entry = (BANKS[bank] as Record<string, { key: string; column: PgColumn }>)[field];
  if (!entry) throw new Error(`Unknown last_used field: ${bank}.${field}`);
  return entry;
}

function isActiveDuplicate(err: unknown): boolean {
  // Drizzle envuelve el error del driver (DrizzleQueryError): el código está en `cause`.
  const source = (err as { cause?: unknown } | null)?.cause ?? err;
  const { code, constraint_name: constraint } = (source ?? {}) as {
    code?: string;
    constraint_name?: string;
  };
  return code === '23505' && constraint === ACTIVE_INDEX;
}

export type NewDraft = {
  gameId: GameId;
  date: string;
  number: number;
  payload: unknown;
  seed: string;
  attempt: number;
  generatorVersion: string;
};

export type ApproveOptions = {
  bank: BankName | null;
  lastUsedField: string;
  itemIds: string[];
  date: string;
};

export type VerifiedCandidate = {
  id: string;
  verification: VerificationLog;
  itemIds: string[];
  bank: BankName | null;
  lastUsedField: string;
};

export type ChallengeRef = { id: string; gameId: GameId; date: string; status: string };

async function touchLastUsed(
  orm: Db | Tx,
  bank: BankName | null,
  lastUsedField: string,
  itemIds: string[],
  date: string,
) {
  if (bank === null || itemIds.length === 0) return;
  const target = lastUsedColumn(bank, lastUsedField);
  // GREATEST: no retrocede la fecha al rellenar un hueco anterior.
  const set = { [target.key]: sql`GREATEST(${target.column}, ${date}::date)` };
  if (bank === 'timeline_facts') {
    await orm.update(timelineFacts).set(set).where(inArray(timelineFacts.id, itemIds));
  } else {
    await orm.update(terms).set(set).where(inArray(terms.id, itemIds));
  }
}

export class ChallengePublishingRepository {
  constructor(private readonly orm: Db | Tx) {}

  async maxAttempt(gameId: GameId, date: string): Promise<number | null> {
    const [row] = await this.orm
      .select({ max: sql<number | null>`max(${challenges.attempt})` })
      .from(challenges)
      .where(and(eq(challenges.gameId, gameId), eq(challenges.date, date)));
    return row?.max ?? null;
  }

  async upsertGenerationFailure(failure: {
    gameId: GameId;
    date: string;
    attempts: number;
    lastReason: string | null;
  }): Promise<void> {
    // updated_at lo mantiene el trigger set_updated_at.
    await this.orm
      .insert(generationFailures)
      .values(failure)
      .onConflictDoUpdate({
        target: [generationFailures.gameId, generationFailures.date],
        set: { attempts: failure.attempts, lastReason: failure.lastReason },
      });
  }

  async takePendingRequest(): Promise<{ id: string; challengeId: string } | null> {
    const [row] = await this.orm
      .select({ id: generationRequests.id, challengeId: generationRequests.challengeId })
      .from(generationRequests)
      .where(eq(generationRequests.status, 'pending'))
      .orderBy(asc(generationRequests.requestedAt))
      .limit(1)
      .for('update', { skipLocked: true });
    return row ?? null;
  }

  async findChallenge(id: string): Promise<ChallengeRef | null> {
    const [row] = await this.orm
      .select({
        id: challenges.id,
        gameId: challenges.gameId,
        date: challenges.date,
        status: challenges.status,
      })
      .from(challenges)
      .where(eq(challenges.id, id));
    return row ?? null;
  }

  async lockChallenge(id: string): Promise<ChallengeRef | null> {
    const [row] = await this.orm
      .select({
        id: challenges.id,
        gameId: challenges.gameId,
        date: challenges.date,
        status: challenges.status,
      })
      .from(challenges)
      .where(eq(challenges.id, id))
      .for('update');
    return row ?? null;
  }

  async finishRequest(
    id: string,
    result: { status: 'failed' | 'cancelled'; error?: string },
  ): Promise<void> {
    await this.orm
      .update(generationRequests)
      .set({ status: result.status, error: result.error ?? null, processedAt: sql`now()` })
      .where(eq(generationRequests.id, id));
  }

  /** Reemplazo atómico; el orden viejo -> nuevo respeta uq_challenges_active_game_date. */
  async replaceChallenge(input: {
    requestId: string;
    oldId: string;
    candidate: VerifiedCandidate;
    date: string;
  }): Promise<void> {
    const { requestId, oldId, candidate, date } = input;
    await this.orm
      .update(challenges)
      .set({
        status: 'rejected',
        verification: sql`${challenges.verification} || '{"reason":"regenerated"}'::jsonb`,
      })
      .where(and(eq(challenges.id, oldId), eq(challenges.status, 'approved')));
    await this.orm
      .update(challenges)
      .set({ status: 'approved', verification: candidate.verification })
      .where(and(eq(challenges.id, candidate.id), eq(challenges.status, 'draft')));
    await touchLastUsed(this.orm, candidate.bank, candidate.lastUsedField, candidate.itemIds, date);
    await this.orm
      .update(generationRequests)
      .set({ status: 'done', newChallengeId: candidate.id, processedAt: sql`now()` })
      .where(eq(generationRequests.id, requestId));
  }

  async cancelCandidate(requestId: string, candidate: VerifiedCandidate): Promise<void> {
    await this.orm
      .update(challenges)
      .set({
        status: 'rejected',
        verification: { ...candidate.verification, reason: 'request_cancelled' },
      })
      .where(eq(challenges.id, candidate.id));
    await this.finishRequest(requestId, { status: 'cancelled' });
  }

  async coveredDates(gameId: GameId, from: string, to: string): Promise<Set<string>> {
    const rows = await this.orm
      .select({ date: challenges.date })
      .from(challenges)
      .where(
        and(
          eq(challenges.gameId, gameId),
          between(challenges.date, from, to),
          inArray(challenges.status, [...ACTIVE_STATUSES]),
        ),
      );
    return new Set(rows.map((row) => row.date));
  }

  async bankItems(spec: HistorySpec): Promise<Record<string, unknown>[]> {
    if (spec.bank === null) return [];
    const { column } = lastUsedColumn(spec.bank, spec.lastUsedField);
    if (spec.bank === 'timeline_facts') {
      const rows = await this.orm
        .select({
          id: timelineFacts.id,
          label: timelineFacts.label,
          category: timelineFacts.category,
          event_date: timelineFacts.eventDate,
          date_precision: timelineFacts.datePrecision,
          note: timelineFacts.note,
          lastUsed: column,
        })
        .from(timelineFacts)
        .where(eq(timelineFacts.status, 'approved'));
      return rows.map(({ lastUsed, ...item }) => ({ ...item, [spec.lastUsedField]: lastUsed }));
    }
    const rows = await this.orm
      .select({
        id: terms.id,
        term: terms.term,
        category: terms.category,
        definition: terms.definition,
        summary: terms.summary,
        lastUsed: column,
      })
      .from(terms)
      .where(eq(terms.status, 'approved'));
    return rows.map(({ lastUsed, ...item }) => ({ ...item, [spec.lastUsedField]: lastUsed }));
  }

  async recentChallenges(
    gameId: GameId,
    from: string,
    to: string,
    payloadSchema: z.ZodType<unknown>,
    excludeDate?: string,
  ): Promise<RecentChallenge<unknown>[]> {
    const rows = await this.orm
      .select({ date: challenges.date, payload: challenges.payload })
      .from(challenges)
      .where(
        and(
          eq(challenges.gameId, gameId),
          between(challenges.date, from, to),
          inArray(challenges.status, [...ACTIVE_STATUSES]),
          excludeDate === undefined ? undefined : ne(challenges.date, excludeDate),
        ),
      )
      .orderBy(asc(challenges.date));
    return rows.map((row) => ({ date: row.date, payload: payloadSchema.parse(row.payload) }));
  }

  async insertDraft(draft: NewDraft): Promise<string> {
    const [row] = await this.orm
      .insert(challenges)
      .values({ ...draft, status: 'draft' })
      .returning({ id: challenges.id });
    return row!.id;
  }

  async approve(
    id: string,
    log: VerificationLog,
    options: ApproveOptions,
  ): Promise<'approved' | 'duplicate'> {
    // Se resuelve antes de abrir la transacción: una combinación inválida no escribe nada.
    if (options.bank !== null) lastUsedColumn(options.bank, options.lastUsedField);
    try {
      await this.orm.transaction(async (tx) => {
        await tx
          .update(challenges)
          .set({ status: 'approved', verification: log })
          .where(and(eq(challenges.id, id), eq(challenges.status, 'draft')));
        await touchLastUsed(tx, options.bank, options.lastUsedField, options.itemIds, options.date);
      });
      return 'approved';
    } catch (err) {
      if (!isActiveDuplicate(err)) throw err;
      await this.reject(id, { ok: false, checks: log.checks, reason: 'duplicate_active' });
      return 'duplicate';
    }
  }

  async reject(id: string, log: VerificationLog): Promise<void> {
    await this.orm
      .update(challenges)
      .set({ status: 'rejected', verification: log })
      .where(eq(challenges.id, id));
  }
}
