import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { GameId } from '@nerdose/core';

import { api } from '@/lib/api-client';
import { todayKeys } from '@/modules/catalog';
import { useSession } from '@/modules/session';

import { gameTodayKeys } from './game-today';
import type { GameToday, StartResponse } from './game-today';
import { withSessionRetry } from './with-session-retry';

export function useStartPlay(gameId: GameId) {
  const queryClient = useQueryClient();
  const { locale } = useSession();
  return useMutation({
    mutationFn: ({ challengeNumber }: { challengeNumber: number }) =>
      withSessionRetry(() =>
        api<StartResponse>(`/api/games/${gameId}/today/start`, {
          method: 'POST',
          json: { challenge_number: challengeNumber },
        }),
      ),
    onSuccess: (res) => {
      queryClient.setQueryData<GameToday>(
        gameTodayKeys.detail(gameId, locale),
        (old) => old && { ...old, play: res.play },
      );
      void queryClient.invalidateQueries({ queryKey: todayKeys.all });
    },
  });
}
