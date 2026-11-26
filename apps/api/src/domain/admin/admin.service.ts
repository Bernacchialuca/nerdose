import { AppError, type GameRegistry, type ReportReason, type ReportStatus } from '@nerdose/core';
import type { Logger } from 'pino';

import type { Clock } from '@/shared/clock';
import { playerRef } from '@/shared/player-ref';

import { signAdminToken, verifyPassword } from './admin-auth';
import type { AdminRepository, ChallengeRow, ReportRow } from './admin.repository';
import type { AdminChallenge, AdminReport, ReportGroup } from './admin.types';

type Repo = Pick<
  AdminRepository,
  'listReportsByStatus' | 'findChallengesByIds' | 'closeReportIfOpen' | 'reportExists'
>;

export { playerRef } from '@/shared/player-ref';

const toAdminReport = (row: ReportRow): AdminReport => ({
  id: row.id,
  reason: row.reason,
  message: row.message,
  locale: row.locale,
  context: row.context,
  status: row.status,
  created_at: row.createdAt.toISOString(),
  player_ref: playerRef(row.playerId),
});

export class AdminService {
  constructor(
    private readonly deps: {
      passwordHash: string;
      jwtSecret: string;
      clock: Clock;
      repo: Repo;
      games: GameRegistry;
    },
  ) {}

  async login(password: string, log: Logger): Promise<{ token: string; expires_at: string }> {
    const { passwordHash, jwtSecret, clock } = this.deps;
    if (!(await verifyPassword(password, passwordHash))) {
      log.warn({ event: 'AdminLoginFailed' }, 'Admin login failed');
      throw new AppError('invalid_credentials');
    }
    const signed = await signAdminToken(jwtSecret, Math.floor(clock.now().getTime() / 1000));
    log.info({ event: 'AdminLoginSucceeded' }, 'Admin login succeeded');
    return signed;
  }

  private toAdminChallenge(row: ChallengeRow): AdminChallenge {
    const { games } = this.deps;
    // Defensivo: un game_id del enum fuera del registry (desde S-048 los 5 juegos están registrados).
    const culprits = games.ids().includes(row.gameId)
      ? games.get(row.gameId).culprits(row.payload)
      : [];
    return {
      id: row.id,
      game_id: row.gameId,
      date: row.date,
      number: row.number,
      status: row.status,
      payload: row.payload,
      verification: row.verification,
      void_reason: row.voidReason,
      voided_at: row.voidedAt ? row.voidedAt.toISOString() : null,
      culprits,
    };
  }

  async listReportGroups(status: ReportStatus): Promise<{ groups: ReportGroup[] }> {
    const { repo } = this.deps;
    const reports = await repo.listReportsByStatus(status);
    const byChallenge = new Map<string, ReportRow[]>();
    for (const r of reports) {
      const list = byChallenge.get(r.challengeId);
      if (list) list.push(r);
      else byChallenge.set(r.challengeId, [r]);
    }
    const rows = await repo.findChallengesByIds([...byChallenge.keys()]);

    const groups = rows.map((row) => {
      const list = byChallenge.get(row.id) ?? [];
      const reasons: Partial<Record<ReportReason, number>> = {};
      for (const r of list) reasons[r.reason] = (reasons[r.reason] ?? 0) + 1;
      return {
        date: row.date,
        group: {
          challenge: this.toAdminChallenge(row),
          alerted_at: row.alertedAt ? row.alertedAt.toISOString() : null,
          report_count: list.length,
          reasons,
          reports: list.map(toAdminReport),
        } satisfies ReportGroup,
      };
    });
    groups.sort(
      (a, b) =>
        Number(b.group.alerted_at !== null) - Number(a.group.alerted_at !== null) ||
        b.group.report_count - a.group.report_count ||
        (a.date < b.date ? 1 : a.date > b.date ? -1 : 0),
    );
    return { groups: groups.map((g) => g.group) };
  }

  async updateReport(
    reportId: string,
    status: 'resolved' | 'dismissed',
    log: Logger,
  ): Promise<AdminReport> {
    const { repo } = this.deps;
    const row = await repo.closeReportIfOpen(reportId, status);
    if (!row) {
      throw new AppError((await repo.reportExists(reportId)) ? 'report_not_open' : 'not_found');
    }
    log.info(
      {
        event: status === 'resolved' ? 'ReportResolved' : 'ReportDismissed',
        report_id: row.id,
        challenge_id: row.challengeId,
      },
      status === 'resolved' ? 'Report resolved' : 'Report dismissed',
    );
    return toAdminReport(row);
  }
}
