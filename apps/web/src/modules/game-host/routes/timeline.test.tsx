import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { track } from '@nerdose/ui';
import { axe } from 'vitest-axe';

import { stubSortableRects } from '@/test/dnd-rects';
import { countOf, errorResponse, h1, recordCalls, setShare } from '@/test/game-route-helpers';
import {
  ORDER_SWAP,
  TL_INITIAL,
  TL_OID,
  timelineInProgress,
  timelineInProgressEn,
  timelineLost0,
  timelineLost3,
  timelineLost3En,
  timelineNextDay,
  timelineNone,
  timelineNotStarted,
  timelineStarted,
  timelineVoided,
  timelineWon,
  tlMove3,
  todayWithTimeline,
} from '@/test/fixtures/timeline-today';
import { todayFixture, todayNoSessionFixture } from '@/test/fixtures/today';
import { sessionFixture } from '@/test/fixtures/session';
import { server, timelineHandlers as handlers } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

vi.mock('@nerdose/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nerdose/ui')>()),
  track: vi.fn(),
}));

const TODAY = '/api/games/timeline/today?lang=es';
const MOVE = '/api/games/timeline/today/move?lang=es';
const SHARE_3 = '⏳ Tech Timeline #128\n🟩🟥🟥🟩🟩 3/5\nnerdose.dev';
const SHARE_5 = '⏳ Tech Timeline #128\n🟩🟩🟩🟩🟩 5/5\nnerdose.dev';
const PROMPT_ES = 'Ordená estos hitos del más antiguo al más reciente';
const PROMPT_EN = 'Order these milestones from oldest to newest';
const VOIDED = 'Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.';
const COOKIES =
  'Para jugar necesitamos una única cookie funcional, sin datos personales. Activá las cookies y tocá «Reintentar».';

type User = ReturnType<typeof userEvent.setup>;

const view = (route = '/timeline') => renderWithProviders({ route });
const lang = (name: 'ES' | 'EN') =>
  within(screen.getByRole('group', { name: 'Idioma' })).getByRole('button', { name });
const movePost = (body: unknown, init?: ResponseInit) =>
  http.post('/api/games/timeline/today/move', () => HttpResponse.json(body as object, init));
const movePostError = (code: string, message: string, status: number, headers?: HeadersInit) =>
  http.post('/api/games/timeline/today/move', () => errorResponse(code, message, status, headers));
const handleRe = /, (posición|position) \d de 5$|, position \d of 5$/;
const handles = () =>
  screen.getAllByRole('button', { name: handleRe }).filter((b) => b.closest('main'));
/** Nombres de los hitos, en el orden que se ven en la lista «tu orden». */
const labels = () => handles().map((b) => (b.getAttribute('aria-label') as string).split(',')[0]);
const handle = (label: string) =>
  handles().find((b) => b.getAttribute('aria-label')?.startsWith(`${label},`)) as HTMLElement;
const up = (label: string) => screen.getByRole('button', { name: `Subir ${label}` });
const down = (label: string) => screen.getByRole('button', { name: `Bajar ${label}` });
const confirmButton = () => screen.getByRole('button', { name: /Confirmar orden|Confirmando/ });
// La línea visible va antes que la región viva (`sr-only`) que repite el anuncio.
const hint = () => screen.getAllByText(/^> /)[0] as HTMLElement;
const polite = () =>
  Array.from(document.querySelectorAll('main [aria-live="polite"]')).find((n) =>
    (n.textContent ?? '').includes('> '),
  ) as HTMLElement;
const assertive = () => document.querySelector('[aria-live="assertive"]') as HTMLElement;

async function playing(data: unknown = timelineInProgress) {
  server.use(handlers.today(data));
  const user = userEvent.setup();
  const utils = view();
  await h1(PROMPT_ES);
  return { user, ...utils };
}
async function toSwap(user: User) {
  await user.click(up('Python'));
  await user.click(up('Python'));
  await user.click(down('Kubernetes'));
  await user.click(down('Kubernetes'));
  await user.click(up('Java'));
}
const SWAP_LABELS = ['Python', 'Go', 'Java', 'Docker', 'Kubernetes'];

let restoreRects: (() => void) | undefined;
afterEach(() => {
  restoreRects?.();
  restoreRects = undefined;
  server.events.removeAllListeners();
  Reflect.deleteProperty(navigator, 'share');
  vi.restoreAllMocks();
  vi.mocked(track).mockClear();
  vi.useRealTimers();
  localStorage.clear();
  sessionStorage.clear();
});

