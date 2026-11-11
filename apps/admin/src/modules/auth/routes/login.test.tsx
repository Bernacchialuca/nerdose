import { act, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { renderWithProviders } from '@/test/render';
import { OPEN_GROUPS, SESSION, SESSION_KEY } from '@/test/fixtures/reports';
import { adminHandlers, apiError, requests, requestsTo, server } from '@/test/msw';

const rateLimited = (seconds: number) =>
  adminHandlers.login(apiError('rate_limited', 'Demasiadas solicitudes'), {
    status: 429,
    headers: { 'Retry-After': String(seconds) },
  });

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date('2026-11-11T12:00:00Z'));
});
afterEach(() => {
  vi.useRealTimers();
});

describe('login (P-01)', () => {
  it('sin sesión, /reports lleva al login sin pedir reportes (TS-9)', async () => {
    renderWithProviders({ route: '/reports' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Ingresar' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByLabelText('Contraseña')).toHaveFocus();
    });
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
    expect(requestsTo('GET', '/api/admin/reports')).toHaveLength(0);
  });

  it('/ redirige a /reports con sesión (TS-10)', async () => {
    server.use(adminHandlers.reports('open', OPEN_GROUPS));
    const { router } = renderWithProviders({ route: '/', session: SESSION });
    expect(await screen.findByRole('heading', { level: 1, name: 'Reportes' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/reports');
  });

  it('/login con sesión redirige a /reports (TS-11)', async () => {
    server.use(adminHandlers.reports('open', OPEN_GROUPS));
    const { router } = renderWithProviders({ route: '/login', session: SESSION });
    await screen.findByRole('heading', { level: 1, name: 'Reportes' });
    expect(router.state.location.pathname).toBe('/reports');
  });

  it('login correcto guarda la sesión y navega a Reportes (TS-12)', async () => {
    server.use(adminHandlers.login(SESSION), adminHandlers.reports('open', OPEN_GROUPS));
    const { user, router } = renderWithProviders({ route: '/login' });
    await screen.findByLabelText('Contraseña');
    await user.type(screen.getByLabelText('Contraseña'), 'correcta{Enter}');
    const h1 = await screen.findByRole('heading', { level: 1, name: 'Reportes' });
    const [login] = requestsTo('POST', '/api/admin/login');
    expect(login?.headers.get('content-type')).toBe('application/json');
    expect(login?.body).toEqual({ password: 'correcta' });
    expect(sessionStorage.getItem(SESSION_KEY)).toBe(JSON.stringify(SESSION));
    expect(router.state.location.pathname).toBe('/reports');
    await waitFor(() => {
      expect(h1).toHaveFocus();
    });
    expect(document.title).toBe('Reportes · Admin · nerdose');
  });

  it('muestra loading y no envía dos veces (TS-13)', async () => {
    server.use(adminHandlers.login(SESSION), adminHandlers.reports('open', OPEN_GROUPS));
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const original = window.fetch;
    vi.spyOn(window, 'fetch').mockImplementation(async (...args) => {
      await gate;
      return original(...args);
    });
    const { user } = renderWithProviders({ route: '/login' });
    await screen.findByLabelText('Contraseña');
    await user.type(screen.getByLabelText('Contraseña'), 'x{Enter}');
    const button = await screen.findByRole('button', { name: 'Ingresando…' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByLabelText('Contraseña')).toBeDisabled();
    await user.click(button);
    expect(vi.mocked(window.fetch)).toHaveBeenCalledTimes(1);
    release();
    await screen.findByRole('heading', { level: 1, name: 'Reportes' });
    vi.restoreAllMocks();
  });

  it('contraseña incorrecta: error del campo y se queda (TS-14)', async () => {
    server.use(
      adminHandlers.login(apiError('invalid_credentials', 'Contraseña incorrecta'), {
        status: 401,
      }),
    );
    const { user, router } = renderWithProviders({ route: '/login' });
    await screen.findByLabelText('Contraseña');
    await user.type(screen.getByLabelText('Contraseña'), 'mala{Enter}');
    const field = await screen.findByLabelText('Contraseña');
    await waitFor(() => {
      expect(field).toHaveAttribute('aria-invalid', 'true');
    });
    expect(field).toHaveAccessibleDescription('Contraseña incorrecta.');
    expect(router.state.location.pathname).toBe('/login');
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    expect(screen.queryByText(/No pudimos conectarnos/)).toBeNull();
  });

  it('campo vacío no envía y marca el campo (TS-15)', async () => {
    const { user } = renderWithProviders({ route: '/login' });
    await screen.findByLabelText('Contraseña');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));
    const field = screen.getByLabelText('Contraseña');
    expect(requests).toHaveLength(0);
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleDescription('Ingresá la contraseña.');
    expect(field).toHaveFocus();
  });

  it('429 bloquea el formulario con los minutos (TS-16, TS-18)', async () => {
    server.use(rateLimited(900));
    const { user } = renderWithProviders({ route: '/login' });
    await screen.findByLabelText('Contraseña');
    await user.type(screen.getByLabelText('Contraseña'), 'x{Enter}');
    expect(
      await screen.findByText('Demasiados intentos. Probá de nuevo en 15 minutos.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Ingresar' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(requestsTo('POST', '/api/admin/login')).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(900_000);
    });
    await waitFor(() => {
      expect(screen.queryByText(/Demasiados intentos/)).toBeNull();
    });
    expect(screen.getByLabelText('Contraseña')).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Ingresar' })).not.toHaveAttribute('aria-disabled');
    server.use(adminHandlers.login(SESSION), adminHandlers.reports('open', OPEN_GROUPS));
    await user.type(screen.getByLabelText('Contraseña'), 'y{Enter}');
    await screen.findByRole('heading', { level: 1, name: 'Reportes' });
    expect(requestsTo('POST', '/api/admin/login')).toHaveLength(2);
  });

  it('redondea los minutos hacia arriba (TS-17)', async () => {
    server.use(rateLimited(661));
    const { user } = renderWithProviders({ route: '/login' });
    await screen.findByLabelText('Contraseña');
    await user.type(screen.getByLabelText('Contraseña'), 'x{Enter}');
    expect(
      await screen.findByText('Demasiados intentos. Probá de nuevo en 12 minutos.'),
    ).toBeInTheDocument();
  });

  it.each([
    ['red', adminHandlers.loginNetworkError()],
    ['5xx', adminHandlers.login(apiError('internal_error', 'x'), { status: 500 })],
  ])('error de sistema (%s) (TS-19)', async (_name, handler) => {
    server.use(handler);
    const { user } = renderWithProviders({ route: '/login' });
    await screen.findByLabelText('Contraseña');
    await user.type(screen.getByLabelText('Contraseña'), 'x{Enter}');
    expect(
      await screen.findByText('No pudimos conectarnos con el servidor. Probá de nuevo.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByLabelText('Contraseña')).toBeEnabled();
    });
    expect(screen.getByLabelText('Contraseña')).not.toHaveAttribute('aria-invalid');
  });

  it('sesión vencida durante el uso vuelve al login con aviso, y el login lleva a Reportes (TS-20, TS-21)', async () => {
    server.use(
      adminHandlers.reportsAny(apiError('unauthorized', 'Sesión vencida'), { status: 401 }),
    );
    const { router, user } = renderWithProviders({ route: '/reports', session: SESSION });
    expect(await screen.findByText('La sesión venció, ingresá de nuevo.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    expect(requestsTo('GET', '/api/admin/reports')).toHaveLength(1);

    server.use(adminHandlers.login(SESSION), adminHandlers.reports('open', OPEN_GROUPS));
    await user.type(screen.getByLabelText('Contraseña'), 'ok{Enter}');
    await screen.findByRole('heading', { level: 1, name: 'Reportes' });
    expect(router.state.location.pathname).toBe('/reports');
    expect(screen.queryByText('La sesión venció, ingresá de nuevo.')).toBeNull();
  });

  it('no tiene violaciones de axe: default, bloqueado y con error (TS-68)', async () => {
    const { container, user } = renderWithProviders({ route: '/login' });
    await screen.findByLabelText('Contraseña');
    expect(await axe(container)).toHaveNoViolations();
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await axe(container)).toHaveNoViolations();
  });

  it('axe: bloqueado (TS-68)', async () => {
    server.use(rateLimited(900));
    const { container, user } = renderWithProviders({ route: '/login' });
    await screen.findByLabelText('Contraseña');
    await user.type(screen.getByLabelText('Contraseña'), 'x{Enter}');
    await screen.findByText(/Demasiados intentos/);
    expect(await axe(container)).toHaveNoViolations();
  });
});
