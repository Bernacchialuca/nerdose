import { describe, expect, it } from 'vitest';

import { PAYLOAD } from '../definition/test-fixtures';

import { D, payloadWith } from './test-fixtures';
import { canonicalJson, keysUsedNear, varietyKey, VARIETY_DAYS } from './variety';

describe('varietyKey', () => {
  it('joins template, canonical params and the mutation', () => {
    expect(varietyKey(PAYLOAD)).toBe(
      'extreme_index:{"extreme":"max","tie":"first"}:relax_comparison@n16:>=',
    );
    expect(canonicalJson({ tie: 'first', extreme: 'max' })).toBe('{"extreme":"max","tie":"first"}');
    expect(VARIETY_DAYS).toBe(60);
  });
});

describe('keysUsedNear', () => {
  it('uses the window [D - 59, D + 59] without the row of D', () => {
    const row = (date: string, to: string) => ({
      date,
      payload: payloadWith(date, { mutation: { ...PAYLOAD.mutation, to } }),
    });
    const rows = [
      row('2027-01-15', 'a'),
      row('2027-01-14', 'b'),
      row('2027-05-13', 'c'),
      row('2027-05-14', 'd'),
      row(D, 'e'),
    ];
    const keys = keysUsedNear(D, rows);
    expect([...keys].map((k) => k.split(':').pop())).toEqual(['a', 'c']);
  });
});