describe('abrir /timeline', () => {
  it('TS-7: sin Play muestra instrucciones con el header de juego', async () => {
    const calls = recordCalls();
    server.use(handlers.today(timelineNotStarted));
    view();
    expect(await h1('Tech Timeline')).toBeInTheDocument();
    expect(countOf(calls, 'GET', TODAY)).toBe(1);
    expect(screen.getByText('Desafío #128 · ~1 min · una partida por día')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'cómo se juega' })).toBeInTheDocument();
    for (const k of ['1 · Mirá los 5 hitos', '2 · Ordenalos', '3 · Confirmá']) {
      expect(screen.getByText(k)).toBeInTheDocument();
    }
    expect(
      screen.getByText(
        'La partida no cuenta hasta que confirmes. Si salís antes, al volver los hitos arrancan otra vez mezclados.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Empezar/ })).toBeInTheDocument();
    const header = screen.getByRole('banner');
    const nav = within(header).getByRole('navigation', { name: 'Ruta' });
    expect(within(nav).getByText('timeline')).toHaveAttribute('aria-current', 'page');
    expect(within(header).getByText('desafío del 03/11')).toBeInTheDocument();
    expect(
      within(header).getByRole('button', { name: 'Compartir resultado (disponible al terminar)' }),
    ).toHaveAttribute('aria-disabled', 'true');
    expect(document.title).toBe('Tech Timeline · nerdose');
  });

  it('TS-8: muestra el loader con el header de juego mientras carga', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    server.use(
      http.get('/api/games/timeline/today', async () => {
        await gate;
        return HttpResponse.json(timelineNotStarted);
      }),
    );
    view();
    expect(await screen.findByRole('status')).toHaveTextContent('$ cargando timeline…');
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    release();
    expect(await h1('Tech Timeline')).toBeInTheDocument();
  });

  it('TS-9: Empezar crea la Play una sola vez y muestra la partida sin fechas', async () => {
    const calls = recordCalls();
    server.use(handlers.today(timelineNotStarted), handlers.start(timelineStarted));
    const user = userEvent.setup();
    view();
    await user.dblClick(await screen.findByRole('button', { name: /Empezar/ }));
    const heading = await h1(PROMPT_ES);
    await waitFor(() => expect(heading).toHaveFocus());
    const starts = calls.filter((c) => c.method === 'POST' && c.path.endsWith('/start'));
    expect(starts).toHaveLength(1);
    expect(starts[0]?.body).toEqual({ challenge_number: 128 });
    expect(
      screen.getByText('// un solo intento · 1 punto por posición correcta'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'tu orden' })).toBeInTheDocument();
    expect(labels()).toEqual(['Go', 'Kubernetes', 'Python', 'Docker', 'Java']);
    expect(confirmButton()).not.toHaveAttribute('aria-disabled');
    const main = screen.getByRole('main');
    for (const hidden of ['1991', '1995', '2009', '2013', '2014', 'nota de']) {
      expect(main).not.toHaveTextContent(hidden);
    }
    expect(countOf(calls, 'GET', TODAY)).toBe(1);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });
});

describe('partida', () => {
  it('TS-10: retoma una Play en curso con el orden inicial', async () => {
    const calls = recordCalls();
    await playing();
    expect(labels()).toEqual(['Go', 'Kubernetes', 'Python', 'Docker', 'Java']);
    expect(screen.queryByRole('button', { name: /Empezar/ })).toBeNull();
    expect(calls.filter((c) => c.method === 'POST' && c.path.includes('/games/'))).toHaveLength(0);
  });

  it('TS-11: ↑ ↓ reordena sin consultar al servidor', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    const before = calls.length;
    await user.click(up('Kubernetes'));
    expect(labels()).toEqual(['Kubernetes', 'Go', 'Python', 'Docker', 'Java']);
    expect(hint()).toHaveTextContent('> moviste Kubernetes a la posición 1 de 5');
    expect(polite()).toHaveTextContent('> moviste Kubernetes a la posición 1 de 5');
    expect(polite().children).toHaveLength(1);
    expect(up('Kubernetes')).toBeDisabled();
    expect(down('Kubernetes')).toHaveFocus();
    expect(calls.length).toBe(before);
    expect(calls.filter((c) => c.path.includes('/move'))).toHaveLength(0);
  });

  it('TS-12: ↑ ↓ deshabilitados en los extremos', async () => {
    await playing();
    expect(up('Go')).toBeDisabled();
    expect(down('Java')).toBeDisabled();
    expect(down('Go')).toBeEnabled();
    expect(up('Java')).toBeEnabled();
  });

  it('TS-13: teclado (dnd-kit): mover y cancelar', async () => {
    restoreRects = stubSortableRects();
    const { user } = await playing();
    handle('Python').focus();
    await user.keyboard('[Space][ArrowUp][Space]');
    await waitFor(() => expect(labels()).toEqual(['Go', 'Python', 'Kubernetes', 'Docker', 'Java']));
    expect(handle('Python')).toHaveFocus();
    expect(handle('Python')).toHaveAccessibleName('Python, posición 2 de 5');
    expect(hint()).toHaveTextContent('> moviste Python a la posición 2 de 5');
    expect(assertive()).toHaveTextContent('Soltaste Python en la posición 2 de 5.');
    handle('Docker').focus();
    await user.keyboard('[Space][ArrowUp][Escape]');
    await waitFor(() =>
      expect(assertive()).toHaveTextContent('Docker volvió a la posición 4 de 5.'),
    );
    expect(labels()).toEqual(['Go', 'Python', 'Kubernetes', 'Docker', 'Java']);
  });

  it('TS-14: solo el asa es el activador de arrastre', async () => {
    const calls = recordCalls();
    await playing();
    const touch = Array.from(document.querySelectorAll('main .touch-none'));
    expect(touch).toHaveLength(5);
    for (const el of touch) {
      expect(el.tagName).toBe('BUTTON');
      expect(el).toHaveAttribute('aria-roledescription', 'elemento reordenable');
      expect(el.getAttribute('aria-label')).toMatch(/^.+, posición \d de 5$/);
    }
    for (const li of document.querySelectorAll('main li')) {
      expect(li.className).not.toContain('touch-none');
    }
    const describedBy = touch[0]?.getAttribute('aria-describedby') as string;
    expect(document.getElementById(describedBy)).toHaveTextContent(
      'Para tomar un hito, presioná Espacio o Enter. Movelo con las flechas arriba y abajo. Presioná Espacio o Enter para soltarlo, o Escape para devolverlo a su lugar.',
    );
    expect(calls.filter((c) => c.path.includes('/move'))).toHaveLength(0);
  });
});

