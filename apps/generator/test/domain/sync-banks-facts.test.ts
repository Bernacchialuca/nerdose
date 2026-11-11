import { fileURLToPath } from 'node:url';

import { loadDataset } from '@nerdose/content';
import type { Dataset } from '@nerdose/content';
import { jobRuns, terms, timelineFacts } from '@nerdose/db';
import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { syncBanksJob } from '@/scheduler/jobs/sync-banks.job';
import { runJob, type RunJobDeps } from '@/scheduler/run-job';

import { setupTestDb } from '../helpers/db';
import { insertFacts, makeFact, makeFacts, withFacts } from '../helpers/facts';
import { captureLogger } from '../helpers/logger';

const t = setupTestDb();
const Z = { inserted: 0, updated: 0, unchanged: 0, kept_rejected: 0, skipped: 0 };
const V = '2026.12.10';

const fixture = (name: string) => () =>
  loadDataset(fileURLToPath(new URL(`../fixtures/datasets/${name}/`, import.meta.url)));

function sync(load: () => Dataset) {
  const captured = captureLogger();
  const deps: RunJobDeps = {
    sql: t.svc.sql,
    db: t.svc.db,
    logger: captured.logger,
    clock: { now: () => new Date('2026-12-01T12:00:00.000Z') },
    signal: new AbortController().signal,
  };
  return {
    result: runJob('sync_banks', syncBanksJob({ db: t.svc.db, loadDataset: load }), deps),
    lines: captured.lines,
  };
}

type Summary = Record<string, unknown> & {
  by_bank: { terms: typeof Z; timeline_facts: typeof Z };
};
const lastRun = async () => {
  const rows = await t.owner.db.select().from(jobRuns).where(eq(jobRuns.job, 'sync_banks'));
  return rows.at(-1)!;
};
const summary = async () => (await lastRun()).summary as Summary;
const fact = async (wid: string) =>
  (await t.owner.db.select().from(timelineFacts).where(eq(timelineFacts.wikidataId, wid)))[0];
const allFacts = () => t.owner.db.select().from(timelineFacts).orderBy(timelineFacts.wikidataId);
const reject = (wid: string, reason = 'voided') =>
  t.owner.db
    .update(timelineFacts)
    .set({ status: 'rejected', rejectionReason: reason })
    .where(eq(timelineFacts.wikidataId, wid));

const python = (o = {}) =>
  makeFact({ wikidata_id: 'Q28865', label: 'Python', category: 'programming_languages', ...o });

beforeEach(() => t.reset());
afterAll(() => t.cleanup());

