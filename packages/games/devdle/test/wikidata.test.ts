import { describe, expect, it } from 'vitest';

import { buildLabelsQuery, parseLabels } from '../scripts/build-wordlist/wikidata';

const item = { type: 'uri', value: 'http://www.wikidata.org/entity/Q2005' };

describe('wikidata helpers', () => {
  it('parses SPARQL bindings (TS-53)', () => {
    expect(
      parseLabels({
        results: {
          bindings: [
            { item, label: { type: 'literal', value: 'JavaScript' } },
            { item, label: { type: 'literal', value: 'Git' } },
            { item },
          ],
        },
      }),
    ).toEqual(['JavaScript', 'Git']);
    expect(parseLabels({})).toEqual([]);
  });

  it('builds the per-class query (TS-54)', () => {
    const q = buildLabelsQuery('Q9143');
    for (const part of [
      'wd:Q9143',
      'wikibase:sitelinks',
      'FILTER(?sitelinks >= 5)',
      'FILTER(LANG(?label) = "en")',
      'LIMIT 5000',
    ]) {
      expect(q).toContain(part);
    }
  });
});