describe('confirmación y resultado', () => {
  it('TS-15: confirmar lleva al resultado sin diálogo', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    server.use(
      http.post('/api/games/timeline/today/move', async () => {
        await gate;
        return HttpResponse.json(tlMove3);
      }),
      http.get('/api/today', () => HttpResponse.json(todayWithTimeline('lost', '3/5'))),
    );
    await toSwap(user);
    expect(labels()).toEqual(SWAP_LABELS);
    await user.click(confirmButton());
    const pendingButton = await screen.findByRole('button', { name: 'Confirmando…' });
    expect(pendingButton).toHaveAttribute('aria-disabled', 'true');
    for (const b of handles()) expect(b).toBeDisabled();
    expect(up('Go')).toBeDisabled();
    expect(down('Go')).toBeDisabled();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('alertdialog')).toBeNull();
    const todayBefore = countOf(calls, 'GET', '/api/today?lang=es');
    release();
    const heading = await h1('Casi: solo dos hitos cruzados');
    await waitFor(() => expect(heading).toHaveFocus());
    expect(countOf(calls, 'POST', MOVE)).toBe(1);
    expect(calls.find((c) => c.path === MOVE)?.body).toEqual(ORDER_SWAP);
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() =>
      expect(countOf(calls, 'GET', '/api/today?lang=es')).toBeGreaterThan(todayBefore),
    );
    expect(countOf(calls, 'GET', TODAY)).toBe(1);
  });

  it('TS-16: doble clic en «Confirmar orden» envía una sola vez', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    server.use(movePost(tlMove3));
    await user.dblClick(confirmButton());
    await h1('Casi: solo dos hitos cruzados');
    const moves = calls.filter((c) => c.path === MOVE);
    expect(moves).toHaveLength(1);
    expect(moves[0]?.body).toEqual({ challenge_number: 128, move: { order: TL_INITIAL } });
  });

  it('TS-17: resultado 3/5 completo', async () => {
    server.use(handlers.today(timelineLost3));
    view();
    const heading = await h1('Casi: solo dos hitos cruzados');
    expect(heading).not.toHaveTextContent('✓');
    expect(screen.getByText('// consigna: del más antiguo al más reciente')).toBeInTheDocument();
    expect(screen.getAllByText('3/5').length).toBeGreaterThan(0);
    expect(screen.getByText(/posiciones/)).toHaveTextContent(/posiciones\s*correctas/);
    const yours = screen.getByRole('heading', { level: 2, name: 'tu orden' }).closest('section');
    const rows = within(yours as HTMLElement).getAllByRole('listitem');
    expect(rows).toHaveLength(5);
    expect(rows.map((r) => r.querySelector('.sr-only')?.textContent)).toEqual([
      'Python, posición 1: bien',
      'Go, posición 2: mal ubicado, va en 3°',
      'Java, posición 3: mal ubicado, va en 2°',
      'Docker, posición 4: bien',
      'Kubernetes, posición 5: bien',
    ]);
    expect(screen.getAllByText('✓ bien')).toHaveLength(3);
    expect(screen.getByText('✗ va en 3°')).toBeInTheDocument();
    expect(screen.getByText('✗ va en 2°')).toBeInTheDocument();
    const correct = screen
      .getByRole('heading', { level: 2, name: 'orden correcto' })
      .closest('section') as HTMLElement;
    const text = correct.textContent ?? '';
    const order = [
      '20 de febrero de 1991',
      'Python',
      'nota de Python',
      '23 de mayo de 1995',
      'Java',
      '2009',
      'Go',
      '20 de marzo de 2013',
      'Docker',
      'junio de 2014',
      'Kubernetes',
      'nota de Kubernetes',
    ];
    let at = -1;
    for (const piece of order) {
      const idx = text.indexOf(piece, at + 1);
      expect(idx, piece).toBeGreaterThan(at);
      at = idx;
    }
    const main = screen.getByRole('main');
    expect(main.innerHTML).not.toMatch(/class="[^"]*(error|danger)/);
    expect(screen.queryByRole('button', { name: /Empezar/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Confirmar orden/ })).toBeNull();
  });

  it('TS-18: resultado 5/5', async () => {
    server.use(handlers.today(timelineWon));
    view();
    const heading = await h1('Orden perfecto');
    expect(heading.querySelector('[aria-hidden="true"]')).toHaveTextContent('✓');
    expect(screen.getAllByText('5/5').length).toBeGreaterThan(0);
    expect(screen.getAllByText('✓ bien')).toHaveLength(5);
    expect(screen.queryByText(/✗/)).toBeNull();
  });

  it('TS-19: resultado 0/5', async () => {
    server.use(handlers.today(timelineLost0));
    view();
    await h1('Hoy ganó la historia');
    expect(screen.getAllByText('0/5').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^✗ va en \d°$/)).toHaveLength(5);
    expect(screen.getByText('✗ va en 2°')).toBeInTheDocument();
    expect(screen.queryByText('✓ bien')).toBeNull();
  });

  it('TS-20: reabrir el mismo día muestra lo mismo', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    server.use(movePost(tlMove3));
    await toSwap(user);
    await user.click(confirmButton());
    await h1('Casi: solo dos hitos cruzados');
    const first = screen
      .getByRole('heading', { level: 2, name: 'tu orden' })
      .closest('section')?.textContent;
    document.body.innerHTML = '';
    server.use(handlers.today(timelineLost3));
    view();
    await h1('Casi: solo dos hitos cruzados');
    expect(
      screen.getByRole('heading', { level: 2, name: 'tu orden' }).closest('section')?.textContent,
    ).toBe(first);
    expect(calls.filter((c) => c.method === 'POST' && c.path === MOVE)).toHaveLength(1);
  });

  it('TS-21: rachas y salidas del resultado', async () => {
    server.use(handlers.today(timelineLost3));
    view();
    await h1('Casi: solo dos hitos cruzados');
    expect(screen.getByRole('heading', { level: 2, name: 'rachas' })).toBeInTheDocument();
    expect(screen.getByText(/Tech Timeline: 3 días/)).toBeInTheDocument();
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
      '/grep-grid',
    );
    expect(screen.getByRole('link', { name: /Volver a los juegos/ })).toHaveAttribute('href', '/');
    expect(screen.getByRole('button', { name: 'Reportar un problema' })).toBeInTheDocument();
  });

  it('TS-22: «Siguiente juego» oculto sin pendientes', async () => {
    server.use(
      handlers.today(timelineLost3),
      http.get('/api/today', () => HttpResponse.json(todayWithTimeline('lost', '3/5'))),
    );
    view();
    await h1('Casi: solo dos hitos cruzados');
    await screen.findByRole('link', { name: /Volver a los juegos/ });
    expect(screen.queryByRole('link', { name: /Siguiente juego/ })).toBeNull();
  });
});

