import { describe, expect, it } from 'vitest';

import { parseInclusions } from '../scripts/import-banks/inclusions';
import { buildClassQuery, buildItemsQuery } from '../scripts/import-banks/wikidata';

describe('inclusions', () => {
  it('parses QID + category, ignoring blanks and comments', () => {
    expect(parseInclusions('# curados\n\nQ388 linux\r\n  q850   databases  # MySQL\n')).toEqual([
      { wikidataId: 'Q388', category: 'linux' },
      { wikidataId: 'Q850', category: 'databases' },
    ]);
  });

  it('rejects malformed lines and unknown categories', () => {
    expect(() => parseInclusions('LINUX linux')).toThrow(/línea 1/);
    expect(() => parseInclusions('Q388')).toThrow(/línea 1/);
    expect(() => parseInclusions('# ok\nQ388 kernels')).toThrow(/línea 2.*kernels/);
  });

  it('rejects the same QID twice', () => {
    expect(() => parseInclusions('Q388 linux\nQ388 git')).toThrow(/Q388/);
  });

  it('builds a query by item ids', () => {
    const query = buildItemsQuery(['Q388', 'Q850']);
    expect(query).toContain('VALUES ?item { wd:Q388 wd:Q850 }');
    expect(query).toContain('wikibase:sitelinks');
    expect(query).not.toContain('wdt:P31');
  });

  it('falls back to the mul label when en/es are missing', () => {
    for (const query of [buildItemsQuery(['Q850']), buildClassQuery('Q9143')]) {
      expect(query).toContain('FILTER(LANG(?label_mul) = "mul")');
      expect(query).toContain('BIND(COALESCE(?label_en_only, ?label_mul) AS ?label_en)');
      expect(query).toContain('BIND(COALESCE(?label_es_only, ?label_mul) AS ?label_es)');
    }
  });
});
