import { randomUUID } from 'node:crypto';

import { DATE_PRECISIONS, TIMELINE_CATEGORIES } from '@nerdose/core';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';

import { createDb, timelineFacts } from '../src/index';
import { truncateAll } from '../src/testing';
import { connectAs } from './helpers';

const owner = connectAs(inject('ownerUrl'));
const api = connectAs(inject('apiUrl'));
const generator = connectAs(inject('generatorUrl'));
const drizzleGen = createDb(inject('generatorUrl'), { max: 1 });

type Sql = typeof generator;

const insertFact = (
  sql: Sql,
  o: {
    label?: string;
    category?: string;
    eventDate?: string;
    precision?: string;
    note?: string;
    wikidata?: string;
    status?: string;
    reason?: string | null;
    updatedAt?: string;
  } = {},
) => sql`INSERT INTO timeline_facts (label, category, event_date, date_precision, note, wikidata_id, sitelinks, status, rejection_reason, dataset_version, updated_at)
  VALUES (${o.label ?? 'Kubernetes'}, ${o.category ?? 'frameworks'}, ${o.eventDate ?? '2014-06-01'},
    ${o.precision ?? 'month'},
    ${o.note ?? '{"es":"Orquestador de contenedores.","en":"Container orchestrator."}'}::text::jsonb,
    ${o.wikidata ?? `Q-${randomUUID()}`}, 60, ${o.status ?? 'approved'}, ${o.reason ?? null},
    '2026.11.10', ${o.updatedAt ?? sql`now()`})
  RETURNING *`;

const upsert = (
  sql: Sql,
  o: {
    wikidata: string;
    status?: string;
    reason?: string | null;
    sitelinks?: number;
    version?: string;
  },
) => sql`INSERT INTO timeline_facts (label, category, event_date, date_precision, note, wikidata_id, sitelinks, status, rejection_reason, dataset_version)
  VALUES ('Kubernetes', 'frameworks', '2014-06-01', 'month',
    '{"es":"Orquestador de contenedores.","en":"Container orchestrator."}'::jsonb,
    ${o.wikidata}, ${o.sitelinks ?? 60}, ${o.status ?? 'approved'}, ${o.reason ?? null}, ${o.version ?? '2026.11.10'})
  ON CONFLICT (wikidata_id) DO UPDATE SET
    label = EXCLUDED.label, category = EXCLUDED.category, event_date = EXCLUDED.event_date,
    date_precision = EXCLUDED.date_precision, note = EXCLUDED.note, sitelinks = EXCLUDED.sitelinks,
    status = EXCLUDED.status, rejection_reason = EXCLUDED.rejection_reason,
    dataset_version = EXCLUDED.dataset_version
  WHERE timeline_facts.status <> 'rejected'
  RETURNING id`;

const enumLabels = async (name: string) => {
  const rows = await owner`SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = ${name} ORDER BY e.enumsortorder`;
  return rows.map((r) => r.enumlabel);
};

const PERMISSION = { code: '42501', message: 'permission denied for table timeline_facts' };

beforeAll(async () => {
  await truncateAll({ sql: owner });
});

afterAll(async () => {
  await Promise.all([owner.end(), api.end(), generator.end(), drizzleGen.sql.end()]);
});