describe('compartir', () => {
  async function openResult(data: unknown = timelineLost3) {
    server.use(handlers.today(data));
    const user = userEvent.setup(
      vi.isFakeTimers() ? { advanceTimers: vi.advanceTimersByTime.bind(vi) } : undefined,
    );
    view();
    await screen.findByRole('heading', { level: 1 });
    const header = within(screen.getByRole('banner'));
    return { user, button: await header.findByRole('button', { name: /Compartir/ }) };
  }

  it('TS-23: share nativo con el texto de share()', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setShare(share);
    const { user, button } = await openResult();
    const write = vi.spyOn(navigator.clipboard, 'writeText');
    await user.click(button);
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(share).toHaveBeenCalledWith({ text: SHARE_3 });
    expect(write).not.toHaveBeenCalled();
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('share:timeline');
    const text: string = share.mock.calls[0]?.[0].text;
    expect(text).not.toMatch(/Python|Java|Go|Docker|Kubernetes/);
    expect(text).not.toMatch(/\b(19|20)\d\d\b/);
  });

  it('TS-24: portapapeles con «✓ Copiado»', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { user, button } = await openResult();
    const write = vi.spyOn(navigator.clipboard, 'writeText');
    await user.click(button);
    await waitFor(() => expect(write).toHaveBeenCalledWith(SHARE_3));
    expect(await within(button).findByText('✓ Copiado')).toHaveAttribute('role', 'status');
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('share:timeline');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(within(button).getByText('Compartir')).toBeInTheDocument();
  });

  it('TS-25: compartir una victoria', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setShare(share);
    const { user, button } = await openResult(timelineWon);
    await user.click(button);
    await waitFor(() => expect(share).toHaveBeenCalledWith({ text: SHARE_5 }));
  });
});

