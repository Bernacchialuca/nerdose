import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { SESSION } from '@/test/fixtures/reports';
import {
  UPCOMING_BAD_PAYLOAD,
  UPCOMING_BIG_O,
  UPCOMING_OK,
  UPCOMING_PENDING,
  UPCOMING_REGEN_FAILED,
  UPCOMING_REJECTED_ITEM,
  UPCOMING_REPLACED,
  upcoming,
} from '@/test/fixtures/upcoming';
import { useUpcomingClock } from '@/test/helpers';
import { adminHandlers, server } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

const render = () => renderWithProviders({ route: '/upcoming', session: SESSION });

async function openCell(
  user: ReturnType<typeof render>['user'],
  rowName: string,
  column: string,
): Promise<HTMLElement> {
  await screen.findByRole('table');
  const row = screen.getByRole('rowheader', { name: rowName }).closest('tr');
  const headers = screen.getAllByRole('columnheader').map((h) => h.textContent);
  const cell = within(row as HTMLElement).getAllByRole('cell')[headers.indexOf(column) - 1];
  await user.click(
    within(cell as HTMLElement).getByRole('button', { name: /, \d{4}-\d{2}-\d{2}/ }),
  );
  return screen.findByRole('dialog');
}

const previewReady = (dialog: HTMLElement) =>
  waitFor(() => {
    expect(dialog.querySelector('[lang="en"]')).not.toBeNull();
    expect(dialog.querySelector('[lang="es"]')).not.toBeNull();
  });

