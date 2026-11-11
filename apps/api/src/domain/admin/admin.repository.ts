import type { ReportStatus } from '@nerdose/core';
import { challengeReports, challenges } from '@nerdose/db';
import type { Db, Tx } from '@nerdose/db';
import { and, desc, eq, inArray } from 'drizzle-orm';

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
}
