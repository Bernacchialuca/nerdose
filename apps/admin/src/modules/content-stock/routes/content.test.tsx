import { act, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { OPEN_GROUPS, SESSION, SESSION_KEY } from '@/test/fixtures/reports';
import {
  STOCK_EMPTY,
  FACTS_BANK,
  STOCK_LOW,
  STOCK_OK,
  STOCK_TERMS_LOW,
  TERMS_BANK,
  stock,
} from '@/test/fixtures/content-stock';
import { BANK_TERMS_PAGE } from '@/test/fixtures/banks';
import { useFixedClock } from '@/test/helpers';
import { renderWithProviders } from '@/test/render';
import { adminHandlers, apiError, requests, requestsTo, server } from '@/test/msw';

const PATH = '/api/admin/content/stock';

function pairs(el: HTMLElement): [string, string][] {
  return [...el.querySelectorAll('dt')].map((dt) => [
    dt.textContent,
    dt.nextElementSibling?.textContent ?? '',
  ]);
}

function rows(table: HTMLElement): string[][] {
  return [...table.querySelectorAll('tbody tr')].map((tr) =>
    [...tr.querySelectorAll('th, td')].map((c) => c.textContent),
  );
}

async function renderStock(body: unknown = STOCK_OK) {
  server.use(adminHandlers.contentStock(body), adminHandlers.reports('open', OPEN_GROUPS));
  const view = renderWithProviders({ route: '/content', session: SESSION });
  await screen.findByRole('heading', { level: 2, name: 'Última carga del dataset' });
  return view;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('Stock de contenido (P-04)', () => {
  it('pide una vez con Bearer y sin polling (TS-5)', async () => {
    useFixedClock();
    server.use(adminHandlers.contentStock(STOCK_OK));
    renderWithProviders({ route: '/content', session: SESSION });
    await screen.findByRole('heading', { level: 1, name: 'Stock de contenido' });
    await screen.findByRole('heading', { level: 2, name: 'Última carga del dataset' });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    const calls = requestsTo('GET', PATH);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.search).toBe('');
    expect(calls[0]?.headers.get('authorization')).toBe('Bearer eyJhbGciOiJIUzI1NiJ9.test.sig');
    expect(requests.filter((r) => r.method !== 'GET')).toHaveLength(0);
    expect(requests.filter((r) => /\/api\/(games|session)/.test(r.pathname))).toHaveLength(0);
  });

  it('ruta registrada y lazy (TS-6)', async () => {
    const router = (await import('@/app/router.tsx?raw')).default;
    expect(router).toContain(
      "{ path: 'content', lazy: () => import('@/modules/content-stock/routes/content') }",
    );
    const route = (await import('./content.tsx?raw')).default;
    expect(route).toContain('export function Component()');
  });

  it('título, foco y paneles (TS-9)', async () => {
    await renderStock();
    const h1 = screen.getByRole('heading', { level: 1, name: 'Stock de contenido' });
    await waitFor(() => {
      expect(h1).toHaveFocus();
    });
    expect(document.title).toBe('Stock · Admin · nerdose');
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Última carga del dataset',
      'Banco de términos',
      'Banco de hechos',
      'Ítems rechazados',
      'Top 50 de palabras rechazadas en Devdle',
    ]);
    expect(screen.queryByText(/no alcanza para ciclar/)).toBeNull();
    expect(screen.queryByText('Cargando stock…')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('última carga (TS-10)', async () => {
    await renderStock();
    expect(pairs(screen.getByRole('region', { name: 'Última carga del dataset' }))).toEqual([
      ['Fecha', '2026-11-28 03:12 UTC'],
      ['Versión', '2026.11.2'],
      ['Insertados', '40'],
      ['Actualizados', '12'],
      ['Sin cambios', '1.284'],
      ['Rechazados conservados', '9'],
    ]);
  });

  it('banco de términos (TS-11)', async () => {
    await renderStock();
    const bank = screen.getByRole('region', { name: 'Banco de términos' });
    expect(pairs(bank)).toEqual([
      ['Aprobados disponibles', '1.050'],
      ['Aprobados totales', '1.320'],
      ['Rechazados', '14'],
      ['Días de stock', '140'],
      ['Alcanza para ciclar', 'Sí'],
    ]);
    const table = within(bank).getByRole('table', { name: 'Términos por juego consumidor' });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((c) => c.textContent),
    ).toEqual([
      'Juego',
      'Ventana',
      'Por desafío',
      'Disponibles',
      'Días de stock',
      'Alcanza para ciclar',
    ]);
    expect(rows(table)).toEqual([
      ['Devdle', '365 días', '1', '1.050', '1.050', 'Sí'],
      ['Grep Grid', '30 días', '8', '1.120', '140', 'Sí'],
    ]);
    expect(
      within(table)
        .getAllByRole('rowheader')
        .map((c) => c.textContent),
    ).toEqual(['Devdle', 'Grep Grid']);
    const region = within(bank).getByRole('region', { name: 'Tabla de términos por juego' });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(region).toContainElement(table);
  });

  it('banco de hechos (TS-12)', async () => {
    await renderStock();
    const bank = screen.getByRole('region', { name: 'Banco de hechos' });
    expect(pairs(bank)).toEqual([
      ['Aprobados disponibles', '310'],
      ['Aprobados totales', '520'],
      ['Rechazados', '3'],
      ['Días de stock', '62'],
      ['Alcanza para ciclar', 'Sí'],
    ]);
    const table = within(bank).getByRole('table', { name: 'Hechos por juego consumidor' });
    expect(rows(table)).toEqual([['Tech Timeline', '90 días', '5', '310', '62', 'Sí']]);
  });

  it('bancos apilados a todo el ancho (TS-13)', async () => {
    await renderStock();
    const terms = screen.getByRole('region', { name: 'Banco de términos' });
    const facts = screen.getByRole('region', { name: 'Banco de hechos' });
    const grid = terms.parentElement;
    expect(grid).toBe(facts.parentElement);
    expect(grid).toHaveClass('grid', 'grid-cols-1');
    expect(grid?.className).not.toMatch(/grid-cols-[2-9]/);
    expect(grid?.firstElementChild).toBe(terms);
    for (const name of ['Última carga del dataset', 'Ítems rechazados']) {
      expect(grid).not.toContainElement(screen.getByRole('region', { name }));
    }
    expect(grid).not.toContainElement(
      screen.getByRole('region', { name: 'Top 50 de palabras rechazadas en Devdle' }),
    );
  });

  it('stock bajo de hechos (TS-14)', async () => {
    await renderStock(STOCK_LOW);
    const alert = screen.getByRole('status');
    expect(alert).toHaveTextContent(
      'El banco de hechos no alcanza para ciclar: Tech Timeline necesita 450 hechos aprobados para su ventana de 90 días y hay 380.',
    );
    const last = screen.getByRole('region', { name: 'Última carga del dataset' });
    expect(alert.compareDocumentPosition(last) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const bank = screen.getByRole('region', { name: 'Banco de hechos' });
    expect(pairs(bank)).toEqual([
      ['Aprobados disponibles', '170'],
      ['Aprobados totales', '380'],
      ['Rechazados', '3'],
      ['Días de stock', '34'],
      ['Alcanza para ciclar', '⚠ No'],
    ]);
    const table = within(bank).getByRole('table');
    expect(rows(table)).toEqual([['Tech Timeline', '90 días', '5', '170', '34', '⚠ No']]);
    const no = within(table).getByText('No', {
      exact: false,
      selector: 'span.text-status-warning',
    });
    expect(no).toBeInTheDocument();
    expect(no.querySelector('span[aria-hidden="true"]')).toHaveTextContent('⚠');
    expect(pairs(screen.getByRole('region', { name: 'Banco de términos' }))[4]).toEqual([
      'Alcanza para ciclar',
      'Sí',
    ]);
  });

  it('términos desglosado (TS-15)', async () => {
    await renderStock(STOCK_TERMS_LOW);
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent(
      'El banco de términos no alcanza para ciclar: Devdle necesita 365 términos aprobados para su ventana de 365 días y hay 300.',
    );
    const bank = screen.getByRole('region', { name: 'Banco de términos' });
    expect(rows(within(bank).getByRole('table'))).toEqual([
      ['Devdle', '365 días', '1', '260', '260', '⚠ No'],
      ['Grep Grid', '30 días', '8', '250', '31', 'Sí'],
    ]);
    const p = pairs(bank);
    expect(p).toContainEqual(['Días de stock', '31']);
    expect(p).toContainEqual(['Alcanza para ciclar', '⚠ No']);
  });

  it('ítems rechazados: total por banco y acceso a Bancos (TS-16)', async () => {
    await renderStock(stock({ banks: [{ ...TERMS_BANK, rejected_total: 1230 }, FACTS_BANK] }));
    const panel = screen.getByRole('region', { name: 'Ítems rechazados' });
    expect(within(panel).queryByRole('table')).toBeNull();
    const items = within(panel).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Términos: 1.230 rechazados');
    expect(items[1]).toHaveTextContent('Hechos: 3 rechazados');
    expect(
      within(items[0] as HTMLElement).getByRole('link', { name: 'Ver en Bancos' }),
    ).toHaveAttribute('href', '/banks?bank=terms&status=rejected');
    expect(
      within(items[1] as HTMLElement).getByRole('link', { name: 'Ver en Bancos' }),
    ).toHaveAttribute('href', '/banks?bank=timeline_facts&status=rejected');
    // La lista completa con motivos vive en Bancos: acá no se muestran ítems sueltos.
    expect(panel).not.toHaveTextContent('CAP theorem');
  });

  it('«Ver en Bancos» abre Bancos filtrado por los rechazados del banco (TS-17)', async () => {
    const { user, router } = await renderStock();
    server.use(adminHandlers.bankItems(BANK_TERMS_PAGE));
    const panel = screen.getByRole('region', { name: 'Ítems rechazados' });
    await user.click(
      within(panel).getAllByRole('link', { name: 'Ver en Bancos' })[0] as HTMLElement,
    );
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/banks');
    });
    expect(router.state.location.search).toBe('?bank=terms&status=rejected');
    await screen.findByRole('heading', { level: 1, name: 'Bancos de contenido' });
    await waitFor(() => {
      expect(requestsTo('GET', '/api/admin/content/items')).toHaveLength(1);
    });
    const params = new URLSearchParams(requestsTo('GET', '/api/admin/content/items')[0]?.search);
    expect(params.get('bank')).toBe('terms');
    expect(params.get('status')).toBe('rejected');
  });

  it('top 50 de solo lectura (TS-18)', async () => {
    await renderStock();
    const panel = screen.getByRole('region', { name: 'Top 50 de palabras rechazadas en Devdle' });
    const table = within(panel).getByRole('table', {
      name: 'Palabras rechazadas en Devdle por jugadores distintos',
    });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((c) => c.textContent),
    ).toEqual(['#', 'Palabra', 'Jugadores distintos']);
    expect(rows(table)).toHaveLength(10);
    expect(rows(table).slice(0, 3)).toEqual([
      ['1', 'KAFKA', '41'],
      ['2', 'REACT', '37'],
      ['3', 'CRONS', '22'],
    ]);
    expect(within(panel).queryByRole('link')).toBeNull();
    expect(within(panel).queryByRole('textbox')).toBeNull();
    expect(panel.textContent).not.toMatch(/agregar/i);
  });

  it('top 50 paginado de a 10, con la numeración corrida entre páginas (TS-18)', async () => {
    const { user } = await renderStock();
    const panel = screen.getByRole('region', { name: 'Top 50 de palabras rechazadas en Devdle' });
    const nav = within(panel).getByRole('navigation', { name: 'Paginado de palabras rechazadas' });
    expect(nav).toHaveTextContent('1–10 de 50 palabras · página 1 de 5');
    expect(
      within(nav)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['‹ Anterior', 'Siguiente ›']);
    await user.click(within(nav).getByRole('button', { name: 'Siguiente' }));
    expect(nav).toHaveTextContent('11–20 de 50 palabras · página 2 de 5');
    const page2 = rows(within(panel).getByRole('table'));
    expect(page2).toHaveLength(10);
    expect(page2[0]?.[0]).toBe('11');
    expect(page2[9]?.[0]).toBe('20');
    for (let i = 0; i < 3; i++) {
      await user.click(within(nav).getByRole('button', { name: 'Siguiente' }));
    }
    expect(nav).toHaveTextContent('41–50 de 50 palabras · página 5 de 5');
    expect(rows(within(panel).getByRole('table')).at(-1)).toEqual(['50', 'ZZBU', '20']);
    expect(within(nav).getByRole('button', { name: 'Siguiente' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('estados vacíos (TS-19)', async () => {
    await renderStock(STOCK_EMPTY);
    const last = screen.getByRole('region', { name: 'Última carga del dataset' });
    expect(last).toHaveTextContent('Sin datos de carga: el dataset todavía no se cargó.');
    expect(last.querySelector('dt')).toBeNull();
    const top = screen.getByRole('region', { name: 'Top 50 de palabras rechazadas en Devdle' });
    expect(top).toHaveTextContent(
      'Sin rechazos: ningún jugador intentó una palabra que Devdle no acepte.',
    );
    expect(top.querySelector('span[aria-hidden="true"]')).toHaveTextContent('✓');
    expect(within(top).queryByRole('table')).toBeNull();
    const rej = screen.getByRole('region', { name: 'Ítems rechazados' });
    expect(rej).toHaveTextContent('Términos: 0 rechazados');
    expect(rej).toHaveTextContent('Hechos: 0 rechazados');
    expect(within(rej).queryByRole('table')).toBeNull();
    expect(
      screen.queryByRole('navigation', { name: 'Paginado de palabras rechazadas' }),
    ).toBeNull();
    for (const name of ['Banco de términos', 'Banco de hechos']) {
      expect(within(screen.getByRole('region', { name })).getByRole('table')).toBeInTheDocument();
    }
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('estados vacíos independientes (TS-20)', async () => {
    const first = await renderStock(stock({ last_sync: null }));
    expect(screen.getByText(/Sin datos de carga/)).toBeInTheDocument();
    const top = screen.getByRole('region', { name: 'Top 50 de palabras rechazadas en Devdle' });
    expect(rows(within(top).getByRole('table'))).toHaveLength(10);
    expect(
      within(top).getByRole('navigation', { name: 'Paginado de palabras rechazadas' }),
    ).toHaveTextContent('página 1 de 5');
    first.unmount();

    await renderStock(stock({ top_rejected_guesses: [] }));
    expect(pairs(screen.getByRole('region', { name: 'Última carga del dataset' }))[0]).toEqual([
      'Fecha',
      '2026-11-28 03:12 UTC',
    ]);
    expect(screen.getByText(/Sin rechazos: ningún jugador/)).toBeInTheDocument();
  });

  it('sin bancos (TS-21)', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await renderStock(stock({ banks: [] }));
    expect(screen.queryByRole('heading', { name: 'Banco de términos' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Banco de hechos' })).toBeNull();
    const rej = screen.getByRole('region', { name: 'Ítems rechazados' });
    expect(within(rej).queryAllByRole('listitem')).toHaveLength(0);
    expect(within(rej).queryByRole('link')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
    expect(
      rows(
        within(
          screen.getByRole('region', { name: 'Top 50 de palabras rechazadas en Devdle' }),
        ).getByRole('table'),
      ),
    ).toHaveLength(10);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('loading (TS-22)', async () => {
    server.use(adminHandlers.contentStockPending());
    renderWithProviders({ route: '/content', session: SESSION });
    expect(await screen.findByRole('status')).toHaveTextContent('Cargando stock…');
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0);
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('error de sistema y reintento (TS-23)', async () => {
    server.use(
      adminHandlers.contentStock(apiError('internal_error', 'x'), { status: 500 }),
      adminHandlers.reports('open', OPEN_GROUPS),
    );
    const { user } = renderWithProviders({ route: '/content', session: SESSION });
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No pudimos cargar el stock. Probá de nuevo.');
    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0);
    expect(screen.queryByRole('table')).toBeNull();
    server.use(adminHandlers.contentStock(STOCK_OK));
    const before = requestsTo('GET', PATH).length;
    await user.click(within(alert).getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => {
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(5);
    });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(requestsTo('GET', PATH)).toHaveLength(before + 1);
  });

  it('error de red (TS-24)', async () => {
    server.use(adminHandlers.contentStockNetworkError());
    renderWithProviders({ route: '/content', session: SESSION });
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No pudimos cargar el stock. Probá de nuevo.');
    expect(within(alert).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(sessionStorage.getItem(SESSION_KEY)).not.toBeNull();
  });

  it('401 cierra la sesión (TS-25)', async () => {
    server.use(
      adminHandlers.contentStock(apiError('unauthorized', 'Sesión vencida'), { status: 401 }),
    );
    const { router } = renderWithProviders({ route: '/content', session: SESSION });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');
    });
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    expect(await screen.findByText('La sesión venció, ingresá de nuevo.')).toBeInTheDocument();
    expect(screen.queryByText(/No pudimos cargar el stock/)).toBeNull();
  });

  it('sin sesión redirige sin pedir (TS-26)', async () => {
    const { router } = renderWithProviders({ route: '/content' });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');
    });
    expect(requestsTo('GET', PATH)).toHaveLength(0);
  });

  it('solo lectura: solo paginado y enlaces a Bancos (TS-27)', async () => {
    await renderStock();
    const main = screen.getByRole('main');
    for (const role of ['textbox', 'combobox', 'checkbox']) {
      expect(within(main).queryByRole(role)).toBeNull();
    }
    expect(
      within(main)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['‹ Anterior', 'Siguiente ›']);
    expect(
      within(main)
        .getAllByRole('link')
        .map((l) => l.getAttribute('href')),
    ).toEqual(['/banks?bank=terms&status=rejected', '/banks?bank=timeline_facts&status=rejected']);
    expect(requests.every((r) => r.method === 'GET')).toBe(true);
  });

  it('navega desde el encabezado (TS-28)', async () => {
    server.use(adminHandlers.reports('open', OPEN_GROUPS), adminHandlers.contentStock(STOCK_OK));
    const { user, router } = renderWithProviders({ route: '/reports', session: SESSION });
    const nav = await screen.findByRole('navigation', { name: 'Secciones' });
    await within(nav).findByRole('link', { name: /Reportes/ });
    await user.click(within(nav).getByRole('link', { name: 'Stock' }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/content');
    });
    const h1 = await screen.findByRole('heading', { level: 1, name: 'Stock de contenido' });
    await waitFor(() => {
      expect(h1).toHaveFocus();
    });
    expect(within(nav).getByRole('link', { name: 'Stock' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: /Reportes/ })).not.toHaveAttribute('aria-current');
  });

  it.each([
    ['STOCK_OK', STOCK_OK],
    ['STOCK_LOW', STOCK_LOW],
    ['STOCK_EMPTY', STOCK_EMPTY],
  ])('axe sin violaciones: %s (TS-29)', async (_name, body) => {
    const { container } = await renderStock(body);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('axe sin violaciones: loading y error (TS-29)', async () => {
    server.use(adminHandlers.contentStockPending());
    const first = renderWithProviders({ route: '/content', session: SESSION });
    await screen.findByRole('status');
    expect(await axe(first.container)).toHaveNoViolations();
    first.unmount();

    server.use(adminHandlers.contentStock(apiError('internal_error', 'x'), { status: 500 }));
    const second = renderWithProviders({ route: '/content', session: SESSION });
    await screen.findByRole('alert');
    expect(await axe(second.container)).toHaveNoViolations();
  });

  it('idioma (TS-31)', async () => {
    await renderStock();
    expect((await import('../../../../index.html?raw')).default).toContain('<html lang="es">');
    expect(screen.getByRole('main').querySelector('[lang]')).toBeNull();
    expect(document.body.textContent).not.toMatch(/Available|Total|Rejected|Last sync|Players/);
  });
});
