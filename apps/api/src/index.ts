import { serve } from '@hono/node-server';

import { loadEnv, loadLocalEnvFile } from '@/config/env';
import { AdminContentService } from '@/domain/admin/admin-content.service';
import { AdminRepository } from '@/domain/admin/admin.repository';
import { AdminService } from '@/domain/admin/admin.service';
import { IdentityRepository } from '@/domain/identity/identity.repository';
import { IdentityService } from '@/domain/identity/identity.service';
import { GameplayRepository, moveTransaction } from '@/domain/gameplay/gameplay.repository';
import { GameplayService } from '@/domain/gameplay/gameplay.service';
import { ProgressRepository } from '@/domain/progress/progress.repository';
import { ProgressService } from '@/domain/progress/progress.service';
import { QualityRepository } from '@/domain/quality/quality.repository';
import { QualityService } from '@/domain/quality/quality.service';
import { VoidService } from '@/domain/quality/void.service';
import { PublishingRepository } from '@/domain/publishing/publishing.repository';
import { PublishingService } from '@/domain/publishing/publishing.service';
import { RegenerationService } from '@/domain/publishing/regeneration.service';
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
        ADMIN_PASSWORD_HASH: env.ADMIN_PASSWORD_HASH,
        ADMIN_JWT_SECRET: env.ADMIN_JWT_SECRET,
      },
      identity: new IdentityService(new IdentityRepository(db)),
      publishing,
      gameplay: new GameplayService({
        games,
        cache: todayCache,
        repo: gameplayRepo,
        progress,
        reports: new QualityRepository(db),
        runInTx: moveTransaction(db),
        wordList,
        rejected: gameplayRepo,
        clock,
        launchDate: env.LAUNCH_DATE,
      }),
      quality: new QualityService({
        games,
        runInTx: (fn) => db.transaction((tx) => fn(new QualityRepository(tx))),
        clock,
        thresholds: {
          count: env.REPORT_ALERT_COUNT,
          ratio: env.REPORT_ALERT_RATIO,
          ratioMinCount: env.REPORT_ALERT_RATIO_MIN_COUNT,
        },
      }),
      admin: new AdminService({
        passwordHash: env.ADMIN_PASSWORD_HASH,
        jwtSecret: env.ADMIN_JWT_SECRET,
        clock,
        repo: new AdminRepository(db),
        games,
      }),
      adminContent: new AdminContentService({
        repo: new AdminRepository(db),
        games,
        clock,
        launchDate: env.LAUNCH_DATE,
      }),
      regeneration: new RegenerationService({
        runInTx: (fn) => db.transaction((tx) => fn(new PublishingRepository(tx))),
        clock,
      }),
      voids: new VoidService({
        games,
        runInTx: (fn) =>
          db.transaction((tx) =>
            fn({ quality: new QualityRepository(tx), progress: new ProgressRepository(tx) }),
          ),
        cache: todayCache,
        progress,
        clock,
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