describe('timeline_facts structure', () => {
  it('S025-TS-2: enum timeline_category', async () => {
    const labels = await enumLabels('timeline_category');
    expect(labels).toEqual([
      'programming_languages',
      'frameworks',
      'companies',
      'operating_systems',
      'hardware',
      'video_games',
      'databases',
      'software_tools',
    ]);
    expect(labels).toEqual([...TIMELINE_CATEGORIES]);
  });

  it('S025-TS-3: enum date_precision', async () => {
    const labels = await enumLabels('date_precision');
    expect(labels).toEqual(['year', 'month', 'day']);
    expect(labels).toEqual([...DATE_PRECISIONS]);
  });

  it('S025-TS-4: exact columns', async () => {
    const rows = await owner`SELECT column_name, udt_name, is_nullable, column_default
      FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'timeline_facts'
      ORDER BY ordinal_position`;
    expect(rows.map((r) => [r.column_name, r.udt_name, r.is_nullable, r.column_default])).toEqual([
      ['id', 'uuid', 'NO', 'gen_random_uuid()'],
      ['label', 'text', 'NO', null],
      ['category', 'timeline_category', 'NO', null],
      ['event_date', 'date', 'NO', null],
      ['date_precision', 'date_precision', 'NO', null],
      ['note', 'jsonb', 'NO', null],
      ['wikidata_id', 'text', 'NO', null],
      ['sitelinks', 'int4', 'NO', null],
      ['status', 'bank_item_status', 'NO', null],
      ['rejection_reason', 'text', 'YES', null],
      ['last_used', 'date', 'YES', null],
      ['dataset_version', 'text', 'NO', null],
      ['created_at', 'timestamptz', 'NO', 'now()'],
      ['updated_at', 'timestamptz', 'NO', 'now()'],
    ]);
  });

  it('S025-TS-5: primary key and unique wikidata_id', async () => {
    const pk = await owner`SELECT a.attname FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY (i.indkey)
      WHERE i.indrelid = 'timeline_facts'::regclass AND i.indisprimary`;
    expect(pk.map((r) => r.attname)).toEqual(['id']);
    const uq = await owner`SELECT conname FROM pg_constraint
      WHERE conrelid = 'timeline_facts'::regclass AND contype = 'u'`;
    expect(uq.map((r) => r.conname)).toEqual(['timeline_facts_wikidata_id_unique']);
  });

  it('S025-TS-6: pick index', async () => {
    const [row] = await owner`SELECT indexdef FROM pg_indexes
      WHERE schemaname = 'public' AND indexname = 'idx_timeline_facts_pick'`;
    expect(row!.indexdef).toBe(
      'CREATE INDEX idx_timeline_facts_pick ON public.timeline_facts USING btree (status, category, last_used)',
    );
  });

  it('S025-TS-7: table checks', async () => {
    const rows = await owner`SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint
      WHERE conrelid = 'timeline_facts'::regclass AND contype = 'c' ORDER BY conname`;
    expect(rows.map((r) => r.conname)).toEqual([
      'ck_timeline_facts_note_locales',
      'ck_timeline_facts_rejection_reason',
    ]);
    expect(rows[0]!.def).toContain(`note ? 'es'`);
    expect(rows[0]!.def).toContain(`note ? 'en'`);
    expect(rows[1]!.def).toContain(`status <> 'rejected'`);
    expect(rows[1]!.def).toContain('rejection_reason IS NOT NULL');
  });

  it('S025-TS-9: table triggers', async () => {
    const rows = await owner`SELECT tgname, pg_get_triggerdef(oid) AS def FROM pg_trigger
      WHERE tgrelid = 'timeline_facts'::regclass AND NOT tgisinternal ORDER BY tgname`;
    expect(rows.map((r) => [r.tgname, r.def])).toEqual([
      [
        'bank_items_rejected_terminal',
        'CREATE TRIGGER bank_items_rejected_terminal BEFORE UPDATE OF status ON public.timeline_facts FOR EACH ROW EXECUTE FUNCTION bank_items_rejected_terminal()',
      ],
      [
        'set_updated_at',
        'CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.timeline_facts FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      ],
    ]);
  });
});

describe('timeline_facts insert and checks', () => {
  it('S025-TS-12: approved insert by generator', async () => {
    const [r] = await insertFact(generator, { wikidata: `Q22661306-${randomUUID()}` });
    expect(r).toMatchObject({
      label: 'Kubernetes',
      category: 'frameworks',
      date_precision: 'month',
      note: { es: 'Orquestador de contenedores.', en: 'Container orchestrator.' },
      status: 'approved',
      rejection_reason: null,
      last_used: null,
    });
    expect(String(r!.event_date.toISOString?.().slice(0, 10) ?? r!.event_date)).toBe('2014-06-01');
    expect(r!.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(r!.created_at.getTime()).toBe(r!.updated_at.getTime());
  });

  it('S025-TS-13: category outside enum', async () => {
    await expect(insertFact(generator, { category: 'internet' })).rejects.toMatchObject({
      code: '22P02',
      message: expect.stringContaining('invalid input value for enum timeline_category'),
    });
  });

  it('S025-TS-14: precision outside enum', async () => {
    await expect(insertFact(generator, { precision: 'decade' })).rejects.toMatchObject({
      code: '22P02',
      message: expect.stringContaining('invalid input value for enum date_precision'),
    });
  });

  it('S025-TS-15: invalid date', async () => {
    await expect(insertFact(generator, { eventDate: '2014-13-01' })).rejects.toMatchObject({
      code: '22008',
    });
  });

  it.each([
    ['S025-TS-16: note without en', '{"es":"Orquestador."}'],
    ['S025-TS-17: note without es', '{"en":"Orchestrator."}'],
  ])('%s', async (_title, note) => {
    await expect(insertFact(generator, { note })).rejects.toMatchObject({
      code: '23514',
      constraint_name: 'ck_timeline_facts_note_locales',
    });
  });

  it('S025-TS-18: rejected without reason', async () => {
    await expect(insertFact(generator, { status: 'rejected', reason: null })).rejects.toMatchObject(
      {
        code: '23514',
        constraint_name: 'ck_timeline_facts_rejection_reason',
      },
    );
  });

  it('S025-TS-19: rejected with reason', async () => {
    const [r] = await insertFact(generator, {
      label: 'Docker',
      wikidata: `Q15206305-${randomUUID()}`,
      status: 'rejected',
      reason: 'disputed_date',
    });
    expect(r).toMatchObject({ status: 'rejected', rejection_reason: 'disputed_date' });
  });

  it('S025-TS-20: duplicate wikidata_id', async () => {
    const wikidata = `Q-dup-${randomUUID()}`;
    await insertFact(generator, { label: 'Go', wikidata });
    await expect(insertFact(generator, { label: 'Golang', wikidata })).rejects.toMatchObject({
      code: '23505',
      constraint_name: 'timeline_facts_wikidata_id_unique',
    });
  });

  it('S025-TS-21: repeated label allowed', async () => {
    await insertFact(generator, { label: 'Linux' });
    await expect(insertFact(generator, { label: 'Linux' })).resolves.toBeDefined();
  });
});

describe('timeline_facts terminal trigger and updated_at', () => {
  const rejectedDocker = async () => {
    const [r] = await insertFact(owner, {
      label: 'Docker',
      status: 'rejected',
      reason: 'excluded',
    });
    return r!.id as string;
  };

  it.each([
    ['S025-TS-22: generator', generator],
    ['S025-TS-23: api', api],
  ])('%s cannot take rejected back to approved', async (_title, sql) => {
    const id = await rejectedDocker();
    await expect(
      sql`UPDATE timeline_facts SET status = 'approved' WHERE id = ${id}`,
    ).rejects.toMatchObject({
      code: 'P0001',
      message: 'bank_items_rejected_terminal: a rejected item cannot leave rejected',
    });
    const [row] = await owner`SELECT status FROM timeline_facts WHERE id = ${id}`;
    expect(row!.status).toBe('rejected');
  });

  it('S025-TS-24: api rejects an approved fact', async () => {
    const [r] = await insertFact(owner, { label: 'React' });
    await api`UPDATE timeline_facts SET status = 'rejected', rejection_reason = 'wrong_answer' WHERE id = ${r!.id}`;
    const [row] =
      await owner`SELECT status, rejection_reason FROM timeline_facts WHERE id = ${r!.id}`;
    expect(row).toMatchObject({ status: 'rejected', rejection_reason: 'wrong_answer' });
  });

  it('S025-TS-25: rejected to rejected with another reason', async () => {
    const id = await rejectedDocker();
    await expect(
      generator`UPDATE timeline_facts SET status = 'rejected', rejection_reason = 'duplicate' WHERE id = ${id}`,
    ).resolves.toBeDefined();
  });

  it('S025-TS-26: set_updated_at', async () => {
    const wikidata = `Q-upd-${randomUUID()}`;
    await insertFact(owner, { wikidata, updatedAt: '2026-01-01T00:00:00Z' });
    await generator`UPDATE timeline_facts SET last_used = '2026-12-01' WHERE wikidata_id = ${wikidata}`;
    const [row] =
      await owner`SELECT updated_at > '2026-01-01T00:00:00Z' AS bumped, last_used::text AS lu
      FROM timeline_facts WHERE wikidata_id = ${wikidata}`;
    expect(row).toMatchObject({ bumped: true, lu: '2026-12-01' });
  });
});

describe('timeline_facts sync_banks upsert', () => {
  it('S025-TS-27: update by wikidata_id keeps last_used', async () => {
    const wikidata = `Q-k8s-${randomUUID()}`;
    await owner`INSERT INTO timeline_facts (label, category, event_date, date_precision, note, wikidata_id, sitelinks, status, dataset_version, last_used)
      VALUES ('Kubernetes', 'frameworks', '2014-06-01', 'month', '{"es":"a","en":"b"}'::jsonb, ${wikidata}, 60, 'approved', '2026.11.06', '2026-11-01')`;
    const res = await upsert(generator, { wikidata, sitelinks: 61 });
    expect(res).toHaveLength(1);
    const rows =
      await owner`SELECT sitelinks, dataset_version, last_used::text AS lu, updated_at > created_at AS bumped
      FROM timeline_facts WHERE wikidata_id = ${wikidata}`;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      sitelinks: 61,
      dataset_version: '2026.11.10',
      lu: '2026-11-01',
      bumped: true,
    });
  });

  it('S025-TS-28: a rejected fact does not revive', async () => {
    const wikidata = `Q-docker-${randomUUID()}`;
    await owner`INSERT INTO timeline_facts (label, category, event_date, date_precision, note, wikidata_id, sitelinks, status, rejection_reason, dataset_version, last_used)
      VALUES ('Docker', 'frameworks', '2013-03-01', 'month', '{"es":"a","en":"b"}'::jsonb, ${wikidata}, 60, 'rejected', 'excluded', '2026.11.06', '2026-10-01')`;
    const res = await upsert(generator, { wikidata, sitelinks: 99 });
    expect(res).toHaveLength(0);
    const [row] = await owner`SELECT status, rejection_reason, sitelinks, last_used::text AS lu
      FROM timeline_facts WHERE wikidata_id = ${wikidata}`;
    expect(row).toMatchObject({
      status: 'rejected',
      rejection_reason: 'excluded',
      sitelinks: 60,
      lu: '2026-10-01',
    });
  });

  it('S025-TS-29: approved in db, rejected in dataset', async () => {
    const wikidata = `Q-ng-${randomUUID()}`;
    await insertFact(owner, { label: 'Angular', wikidata });
    const res = await upsert(generator, { wikidata, status: 'rejected', reason: 'disputed_date' });
    expect(res).toHaveLength(1);
    const [row] =
      await owner`SELECT status, rejection_reason FROM timeline_facts WHERE wikidata_id = ${wikidata}`;
    expect(row).toMatchObject({ status: 'rejected', rejection_reason: 'disputed_date' });
  });

  it('S025-TS-30: insert by upsert', async () => {
    const wikidata = `Q-new-${randomUUID()}`;
    const res = await upsert(generator, { wikidata });
    expect(res).toHaveLength(1);
    const [row] = await owner`SELECT last_used FROM timeline_facts WHERE wikidata_id = ${wikidata}`;
    expect(row!.last_used).toBeNull();
  });
});

