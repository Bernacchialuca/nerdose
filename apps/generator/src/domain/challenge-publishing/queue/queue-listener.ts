import type { Db } from '@nerdose/db';
import type { Logger } from 'pino';

import type { GeneratorRegistry } from '@/games/registry';
import type { Sql } from '@/infra/database/db';
import type { JobTracker } from '@/scheduler/job-tracker';
import type { Clock } from '@/shared/clock';

import type { GenerateEnv } from '../generate';
import { processNextRequest, type ProcessDeps } from './process-request';

export const QUEUE_CHANNEL = 'generation_requests';
export const QUEUE_POLL_MS = 60_000;

export type QueueListenerDeps = {
  sql: Sql;
  db: Db;
  env: GenerateEnv;
  registry: GeneratorRegistry;
  clock: Clock;
  logger: Logger;
  signal: AbortSignal;
  tracker?: Pick<JobTracker, 'track'>;
  pollMs?: number;
  /** Para tests: reemplaza a processNextRequest. */
  process?: (deps: ProcessDeps) => ReturnType<typeof processNextRequest>;
  repoFactory?: ProcessDeps['repoFactory'];
};

export type QueueListener = { stop(): Promise<void> };

export async function startQueueListener(deps: QueueListenerDeps): Promise<QueueListener> {
  const { sql, signal, logger, pollMs = QUEUE_POLL_MS } = deps;
  const process = deps.process ?? processNextRequest;
  let stopped = false;
  let current: Promise<void> | undefined;
  let again = false;

  async function drainOnce() {
    while (!signal.aborted && !stopped) {
      const result = await process({
        db: deps.db,
        env: deps.env,
        registry: deps.registry,
        clock: deps.clock,
        log: logger,
        signal,
        repoFactory: deps.repoFactory,
      });
      // idle / aborted / error cortan: un pedido que sigue pending se reintenta en el próximo disparo.
      if (result !== 'done' && result !== 'failed' && result !== 'cancelled') return;
    }
  }

  // Single-flight: un disparo durante un drain marca `again` y se repite al terminar.
  function drain(): Promise<void> {
    if (stopped) return Promise.resolve();
    if (current) {
      again = true;
      return current;
    }
    const run = (async () => {
      do {
        again = false;
        try {
          await drainOnce();
        } catch (err) {
          logger.error({ err }, 'Queue drain failed');
        }
      } while (again && !stopped && !signal.aborted);
    })().finally(() => {
      current = undefined;
    });
    current = run;
    deps.tracker?.track(run);
    return run;
  }

  // El payload del NOTIFY no se usa: solo dispara el drain (el dato se lee de la tabla).
  const listener = await sql.listen(
    QUEUE_CHANNEL,
    () => void drain(),
    () => {
      logger.info('LISTEN (re)connected');
      void drain();
    },
  );
  const poll = setInterval(() => void drain(), pollMs);
  await drain();
  logger.info('Queue listener started');

  return {
    async stop() {
      if (stopped) return;
      stopped = true;
      clearInterval(poll);
      await listener.unlisten();
      await current;
    },
  };
}
