import { loadEnv, loadLocalEnvFile } from '@/config/env';
import { createDatabase } from '@/infra/database/db';
import { verifyDbRole } from '@/infra/database/verify-role';
import { startScheduler } from '@/scheduler/scheduler';
import { createLogger } from '@/shared/logger';
import { createShutdownHandler } from '@/shared/shutdown';

loadLocalEnvFile();

let env: ReturnType<typeof loadEnv> | undefined;
try {
  env = loadEnv(process.env);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

if (env) {
  const logger = createLogger(env);
  const { sql } = createDatabase(env.DATABASE_URL);
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
    const scheduler = startScheduler({ logger });
    const shutdown = createShutdownHandler({ logger, controller, scheduler, sql });
    process.on('SIGTERM', () => void shutdown());
    process.on('SIGINT', () => void shutdown());
  }
}
