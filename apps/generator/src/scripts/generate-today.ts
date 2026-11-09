/**
 * Solo desarrollo local: `pnpm --filter generator generate:today`.
 * Genera, verifica y aprueba el desafío de hoy de cada juego si falta (ver `runGenerateToday`).
 * Después hay que reiniciar la api: publica el día una sola vez por día.
 */
import { loadEnv, loadLocalEnvFile } from '@/config/env';
import { runGenerateToday } from '@/domain/challenge-publishing/fill.service';
import { generatorRegistry } from '@/games/registry';
import { createDatabase } from '@/infra/database/db';
import { systemClock } from '@/shared/clock';
import { createLogger } from '@/shared/logger';

loadLocalEnvFile();
const env = loadEnv();
const log = createLogger(env);
const { db, sql } = createDatabase(env.DATABASE_URL);

try {
  const { summary, failed } = await runGenerateToday(
    { now: systemClock.now(), log, signal: new AbortController().signal },
    { db, env, registry: generatorRegistry, nodeEnv: env.NODE_ENV },
  );
  log.info({ summary }, 'generate:today finished — restart the api to publish it');
  if (failed || summary.missing > 0) process.exitCode = 1;
} catch (err) {
  log.error({ err }, 'generate:today failed');
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
