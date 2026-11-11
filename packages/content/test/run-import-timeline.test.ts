import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { DatasetError, loadDataset, serializeItems } from '../src';
import { createWikimediaClient } from '../scripts/import-banks/http';
import { InsufficientTimelineFactsError } from '../scripts/import-banks/manifest';
import { highestMinSitelinksTimeline, parseExclusions } from '../scripts/import-banks/rules';
import {
  InsufficientApprovedError,
  runImport,
  type RunImportOptions,
} from '../scripts/import-banks/run';
import type { TimelineClass } from '../scripts/import-banks/wikidata';

import { MANIFEST_OK, T_OK, fixtureFetch, type FakeFetch } from './helpers';

const TIMELINE_TEST_CLASSES: readonly TimelineClass[] = [
  { wikidataClass: 'Q9143', category: 'programming_languages', dateProperty: 'P571' },
  { wikidataClass: 'Q271680', category: 'frameworks', dateProperty: 'P571' },
];
const TERM_CLASSES = [
  { wikidataClass: 'Q9143', category: 'programming_languages' },
  { wikidataClass: 'Q3257930', category: 'git' },
] as const;

const TERM_FIXTURES = {
  Q9143: 'wikidata/programming_languages.json',
  Q3257930: 'wikidata/git.json',
  Q388: 'wikidata/inclusions.json',
};
const TIMELINE_FIXTURES = {
  Q9143: 'wikidata/timeline_programming_languages.json',
  Q271680: 'wikidata/timeline_frameworks.json',
};

const NOW = new Date('2026-11-06T22:00:00Z');

function setup(
  files: Record<string, string> | 'empty',
  overrides: Partial<RunImportOptions> = {},
): { dir: string; fetch: FakeFetch; options: RunImportOptions } {
  const dir = mkdtempSync(join(tmpdir(), 'nc-timeline-'));
  for (const [name, content] of Object.entries(files === 'empty' ? {} : files)) {
    writeFileSync(join(dir, name), content);
  }
  const fetch = fixtureFetch(TERM_FIXTURES, TIMELINE_FIXTURES);
  const client = createWikimediaClient({ userAgent: 'ua', fetch, sleep: async () => {} });
  return {
    dir,
    fetch,
    options: {
      dataDir: dir,
      bank: 'timeline',
      classes: TERM_CLASSES,
      timelineClasses: TIMELINE_TEST_CLASSES,
      minSitelinks: 20,
      minSitelinksTimeline: 20,
      minApproved: 3,
      minApprovedPerCategory: 1,
      minCategories: 1,
      now: NOW,
      client,
      ...overrides,
    },
  };
}

const withTerms = (): Record<string, string> => ({
  'terms.json': serializeItems([T_OK]),
  'manifest.json': JSON.stringify(MANIFEST_OK),
  'timeline_facts.json': '[]\n',
});

const read = (dir: string, file: string): string => readFileSync(join(dir, file), 'utf8');
const summaries = (fetch: FakeFetch): string[] =>
  fetch.urls.filter((url) => url.includes('/page/summary/'));

