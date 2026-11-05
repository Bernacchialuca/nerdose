import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterAll, describe, expect, inject, it } from 'vitest';

import { createDb } from '../src/client';
import { MIGRATIONS_FOLDER } from '../src/migrations/run-migrations';
import { migrateAsOwner } from '../src/testing';
import { connectAs } from './helpers';

const owner = connectAs(inject('ownerUrl'));
const admin = connectAs(inject('adminUrl'));
const api = connectAs(inject('apiUrl'));
const generator = connectAs(inject('generatorUrl'));

afterAll(async () => {
  await Promise.all([owner.end(), admin.end(), api.end(), generator.end()]);
});

const DENIED_SCHEMA = { code: '42501', message: 'permission denied for schema public' };

describe('roles and grants', () => {
  it('TS-1: roles exist after migrating', async () => {
    const rows = await owner`SELECT rolname, rolcanlogin, rolsuper, rolcreaterole FROM pg_roles
      WHERE rolname IN ('nerdose_owner','nerdose_api','nerdose_generator') ORDER BY rolname`;
    expect(rows.map((r) => ({ ...r }))).toEqual([
      { rolname: 'nerdose_api', rolcanlogin: true, rolsuper: false, rolcreaterole: false },
      { rolname: 'nerdose_generator', rolcanlogin: true, rolsuper: false, rolcreaterole: false },
      { rolname: 'nerdose_owner', rolcanlogin: true, rolsuper: false, rolcreaterole: true },
    ]);
  });

  it.each(['nerdose_api', 'nerdose_generator'])('TS-2: base grants of %s', async (role) => {
    const [row] = await owner`SELECT
      has_database_privilege(${role}, current_database(), 'CONNECT') AS connect,
      has_schema_privilege(${role}, 'public', 'USAGE') AS usage,
      has_schema_privilege(${role}, 'public', 'CREATE') AS schema_create,
      has_database_privilege(${role}, current_database(), 'CREATE') AS db_create,
      has_database_privilege(${role}, current_database(), 'TEMPORARY') AS temp`;
    expect({ ...row }).toEqual({
      connect: true,
      usage: true,
      schema_create: false,
      db_create: false,
      temp: false,
    });
  });

  it('TS-3: the migration creates the roles when they do not exist', async () => {
    const statements = readFileSync(
      join(MIGRATIONS_FOLDER, '0000_roles_and_grants.sql'),
      'utf8',
    ).split('--> statement-breakpoint');
    const rollback = new Error('rollback');
    let inside: { roles: string[]; usage: boolean } | undefined;

    await expect(
      admin.begin(async (tx) => {
        await tx.unsafe('DROP OWNED BY nerdose_api, nerdose_generator');
        await tx.unsafe('DROP ROLE nerdose_api');
        await tx.unsafe('DROP ROLE nerdose_generator');
        for (const statement of statements) await tx.unsafe(statement);
        const roles = await tx<{ rolname: string }[]>`SELECT rolname FROM pg_roles
          WHERE rolname IN ('nerdose_api','nerdose_generator') ORDER BY rolname`;
        const [priv] = await tx<
          { usage: boolean }[]
        >`SELECT has_schema_privilege('nerdose_api','public','USAGE') AS usage`;
        inside = { roles: roles.map((r) => r.rolname), usage: priv!.usage };
        throw rollback;
      }),
    ).rejects.toBe(rollback);

    expect(inside).toEqual({ roles: ['nerdose_api', 'nerdose_generator'], usage: true });
    const after =
      await owner`SELECT rolname FROM pg_roles WHERE rolname IN ('nerdose_api','nerdose_generator')`;
    expect(after).toHaveLength(2);
  });

  it('TS-4: a second migration applies nothing', async () => {
    const read = () => owner`SELECT id, hash FROM drizzle.__drizzle_migrations ORDER BY id`;
    const before = (await read()).map((r) => ({ ...r }));
    await expect(migrateAsOwner(inject('ownerUrl'))).resolves.toBeUndefined();
    const after = (await read()).map((r) => ({ ...r }));
    expect(before).toHaveLength(1);
    expect(after).toEqual(before);
  });

  it('TS-5: nerdose_api cannot create tables', async () => {
    await expect(api.unsafe('CREATE TABLE t (id int)')).rejects.toMatchObject(DENIED_SCHEMA);
  });

  it('TS-6: nerdose_generator cannot create tables', async () => {
    await expect(generator.unsafe('CREATE TABLE t (id int)')).rejects.toMatchObject(DENIED_SCHEMA);
  });

  it('TS-7: service roles cannot create temporary tables', async () => {
    for (const sql of [api, generator]) {
      await expect(sql.unsafe('CREATE TEMP TABLE tmp_probe (id int)')).rejects.toMatchObject({
        code: '42501',
        message: expect.stringContaining('permission denied to create temporary tables'),
      });
    }
  });

  it('TS-8: the owner has DDL', async () => {
    await expect(owner.unsafe('CREATE TABLE ddl_probe (id int)')).resolves.toBeDefined();
    await expect(owner.unsafe('DROP TABLE ddl_probe')).resolves.toBeDefined();
  });

  it('TS-9: createDb connects with the role of the URL', async () => {
    const { db, sql } = createDb(inject('apiUrl'), { max: 1 });
    try {
      const rows = await sql`SELECT current_user AS role`;
      expect(rows.map((r) => ({ ...r }))).toEqual([{ role: 'nerdose_api' }]);
      expect(typeof db.select).toBe('function');
      expect(typeof db.transaction).toBe('function');
    } finally {
      await sql.end();
    }
  });
});
