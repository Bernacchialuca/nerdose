import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { StrictMode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { createMemoryRouter, RouterProvider } from 'react-router';
import type { RouteObject } from 'react-router';

import { routes as appRoutes } from '@/app/router';
import i18n from '@/i18n';
import { SessionProvider } from '@/modules/session';

type Options = { route?: string; routes?: RouteObject[]; strict?: boolean };

export function renderWithProviders({
  route = '/',
  routes = appRoutes,
  strict = false,
}: Options = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [route] });
  const tree = (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <SessionProvider>
          <RouterProvider router={router} />
        </SessionProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
  return { ...render(strict ? <StrictMode>{tree}</StrictMode> : tree), queryClient };
}
