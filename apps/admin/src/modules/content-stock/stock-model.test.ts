import { describe, expect, it } from 'vitest';

import {
  FACTS_BANK_LOW,
  STOCK_EMPTY,
  STOCK_LOW,
  STOCK_NO_REASON,
  STOCK_OK,
  STOCK_TERMS_LOW,
  TERMS_BANK_LOW,
  stock,
} from '@/test/fixtures/content-stock';

import { rejectionRows, stockAlerts, windowLabel } from './stock-model';

const FACTS_ALERT =
  'El banco de hechos no alcanza para ciclar: Tech Timeline necesita 450 hechos aprobados para su ventana de 90 días y hay 380.';
const TERMS_ALERT =
  'El banco de términos no alcanza para ciclar: Devdle necesita 365 términos aprobados para su ventana de 365 días y hay 300.';

describe('stock-model', () => {
  it('stockAlerts (TS-3)', () => {
    expect(stockAlerts(STOCK_OK)).toEqual([]);
    expect(stockAlerts(STOCK_LOW)).toEqual([FACTS_ALERT]);
    expect(stockAlerts(STOCK_TERMS_LOW)).toEqual([TERMS_ALERT]);
    expect(stockAlerts(stock({ banks: [TERMS_BANK_LOW, FACTS_BANK_LOW] }))).toEqual([
      TERMS_ALERT,
      FACTS_ALERT,
    ]);
  });

  it('rejectionRows y windowLabel (TS-4)', () => {
    expect(rejectionRows(STOCK_OK)).toEqual([
      {
        key: 'terms:Q2306',
        bank: 'Términos',
        label: 'CAP theorem',
        reason: 'definición incorrecta (anulación Devdle #8)',
      },
      {
        key: 'timeline_facts:Q251',
        bank: 'Hechos',
        label: 'Lanzamiento de Java 1.0',
        reason: 'fecha incorrecta',
      },
    ]);
    expect(rejectionRows(STOCK_NO_REASON)[0]).toEqual({
      key: 'terms:Q100',
      bank: 'Términos',
      label: 'CACHE',
      reason: 'Sin motivo registrado',
    });
    expect(rejectionRows(STOCK_EMPTY)).toEqual([]);
    expect(windowLabel(365)).toBe('365 días');
    expect(windowLabel(1)).toBe('1 día');
  });
});
