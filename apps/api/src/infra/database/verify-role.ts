import type { Logger } from 'pino';

import { withTimeout } from '@/shared/with-timeout';

import type { Sql } from './db';

export async function verifyDbRole(
  sql: Sql,
  logger: Logger,
  timeoutMs = 2000,
): Promise<string | null> {
  try {
    // Introspección sin tablas: no hay nada que Drizzle modele.
    const rows = await withTimeout(sql<{ current_user: string }[]>`SELECT current_user`, timeoutMs);
    const dbRole = rows[0]?.current_user ?? null;
    logger.info({ db_role: dbRole }, 'Database role verified');
    return dbRole;
  } catch (err) {
    logger.warn({ err }, 'Database unavailable at startup');
    return null;
  }
}
