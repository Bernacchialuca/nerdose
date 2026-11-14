import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useUpcomingClock } from '@/test/helpers';
import {
  GG,
  REGEN_202,
  UPCOMING_OK,
  UPCOMING_PENDING,
  UPCOMING_REPLACED,
} from '@/test/fixtures/upcoming';
import { adminHandlers, requests, requestsTo, server } from '@/test/msw';

import { upcomingKeys } from './upcoming-keys';
import type { UpcomingResponse } from './types';
import { useRegenerateChallenge, withPendingRegeneration } from './use-regenerate-challenge';
import { hasPendingRegeneration, useUpcoming } from './use-upcoming';

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

const UPCOMING_PATH = '/api/admin/challenges/upcoming';

describe('useRegenerateChallenge (TS-12)', () => {
  it('envía POST con body {} y deja la celda pendiente en la cache', async () => {
    useUpcomingClock();
    server.use(
      adminHandlers.regenerate(GG('05'), REGEN_202, { status: 202 }),
      adminHandlers.upcomingSequence([UPCOMING_OK, UPCOMING_PENDING]),
    );
    const { queryClient, wrapper } = setup();
    queryClient.setQueryData(upcomingKeys.list(14), UPCOMING_OK);
    // useUpcoming mantiene un observador activo: invalidar solo refetchea queries activas.
    const { result } = renderHook(
      () => ({ mutation: useRegenerateChallenge(), query: useUpcoming() }),
      { wrapper },
    );
    await waitFor(() => {
      expect(requestsTo('GET', UPCOMING_PATH)).toHaveLength(1);
    });
    await act(() => result.current.mutation.mutateAsync({ challenge_id: GG('05') }));
    const post = requestsTo('POST', `/api/admin/challenges/${GG('05')}/regenerate`);
    expect(post).toHaveLength(1);
    expect(post[0]?.headers.get('content-type')).toContain('application/json');
    expect(post[0]?.body).toEqual({});
    const cached = queryClient.getQueryData<UpcomingResponse>(upcomingKeys.list(14));
    const game = cached?.days
      .find((d) => d.date === '2026-12-05')
      ?.games.find((g) => g.game_id === 'grep-grid');
    expect(game?.regeneration).toEqual({
      request_id: REGEN_202.request_id,
      status: 'pending',
      error: null,
      requested_at: '2026-12-01T14:02:00Z',
      processed_at: null,
    });
    await waitFor(() => {
      expect(requestsTo('GET', UPCOMING_PATH).length).toBeGreaterThanOrEqual(2);
    });
    vi.useRealTimers();
  });

  it('withPendingRegeneration no muta y tolera data indefinida', () => {
    expect(withPendingRegeneration(undefined, GG('05'), REGEN_202)).toBeUndefined();
    const next = withPendingRegeneration(UPCOMING_OK, GG('05'), REGEN_202);
    expect(next).not.toBe(UPCOMING_OK);
    expect(UPCOMING_OK.days.flatMap((d) => d.games).every((g) => g.regeneration === null)).toBe(
      true,
    );
  });
});

describe('useUpcoming', () => {
  it('pide la ventana de 14 días', async () => {
    server.use(adminHandlers.upcoming(UPCOMING_OK));
    const { wrapper } = setup();
    const { result } = renderHook(() => useUpcoming(), { wrapper });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(requests[0]?.method).toBe('GET');
    expect(requests[0]?.pathname).toBe(UPCOMING_PATH);
    expect(requests[0]?.search).toBe('?days=14');
  });

  it('refetchea cada 5 s con un pendiente y corta al resolverse (TS-9)', async () => {
    useUpcomingClock();
    server.use(
      adminHandlers.upcomingSequence([UPCOMING_PENDING, UPCOMING_PENDING, UPCOMING_REPLACED]),
    );
    const { wrapper } = setup();
    const { result } = renderHook(() => useUpcoming(), { wrapper });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(requestsTo('GET', UPCOMING_PATH)).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(5_000);
    await waitFor(() => {
      expect(requestsTo('GET', UPCOMING_PATH)).toHaveLength(2);
    });
    await vi.advanceTimersByTimeAsync(5_000);
    await waitFor(() => {
      expect(requestsTo('GET', UPCOMING_PATH)).toHaveLength(3);
    });
    await vi.advanceTimersByTimeAsync(30_000);
    expect(requestsTo('GET', UPCOMING_PATH)).toHaveLength(3);
    vi.useRealTimers();
  });

  it('sin pendientes no hay polling (TS-10)', async () => {
    useUpcomingClock();
    server.use(adminHandlers.upcoming(UPCOMING_OK));
    const { wrapper } = setup();
    const { result } = renderHook(() => useUpcoming(), { wrapper });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    await vi.advanceTimersByTimeAsync(30_000);
    expect(requestsTo('GET', UPCOMING_PATH)).toHaveLength(1);
    vi.useRealTimers();
  });

  it('un pedido cancelado deja de verse pendiente (TS-11)', async () => {
    useUpcomingClock();
    server.use(adminHandlers.upcomingSequence([UPCOMING_PENDING, UPCOMING_OK]));
    const { wrapper, queryClient } = setup();
    const { result } = renderHook(() => useUpcoming(), { wrapper });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    await vi.advanceTimersByTimeAsync(5_000);
    await waitFor(() => {
      expect(requestsTo('GET', UPCOMING_PATH)).toHaveLength(2);
    });
    await vi.advanceTimersByTimeAsync(30_000);
    expect(requestsTo('GET', UPCOMING_PATH)).toHaveLength(2);
    // El estado vigente se lee de la cache: con reloj falso el re-render del hook se demora.
    expect(hasPendingRegeneration(queryClient.getQueryData(upcomingKeys.list(14)))).toBe(false);
    vi.useRealTimers();
  });
});
