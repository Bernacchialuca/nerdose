import type { Logger } from 'pino';

import { withTimeout } from '@/shared/with-timeout';

import type { Sql } from './db';

/** Devuelve el rol de la conexión; si la base no responde, rechaza con el error original (lo loguea el bootstrap). */
export async function verifyDbRole(sql: Sql, logger: Logger, timeoutMs = 2000): Promise<string> {
  // Introspección sin tablas: no hay nada que Drizzle modele.
  const rows = await withTimeout(sql<{ current_user: string }[]>`SELECT current_user`, timeoutMs);
  const dbRole = rows[0]?.current_user ?? '';
  logger.info({ db_role: dbRole }, 'Database role verified');
  return dbRole;
}
