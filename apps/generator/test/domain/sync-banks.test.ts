import { fileURLToPath } from 'node:url';

import { loadDataset } from '@nerdose/content';
import { jobRuns, terms } from '@nerdose/db';
import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { runJob, type RunJobDeps } from '@/scheduler/run-job';
import { syncBanksJob } from '@/scheduler/jobs/sync-banks.job';

import { setupTestDb } from '../helpers/db';
import { captureLogger } from '../helpers/logger';

const t = setupTestDb();

const dataset = (name: string) => () =>
  loadDataset(fileURLToPath(new URL(`../fixtures/datasets/${name}/`, import.meta.url)));

function run(name: string) {
  const captured = captureLogger();
  const deps: RunJobDeps = {
    sql: t.svc.sql,
    db: t.svc.db,
    logger: captured.logger,
    clock: { now: () => new Date('2026-12-01T12:00:00.000Z') },
    signal: new AbortController().signal,
  };
  const result = runJob(
    'sync_banks',
    syncBanksJob({ db: t.svc.db, loadDataset: dataset(name) }),
    deps,
  );
  return { result, lines: captured.lines };
}

const lastRun = async () => {
  const rows = await t.owner.db.select().from(jobRuns).where(eq(jobRuns.job, 'sync_banks'));
  return rows.at(-1)!;
};
const term = async (wid: string) =>
  (await t.owner.db.select().from(terms).where(eq(terms.wikidataId, wid)))[0];

beforeEach(() => t.reset());
afterAll(() => t.cleanup());

