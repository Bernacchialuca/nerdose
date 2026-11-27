import { challengeNumber } from '@nerdose/core';
import type { GeneratorHistory, HistorySpec } from '@nerdose/core';
import type { Logger } from 'pino';

import type { GeneratorEntry } from '@/games/registry';
import { addDays } from '@/shared/dates';

import type {
  ChallengePublishingRepository,
  VerifiedCandidate,
} from './challenge-publishing.repository';
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

export type GenerateOutcome = 'approved' | 'verified' | 'covered' | 'missing' | 'aborted';
export type GenerateMode = 'fill' | 'regenerate';
export type GenerateResult = {
  outcome: GenerateOutcome;
  generated: number;
  approved: number;
  rejected: number;
  /** verification.reason del último candidato rechazado (null si no hubo rechazos). */
  lastReason: string | null;
  /** Solo en modo 'regenerate' con outcome 'verified': el candidato queda en draft. */
  candidate?: VerifiedCandidate;
};

/**
 * Ventana de historia del juego para la fecha D: [D - recentDays, D + aheadDays] sin la fila de D.
 * Sin aheadDays equivale a [D - recentDays, D - 1]. En una regeneración, el approved viejo de D
 * no cuenta contra su reemplazo (REQ-009).
 */
export function historyWindow(date: string, spec: HistorySpec) {
  return {
    from: addDays(date, -spec.recentDays),
    to: addDays(date, spec.aheadDays ?? 0),
    exclude: date,
  };
}

export async function generateForDate(
  input: { entry: GeneratorEntry; date: string; firstAttempt?: number; mode?: GenerateMode },
  deps: GenerateDeps,
): Promise<GenerateResult> {
  const { entry, date, firstAttempt = 0, mode = 'fill' } = input;
  const { repo, env, signal } = deps;
  const { gameId, generator, payloadSchema, version } = entry;
  const spec = generator.historySpec;

  const number = challengeNumber(date, env.LAUNCH_DATE);
  if (number === null) throw new Error(`Date ${date} is before LAUNCH_DATE`);

  const window = historyWindow(date, spec);
  const history: GeneratorHistory = {
    bankItems: await repo.bankItems(spec),
    recentChallenges: await repo.recentChallenges(
      gameId,
      window.from,
      window.to,
      payloadSchema,
      window.exclude,
    ),
  };

  const result: GenerateResult = {
    outcome: 'missing',
    generated: 0,
    approved: 0,
    rejected: 0,
    lastReason: null,
  };

  for (
    let attempt = firstAttempt;
    attempt < firstAttempt + env.GENERATION_MAX_ATTEMPTS;
    attempt++
  ) {
    if (signal.aborted) return { ...result, outcome: 'aborted' };
    const log = deps.log.child({ game_id: gameId, date, attempt });

    const seed = seedFor(env.GENERATOR_SECRET, gameId, date, attempt);
    const payload = payloadSchema.parse(generator.generate({ date, number, seed, history }));
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

    // verify puede ser asíncrono (juegos de código, REQ-009); await de un valor síncrono no cambia nada.
    const verification = await generator.verify(payload, history, { number });
    if (verification.ok && mode === 'regenerate') {
      // La cola hace el reemplazo atómico: el candidato queda en draft.
      return {
        ...result,
        outcome: 'verified',
        candidate: {
          id,
          verification,
          itemIds: generator.usedBankItems(payload),
          bank: spec.bank,
          lastUsedField: spec.lastUsedField,
        },
      };
    }
    if (verification.ok) {
      const approval = await repo.approve(id, verification, {
        bank: spec.bank,
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
      return { ...result, outcome: 'covered', lastReason: 'duplicate_active' };
    }

    await repo.reject(id, verification);
    result.rejected++;
    result.lastReason = verification.reason ?? null;
    log.info({ reason: verification.reason }, 'ChallengeRejected');
  }

  if (mode === 'fill') {
    deps.log.warn(
      { game_id: gameId, date, attempts: env.GENERATION_MAX_ATTEMPTS },
      'ChallengeGenerationFailed',
    );
  }
  return result;
}
