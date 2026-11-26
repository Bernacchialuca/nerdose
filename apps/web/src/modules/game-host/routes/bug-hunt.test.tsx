import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import {
  BH_SPEC,
  MOVE_GO_L4,
  MOVE_JAVA_L4,
  bhMove,
  bugHuntInProgress,
  bugHuntInProgressEn,
  bugHuntLostGo,
  bugHuntNextDay,
  bugHuntNone,
  bugHuntNotStarted,
  bugHuntNotStartedEn,
  bugHuntStarted,
  bugHuntVoided,
  bugHuntWonJava,
  bugHuntWonJavaEn,
  todayWithBugHunt,
} from '@/test/fixtures/bug-hunt-today';
import {
  countOf,
  errorResponse,
  h1,
  recordCalls,
  setShare,
  settle,
} from '@/test/game-route-helpers';
import { bugHuntHandlers as handlers, server } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

const TODAY = '/api/games/bug-hunt/today?lang=es';
const START = '/api/games/bug-hunt/today/start';
const MOVE = '/api/games/bug-hunt/today/move?lang=es';
const SHARE_WON_JAVA_ES = '🐛 Bug Hunt #128 · Java\n🟩 bug encontrado\nlocalhost:5173';
const SHARE_LOST_GO_ES = '🐛 Bug Hunt #128 · Go\n🟥 se me escapó\nlocalhost:5173';
const SHARE_WON_JAVA_EN = '🐛 Bug Hunt #128 · Java\n🟩 bug found\nlocalhost:5173';
const QUESTION_ES = '¿En qué línea está el bug?';
const QUESTION_EN = 'Which line has the bug?';
const VOIDED = 'Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.';
const COOKIES =
  'Para jugar necesitamos una única cookie funcional, sin datos personales. Activá las cookies y tocá «Reintentar».';
const HINT_IDLE = '> tocá la línea donde creés que está el bug';

type User = ReturnType<typeof userEvent.setup>;

const view = (route = '/bug-hunt') => renderWithProviders({ route });
const lang = (name: 'ES' | 'EN') =>
  within(screen.getByRole('group', { name: 'Idioma' })).getByRole('button', { name });
const movePost = (body: unknown, init?: ResponseInit) =>
  http.post('/api/games/bug-hunt/today/move', () => HttpResponse.json(body as object, init));
const movePostError = (code: string, message: string, status: number, headers?: HeadersInit) =>
  http.post('/api/games/bug-hunt/today/move', () => errorResponse(code, message, status, headers));
const tab = (name: string) => screen.getByRole('tab', { name });
const panel = (language = 'JavaScript') =>
  screen.getByRole('tabpanel', { name: `Código de maxIndex en ${language}` });
const group = (language = 'JavaScript', name?: string) =>
  screen.getByRole('radiogroup', { name: name ?? `Líneas de maxIndex en ${language}` });
const line = (n: number, language = 'JavaScript', prefix = 'Línea', groupName?: string) =>
  within(group(language, groupName)).getByRole('radio', {
    name: new RegExp(`^${prefix} ${n}:`),
  });
const confirmButton = () =>
  screen.getByRole('button', { name: /Confirmar línea|Elegí una línea|Confirmando/ });
const hint = () => screen.getAllByText(/^> /)[0] as HTMLElement;
const polite = () =>
  Array.from(document.querySelectorAll('main [aria-live="polite"]')).find((n) =>
    (n.textContent ?? '').includes('> '),
  ) as HTMLElement;

