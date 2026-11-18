import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { countOf, errorResponse, h1, recordCalls, setShare } from '@/test/game-route-helpers';
import {
  CELLS,
  FOUND_3,
  FOUND_6,
  GG_ID,
  GIVE_UP,
  SELECT_DOCKER,
  SELECT_REDIS,
  ggMoveAlready,
  ggMoveDocker,
  ggMoveGiveUp3,
  ggMoveNotAWord,
  ggMoveWinRedis,
  grepGridInProgress0,
  grepGridInProgress3,
  grepGridInProgress3En,
  grepGridInProgress7,
  grepGridLost3En,
  grepGridLost6,
  grepGridNextDay,
  grepGridNone,
  grepGridNotStarted,
  grepGridStarted,
  grepGridVoided,
  grepGridWon,
  todayWithGrepGrid,
} from '@/test/fixtures/grep-grid-today';
import { todayFixture, todayNoSessionFixture } from '@/test/fixtures/today';
import { grepGridHandlers as handlers, server } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

const TODAY = '/api/games/grep-grid/today?lang=es';
const MOVE = '/api/games/grep-grid/today/move?lang=es';
const START = '/api/games/grep-grid/today/start';
const SHARE_LOST6 = '🔎 Grep Grid #128\n6/8\nnerdose.dev';
const SHARE_WON = '🔎 Grep Grid #128\n8/8\nnerdose.dev';
const VOIDED = 'Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.';
const COOKIES =
  'Para jugar necesitamos una única cookie funcional, sin datos personales. Activá las cookies y tocá «Reintentar».';

const view = (route = '/grep-grid') => renderWithProviders({ route });
const grid = () => screen.getByRole('grid', { name: 'Grilla de 12 por 12' });
const cell = (letter: string, row: number, col: number) =>
  within(grid()).getByRole('button', {
    name: new RegExp(`^${letter}, fila ${row + 1}, columna ${col + 1}, `),
  });
const D = () => cell('D', 3, 2);
const R37 = () => cell('R', 3, 7);
const counter = (text: string) => screen.getByText(text);
const lang = (name: 'ES' | 'EN') =>
  within(screen.getByRole('group', { name: 'Idioma' })).getByRole('button', { name });
const movePost = (body: unknown, init?: ResponseInit) =>
  http.post('/api/games/grep-grid/today/move', () => HttpResponse.json(body as object, init));
const movePostError = (code: string, message: string, status: number, headers?: HeadersInit) =>
  http.post('/api/games/grep-grid/today/move', () => errorResponse(code, message, status, headers));
// La línea visible va antes que la región viva (`sr-only`) que repite el anuncio.
const hint = () => screen.getAllByText(/^> /)[0] as HTMLElement;
const findHint = (text: string) => waitFor(() => expect(hint()).toHaveTextContent(text));

async function playing(data: unknown = grepGridInProgress3) {
  server.use(handlers.today(data));
  const user = userEvent.setup();
  const utils = view();
  await screen.findByRole('grid', { name: 'Grilla de 12 por 12' });
  return { user, ...utils };
}
async function select(user: ReturnType<typeof userEvent.setup>, a: HTMLElement, b: HTMLElement) {
  await user.click(a);
  await user.click(b);
}
const selectDocker = (user: ReturnType<typeof userEvent.setup>) => select(user, D(), R37());
const selectNotAWord = (user: ReturnType<typeof userEvent.setup>) =>
  select(user, cell('W', 1, 0), cell('Q', 1, 3));

afterEach(() => {
  server.events.removeAllListeners();
  Reflect.deleteProperty(navigator, 'share');
  vi.restoreAllMocks();
  vi.useRealTimers();
  localStorage.clear();
  sessionStorage.clear();
});

