import { today } from '@nerdose/core';
import type { Db, Tx } from '@nerdose/db';
import type { Logger } from 'pino';

import type { GeneratorRegistry } from '@/games/registry';
import type { Clock } from '@/shared/clock';

import { ChallengePublishingRepository } from '../challenge-publishing.repository';
import { generateForDate, type GenerateEnv } from '../generate';

export type ProcessResult = 'idle' | 'done' | 'failed' | 'cancelled' | 'aborted' | 'error';

export type ProcessDeps = {
  db: Db;
  env: GenerateEnv;
  registry: GeneratorRegistry;
  clock: Clock;
  log: Logger;
  signal: AbortSignal;
  /** Permite a los tests envolver el repositorio (Tx A y pool). */
  repoFactory?: (orm: Db | Tx) => ChallengePublishingRepository;
};

const DEFAULT_ERROR = 'verification failed after retries';

/**
 * Atiende un pedido de regeneración. Tx A mantiene el lock del pedido (SKIP LOCKED) mientras los
 * candidatos se generan en el pool (cada uno commitea solo, queda como auditoría); el reemplazo
 * viejo -> nuevo ocurre dentro de Tx A. Nunca propaga: un error de BD en Tx A devuelve 'error'
 * y el pedido sigue `pending` (ROLLBACK).
 */
export async function processNextRequest(deps: ProcessDeps): Promise<ProcessResult> {
  const { db, env, registry, clock, signal } = deps;
  const factory = deps.repoFactory ?? ((orm) => new ChallengePublishingRepository(orm));
  let log = deps.log.child({ queue: 'generation_requests' });

  try {
    return await db.transaction(async (tx): Promise<ProcessResult> => {
      const queue = factory(tx);
      const pool = factory(db);

      const request = await queue.takePendingRequest();
      if (!request) return 'idle';
      log = log.child({ request_id: request.id, challenge_id: request.challengeId });

      const old = await queue.findChallenge(request.challengeId);
      const day = today(clock.now());
      if (!old || old.status !== 'approved' || old.date <= day) {
        await queue.finishRequest(request.id, { status: 'cancelled' });
        log.info(
          { reason: old && old.status === 'approved' ? 'date_arrived' : 'not_approved' },
          'ChallengeRegenerationCancelled',
        );
        return 'cancelled';
      }
      log = log.child({ game_id: old.gameId, date: old.date });

      let result;
      try {
        const entry = registry.get(old.gameId);
        const firstAttempt = ((await pool.maxAttempt(old.gameId, old.date)) ?? -1) + 1;
        result = await generateForDate(
          { entry, date: old.date, firstAttempt, mode: 'regenerate' },
          { repo: pool, env, log, signal },
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await queue.finishRequest(request.id, { status: 'failed', error: message });
        log.warn({ err }, 'ChallengeRegenerationFailed');
        return 'failed';
      }

      if (result.outcome === 'aborted') return 'aborted';

      if (result.outcome !== 'verified' || !result.candidate) {
        await queue.finishRequest(request.id, {
          status: 'failed',
          error: result.lastReason ?? DEFAULT_ERROR,
        });
        log.warn({ reason: result.lastReason }, 'ChallengeRegenerationFailed');
        return 'failed';
      }

      const candidate = result.candidate;
      // Re-lectura con lock: serializa con la publicación del desafío viejo.
      const locked = await queue.lockChallenge(old.id);
      const stillToday = today(clock.now());
      if (!locked || locked.status !== 'approved' || locked.date <= stillToday) {
        await queue.cancelCandidate(request.id, candidate);
        log.info(
          {
            reason:
              locked && locked.status === 'approved'
                ? 'date_arrived'
                : 'published_before_replacement',
            new_challenge_id: candidate.id,
          },
          'ChallengeRegenerationCancelled',
        );
        return 'cancelled';
      }

      await queue.replaceChallenge({
        requestId: request.id,
        oldId: old.id,
        candidate,
        date: old.date,
      });
      log.info({ new_challenge_id: candidate.id }, 'ChallengeRegenerated');
      return 'done';
    });
  } catch (err) {
    log.error({ err }, 'Regeneration replacement failed');
    return 'error';
  }
}
