import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { BANK_TERMS_PAGE } from '@/test/fixtures/banks';
import { STOCK_OK } from '@/test/fixtures/content-stock';
import { METRICS_OK } from '@/test/fixtures/metrics';
import { useMetricsClock } from '@/test/helpers';
import { renderWithProviders } from '@/test/render';
import { OPEN_GROUPS, SESSION, SESSION_KEY } from '@/test/fixtures/reports';
import { FAILURES_NONE, FAILURES_ONE } from '@/test/fixtures/upcoming';
import { adminHandlers, apiError, requests, requestsTo, server } from '@/test/msw';

describe('Shell', () => {
  it('encabezado con Reportes (N), Próximos, Bancos, Stock, Métricas y Cerrar sesión (TS-23)', async () => {
    server.use(adminHandlers.reports('open', OPEN_GROUPS));
    const { container } = renderWithProviders({ route: '/reports', session: SESSION });
    const nav = await screen.findByRole('navigation');
    const link = await within(nav).findByRole('link', { name: /3 grupos de reportes abiertos/ });
    expect(link).toHaveTextContent('Reportes (3)');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(
      within(nav)
        .getAllByRole('link')
        .map((l) => l.textContent),
    ).toEqual([expect.stringMatching(/^Reportes/), 'Próximos', 'Bancos', 'Stock', 'Métricas']);
    expect(within(nav).getAllByRole('button')).toHaveLength(1);
    expect(within(nav).getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Stock' })).not.toHaveAttribute('aria-current');
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

  it('encabezado con Stock entre Bancos y Métricas (TS-7)', async () => {
    server.use(
      adminHandlers.contentStock(STOCK_OK),
      adminHandlers.reports('open', OPEN_GROUPS),
      adminHandlers.generationFailures(FAILURES_ONE),
    );
    renderWithProviders({ route: '/content', session: SESSION });
    const nav = await screen.findByRole('navigation', { name: 'Secciones' });
    await within(nav).findByRole('link', { name: /1 falla de generación activa/ });
    await within(nav).findByRole('link', { name: /3 grupos de reportes abiertos/ });
    const links = within(nav).getAllByRole('link');
    expect(links).toHaveLength(5);
    expect(links[0]).toHaveTextContent(/^Reportes \(3\)/);
    expect(links[1]).toHaveTextContent(/^Próximos \(1\)/);
    expect(links[2]).toHaveTextContent(/^Bancos$/);
    expect(links[3]).toBe(within(nav).getByRole('link', { name: 'Stock' }));
    expect(links[3]).toHaveAttribute('href', '/content');
    expect(links[3]).toHaveAttribute('aria-current', 'page');
    expect(nav.lastElementChild).toBe(within(nav).getByRole('button', { name: 'Cerrar sesión' }));
  });

  it('encabezado con Métricas entre Stock y Cerrar sesión (TS-40)', async () => {
    useMetricsClock();
    try {
      server.use(
        adminHandlers.metrics(METRICS_OK),
        adminHandlers.reports('open', OPEN_GROUPS),
        adminHandlers.generationFailures(FAILURES_ONE),
      );
      const first = renderWithProviders({
        route: '/metrics?from=2026-12-01&to=2026-12-03',
        session: SESSION,
      });
      const nav = await screen.findByRole('navigation', { name: 'Secciones' });
      await within(nav).findByRole('link', { name: /1 falla de generación activa/ });
      await within(nav).findByRole('link', { name: /3 grupos de reportes abiertos/ });
      const links = within(nav).getAllByRole('link');
      expect(links).toHaveLength(5);
      expect(links[0]).toHaveTextContent(/^Reportes \(3\)/);
      expect(links[1]).toHaveTextContent(/^Próximos \(1\)/);
      expect(links[2]).toHaveTextContent(/^Bancos$/);
      expect(links[3]).toHaveTextContent(/^Stock$/);
      expect(links[4]).toBe(within(nav).getByRole('link', { name: 'Métricas' }));
      expect(links[4]).toHaveAttribute('href', '/metrics');
      expect(links[4]).toHaveAttribute('aria-current', 'page');
      expect(nav.lastElementChild).toBe(within(nav).getByRole('button', { name: 'Cerrar sesión' }));
      first.unmount();

      renderWithProviders({ route: '/reports', session: SESSION });
      const other = await screen.findByRole('navigation', { name: 'Secciones' });
      await within(other).findByRole('link', { name: /3 grupos de reportes abiertos/ });
      expect(within(other).getByRole('link', { name: 'Métricas' })).not.toHaveAttribute(
        'aria-current',
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('encabezado con Bancos entre Próximos y Stock, activo en /banks', async () => {
    server.use(
      adminHandlers.bankItems(BANK_TERMS_PAGE),
      adminHandlers.reports('open', OPEN_GROUPS),
    );
    renderWithProviders({ route: '/banks', session: SESSION });
    const nav = await screen.findByRole('navigation', { name: 'Secciones' });
    await within(nav).findByRole('link', { name: /3 grupos de reportes abiertos/ });
    const links = within(nav).getAllByRole('link');
    expect(links[1]).toHaveTextContent(/^Próximos/);
    expect(links[2]).toBe(within(nav).getByRole('link', { name: 'Bancos' }));
    expect(links[2]).toHaveAttribute('href', '/banks');
    expect(links[2]).toHaveAttribute('aria-current', 'page');
    expect(links[3]).toHaveTextContent(/^Stock$/);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Bancos de contenido' }),
    ).toBeInTheDocument();
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
