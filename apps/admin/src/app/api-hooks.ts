import type { QueryClient } from '@tanstack/react-query';

import { configureApi } from '@/lib/api-client';
import { clearSession, readSession } from '@/modules/auth';

export function registerApiHooks(queryClient: QueryClient): void {
  configureApi({
    getHeaders: (): Record<string, string> => {
      const session = readSession();
      return session ? { Authorization: `Bearer ${session.token}` } : {};
    },
    onError: (err) => {
      if (err.status === 401 && err.code === 'unauthorized') {
        clearSession('expired');
        queryClient.clear();
      }
    },
  });
}