describe('runImport --bank=timeline', () => {
  it('imports facts and leaves terms untouched (TS-32)', async () => {
    const { dir, fetch, options } = setup(withTerms());
    const { manifest, timelineFacts } = await runImport(options);

    expect(read(dir, 'terms.json')).toBe(serializeItems([T_OK]));
    expect(read(dir, 'timeline_facts.json')).toBe(serializeItems(timelineFacts));
    expect(timelineFacts.find((f) => f.wikidata_id === 'Q24589705')).toMatchObject({
      label: 'Vue.js',
      category: 'frameworks',
      event_date: '2014-02-01',
      date_precision: 'month',
      status: 'approved',
      rejection_reason: null,
    });
    // Un valor preferred gana sobre el normal.
    expect(timelineFacts.find((f) => f.wikidata_id === 'Q89114416')).toMatchObject({
      event_date: '2010-10-10',
      date_precision: 'day',
    });
    expect(timelineFacts.find((f) => f.wikidata_id === 'Q726218')).toMatchObject({
      status: 'rejected',
      rejection_reason: 'disputed_date',
    });
    expect(timelineFacts.find((f) => f.wikidata_id === 'Q900957')).toMatchObject({
      rejection_reason: 'disputed_date',
    });
    expect(timelineFacts.find((f) => f.wikidata_id === 'Q620464')).toMatchObject({
      rejection_reason: 'imprecise_date',
    });
    expect(manifest.counts.terms).toEqual(MANIFEST_OK.counts.terms);
    expect(manifest.min_sitelinks).toBe(MANIFEST_OK.min_sitelinks);
    expect(manifest.parameters).toMatchObject({
      min_sitelinks: MANIFEST_OK.parameters.min_sitelinks,
      min_approved_terms: MANIFEST_OK.parameters.min_approved_terms,
      classes: MANIFEST_OK.parameters.classes,
      timeline: { min_sitelinks: 20, categories_v1: ['programming_languages', 'frameworks'] },
    });
    expect(manifest.dataset_version).toBe('2026.11.06-2');
    expect(fetch.urls.some((url) => url.includes('wd:Q3257930 '))).toBe(false);
    for (const headers of fetch.headers) expect(headers.get('User-Agent')).toBe('ua');
    expect(() => loadDataset(dir)).not.toThrow();
  });

  it('fails below the minimum without writing anything (TS-33)', async () => {
    const files = withTerms();
    const { dir, options } = setup(files, { minApprovedPerCategory: 100 });
    const error = await runImport(options).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(InsufficientTimelineFactsError);
    const { shortfalls } = error as InsufficientTimelineFactsError;
    expect(shortfalls.map((s) => s.category)).toEqual(['programming_languages', 'frameworks']);
    expect(shortfalls.map((s) => s.approved)).toEqual([3, 2]);
    for (const [name, content] of Object.entries(files)) expect(read(dir, name)).toBe(content);
    expect(readdirSync(dir).filter((f) => f.endsWith('.tmp'))).toEqual([]);
  });

  it('rejects an invalid terms.json before any request (TS-34)', async () => {
    const { fetch, options } = setup({ ...withTerms(), 'terms.json': '[{' });
    const error = await runImport(options).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DatasetError);
    expect(error).toMatchObject({ file: 'terms.json' });
    expect(fetch.urls).toEqual([]);
  });

  it('requires a previous manifest (TS-35)', async () => {
    const { dir, fetch, options } = setup({ 'terms.json': serializeItems([T_OK]) });
    const error = await runImport(options).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DatasetError);
    expect(error).toMatchObject({ file: 'manifest.json' });
    expect(fetch.urls).toEqual([]);
    expect(readdirSync(dir)).toEqual(['terms.json']);
  });

  it('defaults and prioritizes min_sitelinks_timeline (TS-39)', async () => {
    const withThirty = {
      ...MANIFEST_OK,
      parameters: {
        ...MANIFEST_OK.parameters,
        timeline: { ...MANIFEST_OK.parameters.timeline, min_sitelinks: 30 },
      },
    };
    const previous = setup(
      { ...withTerms(), 'manifest.json': JSON.stringify(withThirty) },
      { minSitelinksTimeline: undefined },
    );
    const fromPrevious = await runImport(previous.options);
    expect(fromPrevious.manifest.parameters.timeline.min_sitelinks).toBe(30);

    const fresh = setup(withTerms(), { minSitelinksTimeline: undefined });
    const fromDefault = await runImport(fresh.options);
    expect(fromDefault.manifest.parameters.timeline.min_sitelinks).toBe(10);

    const explicit = setup(withTerms(), { minSitelinksTimeline: 7 });
    const fromFlag = await runImport(explicit.options);
    expect(fromFlag.manifest.parameters.timeline.min_sitelinks).toBe(7);
    for (const run of [fromPrevious, fromDefault, fromFlag]) {
      expect(run.manifest.min_sitelinks).toBe(MANIFEST_OK.min_sitelinks);
    }
  });

  it('returns the suggested min_sitelinks_timeline (TS-40)', async () => {
    const { options } = setup(withTerms());
    const result = await runImport(options);
    expect(result.suggestedMinSitelinksTimeline).toBe(
      highestMinSitelinksTimeline(result.factCandidates, {
        exclusions: parseExclusions(''),
        currentYear: 2026,
        minApprovedPerCategory: 1,
        categories: ['programming_languages', 'frameworks'],
      }),
    );
    expect(typeof result.suggestedMinSitelinksTimeline).toBe('number');

    const short = await runImport(setup(withTerms(), { minApprovedPerCategory: 3 }).options).catch(
      (e: unknown) => e,
    );
    expect(short).toBeInstanceOf(InsufficientTimelineFactsError);
    expect((short as InsufficientTimelineFactsError).suggestedMinSitelinksTimeline).toBeNull();
  });

  it('requests summaries only for candidates that pass the cheap rules (TS-41)', async () => {
    const { fetch, options } = setup(withTerms());
    await runImport(options);
    const urls = summaries(fetch);
    expect(urls.some((url) => url.includes('/es.wikipedia.org') && url.includes('Vue.js'))).toBe(
      true,
    );
    expect(urls.some((url) => url.includes('/en.wikipedia.org') && url.includes('Vue.js'))).toBe(
      true,
    );
    // Disputado (XUL) e impreciso (G-code): nunca se piden.
    expect(urls.some((url) => /XUL|XML_User|G-code/.test(url))).toBe(false);
  });

  it('is reproducible (TS-42)', async () => {
    const first = setup(withTerms());
    const second = setup(withTerms());
    await runImport(first.options);
    await runImport(second.options);
    expect(read(first.dir, 'timeline_facts.json')).toBe(read(second.dir, 'timeline_facts.json'));
  });
});

