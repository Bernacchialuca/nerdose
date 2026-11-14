import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SESSION } from '@/test/fixtures/reports';
import { GG, REGEN_202, UPCOMING_OK, UPCOMING_PENDING } from '@/test/fixtures/upcoming';
import { adminHandlers, requestsTo, server } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

describe('flujo solo con teclado (TS-49)', () => {
  it('abre el detalle, abre el modal y confirma sin mouse', async () => {
    server.use(
      adminHandlers.upcomingSequence([UPCOMING_OK, UPCOMING_PENDING]),
      adminHandlers.regenerate(GG('05'), REGEN_202, { status: 202 }),
    );
    const { user } = renderWithProviders({ route: '/upcoming', session: SESSION });
    await screen.findByRole('table');
    const opener = screen.getByRole('button', { name: /Grep Grid #35, 2026-12-05/ });

    for (let i = 0; i < 400 && document.activeElement !== opener; i += 1) {
      await user.tab();
    }
    expect(opener).toHaveFocus();
    await user.keyboard('{Enter}');

    const drawer = await screen.findByRole('dialog', { name: 'Grep Grid #35' });
    const regenerate = within(drawer).getByRole('button', { name: 'Regenerar' });
    for (let i = 0; i < 40 && document.activeElement !== regenerate; i += 1) {
      await user.tab();
    }
    expect(regenerate).toHaveFocus();
    await user.keyboard('{Enter}');

    const modal = await screen.findByRole('dialog', { name: 'Regenerar desafío' });
    expect(within(modal).getByRole('button', { name: 'Regenerar' })).toHaveFocus();
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Regenerar desafío' })).toBeNull();
    });
    expect(requestsTo('POST', `/api/admin/challenges/${GG('05')}/regenerate`)).toHaveLength(1);
    expect(
      within(screen.getByRole('dialog', { name: 'Grep Grid #35' })).getByRole('button', {
        name: 'Regenerando…',
      }),
    ).toHaveAttribute('aria-disabled', 'true');
  });
});