async function playing(data: unknown = bugHuntInProgress) {
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

describe('abrir /bug-hunt', () => {
  it('TS-5: sin Play muestra instrucciones con el header de juego', async () => {
    const calls = recordCalls();
    server.use(handlers.today(bugHuntNotStarted));
    view();
    expect(await h1('Bug Hunt')).toBeInTheDocument();
    expect(screen.getByText('Desafío #128 · ~2 min · una partida por día')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /cómo se juega/ })).toBeInTheDocument();
    for (const k of ['1 · Leé qué debería hacer', '2 · Buscá la línea', '3 · Elegí y confirmá']) {
      expect(screen.getByText(k)).toBeInTheDocument();
    }
    expect(
      screen.getByText(
        'La partida no cuenta hasta que confirmes. Si salís antes, al volver no vas a tener ninguna línea marcada, pero conservás tu intento.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Empezar/ })).toBeInTheDocument();
    const header = screen.getByRole('banner');
    const nav = within(header).getByRole('navigation', { name: 'Ruta' });
    expect(within(nav).getByText('bug-hunt')).toHaveAttribute('aria-current', 'page');
    expect(within(header).getByText('desafío del 03/11')).toBeInTheDocument();
    expect(
      within(header).getByRole('button', { name: 'Compartir resultado (disponible al terminar)' }),
    ).toHaveAttribute('aria-disabled', 'true');
    expect(document.title).toBe('Bug Hunt · nerdose');
    expect(countOf(calls, 'GET', TODAY)).toBe(1);
  });

  it('TS-6: muestra el loader con el header de juego mientras carga', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    server.use(
      http.get('/api/games/bug-hunt/today', async () => {
        await gate;
        return HttpResponse.json(bugHuntNotStarted);
      }),
    );
    view();
    expect(await screen.findByRole('status')).toHaveTextContent('$ cargando bug-hunt…');
    expect(screen.getByRole('banner')).toBeInTheDocument();
    release();
    expect(await h1('Bug Hunt')).toBeInTheDocument();
  });

  it('TS-7: Empezar abre la partida en JS con especificación, tests y aviso del oculto', async () => {
    const calls = recordCalls();
    server.use(handlers.today(bugHuntNotStarted), handlers.start(bugHuntStarted));
    const user = userEvent.setup();
    view();
    await user.click(await screen.findByRole('button', { name: /Empezar/ }));
    await h1(QUESTION_ES);
    const starts = calls.filter((c) => c.method === 'POST' && c.path === START);
    expect(starts).toHaveLength(1);
    expect(starts[0]?.body).toEqual({ challenge_number: 128 });
    expect(
      screen.getByText('un solo intento · la firma y las líneas con solo llaves no cuentan'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'qué debería hacer' }),
    ).toBeInTheDocument();
    expect(screen.getByText(BH_SPEC.es)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /tests/ })).toBeInTheDocument();
    for (const t of [
      'maxIndex de [] da 0, pasa',
      'maxIndex de [4] da 0, pasa',
      'maxIndex de [3, 7, 2] da 1, pasa',
      '1 test oculto falla',
    ]) {
      expect(screen.getByText(t)).toBeInTheDocument();
    }
    const tablist = screen.getByRole('tablist', { name: 'Lenguaje del código' });
    expect(
      within(tablist)
        .getAllByRole('tab')
        .map((t) => t.textContent),
    ).toEqual(['JavaScript', 'Go', 'Java']);
    expect(tab('JavaScript')).toHaveAttribute('aria-selected', 'true');
    expect(panel()).toHaveTextContent('function maxIndex(nums) {');
    const radios = within(group()).getAllByRole('radio');
    expect(radios).toHaveLength(5);
    ['2', '3', '4', '5', '8'].forEach((n, i) => {
      expect(radios[i]?.getAttribute('aria-label') ?? radios[i]?.textContent).toMatch(
        new RegExp(`^Línea ${n}:`),
      );
      expect(radios[i]).toHaveAttribute('aria-checked', 'false');
    });
    expect(confirmButton()).toHaveAccessibleName('Elegí una línea');
    expect(confirmButton()).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText(HINT_IDLE)).toBeInTheDocument();
    const main = screen.getByRole('main');
    for (const hidden of [
      'acá estaba el bug',
      'el test que falla',
      'Por qué falla',
      'tipo:',
      '[5, 1, 5]',
    ]) {
      expect(main).not.toHaveTextContent(hidden);
    }
  });

  it('TS-8: retoma en el lenguaje preferido de la sesión', async () => {
    server.use(
      http.post('/api/session', () =>
        HttpResponse.json({ locale: 'es', preferred_code_language: 'go', created: false }),
      ),
      handlers.today(bugHuntInProgress),
    );
    view();
    await h1(QUESTION_ES);
    await waitFor(() => expect(tab('Go')).toHaveAttribute('aria-selected', 'true'));
    expect(panel('Go')).toHaveTextContent('func maxIndex(nums []int) int {');
    expect(within(group('Go')).getAllByRole('radio')).toHaveLength(5);
  });
});

