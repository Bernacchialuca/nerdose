import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { metricsKeys } from './metrics-keys';
import type { MetricsResponse } from './types';

// Sin polling: las métricas se consultan al elegir el rango y con «Reintentar».
export function useMetrics(range: { from: string; to: string } | null) {
  return useQuery({
    queryKey: range ? metricsKeys.range(range.from, range.to) : metricsKeys.all,
    queryFn: () => {
      if (!range) throw new Error('range required');
      const search = new URLSearchParams({ from: range.from, to: range.to }).toString();
      return api<MetricsResponse>(`/api/admin/metrics?${search}`);
    },
    enabled: range !== null,
  });
}
