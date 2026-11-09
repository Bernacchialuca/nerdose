import { serve } from '@hono/node-server';

import { loadEnv, loadLocalEnvFile } from '@/config/env';
import { IdentityRepository } from '@/domain/identity/identity.repository';
import { IdentityService } from '@/domain/identity/identity.service';
import { GameplayRepository, moveTransaction } from '@/domain/gameplay/gameplay.repository';
import { GameplayService } from '@/domain/gameplay/gameplay.service';
import { ProgressRepository } from '@/domain/progress/progress.repository';
import { ProgressService } from '@/domain/progress/progress.service';
import { PublishingRepository } from '@/domain/publishing/publishing.repository';
import { PublishingService } from '@/domain/publishing/publishing.service';
import { games } from '@/games/registry';
import { TodayCache } from '@/infra/cache/today-cache';
import { WordList, resolveWordlistPath } from '@/infra/cache/word-list';
import { createDatabase } from '@/infra/database/db';
import { createHealthCheck } from '@/infra/database/health';
import { verifyDbRole } from '@/infra/database/verify-role';
import { buildApp } from '@/http/app';
import { systemClock } from '@/shared/clock';
import { createLogger } from '@/shared/logger';
import { withTimeout } from '@/shared/with-timeout';

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

  // El archivo base es local: si no se puede leer, el proceso no arranca.
  let wordList: WordList | undefined;
  try {
    wordList = await WordList.load(resolveWordlistPath());
  } catch (err) {
    logger.error({ err }, 'Word list unavailable');
    process.exitCode = 1;
    await sql.end({ timeout: 1 });
  }

  if (wordList) {
    const publishingRepo = new PublishingRepository(db);
    const todayCache = new TodayCache(publishingRepo);
    const gameplayRepo = new GameplayRepository(db);
    const progress = new ProgressService({ repo: new ProgressRepository(db) });
    const publishing = new PublishingService({
      repo: publishingRepo,
      cache: todayCache,
      wordList,
      terms: publishingRepo,
      clock,
      launchDate: env.LAUNCH_DATE,
      logger,
      games,
      gameplay: gameplayRepo,
      progress,
    });

    // La base caída no impide arrancar: el primer request de "hoy" reintenta.
    try {
      await withTimeout(publishing.ensureToday(), 2000);
    } catch (err) {
      logger.error({ err }, 'Startup publication failed');
    }

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
      publishing,
      gameplay: new GameplayService({
        games,
        cache: todayCache,
        repo: gameplayRepo,
        progress,
        runInTx: moveTransaction(db),
        wordList,
        rejected: gameplayRepo,
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
}
