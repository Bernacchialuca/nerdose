import type { BankName, GameId, ReportStatus } from '@nerdose/core';
import {
  challengeReports,
  challenges,
  generationFailures,
  generationRequests,
  jobRuns,
  plays,
  rejectedGuesses,
  terms,
  timelineFacts,
} from '@nerdose/db';
import type { Db, Tx } from '@nerdose/db';
import {
  and,
  asc,
  between,
  desc,
  eq,
  inArray,
  notExists,
  notInArray,
  sql,
  type SQL,
} from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';

import type { StreakBucket } from './admin.types';
import { BANK_COLUMNS } from './bank-columns';
import { escapeLike } from './bank-items';

export type DailyPlayersRow = { date: string; gameId: GameId | null; players: number };
export type RetentionRow = {
  cohortDate: string;
  cohortSize: number;
  d1Players: number;
  d7Players: number;
};
export type StreakRow = { bucket: StreakBucket; lastActiveDate: string | null; players: number };
export type ChallengeQualityRow = {
  challengeId: string;
  gameId: GameId;
  date: string;
  number: number;
  started: number;
  finished: number;
  completionRate: number | null;
  winRate: number | null;
  reports: number;
  status: 'published' | 'voided';
};

export type ReportRow = typeof challengeReports.$inferSelect;

export type ChallengeRow = Pick<
  typeof challenges.$inferSelect,
  | 'id'
  | 'gameId'
  | 'date'
  | 'number'
  | 'status'
  | 'payload'
  | 'verification'
  | 'voidReason'
  | 'voidedAt'
  | 'alertedAt'
>;

export type ApprovedChallengeRow = Pick<
  typeof challenges.$inferSelect,
  'id' | 'gameId' | 'date' | 'payload' | 'verification' | 'generatorVersion' | 'attempt'
>;

export type LatestRequestRow = Pick<
  typeof generationRequests.$inferSelect,
  'id' | 'challengeId' | 'status' | 'error' | 'requestedAt' | 'processedAt'
>;

export type ActiveFailureRow = Pick<
  typeof generationFailures.$inferSelect,
  'gameId' | 'date' | 'attempts' | 'lastReason' | 'updatedAt'
>;

export type BankCounts = {
  approvedTotal: number;
  rejectedTotal: number;
  available: number[];
  availableAll: number;
  /** Approved que cada consumidor puede elegir alguna vez (sin sus `excluded`). */
  approvedEligible: number[];
};

export type BankCountConsumer = { column: PgColumn; cutoff: string; excluded: readonly string[] };

export type BankItemFilters = {
  q?: string;
  status?: 'approved' | 'rejected';
  category?: string;
};

export type BankItemRow = {
  id: string;
  label: string;
  category: string;
  status: 'approved' | 'rejected';
  rejectionReason: string | null;
  sitelinks: number;
  wikidataId: string;
  description: string | null;
  eventDate: string | null;
  /** En el orden de las columnas pedidas. */
  lastUsed: Array<string | null>;
};

function bankItemsWhere(bank: BankName, f: BankItemFilters): SQL | undefined {
  const cols = BANK_COLUMNS[bank];
  const conditions: SQL[] = [];
  if (f.q) conditions.push(sql`${cols.label} ILIKE ${`%${escapeLike(f.q)}%`}`);
  if (f.status) conditions.push(sql`${cols.status} = ${f.status}`);
  if (f.category) conditions.push(sql`${cols.category} = ${f.category}`);
  return conditions.length ? and(...conditions) : undefined;
}

export class AdminRepository {
  constructor(private readonly db: Db | Tx) {}

  /** Usa `idx_reports_status_created_at`. */
  async listReportsByStatus(status: ReportStatus): Promise<ReportRow[]> {
    return this.db
      .select()
      .from(challengeReports)
      .where(eq(challengeReports.status, status))
      .orderBy(desc(challengeReports.createdAt));
  }

  async findChallengesByIds(ids: string[]): Promise<ChallengeRow[]> {
    if (ids.length === 0) return [];
    return this.db
      .select({
        id: challenges.id,
        gameId: challenges.gameId,
        date: challenges.date,
        number: challenges.number,
        status: challenges.status,
        payload: challenges.payload,
        verification: challenges.verification,
        voidReason: challenges.voidReason,
        voidedAt: challenges.voidedAt,
        alertedAt: challenges.alertedAt,
      })
      .from(challenges)
      .where(inArray(challenges.id, ids));
  }

