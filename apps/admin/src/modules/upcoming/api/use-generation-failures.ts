import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import type { GenerationFailuresResponse } from './types';
import { failureKeys } from './upcoming-keys';

export function useGenerationFailures() {
  return useQuery({
    queryKey: failureKeys.all,
    queryFn: () => api<GenerationFailuresResponse>('/api/admin/generation-failures'),
  });
}
