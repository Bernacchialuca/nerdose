import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import {
  FAILURES_ONE,
  UPCOMING_BIG_O,
  UPCOMING_EMPTY_CELL,
  UPCOMING_FAILURE,
  UPCOMING_OK,
  UPCOMING_PENDING,
  UPCOMING_REGEN_FAILED,
  UPCOMING_REJECTED_ITEM,
  UPCOMING_REPLACED,
  upcoming,
} from '@/test/fixtures/upcoming';
import { SESSION, SESSION_KEY } from '@/test/fixtures/reports';
import { useUpcomingClock } from '@/test/helpers';
import routerSource from '@/app/router.tsx?raw';
import { adminHandlers, apiError, requests, requestsTo, server } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

const UPCOMING_PATH = '/api/admin/challenges/upcoming';

const render = () => renderWithProviders({ route: '/upcoming', session: SESSION });

function cellOf(rowName: string, column: string): HTMLElement {
  const row = screen.getByRole('rowheader', { name: rowName }).closest('tr');
  if (!row) throw new Error('fila inexistente');
  const headers = screen.getAllByRole('columnheader').map((h) => h.textContent);
  const cell = within(row).getAllByRole('cell')[headers.indexOf(column) - 1];
  if (!cell) throw new Error('celda inexistente');
  return cell;
}

const grid = () => screen.findByRole('table');

describe('/upcoming · datos y sesión', () => {
  it('pide la ventana completa con Bearer y no toca endpoints de jugador (TS-8)', async () => {
    server.use(adminHandlers.upcoming(UPCOMING_OK));
    render();
    await grid();
    const calls = requestsTo('GET', UPCOMING_PATH);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.search).toBe('?days=14');
    expect(calls[0]?.headers.get('authorization')).toBe(`Bearer ${SESSION.token}`);
    expect(requests.some((r) => r.pathname.startsWith('/api/games/'))).toBe(false);
    expect(requests.some((r) => r.pathname === '/api/session')).toBe(false);
  });

  it('un 401 del contador cierra la sesión (TS-15)', async () => {
    server.use(
      adminHandlers.upcoming(UPCOMING_OK),
      adminHandlers.generationFailures(apiError('unauthorized', 'Sesión vencida'), { status: 401 }),
    );
    const { router } = render();
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');
    });
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    expect(await screen.findByText('La sesión venció, ingresá de nuevo.')).toBeInTheDocument();
  });

  it('un 401 de upcoming cierra la sesión sin mostrar el error de carga (TS-16)', async () => {
    server.use(adminHandlers.upcoming(apiError('unauthorized', 'Sesión vencida'), { status: 401 }));
    const { router } = render();
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');
    });
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    expect(await screen.findByText('La sesión venció, ingresá de nuevo.')).toBeInTheDocument();
    expect(screen.queryByText(/No pudimos cargar los próximos desafíos/)).toBeNull();
  });

  it('sin sesión redirige al login sin pedir nada (TS-53)', async () => {
    const { router } = renderWithProviders({ route: '/upcoming' });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');
    });
    expect(requestsTo('GET', UPCOMING_PATH)).toHaveLength(0);
  });
});

