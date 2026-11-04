import { serve } from '@hono/node-server';

import { loadEnv, loadLocalEnvFile } from '@/config/env';
import { createDatabase } from '@/infra/database/db';
import { createHealthCheck } from '@/infra/database/health';
import { verifyDbRole } from '@/infra/database/verify-role';
import { buildApp } from '@/http/app';
import { createLogger } from '@/shared/logger';

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
  const { sql } = createDatabase(env.DATABASE_URL);
  await verifyDbRole(sql, logger);

  const app = buildApp({ logger, health: createHealthCheck({ sql }) });
  const server = serve({ fetch: app.fetch, port: env.PORT }, ({ port }) => {
    logger.info({ port }, 'Server started');
  });

  let closing = false;
  const shutdown = () => {
    if (closing) return;
    closing = true;
    server.close();
    void sql
      .end({ timeout: 5 })
      .then(() => {
        logger.info('Shutdown complete');
        process.exit(0);
      })
      .catch((err: unknown) => {
        logger.error({ err }, 'Shutdown failed');
        process.exit(1);
      });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
