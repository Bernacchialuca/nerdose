import { serve } from '@hono/node-server';

import { loadEnv, loadLocalEnvFile } from '@/config/env';
import { IdentityRepository } from '@/domain/identity/identity.repository';
import { IdentityService } from '@/domain/identity/identity.service';
import { PublishingService } from '@/domain/publishing/publishing.service';
import { EmptyChallengesRepository } from '@/domain/publishing/publishing.repository';
import { TodayCache } from '@/infra/cache/today-cache';
import { createDatabase } from '@/infra/database/db';
import { createHealthCheck } from '@/infra/database/health';
import { verifyDbRole } from '@/infra/database/verify-role';
import { buildApp } from '@/http/app';
import { systemClock } from '@/shared/clock';
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
  const { sql, db } = createDatabase(env.DATABASE_URL);
  await verifyDbRole(sql, logger);

  const clock = systemClock;
  const todayCache = new TodayCache(new EmptyChallengesRepository(), clock);
  await todayCache.reload();

  const app = buildApp({
    logger,
    health: createHealthCheck({ sql }),
    config: {
      WEB_ORIGIN: env.WEB_ORIGIN,
      ADMIN_ORIGIN: env.ADMIN_ORIGIN,
      TRUST_PROXY_HEADER: env.TRUST_PROXY_HEADER,
      LAUNCH_DATE: env.LAUNCH_DATE,
    },
    identity: new IdentityService(new IdentityRepository(db)),
    publishing: new PublishingService({
      cache: todayCache,
      clock,
      launchDate: env.LAUNCH_DATE,
    }),
  });
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
