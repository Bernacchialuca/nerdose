import { Cron } from 'croner';
import type { Logger } from 'pino';

export type SchedulerDeps = { logger: Logger };
export type ScheduledJob = { name: string; pattern: string; run: () => Promise<void> | void };
export type Scheduler = { stop(): void };

const KEEP_ALIVE_INTERVAL_MS = 2 ** 30;

export function startScheduler(deps: SchedulerDeps, jobs: readonly ScheduledJob[] = []): Scheduler {
  const crons = jobs.map(
    (job) => new Cron(job.pattern, { name: job.name, timezone: 'UTC', protect: true }, job.run),
  );
  // Sin jobs ni conexión LISTEN no hay handle activo y Node terminaría solo; la conexión LISTEN
  // de generation-queue (feature group posterior) reemplazará este timer.
  let keepAlive: NodeJS.Timeout | undefined = setInterval(() => {}, KEEP_ALIVE_INTERVAL_MS);
  deps.logger.info({ jobs: jobs.length }, 'Scheduler started');

  return {
    stop() {
      for (const cron of crons) cron.stop();
      if (keepAlive) clearInterval(keepAlive);
      keepAlive = undefined;
    },
  };
}
