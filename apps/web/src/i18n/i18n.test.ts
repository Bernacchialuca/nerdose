import { describe, expect, it } from 'vitest';

import i18n from '@/i18n';

import { en } from './en';
import { es } from './es';

function flattenKeys(tree: object, prefix = ''): string[] {
  return Object.entries(tree)
    .flatMap(([key, value]) =>
      typeof value === 'object' && value !== null
        ? flattenKeys(value, `${prefix}${key}.`)
        : [`${prefix}${key}`],
    )
    .sort();
}

describe('i18n', () => {
  it('es y en tienen las mismas claves', () => {
    const esKeys = flattenKeys(es);
    expect(esKeys.length).toBeGreaterThan(0);
    expect(flattenKeys(en)).toEqual(esKeys);
    expect(esKeys).toEqual(
      expect.arrayContaining(['shell.brand', 'shell.title', 'errors.title', 'errors.retry']),
    );
  });

  it('textos en español', () => {
    expect(es.shell.brand).toBe('nerdose');
    expect(es.shell.title).toBe('nerdose');
    expect(es.errors.title).toBe('Algo salió mal');
    expect(es.errors.retry).toBe('Reintentar');
  });

  it('textos en inglés', () => {
    expect(en.shell.brand).toBe('nerdose');
    expect(en.shell.title).toBe('nerdose');
    expect(en.errors.title).toBe('Something went wrong');
    expect(en.errors.retry).toBe('Try again');
  });

  it('arranca en español con fallback es', () => {
    expect(i18n.language).toBe('es');
    expect(i18n.options.fallbackLng).toContain('es');
    expect(i18n.t('errors.retry')).toBe('Reintentar');
  });
});
