import { describe, expect, it } from 'vitest';

import { TERM_CATEGORIES, TIMELINE_CATEGORIES } from '@nerdose/core';

import { BANK_PAGE_SIZE, bankItemsPath } from './api/use-bank-items';
import {
  BANK_TABS,
  STATUS_OPTIONS,
  bankQueryParams,
  categoryLabel,
  categoryOptions,
  parseBankQuery,
  reasonLabel,
} from './labels';

const parse = (search: string) => parseBankQuery(new URLSearchParams(search));

describe('parseBankQuery', () => {
  it('sin parámetros: términos, sin filtros, página 1', () => {
    expect(parse('')).toEqual({ bank: 'terms', q: '', status: null, category: null, page: 1 });
  });

  it('lee todos los filtros válidos', () => {
    expect(
      parse('bank=timeline_facts&q=linux&status=rejected&category=operating_systems&page=3'),
    ).toEqual({
      bank: 'timeline_facts',
      q: 'linux',
      status: 'rejected',
      category: 'operating_systems',
      page: 3,
    });
    expect(parse('status=approved').status).toBe('approved');
  });

  it('lo inválido cae al valor por defecto', () => {
    expect(parse('bank=otro&status=pending&category=nope&page=abc')).toEqual({
      bank: 'terms',
      q: '',
      status: null,
      category: null,
      page: 1,
    });
    expect(parse('page=0').page).toBe(1);
    expect(parse('page=-4').page).toBe(1);
    expect(parse('page=2.7').page).toBe(2);
  });

  it('la categoría tiene que ser del banco elegido', () => {
    // `git` solo existe en términos; `frameworks`, solo en hechos.
    expect(parse('bank=terms&category=git').category).toBe('git');
    expect(parse('bank=timeline_facts&category=git').category).toBeNull();
    expect(parse('bank=timeline_facts&category=frameworks').category).toBe('frameworks');
    expect(parse('bank=terms&category=frameworks').category).toBeNull();
    // Las compartidas valen en los dos.
    expect(parse('bank=terms&category=databases').category).toBe('databases');
    expect(parse('bank=timeline_facts&category=databases').category).toBe('databases');
  });

  it('recorta la búsqueda: sin espacios en los bordes y hasta 50 caracteres', () => {
    expect(parse('q=%20%20kernel%20').q).toBe('kernel');
    expect(parse(`q=${'a'.repeat(80)}`).q).toHaveLength(50);
  });
});

describe('bankQueryParams', () => {
  it('serializa solo lo que no es por defecto', () => {
    expect(
      bankQueryParams({ bank: 'terms', q: '', status: null, category: null, page: 1 }),
    ).toEqual({ bank: 'terms' });
    expect(
      bankQueryParams({
        bank: 'timeline_facts',
        q: 'linux',
        status: 'approved',
        category: 'hardware',
        page: 2,
      }),
    ).toEqual({
      bank: 'timeline_facts',
      q: 'linux',
      status: 'approved',
      category: 'hardware',
      page: '2',
    });
  });

  it('ida y vuelta con parseBankQuery', () => {
    const query = {
      bank: 'terms' as const,
      q: 'git',
      status: 'rejected' as const,
      category: 'git',
      page: 4,
    };
    expect(parseBankQuery(new URLSearchParams(bankQueryParams(query)))).toEqual(query);
  });
});

describe('bankItemsPath', () => {
  it('siempre manda banco, página y tamaño; los filtros solo si están', () => {
    expect(bankItemsPath({ bank: 'terms', q: '', status: null, category: null, page: 1 })).toBe(
      `/api/admin/content/items?bank=terms&page=1&page_size=${String(BANK_PAGE_SIZE)}`,
    );
    const path = bankItemsPath({
      bank: 'timeline_facts',
      q: 'unix v1',
      status: 'rejected',
      category: 'hardware',
      page: 3,
    });
    const params = new URL(path, 'http://x').searchParams;
    expect(Object.fromEntries(params)).toEqual({
      bank: 'timeline_facts',
      page: '3',
      page_size: '25',
      q: 'unix v1',
      status: 'rejected',
      category: 'hardware',
    });
  });
});

describe('etiquetas', () => {
  it('categorías en español para cada banco, en el orden del dominio', () => {
    expect(categoryOptions('terms').map((o) => o.value)).toEqual([...TERM_CATEGORIES]);
    expect(categoryOptions('timeline_facts').map((o) => o.value)).toEqual([...TIMELINE_CATEGORIES]);
    expect(categoryLabel('terms', 'linux')).toBe('Linux y SO');
    expect(categoryLabel('timeline_facts', 'operating_systems')).toBe('Sistemas operativos');
    for (const bank of ['terms', 'timeline_facts'] as const) {
      for (const o of categoryOptions(bank)) expect(o.label).not.toBe(o.value);
    }
  });

  it('una categoría desconocida se muestra tal cual', () => {
    expect(categoryLabel('terms', 'quantum')).toBe('quantum');
  });

  it('motivos de rechazo en español, con el código como respaldo', () => {
    expect(reasonLabel('invalid_chars')).toBe('caracteres fuera de A–Z');
    expect(reasonLabel('low_sitelinks')).toBe('poco conocido (sitelinks)');
    expect(reasonLabel('duplicate')).toBe('duplicado');
    expect(reasonLabel('note_year_mismatch')).toBe('la nota no coincide con el año');
    expect(reasonLabel('definición incorrecta (anulación Devdle #8)')).toBe(
      'definición incorrecta (anulación Devdle #8)',
    );
  });

  it('estados y pestañas', () => {
    expect(STATUS_OPTIONS).toEqual([
      { value: '', label: 'Todos' },
      { value: 'approved', label: 'Aprobados' },
      { value: 'rejected', label: 'Rechazados' },
    ]);
    expect(BANK_TABS.map((t) => t.label)).toEqual(['Términos', 'Hechos (Timeline)']);
  });
});
