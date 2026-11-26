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
const CELL = /^Ver Grep Grid #35, 2026-12-05:/;
const DRAWER = 'Grep Grid #35';

const render = () => renderWithProviders({ route: '/upcoming', session: SESSION });

// «Regenerar» solo vive en el drawer de la celda: la grilla no tiene botón propio.
async function openModal(user: ReturnType<typeof render>['user']) {
  if (!screen.queryByRole('dialog', { name: DRAWER })) {
    await user.click(await screen.findByRole('button', { name: CELL }));
  }
  const drawer = await screen.findByRole('dialog', { name: DRAWER });
  await user.click(within(drawer).getByRole('button', { name: 'Regenerar' }));
  return screen.findByRole('dialog', { name: 'Regenerar desafío' });
}

const drawerRegenerate = () =>
  within(screen.getByRole('dialog', { name: DRAWER })).getByRole('button', {
    name: /^Regenera(r|ndo…)$/,
  });

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

  it('confirmar cierra el modal, deja el detalle pendiente y retoma el polling (TS-38)', async () => {
    useUpcomingClock();
    server.use(
      adminHandlers.upcomingSequence([UPCOMING_OK, UPCOMING_PENDING]),
      adminHandlers.regenerate(GG('05'), REGEN_202, { status: 202 }),
    );
    const { user } = render();
    const dialog = await openModal(user);
    await user.click(within(dialog).getByRole('button', { name: 'Regenerar' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Regenerar desafío' })).toBeNull();
    });
    expect(requestsTo('POST', REGENERATE_PATH)).toHaveLength(1);
    // El drawer sigue abierto y pasa a pendiente con la data nueva del polling.
    expect(screen.getByRole('dialog', { name: DRAWER })).toBeInTheDocument();
    await waitFor(() => {
      expect(drawerRegenerate()).toHaveTextContent('Regenerando…');
    });
    expect(drawerRegenerate()).toHaveAttribute('aria-disabled', 'true');
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

  it('404 cierra el modal y el detalle sin mensaje y refresca (TS-41)', async () => {
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
    expect(screen.queryByRole('dialog', { name: DRAWER })).toBeNull();
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
      expect(screen.queryByRole('dialog', { name: 'Regenerar desafío' })).toBeNull();
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

  it('Cancelar y Escape no piden nada y devuelven el foco al «Regenerar» del drawer (TS-44)', async () => {
    server.use(adminHandlers.upcoming(UPCOMING_OK));
    const { user } = render();
    const dialog = await openModal(user);
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog', { name: 'Regenerar desafío' })).toBeNull();
    expect(drawerRegenerate()).toHaveFocus();
    await openModal(user);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Regenerar desafío' })).toBeNull();
    expect(screen.getByRole('dialog', { name: DRAWER })).toBeInTheDocument();
    expect(drawerRegenerate()).toHaveFocus();
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
    await user.click(screen.getByRole('button', { name: CELL }));
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
