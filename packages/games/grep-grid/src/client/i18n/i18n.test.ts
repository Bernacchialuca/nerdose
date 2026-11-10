import { describe, expect, it } from 'vitest';

import { makeT } from '../test-utils';

import { i18n } from './index';

const keysOf = (node: unknown, prefix = ''): string[] =>
  typeof node === 'object' && node !== null
    ? Object.entries(node).flatMap(([k, v]) => keysOf(v, `${prefix}${k}.`))
    : [prefix];

const leaves = (node: unknown): string[] =>
  typeof node === 'object' && node !== null ? Object.values(node).flatMap(leaves) : [String(node)];

describe('grep-grid i18n resources', () => {
  it('es and en have the same key tree and no empty values (TS-6)', () => {
    expect(keysOf(i18n.resources.en).sort()).toEqual(keysOf(i18n.resources.es).sort());
    for (const locale of ['es', 'en'] as const) {
      for (const v of leaves(i18n.resources[locale])) expect(v.trim()).not.toBe('');
    }
  });

  it('has the English start label', () => {
    expect(i18n.resources.en.instructions.start).toBe('Start');
  });

  it('exposes the grep-grid namespace', () => {
    expect(i18n.namespace).toBe('grep-grid');
  });
});

describe('makeT', () => {
  it('interpolates variables', () => {
    expect(makeT('es')('hint.found', { word: 'DOCKER', found: 4, total: 8 })).toBe(
      '> DOCKER encontrada · 4/8',
    );
  });

  it('throws on an unknown key', () => {
    expect(() => makeT('es')('nope.missing')).toThrow(/Missing i18n key/);
  });
});