describe('partida', () => {
  it('TS-9: firma y llaves no son seleccionables', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    const before = calls.length;
    await user.click(within(panel()).getByText('function maxIndex(nums) {'));
    for (const r of within(group()).getAllByRole('radio')) {
      expect(r).toHaveAttribute('aria-checked', 'false');
    }
    expect(confirmButton()).toHaveAccessibleName('Elegí una línea');
    expect(confirmButton()).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText(HINT_IDLE)).toBeInTheDocument();
    for (const n of [1, 6, 7, 9]) {
      expect(within(group()).queryByRole('radio', { name: new RegExp(`^Línea ${n}:`) })).toBeNull();
    }
    expect(calls.length).toBe(before);
  });

  it('TS-10: elegir y cambiar de lenguaje no hace requests y conserva la línea', async () => {
    const calls = recordCalls();
    const { user, queryClient } = await playing();
    await user.click(line(4));
    expect(line(4)).toHaveAttribute('aria-checked', 'true');
    expect(hint()).toHaveTextContent('> elegiste la línea 4. Podés cambiarla hasta confirmar.');
    expect(confirmButton()).toHaveAccessibleName('Confirmar línea 4');
    expect(confirmButton()).not.toHaveAttribute('aria-disabled', 'true');
    const before = calls.length;
    await user.click(tab('Go'));
    await settle();
    expect(calls.length).toBe(before);
    expect(line(4, 'Go')).toHaveAttribute('aria-checked', 'true');
    expect(line(4, 'Go')).toHaveAccessibleName('Línea 4: if nums[i] >= nums[best] {');
    expect(hint()).toHaveTextContent('> elegiste la línea 4. Podés cambiarla hasta confirmar.');
    expect(confirmButton()).toHaveAccessibleName('Confirmar línea 4');
    expect(
      (queryClient.getQueryData(['session']) as { preferred_code_language: string })
        .preferred_code_language,
    ).toBe('js');
  });

  it('TS-11: ES a EN a mitad de partida conserva línea y pestaña', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    server.use(
      http.get('/api/games/bug-hunt/today', ({ request }) =>
        HttpResponse.json(
          new URL(request.url).searchParams.get('lang') === 'en'
            ? bugHuntInProgressEn
            : bugHuntInProgress,
        ),
      ),
    );
    await user.click(line(5));
    await user.click(tab('Java'));
    await user.click(lang('EN'));
    await h1(QUESTION_EN);
    expect(screen.getByText(BH_SPEC.en)).toBeInTheDocument();
    expect(
      within(screen.getByRole('radiogroup', { name: 'Lines of maxIndex in Java' })).getByRole(
        'radio',
        { name: /^Line 5:/ },
      ),
    ).toHaveAttribute('aria-checked', 'true');
    expect(tab('Java')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: 'Confirm line 5' })).toBeInTheDocument();
    const patches = calls.filter((c) => c.method === 'PATCH');
    expect(patches).toHaveLength(1);
    expect(patches[0]?.path).toBe('/api/me/preferences');
    expect(patches[0]?.body).toEqual({ locale: 'en' });
    expect(calls.filter((c) => c.path.includes('/move'))).toHaveLength(0);
  });
});

