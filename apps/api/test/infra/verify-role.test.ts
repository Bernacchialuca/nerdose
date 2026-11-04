import { afterEach, describe, expect, inject, it } from 'vitest';

import { createDatabase } from '@/infra/database/db';
import { verifyDbRole } from '@/infra/database/verify-role';

import { captureLogger } from '../helpers/logger';
import { freePort } from '../helpers/net';

const opened: Array<{ end(options: { timeout: number }): Promise<void> }> = [];
const open = (url: string) => {
  const { sql } = createDatabase(url);
  opened.push(sql);
  return sql;
};

afterEach(async () => {
  await Promise.all(opened.splice(0).map((sql) => sql.end({ timeout: 0 })));
});

describe('verifyDbRole', () => {
  it('devuelve nerdose_api y lo loguea', async () => {
    const { logger, lines } = captureLogger();
    await expect(verifyDbRole(open(inject('apiUrl')), logger, 2000)).resolves.toBe('nerdose_api');
    expect(lines()).toContainEqual(
      expect.objectContaining({ level: 'info', db_role: 'nerdose_api', msg: 'Database role verified' }),
    );
  });

  it('con la base caída no lanza y devuelve null', async () => {
    const port = await freePort();
    const { logger, lines } = captureLogger();
    const start = Date.now();
    const result = await verifyDbRole(open(`postgres://nerdose_api:x@127.0.0.1:${port}/nerdose`), logger, 2000);
    expect(result).toBeNull();
    expect(Date.now() - start).toBeLessThan(3000);
    const all = lines();
    expect(all).toContainEqual(
      expect.objectContaining({ level: 'warn', msg: 'Database unavailable at startup', err: expect.anything() }),
    );
    expect(JSON.stringify(all)).not.toContain(`postgres://nerdose_api:x@127.0.0.1:${port}`);
  });

  it('el rol de la api no puede hacer DDL', async () => {
    const sql = open(inject('apiUrl'));
    await expect(sql`CREATE TABLE t_api_ddl (id int)`).rejects.toMatchObject({ code: '42501' });
  });
});
