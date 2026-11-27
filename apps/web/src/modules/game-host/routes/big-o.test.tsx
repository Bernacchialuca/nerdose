import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import {
  BO_LABELS,
  MOVE_GO_NLOGN,
  MOVE_JAVA_NLOGN,
  bigOInProgress,
  bigOLostGo,
  bigONextDay,
  bigONone,
  bigONotStarted,
  bigOPlain,
  bigOStarted,
  bigOVoided,
  bigOWonJava,
  bigOWonJavaEn,
  boMove,
  todayWithBigO,
} from '@/test/fixtures/big-o-today';
import {
  countOf,
  errorResponse,
  h1,
  recordCalls,
  setShare,
  settle,
} from '@/test/game-route-helpers';
import { bigOHandlers as handlers, server } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

const TODAY = '/api/games/big-o/today?lang=es';
const MOVE = '/api/games/big-o/today/move?lang=es';
const SHARE_WON_JAVA = '🧮 Big O #128\n🟩 Java\nlocalhost:5173';
const SHARE_LOST_GO = '🧮 Big O #128\n🟥 Go\nlocalhost:5173';
const QUESTION_ES = '¿Cuál es la complejidad temporal (peor caso) de f(n)?';
const QUESTION_EN = 'What is the time complexity (worst case) of f(n)?';
const VOIDED = 'Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.';
const COOKIES =
  'Para jugar necesitamos una única cookie funcional, sin datos personales. Activá las cookies y tocá «Reintentar».';
const HINT_IDLE = '> elegí una de las 8 opciones';

type User = ReturnType<typeof userEvent.setup>;

const view = (route = '/big-o') => renderWithProviders({ route });
const lang = (name: 'ES' | 'EN') =>
  within(screen.getByRole('group', { name: 'Idioma' })).getByRole('button', { name });
const movePost = (body: unknown, init?: ResponseInit) =>
  http.post('/api/games/big-o/today/move', () => HttpResponse.json(body as object, init));
const movePostError = (code: string, message: string, status: number, headers?: HeadersInit) =>
  http.post('/api/games/big-o/today/move', () => errorResponse(code, message, status, headers));
const group = (name = 'Complejidad temporal de f(n)') => screen.getByRole('radiogroup', { name });
const radios = () => within(group()).getAllByRole('radio');
const radio = (name: string, groupName?: string) =>
  within(group(groupName)).getByRole('radio', { name });
const tab = (name: string) => screen.getByRole('tab', { name });
const panel = (name?: string) => screen.getByRole('tabpanel', name ? { name } : undefined);
const confirmButton = () =>
  screen.getByRole('button', { name: /Confirmar respuesta|Confirmando|Elegí una opción/ });
const hint = () => screen.getAllByText(/^> /)[0] as HTMLElement;
const polite = () =>
  Array.from(document.querySelectorAll('main [aria-live="polite"]')).find((n) =>
    (n.textContent ?? '').includes('> '),
  ) as HTMLElement;

async function playing(data: unknown = bigOInProgress) {
  server.use(handlers.today(data));
  const user = userEvent.setup();
  const utils = view();
  await h1(QUESTION_ES);
  return { user, ...utils };
}

afterEach(() => {
  server.events.removeAllListeners();
  Reflect.deleteProperty(navigator, 'share');
  vi.restoreAllMocks();
  vi.useRealTimers();
  localStorage.clear();
  sessionStorage.clear();
});

