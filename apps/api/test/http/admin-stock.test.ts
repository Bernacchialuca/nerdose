import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { adminAuth, buildDbApp } from '../helpers/app';
import { useDatabases } from '../helpers/db';

const dbs = useDatabases();
beforeAll(() => dbs.reset());
beforeEach(async () => {
  await dbs.reset();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-12-01T10:00:00Z'));
});
afterEach(() => vi.useRealTimers());
afterAll(() => dbs.close());

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const stock = async () => {
  const { app } = await buildDbApp(dbs);
  return app.request('/api/admin/content/stock', { headers: await adminAuth() });
};

describe('GET /api/admin/content/stock', () => {
  it('TS-30 terms con dos consumidores', async () => {
    const t = (term: string, d: string | null, g: string | null) =>
      dbs.insertTerm({ term, status: 'approved', lastUsedDevdle: d, lastUsedGrep: g });
    await t('REDIS', null, null);
    await t('KAFKA', '2026-06-01', '2026-10-01');
    await t('NGINX', '2025-11-30', '2026-11-20');
    await t('MERGE', '2025-12-01', '2026-11-01');
    await dbs.insertTerm({
      term: 'CACHE',
      status: 'rejected',
      wikidataId: 'Q100',
      rejectionReason: 'low_sitelinks',
      updatedAt: new Date('2026-11-01T00:00:00Z'),
    });
    await dbs.insertTerm({
      term: 'MONGO',
      status: 'rejected',
      wikidataId: 'Q200',
      rejectionReason: 'Definición incorrecta',
      updatedAt: new Date('2026-11-28T00:00:00Z'),
    });
    const res = await stock();
    expect(res.status).toBe(200);
    const body = (await res.json()) as Json;
    expect(body.banks[0]).toEqual({
      bank: 'terms',
      approved_available: 2,
      approved_total: 4,
      rejected_total: 2,
      days_of_stock: 0,
      cycle_ok: false,
      consumers: [
        {
          game_id: 'devdle',
          window_days: 365,
          items_per_challenge: 1,
          approved_available: 3,
          days_of_stock: 3,
          cycle_ok: false,
        },
        {
          game_id: 'grep-grid',
          window_days: 30,
          items_per_challenge: 8,
          approved_available: 3,
          days_of_stock: 0,
          cycle_ok: false,
        },
      ],
      rejections: [
        { wikidata_id: 'Q200', label: 'MONGO', reason: 'Definición incorrecta' },
        { wikidata_id: 'Q100', label: 'CACHE', reason: 'low_sitelinks' },
      ],
    });
  });

  it('TS-31 timeline_facts', async () => {
    const f = (n: number, lastUsed: string | null) =>
      dbs.insertTimelineFact({
        id: `00000000-0000-4000-8000-0000000001${n}0`,
        status: 'approved',
        lastUsed,
      });
    await f(1, null);
    await f(2, '2026-10-01');
    await f(3, '2026-09-02');
    await dbs.insertTimelineFact({
      id: '00000000-0000-4000-8000-000000000140',
      label: 'Lanzamiento de Java',
      wikidataId: 'Q300',
      status: 'rejected',
      rejectionReason: 'disputed_date',
    });
    const body = (await (await stock()).json()) as Json;
    expect(body.banks.map((b: Json) => b.bank)).toEqual(['terms', 'timeline_facts']);
    expect(body.banks[1]).toEqual({
      bank: 'timeline_facts',
      approved_available: 2,
      approved_total: 3,
      rejected_total: 1,
      days_of_stock: 0,
      cycle_ok: false,
      consumers: [
        {
          game_id: 'timeline',
          window_days: 90,
          items_per_challenge: 5,
          approved_available: 2,
          days_of_stock: 0,
          cycle_ok: false,
        },
      ],
      rejections: [{ wikidata_id: 'Q300', label: 'Lanzamiento de Java', reason: 'disputed_date' }],
    });
  });

  it('TS-33 rejections acotadas a 200', async () => {
    for (let i = 0; i < 205; i++) {
      await dbs.insertTerm({
        term: `TERM${String.fromCharCode(65 + Math.floor(i / 26))}${String.fromCharCode(65 + (i % 26))}`,
        status: 'rejected',
        wikidataId: `Q${i}`,
        rejectionReason: 'r',
        updatedAt: new Date(Date.UTC(2026, 10, 1) + i * 60_000),
      });
    }
    const body = (await (await stock()).json()) as Json;
    const rej = body.banks[0].rejections as Json[];
    expect(rej).toHaveLength(200);
    expect(rej[0]!.wikidata_id).toBe('Q204');
    expect(rej.some((r) => ['Q0', 'Q1', 'Q2', 'Q3', 'Q4'].includes(r.wikidata_id))).toBe(false);
  });

  it('TS-34 last_sync es la última success de sync_banks', async () => {
    await dbs.insertJobRun({
      job: 'sync_banks',
      status: 'success',
      startedAt: new Date('2026-11-30T02:59:00Z'),
      finishedAt: new Date('2026-11-30T03:00:00Z'),
      summary: {
        dataset_version: '2026.11.29',
        inserted: 40,
        updated: 3,
        unchanged: 900,
        kept_rejected: 2,
        skipped: 0,
        by_bank: {},
      },
    });
    await dbs.insertJobRun({
      job: 'sync_banks',
      status: 'failed',
      startedAt: new Date('2026-12-01T02:59:00Z'),
      finishedAt: new Date('2026-12-01T03:00:00Z'),
      summary: {},
    });
    await dbs.insertJobRun({
      job: 'fill',
      status: 'success',
      startedAt: new Date('2026-12-01T03:10:00Z'),
      finishedAt: new Date('2026-12-01T03:11:00Z'),
      summary: {},
    });
    const body = (await (await stock()).json()) as Json;
    expect(body.last_sync).toEqual({
      finished_at: '2026-11-30T03:00:00.000Z',
      dataset_version: '2026.11.29',
      inserted: 40,
      updated: 3,
      unchanged: 900,
      kept_rejected: 2,
    });
  });

  it('summary inválido en la última success → 500', async () => {
    await dbs.insertJobRun({
      job: 'sync_banks',
      status: 'success',
      startedAt: new Date('2026-11-30T02:59:00Z'),
      finishedAt: new Date('2026-11-30T03:00:00Z'),
      summary: { dataset_version: 'x' },
    });
    expect((await stock()).status).toBe(500);
  });

  it('TS-35 palabras más rechazadas', async () => {
    const players = [await dbs.insertPlayer(), await dbs.insertPlayer(), await dbs.insertPlayer()];
    const reject = async (word: string, n: number) => {
      for (const p of players.slice(0, n)) await dbs.insertRejectedGuess({ word, playerId: p.id });
    };
    await reject('ZZZZ', 3);
    await reject('ABCD', 2);
    await reject('ABCE', 2);
    for (let i = 0; i < 57; i++) {
      await reject(`AAA${String.fromCharCode(65 + (i % 26))}${'B'.repeat(Math.floor(i / 26))}`, 1);
    }
    const body = (await (await stock()).json()) as Json;
    const top = body.top_rejected_guesses as Json[];
    expect(top).toHaveLength(50);
    expect(top.slice(0, 3)).toEqual([
      { word: 'ZZZZ', distinct_players: 3 },
      { word: 'ABCD', distinct_players: 2 },
      { word: 'ABCE', distinct_players: 2 },
    ]);
    const rest = top.slice(3);
    expect(rest.every((r) => r.distinct_players === 1)).toBe(true);
    expect(rest.map((r) => r.word)).toEqual([...rest.map((r) => r.word)].sort());
  });

  it('TS-36 stock vacío', async () => {
    const res = await stock();
    expect(res.status).toBe(200);
    const body = (await res.json()) as Json;
    expect(body.last_sync).toBeNull();
    expect(body.top_rejected_guesses).toEqual([]);
    expect(body.banks.map((b: Json) => [b.bank, b.consumers.map((c: Json) => c.game_id)])).toEqual([
      ['terms', ['devdle', 'grep-grid']],
      ['timeline_facts', ['timeline']],
    ]);
    for (const b of body.banks) {
      expect(b).toMatchObject({
        approved_available: 0,
        approved_total: 0,
        rejected_total: 0,
        days_of_stock: 0,
        cycle_ok: false,
        rejections: [],
      });
      for (const c of b.consumers)
        expect(c).toMatchObject({ approved_available: 0, days_of_stock: 0, cycle_ok: false });
    }
  });
});
