import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';

import { createDb } from '../src/client';
import { makeChallenge, makePlayer, truncateAll } from '../src/testing';
import { connectAs } from './helpers';

const owner = connectAs(inject('ownerUrl'));
const api = connectAs(inject('apiUrl'));
const generator = connectAs(inject('generatorUrl'));
const { db: ownerDb, sql: ownerDbSql } = createDb(inject('ownerUrl'), { max: 1 });

const denied = (t: string) => ({ code: '42501', message: `permission denied for table ${t}` });

beforeAll(async () => {
  await truncateAll({ sql: owner });
});

afterAll(async () => {
  await Promise.all([owner.end(), api.end(), generator.end(), ownerDbSql.end()]);
});

const PRIVS = [
  'SELECT',
  'INSERT',
  'UPDATE',
  'DELETE',
  'TRUNCATE',
  'REFERENCES',
  'TRIGGER',
] as const;
const PLAYER_TABLES = [
  'plays',
  'player_game_stats',
  'player_stats',
  'rejected_guesses',
  'challenge_reports',
];
const CONTENT_TABLES = ['challenges', 'terms', 'timeline_facts', 'job_runs'];

const matrix: [string, string, string[]][] = [
  ...PLAYER_TABLES.map((t): [string, string, string[]] => [
    'nerdose_api',
    t,
    ['SELECT', 'INSERT', 'UPDATE'],
  ]),
  ...CONTENT_TABLES.map((t): [string, string, string[]] => ['nerdose_api', t, ['SELECT']]),
  ...CONTENT_TABLES.map((t): [string, string, string[]] => [
    'nerdose_generator',
    t,
    ['SELECT', 'INSERT', 'UPDATE'],
  ]),
  ...PLAYER_TABLES.map((t): [string, string, string[]] => ['nerdose_generator', t, []]),
  ['nerdose_api', 'generation_requests', ['SELECT', 'INSERT']],
  ['nerdose_api', 'generation_failures', ['SELECT']],
  ['nerdose_generator', 'generation_requests', ['SELECT', 'INSERT', 'UPDATE']],
  ['nerdose_generator', 'generation_failures', ['SELECT', 'INSERT', 'UPDATE']],
];

describe('role privileges', () => {
  it.each(matrix)('S015-TS-50: %s on %s', async (role, table, allowed) => {
    for (const p of PRIVS) {
      const [row] = await owner`SELECT has_table_privilege(${role}, ${table}, ${p}) AS ok`;
      expect([p, row!.ok]).toEqual([p, allowed.includes(p)]);
    }
  });

  it('S015-TS-51: api column privileges on challenges and terms', async () => {
    const cols = async (table: string) => {
      const rows = await owner`SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${table}`;
      const out: string[] = [];
      for (const r of rows) {
        const [p] =
          await owner`SELECT has_column_privilege('nerdose_api', ${table}, ${r.column_name}, 'UPDATE') AS ok`;
        if (p!.ok) out.push(r.column_name);
      }
      return out.sort();
    };
    expect(await cols('challenges')).toEqual(['alerted_at', 'status', 'void_reason', 'voided_at']);
    expect(await cols('terms')).toEqual(['rejection_reason', 'status']);
    expect(await cols('timeline_facts')).toEqual(['rejection_reason', 'status']);
  });

  it('S015-TS-52/53: api cannot write challenge payload nor create challenges', async () => {
    const c = await makeChallenge(ownerDb, {
      gameId: 'devdle',
      date: '2027-03-01',
      status: 'draft',
    });
    await expect(
      api`UPDATE challenges SET payload = '{}' WHERE id = ${c.id}`,
    ).rejects.toMatchObject(denied('challenges'));
    await expect(
      api`INSERT INTO challenges (game_id, date, number, payload, generator_version, seed, attempt)
        VALUES ('devdle', '2027-03-02', 1, '{}', '1', 'a', 0)`,
    ).rejects.toMatchObject(denied('challenges'));
  });

  it('S015-TS-54: api only changes term state', async () => {
    await expect(
      api`INSERT INTO terms (term, category, definition, summary, wikidata_id, sitelinks, status, dataset_version)
        VALUES ('KERNEL', 'linux', '{"es":"a","en":"b"}', '{"es":"a","en":"b"}', 'Q-g1', 1, 'approved', 'v')`,
    ).rejects.toMatchObject(denied('terms'));
    await expect(api`UPDATE terms SET last_used_devdle = '2026-12-01'`).rejects.toMatchObject(
      denied('terms'),
    );
  });

  it('S015-TS-55: api reads job_runs but cannot write', async () => {
    await expect(api`SELECT id FROM job_runs`).resolves.toBeDefined();
    await expect(api`INSERT INTO job_runs (job) VALUES ('fill')`).rejects.toMatchObject(
      denied('job_runs'),
    );
  });

  it('S015-TS-57: generator has no access to player tables', async () => {
    const p = await makePlayer(ownerDb);
    await expect(generator`SELECT 1 FROM plays`).rejects.toMatchObject(denied('plays'));
    await expect(
      generator`INSERT INTO rejected_guesses (word, player_id) VALUES ('ABCDE', ${p.id})`,
    ).rejects.toMatchObject(denied('rejected_guesses'));
    await expect(generator`SELECT 1 FROM player_game_stats`).rejects.toMatchObject(
      denied('player_game_stats'),
    );
    await expect(generator`UPDATE player_stats SET global_streak = 0`).rejects.toMatchObject(
      denied('player_stats'),
    );
  });

  it('S015-TS-58: nobody deletes, truncates or alters', async () => {
    await expect(api`DELETE FROM plays`).rejects.toMatchObject(denied('plays'));
    await expect(generator`DELETE FROM challenges`).rejects.toMatchObject(denied('challenges'));
    await expect(generator`TRUNCATE terms`).rejects.toMatchObject(denied('terms'));
    await expect(api`ALTER TABLE plays ADD COLUMN x int`).rejects.toMatchObject({
      code: '42501',
      message: 'must be owner of table plays',
    });
  });
});
