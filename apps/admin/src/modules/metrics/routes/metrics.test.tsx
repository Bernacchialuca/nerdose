import { act, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import routerSource from '@/app/router.tsx?raw';
import { METRICS_EMPTY, METRICS_OK } from '@/test/fixtures/metrics';
import { OPEN_GROUPS, SESSION, SESSION_KEY } from '@/test/fixtures/reports';
import { useFixedClock, useMetricsClock } from '@/test/helpers';
import { adminHandlers, apiError, requests, requestsTo, server } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

import routeSource from './metrics.tsx?raw';

const PATH = '/api/admin/metrics';
const URL_OK = '/metrics?from=2026-12-01&to=2026-12-03';
const SAME = '?from=2026-12-01&to=2026-12-03';
const NO_DATA = () => {
  expect(screen.queryByText('Jugadores únicos')).toBeNull();
  expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
};

function render(route: string, withSession = true) {
  server.use(adminHandlers.reports('open', OPEN_GROUPS));
  return renderWithProviders(withSession ? { route, session: SESSION } : { route });
}

const input = (label: 'Desde' | 'Hasta') => screen.getByLabelText(label);

async function setDate(
  user: ReturnType<typeof renderWithProviders>['user'],
  label: 'Desde' | 'Hasta',
  value: string,
) {
  const el = input(label);
  await user.clear(el);
  if (value) await user.type(el, value);
}

afterEach(() => {
  vi.useRealTimers();
});

describe('Métricas (P-05): rango y estados', () => {
  it('usa el rango por defecto con Bearer y sin polling (TS-9)', async () => {
    useFixedClock();
    server.use(adminHandlers.metrics(METRICS_OK));
    const { router } = render('/metrics');
    await screen.findByRole('heading', { level: 2, name: 'Jugadores diarios' });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    const calls = requestsTo('GET', PATH);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.search).toBe('?from=2026-10-13&to=2026-11-11');
    expect(calls[0]?.headers.get('authorization')).toBe('Bearer eyJhbGciOiJIUzI1NiJ9.test.sig');
    expect(input('Desde')).toHaveValue('2026-10-13');
    expect(input('Hasta')).toHaveValue('2026-11-11');
    expect(router.state.location.search).toBe('');
    expect(requests.filter((r) => r.method !== 'GET')).toHaveLength(0);
    expect(requests.filter((r) => /^\/api\/(games|session|me)/.test(r.pathname))).toHaveLength(0);
  });

  it('toma el rango de la URL (TS-10)', async () => {
    useMetricsClock();
    server.use(adminHandlers.metrics(METRICS_OK));
    render(URL_OK);
    await screen.findByRole('heading', { level: 2, name: 'Jugadores diarios' });
    expect(requestsTo('GET', PATH)).toHaveLength(1);
    expect(requestsTo('GET', PATH)[0]?.search).toBe(SAME);
    expect(input('Desde')).toHaveValue('2026-12-01');
    expect(input('Hasta')).toHaveValue('2026-12-03');
  });

  it('título, foco, nota y paneles (TS-11)', async () => {
    useMetricsClock();
    server.use(adminHandlers.metrics(METRICS_OK));
    render(URL_OK);
    const h1 = await screen.findByRole('heading', { level: 1, name: 'Métricas' });
    await screen.findByRole('heading', { level: 2, name: 'Jugadores diarios' });
    expect(h1).toHaveFocus();
    expect(document.title).toBe('Métricas · Admin · nerdose');
    expect(screen.getByText('Fechas en UTC · hasta 366 días · sin fechas futuras')).toBeVisible();
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Jugadores diarios',
      'Retención por cohorte',
      'Distribución de rachas',
      'Calidad por desafío',
    ]);
    expect(screen.getByRole('button', { name: 'Consultar' })).not.toHaveAttribute('aria-disabled');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getAllByRole('main')).toHaveLength(1);
  });

  it('consulta otro rango y vuelve atrás (TS-12)', async () => {
    useMetricsClock();
    server.use(
      adminHandlers.metricsByRange({
        [SAME]: METRICS_OK,
        '?from=2026-11-01&to=2026-11-30': METRICS_EMPTY,
      }),
    );
    const { user, router } = render(URL_OK);
    await screen.findByText('1.284');
    await setDate(user, 'Desde', '2026-11-01');
    await setDate(user, 'Hasta', '2026-11-30');
    await user.click(screen.getByRole('button', { name: 'Consultar' }));
    await waitFor(() => {
      expect(router.state.location.search).toBe('?from=2026-11-01&to=2026-11-30');
    });
    await screen.findByRole('heading', { level: 2, name: 'Jugadores diarios' });
    expect(requestsTo('GET', PATH)[1]?.search).toBe('?from=2026-11-01&to=2026-11-30');
    expect(screen.getByText('Jugadores únicos').previousElementSibling).toHaveTextContent(/^0$/);
    await act(async () => {
      await router.navigate(-1);
    });
    await waitFor(() => {
      expect(router.state.location.search).toBe(SAME);
    });
    await screen.findByText('1.284');
    expect(input('Desde')).toHaveValue('2026-12-01');
    expect(input('Hasta')).toHaveValue('2026-12-03');
  });

  it('from > to: mensaje, campos marcados y no consulta (TS-13)', async () => {
    useMetricsClock();
    server.use(adminHandlers.metrics(METRICS_OK));
    const { user, router } = render(URL_OK);
    await screen.findByText('1.284');
    await setDate(user, 'Desde', '2026-12-05');
    await setDate(user, 'Hasta', '2026-12-01');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'La fecha inicial no puede ser posterior a la final.',
    );
    expect(input('Desde')).toHaveAttribute('aria-invalid', 'true');
    expect(input('Hasta')).toHaveAttribute('aria-invalid', 'true');
    const button = screen.getByRole('button', { name: 'Consultar' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    await user.click(button);
    expect(requestsTo('GET', PATH)).toHaveLength(1);
    expect(router.state.location.search).toBe(SAME);
    NO_DATA();
  });

  it('campo vacío (TS-14)', async () => {
    useMetricsClock();
    server.use(adminHandlers.metrics(METRICS_OK));
    const { user } = render(URL_OK);
    await screen.findByText('1.284');
    await user.clear(input('Desde'));
    expect(screen.getByRole('alert')).toHaveTextContent('Elegí las dos fechas del rango.');
    expect(input('Desde')).toHaveAttribute('aria-invalid', 'true');
    expect(input('Hasta')).not.toHaveAttribute('aria-invalid');
    expect(screen.getByRole('button', { name: 'Consultar' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('fecha futura (TS-15)', async () => {
    useMetricsClock();
    server.use(adminHandlers.metrics(METRICS_OK));
    const { user } = render(URL_OK);
    await screen.findByText('1.284');
    await setDate(user, 'Hasta', '2026-12-11');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'El rango no puede incluir fechas futuras. Hoy es 10/12/2026 (UTC).',
    );
    expect(input('Hasta')).toHaveAttribute('aria-invalid', 'true');
    expect(input('Desde')).not.toHaveAttribute('aria-invalid');
    expect(requestsTo('GET', PATH)).toHaveLength(1);
  });

  it('tope de 366 días, inclusive (TS-16)', async () => {
    useMetricsClock();
    server.use(adminHandlers.metrics(METRICS_OK));
    const { user } = render(URL_OK);
    await screen.findByText('1.284');
    await setDate(user, 'Desde', '2025-12-09');
    await setDate(user, 'Hasta', '2026-12-10');
    expect(screen.getByRole('alert')).toHaveTextContent('El rango no puede superar los 366 días.');
    expect(input('Desde')).toHaveAttribute('aria-invalid', 'true');
    await setDate(user, 'Desde', '2025-12-10');
    expect(screen.queryByRole('alert')).toBeNull();
    const button = screen.getByRole('button', { name: 'Consultar' });
    expect(button).not.toHaveAttribute('aria-disabled');
    await user.click(button);
    await waitFor(() => {
      expect(requestsTo('GET', PATH)).toHaveLength(2);
    });
    expect(requestsTo('GET', PATH)[1]?.search).toBe('?from=2025-12-10&to=2026-12-10');
  });

  it('una URL con rango inválido no consulta (TS-17)', async () => {
    useMetricsClock();
    server.use(adminHandlers.metrics(METRICS_OK));
    render('/metrics?from=2026-12-05&to=2026-12-01');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La fecha inicial no puede ser posterior a la final.',
    );
    await waitFor(() => {
      expect(requestsTo('GET', PATH)).toHaveLength(0);
    });
    NO_DATA();
    expect(input('Desde')).toHaveValue('2026-12-05');
  });

  it('corregir el rango habilita «Consultar» y vuelve a mostrar los datos (TS-18)', async () => {
    useMetricsClock();
    server.use(adminHandlers.metrics(METRICS_OK));
    const { user } = render(URL_OK);
    await screen.findByText('1.284');
    await setDate(user, 'Desde', '2026-12-05');
    await setDate(user, 'Hasta', '2026-12-01');
    await setDate(user, 'Desde', '2026-11-25');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(input('Desde')).not.toHaveAttribute('aria-invalid');
    expect(input('Hasta')).not.toHaveAttribute('aria-invalid');
    expect(screen.getByRole('button', { name: 'Consultar' })).not.toHaveAttribute('aria-disabled');
    expect(screen.getByText('1.284')).toBeVisible();
    expect(requestsTo('GET', PATH)).toHaveLength(1);
  });

  it('un 422 del servidor muestra su message (TS-19)', async () => {
    useMetricsClock();
    server.use(
      adminHandlers.metrics(
        apiError('validation_error', 'El rango no puede incluir fechas futuras'),
        { status: 422 },
      ),
    );
    render('/metrics?from=2026-12-01&to=2026-12-10');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El rango no puede incluir fechas futuras',
    );
    expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull();
    NO_DATA();
    expect(sessionStorage.getItem(SESSION_KEY)).not.toBeNull();
    expect(requestsTo('GET', PATH)).toHaveLength(1);
  });

  it('estado de carga (TS-20)', async () => {
    useMetricsClock();
    server.use(adminHandlers.metricsPending());
    render(URL_OK);
    expect(await screen.findByRole('status')).toHaveTextContent('Consultando métricas…');
    const button = screen.getByRole('button', { name: 'Consultando…' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    NO_DATA();
  });

  it('error de sistema con «Reintentar» (TS-21)', async () => {
    useMetricsClock();
    server.use(
      adminHandlers.metricsSequence([
        { body: apiError('internal_error', 'Error interno'), init: { status: 500 } },
        { body: METRICS_OK },
      ]),
    );
    const { user } = render(URL_OK);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos cargar las métricas. Probá de nuevo.',
    );
    expect(screen.queryByText('Error interno')).toBeNull();
    NO_DATA();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    await screen.findByText('1.284');
    expect(requestsTo('GET', PATH)).toHaveLength(2);
    expect(requestsTo('GET', PATH)[1]?.search).toBe(SAME);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('error de red (TS-22)', async () => {
    useMetricsClock();
    server.use(adminHandlers.metricsNetworkError());
    render(URL_OK);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos cargar las métricas. Probá de nuevo.',
    );
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeVisible();
    NO_DATA();
  });

  it('un 401 vuelve al login sin cifras (TS-23)', async () => {
    useMetricsClock();
    server.use(adminHandlers.metrics(apiError('unauthorized', 'Sesión vencida'), { status: 401 }));
    const { router } = render(URL_OK);
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');
    });
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    expect(screen.queryByText('1.284')).toBeNull();
    expect(screen.queryByText('Jugadores únicos')).toBeNull();
    expect(requestsTo('GET', PATH)).toHaveLength(1);
  });

  it('sin sesión redirige y no consulta (TS-24)', async () => {
    server.use(adminHandlers.metrics(METRICS_OK));
    const { router } = render('/metrics', false);
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');
    });
    expect(requestsTo('GET', PATH)).toHaveLength(0);
    expect(screen.queryByRole('heading', { level: 1, name: 'Métricas' })).toBeNull();
  });

  it('la ruta está registrada y es lazy (TS-25)', () => {
    expect(routerSource).toContain(
      "{ path: 'metrics', lazy: () => import('@/modules/metrics/routes/metrics') }",
    );
    expect(routeSource).toContain('export function Component()');
  });

  it('no tiene violaciones de axe en error de validación', async () => {
    useMetricsClock();
    server.use(adminHandlers.metrics(METRICS_OK));
    const { container, user } = render(URL_OK);
    await screen.findByText('1.284');
    await setDate(user, 'Desde', '2026-12-05');
    await setDate(user, 'Hasta', '2026-12-01');
    expect(await axe(container)).toHaveNoViolations();
  });
});
