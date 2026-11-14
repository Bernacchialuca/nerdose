import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { contentStockKeys } from './content-stock-keys';
import type { ContentStockResponse } from './types';

// Sin polling: el stock se consulta al entrar y con «Reintentar».
export function useContentStock() {
  return useQuery({
    queryKey: contentStockKeys.all,
    queryFn: () => api<ContentStockResponse>('/api/admin/content/stock'),
  });
}
