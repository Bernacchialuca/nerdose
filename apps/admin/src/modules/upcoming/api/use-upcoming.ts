import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { POLL_INTERVAL_MS, UPCOMING_DAYS, upcomingKeys } from './upcoming-keys';
import type { UpcomingResponse } from './types';

export function hasPendingRegeneration(data?: UpcomingResponse): boolean {
  return (
    data?.days.some((day) => day.games.some((g) => g.regeneration?.status === 'pending')) ?? false
  );
}

export function useUpcoming() {
  return useQuery({
    queryKey: upcomingKeys.list(UPCOMING_DAYS),
    queryFn: () => api<UpcomingResponse>(`/api/admin/challenges/upcoming?days=${UPCOMING_DAYS}`),
    // El polling es explícito: solo mientras algún pedido siga pendiente.
    refetchInterval: (query) =>
      hasPendingRegeneration(query.state.data) ? POLL_INTERVAL_MS : false,
  });
}
