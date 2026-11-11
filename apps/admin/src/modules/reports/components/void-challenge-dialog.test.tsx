import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import {
  DEVDLE_GROUP,
  DEVDLE_ID,
  FACT_2,
  OPEN_GROUPS,
  SESSION,
  SESSION_KEY,
  TERM_ID,
  TIMELINE_GROUP,
  TIMELINE_ID,
  VOIDED_GROUP,
} from '@/test/fixtures/reports';
import { useFixedClock } from '@/test/helpers';
import { adminHandlers, apiError, requestsTo, server } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

const AFTER_VOID = { groups: [TIMELINE_GROUP, VOIDED_GROUP] };

beforeEach(() => {
  useFixedClock();
  server.use(adminHandlers.reports('open', OPEN_GROUPS));
});
afterEach(() => {
  vi.useRealTimers();
});

async function openModal(from: 'drawer' | 'row' = 'drawer', name = 'Devdle #8') {
  const view = renderWithProviders({ route: '/reports', session: SESSION });
  if (from === 'row') {
    await view.user.click(await screen.findByRole('button', { name: `Anular ${name}` }));
  } else {
    await view.user.click(await screen.findByRole('button', { name }));
    const drawer = await screen.findByRole('dialog', { name });
    await view.user.click(within(drawer).getByRole('button', { name: 'Anular desafío' }));
  }
  const dialog = await screen.findByRole('dialog', { name: 'Anular desafío' });
  return { ...view, dialog };
}

const fill = async (
  view: Awaited<ReturnType<typeof openModal>>,
  reason: string,
  culprit: string,
) => {
  const { user, dialog } = view;
  await user.type(within(dialog).getByLabelText('Motivo de la anulación'), reason);
  await user.selectOptions(within(dialog).getByLabelText('Culpable del error'), culprit);
};
const confirm = (view: Awaited<ReturnType<typeof openModal>>) =>
  view.user.click(within(view.dialog).getByRole('button', { name: /^Anul(ar desafío|ando…)$/ }));