describe('runImport --bank=all', () => {
  it('validates both minimums before writing (TS-36)', async () => {
    const timeline = setup('empty', { bank: 'all', minApprovedPerCategory: 100 });
    expect(await runImport(timeline.options).catch((e: unknown) => e)).toBeInstanceOf(
      InsufficientTimelineFactsError,
    );
    expect(readdirSync(timeline.dir)).toEqual([]);

    const terms = setup('empty', { bank: 'all', minApproved: 10_000 });
    expect(await runImport(terms.options).catch((e: unknown) => e)).toBeInstanceOf(
      InsufficientApprovedError,
    );
    expect(readdirSync(terms.dir)).toEqual([]);
  });

  it('writes both banks (TS-37)', async () => {
    const { dir, options } = setup('empty', { bank: 'all' });
    const { manifest } = await runImport(options);
    expect(readdirSync(dir).sort()).toEqual(['manifest.json', 'terms.json', 'timeline_facts.json']);
    expect(manifest.counts.terms.approved).toBeGreaterThanOrEqual(3);
    expect(manifest.counts.timeline_facts.approved).toBeGreaterThanOrEqual(1);
    expect(() => loadDataset(dir)).not.toThrow();
  });
});

describe('runImport --bank=terms', () => {
  it('does not request any timeline class and keeps the facts (TS-38)', async () => {
    const { dir, fetch, options } = setup(withTerms(), { bank: 'terms' });
    await runImport(options);
    expect(fetch.urls.filter((url) => url.includes('query.wikidata.org'))).toHaveLength(2);
    expect(fetch.urls.some((url) => url.includes('wikibase%3AtimeValue'))).toBe(false);
    expect(read(dir, 'timeline_facts.json')).toBe('[]\n');
  });
});
