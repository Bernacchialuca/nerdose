import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DEVDLE_ID,
  OPEN_GROUPS,
  R1,
  TERM_ID,
  SESSION,
  TIMELINE_GROUP,
  VOIDED_GROUP,
} from '@/test/fixtures/reports';
import { useFixedClock } from '@/test/helpers';
import { adminHandlers, requestsTo, server } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

beforeEach(() => {
  useFixedClock();
});
afterEach(() => {
  vi.useRealTimers();
});

async function tabTo(
  user: ReturnType<typeof renderWithProviders>['user'],
  target: () => HTMLElement,
) {
  for (let i = 0; i < 40 && document.activeElement !== target(); i += 1) await user.tab();
  expect(document.activeElement).toBe(target());
}

describe('teclado de punta a punta (TS-71)', () => {
  it('del login al aviso de anulación sin mouse', async () => {
    server.use(
      adminHandlers.login(SESSION),
      adminHandlers.reports('open', OPEN_GROUPS),
      adminHandlers.patchReport(R1.id, { ...R1, status: 'resolved' }),
      adminHandlers.voidChallenge(DEVDLE_ID, { challenge_id: DEVDLE_ID, affected_plays: 15 }),
    );
    const { user } = renderWithProviders({ route: '/login' });
    const field = await screen.findByLabelText('Contraseña');
    await waitFor(() => {
      expect(field).toHaveFocus();
    });
    await user.keyboard('correcta{Enter}');

    const rowButton = await screen.findByRole('button', { name: 'Devdle #8' });
    await tabTo(user, () => rowButton);
    await user.keyboard('{Enter}');

    const drawer = await screen.findByRole('dialog', { name: 'Devdle #8' });
    const resolve = within(drawer).getAllByRole('button', { name: 'Resolver' })[0] as HTMLElement;
    await tabTo(user, () => resolve);
    await user.keyboard('{Enter}');
    await within(drawer).findByText('resuelto');
    expect(requestsTo('PATCH', `/api/admin/reports/${R1.id}`)).toHaveLength(1);

    server.use(adminHandlers.reports('open', { groups: [TIMELINE_GROUP, VOIDED_GROUP] }));
    const voidButton = within(drawer).getByRole('button', { name: 'Anular desafío' });
    await tabTo(user, () => voidButton);
    await user.keyboard('{Enter}');

    const modal = await screen.findByRole('dialog', { name: 'Anular desafío' });
    expect(within(modal).getByLabelText('Motivo de la anulación')).toHaveFocus();
    await user.keyboard('definición incorrecta');
    await user.tab();
    const select = within(modal).getByLabelText('Culpable del error');
    expect(select).toHaveFocus();
    await user.selectOptions(select, 'Término · REDIS');
    expect(select).toHaveValue(`term:${TERM_ID}`);
    await user.tab();
    await user.tab();
    const submit = within(modal).getByRole('button', { name: 'Anular desafío' });
    expect(submit).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(
      await screen.findByText('Devdle #8 anulado · 15 partidas afectadas.'),
    ).toBeInTheDocument();
  });
});
