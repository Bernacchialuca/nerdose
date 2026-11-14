import { loadEnv, loadLocalEnvFile } from '@/config/env';
import { createDatabase } from '@/infra/database/db';
import { verifyDbRole } from '@/infra/database/verify-role';
import { generatorRegistry } from '@/games/registry';
import { createJobTracker } from '@/scheduler/job-tracker';
import { systemClock } from '@/shared/clock';
import { createLogger } from '@/shared/logger';
import { createShutdownHandler } from '@/shared/shutdown';
import { runStartup, type Running } from '@/startup';

loadLocalEnvFile();

let env: ReturnType<typeof loadEnv> | undefined;
try {
  env = loadEnv();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

if (env) {
  const logger = createLogger(env);
  const { db, sql } = createDatabase(env.DATABASE_URL);
  let dbReady = true;
  try {
    await verifyDbRole(sql, logger);
  } catch (err) {
    dbReady = false;
    logger.fatal({ err }, 'Database unavailable at startup');
    await sql.end({ timeout: 0 }).catch(() => undefined);
    process.exitCode = 1;
  }

  if (dbReady) {
    const controller = new AbortController();
    const tracker = createJobTracker();
    const shutdown = createShutdownHandler({
      logger,
      controller,
      scheduler: { stop: () => void startup.then((running) => running?.scheduler.stop()) },
      // Espera al arranque en curso: así el LISTEN nunca queda abierto tras cerrar la base.
      queue: {
        stop: async () => {
          const running = await startup;
          running?.scheduler.stop();
          await running?.queue.stop();
        },
      },
      tracker,
      sql,
    });
    process.on('SIGTERM', () => void shutdown());
    process.on('SIGINT', () => void shutdown());
    const startup: Promise<Running | undefined> = runStartup({
      sql,
      db,
      logger,
      clock: systemClock,
      signal: controller.signal,
      tracker,
      env,
      registry: generatorRegistry,
    });
    await startup;
  }
}
