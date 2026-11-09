import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { GameId } from '@nerdose/core';

import { api } from '@/lib/api-client';
import { todayKeys } from '@/modules/catalog';
import { useSession } from '@/modules/session';

import { gameTodayKeys } from './game-today';
import type { GameToday, MoveResponse } from './game-today';
import { withSessionRetry } from './with-session-retry';

export function useSubmitMove(gameId: GameId) {
  const queryClient = useQueryClient();
  const { locale } = useSession();
  return useMutation({
    mutationFn: ({ challengeNumber, move }: { challengeNumber: number; move: unknown }) =>
      withSessionRetry(() =>
        api<MoveResponse>(`/api/games/${gameId}/today/move?lang=${locale}`, {
          method: 'POST',
          json: { challenge_number: challengeNumber, move },
        }),
      ),
    onSuccess: (res) => {
      queryClient.setQueryData<GameToday>(
        gameTodayKeys.detail(gameId, locale),
        (old) =>
          old && {
            ...old,
            play: { ...res.play, code_language: old.play?.code_language ?? null },
            ...(res.result !== null && { result: res.result, game_stats: res.game_stats }),
          },
      );
      // `MoveResponse` solo trae el estado nuevo del juego: la home y la racha global quedan viejas.
      if (res.result !== null) void queryClient.invalidateQueries({ queryKey: todayKeys.all });
    },
  });
}
