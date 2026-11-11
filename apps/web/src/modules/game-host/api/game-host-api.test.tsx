import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import i18n from '@/i18n';
import { SessionProvider } from '@/modules/session';
import {
  acknowledgeVoidOk,
  gameTodayInProgress,
  gameTodayNotStarted,
  moveInProgress,
  moveWon,
  reportCreated,
} from '@/test/fixtures/game-today';
import { sessionFixture } from '@/test/fixtures/session';
import { apiError, gameHandlers, server } from '@/test/msw';

import { gameTodayKeys } from './game-today';
import type { GameToday } from './game-today';
import { useGameToday } from './use-game-today';
import { useAcknowledgeVoid } from './use-acknowledge-void';
import { useReport } from './use-report';
import { useStartPlay } from './use-start-play';
import { useSubmitMove } from './use-submit-move';

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

describe('useGameToday', () => {
  it('TS-8: pide el juego con el locale de la sesión y lo guarda por locale', async () => {
    const urls: string[] = [];
    server.use(
      http.get('/api/games/devdle/today', ({ request }) => {
        urls.push(request.url);
        return HttpResponse.json(gameTodayNotStarted);
      }),
    );
    const { wrapper, queryClient } = setup();
    const { result } = renderHook(() => useGameToday('devdle'), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual(gameTodayNotStarted));
    expect(new URL(urls[0] as string).search).toBe('?lang=es');
    expect(queryClient.getQueryData(['game-today', 'devdle', 'es'])).toEqual(gameTodayNotStarted);
  });

  it('no pide nada con enabled: false', async () => {
    let calls = 0;
    server.use(
      http.get('/api/games/devdle/today', () => {
        calls += 1;
        return HttpResponse.json(gameTodayNotStarted);
      }),
    );
    const { wrapper } = setup();
    const { result } = renderHook(() => useGameToday('devdle', { enabled: false }), { wrapper });
    await new Promise((r) => setTimeout(r, 50));
    expect(calls).toBe(0);
    expect(result.current.data).toBeUndefined();
  });
});

describe('useStartPlay', () => {
  it('TS-12: envía challenge_number y deja la Play en la cache', async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post('/api/games/devdle/today/start', async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({ play: gameTodayInProgress.play });
      }),
    );
    const { wrapper, queryClient } = setup();
    queryClient.setQueryData(gameTodayKeys.detail('devdle', 'es'), gameTodayNotStarted);
    const { result } = renderHook(() => useStartPlay('devdle'), { wrapper });
    await act(() => result.current.mutateAsync({ challengeNumber: 128 }));
    expect(bodies).toEqual([{ challenge_number: 128 }]);
    expect(
      queryClient.getQueryData<GameToday>(gameTodayKeys.detail('devdle', 'es'))?.play?.status,
    ).toBe('in_progress');
  });
});

describe('useSubmitMove', () => {
  it('TS-15: una jugada que no cierra actualiza la Play sin invalidar today', async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post('/api/games/devdle/today/move', async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(moveInProgress);
      }),
    );
    const { wrapper, queryClient } = setup();
    queryClient.setQueryData(gameTodayKeys.detail('devdle', 'es'), gameTodayInProgress);
    const { result } = renderHook(() => useSubmitMove('devdle'), { wrapper });
    await act(() =>
      result.current.mutateAsync({ challengeNumber: 128, move: { guess: 'SCRIPT' } }),
    );
    expect(bodies).toEqual([{ challenge_number: 128, move: { guess: 'SCRIPT' } }]);
    const data = queryClient.getQueryData<GameToday>(gameTodayKeys.detail('devdle', 'es'));
    expect(data?.play?.state).toEqual(moveInProgress.play.state);
    expect(data?.result).toBeNull();
  });

  it('TS-16: una jugada que cierra guarda result y game_stats e invalida today', async () => {
    server.use(gameHandlers.move(moveWon));
    const { wrapper, queryClient } = setup();
    queryClient.setQueryData(gameTodayKeys.detail('devdle', 'es'), gameTodayInProgress);
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useSubmitMove('devdle'), { wrapper });
    await act(() =>
      result.current.mutateAsync({ challengeNumber: 128, move: { guess: 'PARSER' } }),
    );
    const data = queryClient.getQueryData<GameToday>(gameTodayKeys.detail('devdle', 'es'));
    expect(data?.play?.status).toBe('won');
    expect(data?.result).toEqual(moveWon.result);
    expect(data?.game_stats).toEqual(moveWon.game_stats);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['today'] });
  });

  it('TS-23: ante no_session recrea la sesión una vez y reintenta', async () => {
    const calls: string[] = [];
    let moves = 0;
    server.use(
      http.post('/api/games/devdle/today/move', () => {
        calls.push('move');
        moves += 1;
        return moves === 1
          ? HttpResponse.json(apiError('no_session', 'Activá las cookies para jugar'), {
              status: 401,
            })
          : HttpResponse.json(moveInProgress);
      }),
      http.post('/api/session', () => {
        calls.push('session');
        return HttpResponse.json(sessionFixture);
      }),
    );
    const { wrapper } = setup();
    const { result } = renderHook(() => useSubmitMove('devdle'), { wrapper });
    await act(() =>
      result.current.mutateAsync({ challengeNumber: 128, move: { guess: 'SCRIPT' } }),
    );
    // El bootstrap de la SessionProvider también llama a /api/session al montar.
    expect(calls.filter((c) => c === 'move')).toHaveLength(2);
    const firstMove = calls.indexOf('move');
    expect(calls.slice(firstMove, firstMove + 3)).toEqual(['move', 'session', 'move']);
  });

  it('un error distinto de no_session se propaga sin reintentar', async () => {
    let moves = 0;
    server.use(
      http.post('/api/games/devdle/today/move', () => {
        moves += 1;
        return HttpResponse.json(apiError('invalid_move', 'Jugada inválida'), { status: 422 });
      }),
    );
    const { wrapper } = setup();
    const { result } = renderHook(() => useSubmitMove('devdle'), { wrapper });
    await act(async () => {
      await expect(
        result.current.mutateAsync({ challengeNumber: 128, move: { guess: 'X' } }),
      ).rejects.toMatchObject({ code: 'invalid_move' });
    });
    expect(moves).toBe(1);
  });
});

