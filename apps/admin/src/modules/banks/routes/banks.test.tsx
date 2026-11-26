import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import routerSource from '@/app/router.tsx?raw';
import {
  BANK_EMPTY,
  BANK_FACTS_PAGE,
  BANK_TERMS_PAGE,
  TERM_KERNEL,
  bankPage,
} from '@/test/fixtures/banks';
import { OPEN_GROUPS, SESSION } from '@/test/fixtures/reports';
import { adminHandlers, apiError, requestsTo, server } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

const PATH = '/api/admin/content/items';

function render(
  route = '/banks',
  body: Parameters<typeof adminHandlers.bankItems>[0] = BANK_TERMS_PAGE,
) {
  server.use(adminHandlers.bankItems(body), adminHandlers.reports('open', OPEN_GROUPS));
  return renderWithProviders({ route, session: SESSION });
}

/** Parámetros de cada GET al listado, en orden. */
const calls = () =>
  requestsTo('GET', PATH).map((r) => Object.fromEntries(new URLSearchParams(r.search)));
const lastCall = () => calls().at(-1);

const rows = (table: HTMLElement) => within(table).getAllByRole('row').slice(1);
const rowOf = (label: string) => {
  const header = screen.getByRole('rowheader', { name: new RegExp(`^${label}`) });
  return header.closest('tr') as HTMLElement;
};