describe('abrir /big-o', () => {
  it('TS-9: sin Play muestra instrucciones con el header de juego', async () => {
    const calls = recordCalls();
    server.use(handlers.today(bigONotStarted));
    view();
    expect(await h1('Big O')).toBeInTheDocument();
    expect(screen.getByText('Desafío #128 · ~1 min · una partida por día')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'cómo se juega' })).toBeInTheDocument();
    for (const k of ['1 · Leé el código', '2 · Pensá en el peor caso', '3 · Elegí y confirmá']) {
      expect(screen.getByText(k)).toBeInTheDocument();
    }
    expect(
      screen.getByText(
        'La partida no cuenta hasta que confirmes. Si salís antes, al volver no vas a tener ninguna opción marcada, pero conservás tu intento.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Empezar/ })).toBeInTheDocument();
    const header = screen.getByRole('banner');
    const nav = within(header).getByRole('navigation', { name: 'Ruta' });
    expect(within(nav).getByText('big-o')).toHaveAttribute('aria-current', 'page');
    expect(within(header).getByText('desafío del 03/11')).toBeInTheDocument();
    expect(
      within(header).getByRole('button', { name: 'Compartir resultado (disponible al terminar)' }),
    ).toHaveAttribute('aria-disabled', 'true');
    expect(document.title).toBe('Big O · nerdose');
    expect(countOf(calls, 'GET', TODAY)).toBe(1);
  });

  it('TS-10: muestra el loader con el header de juego mientras carga', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    server.use(
      http.get('/api/games/big-o/today', async () => {
        await gate;
        return HttpResponse.json(bigONotStarted);
      }),
    );
    view();
    expect(await screen.findByRole('status')).toHaveTextContent('$ cargando big-o…');
    expect(screen.getByRole('banner')).toBeInTheDocument();
    release();
    expect(await h1('Big O')).toBeInTheDocument();
  });

  it('TS-11: Empezar abre la partida en JS con las 8 opciones', async () => {
    const calls = recordCalls();
    server.use(handlers.today(bigONotStarted), handlers.start(bigOStarted));
    const user = userEvent.setup();
    view();
    await user.click(await screen.findByRole('button', { name: /Empezar/ }));
    await h1(QUESTION_ES);
    const starts = calls.filter((c) => c.method === 'POST' && c.path.endsWith('/start'));
    expect(starts).toHaveLength(1);
    expect(starts[0]?.body).toEqual({ challenge_number: 128 });
    expect(screen.getByText('peor caso · un solo intento')).toBeInTheDocument();
    const tablist = screen.getByRole('tablist', { name: 'Lenguaje del código' });
    expect(
      within(tablist)
        .getAllByRole('tab')
        .map((t) => t.textContent),
    ).toEqual(['JavaScript', 'Go', 'Java']);
    expect(tab('JavaScript')).toHaveAttribute('aria-selected', 'true');
    expect(panel('Código de f(n) en JavaScript')).toHaveTextContent('function f(n) {');
    expect(radios().map((r) => r.textContent?.replace(/[●✓✗\s]/g, ''))).toEqual(
      BO_LABELS.map((l) => l.replace(/\s/g, '')),
    );
    for (const r of radios()) expect(r).toHaveAttribute('aria-checked', 'false');
    expect(confirmButton()).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText(HINT_IDLE)).toBeInTheDocument();
    const main = screen.getByRole('main');
    for (const hidden of ['n veces', 'Paso a paso', 'correcta']) {
      expect(main).not.toHaveTextContent(hidden);
    }
  });

  it('TS-12: retoma en el lenguaje preferido de la sesión', async () => {
    server.use(
      http.post('/api/session', () =>
        HttpResponse.json({ locale: 'es', preferred_code_language: 'go', created: false }),
      ),
      handlers.today(bigOInProgress),
    );
    view();
    await h1(QUESTION_ES);
    await waitFor(() => expect(tab('Go')).toHaveAttribute('aria-selected', 'true'));
    expect(panel('Código de f(n) en Go')).toHaveTextContent('func f(n int) int {');
  });
});