  /** UPDATE … WHERE status = 'open': null si no hay fila abierta con ese id. */
  async closeReportIfOpen(id: string, status: 'resolved' | 'dismissed'): Promise<ReportRow | null> {
    const [row] = await this.db
      .update(challengeReports)
      .set({ status })
      .where(and(eq(challengeReports.id, id), eq(challengeReports.status, 'open')))
      .returning();
    return row ?? null;
  }

  async reportExists(id: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: challengeReports.id })
      .from(challengeReports)
      .where(eq(challengeReports.id, id))
      .limit(1);
    return rows.length > 0;
  }

  /** Sin `seed`: no se selecciona nunca (decisión 11). Usa `idx_challenges_date_status`. */
  async findApprovedBetween(from: string, to: string): Promise<ApprovedChallengeRow[]> {
    return this.db
      .select({
        id: challenges.id,
        gameId: challenges.gameId,
        date: challenges.date,
        payload: challenges.payload,
        verification: challenges.verification,
        generatorVersion: challenges.generatorVersion,
        attempt: challenges.attempt,
      })
      .from(challenges)
      .where(and(eq(challenges.status, 'approved'), between(challenges.date, from, to)));
  }

  /** Último pedido por challenge (usa `idx_generation_requests_challenge`). */
  async findLatestRequests(challengeIds: string[]): Promise<LatestRequestRow[]> {
    if (challengeIds.length === 0) return [];
    return this.db
      .selectDistinctOn([generationRequests.challengeId], {
        id: generationRequests.id,
        challengeId: generationRequests.challengeId,
        status: generationRequests.status,
        error: generationRequests.error,
        requestedAt: generationRequests.requestedAt,
        processedAt: generationRequests.processedAt,
      })
      .from(generationRequests)
      .where(inArray(generationRequests.challengeId, challengeIds))
      .orderBy(generationRequests.challengeId, desc(generationRequests.requestedAt));
  }

  /** Items de los bancos que hoy están `rejected`, por banco (una consulta cada uno). */
  async findRejectedBankItems(ids: {
    termIds: string[];
    factIds: string[];
  }): Promise<Array<{ kind: 'term' | 'timeline_fact'; id: string; rejectionReason: string }>> {
    const out: Array<{ kind: 'term' | 'timeline_fact'; id: string; rejectionReason: string }> = [];
    if (ids.termIds.length > 0) {
      const rows = await this.db
        .select({ id: terms.id, reason: terms.rejectionReason })
        .from(terms)
        .where(and(inArray(terms.id, ids.termIds), eq(terms.status, 'rejected')));
      for (const r of rows) out.push({ kind: 'term', id: r.id, rejectionReason: r.reason ?? '' });
    }
    if (ids.factIds.length > 0) {
      const rows = await this.db
        .select({ id: timelineFacts.id, reason: timelineFacts.rejectionReason })
        .from(timelineFacts)
        .where(and(inArray(timelineFacts.id, ids.factIds), eq(timelineFacts.status, 'rejected')));
      for (const r of rows) {
        out.push({ kind: 'timeline_fact', id: r.id, rejectionReason: r.reason ?? '' });
      }
    }
    return out;
  }

  /** Fallas sin challenge vigente para su (game_id, date), por fecha y juego (alfabético). */
  async findActiveFailures(from: string, to: string): Promise<ActiveFailureRow[]> {
    return this.db
      .select({
        gameId: generationFailures.gameId,
        date: generationFailures.date,
        attempts: generationFailures.attempts,
        lastReason: generationFailures.lastReason,
        updatedAt: generationFailures.updatedAt,
      })
      .from(generationFailures)
      .where(
        and(
          between(generationFailures.date, from, to),
          notExists(
            this.db
              .select({ one: sql`1` })
              .from(challenges)
              .where(
                and(
                  eq(challenges.gameId, generationFailures.gameId),
                  eq(challenges.date, generationFailures.date),
                  inArray(challenges.status, ['approved', 'published', 'voided']),
                ),
              ),
          ),
        ),
      )
      .orderBy(asc(generationFailures.date), asc(sql`${generationFailures.gameId}::text`));
  }

  /**
   * Un solo SELECT por banco; las columnas vienen de `BANK_COLUMNS`, nunca de strings libres.
   * `excluded`: textos que el generator de ese consumidor nunca elige; no cuentan para él.
   */
  async countBank(bank: BankName, consumers: BankCountConsumer[]): Promise<BankCounts> {
    const cols = BANK_COLUMNS[bank];
    const isApproved: SQL = sql`${cols.status} = 'approved'`;
    const eligible = (c: BankCountConsumer): SQL =>
      c.excluded.length ? notInArray(cols.label, [...c.excluded]) : sql`true`;
    const free = (c: BankCountConsumer): SQL =>
      sql`(${c.column} IS NULL OR ${c.column} <= ${c.cutoff}) and ${eligible(c)}`;
    const selection: Record<string, SQL<number>> = {
      approvedTotal: sql<number>`(count(*) filter (where ${isApproved}))::int`,
      rejectedTotal: sql<number>`(count(*) filter (where ${cols.status} = 'rejected'))::int`,
      availableAll: sql<number>`(count(*) filter (where ${sql.join(
        [isApproved, ...consumers.map(free)],
        sql` and `,
      )}))::int`,
    };
    consumers.forEach((c, i) => {
      selection[`c${i}`] = sql<number>`(count(*) filter (where ${isApproved} and ${free(c)}))::int`;
      selection[`e${i}`] =
        sql<number>`(count(*) filter (where ${isApproved} and ${eligible(c)}))::int`;
    });
    const [row] = await this.db.select(selection).from(cols.table);
    return {
      approvedTotal: row?.approvedTotal ?? 0,
      rejectedTotal: row?.rejectedTotal ?? 0,
      availableAll: row?.availableAll ?? 0,
      available: consumers.map((_, i) => row?.[`c${i}`] ?? 0),
      approvedEligible: consumers.map((_, i) => row?.[`e${i}`] ?? 0),
    };
  }

  /** Página de un banco para la pantalla Contenido; `lastUsed` en el orden de `lastUsedColumns`. */
  async listBankItems(
    bank: BankName,
    filters: BankItemFilters,
    lastUsedColumns: PgColumn[],
    page: { limit: number; offset: number },
  ): Promise<BankItemRow[]> {
    const cols = BANK_COLUMNS[bank];
    const selection: Record<string, SQL> = {
      id: sql<string>`${cols.id}`,
      label: sql<string>`${cols.label}`,
      category: sql<string>`${cols.category}::text`,
      status: sql<'approved' | 'rejected'>`${cols.status}::text`,
      rejectionReason: sql<string | null>`${cols.rejectionReason}`,
      sitelinks: sql<number>`${cols.sitelinks}`,
      wikidataId: sql<string>`${cols.wikidataId}`,
      description: sql<string | null>`${cols.description} ->> 'es'`,
      eventDate: cols.eventDate
        ? sql<string | null>`to_char(${cols.eventDate}, 'YYYY-MM-DD')`
        : sql<string | null>`null`,
    };
    lastUsedColumns.forEach((column, i) => {
      selection[`lu${i}`] = sql<string | null>`to_char(${column}, 'YYYY-MM-DD')`;
    });
    const rows = (await this.db
      .select(selection)
      .from(cols.table)
      .where(bankItemsWhere(bank, filters))
      .orderBy(asc(cols.label), asc(cols.id))
      .limit(page.limit)
      .offset(page.offset)) as Array<Record<string, unknown>>;
    return rows.map((r) => ({
      id: r.id as string,
      label: r.label as string,
      category: r.category as string,
      status: r.status as 'approved' | 'rejected',
      rejectionReason: (r.rejectionReason as string | null) ?? null,
      sitelinks: r.sitelinks as number,
      wikidataId: r.wikidataId as string,
      description: (r.description as string | null) ?? null,
      eventDate: (r.eventDate as string | null) ?? null,
      lastUsed: lastUsedColumns.map((_, i) => (r[`lu${i}`] as string | null) ?? null),
    }));
  }

  /** Mismos filtros que `listBankItems`. */
  async countBankItems(bank: BankName, filters: BankItemFilters): Promise<number> {
    const cols = BANK_COLUMNS[bank];
    const [row] = await this.db
      .select({ total: sql<number>`count(*)::int` })
      .from(cols.table)
      .where(bankItemsWhere(bank, filters));
    return row?.total ?? 0;
  }

  async findRejections(
    bank: BankName,
    limit = 200,
  ): Promise<Array<{ wikidata_id: string; label: string; reason: string }>> {
    const cols = BANK_COLUMNS[bank];
    const rows = await this.db
      .select({
        wikidata_id: sql<string>`${cols.wikidataId}`,
        label: sql<string>`${cols.label}`,
        reason: sql<string | null>`${cols.rejectionReason}`,
      })
      .from(cols.table)
      .where(sql`${cols.status} = 'rejected'`)
      .orderBy(desc(cols.updatedAt), asc(cols.wikidataId))
      .limit(limit);
    return rows.map((r) => ({ ...r, reason: r.reason ?? '' }));
  }

  /** Usa `idx_job_runs_job_started_at`. */
  async findLastSuccessfulSync(): Promise<{ finishedAt: Date | null; summary: unknown } | null> {
    const [row] = await this.db
      .select({ finishedAt: jobRuns.finishedAt, summary: jobRuns.summary })
      .from(jobRuns)
      .where(and(eq(jobRuns.job, 'sync_banks'), eq(jobRuns.status, 'success')))
      .orderBy(desc(jobRuns.startedAt))
      .limit(1);
    return row ?? null;
  }

  /** La PK (word, player_id) hace que count(*) cuente jugadores distintos. */
  async topRejectedGuesses(limit = 50): Promise<Array<{ word: string; distinct_players: number }>> {
    const distinctPlayers = sql<number>`count(*)::int`;
    return this.db
      .select({ word: rejectedGuesses.word, distinct_players: distinctPlayers })
      .from(rejectedGuesses)
      .groupBy(rejectedGuesses.word)
      .orderBy(desc(distinctPlayers), asc(rejectedGuesses.word))
      .limit(limit);
  }

  // Las vistas metrics_* no tienen schema Drizzle (migración 0008, SQL manual): se leen con SQL crudo.
  async metricsDailyPlayers(from: string, to: string): Promise<DailyPlayersRow[]> {
    const rows = await this.db.execute<DailyPlayersRow>(sql`
      SELECT date, game_id AS "gameId", players
      FROM metrics_daily_players
      WHERE date BETWEEN ${from}::date AND ${to}::date
      ORDER BY date, game_id NULLS FIRST`);
    return [...rows];
  }

  async metricsRetention(from: string, to: string): Promise<RetentionRow[]> {
    const rows = await this.db.execute<RetentionRow>(sql`
      SELECT cohort_date AS "cohortDate", cohort_size AS "cohortSize",
             d1_players AS "d1Players", d7_players AS "d7Players"
      FROM metrics_retention
      WHERE cohort_date BETWEEN ${from}::date AND ${to}::date
      ORDER BY cohort_date`);
    return [...rows];
  }

  async metricsStreakDistribution(): Promise<StreakRow[]> {
    const rows = await this.db.execute<StreakRow>(sql`
      SELECT bucket, last_active_date AS "lastActiveDate", players
      FROM metrics_streak_distribution`);
    return [...rows];
  }

  async metricsChallengeQuality(from: string, to: string): Promise<ChallengeQualityRow[]> {
    const rows = await this.db.execute<ChallengeQualityRow>(sql`
      SELECT challenge_id AS "challengeId", game_id AS "gameId", date, number, started, finished,
             completion_rate AS "completionRate", win_rate AS "winRate", reports, status
      FROM metrics_challenge_quality
      WHERE date BETWEEN ${from}::date AND ${to}::date
      ORDER BY date DESC, game_id`);
    return [...rows];
  }

  /** Usa `idx_plays_date`. */
  async playsSummary(
    from: string,
    to: string,
  ): Promise<{ uniquePlayers: number; completed: number }> {
    const [row] = await this.db
      .select({
        uniquePlayers: sql<number>`count(DISTINCT ${plays.playerId})::int`,
        completed: sql<number>`(count(*) FILTER (WHERE ${plays.status} IN ('won','lost','voided')))::int`,
      })
      .from(plays)
      .where(between(plays.date, from, to));
    return { uniquePlayers: row?.uniquePlayers ?? 0, completed: row?.completed ?? 0 };
  }
}
