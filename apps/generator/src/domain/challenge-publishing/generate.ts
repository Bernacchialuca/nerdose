import { challengeNumber } from '@nerdose/core';
import type { GeneratorHistory } from '@nerdose/core';
import type { Logger } from 'pino';

import type { GeneratorEntry } from '@/games/registry';
import { addDays } from '@/shared/dates';

import type { ChallengePublishingRepository } from './challenge-publishing.repository';
import { seedFor, seedToHex } from './seed';

export type GenerateEnv = {
  GENERATOR_SECRET: string;
  LAUNCH_DATE: string;
  GENERATION_MAX_ATTEMPTS: number;
};

export type GenerateDeps = {
  repo: Pick<
    ChallengePublishingRepository,
    'bankItems' | 'recentChallenges' | 'insertDraft' | 'approve' | 'reject'
  >;
  env: GenerateEnv;
  log: Logger;
  signal: AbortSignal;
};

export type GenerateOutcome = 'approved' | 'covered' | 'missing' | 'aborted';
export type GenerateResult = {
  outcome: GenerateOutcome;
  generated: number;
  approved: number;
  rejected: number;
};

export async function generateForDate(
  input: { entry: GeneratorEntry; date: string },
  deps: GenerateDeps,
): Promise<GenerateResult> {
  const { entry, date } = input;
  const { repo, env, signal } = deps;
  const { gameId, generator, payloadSchema, version } = entry;
  const spec = generator.historySpec;

  const number = challengeNumber(date, env.LAUNCH_DATE);
  if (number === null) throw new Error(`Date ${date} is before LAUNCH_DATE`);

  const history: GeneratorHistory = {
    bankItems: await repo.bankItems(spec),
    recentChallenges: await repo.recentChallenges(
      gameId,
      addDays(date, -spec.recentDays),
      addDays(date, -1),
      payloadSchema,
    ),
  };

  const result: GenerateResult = { outcome: 'missing', generated: 0, approved: 0, rejected: 0 };

  for (let attempt = 0; attempt < env.GENERATION_MAX_ATTEMPTS; attempt++) {
    if (signal.aborted) return { ...result, outcome: 'aborted' };
    const log = deps.log.child({ game_id: gameId, date, attempt });

    const seed = seedFor(env.GENERATOR_SECRET, gameId, date, attempt);
    const payload = payloadSchema.parse(generator.generate({ date, seed, history }));
    const id = await repo.insertDraft({
      gameId,
      date,
      number,
      payload,
      seed: seedToHex(seed),
      attempt,
      generatorVersion: version,
    });
    result.generated++;
    log.info('ChallengeGenerated');

    const verification = generator.verify(payload, history);
    if (verification.ok) {
      const approval = await repo.approve(id, verification, {
        lastUsedField: spec.lastUsedField,
        itemIds: generator.usedBankItems(payload),
        date,
      });
      if (approval === 'approved') {
        result.approved++;
        log.info('ChallengeApproved');
        return { ...result, outcome: 'approved' };
      }
      result.rejected++;
      log.info({ reason: 'duplicate_active' }, 'ChallengeRejected');
      return { ...result, outcome: 'covered' };
    }

    await repo.reject(id, verification);
    result.rejected++;
    log.info({ reason: verification.reason }, 'ChallengeRejected');
  }

  deps.log.warn(
    { game_id: gameId, date, attempts: env.GENERATION_MAX_ATTEMPTS },
    'ChallengeGenerationFailed',
  );
  return result;
}
