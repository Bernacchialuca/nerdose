import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { GameId, ReportReason } from '@nerdose/core';

import { api, ApiError } from '@/lib/api-client';
import { useSession } from '@/modules/session';

import { gameTodayKeys } from './game-today';
import type { ReportRequest, ReportResponse } from './game-today';
import { withSessionRetry } from './with-session-retry';

type ReportInput = { challengeNumber: number; reason: ReportReason; message: string };

export function useReport(gameId: GameId) {
  const queryClient = useQueryClient();
  const { locale } = useSession();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: gameTodayKeys.game(gameId) });
  return useMutation({
    mutationFn: ({ challengeNumber, reason, message }: ReportInput) => {
      const body: ReportRequest = {
        challenge_number: challengeNumber,
        reason,
        ...(message.trim() !== '' ? { message } : {}),
      };
      return withSessionRetry(() =>
        api<ReportResponse>(`/api/games/${gameId}/today/report?lang=${locale}`, {
          method: 'POST',
          json: body,
        }),
      );
    },
    onSuccess: invalidate,
    // `already_reported` deja la query vieja (`reported: false`); el error se propaga igual.
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'already_reported') void invalidate();
    },
  });
}