describe('timeline_facts privileges by role', () => {
  it('S025-TS-33: api reads', async () => {
    const wikidata = `Q-read-${randomUUID()}`;
    await insertFact(owner, { wikidata });
    const rows =
      await api`SELECT id, label, status FROM timeline_facts WHERE wikidata_id = ${wikidata}`;
    expect(rows).toHaveLength(1);
  });

  it('S025-TS-34: api cannot insert', async () => {
    await expect(insertFact(api)).rejects.toMatchObject(PERMISSION);
  });

  it('S025-TS-35: api cannot update other columns', async () => {
    const [r] = await insertFact(owner);
    await expect(
      api`UPDATE timeline_facts SET label = 'K8s' WHERE id = ${r!.id}`,
    ).rejects.toMatchObject(PERMISSION);
    await expect(
      api`UPDATE timeline_facts SET last_used = '2026-12-01' WHERE id = ${r!.id}`,
    ).rejects.toMatchObject(PERMISSION);
  });

  it.each([
    ['api', api],
    ['generator', generator],
  ])('S025-TS-36: %s cannot delete or truncate', async (_role, sql) => {
    const [r] = await insertFact(owner);
    await expect(sql`DELETE FROM timeline_facts WHERE id = ${r!.id}`).rejects.toMatchObject(
      PERMISSION,
    );
    await expect(sql`TRUNCATE timeline_facts`).rejects.toMatchObject(PERMISSION);
    const rows = await owner`SELECT id FROM timeline_facts WHERE id = ${r!.id}`;
    expect(rows).toHaveLength(1);
  });

  it.each([
    ['api', api],
    ['generator', generator],
  ])('S025-TS-37: %s cannot run DDL', async (_role, sql) => {
    await expect(sql`ALTER TABLE timeline_facts ADD COLUMN x int`).rejects.toMatchObject({
      code: '42501',
      message: expect.stringContaining('must be owner of table timeline_facts'),
    });
  });

  it('S025-TS-38: generator writes last_used', async () => {
    const [r] = await insertFact(owner);
    await generator`UPDATE timeline_facts SET last_used = GREATEST(last_used, '2026-12-05'::date) WHERE id = ${r!.id}`;
    const [row] = await owner`SELECT last_used::text AS lu FROM timeline_facts WHERE id = ${r!.id}`;
    expect(row!.lu).toBe('2026-12-05');
  });
});

describe('timeline_facts drizzle and helpers', () => {
  it('S025-TS-43: round-trip with Drizzle as generator', async () => {
    const [row] = await drizzleGen.db
      .insert(timelineFacts)
      .values({
        label: 'Rust',
        category: 'programming_languages',
        eventDate: '2010-07-07',
        datePrecision: 'day',
        note: { es: 'Lenguaje de sistemas.', en: 'Systems language.' },
        wikidataId: `Q-rust-${randomUUID()}`,
        sitelinks: 80,
        status: 'approved',
        datasetVersion: '2026.11.10',
      })
      .returning();
    expect(row).toMatchObject({
      eventDate: '2010-07-07',
      note: { es: 'Lenguaje de sistemas.', en: 'Systems language.' },
      lastUsed: null,
      rejectionReason: null,
    });
  });

  it('S025-TS-45: truncateAll covers the table', async () => {
    await insertFact(owner);
    await truncateAll({ sql: owner });
    const [row] = await owner`SELECT count(*)::int AS n FROM timeline_facts`;
    expect(row!.n).toBe(0);
  });
});
