import { describe, expect, it } from 'vitest';

import { escapeLike, excludedFrom, totalPages } from '@/domain/admin/bank-items';

describe('escapeLike', () => {
  it('escapa %, _ y la barra invertida', () => {
    expect(escapeLike('100%')).toBe('100\\%');
    expect(escapeLike('a_b')).toBe('a\\_b');
    expect(escapeLike('c\\d')).toBe('c\\\\d');
    expect(escapeLike('%_\\')).toBe('\\%\\_\\\\');
  });

  it('deja intacto el texto sin comodines', () => {
    expect(escapeLike('Lanzamiento de Java')).toBe('Lanzamiento de Java');
    expect(escapeLike('')).toBe('');
  });
});

describe('totalPages', () => {
  it('redondea hacia arriba y nunca baja de 1', () => {
    expect(totalPages(0, 25)).toBe(1);
    expect(totalPages(1, 25)).toBe(1);
    expect(totalPages(25, 25)).toBe(1);
    expect(totalPages(26, 25)).toBe(2);
    expect(totalPages(4863, 25)).toBe(195);
  });
});

describe('excludedFrom', () => {
  const consumers = [
    { gameId: 'devdle' as const, excludedItems: new Set(['SLITAZ']) },
    { gameId: 'grep-grid' as const },
  ];

  it('lista los juegos que excluyen el ítem, en orden', () => {
    expect(excludedFrom('SLITAZ', consumers)).toEqual(['devdle']);
    expect(excludedFrom('SLITAZ', [...consumers].reverse())).toEqual(['devdle']);
    expect(
      excludedFrom('X', [
        { gameId: 'grep-grid', excludedItems: new Set(['X']) },
        { gameId: 'devdle', excludedItems: new Set(['X']) },
      ]),
    ).toEqual(['grep-grid', 'devdle']);
  });

  it('vacío si nadie lo excluye o no hay consumidores', () => {
    expect(excludedFrom('REDIS', consumers)).toEqual([]);
    expect(excludedFrom('REDIS', [])).toEqual([]);
  });
});
