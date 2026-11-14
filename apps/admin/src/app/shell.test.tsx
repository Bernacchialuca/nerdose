import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { renderWithProviders } from '@/test/render';
import { OPEN_GROUPS, SESSION, SESSION_KEY } from '@/test/fixtures/reports';
import { FAILURES_NONE, FAILURES_ONE } from '@/test/fixtures/upcoming';
import { adminHandlers, apiError, requests, requestsTo, server } from '@/test/msw';

describe('Shell', () => {
  it('encabezado con Reportes (N), Próximos y Cerrar sesión (TS-23)', async () => {
    server.use(adminHandlers.reports('open', OPEN_GROUPS));
    const { container } = renderWithProviders({ route: '/reports', session: SESSION });
    const nav = await screen.findByRole('navigation');
    const link = await within(nav).findByRole('link', { name: /3 grupos de reportes abiertos/ });
    expect(link).toHaveTextContent('Reportes (3)');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getAllByRole('link')).toHaveLength(2);
    expect(within(nav).getAllByRole('button')).toHaveLength(1);
    expect(within(nav).getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
    expect(screen.queryByText(/Stock|Métricas/)).toBeNull();
    expect(container.firstElementChild).toHaveClass('bg-bg', 'text-text', 'font-mono');
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getAllByRole('main')).toHaveLength(1);
  });

  it('Próximos suma el contador de fallas activas (TS-13)', async () => {
    server.use(
      adminHandlers.reports('open', OPEN_GROUPS),
      adminHandlers.generationFailures(FAILURES_ONE),
    );
    renderWithProviders({ route: '/reports', session: SESSION });
    const nav = await screen.findByRole('navigation', { name: 'Secciones' });
    const link = await within(nav).findByRole('link', { name: /1 falla de generación activa/ });
    expect(link).toHaveTextContent('Próximos (1)');
    expect(link).toHaveAttribute('href', '/upcoming');
    const items = within(nav).getAllByRole('link');
    expect(items[0]).toHaveTextContent(/^Reportes/);
    expect(items[1]).toBe(link);
    expect(nav.lastElementChild).toBe(within(nav).getByRole('button', { name: 'Cerrar sesión' }));
    expect(screen.queryByText(/Stock|Métricas/)).toBeNull();
  });

  it('sin fallas o si el contador falla, Próximos va sin número (TS-14)', async () => {
    server.use(
      adminHandlers.reports('open', OPEN_GROUPS),
      adminHandlers.generationFailures(FAILURES_NONE),
    );
    const first = renderWithProviders({ route: '/reports', session: SESSION });
    await screen.findByRole('link', { name: /3 grupos/ });
    await waitFor(() => {
      expect(requestsTo('GET', '/api/admin/generation-failures')).toHaveLength(1);
    });
    expect(screen.getByRole('link', { name: 'Próximos' })).toHaveTextContent(/^Próximos$/);
    first.unmount();

    server.use(adminHandlers.generationFailures(apiError('internal_error', 'x'), { status: 500 }));
    renderWithProviders({ route: '/upcoming', session: SESSION });
    const link = await screen.findByRole('link', { name: 'Próximos' });
    await waitFor(() => {
      expect(requestsTo('GET', '/api/admin/generation-failures')).toHaveLength(2);
    });
    expect(link).toHaveTextContent(/^Próximos$/);
    expect(link).toHaveAttribute('aria-current', 'page');
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
