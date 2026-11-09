import { loadEnv, loadLocalEnvFile } from '@/config/env';
import { createDatabase } from '@/infra/database/db';
import { verifyDbRole } from '@/infra/database/verify-role';
import { generatorRegistry } from '@/games/registry';
import { createJobTracker } from '@/scheduler/job-tracker';
import type { Scheduler } from '@/scheduler/scheduler';
import { systemClock } from '@/shared/clock';
import { createLogger } from '@/shared/logger';
import { createShutdownHandler } from '@/shared/shutdown';
import { runStartup } from '@/startup';

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
    const running: { scheduler?: Scheduler } = {};
    const shutdown = createShutdownHandler({
      logger,
      controller,
      scheduler: { stop: () => running.scheduler?.stop() },
      tracker,
      sql,
    });
    process.on('SIGTERM', () => void shutdown());
    process.on('SIGINT', () => void shutdown());
    running.scheduler = await runStartup({
      sql,
      db,
      logger,
      clock: systemClock,
      signal: controller.signal,
      tracker,
      env,
      registry: generatorRegistry,
    });
  }
}