describe('partida', () => {
  it('TS-13: cambiar de lenguaje no hace requests ni borra la opción', async () => {
    const calls = recordCalls();
    const { user, queryClient } = await playing();
    await user.click(radio('O(n²)'));
    const before = calls.length;
    await user.click(tab('Go'));
    await settle();
    expect(calls.length).toBe(before);
    expect(radio('O(n²)')).toHaveAttribute('aria-checked', 'true');
    expect(panel('Código de f(n) en Go')).toHaveTextContent('func f(n int) int {');
    expect(hint()).toHaveTextContent('> elegiste O(n²). Podés cambiarla hasta confirmar.');
    expect(
      (queryClient.getQueryData(['session']) as { preferred_code_language: string })
        .preferred_code_language,
    ).toBe('js');
  });

  it('TS-14: ES a EN a mitad de partida conserva opción y pestaña', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    server.use(http.get('/api/games/big-o/today', () => HttpResponse.json(bigOInProgress)));
    await user.click(radio('O(n²)'));
    await user.click(tab('Java'));
    await user.click(lang('EN'));
    await h1(QUESTION_EN);
    expect(radio('O(n²)', 'Time complexity of f(n)')).toHaveAttribute('aria-checked', 'true');
    expect(tab('Java')).toHaveAttribute('aria-selected', 'true');
    const patches = calls.filter((c) => c.method === 'PATCH');
    expect(patches).toHaveLength(1);
    expect(patches[0]?.path).toBe('/api/me/preferences');
    expect(patches[0]?.body).toEqual({ locale: 'en' });
    expect(calls.filter((c) => c.path.includes('/move'))).toHaveLength(0);
  });
});

describe('confirmación y resultado', () => {
  it('TS-15: confirmar en Java lleva al resultado completo y actualiza caches', async () => {
    const calls = recordCalls();
    const { user, queryClient } = await playing();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    server.use(
      http.post('/api/games/big-o/today/move', async () => {
        await gate;
        return HttpResponse.json(boMove('o_n_log_n', 'java'));
      }),
      http.get('/api/today', () => HttpResponse.json(todayWithBigO('won', '✓'))),
    );
    await user.click(tab('Java'));
    await user.click(radio('O(n log n)'));
    await user.click(confirmButton());
    const pendingButton = await screen.findByRole('button', { name: 'Confirmando…' });
    expect(pendingButton).toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryByRole('dialog')).toBeNull();
    const todayBefore = countOf(calls, 'GET', '/api/today?lang=es');
    release();
    const heading = await h1('Correcto: O(n log n)');
    await waitFor(() => expect(heading).toHaveFocus());
    expect(countOf(calls, 'POST', MOVE)).toBe(1);
    expect(calls.find((c) => c.path === MOVE)?.body).toEqual(MOVE_JAVA_NLOGN);
    expect(tab('Java')).toHaveAttribute('aria-selected', 'true');
    expect(
      screen.getByRole('heading', { level: 2, name: 'tu respuesta · confirmada en Java' }),
    ).toBeInTheDocument();
    expect(screen.getByText('O(n log n), correcta, tu respuesta')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Paso a paso' })).toBeInTheDocument();
    const main = within(screen.getByRole('main'));
    for (const step of [
      'El loop externo corre n veces.',
      'El interno duplica j: log₂ n vueltas.',
      'Anidados se multiplican: n × log n. Simplificado: O(n log n).',
    ]) {
      expect(main.getByText(step)).toBeInTheDocument();
    }
    expect(main.getByText('// en números, con n = 1024')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent(/f\(1024\) cuenta 10\.240 operaciones/);
    expect(screen.getByRole('main')).toHaveTextContent(/con O\(n²\) serían 1\.048\.576/);
    expect(main.getByText('Un loop interno que duplica su variable no es n.')).toBeInTheDocument();
    expect(panel()).toHaveTextContent('n veces');
    expect(panel()).toHaveTextContent('log n veces');
    expect(
      within(screen.getByRole('banner')).getByRole('button', { name: 'Compartir' }),
    ).not.toHaveAttribute('aria-disabled');
    expect(screen.getByTestId('confetti')).toBeInTheDocument();
    const session = queryClient.getQueryData(['session']) as { preferred_code_language: string };
    expect(session.preferred_code_language).toBe('java');
    const cached = queryClient.getQueryData(['game-today', 'big-o', 'es']) as {
      play: { code_language: string };
    };
    expect(cached.play.code_language).toBe('java');
    await waitFor(() =>
      expect(countOf(calls, 'GET', '/api/today?lang=es')).toBeGreaterThan(todayBefore),
    );
  });

  it('TS-16: doble clic en «Confirmar respuesta» envía una sola vez', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    server.use(movePost(boMove('o_n_log_n', 'js')));
    await user.click(radio('O(n log n)'));
    await user.dblClick(confirmButton());
    await h1('Correcto: O(n log n)');
    expect(countOf(calls, 'POST', MOVE)).toBe(1);
  });

  it('TS-17: resultado perdido (reabierto)', async () => {
    server.use(handlers.today(bigOLostGo));
    view();
    const heading = await h1('Incorrecto: era O(n log n)');
    expect(heading.closest('[role="status"]')).not.toBeNull();
    expect(
      screen.getByText('Elegiste O(n²) en Go. El paso a paso explica por qué.'),
    ).toBeInTheDocument();
    expect(tab('Go')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('O(n²), tu respuesta, incorrecta')).toBeInTheDocument();
    expect(screen.getByText('O(n log n), correcta')).toBeInTheDocument();
    expect(screen.queryByTestId('confetti')).toBeNull();
  });

  it('TS-18: resultado sin ejemplo ni consejo', async () => {
    server.use(handlers.today(bigOPlain));
    view();
    await h1('Correcto: O(n log n)');
    expect(screen.queryByText(/en números/)).toBeNull();
    expect(screen.queryByText(/Un loop interno/)).toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: 'Paso a paso' })).toBeInTheDocument();
    expect(screen.getByText('El loop externo corre n veces.')).toBeInTheDocument();
    expect(tab('JavaScript')).toHaveAttribute('aria-selected', 'true');
  });
});