describe('abrir /grep-grid', () => {
  it('TS-9: sin Play muestra instrucciones con el header de juego', async () => {
    const calls = recordCalls();
    server.use(handlers.today(grepGridNotStarted));
    view();
    expect(await h1('Grep Grid')).toBeInTheDocument();
    expect(countOf(calls, 'GET', TODAY)).toBe(1);
    expect(screen.getByText('Desafío #128 · ~3 min · una partida por día')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Empezar/ })).toBeInTheDocument();
    const header = screen.getByRole('banner');
    const nav = within(header).getByRole('navigation', { name: 'Ruta' });
    expect(within(nav).getByText('grep-grid')).toHaveAttribute('aria-current', 'page');
    expect(within(header).getByText('desafío del 03/11')).toBeInTheDocument();
    expect(
      within(header).getByRole('button', { name: 'Compartir resultado (disponible al terminar)' }),
    ).toHaveAttribute('aria-disabled', 'true');
    expect(document.title).toBe('Grep Grid · nerdose');
  });

  it('TS-10: muestra el loader con el header de juego mientras carga', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    server.use(
      http.get('/api/games/grep-grid/today', async () => {
        await gate;
        return HttpResponse.json(grepGridNotStarted);
      }),
    );
    view();
    expect(await screen.findByRole('status')).toHaveTextContent('$ cargando grep-grid…');
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    release();
    expect(await h1('Grep Grid')).toBeInTheDocument();
  });

  it('TS-11: Empezar crea la Play una sola vez y muestra la partida sin reloj', async () => {
    const calls = recordCalls();
    server.use(handlers.today(grepGridNotStarted), handlers.start(grepGridStarted));
    const user = userEvent.setup();
    view();
    await user.dblClick(await screen.findByRole('button', { name: /Empezar/ }));
    await within(await screen.findByRole('grid', { name: 'Grilla de 12 por 12' })).findAllByRole(
      'gridcell',
    );
    const starts = calls.filter((c) => c.method === 'POST' && c.path === START);
    expect(starts).toHaveLength(1);
    await waitFor(() => expect(starts[0]?.body).toEqual({ challenge_number: 128 }));
    expect(screen.getAllByRole('gridcell')).toHaveLength(144);
    expect(counter('0/8')).toBeInTheDocument();
    expect(screen.getByText('encontradas')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'palabras de hoy' })).toBeInTheDocument();
    expect(screen.getByText('CACHE')).toBeInTheDocument();
    expect(screen.getByText('REDIS')).toBeInTheDocument();
    expect(screen.getAllByText('5 letras').length).toBeGreaterThan(0);
    expect(hint()).toHaveTextContent('> tocá la primera letra de una palabra');
    expect(screen.getByRole('main').textContent).not.toMatch(/\d{1,2}:\d{2}/);
    expect(countOf(calls, 'GET', TODAY)).toBe(1);
  });
});

