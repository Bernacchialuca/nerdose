import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { countOf, errorResponse, recordCalls, settle } from '@/test/game-route-helpers';
import { myStatsEmpty, myStatsPage1, myStatsPage2 } from '@/test/fixtures/my-stats';
import { sessionFixture } from '@/test/fixtures/session';
import { todayNoSessionFixture } from '@/test/fixtures/today';
import { server } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

const STATS = '/api/me/stats?lang=es';
const PAGE2 = '/api/me/stats?lang=es&history_before=2026-11-02';

const useStats = (body: unknown) =>
  server.use(http.get('/api/me/stats', () => HttpResponse.json(body as object)));

async function renderStats() {
  const utils = renderWithProviders({ route: '/stats' });
  await screen.findByRole('heading', { level: 1, name: 'Estadísticas' });
  await screen.findByRole('heading', { level: 2, name: 'Actividad' });
  return utils;
}

const streakValue = () => document.querySelector('.text-display-streak-compact') as HTMLElement;
const dataRows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1);

describe('Pantalla /stats', () => {
  it('TS-19: la ruta existe, título y nav', async () => {
    await renderStats();
    expect(document.title).toBe('Estadísticas · nerdose');
    expect(screen.getAllByRole('link', { current: 'page' }).length).toBeGreaterThan(0);
  });

  it('TS-20: cargando', async () => {
    server.use(
      http.get('/api/me/stats', async () => {
        await new Promise(() => undefined);
        return HttpResponse.json(myStatsPage1);
      }),
    );
    renderWithProviders({ route: '/stats' });
    expect(await screen.findByText('Cargando tus estadísticas…')).toHaveAttribute('role', 'status');
    expect(screen.queryByText('racha global')).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('TS-21/22: racha y totales; racha 0 en gris', async () => {
    await renderStats();
    expect(screen.getByText('racha global', { exact: false })).toBeInTheDocument();
    expect(streakValue()).toHaveTextContent('4');
    expect(streakValue()).toHaveClass('text-streak');
    expect(screen.getByText('9 días')).toBeInTheDocument();
    expect(screen.getByText('Récord')).toBeInTheDocument();
    expect(screen.getByText('31')).toBeInTheDocument();
    expect(screen.getByText('Desafíos completados')).toBeInTheDocument();
  });

  it('TS-22: racha en 0 en gris', async () => {
    useStats({ ...myStatsPage1, global: { ...myStatsPage1.global, current_streak: 0 } });
    await renderStats();
    expect(streakValue()).toHaveTextContent('0');
    expect(streakValue()).toHaveClass('text-text-dim');
    expect(streakValue()).not.toHaveClass('text-streak');
    expect(screen.getByText('9 días')).toBeInTheDocument();
  });

  it('TS-23/24: tarjetas por juego en orden y StatsSummary lazy', async () => {
    await renderStats();
    const names = ['Devdle', 'Grep Grid', 'Tech Timeline', 'Big O', 'Bug Hunt'];
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(names);
    const devdle = screen.getByRole('article', { name: 'Devdle' });
    expect(devdle).toHaveAttribute('aria-labelledby');
    expect(devdle).toHaveTextContent('racha 3 · máx 7');
    expect(within(devdle).getByText('jugadas').previousElementSibling).toBeNull();
    expect(within(devdle).getByText('21')).toBeInTheDocument();
    expect(within(devdle).getByText('16')).toBeInTheDocument();
    expect(devdle).toHaveTextContent(/76\s%/);
    const bug = screen.getByRole('article', { name: 'Bug Hunt' });
    expect(within(bug).getByText('—')).toBeInTheDocument();
    expect(
      await within(devdle).findByRole('heading', { level: 4, name: 'intentos' }),
    ).toBeVisible();
    expect(await within(bug).findByText('Todavía no jugaste a este juego.')).toBeInTheDocument();
  });

  it('TS-25/26: heatmap anclado en today y detalle con teclado', async () => {
    await renderStats();
    const grid = screen.getByRole('grid', {
      name: '7 desafíos completados en los últimos 365 días',
    });
    const cell = within(grid).getByRole('button', {
      name: 'martes, 3 de noviembre de 2026: 2 de 5 desafíos completados',
    });
    expect(cell).toHaveAttribute('aria-current', 'date');
    expect(screen.getByText('Hoy · 2 de 5 completados')).toBeInTheDocument();
    expect(screen.getByText('últimos 365 días · desafíos completados por día')).toBeInTheDocument();
    cell.focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByText('lun 02/11 · 5 de 5 completados')).toBeInTheDocument();
  });

  it('TS-27/40: historial con estado en texto y clases por viewport', async () => {
    await renderStats();
    const table = screen.getByRole('table', { name: 'Historial de partidas completadas' });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((h) => h.textContent),
    ).toEqual(['Fecha', 'Desafío', 'Juego', 'Resultado']);
    const rows = dataRows();
    expect(rows).toHaveLength(3);
    expect(within(rows[0]!).getByRole('rowheader')).toHaveTextContent('mar 03/11');
    expect(rows[0]).toHaveTextContent('#128');
    expect(rows[0]).toHaveTextContent('Devdle');
    expect(rows[0]).toHaveTextContent('ganada · ✓ 4/6');
    expect(rows[1]).toHaveTextContent('perdida · 6/8');
    expect(rows[2]).toHaveTextContent('lun 02/11');
    expect(rows[2]).toHaveTextContent('anulada');
    expect(rows[2]).not.toHaveTextContent('anulado');
    const region = screen.getByRole('region', { name: 'Historial de partidas completadas' });
    expect(region).toHaveClass('@container');
    expect(region).toHaveAttribute('tabindex', '0');
    expect(table).toHaveClass('min-w-0', '@2xl:min-w-160');
    expect(screen.getByRole('columnheader', { name: 'Desafío' })).toHaveClass(
      'hidden',
      '@2xl:table-cell',
    );
    expect(
      within(rows[0]!).getByRole('rowheader').querySelector('.\\@2xl\\:hidden'),
    ).toHaveTextContent('· #128');
    expect(within(rows[0]!).getByText('ganada ·', { exact: false })).toHaveClass(
      'sr-only',
      '@2xl:not-sr-only',
    );
  });

  it('TS-28: «Ver más» agrega sin repetir, anuncia, mueve el foco y desaparece', async () => {
    const calls = recordCalls();
    await renderStats();
    await userEvent.click(screen.getByRole('button', { name: 'Ver más partidas' }));
    await waitFor(() => expect(dataRows()).toHaveLength(5));
    expect(countOf(calls, 'GET', PAGE2)).toBe(1);
    expect(screen.queryByRole('button', { name: 'Ver más partidas' })).not.toBeInTheDocument();
    expect(screen.getByText('Se agregaron 2 partidas')).toHaveAttribute('role', 'status');
    await waitFor(() => expect(document.activeElement).toBe(dataRows()[3]));
    expect(dataRows()[3]).toHaveTextContent('Tech Timeline');
  });

  it('TS-29: cargando más mantiene el foco y no duplica', async () => {
    const calls = recordCalls();
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.get('/api/me/stats', async ({ request }) => {
        if (new URL(request.url).searchParams.has('history_before')) {
          await gate;
          return HttpResponse.json(myStatsPage2);
        }
        return HttpResponse.json(myStatsPage1);
      }),
    );
    await renderStats();
    const button = screen.getByRole('button', { name: 'Ver más partidas' });
    await userEvent.click(button);
    const loading = await screen.findByRole('button', { name: /Cargando…/ });
    expect(loading).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(loading);
    expect(countOf(calls, 'GET', PAGE2)).toBe(1);
    expect(loading).toHaveFocus();
    release();
    await waitFor(() => expect(dataRows()).toHaveLength(5));
  });

  it('TS-30: sin más páginas no hay botón', async () => {
    useStats({ ...myStatsPage1, history_next_before: null });
    await renderStats();
    expect(screen.queryByRole('button', { name: 'Ver más partidas' })).not.toBeInTheDocument();
  });

  it('TS-31: falla «Ver más» y se reintenta', async () => {
    let fail = true;
    server.use(
      http.get('/api/me/stats', ({ request }) => {
        if (new URL(request.url).searchParams.has('history_before')) {
          return fail ? errorResponse('internal_error', 'x', 500) : HttpResponse.json(myStatsPage2);
        }
        return HttpResponse.json(myStatsPage1);
      }),
    );
    await renderStats();
    await userEvent.click(screen.getByRole('button', { name: 'Ver más partidas' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos cargar más partidas. Probá de nuevo.',
    );
    expect(dataRows()).toHaveLength(3);
    const retry = screen.getByRole('button', { name: 'Ver más partidas' });
    expect(retry).not.toHaveAttribute('aria-disabled');
    fail = false;
    await userEvent.click(retry);
    await waitFor(() => expect(dataRows()).toHaveLength(5));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ver más partidas' })).not.toBeInTheDocument();
  });

  it('TS-32: jugador nuevo', async () => {
    useStats(myStatsEmpty);
    await renderStats();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Todavía no jugaste' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Completá un desafío y acá vas a ver tus rachas, tu actividad y tu historial.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ir a los juegos/ })).toHaveAttribute('href', '/');
    expect(screen.getByText('0 días')).toBeInTheDocument();
    expect(screen.getAllByText('Todavía no jugaste a este juego.')).toHaveLength(5);
    expect(screen.getByText('Sin partidas en los últimos 365 días')).toBeInTheDocument();
    expect(screen.getByText('Todavía no hay partidas completadas.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ver más partidas' })).not.toBeInTheDocument();
  });

  it('TS-33: sin sesión (cookies bloqueadas) no llama a la api', async () => {
    server.use(http.get('/api/today', () => HttpResponse.json(todayNoSessionFixture)));
    const calls = recordCalls();
    renderWithProviders({ route: '/stats' });
    await screen.findByText('Sin sesión no hay progreso para mostrar');
    await settle();
    expect(countOf(calls, 'GET', STATS)).toBe(0);
    expect(countOf(calls, 'POST', '/api/session')).toBe(1);
    expect(screen.getAllByText('Activá las cookies para poder jugar')).toHaveLength(1);
    expect(
      screen.getByText(
        'Activá las cookies y recargá la página para empezar a jugar y guardar tus estadísticas.',
      ),
    ).toBeInTheDocument();
    const cta = screen.getByRole('button', { name: /Ir a los juegos/ });
    expect(cta).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getAllByText('Todavía no jugaste a este juego.')).toHaveLength(5);
    expect(screen.getByText('Sin partidas en los últimos 365 días')).toBeInTheDocument();
    expect(document.querySelector('[aria-current="date"]')).not.toBeNull();
  });

  it('TS-34: 401 con sesión activa muestra el banner y la invitación sin sesión', async () => {
    server.use(
      http.get('/api/me/stats', () =>
        errorResponse('no_session', 'Activá las cookies para jugar', 401),
      ),
    );
    const calls = recordCalls();
    renderWithProviders({ route: '/stats' });
    await screen.findByText('Sin sesión no hay progreso para mostrar');
    expect(countOf(calls, 'GET', STATS)).toBe(1);
    expect(countOf(calls, 'POST', '/api/session')).toBe(1);
    expect(screen.getAllByText('Activá las cookies para poder jugar')).toHaveLength(1);
    expect(screen.getByRole('button', { name: /Ir a los juegos/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('TS-35: 429 con «Reintentar»', async () => {
    let limited = true;
    server.use(
      http.get('/api/me/stats', () =>
        limited
          ? errorResponse('rate_limited', 'Demasiadas solicitudes', 429, { 'Retry-After': '5' })
          : HttpResponse.json(myStatsPage1),
      ),
    );
    const calls = recordCalls();
    renderWithProviders({ route: '/stats' });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Hiciste muchas consultas seguidas. Esperá unos segundos e intentá de nuevo.',
    );
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(countOf(calls, 'GET', STATS)).toBe(1);
    limited = false;
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(streakValue()).toHaveTextContent('4');
  });

  it('TS-36: error de red', async () => {
    server.use(http.get('/api/me/stats', () => HttpResponse.error()));
    renderWithProviders({ route: '/stats' });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos cargar tus estadísticas. Revisá tu conexión e intentá de nuevo.',
    );
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(screen.queryByText('racha global')).not.toBeInTheDocument();
  });

  it('TS-37: idioma inglés', async () => {
    server.use(
      http.post('/api/session', () => HttpResponse.json({ ...sessionFixture, locale: 'en' })),
    );
    const calls = recordCalls();
    renderWithProviders({ route: '/stats' });
    await screen.findByRole('heading', { level: 1, name: 'Statistics' });
    await screen.findByRole('table');
    expect(countOf(calls, 'GET', '/api/me/stats?lang=en')).toBe(1);
    expect(screen.getByText(/^76%$/)).toBeInTheDocument();
    expect(within(dataRows()[0]!).getByRole('rowheader')).toHaveTextContent('Tue 11/03');
    expect(await screen.findByRole('heading', { level: 4, name: 'tries' })).toBeInTheDocument();
    expect(screen.getByText('Today · 2 of 5 completed')).toBeInTheDocument();
  });

  it('TS-38: el cambio de idioma conserva las páginas cargadas', async () => {
    const calls = recordCalls();
    await renderStats();
    await userEvent.click(screen.getByRole('button', { name: 'Ver más partidas' }));
    await waitFor(() => expect(dataRows()).toHaveLength(5));
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    await waitFor(() =>
      expect(countOf(calls, 'GET', '/api/me/stats?lang=en&history_before=2026-11-02')).toBe(1),
    );
    expect(screen.queryByText('Loading your statistics…')).not.toBeInTheDocument();
    await waitFor(() => expect(dataRows()).toHaveLength(5));
    expect(dataRows()[0]).toHaveTextContent('won · ✓ 4/6');
    expect(calls.map((c) => c.path).filter((p) => p.includes('/api/me/stats'))).toEqual([
      STATS,
      PAGE2,
      '/api/me/stats?lang=en',
      '/api/me/stats?lang=en&history_before=2026-11-02',
    ]);
  });

  it('TS-39: tras invalidar, la pantalla muestra las cifras nuevas', async () => {
    const { queryClient } = await renderStats();
    expect(streakValue()).toHaveTextContent('4');
    server.use(
      http.get('/api/me/stats', () =>
        HttpResponse.json({
          ...myStatsPage1,
          global: { ...myStatsPage1.global, current_streak: 5 },
        }),
      ),
    );
    await queryClient.invalidateQueries({ queryKey: ['me', 'stats'] });
    await waitFor(() => expect(streakValue()).toHaveTextContent('5'));
  });

  it('TS-41: grillas intrínsecas', async () => {
    await renderStats();
    expect(
      document.querySelector(
        '.grid-cols-\\[repeat\\(auto-fit\\,minmax\\(min\\(240px\\,100\\%\\)\\,1fr\\)\\)\\]',
      ),
    ).not.toBeNull();
    const cards = screen.getByRole('article', { name: 'Devdle' }).parentElement;
    expect(cards).toHaveClass('items-start');
    expect(cards?.className).toContain('auto-fill,minmax(min(300px,100%),1fr)');
  });

  it('TS-42: accesibilidad en default, vacío y sin sesión', async () => {
    const { container } = await renderStats();
    expect(await axe(container)).toHaveNoViolations();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(5);
    for (const name of ['Actividad', 'Por juego', 'Historial']) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument();
    }
  });

  it('TS-42: axe en vacío', async () => {
    useStats(myStatsEmpty);
    const { container } = await renderStats();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('TS-42: axe sin sesión', async () => {
    server.use(http.get('/api/today', () => HttpResponse.json(todayNoSessionFixture)));
    const { container } = renderWithProviders({ route: '/stats' });
    await screen.findByText('Sin sesión no hay progreso para mostrar');
    expect(await axe(container)).toHaveNoViolations();
  });
});
