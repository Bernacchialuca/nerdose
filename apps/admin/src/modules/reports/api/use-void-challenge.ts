import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { isApiError } from '@/lib/api-errors';

import { reportKeys } from './report-keys';
import type { VoidRequest, VoidResponse } from './types';

export function useVoidChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ challenge_id, ...body }: VoidRequest & { challenge_id: string }) =>
      api<VoidResponse>(`/api/admin/challenges/${challenge_id}/void`, {
        method: 'POST',
        json: body,
      }),
    onSettled: (_data, error) => {
      if (isApiError(error) && error.status === 401) return undefined;
      return queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}