describe('partida', () => {
  it('TS-12: retoma una Play con 3 encontradas', async () => {
    await playing();
    expect(counter('3/8')).toBeInTheDocument();
    expect(cell('M', 0, 0)).toHaveAccessibleName('M, fila 1, columna 1, encontrada');
    expect(cell('P', 11, 0)).toHaveAccessibleName('P, fila 12, columna 1, encontrada');
    for (const w of ['MERGE', 'CACHE', 'PYTHON']) {
      expect(screen.getByText(`definición de ${w}`)).toBeInTheDocument();
    }
    expect(screen.getAllByText('6 letras').length).toBeGreaterThan(0);
    expect(screen.queryByText('definición de DOCKER')).toBeNull();
    expect(screen.queryByRole('button', { name: /Empezar/ })).toBeNull();
  });

  it('TS-13: seleccionar DOCKER con dos toques', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    server.use(movePost(ggMoveDocker));
    const todaysBefore = calls.filter((c) => c.path.startsWith('/api/today')).length;
    await user.click(D());
    expect(hint()).toHaveTextContent('> ahora tocá la última letra');
    expect(D()).toHaveAccessibleName('D, fila 4, columna 3, inicio');
    expect(countOf(calls, 'POST', MOVE)).toBe(0);
    await user.click(R37());
    expect(await screen.findByText('4/8')).toBeInTheDocument();
    const moves = calls.filter((c) => c.method === 'POST' && c.path === MOVE);
    expect(moves).toHaveLength(1);
    expect(moves[0]?.body).toEqual(SELECT_DOCKER);
    expect(hint()).toHaveTextContent('> DOCKER encontrada · 4/8');
    expect(D()).toHaveAccessibleName('D, fila 4, columna 3, encontrada');
    expect(R37()).toHaveAccessibleName('R, fila 4, columna 8, encontrada');
    expect(await screen.findByText('definición de DOCKER')).toBeInTheDocument();
    expect(countOf(calls, 'GET', TODAY)).toBe(1);
    expect(calls.filter((c) => c.path.startsWith('/api/today'))).toHaveLength(todaysBefore);
  });

  it('TS-14: cancelar la celda inicial sin enviar', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    await user.click(D());
    await user.click(D());
    expect(D()).toHaveAccessibleName('D, fila 4, columna 3, libre');
    expect(hint()).toHaveTextContent('> tocá la primera letra de una palabra');
    await user.click(D());
    expect(D()).toHaveAccessibleName('D, fila 4, columna 3, inicio');
    await user.keyboard('{Escape}');
    expect(D()).toHaveAccessibleName('D, fila 4, columna 3, libre');
    expect(hint()).toHaveTextContent('> tocá la primera letra de una palabra');
    expect(countOf(calls, 'POST', MOVE)).toBe(0);
  });

  it('TS-15: not_a_word no penaliza', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    server.use(movePost(ggMoveNotAWord));
    await selectNotAWord(user);
    await findHint('> no es una palabra de la lista, probá de nuevo');
    expect(calls.find((c) => c.path === MOVE)?.body).toEqual({
      challenge_number: 128,
      move: { type: 'select', from: { row: 1, col: 0 }, to: { row: 1, col: 3 } },
    });
    expect(counter('3/8')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
    // Segunda respuesta (objeto nuevo, mismo contenido): vuelve a mostrar el hint.
    await user.click(cell('W', 1, 0));
    expect(hint()).not.toHaveTextContent('no es una palabra');
    await user.click(cell('Q', 1, 3));
    await waitFor(() => expect(countOf(calls, 'POST', MOVE)).toBe(2));
    await findHint('> no es una palabra de la lista, probá de nuevo');
    expect(counter('3/8')).toBeInTheDocument();
  });

  it('TS-16: already_found no muestra aviso', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    server.use(movePost(ggMoveAlready));
    await select(user, cell('M', 0, 0), cell('E', 0, 4));
    await waitFor(() => expect(countOf(calls, 'POST', MOVE)).toBe(1));
    await waitFor(() => expect(hint()).toHaveTextContent('> tocá la primera letra de una palabra'));
    expect(counter('3/8')).toBeInTheDocument();
    expect(screen.queryByText(/no es una palabra/)).toBeNull();
  });

  it('TS-17: 422 invalid_move', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    server.use(movePostError('invalid_move', 'Jugada inválida', 422));
    await select(user, R37(), D());
    await findHint('> las palabras se marcan de la primera a la última letra, hacia adelante');
    expect(calls.find((c) => c.path === MOVE)?.body).toEqual({
      challenge_number: 128,
      move: { type: 'select', from: { row: 3, col: 7 }, to: { row: 3, col: 2 } },
    });
    expect(counter('3/8')).toBeInTheDocument();
    expect(screen.queryByText('Jugada inválida')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('TS-18: 429 en una selección', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    server.use(
      movePostError('rate_limited', 'Demasiadas solicitudes. Probá de nuevo en un rato', 429, {
        'Retry-After': '5',
      }),
    );
    await selectDocker(user);
    await findHint('> vas muy rápido. Esperá unos segundos y probá de nuevo');
    expect(counter('3/8')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
    await selectDocker(user);
    await waitFor(() => expect(countOf(calls, 'POST', MOVE)).toBe(2));
  });

  it('TS-19: no acepta otra selección mientras se envía', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    server.use(
      http.post('/api/games/grep-grid/today/move', async () => {
        await gate;
        return HttpResponse.json(ggMoveDocker);
      }),
    );
    await selectDocker(user);
    await waitFor(() => expect(countOf(calls, 'POST', MOVE)).toBe(1));
    await user.click(cell('W', 1, 0));
    expect(cell('W', 1, 0)).not.toHaveAccessibleName(/inicio/);
    release();
    expect(await screen.findByText('4/8')).toBeInTheDocument();
    expect(countOf(calls, 'POST', MOVE)).toBe(1);
  });
});