describe('confirmación y resultado', () => {
  it('TS-12: confirmar en Java lleva al resultado completo y actualiza caches', async () => {
    const calls = recordCalls();
    const { user, queryClient } = await playing();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    server.use(
      http.post('/api/games/bug-hunt/today/move', async () => {
        await gate;
        return HttpResponse.json(bhMove(4, 'java'));
      }),
      http.get('/api/today', () => HttpResponse.json(todayWithBugHunt('won', '✓ L4'))),
    );
    await user.click(tab('Java'));
    await user.click(line(4, 'Java'));
    await user.click(confirmButton());
    const pendingButton = await screen.findByRole('button', { name: 'Confirmando…' });
    expect(pendingButton).toHaveAttribute('aria-disabled', 'true');
    for (const name of ['JavaScript', 'Go', 'Java']) {
      expect(tab(name)).toHaveAttribute('aria-disabled', 'true');
    }
    expect(screen.queryByRole('dialog')).toBeNull();
    const todayBefore = countOf(calls, 'GET', '/api/today?lang=es');
    release();
    const heading = await h1('Bug encontrado en la línea 4');
    await waitFor(() => expect(heading).toHaveFocus());
    expect(countOf(calls, 'POST', MOVE)).toBe(1);
    expect(calls.find((c) => c.path === MOVE)?.body).toEqual(MOVE_JAVA_L4);
    expect(tab('Java')).toHaveAttribute('aria-selected', 'true');
    expect(panel('Java')).toHaveTextContent('if (nums[i] >= nums[best]) {');
    expect(panel('Java')).toHaveTextContent('acá estaba el bug');
    expect(panel('Java')).not.toHaveTextContent('tu elección');
    const why = screen.getByRole('complementary', { name: 'Por qué falla' });
    expect(
      within(why).getByRole('heading', { level: 2, name: /el test que falla/ }),
    ).toBeInTheDocument();
    expect(why).toHaveTextContent('maxIndex([5, 1, 5])');
    expect(why).toHaveTextContent('esperado 0 · obtenido 2');
    const fix = screen.getByRole('region', { name: 'Fix de la línea 4 en Java' });
    expect(fix).toHaveTextContent('if (nums[i] >= nums[best]) {');
    expect(fix).toHaveTextContent('if (nums[i] > nums[best]) {');
    expect(
      within(why).getByRole('heading', { level: 2, name: 'Por qué falla' }),
    ).toBeInTheDocument();
    expect(within(why).getAllByRole('listitem')).toHaveLength(3);
    expect(why).toHaveTextContent('La condición que decide si best cambia usa >= en lugar de >');
    expect(why).not.toHaveTextContent('tipo:');
    expect(
      within(screen.getByRole('banner')).getByRole('button', { name: 'Compartir' }),
    ).not.toHaveAttribute('aria-disabled');
    expect(screen.getByTestId('confetti')).toBeInTheDocument();
    const session = queryClient.getQueryData(['session']) as { preferred_code_language: string };
    expect(session.preferred_code_language).toBe('java');
    const cached = queryClient.getQueryData(['game-today', 'bug-hunt', 'es']) as {
      play: { code_language: string };
    };
    expect(cached.play.code_language).toBe('java');
    await waitFor(() =>
      expect(countOf(calls, 'GET', '/api/today?lang=es')).toBeGreaterThan(todayBefore),
    );
  });

  it('TS-13: el fix sigue a la pestaña sin requests', async () => {
    const calls = recordCalls();
    server.use(handlers.today(bugHuntWonJava));
    const user = userEvent.setup();
    const { queryClient } = view();
    await h1('Bug encontrado en la línea 4');
    const before = calls.length;
    await user.click(tab('Go'));
    expect(screen.getByRole('region', { name: 'Fix de la línea 4 en Go' })).toHaveTextContent(
      'if nums[i] > nums[best] {',
    );
    expect(panel('Go')).toHaveTextContent('func maxIndex(nums []int) int {');
    expect(panel('Go')).toHaveTextContent('acá estaba el bug');
    expect(calls.length).toBe(before);
    expect(
      (queryClient.getQueryData(['session']) as { preferred_code_language: string })
        .preferred_code_language,
    ).toBe('js');
  });

  it('TS-14: doble clic en «Confirmar línea» envía una sola vez', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    server.use(movePost(bhMove(4, 'js')));
    await user.click(line(4));
    await user.dblClick(confirmButton());
    await h1('Bug encontrado en la línea 4');
    expect(countOf(calls, 'POST', MOVE)).toBe(1);
  });

  it('TS-15: resultado perdido (reabierto)', async () => {
    server.use(handlers.today(bugHuntLostGo));
    view();
    await h1('El bug estaba en la línea 4, no en la 5');
    expect(
      screen.getByText('Elegiste la línea 5 en Go. Desafío completado: tus rachas siguen en pie.'),
    ).toBeInTheDocument();
    expect(tab('Go')).toHaveAttribute('aria-selected', 'true');
    expect(panel('Go')).toHaveTextContent('🐛');
    expect(panel('Go')).toHaveTextContent('acá estaba el bug');
    expect(panel('Go')).toHaveTextContent('✗');
    expect(panel('Go')).toHaveTextContent('tu elección');
    expect(screen.queryByText(/tipo:/)).toBeNull();
    expect(screen.queryByTestId('confetti')).toBeNull();
  });
});

