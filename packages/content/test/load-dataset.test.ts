import { describe, expect, it } from 'vitest';

import { DatasetError, loadDataset, manifestSchema } from '../src';

import { F_OK, MANIFEST_OK, T_OK, makeDir } from './helpers';

function failure(dir: string): DatasetError {
  try {
    loadDataset(dir);
  } catch (error) {
    expect(error).toBeInstanceOf(DatasetError);
    return error as DatasetError;
  }
  throw new Error('loadDataset no falló');
}

const BASE = { 'terms.json': [T_OK], 'timeline_facts.json': [] as unknown[] };

describe('loadDataset', () => {
  it('loads a valid dataset with its three files (TS-12)', () => {
    const dir = new URL('./fixtures/datasets/valid/', import.meta.url);
    const ds = loadDataset(dir);
    expect(ds.terms).toEqual([T_OK]);
    expect(ds.timelineFacts).toEqual([F_OK]);
    expect(ds.manifest.dataset_version).toBe('2026.11.06');
  });

  it('rejects an extra field in a term (TS-4)', () => {
    const dir = makeDir({
      ...BASE,
      'terms.json': [{ ...T_OK, example: { es: 'x', en: 'x' } }],
      'manifest.json': MANIFEST_OK,
    });
    const error = failure(dir);
    expect(error.file).toBe('terms.json');
    expect(error.message).toContain('terms.json');
  });

  it('rejects a missing field and an invalid category (TS-5)', () => {
    for (const bad of [
      { ...T_OK, summary: { es: '…' } },
      { ...T_OK, category: 'frameworks' },
    ]) {
      const dir = makeDir({ ...BASE, 'terms.json': [bad], 'manifest.json': MANIFEST_OK });
      expect(failure(dir).file).toBe('terms.json');
    }
  });

  it('applies per-status rules (TS-6)', () => {
    const invalid = [
      { ...T_OK, rejection_reason: 'duplicate' },
      { ...T_OK, term: 'GO' },
      { ...T_OK, definition: { es: ' ', en: 'x' } },
      { ...T_OK, status: 'rejected', rejection_reason: null },
    ];
    for (const bad of invalid) {
      const dir = makeDir({ ...BASE, 'terms.json': [bad], 'manifest.json': MANIFEST_OK });
      expect(failure(dir).file).toBe('terms.json');
    }
    const rejected = {
      ...T_OK,
      term: 'C++',
      status: 'rejected',
      rejection_reason: 'invalid_chars',
      summary: { es: '', en: '' },
    };
    const dir = makeDir({ ...BASE, 'terms.json': [rejected], 'manifest.json': MANIFEST_OK });
    expect(loadDataset(dir).terms).toHaveLength(1);
  });

  it('rejects duplicate ids and duplicate approved terms (TS-7)', () => {
    for (const items of [
      [T_OK, T_OK],
      [T_OK, { ...T_OK, wikidata_id: 'Q1' }],
    ]) {
      const dir = makeDir({ ...BASE, 'terms.json': items, 'manifest.json': MANIFEST_OK });
      expect(failure(dir).file).toBe('terms.json');
    }
  });

  it('rejects invalid or missing manifest and malformed terms (TS-8)', () => {
    const withoutMin: Record<string, unknown> = { ...MANIFEST_OK };
    delete withoutMin.min_sitelinks;
    const cases: Record<string, unknown>[] = [
      { ...BASE, 'manifest.json': { ...MANIFEST_OK, dataset_version: '2026-11-06' } },
      { ...BASE, 'manifest.json': withoutMin },
      { ...BASE },
    ];
    for (const files of cases) {
      expect(failure(makeDir(files)).file).toBe('manifest.json');
    }
    const malformed = makeDir({ ...BASE, 'terms.json': '[{', 'manifest.json': MANIFEST_OK });
    expect(failure(malformed).file).toBe('terms.json');
  });

  it('rejects a missing timeline_facts.json (TS-13)', () => {
    const error = failure(makeDir({ 'terms.json': [T_OK], 'manifest.json': MANIFEST_OK }));
    expect(error.file).toBe('timeline_facts.json');
    expect(error.message).toContain('timeline_facts.json');
  });

  it('rejects an invalid or malformed timeline_facts.json (TS-14)', () => {
    for (const bad of [[{ ...F_OK, event_date: '1995-5-23' }], '[{', [F_OK, F_OK]]) {
      const dir = makeDir({ ...BASE, 'timeline_facts.json': bad, 'manifest.json': MANIFEST_OK });
      expect(failure(dir).file).toBe('timeline_facts.json');
    }
  });

  it('reads terms.json first (TS-15)', () => {
    const dir = makeDir({
      'terms.json': [{ ...T_OK, term: 'abc' }],
      'manifest.json': MANIFEST_OK,
    });
    expect(failure(dir).file).toBe('terms.json');
  });

  it('rejects a manifest without or with invalid timeline parts (TS-11)', () => {
    type Mutable = {
      counts: { timeline_facts?: { by_reason: Record<string, number> } };
      parameters: { timeline?: Record<string, unknown> };
    };
    const variant = (change: (m: Mutable) => void): unknown => {
      const m = structuredClone(MANIFEST_OK) as unknown as Mutable;
      change(m);
      return m;
    };
    const timeline = (m: Mutable): Record<string, unknown> => m.parameters.timeline as never;
    const manifests = [
      variant((m) => delete m.counts.timeline_facts),
      variant((m) => delete m.parameters.timeline),
      variant((m) => (timeline(m).categories_v1 = ['internet'])),
      variant((m) => (timeline(m).categories_v1 = ['hardware', 'hardware'])),
      variant((m) => delete m.counts.timeline_facts?.by_reason.note_year_mismatch),
      variant((m) => (timeline(m).extra = 1)),
      variant(
        (m) =>
          (timeline(m).classes = [
            { wikidata_class: 'Q9143', category: 'programming_languages', date_property: '571' },
          ]),
      ),
    ];
    for (const manifest of manifests) {
      expect(failure(makeDir({ ...BASE, 'manifest.json': manifest })).file).toBe('manifest.json');
    }
  });

  it('accepts the extended manifest (TS-10)', () => {
    const parsed = manifestSchema.parse(MANIFEST_OK);
    expect(Object.keys(parsed.counts)).toEqual(['terms', 'timeline_facts']);
    expect(Object.keys(parsed.counts.timeline_facts.by_category)).toHaveLength(8);
    expect(Object.keys(parsed.counts.timeline_facts.by_reason)).toHaveLength(8);
  });
});
