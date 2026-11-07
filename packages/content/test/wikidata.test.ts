import { describe, expect, it } from 'vitest';

import { buildClassQuery, parseClassResults } from '../scripts/import-banks/wikidata';

import { readFixture } from './helpers';

describe('wikidata', () => {
  it('builds a query for the class', () => {
    const query = buildClassQuery('Q9143');
    expect(query).toContain('wd:Q9143');
    expect(query).toContain('wikibase:sitelinks');
  });

  it('parses SPARQL results into candidates (TS-29)', () => {
    const candidates = parseClassResults(
      readFixture('wikidata/programming_languages.json'),
      'programming_languages',
    );
    expect(candidates).toHaveLength(5);
    const python = candidates.find((c) => c.wikidata_id === 'Q28865');
    expect(python).toMatchObject({
      wikidata_id: 'Q28865',
      category: 'programming_languages',
      label_en: 'Python',
      sitelinks: expect.any(Number),
    });
    expect(python).toHaveProperty('label_es');
    expect(python?.description_en).toBeTruthy();
    expect(python?.description_es).toBeTruthy();
    expect(python?.article_en).toBeTruthy();
    expect(python?.article_es).toBeTruthy();
  });

  it('keeps missing optional fields as null and drops repeated rows', () => {
    const row = {
      item: { type: 'uri', value: 'http://www.wikidata.org/entity/Q1' },
      label_en: { type: 'literal', value: 'Thing' },
      sitelinks: { type: 'literal', value: '7' },
    };
    const [only, ...rest] = parseClassResults({ results: { bindings: [row, row] } }, 'git');
    expect(rest).toEqual([]);
    expect(only).toMatchObject({
      article_es: null,
      description_en: null,
      label_es: null,
      sitelinks: 7,
    });
  });
});