describe('P-03 · grilla', () => {
  it('muestra títulos, columnas, filas y un botón Regenerar por celda (TS-17)', async () => {
    server.use(adminHandlers.upcoming(UPCOMING_OK));
    render();
    const heading = await screen.findByRole('heading', { level: 1, name: 'Próximos desafíos' });
    await grid();
    await waitFor(() => {
      expect(heading).toHaveFocus();
    });
    expect(document.title).toBe('Próximos · Admin · nerdose');
    expect(
      screen.getByText('Del 2026-12-02 al 2026-12-15 (UTC) · 3 juegos · hoy no se muestra'),
    ).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Próximos desafíos por día y juego' })).toBeVisible();
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Día',
      'Devdle',
      'Grep Grid',
      'Tech Timeline',
    ]);
    const rows = screen.getAllByRole('rowheader').map((h) => h.textContent);
    expect(rows).toHaveLength(14);
    expect(rows[0]).toBe('02/12 #32');
    expect(rows[13]).toBe('15/12 #45');
    expect(screen.queryByText(/01\/12|2026-12-01/)).toBeNull();
    expect(screen.getAllByRole('button', { name: /^Regenerar / })).toHaveLength(42);
    expect(screen.queryByText(/regeneración en curso|No se pudo regenerar/)).toBeNull();
  });

  it('las columnas siguen la respuesta (TS-18)', async () => {
    server.use(adminHandlers.upcoming(UPCOMING_BIG_O));
    render();
    await grid();
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Día',
      'Devdle',
      'Grep Grid',
      'Tech Timeline',
      'Big O',
    ]);
    expect(screen.getByText(/· 4 juegos ·/)).toBeInTheDocument();
    // TS-22: el client de Big O no se baja hasta abrir un detalle
    expect(document.querySelector('[lang="en"]')).toBeNull();
    expect(screen.queryByText('Cargando preview…')).toBeNull();
    expect(screen.queryByRole('tabpanel')).toBeNull();
  });

  it('la leyenda lista los seis estados (TS-19)', async () => {
    server.use(adminHandlers.upcoming(UPCOMING_OK));
    render();
    await grid();
    const items = within(screen.getByRole('list', { name: 'Estados de una celda' })).getAllByRole(
      'listitem',
    );
    expect(items.map((i) => i.textContent?.replace(/ /g, ' '))).toEqual([
      '✓ Aprobado',
      '○ Sin desafío',
      '⚠ Falla de generación',
      '↻ Regenerando…',
      '✗ Regeneración fallida',
      '⚠ Usa un ítem rechazado',
    ]);
  });

  it('muestra «Cargando» mientras espera (TS-20)', async () => {
    server.use(adminHandlers.upcomingPending());
    render();
    expect(await screen.findByRole('status')).toHaveTextContent('Cargando próximos desafíos…');
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('distingue el error de carga y permite reintentar (TS-21)', async () => {
    server.use(adminHandlers.upcoming(apiError('internal_error', 'x'), { status: 500 }));
    const { user } = render();
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No pudimos cargar los próximos desafíos. Probá de nuevo.');
    expect(screen.queryByRole('table')).toBeNull();
    server.use(adminHandlers.upcoming(UPCOMING_OK));
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    await grid();
    expect(screen.getAllByRole('rowheader')).toHaveLength(14);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('falla de generación: celda destacada sin acción y aviso anunciado (TS-22)', async () => {
    server.use(
      adminHandlers.upcoming(UPCOMING_FAILURE),
      adminHandlers.generationFailures(FAILURES_ONE),
    );
    render();
    await grid();
    const cell = cellOf('02/12 #32', 'Devdle');
    expect(cell).toHaveTextContent(
      'Sin desafío · Falla de generación · 20 intentos · no_valid_term',
    );
    expect(within(cell).queryByRole('button')).toBeNull();
    const text =
      '1 juego no tiene desafío para mañana: Devdle (2026-12-02), falla tras 20 intentos. Se reintenta en la próxima corrida.';
    const notice = screen.getByText(text);
    expect(notice.closest('[aria-live="polite"]')).not.toBeNull();
    const nav = await screen.findByRole('link', { name: /1 falla de generación activa/ });
    expect(nav).toHaveTextContent('Próximos (1)');
  });

  it('celda vacía sin falla (TS-23)', async () => {
    server.use(adminHandlers.upcoming(UPCOMING_EMPTY_CELL));
    render();
    await grid();
    const cell = cellOf('03/12 #33', 'Tech Timeline');
    expect(cell).toHaveTextContent('Sin desafío');
    expect(within(cell).queryByRole('button')).toBeNull();
    expect(screen.queryByText(/no tiene desafío|no tienen desafío/)).toBeNull();
  });

  it('regeneración pendiente en la grilla (TS-24)', async () => {
    server.use(adminHandlers.upcoming(UPCOMING_PENDING));
    useUpcomingClock();
    render();
    await grid();
    expect(
      screen.getByRole('button', { name: /Regenerando….*regeneración pendiente/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Regenerar Grep Grid #35' })).toBeNull();
    expect(
      screen.getByText(
        'Hay una regeneración en curso. La grilla se actualiza sola cada 5 segundos.',
      ),
    ).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('regeneración fallida en la grilla (TS-25)', async () => {
    server.use(adminHandlers.upcoming(UPCOMING_REGEN_FAILED));
    render();
    await grid();
    expect(cellOf('05/12 #35', 'Grep Grid')).toHaveTextContent(
      'Aprobado · Regeneración fallida: overlap_conflict',
    );
    expect(screen.getByRole('button', { name: 'Regenerar Grep Grid #35' })).toBeEnabled();
    expect(
      screen.getByText(
        'No se pudo regenerar Grep Grid del 2026-12-05: ningún reemplazo pasó la verificación (overlap_conflict). Queda el actual.',
      ),
    ).toBeInTheDocument();
  });

  it('ítem rechazado: aviso y Regenerar sin regenerar solo (TS-26)', async () => {
    server.use(adminHandlers.upcoming(UPCOMING_REJECTED_ITEM));
    render();
    await grid();
    expect(cellOf('05/12 #35', 'Devdle')).toHaveTextContent('Usa un ítem rechazado: CAP theorem');
    expect(screen.getByRole('button', { name: 'Regenerar Devdle #35' })).toBeEnabled();
    expect(requests.filter((r) => r.method === 'POST')).toHaveLength(0);
  });

  it('la grilla no carga ningún client (TS-27)', async () => {
    server.use(adminHandlers.upcoming(UPCOMING_OK));
    render();
    await grid();
    expect(document.querySelector('[lang="en"]')).toBeNull();
    expect(screen.queryByText('Cargando preview…')).toBeNull();
  });
});

describe('P-03 · accesibilidad e idioma', () => {
  it('axe sin violaciones en default, avisos, loading y error (TS-47)', async () => {
    const combined = upcoming({
      '2026-12-02:devdle': {
        challenge: null,
        regeneration: null,
        failure: { attempts: 20, last_reason: 'no_valid_term', updated_at: 'u' },
      },
      '2026-12-05:grep-grid': UPCOMING_PENDING.days[3]?.games[1] ?? {},
      '2026-12-06:timeline': UPCOMING_REGEN_FAILED.days[3]?.games[1] ?? {},
    });
    server.use(adminHandlers.upcoming(UPCOMING_OK));
    const ok = render();
    await grid();
    expect(await axe(ok.container)).toHaveNoViolations();
    ok.unmount();

    server.use(adminHandlers.upcoming(combined));
    const warned = render();
    await grid();
    expect(await axe(warned.container)).toHaveNoViolations();
    warned.unmount();

    server.use(adminHandlers.upcomingPending());
    const loading = render();
    await screen.findByRole('status');
    expect(await axe(loading.container)).toHaveNoViolations();
    loading.unmount();

    server.use(adminHandlers.upcoming(apiError('internal_error', 'x'), { status: 500 }));
    const failed = render();
    await screen.findByRole('alert');
    expect(await axe(failed.container)).toHaveNoViolations();
  });

  it('el admin queda en español y solo el panel EN declara inglés (TS-50)', async () => {
    server.use(adminHandlers.upcoming(UPCOMING_OK));
    const initialLang = document.documentElement.lang;
    const { user } = render();
    await grid();
    await user.click(
      within(cellOf('02/12 #32', 'Devdle')).getByRole('button', { name: /Devdle #32, 2026-12-02/ }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Devdle #32' });
    await waitFor(() => {
      expect(dialog.querySelector('[lang="en"]')).not.toBeNull();
    });
    expect(document.documentElement.lang).toBe(initialLang);
    expect(dialog.querySelectorAll('[lang="en"]')).toHaveLength(1);
    expect(within(dialog).getByText('Intento 0 · generator 1.4.0')).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: 'Datos del desafío' })).toBeInTheDocument();
    expect(
      within(dialog).getByRole('heading', { name: 'Log de verificación' }),
    ).toBeInTheDocument();
  });
});

describe('P-03 · polling y reemplazo', () => {
  it('con un pendiente refetchea cada 5 s y la celda vuelve a Aprobado (TS-9)', async () => {
    useUpcomingClock();
    server.use(
      adminHandlers.upcomingSequence([UPCOMING_PENDING, UPCOMING_PENDING, UPCOMING_REPLACED]),
    );
    render();
    await grid();
    expect(cellOf('05/12 #35', 'Grep Grid')).toHaveTextContent('Regenerando…');
    await vi.advanceTimersByTimeAsync(5_000);
    await waitFor(() => {
      expect(requestsTo('GET', UPCOMING_PATH)).toHaveLength(2);
    });
    await vi.advanceTimersByTimeAsync(5_000);
    await waitFor(() => {
      expect(requestsTo('GET', UPCOMING_PATH)).toHaveLength(3);
    });
    await waitFor(() => {
      expect(cellOf('05/12 #35', 'Grep Grid')).toHaveTextContent(/✓\s*Aprobado/);
    });
    await vi.advanceTimersByTimeAsync(30_000);
    expect(requestsTo('GET', UPCOMING_PATH)).toHaveLength(3);
    vi.useRealTimers();
  });

  it('un pedido cancelado deja de verse pendiente (TS-11)', async () => {
    useUpcomingClock();
    server.use(adminHandlers.upcomingSequence([UPCOMING_PENDING, UPCOMING_OK]));
    render();
    await grid();
    await vi.advanceTimersByTimeAsync(5_000);
    await waitFor(() => {
      expect(cellOf('05/12 #35', 'Grep Grid')).toHaveTextContent(/✓\s*Aprobado/);
    });
    expect(screen.getByRole('button', { name: 'Regenerar Grep Grid #35' })).toBeInTheDocument();
    expect(screen.queryByText(/regeneración en curso/)).toBeNull();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(requestsTo('GET', UPCOMING_PATH)).toHaveLength(2);
    vi.useRealTimers();
  });
});

describe('ruta (TS-52)', () => {
  it('queda registrada de forma lazy bajo el layout protegido', async () => {
    expect(routerSource).toContain(
      "{ path: 'upcoming', lazy: () => import('@/modules/upcoming/routes/upcoming') }",
    );
    const mod = await import('./upcoming');
    expect(typeof mod.Component).toBe('function');
  });
});
