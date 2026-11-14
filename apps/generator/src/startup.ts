import type { Dataset } from '@nerdose/content';
import type { Db } from '@nerdose/db';
import type { Logger } from 'pino';

import type { GeneratorEnv } from '@/config/env';
import type { GeneratorRegistry } from '@/games/registry';
import type { Sql } from '@/infra/database/db';
import { fillJob } from '@/scheduler/jobs/fill.job';
import { syncBanksJob } from '@/scheduler/jobs/sync-banks.job';
import type { JobTracker } from '@/scheduler/job-tracker';
import { runJob } from '@/scheduler/run-job';
import { startScheduler, type ScheduledJob, type Scheduler } from '@/scheduler/scheduler';
import type { Clock } from '@/shared/clock';
import {
  startQueueListener,
  type QueueListener,
} from '@/domain/challenge-publishing/queue/queue-listener';

export const FILL_PATTERN = '10 * * * *';

export type StartupDeps = {
  sql: Sql;
  db: Db;
  logger: Logger;
  clock: Clock;
  signal: AbortSignal;
  tracker: JobTracker;
  env: Pick<GeneratorEnv, 'LAUNCH_DATE' | 'GENERATOR_SECRET' | 'GENERATION_MAX_ATTEMPTS'>;
  registry: GeneratorRegistry;
  loadDataset?: () => Dataset;
};

export function buildScheduledJobs(runFill: () => Promise<void> | void): ScheduledJob[] {
  return [{ name: 'fill', pattern: FILL_PATTERN, run: runFill }];
}

export type Running = { scheduler: Scheduler; queue: QueueListener };

export async function runStartup(deps: StartupDeps): Promise<Running | undefined> {
  const { sql, db, logger, clock, signal, tracker, env, registry } = deps;
  const jobDeps = { sql, db, logger, clock, signal, tracker };
  const runFill = async () => {
    await runJob('fill', fillJob({ db, env, registry }), jobDeps);
  };

  // fill corre aunque sync_banks falle: trabaja con lo que ya hay en la base.
  await runJob('sync_banks', syncBanksJob({ db, loadDataset: deps.loadDataset }), jobDeps);
  await runFill();

  if (signal.aborted) return undefined;
  const scheduler = startScheduler({ logger }, buildScheduledJobs(runFill));
  const queue = await startQueueListener({
    sql,
    db,
    env,
    registry,
    clock,
    logger,
    signal,
    tracker,
  });
  return { scheduler, queue };
}
