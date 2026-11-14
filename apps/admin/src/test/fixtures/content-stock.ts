import type { BankStock, ContentStockResponse, LastSync } from '@/modules/content-stock/api/types';

export const TERMS_BANK: BankStock = {
  bank: 'terms',
  approved_available: 1050,
  approved_total: 1320,
  rejected_total: 14,
  days_of_stock: 140,
  cycle_ok: true,
  consumers: [
    {
      game_id: 'devdle',
      window_days: 365,
      items_per_challenge: 1,
      approved_available: 1050,
      days_of_stock: 1050,
      cycle_ok: true,
    },
    {
      game_id: 'grep-grid',
      window_days: 30,
      items_per_challenge: 8,
      approved_available: 1120,
      days_of_stock: 140,
      cycle_ok: true,
    },
  ],
  rejections: [
    {
      wikidata_id: 'Q2306',
      label: 'CAP theorem',
      reason: 'definición incorrecta (anulación Devdle #8)',
    },
  ],
};

export const TERMS_BANK_LOW: BankStock = {
  bank: 'terms',
  approved_available: 250,
  approved_total: 300,
  rejected_total: 14,
  days_of_stock: 31,
  cycle_ok: false,
  consumers: [
    {
      game_id: 'devdle',
      window_days: 365,
      items_per_challenge: 1,
      approved_available: 260,
      days_of_stock: 260,
      cycle_ok: false,
    },
    {
      game_id: 'grep-grid',
      window_days: 30,
      items_per_challenge: 8,
      approved_available: 250,
      days_of_stock: 31,
      cycle_ok: true,
    },
  ],
  rejections: TERMS_BANK.rejections,
};

export const FACTS_BANK: BankStock = {
  bank: 'timeline_facts',
  approved_available: 310,
  approved_total: 520,
  rejected_total: 3,
  days_of_stock: 62,
  cycle_ok: true,
  consumers: [
    {
      game_id: 'timeline',
      window_days: 90,
      items_per_challenge: 5,
      approved_available: 310,
      days_of_stock: 62,
      cycle_ok: true,
    },
  ],
  rejections: [
    { wikidata_id: 'Q251', label: 'Lanzamiento de Java 1.0', reason: 'fecha incorrecta' },
  ],
};

export const FACTS_BANK_LOW: BankStock = {
  ...FACTS_BANK,
  approved_available: 170,
  approved_total: 380,
  days_of_stock: 34,
  cycle_ok: false,
  consumers: [
    {
      game_id: 'timeline',
      window_days: 90,
      items_per_challenge: 5,
      approved_available: 170,
      days_of_stock: 34,
      cycle_ok: false,
    },
  ],
};

export const LAST_SYNC: LastSync = {
  finished_at: '2026-11-28T03:12:00Z',
  dataset_version: '2026.11.2',
  inserted: 40,
  updated: 12,
  unchanged: 1284,
  kept_rejected: 9,
};

export const TOP_REJECTED = [
  { word: 'KAFKA', distinct_players: 41 },
  { word: 'REACT', distinct_players: 37 },
  { word: 'CRONS', distinct_players: 22 },
  ...Array.from({ length: 47 }, (_, i) => ({
    word: `ZZ${String.fromCharCode(65 + Math.floor(i / 26))}${String.fromCharCode(65 + (i % 26))}`,
    distinct_players: 20,
  })),
];

export function stock(overrides: Partial<ContentStockResponse> = {}): ContentStockResponse {
  return {
    banks: [TERMS_BANK, FACTS_BANK],
    last_sync: LAST_SYNC,
    top_rejected_guesses: TOP_REJECTED,
    ...overrides,
  };
}

export const STOCK_OK = stock();
export const STOCK_LOW = stock({ banks: [TERMS_BANK, FACTS_BANK_LOW] });
export const STOCK_TERMS_LOW = stock({ banks: [TERMS_BANK_LOW, FACTS_BANK] });
export const STOCK_EMPTY: ContentStockResponse = {
  banks: [
    { ...TERMS_BANK, rejected_total: 0, rejections: [] },
    { ...FACTS_BANK, rejected_total: 0, rejections: [] },
  ],
  last_sync: null,
  top_rejected_guesses: [],
};
export const STOCK_NO_REASON = stock({
  banks: [
    { ...TERMS_BANK, rejections: [{ wikidata_id: 'Q100', label: 'CACHE', reason: '' }] },
    FACTS_BANK,
  ],
});