describe('cierre', () => {
  it('TS-20: la octava palabra cierra la partida', async () => {
    const calls = recordCalls();
    const { user } = await playing(grepGridInProgress7);
    const todayBefore = countOf(calls, 'GET', '/api/today?lang=es');
    server.use(
      movePost(ggMoveWinRedis),
      http.get('/api/today', () =>
        HttpResponse.json({
          ...todayFixture,
          global_streak: { current: 6, max: 12 },
          completed_today: 2,
        }),
      ),
    );
    await select(user, cell('R', 9, 1), cell('S', 5, 5));
    const heading = await h1('8/8: las encontraste todas');
    expect(calls.find((c) => c.path === MOVE)?.body).toEqual(SELECT_REDIS);
    await waitFor(() => expect(heading).toHaveFocus());
    expect(
      screen.getByRole('table', { name: 'Grilla final: 8 encontradas y 0 reveladas' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('✓ encontrada')).toHaveLength(8);
    await waitFor(() =>
      expect(countOf(calls, 'GET', '/api/today?lang=es')).toBeGreaterThan(todayBefore),
    );
    expect(countOf(calls, 'GET', TODAY)).toBe(1);
  });

  it('TS-21: abrir y cancelar O-04', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    const surrender = screen.getByRole('button', { name: 'Rendirse' });
    await user.click(surrender);
    const dialog = await screen.findByRole('alertdialog', { name: '¿Rendirte?' });
    expect(dialog).toHaveTextContent(
      'Vas a cerrar la partida con 3/8. Cuenta para tu racha y te mostramos las palabras que faltan. No se puede deshacer.',
    );
    expect(within(dialog).getByRole('button', { name: 'Seguir jugando' })).toHaveFocus();
    await user.click(within(dialog).getByRole('button', { name: 'Seguir jugando' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Rendirse' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Rendirse' }));
    await screen.findByRole('alertdialog');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Rendirse' })).toHaveFocus();
    expect(countOf(calls, 'POST', MOVE)).toBe(0);
  });

  it('TS-22: rendirse con 0/8', async () => {
    const { user } = await playing(grepGridInProgress0);
    await user.click(screen.getByRole('button', { name: 'Rendirse' }));
    expect(await screen.findByRole('alertdialog')).toHaveTextContent(
      'Vas a cerrar la partida con 0/8. Cuenta para tu racha igual y te mostramos las 8 palabras. No se puede deshacer.',
    );
  });

  it('TS-23: confirmar la rendición lleva al resultado', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    const todayBefore = countOf(calls, 'GET', '/api/today?lang=es');
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    server.use(
      http.post('/api/games/grep-grid/today/move', async () => {
        await gate;
        return HttpResponse.json(ggMoveGiveUp3);
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Rendirse' }));
    await user.click(await screen.findByRole('button', { name: 'Sí, rendirme' }));
    expect(await screen.findByRole('button', { name: 'Cerrando…' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    release();
    const heading = await h1('Te rendiste con 3/8');
    await waitFor(() => expect(heading).toHaveFocus());
    expect(calls.filter((c) => c.path === MOVE)).toHaveLength(1);
    expect(calls.find((c) => c.path === MOVE)?.body).toEqual(GIVE_UP);
    expect(screen.getByText('Estas son las palabras que faltaban.')).toBeInTheDocument();
    expect(
      screen.getByRole('table', { name: 'Grilla final: 3 encontradas y 5 reveladas' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('✓ encontrada')).toHaveLength(3);
    expect(screen.getAllByText('○ no la encontraste')).toHaveLength(5);
    for (const w of ['CACHE', 'REDIS']) {
      expect(screen.getByText(`definición de ${w}`)).toBeInTheDocument();
    }
    await waitFor(() =>
      expect(countOf(calls, 'GET', '/api/today?lang=es')).toBeGreaterThan(todayBefore),
    );
  });

  it('TS-24: la grilla final usa las letras de public_view', async () => {
    server.use(handlers.today(grepGridLost6));
    view();
    await h1('Te rendiste con 6/8');
    const table = screen.getByRole('table', { name: 'Grilla final: 6 encontradas y 2 reveladas' });
    const names = within(table)
      .getAllByRole('cell')
      .map((c) => c.getAttribute('aria-label') ?? c.textContent ?? '');
    expect(names.some((n) => n.startsWith('·'))).toBe(false);
    expect(within(table).getByLabelText('W, fila 2, columna 1, libre')).toBeInTheDocument();
    expect(within(table).getByLabelText(/^O, fila 6, columna 1, revelada$/)).toBeInTheDocument();
    // Todas las celdas de OAUTH y REDIS (las no encontradas) que no comparten letra con una
    // encontrada quedan «revelada».
    const foundKeys = new Set(FOUND_6.flatMap((w) => CELLS[w]).map((c) => `${c.row},${c.col}`));
    for (const w of ['OAUTH', 'REDIS'] as const) {
      const own = CELLS[w].filter((c) => !foundKeys.has(`${c.row},${c.col}`));
      expect(own.length).toBeGreaterThan(0);
      for (const { row, col } of own) {
        expect(
          within(table).getByLabelText(
            new RegExp(`^[A-Z], fila ${row + 1}, columna ${col + 1}, revelada$`),
          ),
        ).toBeInTheDocument();
      }
    }
  });

  it('TS-25: rachas y salidas del resultado', async () => {
    server.use(handlers.today(grepGridLost6));
    view();
    await h1('Te rendiste con 6/8');
    expect(screen.getByRole('heading', { level: 2, name: 'rachas' })).toBeInTheDocument();
    expect(screen.getByText(/Grep Grid: 3 días/)).toBeInTheDocument();
    expect(screen.getByText(/Global: 5 días/)).toBeInTheDocument();
    expect(screen.getByText(/récord: 4/)).toBeInTheDocument();
    expect(
      await screen.findByText(
        (_c, el) =>
          el?.tagName === 'P' && /^Próximo desafío en 11:23:20$/.test(el.textContent ?? ''),
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Siguiente juego/ })).toHaveAttribute(
      'href',
      '/timeline',
    );
    expect(screen.getByRole('link', { name: /Volver a los juegos/ })).toHaveAttribute('href', '/');
    expect(screen.getByRole('button', { name: 'Reportar un problema' })).toBeInTheDocument();
  });

  it('TS-26: «Siguiente juego» oculto sin pendientes', async () => {
    server.use(
      handlers.today(grepGridLost6),
      http.get('/api/today', () => HttpResponse.json(todayWithGrepGrid('lost', '6/8'))),
    );
    view();
    await h1('Te rendiste con 6/8');
    await screen.findByRole('link', { name: /Volver a los juegos/ });
    expect(screen.queryByRole('link', { name: /Siguiente juego/ })).toBeNull();
  });
});

describe('compartir', () => {
  async function openResult(data: unknown = grepGridLost6) {
    server.use(handlers.today(data));
    const user = userEvent.setup(
      vi.isFakeTimers() ? { advanceTimers: vi.advanceTimersByTime.bind(vi) } : undefined,
    );
    view();
    await screen.findByRole('heading', { level: 1 });
    const header = within(screen.getByRole('banner'));
    return { user, button: await header.findByRole('button', { name: /Compartir/ }) };
  }

  it('TS-27: share nativo con el texto de share()', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setShare(share);
    const { user, button } = await openResult();
    const write = vi.spyOn(navigator.clipboard, 'writeText');
    await user.click(button);
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(share).toHaveBeenCalledWith({ text: SHARE_LOST6 });
    expect(write).not.toHaveBeenCalled();
    const text: string = share.mock.calls[0]?.[0].text;
    expect(text).not.toMatch(/CACHE|DOCKER|KERNEL|KUBERNETES|MERGE|OAUTH|PYTHON|REDIS/);
    expect(text).not.toMatch(/rend|gave/);
  });

  it('TS-28: portapapeles con «✓ Copiado»', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { user, button } = await openResult();
    // Nombre explícito: Chrome no lo deriva del hijo con role="status" (jsdom sí).
    expect(button).toHaveAttribute('aria-label', 'Compartir');
    const write = vi.spyOn(navigator.clipboard, 'writeText');
    await user.click(button);
    await waitFor(() => expect(write).toHaveBeenCalledWith(SHARE_LOST6));
    expect(await within(button).findByText('✓ Copiado')).toHaveAttribute('role', 'status');
    expect(button).toHaveAttribute('aria-label', '✓ Copiado');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(within(button).getByText('Compartir')).toBeInTheDocument();
  });

  it('TS-29: compartir una victoria', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setShare(share);
    const { user, button } = await openResult(grepGridWon);
    await user.click(button);
    await waitFor(() => expect(share).toHaveBeenCalledWith({ text: SHARE_WON }));
  });
});

describe('idioma', () => {
  it('TS-30: cambiar a EN a mitad de partida no pierde la partida', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    server.use(
      http.get('/api/games/grep-grid/today', async ({ request }) => {
        if (new URL(request.url).searchParams.get('lang') === 'en') await gate;
        return HttpResponse.json(
          new URL(request.url).searchParams.get('lang') === 'en'
            ? grepGridInProgress3En
            : grepGridInProgress3,
        );
      }),
    );
    await user.click(lang('EN'));
    await waitFor(() =>
      expect(countOf(calls, 'GET', '/api/games/grep-grid/today?lang=en')).toBe(1),
    );
    expect(screen.queryByText('$ cargando grep-grid…')).toBeNull();
    expect(screen.getAllByRole('gridcell')).toHaveLength(144);
    expect(screen.getByText('MERGE')).toBeInTheDocument();
    release();
    for (const w of ['MERGE', 'CACHE', 'PYTHON']) {
      expect(await screen.findByText(`definition of ${w}`)).toBeInTheDocument();
    }
    expect(screen.getAllByRole('gridcell')).toHaveLength(144);
    expect(screen.getByText('3/8')).toBeInTheDocument();
    const stored = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage });
    expect(stored).not.toContain('found_words');
    expect(stored).not.toContain(GG_ID.MERGE);
  });

  it('TS-31: cambiar a EN en el resultado', async () => {
    server.use(handlers.today({ ...grepGridLost6, result: grepGridLost3En.result }));
    const user = userEvent.setup();
    view();
    await h1(/Te rendiste con/);
    server.use(
      http.get('/api/games/grep-grid/today', ({ request }) =>
        HttpResponse.json(
          new URL(request.url).searchParams.get('lang') === 'en' ? grepGridLost3En : grepGridLost6,
        ),
      ),
    );
    await user.click(lang('EN'));
    expect(await h1('You gave up with 3/8')).toBeInTheDocument();
    expect(await screen.findByText('definition of OAUTH')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});

describe('errores del ciclo común', () => {
  it('TS-32: game_finished lleva al resultado', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    server.use(movePostError('game_finished', 'La partida ya terminó', 409));
    server.use(handlers.today(grepGridLost6));
    await selectDocker(user);
    expect(await h1('Te rendiste con 6/8')).toBeInTheDocument();
    expect(countOf(calls, 'GET', TODAY)).toBe(2);
  });

  it('TS-33: challenge_expired lleva a instrucciones del día nuevo', async () => {
    const calls = recordCalls();
    const bodies: unknown[] = [];
    const { user } = await playing();
    server.use(
      movePostError('challenge_expired', 'El desafío cambió. Cargando el de hoy…', 409),
      handlers.today(grepGridNextDay),
      http.get('/api/today', () => HttpResponse.json({ ...todayFixture, number: 129 })),
      http.post('/api/games/grep-grid/today/start', async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(grepGridStarted);
      }),
    );
    await selectDocker(user);
    expect(
      await screen.findByText('Desafío #129 · ~3 min · una partida por día'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Grep Grid' })).toBeInTheDocument();
    const notice = screen.getByText(
      'Empezó el desafío #129. La partida de ayer quedó sin terminar y no cuenta para tu racha.',
    );
    expect(notice.closest('[role="status"]')).not.toBeNull();
    expect(countOf(calls, 'GET', TODAY)).toBe(2);
    expect(countOf(calls, 'GET', '/api/today?lang=es')).toBeGreaterThanOrEqual(2);
    await user.click(screen.getByRole('button', { name: /Empezar/ }));
    await screen.findByRole('grid', { name: 'Grilla de 12 por 12' });
    expect(bodies).toEqual([{ challenge_number: 129 }]);
  });

  it('TS-34: challenge_voided a mitad de partida', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    const todayBefore = countOf(calls, 'GET', '/api/today?lang=es');
    server.use(movePostError('challenge_voided', 'Este desafío fue anulado', 409));
    await selectDocker(user);
    const banner = (await screen.findByText(VOIDED)).closest('[role="status"]');
    expect(banner).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Rendirse' })).toBeNull();
    await user.click(cell('W', 1, 0));
    expect(cell('W', 1, 0)).not.toHaveAccessibleName(/inicio/);
    expect(countOf(calls, 'POST', MOVE)).toBe(1);
    await waitFor(() =>
      expect(countOf(calls, 'GET', '/api/today?lang=es')).toBeGreaterThan(todayBefore),
    );
  });

  it('TS-35: challenge_voided con O-04 abierto', async () => {
    const { user } = await playing();
    server.use(movePostError('challenge_voided', 'Este desafío fue anulado', 409));
    await user.click(screen.getByRole('button', { name: 'Rendirse' }));
    await user.click(await screen.findByRole('button', { name: 'Sí, rendirme' }));
    expect((await screen.findAllByText(VOIDED)).length).toBeGreaterThan(0);
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Rendirse' })).toBeNull();
  });

  it('TS-36a: no_session en una selección se recupera sola', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    let moves = 0;
    server.use(
      http.post('/api/games/grep-grid/today/move', () => {
        moves += 1;
        return moves === 1
          ? errorResponse('no_session', 'Activá las cookies para jugar', 401)
          : HttpResponse.json(ggMoveDocker);
      }),
    );
    await selectDocker(user);
    expect(await screen.findByText('4/8')).toBeInTheDocument();
    const order = calls
      .filter((c) => c.method === 'POST')
      .map((c) => c.path.split('?')[0])
      .slice(1);
    expect(order).toEqual([
      '/api/games/grep-grid/today/move',
      '/api/session',
      '/api/games/grep-grid/today/move',
    ]);
    expect(calls.filter((c) => c.path === MOVE).map((c) => c.body)).toEqual([
      SELECT_DOCKER,
      SELECT_DOCKER,
    ]);
    expect(screen.queryByText(COOKIES)).toBeNull();
  });

  it('TS-36b: no_session persistente muestra el banner y «Reintentar» reenvía', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    let healthy = false;
    server.use(
      http.post('/api/games/grep-grid/today/move', () =>
        healthy
          ? HttpResponse.json(ggMoveDocker)
          : errorResponse('no_session', 'Activá las cookies para jugar', 401),
      ),
    );
    await selectDocker(user);
    const banner = (await screen.findByText(COOKIES)).closest('[role="status"]') as HTMLElement;
    expect(counter('3/8')).toBeInTheDocument();
    healthy = true;
    const before = countOf(calls, 'POST', '/api/session');
    await user.click(within(banner).getByRole('button', { name: /Reintentar/ }));
    expect(await screen.findByText('4/8')).toBeInTheDocument();
    expect(countOf(calls, 'POST', '/api/session')).toBe(before + 1);
    expect(calls.filter((c) => c.path === MOVE).at(-1)?.body).toEqual(SELECT_DOCKER);
    expect(screen.queryByText(COOKIES)).toBeNull();
  });

  it('TS-37: sin desafío hoy y anulado sin Play', async () => {
    server.use(handlers.today(grepGridNone));
    const a = view();
    expect(await h1('Grep Grid')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Hoy no hay desafío de Grep Grid. Es un día neutro: no suma ni corta tu racha.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Volver a los juegos/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Empezar/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cómo se juega' })).toBeNull();
    a.unmount();
    server.use(handlers.today(grepGridVoided));
    view();
    expect((await screen.findAllByText(VOIDED)).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /Empezar/ })).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('home', () => {
  it('TS-38: tarjeta de Grep Grid en sus estados', async () => {
    const calls = recordCalls();
    const cases: [Parameters<typeof todayWithGrepGrid>, string, string, string | null][] = [
      [[null, null], 'sin jugar', 'Jugar', null],
      [['in_progress', null], 'en curso', 'Seguir jugando', null],
      [['lost', '6/8'], 'completado', 'Ver resultado', '6/8'],
    ];
    for (const [args, state, link, label] of cases) {
      server.use(http.get('/api/today', () => HttpResponse.json(todayWithGrepGrid(...args))));
      const { unmount } = renderWithProviders({ route: '/' });
      const card = (await screen.findByRole('heading', { name: 'Grep Grid' })).closest(
        'article',
      ) as HTMLElement;
      // Terminada, la tarjeta muestra la etiqueta (p. ej. «6/8») en lugar del texto de estado.
      if (!label) expect(within(card).getByText(state)).toBeInTheDocument();
      expect(within(card).getByRole('link', { name: new RegExp(link) })).toHaveAttribute(
        'href',
        '/grep-grid',
      );
      if (label) expect(within(card).getByText(label)).toBeInTheDocument();
      expect(within(card).getByText(/racha 2/)).toBeInTheDocument();
      expect(screen.getAllByText('sin desafío hoy')).toHaveLength(3);
      if (args[0] === 'lost') {
        expect(screen.getByText(/2 de 2 con desafío completados/)).toBeInTheDocument();
      }
      unmount();
    }
    expect(calls.filter((c) => c.path.startsWith('/api/games/'))).toHaveLength(0);
  });

  it('TS-39: la home se refresca tras terminar Grep Grid', async () => {
    let todayCalls = 0;
    server.use(
      http.get('/api/today', () => {
        todayCalls += 1;
        return HttpResponse.json(todayCalls <= 1 ? todayFixture : todayWithGrepGrid('lost', '3/8'));
      }),
    );
    const { user } = await playing();
    server.use(movePost(ggMoveGiveUp3));
    await user.click(screen.getByRole('button', { name: 'Rendirse' }));
    await user.click(await screen.findByRole('button', { name: 'Sí, rendirme' }));
    await h1('Te rendiste con 3/8');
    await waitFor(() => expect(todayCalls).toBeGreaterThanOrEqual(2));
    await user.click(await screen.findByRole('link', { name: /Volver a los juegos/ }));
    const card = (await screen.findByRole('heading', { name: 'Grep Grid' })).closest(
      'article',
    ) as HTMLElement;
    expect(await within(card).findByText('3/8')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /Ver resultado/ })).toBeInTheDocument();
  });
});

describe('teclado y lector', () => {
  it('TS-41: navegar desde la home mueve el foco al h1', async () => {
    server.use(http.get('/api/today', () => HttpResponse.json(todayWithGrepGrid(null, null))));
    const user = userEvent.setup();
    renderWithProviders({ route: '/' });
    const card = (await screen.findByRole('heading', { name: 'Grep Grid' })).closest(
      'article',
    ) as HTMLElement;
    await user.click(within(card).getByRole('link', { name: /Jugar/ }));
    const heading = await h1('Grep Grid');
    await waitFor(() => expect(heading).toHaveFocus());
    expect(heading).toHaveAttribute('tabindex', '-1');
  });

  it('TS-42: partida completa y compartir solo con teclado', async () => {
    const calls = recordCalls();
    const share = vi.fn().mockResolvedValue(undefined);
    setShare(share);
    const { user } = await playing(grepGridInProgress7);
    server.use(movePost(ggMoveWinRedis));
    for (let i = 0; i < 30; i++) {
      await user.tab();
      if (
        within(grid())
          .queryAllByRole('button')
          .includes(document.activeElement as HTMLElement)
      )
        break;
    }
    expect(grid().contains(document.activeElement)).toBe(true);
    await user.keyboard('{ArrowDown>9/}{ArrowRight}{Enter}{ArrowUp>4/}{ArrowRight>4/}{Enter}');
    expect(await h1('8/8: las encontraste todas')).toBeInTheDocument();
    expect(calls.find((c) => c.path === MOVE)?.body).toEqual(SELECT_REDIS);
    const button = within(screen.getByRole('banner')).getByRole('button', { name: 'Compartir' });
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1 })),
    );
    for (let i = 0; i < 20 && document.activeElement !== button; i++) await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');
    await waitFor(() => expect(share).toHaveBeenCalledWith({ text: SHARE_WON }));
  });

  it('TS-43: rendirse solo con teclado', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    server.use(movePost(ggMoveGiveUp3));
    const surrender = screen.getByRole('button', { name: 'Rendirse' });
    for (let i = 0; i < 40 && document.activeElement !== surrender; i++) await user.tab();
    expect(surrender).toHaveFocus();
    await user.keyboard('{Enter}');
    const dialog = await screen.findByRole('alertdialog');
    const keep = within(dialog).getByRole('button', { name: 'Seguir jugando' });
    const confirm = within(dialog).getByRole('button', { name: 'Sí, rendirme' });
    expect(keep).toHaveFocus();
    await user.tab();
    expect(confirm).toHaveFocus();
    await user.tab();
    expect(within(dialog).getByRole('button', { name: 'Cerrar' })).toHaveFocus();
    await user.tab();
    expect(keep).toHaveFocus();
    await user.tab();
    expect(confirm).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(await h1('Te rendiste con 3/8')).toBeInTheDocument();
    expect(calls.find((c) => c.path === MOVE)?.body).toEqual(GIVE_UP);
  });

  it('TS-44: un anuncio por selección', async () => {
    const { user } = await playing();
    server.use(movePost(ggMoveDocker));
    await selectDocker(user);
    await screen.findByText('4/8');
    const live = screen.getByRole('main').querySelector('[aria-live="polite"]') as HTMLElement;
    expect(live).not.toBeNull();
    expect(live.children).toHaveLength(1);
    expect(live).toHaveTextContent('> DOCKER encontrada · 4/8');
    expect(live).not.toHaveTextContent('ahora tocá la última letra');
    expect(screen.getByText('4/8').closest('[aria-live]')).toBeNull();
  });
});

