import type { Db } from '@nerdose/db';
import type { Logger } from 'pino';

import type { Sql } from '@/infra/database/db';
import type { Clock } from '@/shared/clock';

import { JobRunsRepository } from './job-runs.repository';
import type { JobTracker } from './job-tracker';

export const LOCK_KEYS = { fill: 7001, sync_banks: 7002 } as const;
export type JobName = keyof typeof LOCK_KEYS;

export type JobContext = { log: Logger; signal: AbortSignal; now: Date };
export type JobBody = (
  ctx: JobContext,
) => Promise<{ summary: Record<string, unknown>; failed?: boolean }>;
export type JobResult = 'success' | 'failed' | 'skipped';

export type RunJobDeps = {
  sql: Sql;
  db: Db;
  logger: Logger;
  clock: Clock;
  signal: AbortSignal;
  jobRuns?: Pick<JobRunsRepository, 'start' | 'finish'>;
  tracker?: JobTracker;
};

const messageOf = (err: unknown) => (err instanceof Error ? err.message : String(err));

async function execute(name: JobName, body: JobBody, deps: RunJobDeps): Promise<JobResult> {
  const { sql, logger, clock, signal } = deps;
  const jobRuns = deps.jobRuns ?? new JobRunsRepository(deps.db);
  const log = logger.child({ job: name });
  let runId: string | undefined;
  let reserved: Awaited<ReturnType<Sql['reserve']>> | undefined;
  let locked = false;

  try {
    // El lock es de sesión: lock y unlock deben ir por la misma conexión, no por el pool.
    reserved = await sql.reserve();
    const [row] = await reserved<
      { locked: boolean }[]
    >`SELECT pg_try_advisory_lock(${LOCK_KEYS[name]}) AS locked`;
    locked = row?.locked === true;
    if (!locked) {
      log.info('Job already running elsewhere, skipping');
      return 'skipped';
    }

    runId = await jobRuns.start(name);
    const result = await body({ log, signal, now: clock.now() });
    const status = result.failed ? 'failed' : 'success';
    await jobRuns.finish(runId, status, result.summary);
    log.info({ status, summary: result.summary }, 'Job finished');
    return status;
  } catch (err) {
    log.error({ err }, 'Job failed');
    if (runId) {
      try {
        await jobRuns.finish(runId, 'failed', { error: messageOf(err) });
      } catch (finishErr) {
        log.error({ err: finishErr }, 'Job run could not be closed');
      }
    }
    return 'failed';
  } finally {
    if (reserved) {
      try {
        if (locked) {
          await reserved`SELECT pg_advisory_unlock(${LOCK_KEYS[name]})`;
        }
      } catch (err) {
        log.error({ err }, 'Job unlock failed');
      } finally {
        reserved.release();
      }
    }
  }
}

export function runJob(name: JobName, body: JobBody, deps: RunJobDeps): Promise<JobResult> {
  const running = execute(name, body, deps);
  return deps.tracker ? deps.tracker.track(running) : running;
}
