import type { BankItem, BankItemsResponse } from '@/modules/banks/api/types';

export const TERM_KERNEL: BankItem = {
  id: 'term-kernel',
  label: 'kernel',
  category: 'linux',
  status: 'approved',
  rejection_reason: null,
  sitelinks: 1234,
  wikidata_id: 'Q11223',
  description: 'Núcleo del sistema operativo.',
  event_date: null,
  last_used: { devdle: '2026-11-03', 'grep-grid': null },
  excluded_from: [],
};

export const TERM_REJECTED: BankItem = {
  id: 'term-cap',
  label: 'CAP theorem',
  category: 'databases',
  status: 'rejected',
  rejection_reason: 'invalid_chars',
  sitelinks: 40,
  wikidata_id: 'Q2306',
  description: 'Teorema sobre sistemas distribuidos.',
  event_date: null,
  last_used: { devdle: null, 'grep-grid': null },
  excluded_from: [],
};

export const TERM_NICHE: BankItem = {
  id: 'term-mutex',
  label: 'mutex',
  category: 'software_engineering',
  status: 'approved',
  rejection_reason: null,
  sitelinks: 12,
  wikidata_id: 'Q193300',
  description: 'Exclusión mutua.',
  event_date: null,
  last_used: { 'grep-grid': '2026-10-20' },
  excluded_from: ['devdle'],
};

export const FACT_LINUX: BankItem = {
  id: 'fact-linux',
  label: 'Linux 0.01',
  category: 'operating_systems',
  status: 'approved',
  rejection_reason: null,
  sitelinks: 300,
  wikidata_id: 'Q388',
  description: 'Linus Torvalds publica la primera versión del kernel.',
  event_date: '1991-09-17',
  last_used: { timeline: null },
  excluded_from: [],
};

export function bankPage(overrides: Partial<BankItemsResponse> = {}): BankItemsResponse {
  const items = overrides.items ?? [TERM_KERNEL, TERM_REJECTED, TERM_NICHE];
  return {
    bank: 'terms',
    page: 1,
    page_size: 25,
    total: items.length,
    total_pages: 1,
    items,
    ...overrides,
  };
}

export const BANK_TERMS_PAGE = bankPage();

export const BANK_FACTS_PAGE = bankPage({ bank: 'timeline_facts', items: [FACT_LINUX] });

export const BANK_EMPTY = bankPage({ items: [], total: 0, total_pages: 0 });