describe('axe', () => {
  type Arrange = (user: ReturnType<typeof userEvent.setup>) => Promise<void> | void;
  const states: [string, () => void, Arrange?][] = [
    ['instrucciones', () => server.use(handlers.today(grepGridNotStarted))],
    [
      'instrucciones sin sesión',
      () => server.use(http.get('/api/today', () => HttpResponse.json(todayNoSessionFixture))),
    ],
    ['partida', () => server.use(handlers.today(grepGridInProgress3))],
    [
      'partida con O-04',
      () => server.use(handlers.today(grepGridInProgress3)),
      async (user) => {
        await user.click(await screen.findByRole('button', { name: 'Rendirse' }));
        await screen.findByRole('alertdialog');
      },
    ],
    [
      'partida anulada',
      () =>
        server.use(
          handlers.today(grepGridInProgress3),
          movePostError('challenge_voided', 'x', 409),
        ),
      async (user) => {
        await selectDocker(user);
        await screen.findByText(VOIDED);
      },
    ],
    ['resultado rendido', () => server.use(handlers.today(grepGridLost6))],
    ['resultado ganado', () => server.use(handlers.today(grepGridWon))],
    ['sin desafío', () => server.use(handlers.today(grepGridNone))],
    [
      'error de carga',
      () =>
        server.use(
          http.get('/api/games/grep-grid/today', () => errorResponse('internal_error', 'x', 500)),
        ),
    ],
  ];

  it.each(states)('TS-45: %s sin violaciones', async (_name, arrange, after) => {
    arrange();
    const user = userEvent.setup();
    const { container } = view();
    await screen.findByRole('banner');
    await waitFor(() => expect(screen.queryByText(/^\$ cargando/)).toBeNull());
    await screen.findByRole('main');
    if (after) {
      await screen.findByRole('grid', { name: 'Grilla de 12 por 12' });
      await after(user);
    }
    await new Promise((r) => setTimeout(r, 30));
    expect(await axe(container)).toHaveNoViolations();
  });

  it.each([
    ['partida', grepGridInProgress3],
    ['resultado', grepGridLost6],
  ])('TS-45: %s en inglés sin violaciones', async (_name, data) => {
    server.use(handlers.today(data));
    const user = userEvent.setup();
    const { container } = view();
    await screen.findByRole('banner');
    await user.click(
      await within(await screen.findByRole('group', { name: 'Idioma' })).findByRole('button', {
        name: 'EN',
      }),
    );
    await screen.findByRole('main');
    await new Promise((r) => setTimeout(r, 60));
    expect(await axe(container)).toHaveNoViolations();
  });
});

// Evita que el linter marque FOUND_3 como sin uso en caso de ampliarse la suite.
void FOUND_3;
