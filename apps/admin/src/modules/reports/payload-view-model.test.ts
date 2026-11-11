import { describe, expect, it } from 'vitest';

import { flattenPayload, readVerification } from './payload-view-model';

describe('flattenPayload', () => {
  it('separa filas bilingües y comunes (TS-35)', () => {
    expect(
      flattenPayload({
        a: { es: 'x', en: 'y' },
        items: [{ label: { es: 'L', en: 'E' }, year: 2013 }],
        tags: ['a', 'b'],
        n: null,
      }),
    ).toEqual({
      bilingual: [
        { path: 'a', es: 'x', en: 'y' },
        { path: 'items.0.label', es: 'L', en: 'E' },
      ],
      common: [
        { path: 'items.0.year', value: '2013' },
        { path: 'tags', value: 'a, b' },
        { path: 'n', value: 'null' },
      ],
    });
  });

  it('formatea valores no string de es/en', () => {
    expect(flattenPayload({ a: { es: ['x', 'y'], en: { k: 1 } } }).bilingual).toEqual([
      { path: 'a', es: 'x, y', en: '{"k":1}' },
    ]);
  });
});

describe('readVerification', () => {
  it('reconoce el log y cae a filas crudas', () => {
    expect(readVerification({ ok: true, checks: [] }).kind).toBe('log');
    expect(readVerification({ foo: 'bar' })).toEqual({
      kind: 'raw',
      rows: [{ path: 'foo', value: 'bar' }],
    });
  });
});