describe('errores del ciclo común', () => {
  it('TS-26: 422 invalid_move conserva el orden y deja reconfirmar', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    let moves = 0;
    server.use(
      http.post('/api/games/timeline/today/move', () => {
        moves += 1;
        return moves === 1
          ? errorResponse('invalid_move', 'Jugada inválida.', 422)
          : HttpResponse.json(tlMove3);
      }),
    );
    await toSwap(user);
    await user.click(confirmButton());
    await waitFor(() =>
      expect(hint()).toHaveTextContent(
        '> no pudimos registrar ese orden. Revisalo y confirmá de nuevo',
      ),
    );
    expect(labels()).toEqual(SWAP_LABELS);
    expect(confirmButton()).not.toHaveAttribute('aria-disabled');
    expect(screen.queryByText('Jugada inválida.')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    await user.click(confirmButton());
    await h1('Casi: solo dos hitos cruzados');
    expect(calls.filter((c) => c.path === MOVE).map((c) => c.body)).toEqual([
      ORDER_SWAP,
      ORDER_SWAP,
    ]);
  });

  it('TS-27: 429 al confirmar', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    server.use(
      movePostError('rate_limited', 'Demasiadas solicitudes. Probá de nuevo en un rato', 429, {
        'Retry-After': '5',
      }),
    );
    await toSwap(user);
    await user.click(confirmButton());
    await waitFor(() =>
      expect(hint()).toHaveTextContent('> vas muy rápido. Esperá unos segundos y probá de nuevo'),
    );
    expect(labels()).toEqual(SWAP_LABELS);
    expect(screen.queryByRole('alert')).toBeNull();
    await waitFor(() => expect(confirmButton()).not.toHaveAttribute('aria-disabled'));
    await user.click(confirmButton());
    await waitFor(() => expect(countOf(calls, 'POST', MOVE)).toBe(2));
  });

  it('TS-28: game_finished lleva al resultado', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    server.use(movePostError('game_finished', 'La partida ya terminó', 409));
    server.use(handlers.today(timelineLost3));
    await user.click(confirmButton());
    expect(await h1('Casi: solo dos hitos cruzados')).toBeInTheDocument();
    expect(countOf(calls, 'GET', TODAY)).toBe(2);
  });

  it('TS-29: challenge_expired lleva a instrucciones del día nuevo', async () => {
    const calls = recordCalls();
    const bodies: unknown[] = [];
    const { user } = await playing();
    server.use(
      movePostError('challenge_expired', 'El desafío cambió. Cargando el de hoy…', 409),
      handlers.today(timelineNextDay),
      http.get('/api/today', () => HttpResponse.json({ ...todayFixture, number: 129 })),
      http.post('/api/games/timeline/today/start', async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(timelineStarted);
      }),
    );
    await toSwap(user);
    await user.click(confirmButton());
    expect(
      await screen.findByText('Desafío #129 · ~1 min · una partida por día'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Tech Timeline' })).toBeInTheDocument();
    const notice = screen.getByText(
      'Empezó el desafío #129. La partida de ayer quedó sin terminar y no cuenta para tu racha.',
    );
    expect(notice.closest('[role="status"]')).not.toBeNull();
    expect(countOf(calls, 'GET', TODAY)).toBe(2);
    expect(countOf(calls, 'GET', '/api/today?lang=es')).toBeGreaterThanOrEqual(2);
    server.use(handlers.today({ ...timelineNextDay, play: timelineStarted.play }));
    await user.click(screen.getByRole('button', { name: /Empezar/ }));
    await h1(PROMPT_ES);
    expect(bodies).toEqual([{ challenge_number: 129 }]);
    expect(labels()).toEqual(['Go', 'Kubernetes', 'Python', 'Docker', 'Java']);
  });

  it('TS-30: challenge_voided al confirmar bloquea la partida', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    const todayBefore = countOf(calls, 'GET', '/api/today?lang=es');
    server.use(movePostError('challenge_voided', 'Este desafío fue anulado', 409));
    await user.click(confirmButton());
    const banner = (await screen.findByText(VOIDED)).closest('[role="status"]');
    expect(banner).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Confirmar orden' })).toBeNull();
    expect(screen.queryByText(/^Arrastrá cada fila/)).toBeNull();
    expect(handles()).toHaveLength(5);
    for (const b of handles()) expect(b).toBeDisabled();
    for (const l of ['Go', 'Kubernetes', 'Python', 'Docker', 'Java']) {
      expect(up(l)).toBeDisabled();
      expect(down(l)).toBeDisabled();
    }
    await user.click(down('Go'));
    expect(labels()).toEqual(['Go', 'Kubernetes', 'Python', 'Docker', 'Java']);
    await waitFor(() =>
      expect(countOf(calls, 'GET', '/api/today?lang=es')).toBeGreaterThan(todayBefore),
    );
  });

  it('TS-31a: no_session al confirmar se recupera sola', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    let moves = 0;
    server.use(
      http.post('/api/games/timeline/today/move', () => {
        moves += 1;
        return moves === 1
          ? errorResponse('no_session', 'Activá las cookies para jugar', 401)
          : HttpResponse.json(tlMove3);
      }),
      http.post('/api/session', () => HttpResponse.json(sessionFixture)),
    );
    await toSwap(user);
    await user.click(confirmButton());
    await h1('Casi: solo dos hitos cruzados');
    const order = calls
      .filter((c) => c.method === 'POST')
      .map((c) => c.path.split('?')[0])
      .slice(1);
    expect(order).toEqual([
      '/api/games/timeline/today/move',
      '/api/session',
      '/api/games/timeline/today/move',
    ]);
    expect(calls.filter((c) => c.path === MOVE).map((c) => c.body)).toEqual([
      ORDER_SWAP,
      ORDER_SWAP,
    ]);
    expect(screen.queryByText(COOKIES)).toBeNull();
  });

  it('TS-31b: no_session persistente muestra el banner y «Reintentar» reenvía', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    let healthy = false;
    server.use(
      http.post('/api/games/timeline/today/move', () =>
        healthy
          ? HttpResponse.json(tlMove3)
          : errorResponse('no_session', 'Activá las cookies para jugar', 401),
      ),
    );
    await toSwap(user);
    await user.click(confirmButton());
    const banner = (await screen.findByText(COOKIES)).closest('[role="status"]') as HTMLElement;
    expect(labels()).toEqual(SWAP_LABELS);
    healthy = true;
    const before = countOf(calls, 'POST', '/api/session');
    await user.click(within(banner).getByRole('button', { name: /Reintentar/ }));
    await h1('Casi: solo dos hitos cruzados');
    expect(countOf(calls, 'POST', '/api/session')).toBe(before + 1);
    expect(calls.filter((c) => c.path === MOVE).at(-1)?.body).toEqual(ORDER_SWAP);
  });

  it('TS-32: sin desafío hoy y anulado sin Play', async () => {
    server.use(handlers.today(timelineNone));
    const a = view();
    expect(await h1('Tech Timeline')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Hoy no hay desafío de Tech Timeline. Es un día neutro: no suma ni corta tu racha.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Volver a los juegos/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Empezar/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cómo se juega' })).toBeNull();
    a.unmount();
    server.use(handlers.today(timelineVoided));
    view();
    expect((await screen.findAllByText(VOIDED)).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /Empezar/ })).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('TS-33: error de carga con «Reintentar»', async () => {
    let fail = true;
    server.use(
      http.get('/api/games/timeline/today', () =>
        fail ? errorResponse('internal_error', 'x', 500) : HttpResponse.json(timelineNotStarted),
      ),
    );
    const user = userEvent.setup();
    view();
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'No pudimos cargar el desafío de Tech Timeline. Revisá tu conexión e intentá de nuevo.',
    );
    fail = false;
    await user.click(within(alert).getByRole('button', { name: /Reintentar/ }));
    expect(await h1('Tech Timeline')).toBeInTheDocument();
  });
});

