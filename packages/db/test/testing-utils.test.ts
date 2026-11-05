import { afterAll, describe, expect, inject, it } from 'vitest';

import { createDb } from '../src/client';
import { truncateAll } from '../src/testing';

const ownerUrl = inject('ownerUrl');
const { sql } = createDb(ownerUrl, { max: 1 });

afterAll(async () => {
  await sql.end();
});

describe('createRoles', () => {
  it('TS-10: returns the URLs of the three roles', async () => {
    const urls = [inject('ownerUrl'), inject('apiUrl'), inject('generatorUrl')].map(
      (u) => new URL(u),
    );
    expect(urls.map((u) => u.username)).toEqual([
      'nerdose_owner',
      'nerdose_api',
      'nerdose_generator',
    ]);
    const passwords = urls.map((u) => u.password);
    expect(passwords.every((p) => p !== '')).toBe(true);
    expect(new Set(passwords).size).toBe(3);
    const [row] =
      await sql`SELECT nspowner::regrole::text AS owner FROM pg_namespace WHERE nspname = 'public'`;
    expect(row!.owner).toBe('nerdose_owner');
  });
});

describe('truncateAll', () => {
  it('TS-29: resolves on a database with empty tables', async () => {
    await expect(truncateAll({ sql })).resolves.toBeUndefined();
  });

  it('TS-30: empties public tables and restarts identities', async () => {
    await sql.unsafe('CREATE TABLE truncate_probe (id serial PRIMARY KEY, v int)');
    try {
      await sql`INSERT INTO truncate_probe (v) VALUES (1),(2)`;
      await truncateAll({ sql });
      const [count] = await sql`SELECT count(*)::int AS n FROM truncate_probe`;
      expect(count!.n).toBe(0);
      const [inserted] = await sql`INSERT INTO truncate_probe (v) VALUES (3) RETURNING id`;
      expect(inserted!.id).toBe(1);
    } finally {
      await sql.unsafe('DROP TABLE truncate_probe');
    }
  });
});
