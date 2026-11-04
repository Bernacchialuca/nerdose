import type { Logger } from 'pino';

import { withTimeout } from '@/shared/with-timeout';

import type { Sql } from './db';

export type Health = { status: 'ok'; db: 'ok' } | { status: 'degraded'; db: 'error' };

export function createHealthCheck({ sql, timeoutMs = 2000 }: { sql: Sql; timeoutMs?: number }) {
  return {
    async check(log: Logger): Promise<Health> {
      try {
        // Ping sin tablas: no hay nada que Drizzle modele.
        await withTimeout(sql`SELECT 1`, timeoutMs);
        return { status: 'ok', db: 'ok' };
      } catch (err) {
        log.warn({ err }, 'Database health check failed');
        return { status: 'degraded', db: 'error' };
      }
    },
  };
}
