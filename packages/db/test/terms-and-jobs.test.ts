import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';

import { truncateAll } from '../src/testing';
import { connectAs } from './helpers';

const owner = connectAs(inject('ownerUrl'));
const api = connectAs(inject('apiUrl'));
const generator = connectAs(inject('generatorUrl'));

type Sql = typeof generator;

const insertTerm = (
  sql: Sql,
  o: {
    term?: string;
    wikidata?: string;
    status?: string;
    reason?: string | null;
    definition?: string;
    summary?: string;
  } = {},
) => sql`INSERT INTO terms (term, category, definition, summary, wikidata_id, sitelinks, status, rejection_reason, dataset_version)
  VALUES (${o.term ?? 'KERNEL'}, 'linux', ${o.definition ?? '{"es":"Núcleo","en":"Core"}'}::text::jsonb,
    ${o.summary ?? '{"es":"Resumen","en":"Summary"}'}::text::jsonb, ${o.wikidata ?? `Q${randomUUID()}`}, 40,
    ${o.status ?? 'approved'}, ${o.reason ?? null}, '2026.11.06') RETURNING id`;

beforeAll(async () => {
  await truncateAll({ sql: owner });
});

afterAll(async () => {
  await Promise.all([owner.end(), api.end(), generator.end()]);
});

describe('terms checks', () => {
  it.each(['API', 'ABCDEFGHIJKLM', 'C++', 'kernel'])(
    'S015-TS-41: term %s is out of format',
    async (term) => {
      await expect(insertTerm(generator, { term })).rejects.toMatchObject({
        code: '23514',
        constraint_name: 'ck_terms_term_format',
      });
    },
  );

  it.each(['JAVA', 'ABCDEFGHIJKL'])('S015-TS-42: term %s is within bounds', async (term) => {
    await expect(insertTerm(generator, { term })).resolves.toBeDefined();
  });

  it('S015-TS-43: texts need es and en', async () => {
    await expect(
      insertTerm(generator, { term: 'ALPHA', definition: '{"es":"x"}' }),
    ).rejects.toMatchObject({
      code: '23514',
      constraint_name: 'ck_terms_definition_locales',
    });
    await expect(
      insertTerm(generator, { term: 'ALPHA', summary: '{"en":"x"}' }),
    ).rejects.toMatchObject({
      code: '23514',
      constraint_name: 'ck_terms_summary_locales',
    });
  });

  it('S015-TS-44: rejected needs a reason', async () => {
    await expect(
      insertTerm(generator, { term: 'BRAVO', status: 'rejected' }),
    ).rejects.toMatchObject({
      code: '23514',
      constraint_name: 'ck_terms_rejection_reason',
    });
  });

  it('S015-TS-45: term and wikidata_id are unique', async () => {
    await insertTerm(generator, { term: 'CHARLIE', wikidata: 'Q-u1' });
    await expect(
      insertTerm(generator, { term: 'CHARLIE', wikidata: 'Q-u2' }),
    ).rejects.toMatchObject({
      code: '23505',
      constraint_name: 'terms_term_unique',
    });
    await expect(insertTerm(generator, { term: 'DELTAS', wikidata: 'Q-u1' })).rejects.toMatchObject(
      {
        code: '23505',
        constraint_name: 'terms_wikidata_id_unique',
      },
    );
  });
});

describe('terms behaviour', () => {
  it('S015-TS-46: sync_banks upsert by wikidata_id', async () => {
    await insertTerm(generator, { term: 'ECHOES', wikidata: 'Q-up' });
    await generator`INSERT INTO terms (term, category, definition, summary, wikidata_id, sitelinks, status, dataset_version)
      VALUES ('ECHOES', 'linux', '{"es":"a","en":"b"}', '{"es":"a","en":"b"}', 'Q-up', 41, 'approved', '2026.11.07')
      ON CONFLICT (wikidata_id) DO UPDATE SET sitelinks = EXCLUDED.sitelinks, dataset_version = EXCLUDED.dataset_version`;
    const rows = await owner`SELECT sitelinks, dataset_version, updated_at > created_at AS touched
      FROM terms WHERE wikidata_id = 'Q-up'`;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ sitelinks: 41, dataset_version: '2026.11.07', touched: true });
  });

  it('S015-TS-47: rejected is terminal', async () => {
    const [t] = await insertTerm(generator, { term: 'FOXTROT', status: 'rejected', reason: 'bad' });
    const expected = {
      code: 'P0001',
      message: 'bank_items_rejected_terminal: a rejected item cannot leave rejected',
    };
    await expect(
      generator`UPDATE terms SET status = 'approved' WHERE id = ${t!.id}`,
    ).rejects.toMatchObject(expected);
    await expect(
      api`UPDATE terms SET status = 'approved' WHERE id = ${t!.id}`,
    ).rejects.toMatchObject(expected);
    const [row] = await owner`SELECT status FROM terms WHERE id = ${t!.id}`;
    expect(row!.status).toBe('rejected');
  });

  it('S015-TS-48: approved -> rejected is allowed for the api', async () => {
    const [t] = await insertTerm(generator, { term: 'GOLFER' });
    await expect(
      api`UPDATE terms SET status = 'rejected', rejection_reason = 'wrong_answer' WHERE id = ${t!.id}`,
    ).resolves.toBeDefined();
  });

  it('S015-TS-49: set_updated_at', async () => {
    await owner`INSERT INTO terms (term, category, definition, summary, wikidata_id, sitelinks, status, dataset_version, updated_at)
      VALUES ('HOTELS', 'linux', '{"es":"a","en":"b"}', '{"es":"a","en":"b"}', 'Q-upd', 1, 'approved', 'v', '2026-01-01T00:00:00Z')`;
    await generator`UPDATE terms SET last_used_devdle = '2026-12-01' WHERE wikidata_id = 'Q-upd'`;
    const [row] =
      await owner`SELECT updated_at > '2026-01-01T00:00:00Z' AS moved, last_used_devdle::text AS d
      FROM terms WHERE wikidata_id = 'Q-upd'`;
    expect(row).toMatchObject({ moved: true, d: '2026-12-01' });
  });
});

describe('job_runs', () => {
  it('S015-TS-56: generator writes job_runs', async () => {
    const [row] =
      await generator`INSERT INTO job_runs (job) VALUES ('sync_banks') RETURNING id, status, summary`;
    expect(row).toMatchObject({ status: 'running', summary: {} });
    const summary = {
      dataset_version: '2026.11.06',
      inserted: 1,
      updated: 0,
      unchanged: 0,
      kept_rejected: 0,
      skipped: 0,
    };
    const [done] = await generator`UPDATE job_runs SET status = 'success', finished_at = now(),
      summary = ${JSON.stringify(summary)}::text::jsonb WHERE id = ${row!.id} RETURNING status, summary`;
    expect(done).toMatchObject({ status: 'success', summary });
  });
});
