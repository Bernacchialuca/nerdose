import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { describe, expect, inject, it } from 'vitest';

import { connectAs } from './helpers';

const cwd = fileURLToPath(new URL('..', import.meta.url));

const cli = (env: Record<string, string>) =>
  spawnSync(process.execPath, ['--import', 'tsx', 'scripts/migrate.ts'], {
    cwd,
    env: { PATH: process.env.PATH, NODE_ENV: 'test', ...env },
    encoding: 'utf8',
    timeout: 60_000,
  });

const owner = inject('ownerUrl');
const api = inject('apiUrl');
const generator = inject('generatorUrl');
const passwords = [owner, api, generator].map((u) => decodeURIComponent(new URL(u).password));

describe('db:migrate CLI', () => {
  it('TS-24: succeeds on a migrated database and syncs credentials', () => {
    const r = cli({
      DATABASE_URL_OWNER: owner,
      DATABASE_URL_API: api,
      DATABASE_URL_GENERATOR: generator,
    });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('Migraciones aplicadas.');
    expect(r.stdout).toContain('Credenciales sincronizadas: nerdose_api');
    expect(r.stdout).toContain('Credenciales sincronizadas: nerdose_generator');
    for (const p of passwords) {
      expect(r.stdout).not.toContain(p);
      expect(r.stderr).not.toContain(p);
    }
  });

  it('TS-25: is idempotent', async () => {
    for (let i = 0; i < 2; i++) {
      const r = cli({ DATABASE_URL_OWNER: owner });
      expect(r.status).toBe(0);
      expect(r.stdout).toContain('Migraciones aplicadas.');
      expect(r.stdout).not.toContain('Credenciales sincronizadas');
    }
    const sql = connectAs(owner);
    try {
      const [row] = await sql`SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations`;
      expect(row!.n).toBe(8);
    } finally {
      await sql.end();
    }
  });

  it('TS-26: reports a down database', () => {
    const r = cli({ DATABASE_URL_OWNER: 'postgres://nerdose_owner:secreto@127.0.0.1:1/nerdose' });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain(
      'No se pudo conectar a PostgreSQL con DATABASE_URL_OWNER (ECONNREFUSED)',
    );
    expect(r.stderr).not.toContain('secreto');
  });

  it('TS-27: requires DATABASE_URL_OWNER', () => {
    const r = cli({});
    expect(r.status).toBe(1);
    expect(r.stderr).toContain(
      'db:migrate falló: Variables de entorno inválidas: DATABASE_URL_OWNER',
    );
  });

  it('TS-28: rejects a wrong user in DATABASE_URL_API', () => {
    const r = cli({ DATABASE_URL_OWNER: owner, DATABASE_URL_API: generator });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain(
      'db:migrate falló: DATABASE_URL_API debe usar el usuario nerdose_api (recibido: nerdose_generator)',
    );
  });
});
