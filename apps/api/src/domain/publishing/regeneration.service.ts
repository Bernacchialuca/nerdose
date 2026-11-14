import { AppError, today } from '@nerdose/core';
import type { Logger } from 'pino';

import type { Clock } from '@/shared/clock';

import type { PublishingRepository } from './publishing.repository';
import type { RegenerationAccepted } from './publishing.types';

export type RegenerationRepo = Pick<
  PublishingRepository,
  'findChallengeStatus' | 'insertPendingRequest' | 'findPendingRequest' | 'notify'
>;

export type RegenerationTx = <T>(fn: (repo: RegenerationRepo) => Promise<T>) => Promise<T>;

export class RegenerationService {
  constructor(private readonly deps: { runInTx: RegenerationTx; clock: Clock }) {}

  async regenerate(challengeId: string, log: Logger): Promise<RegenerationAccepted> {
    const { runInTx, clock } = this.deps;

    const outcome = await runInTx(async (repo) => {
      const challenge = await repo.findChallengeStatus(challengeId);
      if (!challenge) throw new AppError('not_found');
      if (challenge.status !== 'approved' || challenge.date <= today(clock.now())) {
        throw new AppError('not_regenerable');
      }

      let request = await repo.insertPendingRequest(challengeId);
      let created = request !== null;
      if (!request) {
        request = await repo.findPendingRequest(challengeId);
        if (!request) {
          // El generator cerró el pendiente entre las dos sentencias: un reintento.
          request = await repo.insertPendingRequest(challengeId);
          created = request !== null;
        }
        if (!request) throw new Error('regeneration request race');
      }
      // Se repite también con un pedido existente: despierta al generator si se perdió el primero.
      await repo.notify(request.id);
      return { request, created };
    });

    log.info(
      {
        event: 'ChallengeRegenerationRequested',
        challenge_id: challengeId,
        request_id: outcome.request.id,
        created: outcome.created,
      },
      'Challenge regeneration requested',
    );
    return {
      request_id: outcome.request.id,
      status: 'pending',
      requested_at: outcome.request.requestedAt.toISOString(),
    };
  }
}
