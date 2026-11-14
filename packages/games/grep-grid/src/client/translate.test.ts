import { describe, expect, it } from 'vitest';

import { translatorFor } from './translate';

describe('translatorFor', () => {
  it('interpolates variables in each language', () => {
    expect(translatorFor('es')('preview.wordsCount', { total: 8 })).toBe('8 palabras');
    expect(translatorFor('en')('cell.solution')).toBe('part of the solution');
  });

  it('returns the key when it does not exist instead of throwing', () => {
    expect(translatorFor('es')('nope.missing')).toBe('nope.missing');
    expect(translatorFor('en')('preview')).toBe('preview');
  });
});
