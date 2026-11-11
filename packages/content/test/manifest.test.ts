import { describe, expect, it } from 'vitest';

import {
  DEFAULT_TIMELINE_PARAMETERS,
  InsufficientTimelineFactsError,
  assertTimelineMinimums,
  buildManifest,
  buildTimelineParameters,
  nextDatasetVersion,
} from '../scripts/import-banks/manifest';
import { manifestSchema, type DatasetManifest } from '../src';

import { F_OK, MANIFEST_OK, T_OK } from './helpers';

describe('nextDatasetVersion', () => {
  it('adds a suffix when the same day already has a version (TS-32)', () => {
    const now = new Date('2026-11-06T22:00:00Z');
    expect(nextDatasetVersion(now, undefined)).toBe('2026.11.06');
    expect(nextDatasetVersion(now, '2026.11.05')).toBe('2026.11.06');
    expect(nextDatasetVersion(now, '2026.11.06')).toBe('2026.11.06-2');
    expect(nextDatasetVersion(now, '2026.11.06-2')).toBe('2026.11.06-3');
  });
});

const OPTIONS = {
  datasetVersion: '2026.11.06',
  generatedAt: '2026-11-06T22:00:00.000Z',
  minSitelinks: 20,
  minApproved: 1,
  classes: [{ wikidataClass: 'Q9143', category: 'programming_languages' }],
} as const;

describe('buildManifest', () => {
  it('counts the timeline facts (TS-16)', () => {
    const timeline = {
      min_sitelinks: 30,
      min_approved_per_category: 100,
      min_categories: 3,
      categories_v1: ['programming_languages'] as const,
      classes: [],
    };
    const manifest = buildManifest([T_OK], {
      ...OPTIONS,
      timelineFacts: [
        F_OK,
        {
          ...F_OK,
          wikidata_id: 'Q2005',
          label: 'Go',
          event_date: '2009-01-01',
          date_precision: 'year',
        },
        {
          ...F_OK,
          wikidata_id: 'Q95',
          label: 'Google',
          category: 'companies',
          status: 'rejected',
          rejection_reason: 'disputed_date',
        },
      ],
      timeline: { ...timeline, categories_v1: [...timeline.categories_v1] },
    });
    const counts = manifest.counts.timeline_facts;
    expect(counts.approved).toBe(2);
    expect(counts.rejected).toBe(1);
    expect(counts.by_category.programming_languages).toEqual({ approved: 2, rejected: 0 });
    expect(counts.by_category.companies).toEqual({ approved: 0, rejected: 1 });
    expect(counts.by_category.hardware).toEqual({ approved: 0, rejected: 0 });
    expect(counts.by_reason.disputed_date).toBe(1);
    expect(counts.by_reason.duplicate).toBe(0);
    expect(manifest.parameters.timeline.min_sitelinks).toBe(30);
    expect(manifest.counts.terms.approved).toBe(1);
    expect(() => manifestSchema.parse(manifest)).not.toThrow();
  });

  it('defaults to an empty fact bank (TS-17)', () => {
    const manifest = buildManifest([T_OK], OPTIONS);
    const counts = manifest.counts.timeline_facts;
    expect(counts.approved).toBe(0);
    expect(counts.rejected).toBe(0);
    expect(
      Object.values(counts.by_category).every((c) => c.approved === 0 && c.rejected === 0),
    ).toBe(true);
    expect(Object.values(counts.by_reason).every((n) => n === 0)).toBe(true);
    expect(manifest.parameters.timeline).toEqual({
      min_sitelinks: 10,
      min_approved_per_category: 100,
      min_categories: 3,
      categories_v1: [],
      classes: [],
    });
    expect(manifest.parameters.timeline).toEqual(DEFAULT_TIMELINE_PARAMETERS);
  });
});

describe('timeline minimums and parameters', () => {
  const counts = (by: Record<string, number>): DatasetManifest['counts']['timeline_facts'] => ({
    ...MANIFEST_OK.counts.timeline_facts,
    by_category: Object.fromEntries(
      Object.keys(MANIFEST_OK.counts.timeline_facts.by_category).map((category) => [
        category,
        { approved: by[category] ?? 0, rejected: 0 },
      ]),
    ) as DatasetManifest['counts']['timeline_facts']['by_category'],
  });
  const options = { minApprovedPerCategory: 100, minCategories: 3 };

  it('fails naming the category and its count (TS-28)', () => {
    const error = catchError(() =>
      assertTimelineMinimums(
        counts({ programming_languages: 120, frameworks: 80, video_games: 150 }),
        { ...options, categoriesV1: ['programming_languages', 'frameworks', 'video_games'] },
      ),
    );
    expect(error).toBeInstanceOf(InsufficientTimelineFactsError);
    expect(error).toMatchObject({
      shortfalls: [{ category: 'frameworks', approved: 80 }],
      minimum: 100,
    });
    for (const text of ['frameworks', '80', '100'])
      expect((error as Error).message).toContain(text);
  });

  it('fails with fewer than three v1 categories (TS-29)', () => {
    const error = catchError(() =>
      assertTimelineMinimums(counts({ programming_languages: 150, video_games: 150 }), {
        ...options,
        categoriesV1: ['programming_languages', 'video_games'],
      }),
    );
    expect(error).toMatchObject({ categoriesV1Count: 2, minCategories: 3 });
    for (const text of ['2', '3', 'categorías v1'])
      expect((error as Error).message).toContain(text);
  });

  it('passes when every minimum is met (TS-30)', () => {
    expect(() =>
      assertTimelineMinimums(
        counts({ programming_languages: 100, frameworks: 101, video_games: 250 }),
        { ...options, categoriesV1: ['programming_languages', 'frameworks', 'video_games'] },
      ),
    ).not.toThrow();
  });

  it('builds the manifest parameters from the class mapping (TS-31)', () => {
    expect(
      buildTimelineParameters(
        [
          {
            wikidataClass: 'Q7889',
            category: 'video_games',
            dateProperty: 'P577',
            fallbackProperty: 'P571',
          },
          { wikidataClass: 'Q9143', category: 'programming_languages', dateProperty: 'P571' },
        ],
        { minSitelinks: 25, minApprovedPerCategory: 100, minCategories: 3 },
      ),
    ).toEqual({
      min_sitelinks: 25,
      min_approved_per_category: 100,
      min_categories: 3,
      categories_v1: ['programming_languages', 'video_games'],
      classes: [
        { wikidata_class: 'Q7889', category: 'video_games', date_property: 'P577' },
        { wikidata_class: 'Q9143', category: 'programming_languages', date_property: 'P571' },
      ],
    });
  });
});

function catchError(run: () => void): unknown {
  try {
    run();
  } catch (error) {
    return error;
  }
  return undefined;
}
