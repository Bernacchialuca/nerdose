import { TIMELINE_CATEGORIES } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { makeT } from '../test-utils';

import { i18n } from './index';

const keysOf = (node: unknown, prefix = ''): string[] =>
  typeof node === 'object' && node !== null
    ? Object.entries(node).flatMap(([k, v]) => keysOf(v, `${prefix}${k}.`))
    : [prefix];

const leaves = (node: unknown): string[] =>
  typeof node === 'object' && node !== null ? Object.values(node).flatMap(leaves) : [String(node)];

describe('timeline i18n resources', () => {
  it('es and en have the same key tree and no empty values (TS-4)', () => {
    expect(keysOf(i18n.resources.en).sort()).toEqual(keysOf(i18n.resources.es).sort());
    for (const locale of ['es', 'en'] as const) {
      for (const v of leaves(i18n.resources[locale])) expect(v.trim()).not.toBe('');
    }
  });

  it('has the English start label', () => {
    expect(i18n.resources.en.instructions.start).toBe('Start');
  });

  it('covers exactly the timeline categories', () => {
    for (const locale of ['es', 'en'] as const) {
      expect(Object.keys(i18n.resources[locale].categories).sort()).toEqual(
        [...TIMELINE_CATEGORIES].sort(),
      );
    }
  });

  it('exposes the timeline namespace', () => {
    expect(i18n.namespace).toBe('timeline');
  });
});

describe('makeT (TS-5)', () => {
  it('interpolates variables', () => {
    expect(makeT('es')('hint.moved', { label: 'Go', position: 3, total: 5 })).toBe(
      '> moviste Go a la posición 3 de 5',
    );
  });

  it('throws on an unknown key', () => {
    expect(() => makeT('es')('nope')).toThrow(/Missing i18n key/);
  });
});