describe('modal de anulación (O-01)', () => {
  it('desde el drawer: contenido, foco y opciones sin preselección (TS-49)', async () => {
    const { dialog } = await openModal();
    expect(dialog).toHaveTextContent('Devdle #8 · 2026-11-08 · publicado');
    expect(within(dialog).getByLabelText('Motivo de la anulación')).toHaveFocus();
    const select = within(dialog).getByLabelText('Culpable del error');
    expect(select).toHaveValue('');
    expect(
      within(select)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual([
      'Elegí un culpable',
      'Término · REDIS',
      'La plantilla del juego',
      'Ninguno (no se identifica un culpable)',
    ]);
  });

  it('el resumen cambia con el culpable y describe el botón (TS-51)', async () => {
    const view = await openModal();
    const { dialog, user } = view;
    const select = within(dialog).getByLabelText('Culpable del error');
    await user.selectOptions(select, 'Término · REDIS');
    const button = within(dialog).getByRole('button', { name: 'Anular desafío' });
    const summary = document.getElementById(button.getAttribute('aria-describedby') ?? '');
    expect(summary).toHaveTextContent('El término REDIS queda rechazado y no vuelve a usarse.');
    expect(summary).toHaveTextContent(
      'Los desafíos ya generados de los próximos días que usen REDIS no cambian.',
    );
    await user.selectOptions(select, 'La plantilla del juego');
    expect(summary).toHaveTextContent('Ningún término ni hecho cambia de estado.');
    expect(summary).not.toHaveTextContent('REDIS');
  });

  it('valida localmente sin enviar (TS-52)', async () => {
    const view = await openModal();
    await view.user.type(within(view.dialog).getByLabelText('Motivo de la anulación'), '   ');
    await confirm(view);
    const reason = within(view.dialog).getByLabelText('Motivo de la anulación');
    const culprit = within(view.dialog).getByLabelText('Culpable del error');
    expect(requestsTo('POST', `/api/admin/challenges/${DEVDLE_ID}/void`)).toHaveLength(0);
    expect(reason).toHaveAttribute('aria-invalid', 'true');
    expect(reason).toHaveAccessibleDescription('Contá por qué se anula el desafío.');
    expect(culprit).toHaveAttribute('aria-invalid', 'true');
    expect(culprit).toHaveAccessibleDescription('Elegí el culpable del error.');
    expect(reason).toHaveFocus();
  });

  it('limita el motivo a 500 caracteres (TS-53)', async () => {
    const { dialog, user } = await openModal();
    const reason = within(dialog).getByLabelText('Motivo de la anulación');
    await user.click(reason);
    await user.paste('a'.repeat(501));
    expect((reason as HTMLTextAreaElement).value).toHaveLength(500);
  });

  it('anula con término: body exacto, carga, aviso con foco y lista actualizada (TS-54, TS-65)', async () => {
    const view = await openModal();
    let release: () => void = () => undefined;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    const original = window.fetch;
    vi.spyOn(window, 'fetch').mockImplementation(async (input, init) => {
      if (init?.method === 'POST') await gate;
      return original(input, init);
    });
    server.use(
      adminHandlers.voidChallenge(DEVDLE_ID, { challenge_id: DEVDLE_ID, affected_plays: 15 }),
    );
    await fill(view, '  definición incorrecta  ', 'Término · REDIS');
    await confirm(view);
    expect(requestsTo('POST', `/api/admin/challenges/${DEVDLE_ID}/void`)).toHaveLength(0);
    const busy = await within(view.dialog).findByRole('button', { name: 'Anulando…' });
    expect(busy).toHaveAttribute('aria-disabled', 'true');
    expect(within(view.dialog).getByRole('button', { name: 'Cancelar' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await view.user.keyboard('{Escape}');
    expect(screen.getByRole('dialog', { name: 'Anular desafío' })).toBeInTheDocument();
    server.use(adminHandlers.reports('open', AFTER_VOID));
    release();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(requestsTo('POST', `/api/admin/challenges/${DEVDLE_ID}/void`)[0]?.body).toEqual({
      void_reason: 'definición incorrecta',
      culprit: { kind: 'term', id: TERM_ID },
    });
    const status = screen.getByText('Devdle #8 anulado · 15 partidas afectadas.');
    expect(status.closest('[role="status"]')).toHaveTextContent(
      'Los reportes abiertos quedaron resueltos.',
    );
    await waitFor(() => {
      expect(status.closest('[tabindex="-1"]')).toHaveFocus();
    });
    const table = await screen.findByRole('table');
    await waitFor(() => {
      expect(within(table).queryByText('Devdle #8')).toBeNull();
    });
    expect(screen.getByRole('link', { name: /2 grupos de reportes abiertos/ })).toBeInTheDocument();
    await view.user.click(screen.getByRole('button', { name: 'Cerrar aviso' }));
    expect(screen.queryByText(/Devdle #8 anulado/)).toBeNull();
    vi.restoreAllMocks();
  });

  it('el aviso de anulación desaparece al cambiar de pestaña (TS-28)', async () => {
    server.use(
      adminHandlers.voidChallenge(DEVDLE_ID, { challenge_id: DEVDLE_ID, affected_plays: 2 }),
      adminHandlers.reports('resolved', { groups: [] }),
    );
    const view = await openModal();
    await fill(view, 'motivo', 'La plantilla del juego');
    await confirm(view);
    expect(
      await screen.findByText('Devdle #8 anulado · 2 partidas afectadas.'),
    ).toBeInTheDocument();
    await view.user.click(screen.getByRole('tab', { name: 'Resueltos' }));
    expect(screen.queryByText(/Devdle #8 anulado/)).toBeNull();
  });

  it.each([
    ['Hecho · Primera versión de Linux', { kind: 'timeline_fact', id: FACT_2 }],
    ['La plantilla del juego', { kind: 'template' }],
    ['Ninguno (no se identifica un culpable)', { kind: 'none' }],
  ])('envía el culpable %s (TS-55)', async (option, culprit) => {
    server.use(
      adminHandlers.voidChallenge(TIMELINE_ID, { challenge_id: TIMELINE_ID, affected_plays: 1 }),
    );
    const view = await openModal('row', 'Tech Timeline #7');
    await fill(view, 'motivo', option);
    await confirm(view);
    await waitFor(() => {
      expect(requestsTo('POST', `/api/admin/challenges/${TIMELINE_ID}/void`)).toHaveLength(1);
    });
    expect(requestsTo('POST', `/api/admin/challenges/${TIMELINE_ID}/void`)[0]?.body).toEqual({
      void_reason: 'motivo',
      culprit,
    });
  });

  it('409 not_voidable: aviso, botón deshabilitado y recarga (TS-56)', async () => {
    server.use(
      adminHandlers.voidChallenge(DEVDLE_ID, apiError('not_voidable', 'x'), { status: 409 }),
    );
    const view = await openModal();
    await fill(view, 'motivo', 'La plantilla del juego');
    await confirm(view);
    const alert = await within(view.dialog).findByRole('alert');
    expect(alert).toHaveTextContent(
      'Este desafío ya no se puede anular: ya está anulado o no está publicado. Cerrá y revisá su estado en Reportes.',
    );
    expect(within(view.dialog).getByRole('button', { name: 'Anular desafío' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await waitFor(() => {
      expect(requestsTo('GET', '/api/admin/reports').length).toBeGreaterThan(1);
    });
    expect(screen.getByRole('dialog', { name: 'Anular desafío' })).toBeInTheDocument();
  });

  it('422 invalid_culprit deja reintentar (TS-57)', async () => {
    server.use(
      adminHandlers.voidChallenge(DEVDLE_ID, apiError('invalid_culprit', 'x'), { status: 422 }),
    );
    const view = await openModal();
    await fill(view, 'motivo', 'Término · REDIS');
    await confirm(view);
    expect(await within(view.dialog).findByRole('alert')).toHaveTextContent(
      'El culpable elegido no corresponde a este desafío. Elegí otro.',
    );
    expect(within(view.dialog).getByRole('button', { name: 'Anular desafío' })).not.toHaveAttribute(
      'aria-disabled',
    );
  });

  it('422 validation_error marca el motivo (TS-58)', async () => {
    server.use(
      adminHandlers.voidChallenge(DEVDLE_ID, apiError('validation_error', 'x'), { status: 422 }),
    );
    const view = await openModal();
    await fill(view, 'motivo', 'Término · REDIS');
    await confirm(view);
    const reason = within(view.dialog).getByLabelText('Motivo de la anulación');
    await waitFor(() => {
      expect(reason).toHaveAttribute('aria-invalid', 'true');
    });
    expect(reason).toHaveAccessibleDescription('Contá por qué se anula el desafío.');
    expect(within(view.dialog).queryByRole('alert')).toBeNull();
  });

  it.each([
    [
      '5xx',
      adminHandlers.voidChallenge(DEVDLE_ID, apiError('internal_error', 'x'), { status: 500 }),
    ],
    ['red', adminHandlers.voidChallengeNetworkError(DEVDLE_ID)],
  ])('error de sistema (%s) sin reintento automático (TS-59)', async (_n, handler) => {
    server.use(handler);
    const view = await openModal();
    await fill(view, 'motivo', 'Término · REDIS');
    await confirm(view);
    expect(await within(view.dialog).findByRole('alert')).toHaveTextContent(
      'No pudimos anular el desafío. No se aplicó ningún cambio: recargá Reportes y verificá su estado antes de reintentar.',
    );
    expect(requestsTo('POST', `/api/admin/challenges/${DEVDLE_ID}/void`)).toHaveLength(1);
  });

  it('404 not_found cierra modal y drawer y recarga (TS-60)', async () => {
    server.use(adminHandlers.voidChallenge(DEVDLE_ID, apiError('not_found', 'x'), { status: 404 }));
    const view = await openModal();
    await fill(view, 'motivo', 'Término · REDIS');
    await confirm(view);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(screen.queryByText(/anulado ·/)).toBeNull();
    await waitFor(() => {
      expect(requestsTo('GET', '/api/admin/reports').length).toBeGreaterThan(1);
    });
  });

  it('Cancelar, Cerrar y Escape cierran sin requests y devuelven el foco (TS-61, TS-62)', async () => {
    const view = await openModal();
    const drawerButton = screen.getAllByRole('button', { name: 'Anular desafío' })[0];
    await view.user.click(within(view.dialog).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog', { name: 'Anular desafío' })).toBeNull();
    expect(screen.getByRole('dialog', { name: 'Devdle #8' })).toBeInTheDocument();
    expect(drawerButton).toHaveFocus();
    expect(requestsTo('POST', `/api/admin/challenges/${DEVDLE_ID}/void`)).toHaveLength(0);

    await view.user.click(screen.getByRole('button', { name: 'Anular desafío' }));
    await view.user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Anular desafío' })).toBeNull();
    expect(screen.getByRole('dialog', { name: 'Devdle #8' })).toBeInTheDocument();

    await view.user.click(screen.getByRole('button', { name: 'Anular desafío' }));
    const modal = screen.getByRole('dialog', { name: 'Anular desafío' });
    await view.user.click(within(modal).getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByRole('dialog', { name: 'Anular desafío' })).toBeNull();
  });

  it('desde la fila, cerrar devuelve el foco a «Anular» (TS-61)', async () => {
    const view = await openModal('row');
    const trigger = screen.getByRole('button', { name: 'Anular Devdle #8' });
    await view.user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
    expect(DEVDLE_GROUP.challenge.status).toBe('published');
  });

  it('atrapa el foco del modal (TS-63)', async () => {
    const { dialog, user } = await openModal();
    const reason = within(dialog).getByLabelText('Motivo de la anulación');
    const close = within(dialog).getByRole('button', { name: 'Cerrar' });
    const submit = within(dialog).getByRole('button', { name: 'Anular desafío' });
    expect(reason).toHaveFocus();
    await user.tab();
    expect(within(dialog).getByLabelText('Culpable del error')).toHaveFocus();
    await user.tab();
    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    await user.tab();
    expect(submit).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
    await user.tab({ shift: true });
    expect(submit).toHaveFocus();
    close.focus();
    await user.tab();
    expect(close).not.toHaveFocus();
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('sesión vencida con el modal abierto lleva al login (TS-64)', async () => {
    server.use(
      adminHandlers.voidChallenge(DEVDLE_ID, apiError('unauthorized', 'x'), { status: 401 }),
    );
    const view = await openModal();
    await fill(view, 'motivo', 'Término · REDIS');
    await confirm(view);
    expect(await screen.findByText('La sesión venció, ingresá de nuevo.')).toBeInTheDocument();
    expect(view.router.state.location.pathname).toBe('/login');
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('axe: por defecto y con errores (TS-70)', async () => {
    const view = await openModal();
    expect(await axe(view.container)).toHaveNoViolations();
    await confirm(view);
    expect(await axe(view.container)).toHaveNoViolations();
  });
});
