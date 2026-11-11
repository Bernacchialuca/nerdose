import { randomUUID } from 'node:crypto';

import { CODE_LANGUAGES, LOCALES } from '@nerdose/core';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';

import { createDb } from '../src/client';
import { players } from '../src/index';
import { truncateAll } from '../src/testing';
import { connectAs } from './helpers';

const owner = connectAs(inject('ownerUrl'));
const api = connectAs(inject('apiUrl'));
const generator = connectAs(inject('generatorUrl'));
const { db: apiDb, sql: apiDbSql } = createDb(inject('apiUrl'), { max: 1 });

const DENIED = { code: '42501', message: 'permission denied for table players' };
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

beforeAll(async () => {
  await truncateAll({ sql: owner });
});

afterAll(async () => {
  await Promise.all([owner.end(), api.end(), generator.end(), apiDbSql.end()]);
});

describe('players structure', () => {
  it('S006-TS-1: migrations up to 0005 are registered', async () => {
    const [row] = await owner`SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations`;
    expect(row!.n).toBe(6);
  });

  it.each([
    ['locale', LOCALES],
    ['code_language', CODE_LANGUAGES],
  ])('S006-TS-2/3: enum %s has exact values and order', async (name, expected) => {
    const rows = await owner`SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = ${name} ORDER BY e.enumsortorder`;
    expect(rows.map((r) => r.enumlabel)).toEqual([...expected]);
  });

  it('S006-TS-4: columns, types, nullability and defaults', async () => {
    const rows = await owner`SELECT column_name, udt_name, is_nullable, column_default
      FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'players'
      ORDER BY ordinal_position`;
    expect(rows.map((r) => ({ ...r }))).toEqual([
      {
        column_name: 'id',
        udt_name: 'uuid',
        is_nullable: 'NO',
        column_default: 'gen_random_uuid()',
      },
      {
        column_name: 'locale',
        udt_name: 'locale',
        is_nullable: 'NO',
        column_default: "'es'::locale",
      },
      {
        column_name: 'preferred_code_language',
        udt_name: 'code_language',
        is_nullable: 'NO',
        column_default: "'js'::code_language",
      },
      { column_name: 'user_id', udt_name: 'uuid', is_nullable: 'YES', column_default: null },
      {
        column_name: 'created_at',
        udt_name: 'timestamptz',
        is_nullable: 'NO',
        column_default: 'now()',
      },
      {
        column_name: 'last_seen_at',
        udt_name: 'timestamptz',
        is_nullable: 'NO',
        column_default: 'now()',
      },
    ]);
  });

  it('S006-TS-5: id is the primary key', async () => {
    const rows = await owner`SELECT a.attname FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = 'players'::regclass AND i.indisprimary`;
    expect(rows.map((r) => ({ ...r }))).toEqual([{ attname: 'id' }]);
  });

  it('S006-TS-6: idx_players_created_at', async () => {
    const rows = await owner`SELECT indexdef FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'players' AND indexname = 'idx_players_created_at'`;
    expect(rows.map((r) => r.indexdef)).toEqual([
      'CREATE INDEX idx_players_created_at ON public.players USING btree (created_at)',
    ]);
  });

  it('S006-TS-7: user_id has no foreign key', async () => {
    const [row] = await owner`SELECT count(*)::int AS n FROM pg_constraint
      WHERE conrelid = 'players'::regclass AND contype = 'f'`;
    expect(row!.n).toBe(0);
  });
});

