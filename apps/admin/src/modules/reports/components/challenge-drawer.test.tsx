import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import {
  DEVDLE_GROUP,
  OPEN_GROUPS,
  R1,
  R2,
  R3,
  R4,
  R5,
  SESSION,
  TIMELINE_GROUP,
  VOIDED_GROUP,
} from '@/test/fixtures/reports';
import { useFixedClock } from '@/test/helpers';
import { adminHandlers, apiError, requestsTo, server } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

beforeEach(() => {
  useFixedClock();
  server.use(adminHandlers.reports('open', OPEN_GROUPS));
});
afterEach(() => {
  vi.useRealTimers();
});

async function openDrawer(name = 'Devdle #8') {
  const view = renderWithProviders({ route: '/reports', session: SESSION });
  const trigger = await screen.findByRole('button', { name });
  await view.user.click(trigger);
  const dialog = await screen.findByRole('dialog', { name });
  return { ...view, dialog, trigger };
}

const withoutOpen = (...ids: string[]) => ({
  groups: OPEN_GROUPS.groups.filter((g) => !ids.includes(g.challenge.id)),
});

describe('drawer de detalle (O-02)', () => {
  it('abre el diálogo con el foco dentro (TS-32)', async () => {
    const { dialog } = await openDrawer();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByRole('button', { name: 'Cerrar' })).toHaveFocus();
  });

  it('muestra los chips de estado (TS-33)', async () => {
    const { dialog } = await openDrawer();
    for (const text of ['Devdle', '#8', '2026-11-08', 'publicado', 'alertado']) {
      expect(within(dialog).getAllByText(text).length).toBeGreaterThan(0);
    }
  });

  it('PayloadView muestra los textos en español y los datos comunes (TS-34)', async () => {
    const { dialog } = await openDrawer();
    const texts = within(dialog).getByRole('region', { name: 'Textos' });
    expect(texts).toHaveTextContent('definition');
    expect(texts).toHaveTextContent('Almacén de datos en memoria');
    expect(texts).toHaveTextContent('Base clave-valor');
    // El admin es solo en español: ni panel EN ni los textos en inglés.
    expect(within(dialog).queryByRole('region', { name: 'ES' })).toBeNull();
    expect(within(dialog).queryByRole('region', { name: 'EN' })).toBeNull();
    expect(dialog).not.toHaveTextContent('In-memory data store');
    expect(dialog).not.toHaveTextContent('Key-value database');
    const common = within(dialog).getByRole('region', { name: 'Datos del desafío' });
    expect(common).toHaveTextContent('term_id');
    expect(common).toHaveTextContent('a3f1c2d4-5b6e-4f70-8a91-b2c3d4e5f601');
    expect(common).toHaveTextContent('word');
    expect(common).toHaveTextContent('REDIS');
    expect(common).toHaveTextContent('databases');
    expect(common).toHaveTextContent('Culpables posibles');
    expect(common).toHaveTextContent('Término · REDIS');
  });

  it('sin campos bilingües no hay panel «Textos» (TS-34)', async () => {
    const { dialog } = await openDrawer('Grep Grid #6');
    expect(within(dialog).queryByRole('region', { name: 'Textos' })).toBeNull();
    expect(within(dialog).getByRole('region', { name: 'Datos del desafío' })).toHaveTextContent(
      'NGINX',
    );
  });

  it('log de verificación con glifo y texto, y forma cruda (TS-36)', async () => {
    const { dialog } = await openDrawer();
    const log = within(dialog).getByRole('region', { name: 'Log de verificación' });
    expect(log).toHaveTextContent('✓');
    expect(log).toHaveTextContent('solution_verified');
    expect(log).toHaveTextContent('translation_consistent');
  });

  it('log con forma no reconocida muestra filas clave · valor (TS-36)', async () => {
    const raw = {
      groups: [
        {
          ...DEVDLE_GROUP,
          challenge: { ...DEVDLE_GROUP.challenge, verification: { foo: 'bar' } },
        },
      ],
    };
    server.use(adminHandlers.reports('open', raw));
    const { dialog } = await openDrawer();
    const log = within(dialog).getByRole('region', { name: 'Log de verificación' });
    expect(log).toHaveTextContent('foo');
    expect(log).toHaveTextContent('bar');
  });

  it('lista cada reporte como article con sus datos (TS-37)', async () => {
    const { dialog } = await openDrawer();
    const articles = within(dialog).getAllByRole('article');
    expect(articles).toHaveLength(3);
    const [a1, a2] = articles as [HTMLElement, HTMLElement];
    expect(within(a1).getByRole('heading', { name: 'Respuesta incorrecta' })).toBeInTheDocument();
    expect(a1).toHaveTextContent('es · hace 2 h · jugador a1b2c3d4');
    expect(a1).toHaveTextContent('«dos palabras posibles»');
    expect(a1).toHaveTextContent('partida en curso');
    expect(a1).toHaveTextContent('Mozilla/5.0 Chrome/130');
    expect(a2).toHaveTextContent('(sin mensaje)');
    expect(a2).toHaveTextContent('partida terminada');
    for (const article of articles) {
      expect(within(article).getByRole('button', { name: 'Resolver' })).toBeInTheDocument();
      expect(within(article).getByRole('button', { name: 'Descartar' })).toBeInTheDocument();
    }
  });

  it('el mensaje del jugador es texto plano (TS-38)', async () => {
    const { dialog } = await openDrawer();
    const article = within(dialog).getAllByRole('article')[2] as HTMLElement;
    expect(article).toHaveTextContent('<b>REDIS</b> es la respuesta');
    expect(article.querySelector('b')).toBeNull();
  });

  it('resolver un reporte lo marca, recarga la lista y mueve el foco (TS-39)', async () => {
    const { dialog, user } = await openDrawer();
    server.use(
      adminHandlers.patchReport(R1.id, { ...R1, status: 'resolved' }),
      adminHandlers.reports('open', {
        groups: [
          { ...DEVDLE_GROUP, reports: [R2, R3], report_count: 2 },
          ...OPEN_GROUPS.groups.slice(1),
        ],
      }),
    );
    const first = within(dialog).getAllByRole('article')[0] as HTMLElement;
    await user.click(within(first).getByRole('button', { name: 'Resolver' }));
    await waitFor(() => {
      expect(within(first).getByText('resuelto')).toBeInTheDocument();
    });
    expect(requestsTo('PATCH', `/api/admin/reports/${R1.id}`)[0]?.body).toEqual({
      status: 'resolved',
    });
    expect(within(first).queryByRole('button')).toBeNull();
    await waitFor(() => {
      expect(requestsTo('GET', '/api/admin/reports')).toHaveLength(2);
    });
    expect(screen.getByRole('dialog', { name: 'Devdle #8' })).toBeInTheDocument();
    const second = within(dialog).getAllByRole('article')[1] as HTMLElement;
    await waitFor(() => {
      expect(within(second).getByRole('button', { name: 'Resolver' })).toHaveFocus();
    });
  });

  it('muestra «Resolviendo…» solo en la fila en curso (TS-39)', async () => {
    const { dialog, user } = await openDrawer();
    let release: () => void = () => undefined;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    const original = window.fetch;
    vi.spyOn(window, 'fetch').mockImplementation(async (input, init) => {
      if (init?.method === 'PATCH') await gate;
      return original(input, init);
    });
    server.use(adminHandlers.patchReport(R1.id, { ...R1, status: 'resolved' }));
    const [a1, a2] = within(dialog).getAllByRole('article') as [HTMLElement, HTMLElement];
    await user.click(within(a1).getByRole('button', { name: 'Resolver' }));
    expect(await within(a1).findByRole('button', { name: 'Resolviendo…' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(within(a2).getByRole('button', { name: 'Resolver' })).not.toHaveAttribute(
      'aria-disabled',
    );
    release();
    await within(a1).findByText('resuelto');
    vi.restoreAllMocks();
  });

  it('descartar un reporte (TS-40)', async () => {
    const { dialog, user } = await openDrawer();
    server.use(adminHandlers.patchReport(R2.id, { ...R2, status: 'dismissed' }));
    const a2 = within(dialog).getAllByRole('article')[1] as HTMLElement;
    await user.click(within(a2).getByRole('button', { name: 'Descartar' }));
    await within(a2).findByText('descartado');
    expect(requestsTo('PATCH', `/api/admin/reports/${R2.id}`)[0]?.body).toEqual({
      status: 'dismissed',
    });
  });

  it('cuando el grupo sale de la cola el drawer sigue mostrando los reportes (TS-41)', async () => {
    const { dialog, user } = await openDrawer('Tech Timeline #7');
    server.use(
      adminHandlers.patchReport(R4.id, { ...R4, status: 'resolved' }),
      adminHandlers.patchReport(R5.id, { ...R5, status: 'resolved' }),
      adminHandlers.reports('open', withoutOpen(TIMELINE_GROUP.challenge.id)),
    );
    const articles = within(dialog).getAllByRole('article');
    await user.click(within(articles[0] as HTMLElement).getByRole('button', { name: 'Resolver' }));
    await within(articles[0] as HTMLElement).findByText('resuelto');
    await user.click(within(articles[1] as HTMLElement).getByRole('button', { name: 'Resolver' }));
    await within(articles[1] as HTMLElement).findByText('resuelto');
    await waitFor(() => {
      expect(within(dialog).getAllByText('resuelto')).toHaveLength(2);
    });
    await user.click(within(dialog).getByRole('button', { name: 'Cerrar' }));
    const table = await screen.findByRole('table');
    expect(within(table).queryByText('Tech Timeline #7')).toBeNull();
    expect(screen.getByRole('link', { name: /2 grupos de reportes abiertos/ })).toBeInTheDocument();
  });

  it.each([
    ['report_not_open', 409],
    ['not_found', 404],
  ])('%s muestra el aviso de desactualizado y recarga (TS-42, TS-43)', async (code, status) => {
    const { dialog, user } = await openDrawer();
    server.use(adminHandlers.patchReport(R1.id, apiError(code, 'x'), { status }));
    const a1 = within(dialog).getAllByRole('article')[0] as HTMLElement;
    await user.click(within(a1).getByRole('button', { name: 'Resolver' }));
    const alert = await within(dialog).findByRole('alert');
    expect(alert).toHaveTextContent('Este reporte ya estaba cerrado. Actualizamos la lista.');
    await waitFor(() => {
      expect(requestsTo('GET', '/api/admin/reports')).toHaveLength(2);
    });
    expect(screen.getByRole('dialog', { name: 'Devdle #8' })).toBeInTheDocument();
  });

  it('falla de red al resolver conserva las acciones (TS-44)', async () => {
    const { dialog, user } = await openDrawer();
    server.use(adminHandlers.patchReportNetworkError(R1.id));
    const a1 = within(dialog).getAllByRole('article')[0] as HTMLElement;
    await user.click(within(a1).getByRole('button', { name: 'Resolver' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'No pudimos actualizar el reporte. Probá de nuevo.',
    );
    expect(within(a1).getByRole('button', { name: 'Resolver' })).not.toHaveAttribute(
      'aria-disabled',
    );
    expect(within(a1).getByRole('button', { name: 'Descartar' })).toBeInTheDocument();
  });

  it('reportes no abiertos no tienen acciones (TS-45)', async () => {
    const resolved = {
      groups: [
        {
          ...DEVDLE_GROUP,
          reports: DEVDLE_GROUP.reports.map((r) => ({ ...r, status: 'resolved' as const })),
        },
      ],
    };
    server.use(adminHandlers.reports('resolved', resolved));
    const view = renderWithProviders({ route: '/reports?status=resolved', session: SESSION });
    await view.user.click(await screen.findByRole('button', { name: 'Devdle #8' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getAllByText('resuelto')).toHaveLength(3);
    expect(within(dialog).queryByRole('button', { name: 'Resolver' })).toBeNull();
    expect(within(dialog).queryByRole('button', { name: 'Descartar' })).toBeNull();
  });

  it('desafío anulado: chip, motivo y botón deshabilitado (TS-46)', async () => {
    const { dialog, user } = await openDrawer('Grep Grid #6');
    expect(within(dialog).getAllByText('anulado').length).toBeGreaterThan(0);
    expect(within(dialog).queryByText('publicado')).toBeNull();
    expect(dialog).toHaveTextContent('Anulado el 2026-11-08 14:32 · definición incorrecta');
    const button = within(dialog).getByRole('button', { name: 'Anular desafío' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(dialog).toHaveTextContent('Solo se anulan desafíos publicados.');
    await user.click(button);
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(VOIDED_GROUP.challenge.status).toBe('voided');
  });

  it('Escape cierra y devuelve el foco a la fila (TS-47)', async () => {
    const { user, trigger } = await openDrawer();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('atrapa el foco (TS-48)', async () => {
    const { dialog, user } = await openDrawer();
    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>('button:not([disabled]), summary'),
    );
    const last = focusables[focusables.length - 1] as HTMLElement;
    last.focus();
    await user.tab();
    expect(within(dialog).getByRole('button', { name: 'Cerrar' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(last).toHaveFocus();
  });

  it('axe: publicado y anulado (TS-70)', async () => {
    const first = await openDrawer();
    expect(await axe(first.container)).toHaveNoViolations();
    first.unmount();
    const second = await openDrawer('Grep Grid #6');
    expect(await axe(second.container)).toHaveNoViolations();
  });
});