describe('Bancos de contenido', () => {
  it('la ruta está registrada y es lazy', () => {
    expect(routerSource).toContain(
      "{ path: 'banks', lazy: () => import('@/modules/banks/routes/banks') }",
    );
  });

  it('título, foco y pide la primera página de términos con Bearer', async () => {
    render();
    const h1 = await screen.findByRole('heading', { level: 1, name: 'Bancos de contenido' });
    await screen.findByRole('table', { name: 'Términos del banco' });
    await waitFor(() => {
      expect(h1).toHaveFocus();
    });
    expect(document.title).toBe('Bancos · Admin · nerdose');
    expect(calls()).toEqual([{ bank: 'terms', page: '1', page_size: '25' }]);
    expect(requestsTo('GET', PATH)[0]?.headers.get('authorization')).toBe(
      'Bearer eyJhbGciOiJIUzI1NiJ9.test.sig',
    );
    expect(screen.getByRole('tab', { name: 'Términos' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Hechos (Timeline)' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('muestra cada término con categoría, estado, motivo, último uso y exclusiones', async () => {
    render();
    const table = await screen.findByRole('table', { name: 'Términos del banco' });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((h) => h.textContent),
    ).toEqual(['Término', 'Categoría', 'Estado', 'Último uso', 'Sitelinks']);
    expect(rows(table)).toHaveLength(3);

    const kernel = rowOf('kernel');
    expect(kernel).toHaveTextContent('Núcleo del sistema operativo.');
    expect(kernel).toHaveTextContent('Linux y SO');
    expect(within(kernel).getByText('aprobado')).toBeInTheDocument();
    expect(kernel).toHaveTextContent('Devdle: 03/11/2026');
    expect(kernel).toHaveTextContent('Grep Grid: nunca');
    expect(kernel).toHaveTextContent('1.234');
    expect(kernel).not.toHaveTextContent('fuera de');

    const rejected = rowOf('CAP theorem');
    expect(within(rejected).getByText('rechazado')).toBeInTheDocument();
    expect(rejected).toHaveTextContent('caracteres fuera de A–Z');
    expect(rejected).toHaveTextContent('Bases de datos');
    expect(rejected).toHaveTextContent('Devdle: nunca');

    const niche = rowOf('mutex');
    expect(within(niche).getByText('fuera de Devdle')).toBeInTheDocument();
    expect(niche).toHaveTextContent('Ingeniería de software');
    expect(niche).toHaveTextContent('Grep Grid: 20/10/2026');
    expect(niche).not.toHaveTextContent('Devdle: ');

    // Con una sola página no hay paginado.
    expect(screen.queryByRole('navigation', { name: 'Paginado del banco' })).toBeNull();
  });

  it('los filtros de la URL viajan en el pedido y se reflejan en los controles', async () => {
    render('/banks?bank=terms&q=cap&status=rejected&category=databases&page=2');
    await screen.findByRole('table', { name: 'Términos del banco' });
    expect(calls()).toEqual([
      {
        bank: 'terms',
        page: '2',
        page_size: '25',
        q: 'cap',
        status: 'rejected',
        category: 'databases',
      },
    ]);
    expect(screen.getByRole('searchbox', { name: 'Buscar' })).toHaveValue('cap');
    expect(screen.getByRole('combobox', { name: 'Estado' })).toHaveValue('rejected');
    expect(screen.getByRole('combobox', { name: 'Categoría' })).toHaveValue('databases');
  });

  it('un filtro inválido en la URL cae al valor por defecto', async () => {
    render('/banks?bank=otro&status=pending&category=frameworks&page=-1');
    await screen.findByRole('table', { name: 'Términos del banco' });
    expect(lastCall()).toEqual({ bank: 'terms', page: '1', page_size: '25' });
    expect(screen.getByRole('combobox', { name: 'Estado' })).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Categoría' })).toHaveValue('');
  });

  it('la búsqueda espera 300 ms: un solo pedido con el texto completo y vuelve a la página 1', async () => {
    const { user, router } = render('/banks?bank=terms&page=3');
    await screen.findByRole('table', { name: 'Términos del banco' });
    expect(calls()).toHaveLength(1);
    await user.type(screen.getByRole('searchbox', { name: 'Buscar' }), 'kernel');
    // Recién escrito: todavía no salió ningún pedido con el texto.
    expect(calls().filter((c) => c.q !== undefined)).toHaveLength(0);
    expect(router.state.location.search).toBe('?bank=terms&page=3');
    await waitFor(() => {
      expect(calls().filter((c) => c.q !== undefined)).toHaveLength(1);
    });
    expect(lastCall()).toEqual({ bank: 'terms', page: '1', page_size: '25', q: 'kernel' });
    expect(router.state.location.search).toBe('?bank=terms&q=kernel');
  });

  it('Enter en el buscador aplica la búsqueda sin esperar', async () => {
    const { user, router } = render();
    await screen.findByRole('table', { name: 'Términos del banco' });
    await user.type(screen.getByRole('searchbox', { name: 'Buscar' }), '  git {Enter}');
    expect(router.state.location.search).toBe('?bank=terms&q=git');
    await waitFor(() => {
      expect(lastCall()?.q).toBe('git');
    });
  });

  it('elegir estado actualiza la URL, vuelve a la página 1 y pide filtrado', async () => {
    const { user, router } = render('/banks?bank=terms&page=2');
    await screen.findByRole('table', { name: 'Términos del banco' });
    await user.selectOptions(screen.getByRole('combobox', { name: 'Estado' }), 'Rechazados');
    expect(router.state.location.search).toBe('?bank=terms&status=rejected');
    await waitFor(() => {
      expect(lastCall()).toEqual({ bank: 'terms', page: '1', page_size: '25', status: 'rejected' });
    });
    await user.selectOptions(screen.getByRole('combobox', { name: 'Estado' }), 'Todos');
    expect(router.state.location.search).toBe('?bank=terms');
  });

  it('elegir categoría actualiza la URL, vuelve a la página 1 y ofrece solo las del banco', async () => {
    const { user, router } = render('/banks?bank=terms&page=2');
    await screen.findByRole('table', { name: 'Términos del banco' });
    const select = screen.getByRole('combobox', { name: 'Categoría' });
    const options = within(select)
      .getAllByRole('option')
      .map((o) => o.textContent);
    expect(options[0]).toBe('Todas');
    expect(options).toContain('Git y wikis');
    expect(options).not.toContain('Videojuegos');
    await user.selectOptions(select, 'Git y wikis');
    expect(router.state.location.search).toBe('?bank=terms&category=git');
    await waitFor(() => {
      expect(lastCall()).toEqual({ bank: 'terms', page: '1', page_size: '25', category: 'git' });
    });
  });

  it('pagina con «Anterior» y «Siguiente»', async () => {
    const paged = (url: URL) => {
      const page = Number(url.searchParams.get('page'));
      return bankPage({
        page,
        total: 60,
        total_pages: 3,
        items: [{ ...TERM_KERNEL, id: `t-${String(page)}`, label: `termino${String(page)}` }],
      });
    };
    const { user, router } = render('/banks?bank=terms&status=approved', paged);
    await screen.findByRole('rowheader', { name: /^termino1/ });
    const nav = screen.getByRole('navigation', { name: 'Paginado del banco' });
    expect(nav).toHaveTextContent('1–25 de 60 términos · página 1 de 3');
    expect(within(nav).getByRole('button', { name: 'Anterior' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );

    await user.click(within(nav).getByRole('button', { name: 'Siguiente' }));
    expect(router.state.location.search).toBe('?bank=terms&status=approved&page=2');
    await screen.findByRole('rowheader', { name: /^termino2/ });
    expect(lastCall()).toEqual({ bank: 'terms', page: '2', page_size: '25', status: 'approved' });
    expect(screen.getByRole('navigation', { name: 'Paginado del banco' })).toHaveTextContent(
      '26–50 de 60 términos · página 2 de 3',
    );

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    await screen.findByRole('rowheader', { name: /^termino3/ });
    const last = screen.getByRole('navigation', { name: 'Paginado del banco' });
    expect(last).toHaveTextContent('51–60 de 60 términos · página 3 de 3');
    expect(within(last).getByRole('button', { name: 'Siguiente' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );

    await user.click(within(last).getByRole('button', { name: 'Anterior' }));
    await screen.findByRole('rowheader', { name: /^termino2/ });
    expect(router.state.location.search).toBe('?bank=terms&status=approved&page=2');
  });

  it('sin resultados muestra el estado vacío', async () => {
    render('/banks?bank=terms&q=zzz', BANK_EMPTY);
    expect(await screen.findByText('Ningún ítem coincide con los filtros.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByRole('navigation', { name: 'Paginado del banco' })).toBeNull();
  });

  it('error con «Reintentar» que vuelve a pedir', async () => {
    server.use(
      adminHandlers.bankItems(apiError('internal_error', 'x'), { status: 500 }),
      adminHandlers.reports('open', OPEN_GROUPS),
    );
    const { user } = renderWithProviders({ route: '/banks', session: SESSION });
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No pudimos cargar el banco. Probá de nuevo.');
    expect(screen.queryByRole('table')).toBeNull();
    const before = calls().length;
    server.use(adminHandlers.bankItems(BANK_TERMS_PAGE));
    await user.click(within(alert).getByRole('button', { name: 'Reintentar' }));
    await screen.findByRole('table', { name: 'Términos del banco' });
    expect(calls()).toHaveLength(before + 1);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('un error de red también ofrece reintentar', async () => {
    server.use(adminHandlers.bankItemsNetworkError(), adminHandlers.reports('open', OPEN_GROUPS));
    renderWithProviders({ route: '/banks', session: SESSION });
    const alert = await screen.findByRole('alert');
    expect(within(alert).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('la pestaña «Hechos (Timeline)» limpia los filtros y muestra la fecha', async () => {
    const byBank = (url: URL) =>
      url.searchParams.get('bank') === 'timeline_facts' ? BANK_FACTS_PAGE : BANK_TERMS_PAGE;
    const { user, router } = render('/banks?bank=terms&q=cap&status=rejected&page=2', byBank);
    await screen.findByRole('table', { name: 'Términos del banco' });
    await user.click(screen.getByRole('tab', { name: 'Hechos (Timeline)' }));
    expect(router.state.location.search).toBe('?bank=timeline_facts');
    const table = await screen.findByRole('table', { name: 'Hechos del banco' });
    expect(lastCall()).toEqual({ bank: 'timeline_facts', page: '1', page_size: '25' });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((h) => h.textContent),
    ).toEqual(['Hecho', 'Categoría', 'Fecha', 'Estado', 'Último uso', 'Sitelinks']);
    const row = rowOf('Linux 0.01');
    expect(row).toHaveTextContent('Linus Torvalds publica la primera versión del kernel.');
    expect(row).toHaveTextContent('Sistemas operativos');
    expect(row).toHaveTextContent('17/09/1991');
    expect(row).toHaveTextContent('Tech Timeline: nunca');
    expect(screen.getByRole('searchbox', { name: 'Buscar' })).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Estado' })).toHaveValue('');
    expect(
      within(screen.getByRole('combobox', { name: 'Categoría' }))
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toContain('Videojuegos');
    expect(screen.getByRole('tab', { name: 'Hechos (Timeline)' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('es solo lectura: nada se escribe', async () => {
    const { user } = render();
    await screen.findByRole('table', { name: 'Términos del banco' });
    await user.selectOptions(screen.getByRole('combobox', { name: 'Estado' }), 'Aprobados');
    await waitFor(() => {
      expect(lastCall()?.status).toBe('approved');
    });
    expect(requestsTo('POST', PATH)).toHaveLength(0);
    expect(within(screen.getByRole('main')).queryByRole('link')).toBeNull();
  });

  it('no tiene violaciones de axe con datos, vacío y error', async () => {
    const full = render();
    await screen.findByRole('table', { name: 'Términos del banco' });
    expect(await axe(full.container)).toHaveNoViolations();
    full.unmount();

    const facts = render('/banks?bank=timeline_facts', BANK_FACTS_PAGE);
    await screen.findByRole('table', { name: 'Hechos del banco' });
    expect(await axe(facts.container)).toHaveNoViolations();
    facts.unmount();

    const empty = render('/banks', BANK_EMPTY);
    await screen.findByText('Ningún ítem coincide con los filtros.');
    expect(await axe(empty.container)).toHaveNoViolations();
    empty.unmount();

    server.use(adminHandlers.bankItems(apiError('internal_error', 'x'), { status: 500 }));
    const failed = renderWithProviders({ route: '/banks', session: SESSION });
    await screen.findByRole('alert');
    expect(await axe(failed.container)).toHaveNoViolations();
  });
});
