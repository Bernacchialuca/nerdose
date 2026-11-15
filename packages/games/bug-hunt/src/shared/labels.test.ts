import { BUG_TYPES, CODE_LANGUAGES } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { BUG_TYPE_LABEL, LANGUAGE_LABEL } from './labels';

describe('labels', () => {
  it('labels the 3 languages (TS-1)', () => {
    expect(CODE_LANGUAGES.map((l) => LANGUAGE_LABEL[l])).toEqual(['JavaScript', 'Go', 'Java']);
    expect(Object.keys(LANGUAGE_LABEL)).toHaveLength(3);
  });

  it('labels the 7 bug types in es and en (TS-2)', () => {
    expect(BUG_TYPES.map((t) => BUG_TYPE_LABEL[t].es)).toEqual([
      'uno de más o de menos',
      'comparación',
      'operador equivocado',
      'variable equivocada',
      'valor inicial',
      'return antes de tiempo',
      'condición invertida',
    ]);
    expect(BUG_TYPES.map((t) => BUG_TYPE_LABEL[t].en)).toEqual([
      'off by one',
      'comparison',
      'wrong operator',
      'wrong variable',
      'bad initialization',
      'early return',
      'inverted condition',
    ]);
    expect(Object.keys(BUG_TYPE_LABEL)).toHaveLength(7);
    for (const t of BUG_TYPES) expect(Object.keys(BUG_TYPE_LABEL[t])).toEqual(['es', 'en']);
  });
});
