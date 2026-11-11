import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { track } from '@nerdose/ui';
import { axe } from 'vitest-axe';

import {
  gameTodayInProgress,
  gameTodayLost,
  gameTodayNextDay,
  gameTodayNextDayNone,
  gameTodayNone,
  gameTodayNotStarted,
  gameTodayVoided,
  gameTodayVoidedFinished,
  gameTodayWon,
  moveInProgress,
  moveWon,
  RESULT_WIN_EN,
  todayAfterWin,
  todayOnlyDevdle,
} from '@/test/fixtures/game-today';
import { sessionFixture } from '@/test/fixtures/session';
import { todayFixture, todayNoSessionFixture } from '@/test/fixtures/today';
import {
  countOf,
  errorResponse,
  h1,
  recordCalls,
  setShare,
  settle,
} from '@/test/game-route-helpers';
import { gameHandlers, server } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

vi.mock('@nerdose/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nerdose/ui')>()),
  track: vi.fn(),
}));

const FILLED_CELLS = /^[A-Z], /;
const filledCells = (pattern = FILLED_CELLS) =>
  within(screen.getByRole('grid', { name: /^(Tablero|Board):/ })).getAllByLabelText(pattern);
const SHARE_WIN = '🟩 Devdle #128 · 3/6\n⬛🟨🟨⬛⬛⬛\n🟨⬛🟩⬛🟩🟩\n🟩🟩🟩🟩🟩🟩\nnerdose.dev';
const COOKIES =
  'Para jugar necesitamos una única cookie funcional, sin datos personales. Activá las cookies y tocá «Reintentar».';
const VOIDED = 'Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.';
const NO_CHALLENGE = 'Hoy no hay desafío de Devdle. Es un día neutro: no suma ni corta tu racha.';

const view = (route = '/devdle') => renderWithProviders({ route });

beforeEach(() => {
  server.use(gameHandlers.today(gameTodayNotStarted));
});

afterEach(() => {
  server.events.removeAllListeners();
  Reflect.deleteProperty(navigator, 'share');
  vi.restoreAllMocks();
  vi.mocked(track).mockClear();
  vi.useRealTimers();
});

/** El contador separa el rótulo de la hora en dos nodos: se compara el texto del párrafo entero. */
const countdown =
  (re: RegExp) =>
  (_content: string, el: Element | null): boolean =>
    el?.tagName === 'P' && re.test(el.textContent ?? '');

describe('abrir /devdle', () => {
  it('TS-9: sin Play muestra instrucciones con el header de juego', async () => {
    view();
    expect(await h1('Devdle')).toBeInTheDocument();
    expect(screen.getByText('Desafío #128 · ~2 min · una partida por día')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Empezar/ })).toBeInTheDocument();
    const header = screen.getByRole('banner');
    const nav = within(header).getByRole('navigation', { name: 'Ruta' });
    expect(within(nav).getByRole('link', { name: 'nerdose' })).toHaveAttribute('href', '/');
    expect(within(nav).getByText('devdle')).toHaveAttribute('aria-current', 'page');
    expect(within(header).getByText('desafío del 03/11')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: './juegos' })).toBeNull();
    expect(document.title).toBe('Devdle · nerdose');
  });

  it('TS-10: muestra el loader con el header de juego mientras carga', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    server.use(
      http.get('/api/games/devdle/today', async () => {
        await gate;
        return HttpResponse.json(gameTodayNotStarted);
      }),
    );
    view();
    const loader = await screen.findByRole('status');
    expect(loader).toHaveTextContent('$ cargando devdle…');
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    release();
    expect(await h1('Devdle')).toBeInTheDocument();
  });

  it('TS-11: error de carga con reintento', async () => {
    let calls = 0;
    server.use(
      http.get('/api/games/devdle/today', () => {
        calls += 1;
        return calls === 1
          ? errorResponse('internal_error', 'Error interno', 500)
          : HttpResponse.json(gameTodayNotStarted);
      }),
    );
    const user = userEvent.setup();
    view();
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'No pudimos cargar el desafío de Devdle. Revisá tu conexión e intentá de nuevo.',
    );
    expect(screen.queryByText(/internal_error/)).toBeNull();
    await user.click(within(alert).getByRole('button', { name: /Reintentar/ }));
    expect(await h1('Devdle')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Empezar/ })).toBeInTheDocument();
  });

  it('TS-13: retoma una Play en curso', async () => {
    server.use(gameHandlers.today(gameTodayInProgress));
    view();
    expect(
      await screen.findByText('término técnico · 6 letras · intento 3 de 6'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('B, no está')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Empezar/ })).toBeNull();
  });

  it('TS-14: con la Play terminada muestra el resultado', async () => {
    server.use(gameHandlers.today(gameTodayWon));
    view();
    expect(await h1('Ganaste en 3/6')).toBeInTheDocument();
    expect(screen.getAllByText('PARSER').length).toBeGreaterThan(0);
    // Un único «Compartir», en el header (como en el prototipo); no se repite en el cuerpo.
    await within(screen.getByRole('banner')).findByRole('button', { name: 'Compartir' });
    const compartir = screen.getAllByRole('button', { name: 'Compartir' });
    expect(compartir).toHaveLength(1);
    expect(screen.getByRole('banner')).toContainElement(compartir[0]!);
    expect(compartir[0]).not.toHaveAttribute('aria-disabled');
    expect(screen.getByRole('heading', { level: 2, name: 'rachas' })).toBeInTheDocument();
  });

  it('TS-31: game_id inválido cae en la 404 con el header de plataforma', async () => {
    const calls = recordCalls();
    view('/foo');
    expect(await h1('404 · página no encontrada')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: './juegos' })).toBeInTheDocument();
    expect(calls.filter((c) => c.path.startsWith('/api/games/'))).toEqual([]);
  });
});

