import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import type { BankItemsQuery, BankItemsResponse } from './types';

export const BANK_PAGE_SIZE = 25;

export const bankItemsKeys = {
  all: ['admin', 'bank-items'] as const,
  list: (q: BankItemsQuery) => [...bankItemsKeys.all, q] as const,
};

export function bankItemsPath(q: BankItemsQuery): string {
  const params = new URLSearchParams({
    bank: q.bank,
    page: String(q.page),
    page_size: String(BANK_PAGE_SIZE),
  });
  if (q.q) params.set('q', q.q);
  if (q.status) params.set('status', q.status);
  if (q.category) params.set('category', q.category);
  return `/api/admin/content/items?${params.toString()}`;
}

// Mientras llega la página nueva se sigue mostrando la anterior: la tabla no parpadea al paginar.
export function useBankItems(q: BankItemsQuery) {
  return useQuery({
    queryKey: bankItemsKeys.list(q),
    queryFn: () => api<BankItemsResponse>(bankItemsPath(q)),
    placeholderData: keepPreviousData,
  });
}