describe('retomar', () => {
  it('TS-19: salir y volver sin confirmar: sin selección y con el intento', async () => {
    const calls = recordCalls();
    server.use(
      handlers.today(bigOInProgress),
      http.get('/api/today', () => HttpResponse.json(todayWithBigO('in_progress', null))),
    );
    const user = userEvent.setup();
    view();
    await h1(QUESTION_ES);
    await user.click(radio('O(n²)'));
    await user.click(screen.getByRole('link', { name: 'nerdose' }));
    const card = (await screen.findByRole('heading', { name: 'Big O' })).closest(
      'article',
    ) as HTMLElement;
    await user.click(within(card).getByRole('link', { name: /Seguir jugando/ }));
    await h1(QUESTION_ES);
    for (const r of radios()) expect(r).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText(HINT_IDLE)).toBeInTheDocument();
    expect(tab('JavaScript')).toHaveAttribute('aria-selected', 'true');
    expect(calls.filter((c) => c.path.includes('/move'))).toHaveLength(0);
    await user.click(radio('O(n)'));
    expect(confirmButton()).not.toHaveAttribute('aria-disabled', 'true');
  });
});

describe('compartir', () => {
  async function openResult(data: unknown) {
    server.use(handlers.today(data));
    const user = userEvent.setup(
      vi.isFakeTimers() ? { advanceTimers: vi.advanceTimersByTime.bind(vi) } : undefined,
    );
    view();
    await screen.findByRole('heading', { level: 1 });
    const header = within(screen.getByRole('banner'));
    return { user, button: await header.findByRole('button', { name: /Compartir/ }) };
  }

  it('TS-20: share nativo', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setShare(share);
    const { user, button } = await openResult(bigOWonJava);
    await user.click(button);
    await waitFor(() => expect(share).toHaveBeenCalledWith({ text: SHARE_WON_JAVA }));
  });

  it('TS-21: share por portapapeles al perder', async () => {
    const { user, button } = await openResult(bigOLostGo);
    const write = vi.spyOn(navigator.clipboard, 'writeText');
    await user.click(button);
    await waitFor(() => expect(write).toHaveBeenCalledWith(SHARE_LOST_GO));
    expect(SHARE_LOST_GO).not.toContain('O(');
    expect(await within(button).findByText('✓ Copiado')).toBeInTheDocument();
  });
});

