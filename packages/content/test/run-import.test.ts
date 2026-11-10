import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { loadDataset, serializeItems } from '../src';
import { createWikimediaClient } from '../scripts/import-banks/http';
import { highestMinSitelinks, parseExclusions } from '../scripts/import-banks/rules';
import {
  DEFAULT_MIN_SITELINKS,
  InsufficientApprovedError,
  MIN_APPROVED_TERMS,
  runImport,
  type RunImportOptions,
} from '../scripts/import-banks/run';

import { MANIFEST_OK, fixtureFetch, type FakeFetch } from './helpers';

const CLASSES = [
  { wikidataClass: 'Q9143', category: 'programming_languages' },
  { wikidataClass: 'Q3257930', category: 'git' },
] as const;

const FIXTURES = {
  Q9143: 'wikidata/programming_languages.json',
  Q3257930: 'wikidata/git.json',
  Q388: 'wikidata/inclusions.json',
};

const NOW = new Date('2026-11-06T22:00:00Z');

function setup(overrides: Partial<RunImportOptions> = {}): {
  dir: string;
  fetch: FakeFetch;
  options: RunImportOptions;
} {
  const dir = mkdtempSync(join(tmpdir(), 'nc-run-'));
  const fetch = fixtureFetch(FIXTURES);
  const client = createWikimediaClient({
    userAgent: 'ua',
    fetch,
    sleep: async () => {},
  });
  return {
    dir,
    fetch,
    options: {
      dataDir: dir,
      classes: CLASSES,
      minSitelinks: 20,
      minApproved: 3,
      now: NOW,
      client,
      ...overrides,
    },
  };
}

const read = (dir: string, file: string): string => readFileSync(join(dir, file), 'utf8');

