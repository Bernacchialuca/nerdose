import { describe, expect, it } from 'vitest';

import { translatorFor } from './translate';

describe('translatorFor', () => {
  it('interpolates variables in each language', () => {
    expect(translatorFor('es')('preview.prompt', { prompt: 'X' })).toBe('consigna: X');
    expect(translatorFor('en')('preview.prompt', { prompt: 'X' })).toBe('task: X');
  });

  it('returns the key when it does not exist instead of throwing', () => {
    expect(translatorFor('es')('nope.missing')).toBe('nope.missing');
    expect(translatorFor('en')('preview')).toBe('preview');
  });
});
