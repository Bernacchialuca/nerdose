import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { renderWithProviders } from '@/test/render';
import { OPEN_GROUPS, SESSION, SESSION_KEY } from '@/test/fixtures/reports';
import { adminHandlers, requests, requestsTo, server } from '@/test/msw';

describe('Shell', () => {
  it('encabezado con solo Reportes (N) y Cerrar sesión (TS-23)', async () => {
    server.use(adminHandlers.reports('open', OPEN_GROUPS));
    const { container } = renderWithProviders({ route: '/reports', session: SESSION });
    const nav = await screen.findByRole('navigation');
    const link = await within(nav).findByRole('link', { name: /3 grupos de reportes abiertos/ });
    expect(link).toHaveTextContent('Reportes (3)');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getAllByRole('link')).toHaveLength(1);
    expect(within(nav).getAllByRole('button')).toHaveLength(1);
    expect(within(nav).getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
    expect(screen.queryByText(/Próximos|Stock|Métricas/)).toBeNull();
    expect(container.firstElementChild).toHaveClass('bg-bg', 'text-text', 'font-mono');
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getAllByRole('main')).toHaveLength(1);
  });

  it('Cerrar sesión descarta el token solo en el cliente (TS-22)', async () => {
    server.use(adminHandlers.reports('open', OPEN_GROUPS));
    const { user, router, queryClient } = renderWithProviders({
      route: '/reports',
      session: SESSION,
    });
    await screen.findByRole('link', { name: /3 grupos/ });
    const before = requests.length;
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(requests).toHaveLength(before);
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');
    });
    expect(screen.queryByText('La sesión venció, ingresá de nuevo.')).toBeNull();
    expect(requestsTo('POST', '/api/admin/logout')).toHaveLength(0);
  });

  it('no tiene violaciones de axe', async () => {
    server.use(adminHandlers.reports('open', OPEN_GROUPS));
    const { container } = renderWithProviders({ route: '/reports', session: SESSION });
    await screen.findByRole('link', { name: /3 grupos/ });
    expect(await axe(container)).toHaveNoViolations();
  });
});
