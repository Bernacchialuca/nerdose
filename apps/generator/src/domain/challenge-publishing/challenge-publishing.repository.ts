import type { GameId, HistorySpec, RecentChallenge, VerificationLog } from '@nerdose/core';
import { challenges, terms } from '@nerdose/db';
import type { Db } from '@nerdose/db';
import { and, asc, between, eq, inArray, sql } from 'drizzle-orm';
import type { z } from 'zod';

const ACTIVE_STATUSES = ['approved', 'published', 'voided'] as const;
const ACTIVE_INDEX = 'uq_challenges_active_game_date';

const LAST_USED_COLUMNS = {
  last_used_devdle: { key: 'lastUsedDevdle', column: terms.lastUsedDevdle },
  last_used_grep: { key: 'lastUsedGrep', column: terms.lastUsedGrep },
} as const;

function lastUsedColumn(field: string) {
  const entry = LAST_USED_COLUMNS[field as keyof typeof LAST_USED_COLUMNS];
  if (!entry) throw new Error(`Unknown last_used field: ${field}`);
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

export type ApproveOptions = { lastUsedField: string; itemIds: string[]; date: string };

export class ChallengePublishingRepository {
  constructor(private readonly orm: Db) {}

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
    if (spec.bank === 'timeline_facts') throw new Error('timeline_facts bank not available');
    const { column } = lastUsedColumn(spec.lastUsedField);
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
  ): Promise<RecentChallenge<unknown>[]> {
    const rows = await this.orm
      .select({ date: challenges.date, payload: challenges.payload })
      .from(challenges)
      .where(
        and(
          eq(challenges.gameId, gameId),
          between(challenges.date, from, to),
          inArray(challenges.status, [...ACTIVE_STATUSES]),
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
    const { key, column } = lastUsedColumn(options.lastUsedField);
    try {
      await this.orm.transaction(async (tx) => {
        await tx
          .update(challenges)
          .set({ status: 'approved', verification: log })
          .where(and(eq(challenges.id, id), eq(challenges.status, 'draft')));
        if (options.itemIds.length > 0) {
          await tx
            .update(terms)
            // GREATEST: no retrocede la fecha al rellenar un hueco anterior.
            .set({ [key]: sql`GREATEST(${column}, ${options.date}::date)` })
            .where(inArray(terms.id, options.itemIds));
        }
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