describe('sync_banks', () => {
  it('primera carga: inserta y saltea los rejected no insertables', async () => {
    expect(await run('v1').result).toBe('success');
    expect((await lastRun()).summary).toEqual({
      dataset_version: '2026.12.01',
      inserted: 3,
      updated: 0,
      unchanged: 0,
      kept_rejected: 0,
      skipped: 2,
      by_bank: {
        terms: { inserted: 3, updated: 0, unchanged: 0, kept_rejected: 0, skipped: 2 },
        timeline_facts: { inserted: 0, updated: 0, unchanged: 0, kept_rejected: 0, skipped: 0 },
      },
    });
    expect(await term('Q100')).toMatchObject({
      term: 'REACT',
      status: 'approved',
      datasetVersion: '2026.12.01',
      lastUsedDevdle: null,
    });
    expect(await term('Q101')).toMatchObject({ term: 'MERGE', status: 'approved' });
    expect(await term('Q103')).toMatchObject({
      term: 'KOTLINX',
      status: 'rejected',
      rejectionReason: 'low_sitelinks',
    });
    expect(await term('Q102')).toBeUndefined();
    expect(await term('Q104')).toBeUndefined();
  });

  it('re-arrancar con el mismo dataset no toca nada', async () => {
    await run('v1').result;
    const before = await t.owner.db.select().from(terms).orderBy(terms.wikidataId);
    expect(await run('v1').result).toBe('success');
    expect((await lastRun()).summary).toEqual({
      dataset_version: '2026.12.01',
      inserted: 0,
      updated: 0,
      unchanged: 2,
      kept_rejected: 1,
      skipped: 2,
      by_bank: {
        terms: { inserted: 0, updated: 0, unchanged: 2, kept_rejected: 1, skipped: 2 },
        timeline_facts: { inserted: 0, updated: 0, unchanged: 0, kept_rejected: 0, skipped: 0 },
      },
    });
    expect(await t.owner.db.select().from(terms).orderBy(terms.wikidataId)).toEqual(before);
  });

  it('un rejected en la base nunca vuelve a approved ni cambia', async () => {
    await t.owner.db.insert(terms).values({
      term: 'ROUTER',
      category: 'networking',
      definition: { es: 'a', en: 'b' },
      summary: { es: 'a', en: 'b' },
      wikidataId: 'Q200',
      sitelinks: 10,
      status: 'approved',
      datasetVersion: 'old',
    });
    await t.owner.db
      .update(terms)
      .set({ status: 'rejected', rejectionReason: 'voided', lastUsedDevdle: '2026-11-15' })
      .where(eq(terms.wikidataId, 'Q200'));
    await run('v2').result;
    expect(await term('Q200')).toMatchObject({
      status: 'rejected',
      rejectionReason: 'voided',
      lastUsedDevdle: '2026-11-15',
      datasetVersion: 'old',
    });
    expect((await lastRun()).summary).toMatchObject({ kept_rejected: 1 });
  });

  it('actualiza un approved sin pisar last_used y pasa a rejected lo que el dataset rechaza', async () => {
    await run('v1').result;
    await t.owner.db
      .update(terms)
      .set({ lastUsedDevdle: '2026-11-30' })
      .where(eq(terms.wikidataId, 'Q100'));
    const logs = run('v2');
    await logs.result;
    expect(await term('Q100')).toMatchObject({
      sitelinks: 60,
      definition: { es: 'biblioteca de UI', en: 'JavaScript UI library' },
      datasetVersion: '2026.12.02',
      lastUsedDevdle: '2026-11-30',
      status: 'approved',
    });
    expect(await term('Q101')).toMatchObject({
      status: 'rejected',
      rejectionReason: 'excluded',
      term: 'MERGE',
      datasetVersion: '2026.12.02',
    });
    expect(logs.lines()).toContainEqual(
      expect.objectContaining({ msg: 'ContentItemRejected', wikidata_id: 'Q101' }),
    );
  });

  it('nunca borra ítems que no están en el dataset', async () => {
    await run('v1').result;
    await run('v2').result;
    expect(await term('Q103')).toMatchObject({ status: 'rejected', datasetVersion: '2026.12.01' });
    expect((await lastRun()).summary).toEqual({
      dataset_version: '2026.12.02',
      inserted: 1,
      updated: 2,
      unchanged: 0,
      kept_rejected: 0,
      skipped: 0,
      by_bank: {
        terms: { inserted: 1, updated: 2, unchanged: 0, kept_rejected: 0, skipped: 0 },
        timeline_facts: { inserted: 0, updated: 0, unchanged: 0, kept_rejected: 0, skipped: 0 },
      },
    });
  });

  it('nunca borra y cuenta el rejected previo como kept_rejected', async () => {
    await run('v1').result;
    await t.owner.db.insert(terms).values({
      term: 'ROUTER',
      category: 'networking',
      definition: { es: 'a', en: 'b' },
      summary: { es: 'a', en: 'b' },
      wikidataId: 'Q200',
      sitelinks: 10,
      status: 'approved',
      datasetVersion: 'old',
    });
    await t.owner.db
      .update(terms)
      .set({ status: 'rejected', rejectionReason: 'voided' })
      .where(eq(terms.wikidataId, 'Q200'));
    await run('v2').result;
    expect(await term('Q103')).toBeDefined();
    expect((await lastRun()).summary).toEqual({
      dataset_version: '2026.12.02',
      inserted: 0,
      updated: 2,
      unchanged: 0,
      kept_rejected: 1,
      skipped: 0,
      by_bank: {
        terms: { inserted: 0, updated: 2, unchanged: 0, kept_rejected: 1, skipped: 0 },
        timeline_facts: { inserted: 0, updated: 0, unchanged: 0, kept_rejected: 0, skipped: 0 },
      },
    });
  });

  it('un rejected nuevo con un term que ya existe no se inserta', async () => {
    await run('v1').result;
    await run('dup-rejected').result;
    expect(await term('Q300')).toBeUndefined();
    expect((await lastRun()).summary).toMatchObject({ inserted: 0, skipped: 1 });
  });

  it('un approved cuyo term ya tiene otra fila se saltea con warn', async () => {
    await t.owner.db.insert(terms).values({
      term: 'SOCKET',
      category: 'networking',
      definition: { es: 'a', en: 'b' },
      summary: { es: 'a', en: 'b' },
      wikidataId: 'Q900',
      sitelinks: 10,
      status: 'approved',
      datasetVersion: 'old',
    });
    const logs = run('conflict');
    expect(await logs.result).toBe('success');
    expect(await term('Q901')).toBeUndefined();
    expect((await lastRun()).summary).toMatchObject({ inserted: 0, skipped: 1 });
    expect(logs.lines()).toContainEqual(
      expect.objectContaining({
        level: 'warn',
        msg: 'Term conflict, item skipped',
        wikidata_id: 'Q901',
        term: 'SOCKET',
      }),
    );
  });

  it('un dataset inválido falla el job y deja los bancos como estaban', async () => {
    await run('v1').result;
    const before = await t.owner.db.select().from(terms).orderBy(terms.wikidataId);
    expect(await run('invalid').result).toBe('failed');
    const last = await lastRun();
    expect(last.status).toBe('failed');
    expect((last.summary as { error: string }).error).toContain('terms.json');
    expect(await t.owner.db.select().from(terms).orderBy(terms.wikidataId)).toEqual(before);
  });
});
