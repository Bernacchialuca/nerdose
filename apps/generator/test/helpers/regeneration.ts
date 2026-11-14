import { generationRequests } from '@nerdose/db';
import type { Db } from '@nerdose/db';

import { ChallengePublishingRepository } from '@/domain/challenge-publishing/challenge-publishing.repository';
import { generateForDate } from '@/domain/challenge-publishing/generate';
import { generatorRegistry } from '@/games/registry';

import { captureLogger } from './logger';

export const SECRET = 'test-secret-0123456789abcdef0123456789';
export const NOW = new Date('2026-12-01T12:00:00.000Z');
export const D = '2026-12-05';
export const ENV = {
  GENERATOR_SECRET: SECRET,
  LAUNCH_DATE: '2026-11-20',
  GENERATION_MAX_ATTEMPTS: 20,
};

/** Crea el desafío viejo aprobado con el pipeline real (modo fill, attempt 0). */
export async function approveOld(svc: Db, date = D, env = ENV) {
  const repo = new ChallengePublishingRepository(svc);
  const result = await generateForDate(
    { entry: generatorRegistry.get('devdle'), date },
    {
      repo,
      env,
      log: captureLogger().logger,
      signal: new AbortController().signal,
    },
  );
  if (result.outcome !== 'approved') throw new Error(`old not approved: ${result.outcome}`);
  return result;
}

export async function requestFor(owner: Db, challengeId: string, requestedAt?: Date) {
  const [row] = await owner
    .insert(generationRequests)
    .values({ challengeId, ...(requestedAt ? { requestedAt } : {}) })
    .returning();
  return row!;
}
