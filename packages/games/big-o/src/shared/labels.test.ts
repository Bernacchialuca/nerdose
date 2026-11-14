import { BIG_O_OPTIONS, CODE_LANGUAGES } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { LANGUAGE_LABEL, OPTION_LABEL } from './labels';

describe('labels', () => {
  it('labels the 8 options (TS-1)', () => {
    expect(BIG_O_OPTIONS.map((o) => OPTION_LABEL[o])).toEqual([
      'O(1)',
      'O(log n)',
      'O(n)',
      'O(n log n)',
      'O(n²)',
      'O(n³)',
      'O(2ⁿ)',
      'O(n!)',
    ]);
    expect(Object.keys(OPTION_LABEL)).toHaveLength(8);
  });

  it('labels the 3 languages (TS-2)', () => {
    expect(CODE_LANGUAGES.map((l) => LANGUAGE_LABEL[l])).toEqual(['JavaScript', 'Go', 'Java']);
    expect(Object.keys(LANGUAGE_LABEL)).toHaveLength(3);
  });
});
