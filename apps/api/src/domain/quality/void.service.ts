import { AppError, today, type GameRegistry } from '@nerdose/core';
import type { Logger } from 'pino';

import type { ProgressService } from '@/domain/progress/progress.service';
import type { TodayCache } from '@/infra/cache/today-cache';
import type { Clock } from '@/shared/clock';

import type { VoidRequest } from './void.schema';
import type { VoidTx } from './quality.types';

export class VoidService {
  constructor(
    private readonly deps: {
      games: GameRegistry;
      runInTx: VoidTx;
      cache: Pick<TodayCache, 'reload'>;
      progress: Pick<ProgressService, 'recompute'>;
      clock: Clock;
    },
  ) {}

  async void(
    challengeId: string,
    body: VoidRequest,
    log: Logger,
  ): Promise<{ challenge_id: string; affected_plays: number }> {
    const { games, runInTx, cache, progress, clock } = this.deps;
    const { culprit } = body;
    const events: Array<() => void> = [];

    const outcome = await runInTx(async (repos) => {
      const { quality } = repos;
      const challenge = await quality.lockChallengeForUpdate(challengeId);
      if (!challenge) throw new AppError('not_found');
      if (challenge.status !== 'published') throw new AppError('not_voidable');

      const registered = games.ids().includes(challenge.gameId);
      if (culprit.kind === 'term' || culprit.kind === 'timeline_fact') {
        const culprits = registered ? games.get(challenge.gameId).culprits(challenge.payload) : [];
        if (!culprits.some((c) => c.kind === culprit.kind && c.id === culprit.id)) {
          throw new AppError('invalid_culprit');
        }
      }

      await quality.markVoided(challengeId, body.void_reason);
      const playerIds = await quality.voidPlays(challengeId);
      const resolvedReports = await quality.resolveOpenReports(challengeId);

      let rejected = false;
      if (culprit.kind === 'term') {
        rejected = await quality.rejectTerm(culprit.id!, body.void_reason);
      } else if (culprit.kind === 'timeline_fact') {
        rejected = await quality.rejectTimelineFact(culprit.id!, body.void_reason);
      }

      const { players } = await progress.recompute(repos.progress, {
        playerIds,
        game: games.get(challenge.gameId),
      });

      events.push(
        () =>
          log.info(
            {
              event: 'ChallengeVoided',
              challenge_id: challengeId,
              game_id: challenge.gameId,
              culprit_kind: culprit.kind,
              affected_plays: playerIds.length,
            },
            'Challenge voided',
          ),
        ...(rejected
          ? [
              () =>
                log.info(
                  { event: 'ContentItemRejected', kind: culprit.kind, id: culprit.id },
                  'Content item rejected',
                ),
            ]
          : []),
        () =>
          log.info(
            { event: 'ReportResolved', challenge_id: challengeId, count: resolvedReports },
            'Reports resolved',
          ),
        () =>
          log.info(
            { event: 'StreaksUpdated', challenge_id: challengeId, players },
            'Streaks updated',
          ),
      );
      return { date: challenge.date, affectedPlays: playerIds.length };
    });

    for (const emit of events) emit();

    // La anulación ya está persistida: una recarga fallida no la deshace.
    const day = today(clock.now());
    if (outcome.date === day) {
      try {
        await cache.reload(day);
      } catch (err) {
        log.error({ err }, 'Today cache reload failed');
      }
    }
    return { challenge_id: challengeId, affected_plays: outcome.affectedPlays };
  }
}