describe('idioma y retomar', () => {
  it('TS-34: cambiar a EN a mitad de partida no pierde el orden', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    await user.click(up('Kubernetes'));
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    server.use(
      http.get('/api/games/timeline/today', async ({ request }) => {
        const en = new URL(request.url).searchParams.get('lang') === 'en';
        if (en) await gate;
        return HttpResponse.json(en ? timelineInProgressEn : timelineInProgress);
      }),
    );
    await user.click(lang('EN'));
    await waitFor(() => expect(countOf(calls, 'GET', '/api/games/timeline/today?lang=en')).toBe(1));
    expect(screen.queryByText('$ cargando timeline…')).toBeNull();
    expect(labels()).toEqual(['Kubernetes', 'Go', 'Python', 'Docker', 'Java']);
    release();
    expect(await h1(PROMPT_EN)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm order' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kubernetes, position 1 of 5' })).toBeInTheDocument();
    expect(labels()).toEqual(['Kubernetes', 'Go', 'Python', 'Docker', 'Java']);
    const stored = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage });
    for (const id of Object.values(TL_OID)) expect(stored).not.toContain(id);
  });

  it('TS-35: volver a entrar sin confirmar parte del orden inicial', async () => {
    const calls = recordCalls();
    server.use(
      handlers.today(timelineInProgress),
      http.get('/api/today', () => HttpResponse.json(todayWithTimeline('in_progress', null))),
    );
    const user = userEvent.setup();
    view();
    await h1(PROMPT_ES);
    await toSwap(user);
    expect(labels()).toEqual(SWAP_LABELS);
    await user.click(screen.getByRole('link', { name: 'nerdose' }));
    const card = (await screen.findByRole('heading', { name: 'Tech Timeline' })).closest(
      'article',
    ) as HTMLElement;
    expect(within(card).getByText('en curso')).toBeInTheDocument();
    await user.click(within(card).getByRole('link', { name: /Seguir jugando/ }));
    await h1(PROMPT_ES);
    expect(labels()).toEqual(['Go', 'Kubernetes', 'Python', 'Docker', 'Java']);
    expect(calls.filter((c) => c.path.includes('/move'))).toHaveLength(0);
  });

  it('TS-36: cambiar a EN en el resultado', async () => {
    server.use(handlers.today(timelineLost3));
    const user = userEvent.setup();
    view();
    await h1('Casi: solo dos hitos cruzados');
    server.use(
      http.get('/api/games/timeline/today', ({ request }) =>
        HttpResponse.json(
          new URL(request.url).searchParams.get('lang') === 'en' ? timelineLost3En : timelineLost3,
        ),
      ),
    );
    await user.click(lang('EN'));
    expect(await h1('So close: just two milestones swapped')).toBeInTheDocument();
    expect(screen.getByText('// task: from oldest to newest')).toBeInTheDocument();
    expect(screen.getByText(/February 20, 1991/)).toBeInTheDocument();
    expect(screen.getByText('2009')).toBeInTheDocument();
    expect(screen.getByText(/June 2014/)).toBeInTheDocument();
    expect(screen.getByText('note on Python')).toBeInTheDocument();
    expect(screen.getAllByText('✓ right')).toHaveLength(3);
    expect(screen.getByText('✗ goes 3°')).toBeInTheDocument();
    expect(screen.getByText('✗ goes 2°')).toBeInTheDocument();
    expect(screen.getAllByText('3/5').length).toBeGreaterThan(0);
  });

  it('TS-37: header en las tres fases y «Cómo se juega» con reduced motion', async () => {
    const originalMatchMedia = window.matchMedia;
    const originalScroll = Element.prototype.scrollIntoView;
    window.matchMedia = ((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    try {
      const { user } = await playing();
      const header = within(screen.getByRole('banner'));
      expect(header.getByText('desafío del 03/11')).toBeInTheDocument();
      await user.click(header.getByRole('button', { name: 'Cómo se juega' }));
      expect(scroll).toHaveBeenCalledTimes(1);
      const target = scroll.mock.contexts[0] as HTMLElement;
      expect(target.id).toBe('game-help');
      expect(target).toHaveTextContent(/^\/\/ reglas/);
      expect(target).toHaveTextContent(/Arrastrá cada fila/);
      expect(scroll).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
      server.use(movePost(tlMove3));
      await user.click(confirmButton());
      await h1('Casi: solo dos hitos cruzados');
      const after = within(screen.getByRole('banner'));
      expect(after.queryByRole('button', { name: 'Cómo se juega' })).toBeNull();
      expect(after.getByRole('button', { name: 'Compartir' })).not.toHaveAttribute('aria-disabled');
      expect(after.getByText('desafío del 03/11')).toBeInTheDocument();
    } finally {
      window.matchMedia = originalMatchMedia;
      Element.prototype.scrollIntoView = originalScroll;
    }
  });
});

