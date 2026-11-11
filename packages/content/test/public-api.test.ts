import * as core from '@nerdose/core';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { readFileSync } from 'node:fs';

import * as content from '../src';

describe('public API', () => {
  it('re-exports the timeline enums from core (TS-1)', () => {
    expect(content.TIMELINE_CATEGORIES).toBe(core.TIMELINE_CATEGORIES);
    expect(content.TIMELINE_CATEGORIES).toEqual([
      'programming_languages',
      'frameworks',
      'companies',
      'operating_systems',
      'hardware',
      'video_games',
      'databases',
      'software_tools',
    ]);
    expect(content.DATE_PRECISIONS).toBe(core.DATE_PRECISIONS);
    expect(content.DATE_PRECISIONS).toEqual(['year', 'month', 'day']);
    expectTypeOf<content.TimelineCategory>().toEqualTypeOf<core.TimelineCategory>();
    expectTypeOf<content.DatePrecision>().toEqualTypeOf<core.DatePrecision>();
    const schema = readFileSync(new URL('../src/schema.ts', import.meta.url), 'utf8');
    expect(schema).not.toMatch(/export const TIMELINE_CATEGORIES/);
    expect(schema).not.toMatch(/export const DATE_PRECISIONS/);
  });

  it('exposes the fact rejection reasons (TS-2)', () => {
    expect(content.TIMELINE_REJECTION_REASONS).toEqual([
      'disputed_date',
      'imprecise_date',
      'missing_article',
      'low_sitelinks',
      'missing_note',
      'note_year_mismatch',
      'excluded',
      'duplicate',
    ]);
    expect(content.TIMELINE_REJECTION_REASONS).toHaveLength(8);
    expect(content.REJECTION_REASONS).toHaveLength(7);
  });
});
