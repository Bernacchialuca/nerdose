import { AppError, today, type GameRegistry, type Locale } from '@nerdose/core';
import type { Player } from '@nerdose/db';
import type { Logger } from 'pino';

import type { Clock } from '@/shared/clock';

import type { ReportBody } from './quality.schema';
import { REPORT_THRESHOLD_REASONS, shouldAlert } from './quality.threshold';
import type { AlertThresholds, ReportTx } from './quality.types';

type PgError = { code?: string; cause?: { code?: string } };
const pgCode = (e: unknown): string | undefined =>
  (e as PgError)?.code ?? (e as PgError)?.cause?.code;

export class QualityService {
  constructor(
    private readonly deps: {
      games: GameRegistry;
      runInTx: ReportTx;
      clock: Clock;
      thresholds: AlertThresholds;
    },
  ) {}

  async report(
    gameId: string,
    player: Player,
    body: ReportBody,
    meta: { locale: Locale; userAgent?: string },
    log: Logger,
  ): Promise<{ report_id: string }> {
    const { games, runInTx, clock, thresholds } = this.deps;
    const game = games.get(gameId);
    const day = today(clock.now());

    // Un deadlock (40P01) por la marca concurrente del umbral se reintenta una vez.
    for (let attempt = 0; ; attempt++) {
      const events: Array<() => void> = [];
      try {
        const reportId = await runInTx(async (repo) => {
          const challenge = await repo.lockReportable(game.id, body.challenge_number, day);
          if (!challenge) throw new AppError('not_found');

          const play = await repo.findPlay(player.id, challenge.id);
          const inserted = await repo.insertReportIfAbsent({
            challengeId: challenge.id,
            playerId: player.id,
            reason: body.reason,
            message: body.message ? body.message : null,
            locale: meta.locale,
            context: {
              code_language: play?.codeLanguage ?? null,
              play_status: play?.status ?? null,
              play_state: play?.state ?? null,
              user_agent: meta.userAgent?.slice(0, 512) ?? null,
            },
          });
          if (!inserted) throw new AppError('already_reported');

          events.push(() =>
            log.info(
              {
                event: 'ChallengeReported',
                report_id: inserted.id,
                challenge_id: challenge.id,
                reason: body.reason,
                locale: meta.locale,
              },
              'Challenge reported',
            ),
          );

          const counts =
            (REPORT_THRESHOLD_REASONS as readonly string[]).includes(body.reason) &&
            challenge.status === 'published' &&
            challenge.alertedAt === null;
          if (counts) {
            const [n, f] = await Promise.all([
              repo.countThresholdReports(challenge.id),
              repo.countFinishedPlays(challenge.id),
            ]);
            if (shouldAlert({ n, f }, thresholds) && (await repo.markAlerted(challenge.id))) {
              events.push(() =>
                log.info(
                  {
                    event: 'ReportThresholdReached',
                    challenge_id: challenge.id,
                    report_count: n,
                    ratio: f > 0 ? n / f : null,
                  },
                  'Report threshold reached',
                ),
              );
            }
          }
          return inserted.id;
        });
        for (const emit of events) emit();
        return { report_id: reportId };
      } catch (err) {
        if (attempt === 0 && pgCode(err) === '40P01') continue;
        throw err;
      }
    }
  }
}