describe('home', () => {
  it('TS-38: tarjeta de Tech Timeline en sus estados', async () => {
    const calls = recordCalls();
    const cases: [Parameters<typeof todayWithTimeline>, string, string, string | null][] = [
      [[null, null], 'sin jugar', 'Jugar', null],
      [['in_progress', null], 'en curso', 'Seguir jugando', null],
      [['lost', '3/5'], 'completado', 'Ver resultado', '3/5'],
    ];
    for (const [args, state, link, label] of cases) {
      server.use(http.get('/api/today', () => HttpResponse.json(todayWithTimeline(...args))));
      const { unmount } = renderWithProviders({ route: '/' });
      const card = (await screen.findByRole('heading', { name: 'Tech Timeline' })).closest(
        'article',
      ) as HTMLElement;
      if (!label) expect(within(card).getByText(state)).toBeInTheDocument();
      expect(within(card).getByRole('link', { name: new RegExp(link) })).toHaveAttribute(
        'href',
        '/timeline',
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

  it('TS-39: la home se refresca tras terminar Timeline', async () => {
    let todayCalls = 0;
    server.use(
      http.get('/api/today', () => {
        todayCalls += 1;
        return HttpResponse.json(todayCalls <= 1 ? todayFixture : todayWithTimeline('lost', '3/5'));
      }),
    );
    const { user } = await playing();
    server.use(movePost(tlMove3));
    await toSwap(user);
    await user.click(confirmButton());
    await h1('Casi: solo dos hitos cruzados');
    await waitFor(() => expect(todayCalls).toBeGreaterThanOrEqual(2));
    await user.click(await screen.findByRole('link', { name: /Volver a los juegos/ }));
    const card = (await screen.findByRole('heading', { name: 'Tech Timeline' })).closest(
      'article',
    ) as HTMLElement;
    expect(await within(card).findByText('3/5')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /Ver resultado/ })).toBeInTheDocument();
  });
});

describe('teclado y lector', () => {
  it('TS-40: navegar desde la home mueve el foco al h1', async () => {
    server.use(
      http.get('/api/today', () => HttpResponse.json(todayWithTimeline(null, null))),
      handlers.today(timelineNotStarted),
      handlers.start(timelineStarted),
    );
    const user = userEvent.setup();
    renderWithProviders({ route: '/' });
    const card = (await screen.findByRole('heading', { name: 'Tech Timeline' })).closest(
      'article',
    ) as HTMLElement;
    await user.click(within(card).getByRole('link', { name: /Jugar/ }));
    const heading = await h1('Tech Timeline');
    await waitFor(() => expect(heading).toHaveFocus());
    expect(heading).toHaveAttribute('tabindex', '-1');
    await user.click(screen.getByRole('button', { name: /Empezar/ }));
    const prompt = await h1(PROMPT_ES);
    await waitFor(() => expect(prompt).toHaveFocus());
  });

  it('TS-41: partida completa y compartir solo con teclado', async () => {
    restoreRects = stubSortableRects();
    const calls = recordCalls();
    const share = vi.fn().mockResolvedValue(undefined);
    setShare(share);
    const { user } = await playing();
    server.use(movePost(tlMove3));
    const tabTo = async (el: () => HTMLElement) => {
      for (let i = 0; i < 40 && document.activeElement !== el(); i++) await user.tab();
      expect(el()).toHaveFocus();
    };
    await tabTo(() => handle('Python'));
    await user.keyboard('[Space][ArrowUp][ArrowUp][Space]');
    await waitFor(() => expect(labels()[0]).toBe('Python'));
    await tabTo(() => up('Java'));
    await user.keyboard('{Enter}{Enter}');
    expect(labels()).toEqual(['Python', 'Go', 'Java', 'Kubernetes', 'Docker']);
    await tabTo(() => confirmButton());
    await user.keyboard('{Enter}');
    await h1('Casi: solo dos hitos cruzados');
    expect(calls.find((c) => c.path === MOVE)?.body).toEqual({
      challenge_number: 128,
      move: { order: ['p7k2m9', 'g2n5w3', 'j4x8q1', 'k1v3s8', 'd9r6t0'] },
    });
    const button = within(screen.getByRole('banner')).getByRole('button', { name: 'Compartir' });
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1 })),
    );
    for (let i = 0; i < 20 && document.activeElement !== button; i++) await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');
    await waitFor(() => expect(share).toHaveBeenCalledWith({ text: SHARE_3 }));
  });
});

