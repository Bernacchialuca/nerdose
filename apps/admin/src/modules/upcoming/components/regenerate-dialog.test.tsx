import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { SESSION, SESSION_KEY } from '@/test/fixtures/reports';
import { GG, REGEN_202, UPCOMING_OK, UPCOMING_PENDING } from '@/test/fixtures/upcoming';
import { useUpcomingClock } from '@/test/helpers';
import { adminHandlers, apiError, requestsTo, server } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

const UPCOMING_PATH = '/api/admin/challenges/upcoming';
const REGENERATE_PATH = `/api/admin/challenges/${GG('05')}/regenerate`;
const CELL_BUTTON = 'Regenerar Grep Grid #35';

const render = () => renderWithProviders({ route: '/upcoming', session: SESSION });

async function openModal(user: ReturnType<typeof render>['user']) {
  await screen.findByRole('table');
  await user.click(screen.getByRole('button', { name: CELL_BUTTON }));
  return screen.findByRole('dialog', { name: 'Regenerar desafío' });
}

describe('modal O-03', () => {
  it('abre con el texto asíncrono, foco en Regenerar y sin pedir nada todavía (TS-37)', async () => {
    server.use(adminHandlers.upcoming(UPCOMING_OK));
    const { user } = render();
    const dialog = await openModal(user);
    expect(
      within(dialog).getByText(
        'Se pedirá un reemplazo para Grep Grid #35 (2026-12-05). El generador lo prepara en segundo plano: si pasa la verificación reemplaza al actual; si no, queda el actual. Si llega la fecha antes, se publica el actual sin cambios.',
      ),
    ).toBeInTheDocument();
    const confirm = within(dialog).getByRole('button', { name: 'Regenerar' });
    expect(confirm).toHaveFocus();
    const buttons = within(dialog)
      .getAllByRole('button')
      .map((b) => b.textContent);
    expect(buttons.filter((t) => t !== '✕')).toEqual(['Regenerar', 'Cancelar']);
    expect(requestsTo('POST', REGENERATE_PATH)).toHaveLength(0);
  });

  it('confirmar deja la celda pendiente, cierra, enfoca la celda y retoma el polling (TS-38)', async () => {
    useUpcomingClock();
    server.use(
      adminHandlers.upcomingSequence([UPCOMING_OK, UPCOMING_PENDING]),
      adminHandlers.regenerate(GG('05'), REGEN_202, { status: 202 }),
    );
    const { user } = render();
    const dialog = await openModal(user);
    await user.click(within(dialog).getByRole('button', { name: 'Regenerar' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(requestsTo('POST', REGENERATE_PATH)).toHaveLength(1);
    const opener = await screen.findByRole('button', { name: /Regenerando….*pendiente/ });
    await waitFor(() => {
      expect(opener).toHaveFocus();
    });
    expect(screen.queryByRole('button', { name: CELL_BUTTON })).toBeNull();
    expect(screen.getByText(/Hay una regeneración en curso/)).toBeInTheDocument();
    const before = requestsTo('GET', UPCOMING_PATH).length;
    await vi.advanceTimersByTimeAsync(5_000);
    await waitFor(() => {
      expect(requestsTo('GET', UPCOMING_PATH).length).toBeGreaterThan(before);
    });
    vi.useRealTimers();
  });

  it('mientras pide: «Pidiendo…», un solo POST y Escape no cierra (TS-39)', async () => {
    server.use(adminHandlers.upcoming(UPCOMING_OK), adminHandlers.regeneratePending(GG('05')));
    const { user } = render();
    const dialog = await openModal(user);
    await user.click(within(dialog).getByRole('button', { name: 'Regenerar' }));
    const pending = await within(dialog).findByRole('button', { name: 'Pidiendo…' });
    expect(pending).toHaveAttribute('aria-disabled', 'true');
    await user.click(pending);
    expect(requestsTo('POST', REGENERATE_PATH)).toHaveLength(1);
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog', { name: 'Regenerar desafío' })).toBeInTheDocument();
  });

  it('409 not_regenerable avisa, bloquea y refresca la grilla (TS-40)', async () => {
    server.use(
      adminHandlers.upcoming(UPCOMING_OK),
      adminHandlers.regenerate(
        GG('05'),
        apiError(
          'not_regenerable',
          'Solo se puede regenerar un desafío aprobado de una fecha futura',
        ),
        { status: 409 },
      ),
    );
    const { user } = render();
    const dialog = await openModal(user);
    const before = requestsTo('GET', UPCOMING_PATH).length;
    await user.click(within(dialog).getByRole('button', { name: 'Regenerar' }));
    const alert = await within(dialog).findByRole('alert');
    expect(alert).toHaveTextContent(
      'Solo se puede regenerar un desafío aprobado de una fecha futura. Refrescá Próximos.',
    );
    expect(within(dialog).getByRole('button', { name: 'Regenerar' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await waitFor(() => {
      expect(requestsTo('GET', UPCOMING_PATH).length).toBeGreaterThan(before);
    });
    expect(screen.getByRole('dialog', { name: 'Regenerar desafío' })).toBeInTheDocument();
  });

  it('404 cierra sin mensaje y refresca (TS-41)', async () => {
    server.use(
      adminHandlers.upcoming(UPCOMING_OK),
      adminHandlers.regenerate(GG('05'), apiError('not_found', 'No encontrado'), { status: 404 }),
    );
    const { user } = render();
    const dialog = await openModal(user);
    const before = requestsTo('GET', UPCOMING_PATH).length;
    await user.click(within(dialog).getByRole('button', { name: 'Regenerar' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(screen.queryByRole('alert')).toBeNull();
    await waitFor(() => {
      expect(requestsTo('GET', UPCOMING_PATH).length).toBeGreaterThan(before);
    });
  });

  it('un error de red avisa y deja reintentar (TS-42)', async () => {
    server.use(adminHandlers.upcoming(UPCOMING_OK), adminHandlers.regenerateNetworkError(GG('05')));
    const { user } = render();
    const dialog = await openModal(user);
    await user.click(within(dialog).getByRole('button', { name: 'Regenerar' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'No pudimos pedir la regeneración. Probá de nuevo.',
    );
    const retry = within(dialog).getByRole('button', { name: 'Regenerar' });
    expect(retry).not.toHaveAttribute('aria-disabled');
    server.use(adminHandlers.regenerate(GG('05'), REGEN_202, { status: 202 }));
    await user.click(retry);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(requestsTo('POST', REGENERATE_PATH)).toHaveLength(2);
  });

  it('un 401 cierra la sesión sin mensajes del modal (TS-43)', async () => {
    server.use(
      adminHandlers.upcoming(UPCOMING_OK),
      adminHandlers.regenerate(GG('05'), apiError('unauthorized', 'Sesión vencida'), {
        status: 401,
      }),
    );
    const { user, router } = render();
    const dialog = await openModal(user);
    await user.click(within(dialog).getByRole('button', { name: 'Regenerar' }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');
    });
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    expect(await screen.findByText('La sesión venció, ingresá de nuevo.')).toBeInTheDocument();
    expect(screen.queryByText(/No pudimos pedir la regeneración/)).toBeNull();
  });

  it('Cancelar y Escape no piden nada y devuelven el foco (TS-44)', async () => {
    server.use(adminHandlers.upcoming(UPCOMING_OK));
    const { user } = render();
    const dialog = await openModal(user);
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: CELL_BUTTON })).toHaveFocus();
    await openModal(user);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: CELL_BUTTON })).toHaveFocus();
    expect(requestsTo('POST', REGENERATE_PATH)).toHaveLength(0);
  });

  it('desde el drawer: el detalle queda pendiente y el foco en su botón (TS-45)', async () => {
    useUpcomingClock();
    server.use(
      adminHandlers.upcomingSequence([UPCOMING_OK, UPCOMING_PENDING]),
      adminHandlers.regenerate(GG('05'), REGEN_202, { status: 202 }),
    );
    const { user } = render();
    await screen.findByRole('table');
    await user.click(screen.getByRole('button', { name: /Grep Grid #35, 2026-12-05/ }));
    const drawer = await screen.findByRole('dialog', { name: 'Grep Grid #35' });
    await user.click(within(drawer).getByRole('button', { name: 'Regenerar' }));
    const modal = await screen.findByRole('dialog', { name: 'Regenerar desafío' });
    await user.click(within(modal).getByRole('button', { name: 'Regenerar' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Regenerar desafío' })).toBeNull();
    });
    const drawerNow = screen.getByRole('dialog', { name: 'Grep Grid #35' });
    expect(within(drawerNow).getByText('regenerando…')).toBeInTheDocument();
    expect(
      within(drawerNow).getByText(/Regeneración pendiente desde las 14:02/),
    ).toBeInTheDocument();
    const pending = within(drawerNow).getByRole('button', { name: 'Regenerando…' });
    expect(pending).toHaveAttribute('aria-disabled', 'true');
    await waitFor(() => {
      expect(pending).toHaveFocus();
    });
    vi.useRealTimers();
  });

  it('axe sin violaciones en default y en «no disponible» (TS-48)', async () => {
    server.use(
      adminHandlers.upcoming(UPCOMING_OK),
      adminHandlers.regenerate(
        GG('05'),
        apiError(
          'not_regenerable',
          'Solo se puede regenerar un desafío aprobado de una fecha futura',
        ),
        { status: 409 },
      ),
    );
    const { user, container } = render();
    const dialog = await openModal(user);
    expect(await axe(container)).toHaveNoViolations();
    await user.click(within(dialog).getByRole('button', { name: 'Regenerar' }));
    await within(dialog).findByRole('alert');
    expect(await axe(container)).toHaveNoViolations();
  });
});