describe('errores del ciclo común', () => {
  it('TS-22: 422 invalid_move no consume el intento', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    server.use(movePostError('invalid_move', 'Jugada inválida.', 422));
    await user.click(radio('O(n)'));
    await user.click(confirmButton());
    const text =
      '> no pudimos registrar tu respuesta. Elegí una opción y confirmá de nuevo: no perdiste tu intento.';
    await waitFor(() => expect(hint()).toHaveTextContent(text));
    expect(polite()).toHaveTextContent(text);
    expect(group()).toBeInTheDocument();
    server.use(movePost(boMove('o_n', 'js')));
    await user.click(radio('O(n)'));
    await user.click(confirmButton());
    await h1('Incorrecto: era O(n log n)');
    expect(countOf(calls, 'POST', MOVE)).toBe(2);
  });

  it('TS-23: 429 al confirmar', async () => {
    const { user } = await playing();
    server.use(movePostError('rate_limited', 'Demasiadas jugadas.', 429, { 'Retry-After': '5' }));
    await user.click(radio('O(n)'));
    await user.click(confirmButton());
    await waitFor(() =>
      expect(hint()).toHaveTextContent('> vas muy rápido. Esperá unos segundos y probá de nuevo.'),
    );
    expect(group()).toBeInTheDocument();
  });

  it('TS-24: challenge_voided al confirmar bloquea la partida', async () => {
    const { user } = await playing();
    server.use(movePostError('challenge_voided', 'Este desafío fue anulado', 409));
    await user.click(radio('O(n)'));
    await user.click(confirmButton());
    expect((await screen.findByText(VOIDED)).closest('[role="status"]')).not.toBeNull();
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByRole('tabpanel')).toBeNull();
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Confirmar respuesta' })).toBeNull();
    expect(screen.getByRole('button', { name: /Reportar un problema/ })).toBeInTheDocument();
  });

  it('TS-25: game_finished lleva al resultado', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    server.use(movePostError('game_finished', 'La partida ya terminó', 409));
    server.use(handlers.today(bigOWonJava));
    await user.click(radio('O(n log n)'));
    await user.click(confirmButton());
    expect(await h1('Correcto: O(n log n)')).toBeInTheDocument();
    expect(countOf(calls, 'GET', TODAY)).toBe(2);
  });

  it('TS-26: challenge_expired vuelve a instrucciones del día nuevo', async () => {
    const { user } = await playing();
    server.use(
      movePostError('challenge_expired', 'El desafío cambió. Cargando el de hoy…', 409),
      handlers.today(bigONextDay),
      http.get('/api/today', () => HttpResponse.json(todayWithBigO(null, null))),
    );
    await user.click(radio('O(n)'));
    await user.click(confirmButton());
    expect(
      await screen.findByText('Desafío #129 · ~1 min · una partida por día'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Big O' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Empezó el desafío #129. La partida de ayer quedó sin confirmar y no cuenta para tu racha.',
      ),
    ).toBeInTheDocument();
  });

  it('TS-27: no_session persistente conserva opción y lenguaje, y «Reintentar» reenvía', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    let healthy = false;
    server.use(
      http.post('/api/games/big-o/today/move', () =>
        healthy
          ? HttpResponse.json(boMove('o_n2', 'go'))
          : errorResponse('no_session', 'Activá las cookies para jugar', 401),
      ),
    );
    await user.click(tab('Go'));
    await user.click(radio('O(n²)'));
    await user.click(confirmButton());
    const banner = (await screen.findByText(COOKIES)).closest('[role="status"]') as HTMLElement;
    expect(radio('O(n²)')).toHaveAttribute('aria-checked', 'true');
    expect(tab('Go')).toHaveAttribute('aria-selected', 'true');
    healthy = true;
    await user.click(within(banner).getByRole('button', { name: /Reintentar/ }));
    await h1('Incorrecto: era O(n log n)');
    expect(calls.filter((c) => c.path === MOVE).at(-1)?.body).toEqual({
      challenge_number: 128,
      move: { language: 'go', option: 'o_n2' },
    });
  });
});

