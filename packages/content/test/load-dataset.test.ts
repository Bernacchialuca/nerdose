import { describe, expect, it } from 'vitest';

import { DatasetError, loadDataset } from '../src';

import { MANIFEST_OK, T_OK, makeDir } from './helpers';

function failure(dir: string): DatasetError {
  try {
    loadDataset(dir);
  } catch (error) {
    expect(error).toBeInstanceOf(DatasetError);
    return error as DatasetError;
  }
  throw new Error('loadDataset no falló');
}

const FACT = {
  wikidata_id: 'Q251',
  label: 'Java',
  category: 'programming_languages',
  event_date: '1995-05-23',
  date_precision: 'day',
  note: { es: '…', en: '…' },
  sitelinks: 150,
  status: 'approved',
  rejection_reason: null,
};

describe('loadDataset', () => {
  it('loads a valid dataset without timeline_facts.json (TS-2)', () => {
    const dir = new URL('./fixtures/datasets/valid/', import.meta.url);
    const ds = loadDataset(dir);
    expect(ds.terms).toEqual([T_OK]);
    expect(ds.timelineFacts).toEqual([]);
    expect(ds.manifest.dataset_version).toBe('2026.11.06');
  });

  it('rejects an extra field in a term (TS-4)', () => {
    const dir = makeDir({
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
      const dir = makeDir({ 'terms.json': [bad], 'manifest.json': MANIFEST_OK });
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
      const dir = makeDir({ 'terms.json': [bad], 'manifest.json': MANIFEST_OK });
      expect(failure(dir).file).toBe('terms.json');
    }
    const rejected = {
      ...T_OK,
      term: 'C++',
      status: 'rejected',
      rejection_reason: 'invalid_chars',
      summary: { es: '', en: '' },
    };
    const dir = makeDir({ 'terms.json': [rejected], 'manifest.json': MANIFEST_OK });
    expect(loadDataset(dir).terms).toHaveLength(1);
  });

  it('rejects duplicate ids and duplicate approved terms (TS-7)', () => {
    for (const items of [
      [T_OK, T_OK],
      [T_OK, { ...T_OK, wikidata_id: 'Q1' }],
    ]) {
      const dir = makeDir({ 'terms.json': items, 'manifest.json': MANIFEST_OK });
      expect(failure(dir).file).toBe('terms.json');
    }
  });

  it('rejects invalid or missing manifest and malformed terms (TS-8)', () => {
    const withoutMin: Record<string, unknown> = { ...MANIFEST_OK };
    delete withoutMin.min_sitelinks;
    const cases: Record<string, unknown>[] = [
      { 'terms.json': [T_OK], 'manifest.json': { ...MANIFEST_OK, dataset_version: '2026-11-06' } },
      { 'terms.json': [T_OK], 'manifest.json': withoutMin },
      { 'terms.json': [T_OK] },
    ];
    for (const files of cases) {
      expect(failure(makeDir(files)).file).toBe('manifest.json');
    }
    const malformed = makeDir({ 'terms.json': '[{', 'manifest.json': MANIFEST_OK });
    expect(failure(malformed).file).toBe('terms.json');
  });

  it('reads timeline_facts.json when present (TS-9)', () => {
    const ok = makeDir({
      'terms.json': [T_OK],
      'manifest.json': MANIFEST_OK,
      'timeline_facts.json': [FACT],
    });
    expect(loadDataset(ok).timelineFacts).toHaveLength(1);
    const bad = makeDir({
      'terms.json': [T_OK],
      'manifest.json': MANIFEST_OK,
      'timeline_facts.json': [{ ...FACT, event_date: '1995-5-23' }],
    });
    expect(failure(bad).file).toBe('timeline_facts.json');
  });
});