describe('players permissions and constraints', () => {
  it('S006-TS-8: api inserts with defaults', async () => {
    const rows = await api`INSERT INTO players DEFAULT VALUES RETURNING *`;
    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    expect(row.id).toMatch(UUID_V4);
    expect(row.locale).toBe('es');
    expect(row.preferred_code_language).toBe('js');
    expect(row.user_id).toBeNull();
    expect(row.created_at).toBeInstanceOf(Date);
    expect(row.last_seen_at).toBeInstanceOf(Date);
  });

  it('S006-TS-9: api inserts explicit values', async () => {
    const rows = await api`INSERT INTO players (locale, preferred_code_language)
      VALUES ('en', 'js') RETURNING locale, preferred_code_language`;
    expect(rows.map((r) => ({ ...r }))).toEqual([{ locale: 'en', preferred_code_language: 'js' }]);
  });

  it('S006-TS-10: api selects', async () => {
    const id = randomUUID();
    await owner`INSERT INTO players (id, locale) VALUES (${id}, 'en')`;
    const rows = await api`SELECT id, locale FROM players WHERE id = ${id}`;
    expect(rows.map((r) => ({ ...r }))).toEqual([{ id, locale: 'en' }]);
  });

  it('S006-TS-11: api updates preferences and last_seen_at', async () => {
    const id = randomUUID();
    await owner`INSERT INTO players (id) VALUES (${id})`;
    const rows = await api`UPDATE players SET locale = 'en', preferred_code_language = 'go',
      last_seen_at = '2026-12-01T10:00:00Z' WHERE id = ${id}
      RETURNING locale, preferred_code_language, last_seen_at`;
    expect(rows.map((r) => ({ ...r }))).toEqual([
      {
        locale: 'en',
        preferred_code_language: 'go',
        last_seen_at: new Date('2026-12-01T10:00:00.000Z'),
      },
    ]);
  });

  it('S006-TS-12: api cannot DELETE', async () => {
    const id = randomUUID();
    await owner`INSERT INTO players (id) VALUES (${id})`;
    await expect(api`DELETE FROM players WHERE id = ${id}`).rejects.toMatchObject(DENIED);
    const rows = await owner`SELECT id FROM players WHERE id = ${id}`;
    expect(rows).toHaveLength(1);
  });

  it('S006-TS-13: api cannot TRUNCATE or alter players', async () => {
    await expect(api.unsafe('TRUNCATE players')).rejects.toMatchObject(DENIED);
    await expect(api.unsafe('ALTER TABLE players ADD COLUMN ip text')).rejects.toMatchObject({
      code: '42501',
      message: 'must be owner of table players',
    });
  });

  it('S006-TS-14: generator cannot SELECT', async () => {
    await expect(generator`SELECT id FROM players`).rejects.toMatchObject(DENIED);
  });

  it('S006-TS-15: generator cannot INSERT or UPDATE', async () => {
    await expect(generator`INSERT INTO players DEFAULT VALUES`).rejects.toMatchObject(DENIED);
    await expect(generator`UPDATE players SET locale = 'en'`).rejects.toMatchObject(DENIED);
  });

  it.each([
    ['nerdose_api', { s: true, i: true, u: true, d: false, t: false, r: false, tr: false }],
    [
      'nerdose_generator',
      { s: false, i: false, u: false, d: false, t: false, r: false, tr: false },
    ],
  ])('S006-TS-16: privilege matrix of %s', async (role, expected) => {
    const [row] = await owner`SELECT
      has_table_privilege(${role}, 'players', 'SELECT') AS s,
      has_table_privilege(${role}, 'players', 'INSERT') AS i,
      has_table_privilege(${role}, 'players', 'UPDATE') AS u,
      has_table_privilege(${role}, 'players', 'DELETE') AS d,
      has_table_privilege(${role}, 'players', 'TRUNCATE') AS t,
      has_table_privilege(${role}, 'players', 'REFERENCES') AS r,
      has_table_privilege(${role}, 'players', 'TRIGGER') AS tr`;
    expect({ ...row }).toEqual(expected);
  });

  it('S006-TS-17: rejects a locale outside the enum', async () => {
    await expect(api`INSERT INTO players (locale) VALUES ('fr')`).rejects.toMatchObject({
      code: '22P02',
      message: 'invalid input value for enum locale: "fr"',
    });
  });

  it('S006-TS-18: rejects a code_language outside the enum', async () => {
    await expect(
      api`INSERT INTO players (preferred_code_language) VALUES ('python')`,
    ).rejects.toMatchObject({
      code: '22P02',
      message: 'invalid input value for enum code_language: "python"',
    });
  });

  it('S006-TS-19: locale is NOT NULL', async () => {
    await expect(api`INSERT INTO players (locale) VALUES (NULL)`).rejects.toMatchObject({
      code: '23502',
      column_name: 'locale',
    });
  });

  it('S006-TS-20: user_id accepts any uuid', async () => {
    const userId = randomUUID();
    const rows = await api`INSERT INTO players (user_id) VALUES (${userId}) RETURNING user_id`;
    expect(rows.map((r) => ({ ...r }))).toEqual([{ user_id: userId }]);
  });
});

describe('players drizzle schema', () => {
  it('S006-TS-21/22: typed insert, update and select with the api role', async () => {
    const [created] = await apiDb.insert(players).values({}).returning();
    expect(Object.keys(created!)).toEqual([
      'id',
      'locale',
      'preferredCodeLanguage',
      'userId',
      'createdAt',
      'lastSeenAt',
    ]);
    expect(created!.locale).toBe('es');
    expect(created!.preferredCodeLanguage).toBe('js');
    expect(created!.userId).toBeNull();
    expect(created!.createdAt).toBeInstanceOf(Date);

    const id = created!.id;
    await apiDb
      .update(players)
      .set({ locale: 'en', preferredCodeLanguage: 'java' })
      .where(eq(players.id, id));
    const rows = await apiDb.select().from(players).where(eq(players.id, id));
    expect(rows).toEqual([
      {
        id,
        locale: 'en',
        preferredCodeLanguage: 'java',
        userId: null,
        createdAt: expect.any(Date),
        lastSeenAt: expect.any(Date),
      },
    ]);
  });
});

describe('truncateAll', () => {
  it('S006-TS-27: empties players and keeps the table', async () => {
    await owner`INSERT INTO players DEFAULT VALUES`;
    await owner`INSERT INTO players DEFAULT VALUES`;
    await truncateAll({ sql: owner });
    const [row] = await owner`SELECT count(*)::int AS n FROM players`;
    expect(row!.n).toBe(0);
  });
});
