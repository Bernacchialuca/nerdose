import { afterEach, describe, expect, inject, it } from 'vitest';

import { createDatabase } from '@/infra/database/db';
import { verifyDbRole } from '@/infra/database/verify-role';

import { captureLogger } from '../helpers/logger';
import { freePort, silentServer } from '../helpers/net';

const opened: Array<{ end(options: { timeout: number }): Promise<void> }> = [];
const open = (url: string) => {
  const { sql } = createDatabase(url);
  opened.push(sql);
  return sql;
};
const closers: Array<() => Promise<void>> = [];

afterEach(async () => {
  await Promise.all(opened.splice(0).map((sql) => sql.end({ timeout: 0 })));
  await Promise.all(closers.splice(0).map((close) => close()));
});

describe('verifyDbRole', () => {
  it('devuelve nerdose_generator y lo loguea', async () => {
    const { logger, lines } = captureLogger();
    await expect(verifyDbRole(open(inject('generatorUrl')), logger, 2000)).resolves.toBe(
      'nerdose_generator',
    );
    expect(lines()).toContainEqual(
      expect.objectContaining({
        level: 'info',
        db_role: 'nerdose_generator',
        msg: 'Database role verified',
      }),
    );
  });

  it('con conexión rechazada rechaza sin loguear el rol', async () => {
    const port = await freePort();
    const { logger, lines } = captureLogger();
    const start = Date.now();
    await expect(
      verifyDbRole(open(`postgres://nerdose_generator:x@127.0.0.1:${port}/nerdose`), logger, 2000),
    ).rejects.toBeDefined();
    expect(Date.now() - start).toBeLessThan(3000);
    expect(lines().some((line) => 'db_role' in line)).toBe(false);
  });

  it('con base colgada rechaza por timeout', async () => {
    const silent = await silentServer();
    closers.push(silent.close);
    const { logger } = captureLogger();
    const start = Date.now();
    await expect(
      verifyDbRole(
        open(`postgres://nerdose_generator:x@127.0.0.1:${silent.port}/nerdose`),
        logger,
        2000,
      ),
    ).rejects.toThrow('Timed out after 2000 ms');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(1900);
    expect(elapsed).toBeLessThan(3000);
  });

  it('el rol del generator no puede hacer DDL', async () => {
    const sql = open(inject('generatorUrl'));
    await expect(sql`CREATE TABLE t_gen_ddl (id int)`).rejects.toMatchObject({ code: '42501' });
  });
});
