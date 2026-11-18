import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { GameId } from '@nerdose/core';

import { api } from '@/lib/api-client';
import { todayKeys } from '@/modules/catalog';
import { statsKeys } from '@/modules/stats';

import { gameTodayKeys } from './game-today';
import type { AcknowledgeVoidResponse } from './game-today';
import { withSessionRetry } from './with-session-retry';

export function useAcknowledgeVoid(gameId: GameId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ challengeNumber }: { challengeNumber: number }) =>
      withSessionRetry(() =>
        api<AcknowledgeVoidResponse>(`/api/games/${gameId}/today/acknowledge-void`, {
          method: 'POST',
          json: { challenge_number: challengeNumber },
        }),
      ),
    // Se devuelve la promesa: la mutación sigue `pending` hasta que llega el `GameToday` nuevo.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: todayKeys.all }),
        queryClient.invalidateQueries({ queryKey: gameTodayKeys.all }),
        queryClient.invalidateQueries({ queryKey: statsKeys.all }),
      ]),
  });
}
