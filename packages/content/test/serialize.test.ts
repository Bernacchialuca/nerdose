import { describe, expect, it } from 'vitest';

import { serializeItems, sortByWikidataId } from '../src';

import { T_OK } from './helpers';

describe('serialize', () => {
  it('orders numerically by wikidata_id and serializes with 2 spaces (TS-10)', () => {
    const items = ['Q10', 'Q9', 'Q251'].map((wikidata_id) => ({ ...T_OK, wikidata_id }));
    const sorted = sortByWikidataId(items);
    expect(sorted.map((i) => i.wikidata_id)).toEqual(['Q9', 'Q10', 'Q251']);
    expect(items[0]?.wikidata_id).toBe('Q10');
    expect(serializeItems(items)).toBe(JSON.stringify(sorted, null, 2) + '\n');
  });
});