describe('«Cómo se juega», sin desafío y teclado', () => {
  it('TS-28: «Cómo se juega» y Compartir según la fase', async () => {
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
      expect(header.getByRole('button', { name: /Compartir resultado/ })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
      await user.click(header.getByRole('button', { name: 'Cómo se juega' }));
      expect(scroll).toHaveBeenCalledTimes(1);
      const target = scroll.mock.contexts[0] as HTMLElement;
      expect(target.id).toBe('game-help');
      expect(target).toHaveTextContent(/cómo se juega/);
      expect(scroll).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
      server.use(movePost(boMove('o_n_log_n', 'js')));
      await user.click(radio('O(n log n)'));
      await user.click(confirmButton());
      await h1('Correcto: O(n log n)');
      const after = within(screen.getByRole('banner'));
      expect(after.queryByRole('button', { name: 'Cómo se juega' })).toBeNull();
      expect(after.getByRole('button', { name: 'Compartir' })).not.toHaveAttribute('aria-disabled');
    } finally {
      window.matchMedia = originalMatchMedia;
      Element.prototype.scrollIntoView = originalScroll;
    }
  });

  it('TS-29: sin desafío y anulado sin Play', async () => {
    server.use(handlers.today(bigONone));
    const a = view();
    expect(await h1('Big O')).toBeInTheDocument();
    expect(
      screen
        .getByText('Hoy no hay desafío de Big O. Es un día neutro: no suma ni corta tu racha.')
        .closest('[role="status"]'),
    ).not.toBeNull();
    expect(screen.queryByRole('button', { name: /Empezar/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cómo se juega' })).toBeNull();
    a.unmount();
    server.use(handlers.today(bigOVoided));
    view();
    expect((await screen.findAllByText(VOIDED)).length).toBeGreaterThan(0);
    expect(await screen.findByRole('alertdialog', { name: 'Desafío anulado' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Empezar/ })).toBeNull();
  });

  it('TS-30: partida completa y compartir solo con teclado', async () => {
    const calls = recordCalls();
    setShare(undefined);
    Reflect.deleteProperty(navigator, 'share');
    const { user } = await playing();
    server.use(movePost(boMove('o_n_log_n', 'go')));
    const write = vi.spyOn(navigator.clipboard, 'writeText');
    const tabTo = async (el: () => HTMLElement) => {
      for (let i = 0; i < 60 && document.activeElement !== el(); i++) await user.tab();
      expect(el()).toHaveFocus();
    };
    await tabTo(() => tab('JavaScript'));
    await user.keyboard('{ArrowRight}');
    await waitFor(() => expect(tab('Go')).toHaveAttribute('aria-selected', 'true'));
    expect(tab('Go')).toHaveFocus();
    await tabTo(() => radio('O(1)'));
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
    expect(radio('O(n log n)')).toHaveAttribute('aria-checked', 'true');
    expect(radio('O(n log n)')).toHaveFocus();
    await tabTo(() => confirmButton());
    await user.keyboard('{Enter}');
    const heading = await h1('Correcto: O(n log n)');
    expect(calls.find((c) => c.path === MOVE)?.body).toEqual(MOVE_GO_NLOGN);
    await waitFor(() => expect(heading).toHaveFocus());
    const button = within(screen.getByRole('banner')).getByRole('button', { name: 'Compartir' });
    await tabTo(() => button);
    await user.keyboard('{Enter}');
    await waitFor(() => expect(write).toHaveBeenCalledWith('🧮 Big O #128\n🟩 Go\nlocalhost:5173'));
  });
});

describe('inglés', () => {
  it('TS-31: contenido en inglés', async () => {
    const calls = recordCalls();
    server.use(
      http.post('/api/session', () =>
        HttpResponse.json({ locale: 'en', preferred_code_language: 'js', created: false }),
      ),
      http.get('/api/games/big-o/today', ({ request }) =>
        HttpResponse.json(
          new URL(request.url).searchParams.get('lang') === 'en' ? bigONotStarted : bigOWonJavaEn,
        ),
      ),
    );
    const a = view();
    expect(await h1('Big O')).toBeInTheDocument();
    expect(screen.getByText('Challenge #128 · ~1 min · one game per day')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'how to play' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start/ })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
    a.unmount();
    server.use(http.get('/api/games/big-o/today', () => HttpResponse.json(bigOWonJavaEn)));
    view();
    expect(await h1('Correct: O(n log n)')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Step by step' })).toBeInTheDocument();
    const main = within(screen.getByRole('main'));
    expect(main.getByText('// in numbers, with n = 1024')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent(/f\(1024\) counts 10,240 operations/);
    expect(screen.getByRole('main')).toHaveTextContent(/with O\(n²\) it would be 1,048,576/);
    expect(main.getByText('An inner loop that doubles its variable is not n.')).toBeInTheDocument();
    const write = vi.spyOn(navigator.clipboard, 'writeText');
    const user = userEvent.setup();
    await user.click(
      within(screen.getByRole('banner')).getByRole('button', { name: /Share|Compartir/ }),
    );
    await waitFor(() => expect(write).toHaveBeenCalledWith(SHARE_WON_JAVA));
    expect(calls.length).toBeGreaterThan(0);
  });
});

describe('axe', () => {
  type Arrange = (user: User) => Promise<void> | void;
  const states: [string, () => void, Arrange?][] = [
    ['instrucciones', () => server.use(handlers.today(bigONotStarted))],
    ['partida sin selección', () => server.use(handlers.today(bigOInProgress)), () => undefined],
    [
      'partida con O(n²) elegida',
      () => server.use(handlers.today(bigOInProgress)),
      async (user) => {
        await user.click(radio('O(n²)'));
      },
    ],
    [
      'partida tras 422 invalid_move',
      () => server.use(handlers.today(bigOInProgress), movePostError('invalid_move', 'x', 422)),
      async (user) => {
        await user.click(radio('O(n)'));
        await user.click(confirmButton());
        await screen.findAllByText(/no pudimos registrar tu respuesta/);
      },
    ],
    [
      'partida anulada',
      () => server.use(handlers.today(bigOInProgress), movePostError('challenge_voided', 'x', 409)),
      async (user) => {
        await user.click(radio('O(n)'));
        await user.click(confirmButton());
        await screen.findByText(VOIDED);
      },
    ],
    ['resultado ganado', () => server.use(handlers.today(bigOWonJava))],
    ['resultado perdido', () => server.use(handlers.today(bigOLostGo))],
    ['resultado sin ejemplo', () => server.use(handlers.today(bigOPlain))],
    ['sin desafío', () => server.use(handlers.today(bigONone))],
    [
      'error de carga',
      () =>
        server.use(
          http.get('/api/games/big-o/today', () => errorResponse('internal_error', 'x', 500)),
        ),
    ],
  ];

  it.each(states)('TS-32: %s sin violaciones', async (name, arrange, after) => {
    arrange();
    const user = userEvent.setup();
    const { container } = view();
    await screen.findByRole('banner');
    await waitFor(() => expect(screen.queryByText(/^\$ cargando/)).toBeNull());
    await screen.findByRole('main');
    if (after) {
      await h1(QUESTION_ES);
      await after(user);
    }
    await settle(100);
    // En jsdom no hay CSS: `color-contrast` no se evalúa y lo garantizan los tokens del DS.
    expect(await axe(container), name).toHaveNoViolations();
  });

  it.each([
    ['partida', bigOInProgress],
    ['resultado', bigOWonJavaEn],
  ])('TS-33: %s en inglés sin violaciones', async (_name, data) => {
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
    await settle(100);
    expect(await axe(container)).toHaveNoViolations();
  });
});
