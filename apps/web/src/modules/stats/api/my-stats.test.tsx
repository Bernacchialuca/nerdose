import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import i18n from '@/i18n';
import { SessionProvider, useSession } from '@/modules/session';
import { countOf, recordCalls, settle } from '@/test/game-route-helpers';
import { todayNoSessionFixture } from '@/test/fixtures/today';
import { server } from '@/test/msw';

import { fetchMyStats, statsKeys } from './my-stats';
import { useMyStats } from './use-my-stats';

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <SessionProvider>{children}</SessionProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe('my-stats', () => {
  it('TS-1: fetchMyStats arma la URL de cada página', async () => {
    const calls = recordCalls();
    const first = await fetchMyStats('es', null);
    await fetchMyStats('en', '2026-11-02');
    expect(calls.map((c) => c.path)).toEqual([
      '/api/me/stats?lang=es',
      '/api/me/stats?lang=en&history_before=2026-11-02',
    ]);
    expect(first.history_next_before).toBe('2026-11-02');
    expect(first.games[0]).toHaveProperty('win_rate');
  });

  it('TS-2: statsKeys', () => {
    expect(statsKeys.all).toEqual(['me', 'stats']);
    expect(statsKeys.detail('en')).toEqual(['me', 'stats', 'en']);
  });

  it('TS-3: useMyStats pagina con history_next_before', async () => {
    const calls = recordCalls();
    const { wrapper, queryClient } = setup();
    const { result } = renderHook(() => useMyStats(), { wrapper });
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(1));
    expect(result.current.hasNextPage).toBe(true);
    await act(() => result.current.fetchNextPage());
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(countOf(calls, 'GET', '/api/me/stats?lang=es&history_before=2026-11-02')).toBe(1);
    expect(result.current.hasNextPage).toBe(false);
    expect(queryClient.getQueryData(['me', 'stats', 'es'])).toBeDefined();
  });

  it('TS-4: no llama sin sesión', async () => {
    server.use(http.get('/api/today', () => HttpResponse.json(todayNoSessionFixture)));
    const calls = recordCalls();
    const { wrapper } = setup();
    const { result } = renderHook(() => ({ stats: useMyStats(), session: useSession() }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.session.status).toBe('cookies_blocked'));
    await settle();
    expect(countOf(calls, 'GET', '/api/me/stats?lang=es')).toBe(0);
    expect(countOf(calls, 'POST', '/api/session')).toBe(1);
  });

  it('TS-38: al cambiar de idioma recupera las páginas ya cargadas', async () => {
    const calls = recordCalls();
    const { wrapper } = setup();
    const { result } = renderHook(() => ({ stats: useMyStats(), session: useSession() }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.stats.data?.pages).toHaveLength(1));
    await act(() => result.current.stats.fetchNextPage());
    await waitFor(() => expect(result.current.stats.data?.pages).toHaveLength(2));
    await act(() => result.current.session.changeLocale('en'));
    await waitFor(() =>
      expect(countOf(calls, 'GET', '/api/me/stats?lang=en&history_before=2026-11-02')).toBe(1),
    );
    await waitFor(() => expect(result.current.stats.data?.pages).toHaveLength(2));
  });
});
