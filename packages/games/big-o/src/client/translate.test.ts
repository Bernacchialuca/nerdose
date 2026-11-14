import { describe, expect, it } from 'vitest';

import { translatorFor } from './translate';

describe('translatorFor', () => {
  it('interpolates variables in each language', () => {
    expect(translatorFor('es')('result.won', { answer: 'O(n)' })).toBe('Correcto: O(n)');
    expect(translatorFor('en')('result.won', { answer: 'O(n)' })).toBe('Correct: O(n)');
  });

  it('returns the key when it does not exist instead of throwing', () => {
    expect(translatorFor('es')('nope.missing')).toBe('nope.missing');
    expect(translatorFor('en')('preview')).toBe('preview');
  });
});