describe('sync_banks con timeline_facts', () => {
  it('TS-11 primera carga con 40 hechos y TS-24 totales = suma', async () => {
    expect(await sync(withFacts('v1', makeFacts(40), V)).result).toBe('success');
    const s = await summary();
    expect(s).toEqual({
      dataset_version: V,
      inserted: 43,
      updated: 0,
      unchanged: 0,
      kept_rejected: 0,
      skipped: 2,
      by_bank: {
        terms: { ...Z, inserted: 3, skipped: 2 },
        timeline_facts: { ...Z, inserted: 40 },
      },
    });
    for (const k of Object.keys(Z) as (keyof typeof Z)[]) {
      expect(s[k]).toBe(s.by_bank.terms[k] + s.by_bank.timeline_facts[k]);
    }
    const rows = await allFacts();
    expect(rows).toHaveLength(40);
    expect(rows.every((r) => r.datasetVersion === V && r.lastUsed === null)).toBe(true);
  });

  it('TS-12 re-arrancar no cambia nada', async () => {
    const load = withFacts('v1', makeFacts(40), V);
    await sync(load).result;
    const before = await allFacts();
    expect(await sync(load).result).toBe('success');
    const s = await summary();
    expect(s.by_bank.timeline_facts).toEqual({ ...Z, unchanged: 40 });
    expect(s.by_bank.terms).toEqual({ ...Z, unchanged: 2, kept_rejected: 1, skipped: 2 });
    expect(await allFacts()).toEqual(before);
  });

  it('TS-13 dataset nuevo con 40 hechos más', async () => {
    await insertFacts(
      t.owner.db,
      makeFacts(5).map((f) => ({
        wikidataId: f.wikidata_id,
        label: f.label,
        category: f.category,
        eventDate: f.event_date,
        datePrecision: f.date_precision,
        note: f.note,
        sitelinks: f.sitelinks,
        datasetVersion: '2026.12.01',
        lastUsed: '2026-11-25',
      })),
    );
    await sync(withFacts('v1', makeFacts(45), V)).result;
    const s = await summary();
    expect(s.by_bank.timeline_facts).toEqual({ ...Z, inserted: 40, unchanged: 5 });
    expect(s.dataset_version).toBe(V);
    const old = (await allFacts()).filter((r) => Number(r.wikidataId.slice(1)) <= 5000005);
    expect(old).toHaveLength(5);
    expect(old.every((r) => r.datasetVersion === '2026.12.01' && r.lastUsed === '2026-11-25')).toBe(
      true,
    );
  });

  it('TS-14 un rejected en la base sigue rejected', async () => {
    await insertFacts(t.owner.db, [
      { wikidataId: 'Q15206305', lastUsed: '2026-11-15', datasetVersion: 'old' },
    ]);
    await reject('Q15206305');
    await sync(withFacts('v1', [makeFact()], V)).result;
    expect(await fact('Q15206305')).toMatchObject({
      status: 'rejected',
      rejectionReason: 'voided',
      lastUsed: '2026-11-15',
      datasetVersion: 'old',
    });
    expect((await summary()).by_bank.timeline_facts).toEqual({ ...Z, kept_rejected: 1 });
  });

  it('TS-15 last_used no cambia aunque cambie el contenido', async () => {
    await insertFacts(t.owner.db, [
      { wikidataId: 'Q28865', label: 'Python', sitelinks: 100, lastUsed: '2026-11-30' },
    ]);
    await sync(withFacts('v1', [python({ sitelinks: 120, note: { es: 'otra', en: 'other' } })], V))
      .result;
    expect(await fact('Q28865')).toMatchObject({
      sitelinks: 120,
      lastUsed: '2026-11-30',
      status: 'approved',
      datasetVersion: V,
    });
    expect((await summary()).by_bank.timeline_facts.updated).toBe(1);
  });

  it('TS-16 approved -> rejected con log', async () => {
    await insertFacts(t.owner.db, [
      { wikidataId: 'Q28865', label: 'Python', lastUsed: '2026-11-30' },
    ]);
    const run = sync(
      withFacts('v1', [python({ status: 'rejected', rejection_reason: 'note_year_mismatch' })], V),
    );
    await run.result;
    expect(await fact('Q28865')).toMatchObject({
      status: 'rejected',
      rejectionReason: 'note_year_mismatch',
      lastUsed: '2026-11-30',
      datasetVersion: V,
    });
    expect((await summary()).by_bank.timeline_facts.updated).toBe(1);
    expect(run.lines()).toContainEqual(
      expect.objectContaining({
        level: 'info',
        msg: 'ContentItemRejected',
        bank: 'timeline_facts',
        wikidata_id: 'Q28865',
        reason: 'note_year_mismatch',
      }),
    );
  });

  it('TS-17 approved -> rejected con fecha no almacenable', async () => {
    await insertFacts(t.owner.db, [
      { wikidataId: 'Q28865', label: 'Python', eventDate: '1991-02-20' },
    ]);
    const r = sync(
      withFacts(
        'v1',
        [
          python({
            status: 'rejected',
            rejection_reason: 'disputed_date',
            event_date: '1991-02-30',
          }),
        ],
        V,
      ),
    );
    expect(await r.result).toBe('success');
    expect(await fact('Q28865')).toMatchObject({
      status: 'rejected',
      rejectionReason: 'disputed_date',
      eventDate: '1991-02-20',
    });
    expect((await summary()).by_bank.timeline_facts.updated).toBe(1);
  });

  it('TS-18 rejected nuevo se inserta sin unicidad por label', async () => {
    await insertFacts(t.owner.db, [{ wikidataId: 'Q15206305', sitelinks: 60 }]);
    await sync(
      withFacts(
        'v1',
        [
          makeFact(),
          makeFact({
            wikidata_id: 'Q99999901',
            event_date: '2013-01-01',
            date_precision: 'year',
            note: { es: '', en: '' },
            sitelinks: 3,
            status: 'rejected',
            rejection_reason: 'duplicate',
          }),
        ],
        V,
      ),
    ).result;
    expect(await fact('Q99999901')).toMatchObject({
      status: 'rejected',
      rejectionReason: 'duplicate',
      label: 'Docker',
    });
    expect((await summary()).by_bank.timeline_facts).toEqual({ ...Z, inserted: 1, unchanged: 1 });
  });

  it('TS-19 rejected nuevo con fecha no almacenable se saltea', async () => {
    const r = sync(
      withFacts(
        'v1',
        [
          makeFact({
            wikidata_id: 'Q99999902',
            label: 'Foo',
            event_date: '2014-02-30',
            status: 'rejected',
            rejection_reason: 'disputed_date',
            note: { es: '', en: '' },
          }),
        ],
        V,
      ),
    );
    expect(await r.result).toBe('success');
    expect(await fact('Q99999902')).toBeUndefined();
    expect((await summary()).by_bank.timeline_facts).toEqual({ ...Z, skipped: 1 });
    expect((await t.owner.db.select().from(terms)).length).toBe(3);
  });

  it('TS-20 nunca borra hechos que no están en el dataset', async () => {
    await insertFacts(t.owner.db, [{ wikidataId: 'Q388', label: 'Linux' }]);
    await sync(withFacts('v1', [makeFact()], V)).result;
    expect(await fact('Q388')).toMatchObject({
      label: 'Linux',
      status: 'approved',
      datasetVersion: 'test',
    });
    expect((await summary()).by_bank.timeline_facts.inserted).toBe(1);
  });

  it('TS-21 rejected en base y rejected en dataset cuenta kept_rejected', async () => {
    await insertFacts(t.owner.db, [{ wikidataId: 'Q15206305' }]);
    await reject('Q15206305');
    await sync(withFacts('v1', [makeFact({ status: 'rejected', rejection_reason: 'excluded' })], V))
      .result;
    expect(await fact('Q15206305')).toMatchObject({ rejectionReason: 'voided' });
    expect((await summary()).by_bank.timeline_facts.kept_rejected).toBe(1);
  });

  it('TS-22 un fallo en hechos revierte terms', async () => {
    await t.owner.db.execute(sql`
      CREATE FUNCTION test_fail_fact() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'boom_facts'; END $$`);
    await t.owner.db.execute(sql`
      CREATE TRIGGER test_fail_fact BEFORE INSERT ON timeline_facts
      FOR EACH ROW WHEN (NEW.wikidata_id = 'Q99999903') EXECUTE FUNCTION test_fail_fact()`);
    try {
      const r = await sync(withFacts('v1', [makeFact(), makeFact({ wikidata_id: 'Q99999903' })], V))
        .result;
      expect(r).toBe('failed');
      const last = await lastRun();
      expect(last.status).toBe('failed');
      expect((last.summary as { error: string }).error).toContain('Q99999903');
      expect(await t.owner.db.select().from(terms)).toHaveLength(0);
      expect(await allFacts()).toHaveLength(0);
    } finally {
      await t.owner.db.execute(sql`DROP TRIGGER IF EXISTS test_fail_fact ON timeline_facts`);
      await t.owner.db.execute(sql`DROP FUNCTION IF EXISTS test_fail_fact()`);
    }
  });

  it('TS-23 timeline_facts.json inválido falla sin carga parcial', async () => {
    await sync(withFacts('v1', [makeFact()], V)).result;
    const termsBefore = await t.owner.db.select().from(terms).orderBy(terms.wikidataId);
    const factsBefore = await allFacts();
    expect(await sync(fixture('invalid-facts')).result).toBe('failed');
    expect(((await lastRun()).summary as { error: string }).error).toContain('timeline_facts.json');
    expect(await t.owner.db.select().from(terms).orderBy(terms.wikidataId)).toEqual(termsBefore);
    expect(await allFacts()).toEqual(factsBefore);
  });

  it('TS-26 el log de terms rechazados lleva bank', async () => {
    await sync(fixture('v1')).result;
    const run = sync(fixture('v2'));
    await run.result;
    expect(run.lines()).toContainEqual(
      expect.objectContaining({
        msg: 'ContentItemRejected',
        bank: 'terms',
        wikidata_id: 'Q101',
        reason: 'excluded',
      }),
    );
  });
});
