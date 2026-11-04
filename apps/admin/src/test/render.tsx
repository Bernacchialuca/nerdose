import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import type { RouteObject } from 'react-router';

import { routes as appRoutes } from '@/app/router';

type Options = { route?: string; routes?: RouteObject[] };

export function renderWithProviders({ route = '/', routes = appRoutes }: Options = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [route] });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}