describe('empezar', () => {
  it('TS-12: crea la Play una sola vez aunque se haga doble clic', async () => {
    const calls = recordCalls();
    const bodies: unknown[] = [];
    server.use(
      http.post('/api/games/devdle/today/start', async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({
          play: { status: 'in_progress', state: { guesses: [] }, score: null, code_language: null },
        });
      }),
    );
    const user = userEvent.setup();
    view();
    await user.dblClick(await screen.findByRole('button', { name: /Empezar/ }));
    expect(await screen.findByRole('group', { name: 'Teclado' })).toBeInTheDocument();
    expect(screen.getByText('término técnico · 6 letras · intento 1 de 6')).toBeInTheDocument();
    expect(bodies).toEqual([{ challenge_number: 128 }]);
    expect(countOf(calls, 'POST', '/api/games/devdle/today/start')).toBe(1);
    expect(countOf(calls, 'GET', '/api/games/devdle/today?lang=es')).toBe(1);
  });

  it('TS-26: errores al empezar', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/games/devdle/today/start', () =>
        errorResponse('challenge_voided', 'Este desafío fue anulado', 409),
      ),
    );
    const a = view();
    const start1 = await screen.findByRole('button', { name: /Empezar/ });
    server.use(gameHandlers.today(gameTodayVoided));
    await user.click(start1);
    expect((await screen.findAllByText(VOIDED)).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /Empezar/ })).toBeNull();
    a.unmount();

    server.use(
      gameHandlers.today(gameTodayNotStarted),
      http.post('/api/games/devdle/today/start', () =>
        errorResponse('no_challenge_today', 'Hoy no hay desafío para este juego', 404),
      ),
    );
    const b = view();
    const start2 = await screen.findByRole('button', { name: /Empezar/ });
    server.use(gameHandlers.today(gameTodayNone));
    await user.click(start2);
    expect(await screen.findByText(NO_CHALLENGE)).toBeInTheDocument();
    b.unmount();

    server.use(
      gameHandlers.today(gameTodayNotStarted),
      http.post('/api/games/devdle/today/start', () =>
        errorResponse('challenge_expired', 'El desafío cambió. Cargando el de hoy…', 409),
      ),
    );
    view();
    const start3 = await screen.findByRole('button', { name: /Empezar/ });
    server.use(gameHandlers.today(gameTodayNextDay));
    await user.click(start3);
    expect(
      await screen.findByText(/Empezó el desafío #129\. La partida de ayer quedó sin terminar/),
    ).toBeInTheDocument();
  });
});