describe('axe', () => {
  type Arrange = (user: User) => Promise<void> | void;
  const states: [string, () => void, Arrange?][] = [
    ['instrucciones', () => server.use(handlers.today(timelineNotStarted))],
    [
      'instrucciones sin sesión',
      () => server.use(http.get('/api/today', () => HttpResponse.json(todayNoSessionFixture))),
    ],
    ['partida', () => server.use(handlers.today(timelineInProgress))],
    [
      'partida con un hito tomado',
      () => {
        restoreRects = stubSortableRects();
        server.use(handlers.today(timelineInProgress));
      },
      async (user) => {
        handle('Python').focus();
        await user.keyboard('[Space]');
      },
    ],
    [
      'partida confirmando',
      () =>
        server.use(
          handlers.today(timelineInProgress),
          http.post('/api/games/timeline/today/move', () => new Promise(() => undefined)),
        ),
      async (user) => {
        await user.click(confirmButton());
        await screen.findByRole('button', { name: 'Confirmando…' });
      },
    ],
    [
      'partida anulada',
      () =>
        server.use(handlers.today(timelineInProgress), movePostError('challenge_voided', 'x', 409)),
      async (user) => {
        await user.click(confirmButton());
        await screen.findByText(VOIDED);
      },
    ],
    ['resultado 3/5', () => server.use(handlers.today(timelineLost3))],
    ['resultado 5/5', () => server.use(handlers.today(timelineWon))],
    ['resultado 0/5', () => server.use(handlers.today(timelineLost0))],
    ['sin desafío', () => server.use(handlers.today(timelineNone))],
    [
      'error de carga',
      () =>
        server.use(
          http.get('/api/games/timeline/today', () => errorResponse('internal_error', 'x', 500)),
        ),
    ],
  ];

  it.each(states)('TS-42: %s sin violaciones', async (name, arrange, after) => {
    arrange();
    const user = userEvent.setup();
    const { container } = view();
    await screen.findByRole('banner');
    await waitFor(() => expect(screen.queryByText(/^\$ cargando/)).toBeNull());
    await screen.findByRole('main');
    if (after) {
      await h1(PROMPT_ES);
      await after(user);
    }
    await new Promise((r) => setTimeout(r, 30));
    // En jsdom no hay CSS: `color-contrast` no se evalúa y lo garantizan los tokens del DS.
    expect(await axe(container), name).toHaveNoViolations();
    if (name === 'partida con un hito tomado') await user.keyboard('[Escape]');
  });

  it.each([
    ['partida', timelineInProgress],
    ['resultado', timelineLost3],
  ])('TS-42: %s en inglés sin violaciones', async (_name, data) => {
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
