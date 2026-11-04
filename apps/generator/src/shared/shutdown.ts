import type { Logger } from 'pino';

import type { Scheduler } from '@/scheduler/scheduler';

export type ShutdownDeps = {
  logger: Logger;
  controller: AbortController;
  scheduler: Pick<Scheduler, 'stop'>;
  sql: { end(options?: { timeout?: number }): Promise<void> };
  exit?: (code: number) => void;
};

export function createShutdownHandler(deps: ShutdownDeps): () => Promise<void> {
  const { logger, controller, scheduler, sql, exit = process.exit } = deps;
  let running: Promise<void> | undefined;

  return () => {
    running ??= (async () => {
      controller.abort();
      scheduler.stop();
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
