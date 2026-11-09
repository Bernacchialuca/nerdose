import type { Logger } from 'pino';

import type { JobTracker } from '@/scheduler/job-tracker';
import type { Scheduler } from '@/scheduler/scheduler';

export type ShutdownDeps = {
  logger: Logger;
  controller: AbortController;
  scheduler: Pick<Scheduler, 'stop'>;
  tracker?: Pick<JobTracker, 'idle'>;
  sql: { end(options?: { timeout?: number }): Promise<void> };
  exit?: (code: number) => void;
};

export function createShutdownHandler(deps: ShutdownDeps): () => Promise<void> {
  const { logger, controller, scheduler, tracker, sql, exit = process.exit } = deps;
  let running: Promise<void> | undefined;

  return () => {
    running ??= (async () => {
      controller.abort();
      scheduler.stop();
      await tracker?.idle();
      try {
        await sql.end({ timeout: 5 });
      } catch (err) {
        logger.error({ err }, 'Database close failed');
      }
      logger.info('Shutdown complete');
      exit(0);
    })();
    return running;
  };
}