describe('retomar', () => {
  it('TS-16: salir y volver sin confirmar: sin selección y con el intento', async () => {
    const calls = recordCalls();
    server.use(
      handlers.today(bugHuntInProgress),
      http.get('/api/today', () => HttpResponse.json(todayWithBugHunt('in_progress', null))),
    );
    const user = userEvent.setup();
    view();
    await h1(QUESTION_ES);
    await user.click(line(4));
    await user.click(screen.getByRole('link', { name: 'nerdose' }));
    const card = (await screen.findByRole('heading', { name: 'Bug Hunt' })).closest(
      'article',
    ) as HTMLElement;
    await user.click(within(card).getByRole('link', { name: /Seguir jugando/ }));
    await h1(QUESTION_ES);
    for (const r of within(group()).getAllByRole('radio')) {
      expect(r).toHaveAttribute('aria-checked', 'false');
    }
    expect(screen.getByText(HINT_IDLE)).toBeInTheDocument();
    expect(tab('JavaScript')).toHaveAttribute('aria-selected', 'true');
    expect(confirmButton()).toHaveAccessibleName('Elegí una línea');
    expect(calls.filter((c) => c.path.includes('/move'))).toHaveLength(0);
  });
});

describe('compartir', () => {
  async function openResult(data: unknown) {
    server.use(handlers.today(data));
    const user = userEvent.setup();
    view();
    await screen.findByRole('heading', { level: 1 });
    const header = within(screen.getByRole('banner'));
    return { user, button: await header.findByRole('button', { name: /Compartir/ }) };
  }

  it('TS-17: share nativo en español sin la solución', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setShare(share);
    const { user, button } = await openResult(bugHuntWonJava);
    await user.click(button);
    await waitFor(() => expect(share).toHaveBeenCalledWith({ text: SHARE_WON_JAVA_ES }));
    expect(SHARE_WON_JAVA_ES).not.toMatch(/línea|comparación|maxIndex|L4/);
  });

  it('TS-18: share por portapapeles al perder', async () => {
    const { user, button } = await openResult(bugHuntLostGo);
    const write = vi.spyOn(navigator.clipboard, 'writeText');
    await user.click(button);
    await waitFor(() => expect(write).toHaveBeenCalledWith(SHARE_LOST_GO_ES));
    expect(await within(button).findByText('✓ Copiado')).toBeInTheDocument();
  });

  it('TS-19: el share sigue el idioma activo al momento de compartir', async () => {
    server.use(
      http.get('/api/games/bug-hunt/today', ({ request }) =>
        HttpResponse.json(
          new URL(request.url).searchParams.get('lang') === 'en'
            ? bugHuntWonJavaEn
            : bugHuntWonJava,
        ),
      ),
    );
    const user = userEvent.setup();
    view();
    await h1('Bug encontrado en la línea 4');
    const write = vi.spyOn(navigator.clipboard, 'writeText');
    const header = () => within(screen.getByRole('banner'));
    await user.click(await header().findByRole('button', { name: /Compartir/ }));
    await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
    await user.click(lang('EN'));
    await h1('Bug found on line 4');
    await user.click(
      await header().findByRole('button', { name: /Share|Compartir|Copied|Copiado/ }),
    );
    await waitFor(() => expect(write).toHaveBeenCalledTimes(2));
    expect(write.mock.calls[0]?.[0]).toBe(SHARE_WON_JAVA_ES);
    expect(write.mock.calls[1]?.[0]).toBe(SHARE_WON_JAVA_EN);
  });
});