describe('useReport', () => {
  it('TS-42: envía el body sin message vacío e invalida la query del juego', async () => {
    const bodies: unknown[] = [];
    const urls: string[] = [];
    server.use(
      http.post('/api/games/devdle/today/report', async ({ request }) => {
        urls.push(new URL(request.url).search);
        bodies.push(await request.json());
        return HttpResponse.json(reportCreated, { status: 201 });
      }),
    );
    const { wrapper, queryClient } = setup();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useReport('devdle'), { wrapper });
    await act(() =>
      result.current.mutateAsync({ challengeNumber: 128, reason: 'other', message: '' }),
    );
    expect(urls).toEqual(['?lang=es']);
    expect(bodies).toEqual([{ challenge_number: 128, reason: 'other' }]);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['game-today', 'devdle'] });
  });

  it('manda el message cuando tiene contenido', async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post('/api/games/devdle/today/report', async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(reportCreated, { status: 201 });
      }),
    );
    const { wrapper } = setup();
    const { result } = renderHook(() => useReport('devdle'), { wrapper });
    await act(() =>
      result.current.mutateAsync({ challengeNumber: 128, reason: 'ambiguous', message: 'hola' }),
    );
    expect(bodies).toEqual([{ challenge_number: 128, reason: 'ambiguous', message: 'hola' }]);
  });

  it('TS-42: already_reported invalida la query y propaga el error', async () => {
    server.use(
      http.post('/api/games/devdle/today/report', () =>
        HttpResponse.json(apiError('already_reported', 'Ya reportaste este desafío.'), {
          status: 409,
        }),
      ),
    );
    const { wrapper, queryClient } = setup();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useReport('devdle'), { wrapper });
    await act(async () => {
      await expect(
        result.current.mutateAsync({ challengeNumber: 128, reason: 'other', message: '' }),
      ).rejects.toMatchObject({ code: 'already_reported' });
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['game-today', 'devdle'] });
  });

  it('otro error no invalida nada', async () => {
    server.use(
      http.post('/api/games/devdle/today/report', () =>
        HttpResponse.json(apiError('internal_error', 'x'), { status: 500 }),
      ),
    );
    const { wrapper, queryClient } = setup();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useReport('devdle'), { wrapper });
    await act(async () => {
      await expect(
        result.current.mutateAsync({ challengeNumber: 128, reason: 'other', message: '' }),
      ).rejects.toMatchObject({ code: 'internal_error' });
    });
    expect(invalidate).not.toHaveBeenCalled();
  });

  it('ante no_session recrea la sesión una vez y reintenta', async () => {
    const calls: string[] = [];
    let n = 0;
    server.use(
      http.post('/api/games/devdle/today/report', () => {
        calls.push('report');
        n += 1;
        return n === 1
          ? HttpResponse.json(apiError('no_session', 'x'), { status: 401 })
          : HttpResponse.json(reportCreated, { status: 201 });
      }),
      http.post('/api/session', () => {
        calls.push('session');
        return HttpResponse.json(sessionFixture);
      }),
    );
    const { wrapper } = setup();
    const { result } = renderHook(() => useReport('devdle'), { wrapper });
    await act(() =>
      result.current.mutateAsync({ challengeNumber: 128, reason: 'other', message: '' }),
    );
    const first = calls.indexOf('report');
    expect(calls.slice(first, first + 3)).toEqual(['report', 'session', 'report']);
  });
});

describe('useAcknowledgeVoid', () => {
  it('TS-42: envía challenge_number e invalida today y game-today', async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post('/api/games/devdle/today/acknowledge-void', async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(acknowledgeVoidOk);
      }),
    );
    const { wrapper, queryClient } = setup();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useAcknowledgeVoid('devdle'), { wrapper });
    await act(() => result.current.mutateAsync({ challengeNumber: 128 }));
    expect(bodies).toEqual([{ challenge_number: 128 }]);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['today'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['game-today'] });
  });

  it('ante no_session recrea la sesión una vez y reintenta', async () => {
    const calls: string[] = [];
    let n = 0;
    server.use(
      http.post('/api/games/devdle/today/acknowledge-void', () => {
        calls.push('ack');
        n += 1;
        return n === 1
          ? HttpResponse.json(apiError('no_session', 'x'), { status: 401 })
          : HttpResponse.json(acknowledgeVoidOk);
      }),
      http.post('/api/session', () => {
        calls.push('session');
        return HttpResponse.json(sessionFixture);
      }),
    );
    const { wrapper } = setup();
    const { result } = renderHook(() => useAcknowledgeVoid('devdle'), { wrapper });
    await act(() => result.current.mutateAsync({ challengeNumber: 128 }));
    const first = calls.indexOf('ack');
    expect(calls.slice(first, first + 3)).toEqual(['ack', 'session', 'ack']);
  });
});
