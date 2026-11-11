import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import type { RouteObject } from 'react-router';
import { vi } from 'vitest';

import { registerApiHooks } from '@/app/api-hooks';
import { routes as appRoutes } from '@/app/router';
import { AuthProvider } from '@/modules/auth';

type Options = {
  route?: string;
  routes?: RouteObject[];
  session?: { token: string; expires_at: string };
};

export function renderWithProviders({ route = '/', routes = appRoutes, session }: Options = {}) {
  if (session) sessionStorage.setItem('nerdose_admin_session', JSON.stringify(session));
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  registerApiHooks(queryClient);
  const router = createMemoryRouter(routes, { initialEntries: [route] });
  const user = userEvent.setup(
    vi.isFakeTimers() ? { advanceTimers: (ms) => vi.advanceTimersByTime(ms) } : undefined,
  );
  const result = render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return { ...result, queryClient, router, user };
}
