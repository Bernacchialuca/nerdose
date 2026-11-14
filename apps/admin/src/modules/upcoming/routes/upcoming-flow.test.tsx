import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SESSION } from '@/test/fixtures/reports';
import {
  GG,
  REGEN_202,
  UPCOMING_OK,
  UPCOMING_PENDING,
  UPCOMING_REPLACED,
} from '@/test/fixtures/upcoming';
import { useUpcomingClock } from '@/test/helpers';
import { adminHandlers, requestsTo, server } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

const UPCOMING_PATH = '/api/admin/challenges/upcoming';

describe('flujo completo de regeneración', () => {
  it('grilla, detalle, regenerar, pendiente, polling y reemplazo (TS-9, TS-34, TS-38)', async () => {
    useUpcomingClock();
    server.use(
      adminHandlers.upcomingSequence([
        UPCOMING_OK,
        UPCOMING_PENDING,
        UPCOMING_PENDING,
        UPCOMING_REPLACED,
      ]),
      adminHandlers.regenerate(GG('05'), REGEN_202, { status: 202 }),
    );
    const { user } = renderWithProviders({ route: '/upcoming', session: SESSION });
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: /Grep Grid #35, 2026-12-05/ }));
    const drawer = await screen.findByRole('dialog', { name: 'Grep Grid #35' });
    expect(within(drawer).getByText('Intento 0 · generator 1.4.0')).toBeInTheDocument();

    await user.click(within(drawer).getByRole('button', { name: 'Regenerar' }));
    const modal = await screen.findByRole('dialog', { name: 'Regenerar desafío' });
    await user.click(within(modal).getByRole('button', { name: 'Regenerar' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Regenerar desafío' })).toBeNull();
    });
    expect(requestsTo('POST', `/api/admin/challenges/${GG('05')}/regenerate`)).toHaveLength(1);
    expect(within(drawer).getByRole('button', { name: 'Regenerando…' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );

    // El poll devuelve primero el pendiente y recién después el reemplazo.
    for (let i = 0; i < 3; i += 1) {
      await vi.advanceTimersByTimeAsync(5_000);
    }
    await waitFor(() => {
      expect(within(drawer).getByText('Intento 3 · generator 1.4.0')).toBeInTheDocument();
    });
    expect(within(drawer).getByRole('button', { name: 'Regenerar' })).not.toHaveAttribute(
      'aria-disabled',
    );
    expect(screen.queryByText(/Hay una regeneración en curso/)).toBeNull();

    const settled = requestsTo('GET', UPCOMING_PATH).length;
    await vi.advanceTimersByTimeAsync(30_000);
    expect(requestsTo('GET', UPCOMING_PATH)).toHaveLength(settled);
    vi.useRealTimers();
  });
});