describe('errores del ciclo común', () => {
  it('TS-20: 422 invalid_move no consume el intento y conserva la línea', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    server.use(movePostError('invalid_move', 'Jugada inválida.', 422));
    await user.click(line(4));
    await user.click(confirmButton());
    const text =
      '> no pudimos registrar esa línea. Elegí una y confirmá de nuevo: no perdiste tu intento.';
    await waitFor(() => expect(hint()).toHaveTextContent(text));
    expect(polite()).toHaveTextContent(text);
    expect(line(4)).toHaveAttribute('aria-checked', 'true');
    expect(group()).toBeInTheDocument();
    server.use(movePost(bhMove(4, 'js')));
    await user.click(confirmButton());
    await h1('Bug encontrado en la línea 4');
    expect(countOf(calls, 'POST', MOVE)).toBe(2);
  });

  it('TS-21: 429 al confirmar', async () => {
    const { user } = await playing();
    server.use(movePostError('rate_limited', 'Demasiadas jugadas.', 429, { 'Retry-After': '5' }));
    await user.click(line(4));
    await user.click(confirmButton());
    await waitFor(() =>
      expect(hint()).toHaveTextContent('> vas muy rápido. Esperá unos segundos y probá de nuevo.'),
    );
    expect(group()).toBeInTheDocument();
    expect(line(4)).toHaveAttribute('aria-checked', 'true');
  });

  it('TS-22: challenge_voided al confirmar bloquea la partida', async () => {
    const { user } = await playing();
    server.use(movePostError('challenge_voided', 'Este desafío fue anulado', 409));
    await user.click(line(4));
    await user.click(confirmButton());
    expect((await screen.findByText(VOIDED)).closest('[role="status"]')).not.toBeNull();
    expect(screen.getByRole('heading', { level: 1, name: QUESTION_ES })).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByRole('tabpanel')).toBeNull();
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(screen.queryByRole('button', { name: /Confirmar línea/ })).toBeNull();
    expect(screen.queryByText('qué debería hacer')).toBeNull();
    expect(screen.queryByText('1 test oculto falla')).toBeNull();
    expect(screen.getByRole('button', { name: /Reportar un problema/ })).toBeInTheDocument();
  });

  it('TS-23: game_finished lleva al resultado', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    server.use(movePostError('game_finished', 'La partida ya terminó', 409));
    server.use(handlers.today(bugHuntWonJava));
    await user.click(line(4));
    await user.click(confirmButton());
    expect(await h1('Bug encontrado en la línea 4')).toBeInTheDocument();
    expect(countOf(calls, 'GET', TODAY)).toBe(2);
  });

  it('TS-24: challenge_expired vuelve a instrucciones del día nuevo', async () => {
    const { user } = await playing();
    server.use(
      movePostError('challenge_expired', 'El desafío cambió. Cargando el de hoy…', 409),
      handlers.today(bugHuntNextDay),
      http.get('/api/today', () => HttpResponse.json(todayWithBugHunt(null, null))),
    );
    await user.click(line(4));
    await user.click(confirmButton());
    expect(
      await screen.findByText('Desafío #129 · ~2 min · una partida por día'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Bug Hunt' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Empezó el desafío #129. La partida de ayer quedó sin confirmar y no cuenta para tu racha.',
      ),
    ).toBeInTheDocument();
  });

  it('TS-25: no_session persistente conserva línea y lenguaje, y «Reintentar» reenvía', async () => {
    const calls = recordCalls();
    const { user } = await playing();
    let healthy = false;
    server.use(
      http.post('/api/games/bug-hunt/today/move', () =>
        healthy
          ? HttpResponse.json(bhMove(4, 'go'))
          : errorResponse('no_session', 'Activá las cookies para jugar', 401),
      ),
    );
    await user.click(tab('Go'));
    await user.click(line(4, 'Go'));
    await user.click(confirmButton());
    const banner = (await screen.findByText(COOKIES)).closest('[role="status"]') as HTMLElement;
    expect(line(4, 'Go')).toHaveAttribute('aria-checked', 'true');
    expect(tab('Go')).toHaveAttribute('aria-selected', 'true');
    healthy = true;
    await user.click(within(banner).getByRole('button', { name: /Reintentar/ }));
    await h1('Bug encontrado en la línea 4');
    expect(calls.filter((c) => c.path === MOVE).at(-1)?.body).toEqual(MOVE_GO_L4);
  });
});

