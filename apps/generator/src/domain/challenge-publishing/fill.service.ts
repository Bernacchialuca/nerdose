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

export async function runFill(
  ctx: { now: Date; log: Logger; signal: AbortSignal },
  deps: FillDeps,
): Promise<{ summary: FillSummary; failed: boolean }> {
  const { now, log, signal } = ctx;
  const repo = deps.repo ?? new ChallengePublishingRepository(deps.db);
  const range = fillRange(now, deps.env.LAUNCH_DATE);
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
