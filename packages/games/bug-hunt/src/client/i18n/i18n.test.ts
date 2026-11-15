import { describe, expect, it } from 'vitest';

import { makeT } from '../test-utils';

import { i18n } from './index';

const keysOf = (node: unknown, prefix = ''): string[] =>
  typeof node === 'object' && node !== null
    ? Object.entries(node).flatMap(([k, v]) => keysOf(v, `${prefix}${k}.`))
    : [prefix];

const leaves = (node: unknown): string[] =>
  typeof node === 'object' && node !== null ? Object.values(node).flatMap(leaves) : [String(node)];

describe('bug-hunt i18n resources', () => {
  it('es and en have the same key tree and no empty values (TS-4)', () => {
    expect(keysOf(i18n.resources.en).sort()).toEqual(keysOf(i18n.resources.es).sort());
    for (const locale of ['es', 'en'] as const) {
      for (const v of leaves(i18n.resources[locale])) expect(v.trim()).not.toBe('');
    }
  });

  it('has the expected labels', () => {
    expect(i18n.resources.en.instructions.start).toBe('Start');
    expect(i18n.resources.es.game.confirmIdle).toBe('Elegí una línea');
    expect(i18n.resources.es.share.missed).toBe('se me escapó');
    expect(i18n.resources.en.share.missed).toBe('it got away');
    expect(i18n.namespace).toBe('bug-hunt');
  });
});

describe('makeT (TS-5)', () => {
  it('interpolates variables', () => {
    expect(makeT('es')('game.hint.selected', { line: 4 })).toBe(
      '> elegiste la línea 4. Podés cambiarla hasta confirmar.',
    );
  });

  it('throws on an unknown key', () => {
    expect(() => makeT('es')('nope')).toThrow(/Missing i18n key/);
  });
});