describe('«Cómo se juega», sin desafío y teclado', () => {
  it('TS-26: «Cómo se juega» y Compartir según la fase', async () => {
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
      server.use(movePost(bhMove(4, 'js')));
      await user.click(line(4));
      await user.click(confirmButton());
      await h1('Bug encontrado en la línea 4');
      const after = within(screen.getByRole('banner'));
      expect(after.queryByRole('button', { name: 'Cómo se juega' })).toBeNull();
      expect(after.getByRole('button', { name: 'Compartir' })).not.toHaveAttribute('aria-disabled');
    } finally {
      window.matchMedia = originalMatchMedia;
      Element.prototype.scrollIntoView = originalScroll;
    }
  });

  it('TS-27: sin desafío y anulado sin Play', async () => {
    server.use(handlers.today(bugHuntNone));
    const a = view();
    expect(await h1('Bug Hunt')).toBeInTheDocument();
    expect(
      screen
        .getByText('Hoy no hay desafío de Bug Hunt. Es un día neutro: no suma ni corta tu racha.')
        .closest('[role="status"]'),
    ).not.toBeNull();
    expect(screen.queryByRole('button', { name: /Empezar/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cómo se juega' })).toBeNull();
    a.unmount();
    server.use(handlers.today(bugHuntVoided));
    view();
    expect(await screen.findByRole('alertdialog', { name: 'Desafío anulado' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Empezar/ })).toBeNull();
  });

  it('TS-28: partida completa y compartir solo con teclado', async () => {
    const calls = recordCalls();
    Reflect.deleteProperty(navigator, 'share');
    const { user } = await playing();
    server.use(movePost(bhMove(4, 'go')));
    const write = vi.spyOn(navigator.clipboard, 'writeText');
    const visited: Element[] = [];
    const tabTo = async (el: () => HTMLElement) => {
      for (let i = 0; i < 60 && document.activeElement !== el(); i++) {
        await user.tab();
        if (document.activeElement) visited.push(document.activeElement);
      }
      expect(el()).toHaveFocus();
    };
    await tabTo(() => tab('JavaScript'));
    await user.keyboard('{ArrowRight}');
    await waitFor(() => expect(tab('Go')).toHaveAttribute('aria-selected', 'true'));
    expect(tab('Go')).toHaveFocus();
    await user.tab();
    visited.push(document.activeElement as Element);
    expect(line(2, 'Go')).toHaveFocus();
    expect(line(2, 'Go')).toHaveAttribute('aria-checked', 'false');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    visited.push(document.activeElement as Element);
    expect(line(4, 'Go')).toHaveFocus();
    expect(line(4, 'Go')).toHaveAttribute('aria-checked', 'false');
    await user.keyboard(' ');
    expect(line(4, 'Go')).toHaveAttribute('aria-checked', 'true');
    expect(hint()).toHaveTextContent('> elegiste la línea 4.');
    await tabTo(() => confirmButton());
    // Nunca se enfocó una línea no elegible (un elemento del código sin rol de radio).
    for (const el of visited) {
      const inCode = el.closest('[role="tabpanel"]') !== null;
      if (inCode) expect(el.getAttribute('role')).toBe('radio');
    }
    await user.keyboard('{Enter}');
    const heading = await h1('Bug encontrado en la línea 4');
    expect(calls.find((c) => c.path === MOVE)?.body).toEqual(MOVE_GO_L4);
    await waitFor(() => expect(heading).toHaveFocus());
    const button = within(screen.getByRole('banner')).getByRole('button', { name: 'Compartir' });
    await tabTo(() => button);
    await user.keyboard('{Enter}');
    await waitFor(() =>
      expect(write).toHaveBeenCalledWith(
        '🐛 Bug Hunt #128 · Go\n🟩 bug encontrado\nlocalhost:5173',
      ),
    );
  });
});

describe('inglés', () => {
  it('TS-29: contenido en inglés', async () => {
    server.use(
      http.post('/api/session', () =>
        HttpResponse.json({ locale: 'en', preferred_code_language: 'js', created: false }),
      ),
      handlers.today(bugHuntNotStartedEn),
      handlers.start(bugHuntStarted),
    );
    const user = userEvent.setup();
    const a = view();
    expect(await h1('Bug Hunt')).toBeInTheDocument();
    expect(screen.getByText('Challenge #128 · ~2 min · one game per day')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /how to play/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start/ })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
    server.use(handlers.today(bugHuntInProgressEn));
    await user.click(screen.getByRole('button', { name: /Start/ }));
    await h1(QUESTION_EN);
    expect(
      screen.getByRole('heading', { level: 2, name: 'what it should do' }),
    ).toBeInTheDocument();
    expect(screen.getByText(BH_SPEC.en)).toBeInTheDocument();
    expect(screen.getByText('1 hidden test fails')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pick a line' })).toBeInTheDocument();
    expect(screen.getByText('> tap the line where you think the bug is')).toBeInTheDocument();
    a.unmount();
    server.use(handlers.today(bugHuntWonJavaEn));
    view();
    expect(await h1('Bug found on line 4')).toBeInTheDocument();
    expect(screen.getByRole('tabpanel', { name: 'Code of maxIndex in Java' })).toHaveTextContent(
      'the bug was here',
    );
    const why = screen.getByRole('complementary', { name: 'Why it fails' });
    expect(why).toHaveTextContent('expected 0 · got 2');
    expect(
      within(why).getByRole('heading', { level: 2, name: 'Why it fails' }),
    ).toBeInTheDocument();
    expect(why).toHaveTextContent('The condition that decides whether best changes uses >=');
    expect(why).toHaveTextContent('The visible tests never repeat the maximum');
    expect(why).not.toHaveTextContent('type:');
    const write = vi.spyOn(navigator.clipboard, 'writeText');
    await user.click(
      within(screen.getByRole('banner')).getByRole('button', { name: /Share|Compartir/ }),
    );
    await waitFor(() => expect(write).toHaveBeenCalledWith(SHARE_WON_JAVA_EN));
  });
});

describe('axe', () => {
  type Arrange = (user: User) => Promise<void> | void;
  const states: [string, () => void, Arrange?][] = [
    ['instrucciones', () => server.use(handlers.today(bugHuntNotStarted))],
    ['partida sin selección', () => server.use(handlers.today(bugHuntInProgress)), () => undefined],
    [
      'partida con la línea 4 elegida',
      () => server.use(handlers.today(bugHuntInProgress)),
      async (user) => {
        await user.click(line(4));
      },
    ],
    [
      'partida tras 422 invalid_move',
      () => server.use(handlers.today(bugHuntInProgress), movePostError('invalid_move', 'x', 422)),
      async (user) => {
        await user.click(line(4));
        await user.click(confirmButton());
        await screen.findAllByText(/no pudimos registrar esa línea/);
      },
    ],
    [
      'partida anulada',
      () =>
        server.use(handlers.today(bugHuntInProgress), movePostError('challenge_voided', 'x', 409)),
      async (user) => {
        await user.click(line(4));
        await user.click(confirmButton());
        await screen.findByText(VOIDED);
      },
    ],
    ['resultado ganado', () => server.use(handlers.today(bugHuntWonJava))],
    ['resultado perdido', () => server.use(handlers.today(bugHuntLostGo))],
    ['sin desafío', () => server.use(handlers.today(bugHuntNone))],
    [
      'error de carga',
      () =>
        server.use(
          http.get('/api/games/bug-hunt/today', () => errorResponse('internal_error', 'x', 500)),
        ),
    ],
  ];

  it.each(states)('TS-30: %s sin violaciones', async (name, arrange, after) => {
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
    ['partida', bugHuntInProgressEn],
    ['resultado', bugHuntWonJavaEn],
  ])('TS-31: %s en inglés sin violaciones', async (_name, data) => {
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
