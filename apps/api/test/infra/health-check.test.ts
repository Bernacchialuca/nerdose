import { afterEach, describe, expect, inject, it } from 'vitest';

import { createDatabase } from '@/infra/database/db';
import { createHealthCheck } from '@/infra/database/health';

import { captureLogger } from '../helpers/logger';
import { freePort, silentServer } from '../helpers/net';

const opened: Array<{ end(options: { timeout: number }): Promise<void> }> = [];
const open = (url: string) => {
  const { sql } = createDatabase(url);
  opened.push(sql);
  return sql;
};

afterEach(async () => {
  await Promise.all(opened.splice(0).map((sql) => sql.end({ timeout: 0 })));
});

describe('createHealthCheck', () => {
  it('devuelve ok con la base disponible', async () => {
    const { logger } = captureLogger();
    const health = createHealthCheck({ sql: open(inject('apiUrl')) });
    await expect(health.check(logger)).resolves.toEqual({ status: 'ok', db: 'ok' });
  });

  it('devuelve degraded con conexión rechazada, rápido y con warn', async () => {
    const port = await freePort();
    const { logger, lines } = captureLogger();
    const health = createHealthCheck({
      sql: open(`postgres://nerdose_api:x@127.0.0.1:${port}/nerdose`),
    });
    const start = Date.now();
    await expect(health.check(logger)).resolves.toEqual({ status: 'degraded', db: 'error' });
    expect(Date.now() - start).toBeLessThan(3000);
    expect(lines()).toContainEqual(
      expect.objectContaining({ level: 'warn', msg: 'Database health check failed' }),
    );
  });

  it('devuelve degraded al vencer el timeout con base colgada', async () => {
    const server = await silentServer();
    try {
      const { logger } = captureLogger();
      const health = createHealthCheck({
        sql: open(`postgres://nerdose_api:x@127.0.0.1:${server.port}/nerdose`),
        timeoutMs: 2000,
      });
      const start = Date.now();
      await expect(health.check(logger)).resolves.toEqual({ status: 'degraded', db: 'error' });
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(1900);
      expect(elapsed).toBeLessThan(3000);
    } finally {
      await Promise.all(opened.splice(0).map((sql) => sql.end({ timeout: 0 })));
      await server.close();
    }
  });
});