describe('runImport', () => {
  it('writes a sorted, valid dataset from fixtures (TS-34)', async () => {
    const { dir, options } = setup();
    const { manifest, terms } = await runImport(options);

    expect(terms).toHaveLength(7);
    expect(read(dir, 'terms.json')).toBe(serializeItems(terms));
    const ids = (JSON.parse(read(dir, 'terms.json')) as { wikidata_id: string }[]).map((t) =>
      Number(t.wikidata_id.slice(1)),
    );
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
    expect(manifest).toMatchObject({
      dataset_version: '2026.11.06',
      generated_at: '2026-11-06T22:00:00.000Z',
      min_sitelinks: 20,
      counts: { terms: { approved: 4, rejected: 3 } },
      parameters: {
        min_approved_terms: 3,
        classes: [
          { wikidata_class: 'Q9143', category: 'programming_languages' },
          { wikidata_class: 'Q3257930', category: 'git' },
        ],
      },
    });
    expect(Object.keys(manifest.counts.terms.by_category)).toHaveLength(8);
    expect(Object.keys(manifest.counts.terms.by_reason)).toHaveLength(7);
    expect(read(dir, 'manifest.json')).toBe(JSON.stringify(manifest, null, 2) + '\n');
    expect(readdirSync(dir).sort()).toEqual(['manifest.json', 'terms.json']);
    expect(loadDataset(dir).terms).toHaveLength(7);
  });

  it('fails below the minimum without touching files (TS-35)', async () => {
    const { dir, options } = setup({ minApproved: 5 });
    writeFileSync(join(dir, 'terms.json'), 'previous terms');
    writeFileSync(join(dir, 'manifest.json'), JSON.stringify(MANIFEST_OK));
    const error = await runImport(options).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(InsufficientApprovedError);
    expect(error).toMatchObject({ approved: 4, minimum: 5 });
    expect((error as Error).message).toContain('programming_languages');
    expect(read(dir, 'terms.json')).toBe('previous terms');
    expect(read(dir, 'manifest.json')).toBe(JSON.stringify(MANIFEST_OK));
    expect(readdirSync(dir).filter((f) => f.endsWith('.tmp'))).toEqual([]);
  });

  it('uses 500 as the real minimum (TS-36)', () => {
    expect(MIN_APPROVED_TERMS).toBe(500);
  });

  it('is reproducible across runs (TS-37)', async () => {
    const first = setup();
    const firstRun = await runImport(first.options);
    const second = setup({ dataDir: first.dir });
    const secondRun = await runImport({ ...second.options, now: new Date('2026-11-06T23:00:00Z') });
    expect(secondRun.manifest.dataset_version).toBe('2026.11.06-2');
    expect(secondRun.manifest.generated_at).toBe('2026-11-06T23:00:00.000Z');
    const strip = (manifest: typeof firstRun.manifest) => ({
      ...manifest,
      dataset_version: undefined,
      generated_at: undefined,
    });
    expect(strip(secondRun.manifest)).toEqual(strip(firstRun.manifest));
    const third = setup();
    await runImport(third.options);
    expect(read(third.dir, 'terms.json')).toBe(read(first.dir, 'terms.json'));
  });

  it('requests summaries only for candidates that pass the cheap rules (TS-38)', async () => {
    const { fetch, options } = setup();
    await runImport(options);
    const summaries = fetch.urls.filter((u) => u.includes('/page/summary/'));
    expect(summaries).toHaveLength(8);
    expect(fetch.urls.filter((u) => u.includes('query.wikidata.org'))).toHaveLength(2);
    for (const headers of fetch.headers) expect(headers.get('User-Agent')).toBe('ua');
  });

  it('defaults min_sitelinks to the previous manifest or 10 (TS-39)', async () => {
    const withPrevious = setup({ minSitelinks: undefined });
    writeFileSync(
      join(withPrevious.dir, 'manifest.json'),
      JSON.stringify({ ...MANIFEST_OK, min_sitelinks: 33 }),
    );
    expect((await runImport(withPrevious.options)).manifest.min_sitelinks).toBe(33);

    const fresh = setup({ minSitelinks: undefined });
    expect((await runImport(fresh.options)).manifest.min_sitelinks).toBe(DEFAULT_MIN_SITELINKS);
    expect(DEFAULT_MIN_SITELINKS).toBe(10);
  });

  it('suggests the highest min_sitelinks that keeps the minimum (TS-40)', async () => {
    const { options } = setup();
    const result = await runImport(options);
    expect(result.suggestedMinSitelinks).toBe(
      highestMinSitelinks(result.candidates, {
        exclusions: parseExclusions(''),
        minApproved: 3,
      }),
    );
    expect(result.suggestedMinSitelinks).toBe(
      result.terms
        .filter((t) => t.status === 'approved')
        .map((t) => t.sitelinks)
        .sort((a, b) => b - a)[2],
    );
  });

  it('applies the exclusions file', async () => {
    const { dir, options } = setup();
    writeFileSync(join(dir, 'exclusions.txt'), '# test\nmercurial\n');
    const { terms } = await runImport(options);
    expect(terms.find((t) => t.term === 'MERCURIAL')?.rejection_reason).toBe('excluded');
  });

  it('adds the items of the inclusions file with their category', async () => {
    const { dir, fetch, options } = setup();
    writeFileSync(
      join(dir, 'inclusions.txt'),
      '# curados\nQ388 linux\nQ476543 software_engineering\n',
    );
    const { terms } = await runImport(options);
    expect(terms.find((t) => t.wikidata_id === 'Q388')).toMatchObject({
      term: 'LINUX',
      category: 'linux',
      definition: { es: 'familia de sistemas operativos tipo Unix' },
      summary: { en: expect.stringContaining('Linux kernel') },
      status: 'approved',
    });
    // La categoría de la inclusión gana sobre la de la clase que también lo trae.
    expect(terms.find((t) => t.wikidata_id === 'Q476543')?.category).toBe('software_engineering');
    expect(terms.filter((t) => t.wikidata_id === 'Q476543')).toHaveLength(1);
    expect(fetch.urls.filter((u) => u.includes('query.wikidata.org'))).toHaveLength(3);
  });

  it('warns when an included item ends up rejected', async () => {
    const logs: string[] = [];
    const { dir, options } = setup({ minSitelinks: 500, minApproved: 0, log: (m) => logs.push(m) });
    writeFileSync(join(dir, 'inclusions.txt'), 'Q388 linux\n');
    await runImport(options);
    expect(logs.some((m) => /Q388.*LINUX.*low_sitelinks/.test(m))).toBe(true);
  });
});
