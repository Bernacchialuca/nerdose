import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { isApiError } from '@/lib/api-errors';

import type { RegenerateResponse, UpcomingResponse } from './types';
import { UPCOMING_DAYS, upcomingKeys } from './upcoming-keys';

export function withPendingRegeneration(
  data: UpcomingResponse | undefined,
  challengeId: string,
  res: RegenerateResponse,
): UpcomingResponse | undefined {
  if (data === undefined) return undefined;
  return {
    ...data,
    days: data.days.map((day) => ({
      ...day,
      games: day.games.map((game) =>
        game.challenge?.id === challengeId
          ? {
              ...game,
              regeneration: {
                request_id: res.request_id,
                status: 'pending' as const,
                error: null,
                requested_at: res.requested_at,
                processed_at: null,
              },
            }
          : game,
      ),
    })),
  };
}

export function useRegenerateChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    // El body `{}` es solo para que viaje `Content-Type: application/json`, que la api exige.
    mutationFn: ({ challenge_id }: { challenge_id: string }) =>
      api<RegenerateResponse>(`/api/admin/challenges/${challenge_id}/regenerate`, {
        method: 'POST',
        json: {},
      }),
    // La respuesta trae el estado nuevo: se refleja ya en la celda sin esperar el refetch.
    onSuccess: (res, { challenge_id }) => {
      queryClient.setQueryData<UpcomingResponse>(upcomingKeys.list(UPCOMING_DAYS), (data) =>
        withPendingRegeneration(data, challenge_id, res),
      );
    },
    onSettled: (_data, error) => {
      if (isApiError(error) && error.status === 401) return undefined;
      return queryClient.invalidateQueries({ queryKey: upcomingKeys.all });
    },
  });
}