describe('jugar', () => {
  it('TS-15: una jugada que no cierra actualiza el tablero sin pedir today', async () => {
    const calls = recordCalls();
    const bodies: unknown[] = [];
    server.use(
      gameHandlers.today(gameTodayInProgress),
      http.post('/api/games/devdle/today/move', async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(moveInProgress);
      }),
    );
    const user = userEvent.setup();
    view();
    await screen.findByText(/intento 3 de 6/);
    await settle();
    const todayBefore = countOf(calls, 'GET', '/api/today?lang=es');
    await user.keyboard('SCRIPT{Enter}');
    expect(await screen.findByText(/intento 4 de 6/)).toBeInTheDocument();
    await settle();
    expect(bodies).toEqual([{ challenge_number: 128, move: { guess: 'SCRIPT' } }]);
    expect(countOf(calls, 'POST', '/api/games/devdle/today/move?lang=es')).toBe(1);
    expect(countOf(calls, 'GET', '/api/today?lang=es')).toBe(todayBefore);
  });

  it('TS-16: una jugada que cierra muestra el resultado, enfoca el veredicto y refresca today', async () => {
    const calls = recordCalls();
    let todayCalls = 0;
    let todayCallsBeforeWin = Number.POSITIVE_INFINITY;
    server.use(
      gameHandlers.today(gameTodayInProgress),
      gameHandlers.move(moveWon),
      http.get('/api/today', () => {
        todayCalls += 1;
        return HttpResponse.json(todayCalls <= todayCallsBeforeWin ? todayFixture : todayAfterWin);
      }),
    );
    const user = userEvent.setup();
    view();
    await screen.findByText(/intento 3 de 6/);
    await settle();
    todayCallsBeforeWin = todayCalls;
    const todayBefore = countOf(calls, 'GET', '/api/today?lang=es');
    await user.keyboard('PARSER{Enter}');
    const verdict = await h1('Ganaste en 3/6');
    await waitFor(() => expect(verdict).toHaveFocus());
    // La jugada que gana dispara el confeti del host (decorativo, oculto a lectores).
    expect(screen.getByTestId('confetti')).toHaveAttribute('aria-hidden', 'true');
    expect(countOf(calls, 'GET', '/api/games/devdle/today?lang=es')).toBe(1);
    await waitFor(() =>
      expect(countOf(calls, 'GET', '/api/today?lang=es')).toBeGreaterThan(todayBefore),
    );
    const streaks = screen.getByRole('heading', { level: 2, name: 'rachas' }).closest('section');
    expect(streaks).not.toBeNull();
    await waitFor(() =>
      expect(within(streaks as HTMLElement).getByText('Global: 6 días')).toBeInTheDocument(),
    );
    expect(within(streaks as HTMLElement).getByText('Devdle: 3 días')).toBeInTheDocument();
    expect(within(streaks as HTMLElement).getByText('récord: 7')).toBeInTheDocument();
  });

  it('TS-17: not_in_word_list no consume intento', async () => {
    server.use(
      gameHandlers.today(gameTodayInProgress),
      http.post('/api/games/devdle/today/move', () =>
        errorResponse('not_in_word_list', 'La palabra no está en la lista', 422),
      ),
    );
    const user = userEvent.setup();
    view();
    await screen.findByText(/intento 3 de 6/);
    await user.keyboard('QWERTY{Enter}');
    expect(
      await screen.findByText('No está en la lista. Probá con otro término.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/intento 3 de 6/)).toBeInTheDocument();
  });

  it('TS-18: 429 no consume intento', async () => {
    server.use(
      gameHandlers.today(gameTodayInProgress),
      http.post('/api/games/devdle/today/move', () =>
        errorResponse('rate_limited', 'Demasiadas solicitudes', 429, { 'Retry-After': '5' }),
      ),
    );
    const user = userEvent.setup();
    view();
    await screen.findByText(/intento 3 de 6/);
    await user.keyboard('QWERTY{Enter}');
    expect(
      await screen.findByText('Vas muy rápido. Esperá unos segundos y probá de nuevo.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/intento 3 de 6/)).toBeInTheDocument();
  });

  it('TS-19: game_finished re-pide el juego y muestra el resultado', async () => {
    const calls = recordCalls();
    server.use(
      gameHandlers.today(gameTodayInProgress),
      http.post('/api/games/devdle/today/move', () =>
        errorResponse('game_finished', 'La partida ya terminó', 409),
      ),
    );
    const user = userEvent.setup();
    view();
    await screen.findByText(/intento 3 de 6/);
    server.use(gameHandlers.today(gameTodayWon));
    await user.keyboard('QWERTY{Enter}');
    expect(await h1('Ganaste en 3/6')).toBeInTheDocument();
    expect(countOf(calls, 'GET', '/api/games/devdle/today?lang=es')).toBe(2);
  });

  it('TS-20: challenge_expired vuelve a instrucciones del día nuevo con aviso', async () => {
    const calls = recordCalls();
    const bodies: unknown[] = [];
    server.use(
      gameHandlers.today(gameTodayInProgress),
      http.post('/api/games/devdle/today/move', () =>
        errorResponse('challenge_expired', 'El desafío cambió. Cargando el de hoy…', 409),
      ),
      http.post('/api/games/devdle/today/start', async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({ play: gameTodayInProgress.play });
      }),
    );
    const user = userEvent.setup();
    view();
    await screen.findByText(/intento 3 de 6/);
    server.use(
      gameHandlers.today(gameTodayNextDay),
      http.get('/api/today', () => HttpResponse.json({ ...todayFixture, number: 129 })),
    );
    await user.keyboard('QWERTY{Enter}');
    expect(
      await screen.findByText('Desafío #129 · ~2 min · una partida por día'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Devdle' })).toBeInTheDocument();
    const notice = screen.getByText(/Empezó el desafío #129\./);
    expect(notice.closest('[role="status"]')).not.toBeNull();
    expect(within(screen.getByRole('banner')).getByText('desafío del 04/11')).toBeInTheDocument();
    expect(countOf(calls, 'GET', '/api/games/devdle/today?lang=es')).toBe(2);
    await user.click(screen.getByRole('button', { name: /Empezar/ }));
    await screen.findByRole('group', { name: 'Teclado' });
    expect(bodies).toEqual([{ challenge_number: 129 }]);
    expect(screen.queryByText(/Empezó el desafío #129\./)).toBeNull();
  });

  it('TS-21: challenge_expired y el día nuevo sin desafío', async () => {
    server.use(
      gameHandlers.today(gameTodayInProgress),
      http.post('/api/games/devdle/today/move', () =>
        errorResponse('challenge_expired', 'El desafío cambió', 409),
      ),
    );
    const user = userEvent.setup();
    view();
    await screen.findByText(/intento 3 de 6/);
    server.use(gameHandlers.today(gameTodayNextDayNone));
    await user.keyboard('QWERTY{Enter}');
    expect(await screen.findByText(NO_CHALLENGE)).toBeInTheDocument();
    expect(screen.getByText(/Empezó el desafío #129\./)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Empezar/ })).toBeNull();
  });

  it('TS-22: challenge_voided a mitad de partida bloquea el teclado', async () => {
    const calls = recordCalls();
    server.use(
      gameHandlers.today(gameTodayInProgress),
      http.post('/api/games/devdle/today/move', () =>
        errorResponse('challenge_voided', 'Este desafío fue anulado', 409),
      ),
    );
    const user = userEvent.setup();
    view();
    await screen.findByText(/intento 3 de 6/);
    await settle();
    const todayBefore = countOf(calls, 'GET', '/api/today?lang=es');
    await user.keyboard('QWERTY{Enter}');
    const notice = await screen.findByText(VOIDED);
    expect(notice.closest('[role="status"]')).not.toBeNull();
    expect(screen.queryByRole('group', { name: 'Teclado' })).toBeNull();
    await user.keyboard('A');
    expect(countOf(calls, 'POST', '/api/games/devdle/today/move?lang=es')).toBe(1);
    await waitFor(() =>
      expect(countOf(calls, 'GET', '/api/today?lang=es')).toBeGreaterThan(todayBefore),
    );
  });
});

describe('sesión', () => {
  it('TS-23: no_session en una jugada se recupera sola', async () => {
    const calls = recordCalls();
    let moves = 0;
    server.use(
      gameHandlers.today(gameTodayInProgress),
      http.post('/api/games/devdle/today/move', () => {
        moves += 1;
        return moves === 1
          ? errorResponse('no_session', 'Activá las cookies para jugar', 401)
          : HttpResponse.json(moveInProgress);
      }),
    );
    const user = userEvent.setup();
    view();
    await screen.findByText(/intento 3 de 6/);
    await user.keyboard('SCRIPT{Enter}');
    expect(await screen.findByText(/intento 4 de 6/)).toBeInTheDocument();
    const order = calls
      .filter((c) => c.method === 'POST')
      .map((c) => c.path.split('?')[0])
      .slice(1);
    expect(order).toEqual([
      '/api/games/devdle/today/move',
      '/api/session',
      '/api/games/devdle/today/move',
    ]);
    const moveBodies = calls.filter((c) => c.path.startsWith('/api/games/devdle/today/move'));
    expect(moveBodies.map((c) => c.body)).toEqual([
      { challenge_number: 128, move: { guess: 'SCRIPT' } },
      { challenge_number: 128, move: { guess: 'SCRIPT' } },
    ]);
    expect(screen.queryByText(COOKIES)).toBeNull();
  });

  it('TS-24: no_session persistente muestra el banner y «Reintentar» reenvía la jugada', async () => {
    const calls = recordCalls();
    let healthy = false;
    server.use(
      gameHandlers.today(gameTodayInProgress),
      http.post('/api/games/devdle/today/move', () =>
        healthy
          ? HttpResponse.json(moveInProgress)
          : errorResponse('no_session', 'Activá las cookies para jugar', 401),
      ),
    );
    const user = userEvent.setup();
    view();
    await screen.findByText(/intento 3 de 6/);
    await user.keyboard('SCRIPT{Enter}');
    const banner = (await screen.findByText(COOKIES)).closest('[role="status"]') as HTMLElement;
    expect(screen.getByText(/intento 3 de 6/)).toBeInTheDocument();
    healthy = true;
    const sessionsBefore = countOf(calls, 'POST', '/api/session');
    await user.click(within(banner).getByRole('button', { name: /Reintentar/ }));
    expect(await screen.findByText(/intento 4 de 6/)).toBeInTheDocument();
    expect(countOf(calls, 'POST', '/api/session')).toBe(sessionsBefore + 1);
    expect(screen.queryByText(COOKIES)).toBeNull();
  });

  it('TS-25: una jugada que falla por 500 ofrece reintentar y recarga la partida', async () => {
    const calls = recordCalls();
    server.use(
      gameHandlers.today(gameTodayInProgress),
      http.post('/api/games/devdle/today/move', () => errorResponse('internal_error', 'x', 500)),
    );
    const user = userEvent.setup();
    view();
    await screen.findByText(/intento 3 de 6/);
    await user.keyboard('SCRIPT{Enter}');
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'No pudimos cargar tu partida. Revisá tu conexión e intentá de nuevo: retomás desde donde estabas.',
    );
    await user.click(within(alert).getByRole('button', { name: /Reintentar/ }));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    expect(countOf(calls, 'GET', '/api/games/devdle/today?lang=es')).toBe(2);
    expect(filledCells(/^[A-Z], (correcta|en otra posición|no está)$/)).toHaveLength(12);
  });

  it('TS-27: sin sesión al cargar deshabilita «Empezar» y ofrece «Reintentar»', async () => {
    const calls = recordCalls();
    server.use(http.get('/api/today', () => HttpResponse.json(todayNoSessionFixture)));
    const user = userEvent.setup();
    view();
    const start = await screen.findByRole('button', { name: /Empezar/ });
    await waitFor(() => expect(start).toHaveAttribute('aria-disabled', 'true'));
    expect(screen.getByText(COOKIES)).toBeInTheDocument();
    expect(screen.queryByText('Activá las cookies para poder jugar')).toBeNull();
    expect(screen.getAllByRole('button', { name: /Reintentar/ })).toHaveLength(1);
    await user.click(start);
    expect(countOf(calls, 'POST', '/api/games/devdle/today/start')).toBe(0);
  });

  it('TS-28: sesión no disponible', async () => {
    server.use(
      http.post('/api/session', () => errorResponse('rate_limited', 'Demasiadas solicitudes', 429)),
    );
    view();
    const start = await screen.findByRole('button', { name: /Empezar/ });
    expect(start).toHaveAttribute('aria-disabled', 'true');
    expect(
      screen.getByText('No pudimos iniciar tu sesión. Recargá en unos minutos para jugar.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Reintentar/ })).toBeNull();
  });
});

describe('estados sin client', () => {
  it('TS-29: sin desafío hoy', async () => {
    server.use(gameHandlers.today(gameTodayNone));
    view();
    expect(await h1('Devdle')).toBeInTheDocument();
    expect(screen.getByText(NO_CHALLENGE).closest('[role="status"]')).not.toBeNull();
    expect(screen.getByRole('link', { name: /Volver a los juegos/ })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('button', { name: /Empezar/ })).toBeNull();
    expect(screen.queryByRole('group', { name: 'Teclado' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cómo se juega' })).toBeNull();
  });

  it('TS-30: un juego válido sin client no llama a la api', async () => {
    const calls = recordCalls();
    view('/big-o');
    expect(await h1('Big O')).toBeInTheDocument();
    expect(
      screen.getByText('Hoy no hay desafío de Big O. Es un día neutro: no suma ni corta tu racha.'),
    ).toBeInTheDocument();
    expect(calls.filter((c) => c.path.startsWith('/api/games/big-o'))).toEqual([]);
    const nav = within(screen.getByRole('banner')).getByRole('navigation', { name: 'Ruta' });
    expect(within(nav).getByText('big-o')).toBeInTheDocument();
  });

  it('TS-32: anulado sin Play abre O-02 sobre el aviso, sin poder empezar', async () => {
    server.use(gameHandlers.today(gameTodayVoided));
    view();
    expect(await h1('Devdle')).toBeInTheDocument();
    expect(await screen.findByRole('alertdialog', { name: 'Desafío anulado' })).toBeInTheDocument();
    expect(screen.getAllByText(VOIDED)).toHaveLength(2);
    expect(screen.getByRole('link', { name: /Volver a los juegos/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Empezar/ })).toBeNull();
  });

  it('TS-33: resultado anulado en un solo banner', async () => {
    server.use(gameHandlers.today(gameTodayVoidedFinished));
    view();
    const title = await h1('Desafío anulado');
    expect(title.closest('[role="status"]')).toHaveTextContent(VOIDED);
    expect(screen.queryByRole('button', { name: 'Compartir' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Compartir resultado/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: 'rachas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Volver a los juegos/ })).toBeInTheDocument();
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });
});

describe('idioma', () => {
  it('TS-34: cambiar a EN en partida no vacía el tablero', async () => {
    const calls = recordCalls();
    server.use(gameHandlers.today(gameTodayInProgress));
    const user = userEvent.setup();
    view();
    await screen.findByText(/intento 3 de 6/);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    server.use(
      http.get('/api/games/devdle/today', async ({ request }) => {
        if (new URL(request.url).searchParams.get('lang') === 'en') await gate;
        return HttpResponse.json(gameTodayInProgress);
      }),
    );
    await user.click(
      within(screen.getByRole('group', { name: 'Idioma' })).getByRole('button', { name: 'EN' }),
    );
    await waitFor(() => expect(countOf(calls, 'GET', '/api/games/devdle/today?lang=en')).toBe(1));
    expect(screen.queryByText('$ cargando devdle…')).toBeNull();
    expect(filledCells()).toHaveLength(12);
    release();
    expect(await screen.findByText('tech term · 6 letters · try 3 of 6')).toBeInTheDocument();
  });

  it('TS-35: cambiar a EN en el resultado traduce definición y resumen', async () => {
    server.use(gameHandlers.today(gameTodayWon));
    const user = userEvent.setup();
    view();
    await h1('Ganaste en 3/6');
    server.use(
      http.get('/api/games/devdle/today', ({ request }) =>
        HttpResponse.json(
          new URL(request.url).searchParams.get('lang') === 'en'
            ? { ...gameTodayWon, result: RESULT_WIN_EN }
            : gameTodayWon,
        ),
      ),
    );
    await user.click(
      within(screen.getByRole('group', { name: 'Idioma' })).getByRole('button', { name: 'EN' }),
    );
    expect(
      await screen.findByText(
        'Program that analyzes a string of text according to a formal grammar.',
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText('PARSER').length).toBeGreaterThan(0);
    expect(await h1('You won in 3/6')).toBeInTheDocument();
  });
});

describe('header', () => {
  it('TS-36: en partida muestra ayuda, estadísticas y Compartir deshabilitado', async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    server.use(gameHandlers.today(gameTodayInProgress));
    const user = userEvent.setup();
    view();
    await screen.findByText(/intento 3 de 6/);
    const header = within(screen.getByRole('banner'));
    expect(header.getByRole('link', { name: 'Estadísticas' })).toHaveAttribute('href', '/stats');
    const share = header.getByRole('button', {
      name: 'Compartir resultado (disponible al terminar)',
    });
    expect(share).toHaveAttribute('aria-disabled', 'true');
    expect(share).toHaveAttribute('title', 'Disponible al terminar la partida');
    const write = vi.spyOn(navigator.clipboard, 'writeText');
    await user.click(share);
    expect(write).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
    expect(header.getByRole('group', { name: 'Idioma' })).toBeInTheDocument();
    expect(header.getByText('5')).toBeInTheDocument();
    await user.click(header.getByRole('button', { name: 'Cómo se juega' }));
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
    const target = scrollIntoView.mock.contexts[0] as HTMLElement;
    expect(target.id).toBe('game-help');
  });

  it('TS-37: en el resultado el Compartir del header comparte el mismo texto', async () => {
    server.use(gameHandlers.today(gameTodayWon));
    const user = userEvent.setup();
    view();
    await h1('Ganaste en 3/6');
    const header = within(screen.getByRole('banner'));
    expect(header.queryByRole('button', { name: 'Cómo se juega' })).toBeNull();
    const write = vi.spyOn(navigator.clipboard, 'writeText');
    await user.click(await header.findByRole('button', { name: 'Compartir' }));
    await waitFor(() => expect(write).toHaveBeenCalledWith(SHARE_WIN));
  });
});

describe('compartir', () => {
  async function openResult(data: unknown = gameTodayWon) {
    server.use(gameHandlers.today(data));
    const user = userEvent.setup(
      vi.isFakeTimers() ? { advanceTimers: vi.advanceTimersByTime.bind(vi) } : undefined,
    );
    view();
    await screen.findByRole('heading', { level: 1 });
    const header = within(screen.getByRole('banner'));
    return { user, button: await header.findByRole('button', { name: /Compartir/ }) };
  }

  it('TS-38: usa el share nativo y no incluye la solución', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setShare(share);
    const { user, button } = await openResult();
    const write = vi.spyOn(navigator.clipboard, 'writeText');
    await user.click(button);
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(write).not.toHaveBeenCalled();
    expect(share).toHaveBeenCalledWith({ text: SHARE_WIN });
    expect(share.mock.calls[0]?.[0].text).not.toMatch(/PARSER|software_engineering/);
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('share:devdle');
  });

  it('TS-39: sin share nativo copia al portapapeles y confirma «✓ Copiado»', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { user, button } = await openResult();
    const write = vi.spyOn(navigator.clipboard, 'writeText');
    await user.click(button);
    await waitFor(() => expect(write).toHaveBeenCalledWith(SHARE_WIN));
    const confirmation = await within(button).findByText('✓ Copiado');
    expect(confirmation).toHaveAttribute('role', 'status');
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('share:devdle');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(within(button).getByText('Compartir')).toBeInTheDocument();
  });

  it('TS-40: cancelar el share nativo no es un error', async () => {
    setShare(vi.fn().mockRejectedValue(new DOMException('cancel', 'AbortError')));
    const { user, button } = await openResult();
    const write = vi.spyOn(navigator.clipboard, 'writeText');
    await user.click(button);
    await new Promise((r) => setTimeout(r, 20));
    expect(write).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
    expect(within(button).getByText('Compartir')).toBeInTheDocument();
  });

  it('TS-41: si falla el portapapeles el botón sigue en «Compartir»', async () => {
    const { user, button } = await openResult();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    await user.click(button);
    await new Promise((r) => setTimeout(r, 20));
    expect(within(button).getByText('Compartir')).toBeInTheDocument();
    expect(track).not.toHaveBeenCalled();
    await user.click(button);
    await new Promise((r) => setTimeout(r, 20));
    process.off('unhandledRejection', unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });

  it('TS-42: comparte una derrota con X/6', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setShare(share);
    const { user, button } = await openResult(gameTodayLost);
    await user.click(button);
    await waitFor(() => expect(share).toHaveBeenCalled());
    const text: string = share.mock.calls[0]?.[0].text;
    expect(text.startsWith('🟩 Devdle #128 · X/6\n')).toBe(true);
    expect(text.split('\n')).toHaveLength(8);
    expect(text.endsWith('\nnerdose.dev')).toBe(true);
  });
});

describe('resultado', () => {
  it('TS-43: tarjeta de rachas', async () => {
    server.use(gameHandlers.today(gameTodayWon));
    view();
    const heading = await screen.findByRole('heading', { level: 2, name: 'rachas' });
    // Abrir un resultado ya ganado no repite el festejo.
    expect(screen.queryByTestId('confetti')).toBeNull();
    const card = within(heading.closest('section') as HTMLElement);
    expect(card.getByText('Devdle: 3 días')).toBeInTheDocument();
    await waitFor(() => expect(card.getByText('Global: 5 días')).toBeInTheDocument());
    expect(card.getByText('récord: 7')).toBeInTheDocument();
  });

  it('TS-44: cuenta regresiva y recarga del día al llegar a 0', async () => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
      shouldAdvanceTime: true,
    });
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const calls = recordCalls();
    server.use(
      gameHandlers.today(gameTodayWon),
      http.get('/api/today', () => {
        return HttpResponse.json({ ...todayFixture, seconds_to_reset: 2 });
      }),
    );
    view();
    expect(
      await screen.findByText(countdown(/^Próximo desafío en 00:00:0[0-2]$/)),
    ).toBeInTheDocument();
    const gameCallsBefore = countOf(calls, 'GET', '/api/games/devdle/today?lang=es');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000 + 3000);
    });
    await waitFor(() =>
      expect(countOf(calls, 'GET', '/api/today?lang=es')).toBeGreaterThanOrEqual(2),
    );
    await waitFor(() =>
      expect(countOf(calls, 'GET', '/api/games/devdle/today?lang=es')).toBeGreaterThan(
        gameCallsBefore,
      ),
    );
  });

  it('TS-44b: la cuenta regresiva descuenta un segundo por segundo', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(new Date('2026-11-03T12:36:40Z'));
    server.use(gameHandlers.today(gameTodayWon));
    view();
    const timer = await screen.findByText(countdown(/^Próximo desafío en 11:23:20$/));
    // La hora va brillante (no verde: el verde es para lo que se toca).
    expect(within(timer).getByText('11:23:20')).toHaveClass('text-text');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByText(countdown(/^Próximo desafío en 11:23:19$/))).toBeInTheDocument();
  });

  it('TS-45: «Siguiente juego» solo si hay otro pendiente', async () => {
    server.use(gameHandlers.today(gameTodayWon));
    const a = view();
    expect(await screen.findByRole('link', { name: /Siguiente juego/ })).toHaveAttribute(
      'href',
      '/grep-grid',
    );
    a.unmount();
    server.use(http.get('/api/today', () => HttpResponse.json(todayOnlyDevdle)));
    view();
    await screen.findByText(countdown(/^Próximo desafío en/));
    expect(screen.queryByRole('link', { name: /Siguiente juego/ })).toBeNull();
  });

  it('TS-46: salidas del resultado', async () => {
    server.use(gameHandlers.today(gameTodayWon));
    view();
    const stats = await screen.findByRole('link', { name: /Ver mis estadísticas/ });
    expect(stats).toHaveAttribute('href', '/stats');
    // Vive en la tarjeta de rachas, no en la barra de salidas.
    expect(stats.closest('section')).toHaveTextContent('rachas');
    const back = screen.getByRole('link', { name: /Volver a los juegos/ });
    expect(back).toHaveAttribute('href', '/');
    // Barra al pie: cuenta regresiva y «Volver a los juegos» en la misma tarjeta.
    expect(back.closest('.rounded-panel')).toHaveTextContent(/Próximo desafío en/);
  });

  it('TS-47: «Reportar un problema» se renderiza en la partida y en el resultado', async () => {
    server.use(gameHandlers.today(gameTodayInProgress));
    const a = view();
    await screen.findByText(/intento 3 de 6/);
    expect(screen.getByRole('button', { name: 'Reportar un problema' })).toBeInTheDocument();
    a.unmount();
    server.use(gameHandlers.today(gameTodayWon));
    view();
    await h1('Ganaste en 3/6');
    expect(screen.getByRole('button', { name: 'Reportar un problema' })).toBeInTheDocument();
  });
});

describe('foco y teclado', () => {
  it('TS-50: navegar desde la home mueve el foco al h1 del juego', async () => {
    const user = userEvent.setup();
    view('/');
    const [play] = await screen.findAllByRole('link', { name: /Ver resultado/ });
    await user.click(play as HTMLElement);
    const title = await h1('Devdle');
    await waitFor(() => expect(title).toHaveFocus());
    expect(title).toHaveAttribute('tabindex', '-1');
  });

  it('TS-51: una carga directa no roba el foco', async () => {
    view();
    await h1('Devdle');
    await new Promise((r) => setTimeout(r, 30));
    expect(document.body).toHaveFocus();
  });

  it('TS-52: una partida completa solo con el teclado en pantalla', async () => {
    const bodies: unknown[] = [];
    server.use(
      gameHandlers.today(gameTodayInProgress),
      http.post('/api/games/devdle/today/move', async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(moveWon);
      }),
    );
    const user = userEvent.setup();
    view();
    await screen.findByText(/intento 3 de 6/);
    const keyboard = within(await screen.findByRole('group', { name: 'Teclado' }));
    for (const letter of 'PARSER') {
      await user.click(keyboard.getByRole('button', { name: new RegExp(`^${letter}(,|$)`) }));
    }
    await user.click(keyboard.getByRole('button', { name: /Enviar/ }));
    expect(await h1('Ganaste en 3/6')).toBeInTheDocument();
    expect(bodies).toEqual([{ challenge_number: 128, move: { guess: 'PARSER' } }]);
  });
});

describe('home', () => {
  it('TS-49: la home se refresca tras terminar la partida', async () => {
    let todayCalls = 0;
    server.use(
      gameHandlers.today(gameTodayInProgress),
      gameHandlers.move(moveWon),
      http.get('/api/today', () => {
        todayCalls += 1;
        return HttpResponse.json(
          todayCalls <= 1
            ? {
                ...todayFixture,
                games: todayFixture.games.map((g) =>
                  g.game_id === 'devdle'
                    ? { ...g, play_status: 'in_progress', history_label: null }
                    : g,
                ),
              }
            : todayAfterWin,
        );
      }),
    );
    const user = userEvent.setup();
    view();
    await screen.findByText(/intento 3 de 6/);
    await user.keyboard('PARSER{Enter}');
    await h1('Ganaste en 3/6');
    await user.click(screen.getByRole('link', { name: /Volver a los juegos/ }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Una dosis diaria de nerdeo.' }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getAllByRole('link', { name: /Ver resultado/ }).length).toBeGreaterThan(0),
    );
    const progress = screen.getByRole('region', { name: 'Progreso de hoy' });
    await waitFor(() =>
      expect(within(progress).getByText(/6 días · récord 12/)).toBeInTheDocument(),
    );
  });
});

describe('axe', () => {
  const states: [string, () => void][] = [
    ['instrucciones', () => server.use(gameHandlers.today(gameTodayNotStarted))],
    [
      'instrucciones sin sesión',
      () => server.use(http.get('/api/today', () => HttpResponse.json(todayNoSessionFixture))),
    ],
    ['partida', () => server.use(gameHandlers.today(gameTodayInProgress))],
    ['resultado', () => server.use(gameHandlers.today(gameTodayWon))],
    ['resultado anulado', () => server.use(gameHandlers.today(gameTodayVoidedFinished))],
    ['sin desafío', () => server.use(gameHandlers.today(gameTodayNone))],
    [
      'error de carga',
      () =>
        server.use(
          http.get('/api/games/devdle/today', () => errorResponse('internal_error', 'x', 500)),
        ),
    ],
  ];

  it.each(states)('TS-53: %s sin violaciones', async (_name, arrange) => {
    arrange();
    const { container } = view();
    await screen.findByRole('banner');
    await waitFor(() => expect(screen.queryByText(/^\$ cargando/)).toBeNull());
    await screen.findByRole('main');
    await new Promise((r) => setTimeout(r, 30));
    // En jsdom no hay CSS: `color-contrast` no se evalúa y lo garantizan los tokens del DS.
    expect(await axe(container)).toHaveNoViolations();
  });

  it('TS-53: juego sin client y partida anulada', async () => {
    const a = view('/big-o');
    await h1('Big O');
    expect(await axe(a.container)).toHaveNoViolations();
    a.unmount();
    server.use(gameHandlers.today(gameTodayInProgress));
    const user = userEvent.setup();
    const b = view();
    await screen.findByText(/intento 3 de 6/);
    server.use(
      http.post('/api/games/devdle/today/move', () =>
        errorResponse('challenge_voided', 'anulado', 409),
      ),
    );
    await user.keyboard('QWERTY{Enter}');
    await screen.findByText(VOIDED);
    expect(await axe(b.container)).toHaveNoViolations();
  });
});

describe('sin juegos pendientes en el fixture', () => {
  it('el fixture de `sessionFixture` sigue siendo válido', () => {
    expect(sessionFixture.locale).toBe('es');
  });
});
