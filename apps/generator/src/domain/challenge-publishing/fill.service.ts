import { today } from '@nerdose/core';
import type { Db } from '@nerdose/db';
import type { Logger } from 'pino';

import type { GeneratorRegistry } from '@/games/registry';
import { addDays, maxDate } from '@/shared/dates';

import { ChallengePublishingRepository } from './challenge-publishing.repository';
import { generateForDate, type GenerateEnv } from './generate';

export const FILL_WINDOW_DAYS = 14;

export type FillSummary = {
  generated: number;
  approved: number;
  rejected: number;
  missing: number;
};

export type FillDeps = {
  db: Db;
  env: GenerateEnv;
  registry: GeneratorRegistry;
  repo?: Pick<
    ChallengePublishingRepository,
    'coveredDates' | 'bankItems' | 'recentChallenges' | 'insertDraft' | 'approve' | 'reject'
  >;
};

export function fillRange(now: Date, launchDate: string): string[] {
  const day = today(now);
  const from = maxDate(addDays(day, 1), launchDate);
  const to = addDays(day, FILL_WINDOW_DAYS);
  const dates: string[] = [];
  for (let date = from; date <= to; date = addDays(date, 1)) dates.push(date);
  return dates;
}

type FillCtx = { now: Date; log: Logger; signal: AbortSignal };
type FillOutcome = { summary: FillSummary; failed: boolean };

export function runFill(ctx: FillCtx, deps: FillDeps): Promise<FillOutcome> {
  return fillDates(ctx, deps, fillRange(ctx.now, deps.env.LAUNCH_DATE));
}

/**
 * Solo desarrollo local: genera el desafío de HOY si falta. ADR-007 prohíbe que `fill` genere
 * para hoy; esto existe para poder jugar con una base recién creada sin esperar al día siguiente.
 * Se niega a correr en producción y antes de `LAUNCH_DATE`.
 */
export async function runGenerateToday(
  ctx: FillCtx,
  deps: FillDeps & { nodeEnv: 'development' | 'test' | 'production' },
): Promise<FillOutcome> {
  if (deps.nodeEnv === 'production') {
    throw new Error('generate:today is a local development tool; refusing to run in production');
  }
  const day = today(ctx.now);
  if (day < deps.env.LAUNCH_DATE) {
    throw new Error(`Today (${day}) is before LAUNCH_DATE (${deps.env.LAUNCH_DATE})`);
  }
  return fillDates(ctx, deps, [day]);
}

async function fillDates(ctx: FillCtx, deps: FillDeps, range: string[]): Promise<FillOutcome> {
  const { log, signal } = ctx;
  const repo = deps.repo ?? new ChallengePublishingRepository(deps.db);
  const summary: FillSummary = { generated: 0, approved: 0, rejected: 0, missing: 0 };
  let failed = false;
  const first = range[0];
  const last = range.at(-1);

  if (first && last) {
    for (const gameId of deps.registry.ids()) {
      const entry = deps.registry.get(gameId);
      const covered = await repo.coveredDates(gameId, first, last);
      for (const date of range.filter((d) => !covered.has(d))) {
        if (signal.aborted) return { summary, failed };
        try {
          const result = await generateForDate(
            { entry, date },
            { repo, env: deps.env, log, signal },
          );
          summary.generated += result.generated;
          summary.approved += result.approved;
          summary.rejected += result.rejected;
          if (result.outcome === 'missing') summary.missing++;
        } catch (err) {
          failed = true;
          log.error({ game_id: gameId, date, err }, 'Gap generation failed');
        }
      }
    }
  }

  return { summary, failed };
}
