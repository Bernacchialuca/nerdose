import { describe, expect, it } from 'vitest';

import { translatorFor } from './translate';

describe('translatorFor', () => {
  it('interpolates variables in each language', () => {
    expect(translatorFor('es')('preview.boardLabel', { word: 'REACT' })).toBe('Solución: REACT');
    expect(translatorFor('en')('preview.boardLabel', { word: 'REACT' })).toBe('Solution: REACT');
  });

  it('returns the key when it does not exist instead of throwing', () => {
    expect(translatorFor('es')('nope.missing')).toBe('nope.missing');
    expect(translatorFor('en')('preview')).toBe('preview');
  });
});