describe('drawer O-02 desde Próximos', () => {
  it('Grep Grid: chips, datos, paneles ES/EN y log, sin seed ni acciones de Reportes (TS-28, TS-54)', async () => {
    server.use(adminHandlers.upcoming(UPCOMING_OK));
    const { user } = render();
    const dialog = await openCell(user, '05/12 #35', 'Grep Grid');
    expect(within(dialog).getByRole('heading', { level: 2, name: 'Grep Grid #35' })).toBeVisible();
    for (const chip of ['Grep Grid', '#35', '2026-12-05', 'aprobado']) {
      expect(within(dialog).getAllByText(chip).length).toBeGreaterThan(0);
    }
    expect(within(dialog).getByText('Intento 0 · generator 1.4.0')).toBeInTheDocument();
    await previewReady(dialog);
    const es = within(dialog).getByRole('region', { name: 'ES' });
    const en = within(dialog).getByRole('region', { name: 'EN' });
    expect(es.parentElement).toHaveClass('lg:grid-cols-2');
    expect(en.parentElement).toBe(es.parentElement);
    expect(await within(es).findByText(/definición de REDIS/)).toBeInTheDocument();
    expect(await within(en).findByText(/definition of REDIS/)).toBeInTheDocument();
    expect(es.querySelector('[lang="es"]')).not.toBeNull();
    expect(en.querySelector('[lang="en"]')).not.toBeNull();
    expect(within(dialog).getByRole('heading', { name: 'Datos del desafío' })).toBeInTheDocument();
    expect(
      within(dialog).getByRole('heading', { name: 'Log de verificación' }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/solution_verified/)).toBeInTheDocument();
    expect(dialog.textContent).not.toMatch(/seed/i);
    for (const word of ['Reportes', 'Resolver', 'Descartar', 'Anular desafío']) {
      expect(within(dialog).queryByText(word)).toBeNull();
    }
    expect(within(dialog).getByRole('button', { name: 'Regenerar' })).not.toHaveAttribute(
      'aria-disabled',
    );
  });

  it('Devdle: palabra, definición y resumen en ES y EN (TS-29)', async () => {
    server.use(adminHandlers.upcoming(UPCOMING_OK));
    const { user } = render();
    const dialog = await openCell(user, '02/12 #32', 'Devdle');
    await previewReady(dialog);
    const es = within(dialog).getByRole('region', { name: 'ES' });
    const en = within(dialog).getByRole('region', { name: 'EN' });
    expect(
      await within(es).findByText(/biblioteca de JavaScript para construir interfaces de usuario/),
    ).toBeInTheDocument();
    expect(
      within(es).getByText(/React es una biblioteca de código abierto mantenida por Meta\./),
    ).toBeInTheDocument();
    expect(within(es).getAllByText(/REACT/).length).toBeGreaterThan(0);
    expect(
      await within(en).findByText(/JavaScript library for building user interfaces/),
    ).toBeInTheDocument();
  });

  it('Timeline: consigna y 5 hechos en el orden correcto (TS-30)', async () => {
    server.use(adminHandlers.upcoming(UPCOMING_OK));
    const { user } = render();
    const dialog = await openCell(user, '05/12 #35', 'Tech Timeline');
    await previewReady(dialog);
    const es = within(dialog).getByRole('region', { name: 'ES' });
    const en = within(dialog).getByRole('region', { name: 'EN' });
    expect(
      await within(es).findByText(/Ordená estos hitos del más antiguo al más reciente/),
    ).toBeInTheDocument();
    const labels = ['Python', 'Java', 'Go', 'Docker', 'Kubernetes'];
    const positions = labels.map((l) => es.textContent?.indexOf(`nota de ${l}`) ?? -1);
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(
      await within(en).findByText(/Order these milestones from oldest to newest/),
    ).toBeInTheDocument();
    expect(within(en).getByText(/note on Python/)).toBeInTheDocument();
  });

  it('un juego sin Preview cae a PayloadView sin aviso (TS-31)', async () => {
    server.use(adminHandlers.upcoming(UPCOMING_BIG_O));
    const { user } = render();
    const dialog = await openCell(user, '02/12 #32', 'Big O');
    expect(within(dialog).getByRole('heading', { level: 2, name: 'Big O #32' })).toBeVisible();
    expect(within(dialog).getByRole('region', { name: 'ES' })).toHaveTextContent(
      'ordena con mezcla',
    );
    expect(within(dialog).getByRole('region', { name: 'EN' })).toHaveTextContent('merge sort');
    const common = within(dialog).getByRole('region', { name: 'Datos del desafío' });
    expect(common).toHaveTextContent('answer');
    expect(common).toHaveTextContent('O(n log n)');
    expect(dialog.textContent).not.toContain('Culpables posibles');
    expect(within(dialog).queryByText(/No pudimos mostrar la preview/)).toBeNull();
  });

  it('un payload inválido muestra aviso y la vista genérica sin cerrar el detalle (TS-32)', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.use(adminHandlers.upcoming(UPCOMING_BAD_PAYLOAD));
    const { user } = render();
    const dialog = await openCell(user, '02/12 #32', 'Devdle');
    expect(
      await within(dialog).findByText(
        'No pudimos mostrar la preview del juego. Mostramos los datos del desafío.',
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('region', { name: 'ES' })).toBeInTheDocument();
    expect(within(dialog).getByRole('region', { name: 'Datos del desafío' })).toHaveTextContent(
      'redis',
    );
    expect(
      within(dialog).getByRole('heading', { name: 'Log de verificación' }),
    ).toBeInTheDocument();
    // React también registra el error capturado; el del boundary es el que llega solo, como Error.
    expect(
      spy.mock.calls.filter(([only, ...rest]) => only instanceof Error && rest.length === 0),
    ).toHaveLength(1);
    spy.mockRestore();
  });

  it('el detalle nunca muestra el seed aunque la verificación traiga reason indefinido (TS-54)', async () => {
    const base = upcoming();
    const game = base.days[0]?.games[0];
    if (game?.challenge) {
      game.challenge.verification = {
        ok: true,
        checks: [{ name: 'solution_verified', ok: true }],
        reason: undefined,
      };
    }
    server.use(adminHandlers.upcoming(base));
    const { user } = render();
    const dialog = await openCell(user, '02/12 #32', 'Devdle');
    await previewReady(dialog);
    expect(dialog.textContent).not.toMatch(/seed/i);
  });

  it('sub-estados: pendiente, fallida e ítem rechazado (TS-33)', async () => {
    useUpcomingClock();
    server.use(adminHandlers.upcoming(UPCOMING_PENDING));
    const first = render();
    let dialog = await openCell(first.user, '05/12 #35', 'Grep Grid');
    expect(within(dialog).getByText('regenerando…')).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        'Regeneración pendiente desde las 14:02. Mientras tanto este desafío sigue aprobado y se publica tal cual si llega su fecha.',
      ),
    ).toBeInTheDocument();
    const pending = within(dialog).getByRole('button', { name: 'Regenerando…' });
    expect(pending).toHaveAttribute('aria-disabled', 'true');
    await first.user.click(pending);
    expect(screen.queryByRole('dialog', { name: 'Regenerar desafío' })).toBeNull();
    first.unmount();

    server.use(adminHandlers.upcoming(UPCOMING_REGEN_FAILED));
    const second = render();
    dialog = await openCell(second.user, '05/12 #35', 'Grep Grid');
    expect(within(dialog).getByText('regeneración fallida')).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        'La última regeneración falló a las 14:05: ningún reemplazo pasó la verificación (overlap_conflict). Queda este desafío.',
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Regenerar' })).not.toHaveAttribute(
      'aria-disabled',
    );
    second.unmount();

    server.use(adminHandlers.upcoming(UPCOMING_REJECTED_ITEM));
    const third = render();
    dialog = await openCell(third.user, '05/12 #35', 'Devdle');
    expect(within(dialog).getByText('usa un ítem rechazado')).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        'Este desafío usa un ítem rechazado: CAP theorem (definición incorrecta). No se regenera solo: regeneralo si no querés publicarlo.',
      ),
    ).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('varios ítems rechazados se listan uno por línea (D15)', async () => {
    const base = upcoming();
    const game = base.days[0]?.games[0];
    if (game?.challenge) {
      game.challenge.rejected_items = [
        { kind: 'term', id: 'a', label: 'CAP theorem', rejection_reason: 'definición incorrecta' },
        { kind: 'term', id: 'b', label: 'ACID', rejection_reason: 'ambiguo' },
      ];
    }
    server.use(adminHandlers.upcoming(base));
    const { user } = render();
    const dialog = await openCell(user, '02/12 #32', 'Devdle');
    expect(
      within(dialog).getByText(
        'Este desafío usa ítems rechazados. No se regenera solo: regeneralo si no querés publicarlo.',
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('CAP theorem (definición incorrecta)')).toBeInTheDocument();
    expect(within(dialog).getByText('ACID (ambiguo)')).toBeInTheDocument();
  });

  it('se actualiza con el polling cuando llega el reemplazo (TS-34)', async () => {
    useUpcomingClock();
    server.use(adminHandlers.upcomingSequence([UPCOMING_PENDING, UPCOMING_REPLACED]));
    const { user } = render();
    const dialog = await openCell(user, '05/12 #35', 'Grep Grid');
    expect(within(dialog).getByText('Intento 0 · generator 1.4.0')).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(5_000);
    await waitFor(() => {
      expect(within(dialog).getByText('Intento 3 · generator 1.4.0')).toBeInTheDocument();
    });
    expect(screen.getByRole('dialog')).toBe(dialog);
    expect(within(dialog).queryByText(/Regeneración pendiente/)).toBeNull();
    expect(within(dialog).getByRole('button', { name: 'Regenerar' })).not.toHaveAttribute(
      'aria-disabled',
    );
    vi.useRealTimers();
  });

  it('se cierra solo si el día sale de la ventana y el foco va al h1 (TS-35)', async () => {
    useUpcomingClock();
    server.use(
      adminHandlers.upcomingSequence([
        UPCOMING_PENDING,
        upcoming({}, { from: '2026-12-03', firstNumber: 33 }),
      ]),
    );
    const { user } = render();
    await openCell(user, '02/12 #32', 'Devdle');
    await vi.advanceTimersByTimeAsync(5_000);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(screen.getByRole('heading', { level: 1, name: 'Próximos desafíos' })).toHaveFocus();
    vi.useRealTimers();
  });

  it('Escape cierra y devuelve el foco al botón de la celda (TS-36)', async () => {
    server.use(adminHandlers.upcoming(UPCOMING_OK));
    const { user } = render();
    await openCell(user, '03/12 #33', 'Devdle');
    const opener = screen.getByRole('button', { name: /Devdle #33, 2026-12-03/ });
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(opener).toHaveFocus();
  });

  it('axe sin violaciones con preview de Grep Grid y con el fallback de Big O (TS-48)', async () => {
    server.use(adminHandlers.upcoming(UPCOMING_BIG_O));
    const first = render();
    let dialog = await openCell(first.user, '05/12 #35', 'Grep Grid');
    await previewReady(dialog);
    await within(dialog).findByText(/definition of REDIS/);
    expect(await axe(first.container)).toHaveNoViolations();
    first.unmount();
    const second = render();
    dialog = await openCell(second.user, '02/12 #32', 'Big O');
    expect(await axe(second.container)).toHaveNoViolations();
  });
});
