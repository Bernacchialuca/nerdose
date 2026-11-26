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

const get = async (q: string, headers?: Record<string, string>) => {
  const { app } = await buildDbApp(dbs);
  return app.request(`/api/admin/content/items?${q}`, { headers });
};
const authed = async (q: string) => get(q, await adminAuth());
const body = async (q: string) => {
  const res = await authed(q);
  expect(res.status).toBe(200);
  return (await res.json()) as Json;
};
const labels = (b: Json) => (b.items as Json[]).map((i) => i.label);

const UNAUTHORIZED = { error: { code: 'unauthorized', message: 'No autorizado.' } };
const INVALID = { error: { code: 'validation_error', message: 'Datos inválidos.' } };

const fact = (n: number, values: Record<string, unknown> = {}) =>
  dbs.insertTimelineFact({
    id: `00000000-0000-4000-8000-0000000002${String(n).padStart(2, '0')}`,
    ...values,
  });

describe('GET /api/admin/content/items', () => {
  it('sin JWT responde 401, aun con query inválida', async () => {
    for (const q of ['bank=terms', 'bank=nope']) {
      const res = await get(q);
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual(UNAUTHORIZED);
    }
  });

  it('terms: forma completa del item, orden por term y last_used de devdle y grep-grid', async () => {
    const git = await dbs.insertTerm({
      term: 'MERGE',
      category: 'git',
      wikidataId: 'Q186055',
      sitelinks: 120,
      definition: { es: 'sistema de control de versiones', en: 'version control system' },
      lastUsedDevdle: '2026-11-20',
    });
    await dbs.insertTerm({
      term: 'CACHE',
      category: 'software_engineering',
      status: 'rejected',
      rejectionReason: 'Definición incorrecta',
      lastUsedGrep: '2026-10-01',
    });
    const b = await body('bank=terms');
    expect(b).toMatchObject({ bank: 'terms', page: 1, page_size: 25, total: 2, total_pages: 1 });
    expect(labels(b)).toEqual(['CACHE', 'MERGE']);
    expect(b.items[1]).toEqual({
      id: git.id,
      label: 'MERGE',
      category: 'git',
      status: 'approved',
      rejection_reason: null,
      sitelinks: 120,
      wikidata_id: 'Q186055',
      description: 'sistema de control de versiones',
      event_date: null,
      last_used: { devdle: '2026-11-20', 'grep-grid': null },
      excluded_from: [],
    });
    expect(b.items[0]).toMatchObject({
      status: 'rejected',
      rejection_reason: 'Definición incorrecta',
      last_used: { devdle: null, 'grep-grid': '2026-10-01' },
    });
  });

  it('timeline_facts: note.es, event_date, last_used de timeline y orden por label e id', async () => {
    await fact(2, {
      label: 'Lanzamiento de Java',
      eventDate: '1995-05-23',
      lastUsed: '2026-09-02',
    });
    await fact(1, { label: 'Lanzamiento de Java', eventDate: '1996-01-23' });
    await fact(3, {
      label: 'Fundación de Apple',
      category: 'companies',
      note: { es: 'en un garaje', en: 'in a garage' },
      eventDate: '1976-04-01',
    });
    const b = await body('bank=timeline_facts');
    expect(b).toMatchObject({ bank: 'timeline_facts', total: 3, total_pages: 1 });
    expect((b.items as Json[]).map((i) => i.id)).toEqual([
      '00000000-0000-4000-8000-000000000203',
      '00000000-0000-4000-8000-000000000201',
      '00000000-0000-4000-8000-000000000202',
    ]);
    expect(b.items[0]).toMatchObject({
      label: 'Fundación de Apple',
      category: 'companies',
      description: 'en un garaje',
      event_date: '1976-04-01',
      last_used: { timeline: null },
      excluded_from: [],
    });
    expect(b.items[2]).toMatchObject({
      event_date: '1995-05-23',
      last_used: { timeline: '2026-09-02' },
    });
    expect(Object.keys(b.items[0].last_used)).toEqual(['timeline']);
  });

  it('filtra por bank: cada banco lista solo sus ítems', async () => {
    await dbs.insertTerm({ term: 'REDIS' });
    await fact(1, { label: 'Nace Redis' });
    expect(labels(await body('bank=terms'))).toEqual(['REDIS']);
    expect(labels(await body('bank=timeline_facts'))).toEqual(['Nace Redis']);
  });

  it('q: contains sin distinguir mayúsculas, recortado; vacío no filtra', async () => {
    await dbs.insertTerm({ term: 'REDIS' });
    await dbs.insertTerm({ term: 'REDUX' });
    await dbs.insertTerm({ term: 'KAFKA' });
    expect(labels(await body('bank=terms&q=red'))).toEqual(['REDIS', 'REDUX']);
    expect(labels(await body('bank=terms&q=%20%20dux%20'))).toEqual(['REDUX']);
    expect((await body('bank=terms&q=')).total).toBe(3);
    expect((await body('bank=terms&q=zzz')).total).toBe(0);
  });

  it('q escapa los comodines de ILIKE (%, _ y \\)', async () => {
    await fact(1, { label: '100% puro' });
    await fact(2, { label: '100 puro' });
    await fact(3, { label: 'a_b' });
    await fact(4, { label: 'axb' });
    await fact(5, { label: 'c\\d' });
    await fact(6, { label: 'cd' });
    expect(labels(await body('bank=timeline_facts&q=0%25'))).toEqual(['100% puro']);
    expect(labels(await body('bank=timeline_facts&q=a_b'))).toEqual(['a_b']);
    expect(labels(await body('bank=timeline_facts&q=c%5Cd'))).toEqual(['c\\d']);
  });

  it('q de más de 50 caracteres responde 422', async () => {
    const res = await authed(`bank=terms&q=${'A'.repeat(51)}`);
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual(INVALID);
    expect((await authed(`bank=terms&q=${'A'.repeat(50)}`)).status).toBe(200);
  });

  it('status y category filtran, combinados con q', async () => {
    await dbs.insertTerm({ term: 'REBASE', category: 'git' });
    await dbs.insertTerm({ term: 'REDIS', category: 'databases' });
    await dbs.insertTerm({
      term: 'REVERT',
      category: 'git',
      status: 'rejected',
      rejectionReason: 'r',
    });
    expect(labels(await body('bank=terms&status=rejected'))).toEqual(['REVERT']);
    expect(labels(await body('bank=terms&status=approved'))).toEqual(['REBASE', 'REDIS']);
    expect(labels(await body('bank=terms&category=git'))).toEqual(['REBASE', 'REVERT']);
    expect(labels(await body('bank=terms&category=git&status=approved&q=re'))).toEqual(['REBASE']);
    await fact(1, { category: 'companies', label: 'Apple' });
    await fact(2, { category: 'hardware', label: 'iPhone' });
    expect(labels(await body('bank=timeline_facts&category=hardware'))).toEqual(['iPhone']);
  });

  it('una categoría de otro banco o inexistente responde 422', async () => {
    for (const q of [
      'bank=terms&category=companies',
      'bank=timeline_facts&category=git',
      'bank=terms&category=nope',
      'bank=terms&category=',
    ]) {
      const res = await authed(q);
      expect(res.status, q).toBe(422);
      expect(await res.json()).toEqual(INVALID);
    }
    expect((await authed('bank=terms&category=databases')).status).toBe(200);
    expect((await authed('bank=timeline_facts&category=databases')).status).toBe(200);
  });

  it('bank, status, page y page_size inválidos responden 422', async () => {
    for (const q of [
      '',
      'bank=templates',
      'bank=terms&status=pending',
      'bank=terms&page=0',
      'bank=terms&page=1.5',
      'bank=terms&page=abc',
      'bank=terms&page_size=9',
      'bank=terms&page_size=101',
    ]) {
      const res = await authed(q);
      expect(res.status, q).toBe(422);
      expect(await res.json()).toEqual(INVALID);
    }
  });

  it('paginación: LIMIT/OFFSET, totales y una página más allá del final', async () => {
    for (let i = 0; i < 23; i++) {
      await dbs.insertTerm({
        term: `TERM${String.fromCharCode(65 + Math.floor(i / 26))}${String.fromCharCode(65 + (i % 26))}`,
      });
    }
    const p1 = await body('bank=terms&page_size=10');
    expect(p1).toMatchObject({ page: 1, page_size: 10, total: 23, total_pages: 3 });
    expect(labels(p1)).toHaveLength(10);
    expect(labels(p1)[0]).toBe('TERMAA');
    const p3 = await body('bank=terms&page_size=10&page=3');
    expect(labels(p3)).toEqual(['TERMAU', 'TERMAV', 'TERMAW']);
    const beyond = await body('bank=terms&page_size=10&page=9');
    expect(beyond).toEqual({
      bank: 'terms',
      page: 9,
      page_size: 10,
      total: 23,
      total_pages: 3,
      items: [],
    });
    const exact = await body('bank=terms&page_size=23');
    expect(exact).toMatchObject({ total: 23, total_pages: 1 });
    expect(labels(exact)).toHaveLength(23);
  });

  it('banco vacío: total 0 y total_pages 1', async () => {
    expect(await body('bank=timeline_facts')).toEqual({
      bank: 'timeline_facts',
      page: 1,
      page_size: 25,
      total: 0,
      total_pages: 1,
      items: [],
    });
  });

  it('excluded_from marca los términos que Devdle nunca elige', async () => {
    await dbs.insertTerm({ term: 'SLITAZ', category: 'linux' });
    await dbs.insertTerm({ term: 'UBUNTU', category: 'linux' });
    const b = await body('bank=terms');
    expect((b.items as Json[]).map((i) => [i.label, i.excluded_from])).toEqual([
      ['SLITAZ', ['devdle']],
      ['UBUNTU', []],
    ]);
  });
});
