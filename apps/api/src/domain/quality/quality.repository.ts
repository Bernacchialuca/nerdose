import type { CodeLanguage, GameId, Locale, ReportReason } from '@nerdose/core';
import { challengeReports, challenges, plays } from '@nerdose/db';
import type { Db, Tx } from '@nerdose/db';
import { and, count, eq, inArray, lte, sql } from 'drizzle-orm';

import { REPORT_THRESHOLD_REASONS } from './quality.threshold';
import type { ReportContext } from './quality.types';

export class QualityRepository {
  constructor(private readonly db: Db | Tx) {}

  /** Desafío reportable (published/voided, de hoy o pasado) con FOR SHARE. */
  async lockReportable(
    gameId: GameId,
    number: number,
    day: string,
  ): Promise<{ id: string; status: string; alertedAt: Date | null } | null> {
    const [row] = await this.db
      .select({ id: challenges.id, status: challenges.status, alertedAt: challenges.alertedAt })
      .from(challenges)
      .where(
        and(
          eq(challenges.gameId, gameId),
          eq(challenges.number, number),
          inArray(challenges.status, ['published', 'voided']),
          lte(challenges.date, day),
        ),
      )
      .for('share');
    return row ?? null;
  }

  async findPlay(
    playerId: string,
    challengeId: string,
  ): Promise<{ status: string; state: unknown; codeLanguage: CodeLanguage | null } | null> {
    const [row] = await this.db
      .select({ status: plays.status, state: plays.state, codeLanguage: plays.codeLanguage })
      .from(plays)
      .where(and(eq(plays.playerId, playerId), eq(plays.challengeId, challengeId)));
    return row ?? null;
  }

  /** INSERT … ON CONFLICT (player_id, challenge_id) DO NOTHING: null si ya reportó. */
  async insertReportIfAbsent(values: {
    challengeId: string;
    playerId: string;
    reason: ReportReason;
    message: string | null;
    locale: Locale;
    context: ReportContext;
  }): Promise<{ id: string } | null> {
    const [row] = await this.db
      .insert(challengeReports)
      .values(values)
      .onConflictDoNothing({ target: [challengeReports.playerId, challengeReports.challengeId] })
      .returning({ id: challengeReports.id });
    return row ?? null;
  }

  /** Reportes que cuentan para el umbral (wrong_answer/ambiguous). */
  async countThresholdReports(challengeId: string): Promise<number> {
    const [row] = await this.db
      .select({ n: count() })
      .from(challengeReports)
      .where(
        and(
          eq(challengeReports.challengeId, challengeId),
          inArray(challengeReports.reason, [...REPORT_THRESHOLD_REASONS]),
        ),
      );
    return row?.n ?? 0;
  }

  async countFinishedPlays(challengeId: string): Promise<number> {
    const [row] = await this.db
      .select({ n: count() })
      .from(plays)
      .where(and(eq(plays.challengeId, challengeId), inArray(plays.status, ['won', 'lost'])));
    return row?.n ?? 0;
  }

  /** Marca `alerted_at` una sola vez; true si esta llamada la marcó. */
  async markAlerted(challengeId: string): Promise<boolean> {
    const rows = await this.db
      .update(challenges)
      .set({ alertedAt: sql`now()` })
      .where(and(eq(challenges.id, challengeId), sql`${challenges.alertedAt} is null`))
      .returning({ id: challenges.id });
    return rows.length > 0;
  }

  async hasReported(playerId: string, challengeId: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: challengeReports.id })
      .from(challengeReports)
      .where(
        and(eq(challengeReports.playerId, playerId), eq(challengeReports.challengeId, challengeId)),
      )
      .limit(1);
    return rows.length > 0;
  }
}
