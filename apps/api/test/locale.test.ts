import { describe, expect, it } from 'vitest';

import { pickLocale, resolveLocale } from '@/shared/locale';

describe('pickLocale', () => {
  it.each([
    [undefined, 'es'],
    ['', 'es'],
    ['en-US', 'en'],
    ['EN', 'en'],
    ['pt-BR', 'es'],
    ['es-AR,en;q=0.9', 'es'],
    ['fr-FR,en;q=0.8,es;q=0.5', 'en'],
    ['en;q=0.2,es;q=0.9', 'es'],
    ['*', 'es'],
    ['basura;;q=x', 'es'],
  ])('pickLocale(%j) = %s', (input, expected) => {
    expect(pickLocale(input)).toBe(expected);
  });
});

describe('resolveLocale', () => {
  it('aplica lang -> player -> Accept-Language -> es', () => {
    expect(resolveLocale({ lang: 'en', playerLocale: 'es', acceptLanguage: 'es' })).toBe('en');
    expect(resolveLocale({ lang: undefined, playerLocale: 'en', acceptLanguage: 'es' })).toBe('en');
    expect(resolveLocale({ lang: 'fr', playerLocale: undefined, acceptLanguage: 'en-GB' })).toBe(
      'en',
    );
    expect(resolveLocale({})).toBe('es');
  });
});
