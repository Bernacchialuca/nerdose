import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import {
  DEVDLE_GROUP,
  OPEN_GROUPS,
  SESSION,
  TIMELINE_GROUP,
  VOIDED_GROUP,
} from '@/test/fixtures/reports';
import { useFixedClock } from '@/test/helpers';
import { adminHandlers, apiError, requests, requestsTo, server } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

beforeEach(() => {
  useFixedClock();
});
afterEach(() => {
  vi.useRealTimers();
});

const open = (route = '/reports') => renderWithProviders({ route, session: SESSION });

describe('Reportes (P-02)', () => {
  it('muestra la cola en el orden del servidor con «alertado» (TS-25)', async () => {
    server.use(adminHandlers.reports('open', OPEN_GROUPS));
    open();
    const table = await screen.findByRole('table');
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(3);
    const [r1, r2, r3] = rows as [HTMLElement, HTMLElement, HTMLElement];
    expect(within(r1).getByRole('button', { name: 'Devdle #8' })).toBeInTheDocument();
    expect(r1).toHaveTextContent('alertado');
    expect(r1).toHaveTextContent('2026-11-08');
    expect(r1).toHaveTextContent('Respuesta incorrecta ×3');
    expect(r1).toHaveTextContent('hace 2 h');
    expect(r1).toHaveTextContent('publicado');
    expect(within(r1).getByRole('button', { name: 'Anular Devdle #8' })).toHaveTextContent(
      'Anular',
    );
    expect(within(r2).getByRole('button', { name: 'Tech Timeline #7' })).toBeInTheDocument();
    expect(r2).toHaveTextContent('Ambiguo ×1, Traducción ×1');
    expect(r2).toHaveTextContent('ayer');
    expect(r2).not.toHaveTextContent('alertado');
    expect(within(r3).getByRole('button', { name: 'Grep Grid #6' })).toBeInTheDocument();
    expect(r3).toHaveTextContent('hace 3 d');
    expect(r3).toHaveTextContent('Error de visualización ×1');
    expect(r3).toHaveTextContent('anulado');
    expect(within(r3).queryByRole('button', { name: /Anular/ })).toBeNull();
  });

  it('tabla accesible y sin paginado con hasta 20 grupos (TS-26)', async () => {
    server.use(adminHandlers.reports('open', OPEN_GROUPS));
    open();
    const table = await screen.findByRole('table', { name: 'Grupos de reportes' });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((h) => h.textContent),
    ).toEqual([
      'Alerta',
      'Desafío',
      'Fecha',
      'Reportes',
      'Motivos',
      'Último reporte',
      'Estado del desafío',
      'Acción',
    ]);
    expect(screen.queryByRole('button', { name: /siguiente|anterior|página/i })).toBeNull();
  });

  it('pagina de a 20 grupos con «Anterior» y «Siguiente»', async () => {
    const groups = Array.from({ length: 45 }, (_, i) => ({
      ...DEVDLE_GROUP,
      challenge: {
        ...DEVDLE_GROUP.challenge,
        id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
        number: i + 1,
      },
    }));
    server.use(adminHandlers.reports('open', { groups }));
    const { user } = open();
    const table = await screen.findByRole('table', { name: 'Grupos de reportes' });
    const bodyRows = () => within(table).getAllByRole('row').slice(1);
    expect(bodyRows()).toHaveLength(20);
    expect(
      within(bodyRows()[0] as HTMLElement).getByRole('button', { name: 'Devdle #1' }),
    ).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Paginado de reportes' });
    expect(nav).toHaveTextContent('1–20 de 45 desafíos reportados · página 1 de 3');
    const prev = within(nav).getByRole('button', { name: 'Anterior' });
    const next = within(nav).getByRole('button', { name: 'Siguiente' });
    expect(prev).toHaveAttribute('aria-disabled', 'true');
    expect(next).not.toHaveAttribute('aria-disabled');

    await user.click(next);
    expect(nav).toHaveTextContent('21–40 de 45 desafíos reportados · página 2 de 3');
    expect(bodyRows()).toHaveLength(20);
    expect(
      within(bodyRows()[0] as HTMLElement).getByRole('button', { name: 'Devdle #21' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Devdle #1' })).toBeNull();

    await user.click(next);
    expect(nav).toHaveTextContent('41–45 de 45 desafíos reportados · página 3 de 3');
    expect(bodyRows()).toHaveLength(5);
    expect(next).toHaveAttribute('aria-disabled', 'true');
    await user.click(next);
    expect(nav).toHaveTextContent('página 3 de 3');

    await user.click(prev);
    expect(nav).toHaveTextContent('página 2 de 3');
    // Las filas de otras páginas siguen abriendo el detalle.
    await user.click(screen.getByRole('button', { name: 'Devdle #25' }));
    expect(await screen.findByRole('dialog', { name: 'Devdle #25' })).toBeInTheDocument();
  });

  it('el contador sigue siendo de abiertos con otra pestaña (TS-24, TS-27)', async () => {
    server.use(
      adminHandlers.reports('open', OPEN_GROUPS),
      adminHandlers.reports('resolved', { groups: [] }),
    );
    open('/reports?status=resolved');
    expect(await screen.findByRole('tab', { name: 'Resueltos' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(
      await screen.findByRole('link', { name: /3 grupos de reportes abiertos/ }),
    ).toBeInTheDocument();
    const statuses = requests.map((r) => r.search);
    expect(statuses).toContain('?status=open');
    expect(statuses).toContain('?status=resolved');
  });

  it('filtro por defecto, por URL y valor inválido (TS-27)', async () => {
    server.use(
      adminHandlers.reports('open', OPEN_GROUPS),
      adminHandlers.reports('dismissed', { groups: [] }),
    );
    open('/reports?status=foo');
    expect(await screen.findByRole('tab', { name: 'Abiertos' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await screen.findByRole('table');
    expect(requests.every((r) => r.search === '?status=open')).toBe(true);
  });

  it('?status=dismissed selecciona Descartados y pide ese estado (TS-27)', async () => {
    server.use(
      adminHandlers.reports('open', OPEN_GROUPS),
      adminHandlers.reports('dismissed', { groups: [] }),
    );
    open('/reports?status=dismissed');
    expect(await screen.findByRole('tab', { name: 'Descartados' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await screen.findByText('Todavía no hay reportes descartados.');
    expect(requests.map((r) => r.search)).toContain('?status=dismissed');
  });

  it('cambiar de pestaña actualiza la URL y descarta el aviso (TS-28)', async () => {
    server.use(
      adminHandlers.reports('open', OPEN_GROUPS),
      adminHandlers.reports('resolved', { groups: [] }),
    );
    const { user, router } = open();
    await screen.findByRole('table');
    await user.click(screen.getByRole('tab', { name: 'Resueltos' }));
    expect(router.state.location.search).toBe('?status=resolved');
    await screen.findByText('Todavía no hay reportes resueltos.');
    await user.keyboard('{ArrowLeft}');
    expect(router.state.location.search).toBe('');
    await screen.findByRole('table');
  });

  it.each([
    ['open', 'No hay reportes abiertos. Todo al día.'],
    ['resolved', 'Todavía no hay reportes resueltos.'],
    ['dismissed', 'Todavía no hay reportes descartados.'],
  ])('vacío en %s (TS-29)', async (status, text) => {
    server.use(adminHandlers.reports(status, { groups: [] }));
    open(`/reports?status=${status}`);
    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('muestra «Cargando reportes…» mientras espera (TS-30)', async () => {
    server.use(adminHandlers.reportsPending());
    open();
    expect(await screen.findByText('Cargando reportes…')).toHaveAttribute('role', 'status');
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('error de carga con Reintentar (TS-31)', async () => {
    server.use(adminHandlers.reports('open', apiError('internal_error', 'x'), { status: 500 }));
    const { user } = renderWithProviders({
      route: '/reports',
      session: SESSION,
    });
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No pudimos cargar los reportes. Probá de nuevo.');
    expect(screen.queryByRole('table')).toBeNull();
    server.use(adminHandlers.reports('open', OPEN_GROUPS));
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    const table = await screen.findByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(4);
  });

  it('axe: default, vacío y error (TS-69)', async () => {
    server.use(adminHandlers.reports('open', OPEN_GROUPS));
    const first = open();
    await screen.findByRole('table');
    expect(await axe(first.container)).toHaveNoViolations();
    first.unmount();

    server.use(adminHandlers.reports('open', { groups: [] }));
    const second = open();
    await screen.findByText('No hay reportes abiertos. Todo al día.');
    expect(await axe(second.container)).toHaveNoViolations();
    second.unmount();

    server.use(adminHandlers.reports('open', apiError('internal_error', 'x'), { status: 500 }));
    const third = open();
    await screen.findByRole('button', { name: 'Reintentar' });
    expect(await axe(third.container)).toHaveNoViolations();
  });

  it('abre el modal de anulación desde la fila y deja el foco en el motivo (TS-50)', async () => {
    server.use(adminHandlers.reports('open', OPEN_GROUPS));
    const { user } = open();
    await screen.findByRole('table');
    await user.click(screen.getByRole('button', { name: 'Anular Tech Timeline #7' }));
    const dialog = screen.getByRole('dialog', { name: 'Anular desafío' });
    expect(within(dialog).getByLabelText('Motivo de la anulación')).toHaveFocus();
    const options = within(within(dialog).getByLabelText('Culpable del error'))
      .getAllByRole('option')
      .map((o) => o.textContent);
    expect(options).toEqual([
      'Elegí un culpable',
      'Hecho · Lanzamiento de Docker',
      'Hecho · Primera versión de Linux',
      'La plantilla del juego',
      'Ninguno (no se identifica un culpable)',
    ]);
  });

  it('los grupos sin cambios no se reordenan', () => {
    expect(OPEN_GROUPS.groups).toEqual([DEVDLE_GROUP, TIMELINE_GROUP, VOIDED_GROUP]);
  });

  it('requests: una sola de abiertos cuando la pestaña activa es open', async () => {
    server.use(adminHandlers.reports('open', OPEN_GROUPS));
    open();
    await screen.findByRole('table');
    await waitFor(() => {
      expect(requestsTo('GET', '/api/admin/reports')).toHaveLength(1);
    });
  });
});
