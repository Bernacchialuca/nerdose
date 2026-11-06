import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { sessionFixture } from '@/test/fixtures/session';
import {
  todayBeforeLaunchFixture,
  todayFirstVisitFixture,
  todayFixture,
  todayNextDayFixture,
  todayNoChallengesFixture,
} from '@/test/fixtures/today';
import { server } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

const TITLE = 'Cinco juegos tech. Un desafío por día.';
const ERROR_TEXT = 'No pudimos cargar los juegos de hoy. Revisá tu conexión e intentá de nuevo.';
const NAMES = ['Devdle', 'Grep Grid', 'Tech Timeline', 'Big O', 'Bug Hunt'];

const useToday = (body: unknown) =>
  server.use(http.get('/api/today', () => HttpResponse.json(body as object)));
const useTodayError = (status = 500) =>
  server.use(
    http.get('/api/today', () =>
      HttpResponse.json(
        { error: { code: 'internal_error', message: 'Error interno' } },
        { status },
      ),
    ),
  );

async function renderHome() {
  const utils = renderWithProviders({ route: '/' });
  await screen.findByRole('heading', { level: 1, name: TITLE });
  return utils;
}
const gameHeadings = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Home', () => {
  it('TS-24/25: ningún desafío hoy y #número en el header', async () => {
    useToday(todayNoChallengesFixture);
    await renderHome();
    await screen.findByText('Hoy no hay desafíos publicados');
    expect(gameHeadings()).toEqual([...NAMES, 'Tu progreso']);
    const cards = screen.getAllByRole('article');
    expect(cards[0]).toHaveTextContent('Adiviná el término tech en 6 intentos');
    for (const card of cards.slice(0, 5)) {
      expect(card).toHaveTextContent('sin desafío hoy · no afecta tu racha');
    }
    expect(screen.getByText('Racha global: 0 días')).toBeInTheDocument();
    const disabled = screen.getAllByRole('button', { name: 'Sin desafío hoy' });
    expect(disabled).toHaveLength(5);
    for (const b of disabled) expect(b).toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryAllByRole('link', { name: /^Jugar/ })).toHaveLength(0);
    expect(
      screen.getByText(
        'Todavía no hay datos. Cuando haya desafíos, acá vas a ver tu racha y tu heatmap.',
      ),
    ).toBeInTheDocument();
    const banner = screen.getByRole('banner');
    expect(within(banner).getByText('#8')).toBeInTheDocument();
    expect(within(banner).getByText('Desafío del día')).toBeInTheDocument();
    expect(screen.getAllByText('#8')).toHaveLength(1);
  });

  it('TS-26: #número en desktop después de la navegación y antes del idioma', async () => {
    useToday(todayNoChallengesFixture);
    await renderHome();
    const banner = screen.getByRole('banner');
    const nav = within(banner).getByRole('navigation');
    const num = await within(banner).findByText('#8');
    const lang = within(banner).getByRole('group', { name: 'Idioma' });
    expect(nav.compareDocumentPosition(num) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(num.compareDocumentPosition(lang) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('TS-27: antes del lanzamiento', async () => {
    useToday(todayBeforeLaunchFixture);
    await renderHome();
    await screen.findByText('El primer desafío llega pronto');
    expect(document.body.textContent).not.toMatch(/#\d/);
    const soon = screen.getAllByRole('button', { name: 'Próximamente' });
    expect(soon).toHaveLength(5);
    for (const b of soon) expect(b).toHaveAttribute('aria-disabled', 'true');
    for (const card of screen.getAllByRole('article').slice(0, 5)) {
      expect(card).toHaveTextContent('próximamente');
      expect(card).not.toHaveTextContent('racha');
    }
    expect(screen.getByRole('button', { name: /Ver los juegos/ })).not.toHaveAttribute(
      'aria-disabled',
    );
    expect(
      screen.getByText(
        'Todavía no hay datos. Cuando empiecen los desafíos, acá vas a ver tu racha y tu heatmap.',
      ),
    ).toBeInTheDocument();
  });

  it('TS-28/29/45: estado mixto con sesión', async () => {
    await renderHome();
    await screen.findByText('Racha global: 5 días');
    expect(within(screen.getByRole('banner')).getByText(`${'#'}128`)).toBeInTheDocument();
    expect(screen.getByText('1 de 4 con desafío completados')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver resultado' })).toHaveAttribute('href', '/devdle');
    expect(screen.getAllByRole('link', { name: 'Seguir jugando' })[0]).toHaveAttribute(
      'href',
      '/grep-grid',
    );
    expect(screen.getByRole('link', { name: 'Jugar' })).toHaveAttribute('href', '/timeline');
    const [devdle, grep, , bigO, bug] = screen.getAllByRole('article') as [
      HTMLElement,
      HTMLElement,
      HTMLElement,
      HTMLElement,
      HTMLElement,
      ...HTMLElement[],
    ];
    expect(devdle).toHaveTextContent('✓ 4/6');
    expect(devdle).toHaveTextContent('racha 5');
    expect(grep).toHaveTextContent('en curso');
    expect(grep).toHaveTextContent('sin tiempo');
    expect(bigO).toHaveTextContent('sin desafío hoy · no afecta tu racha');
    expect(within(bigO).getByRole('button', { name: 'Sin desafío hoy' })).toBeInTheDocument();
    expect(bug).toHaveTextContent('anulado');
    expect(within(bug).queryByRole('link')).toBeNull();
    expect(within(bug).queryByRole('button')).toBeNull();
    expect(screen.getByText('Racha global 5 · Récord 12')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver estadísticas/ })).toHaveAttribute(
      'href',
      '/stats',
    );
    expect(screen.getByRole('button', { name: /Seguir jugando/ })).toBeInTheDocument();
    for (const name of NAMES) {
      const h = screen.getByRole('heading', { level: 2, name });
      expect(h.className).toMatch(/text-game-/);
    }
  });

  it('TS-29: plural de la racha', async () => {
    useToday({ ...todayFixture, global_streak: { current: 1, max: 1 } });
    await renderHome();
    expect(await screen.findByText('Racha global: 1 día')).toBeInTheDocument();
  });

  it('TS-33/34/35: errores al cargar', async () => {
    for (const setup of [
      () => useTodayError(500),
      () =>
        server.use(
          http.get('/api/today', () =>
            HttpResponse.json(
              { error: { code: 'rate_limited', message: 'Demasiados pedidos' } },
              { status: 429, headers: { 'Retry-After': '30' } },
            ),
          ),
        ),
      () => server.use(http.get('/api/today', () => HttpResponse.error())),
    ]) {
      setup();
      const { unmount } = await renderHome();
      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(ERROR_TEXT);
      expect(within(alert).getByRole('button', { name: /Reintentar/ })).toBeInTheDocument();
      expect(gameHeadings()).toEqual(NAMES);
      const cards = screen.getAllByRole('article');
      expect(cards).toHaveLength(5);
      expect(cards[0]).toHaveTextContent('~2 min');
      expect(
        within(screen.getByRole('main')).queryAllByRole('link', {
          name: /Jugar|Seguir|resultado|estad/,
        }),
      ).toHaveLength(0);
      expect(screen.queryByText(/Racha global|Próximo desafío en|Tu progreso/)).toBeNull();
      expect(screen.queryByText('Error interno')).toBeNull();
      expect(within(screen.getByRole('banner')).queryByText(/#\d/)).toBeNull();
      unmount();
    }
  });

  it('TS-36: Reintentar recupera', async () => {
    useTodayError();
    await renderHome();
    const alert = await screen.findByRole('alert');
    useToday(todayNoChallengesFixture);
    await userEvent.click(within(alert).getByRole('button', { name: /Reintentar/ }));
    await screen.findByText('Hoy no hay desafíos publicados');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('#8')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Sin desafío hoy' })).toHaveLength(5);
  });

  it('TS-37: carga', async () => {
    server.use(
      http.get('/api/today', async () => {
        await delay('infinite');
        return HttpResponse.json(todayFixture);
      }),
    );
    await renderHome();
    expect(await screen.findByRole('status')).toHaveTextContent('Cargando los desafíos de hoy…');
    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0);
    expect(screen.queryByText(/Racha global|Próximo desafío/)).toBeNull();
    expect(within(screen.getByRole('banner')).queryByText(/#\d/)).toBeNull();
  });

  it('TS-38: cookies bloqueadas', async () => {
    useToday({ ...todayFirstVisitFixture, has_session: false });
    await renderHome();
    await screen.findByText('Sin sesión: no podemos mostrar tu progreso');
    expect(screen.getByText('Activá las cookies para poder jugar')).toBeInTheDocument();
    expect(screen.getByText('Racha global: —')).toBeInTheDocument();
    for (const card of screen.getAllByRole('article').slice(0, 5)) {
      expect(card).toHaveTextContent('sin sesión');
    }
    const play = screen.getAllByRole('button', { name: 'Jugar' });
    expect(play).toHaveLength(5);
    for (const b of play) expect(b).toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryAllByRole('link', { name: 'Jugar' })).toHaveLength(0);
    const hero = screen.getByRole('button', { name: /Empezar a jugar/ });
    expect(hero).toHaveAttribute('aria-disabled', 'true');
    expect(hero).not.toHaveAttribute('disabled');
    expect(hero).toHaveClass(
      'bg-control',
      'text-text-disabled',
      'cursor-not-allowed',
      'border-border-strong',
      'min-h-12',
    );
    expect(hero.className).not.toContain('bg-accent');
    for (let i = 0; i < 30 && document.activeElement !== hero; i += 1) await userEvent.tab();
    expect(hero).toHaveFocus();
    await userEvent.click(hero);
    expect(document.getElementById('juegos')).not.toHaveFocus();
    expect(
      screen.getByText('Sin sesión no hay progreso para mostrar. Activá las cookies y recargá.'),
    ).toBeInTheDocument();
  });

  it('TS-39: sesión no disponible', async () => {
    server.use(
      http.post('/api/session', () =>
        HttpResponse.json({ error: { code: 'rate_limited', message: 'x' } }, { status: 429 }),
      ),
    );
    useToday(todayFirstVisitFixture);
    await renderHome();
    await screen.findByText('No pudimos iniciar tu sesión. Recargá en unos minutos para jugar.');
    expect(screen.queryByText('Activá las cookies para poder jugar')).toBeNull();
    expect(screen.getByText('Racha global: —')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Jugar' })).toHaveLength(5);
    for (const card of screen.getAllByRole('article').slice(0, 5)) {
      expect(card).not.toHaveTextContent(/racha|sin jugar/);
    }
    expect(
      screen.getByText('Sin sesión no hay progreso para mostrar. Recargá en unos minutos.'),
    ).toBeInTheDocument();
  });

  it('TS-40: CTA deshabilitado no navega y es alcanzable', async () => {
    useToday(todayNoChallengesFixture);
    await renderHome();
    await screen.findByText('Hoy no hay desafíos publicados');
    const button = screen.getAllByRole('button', { name: 'Sin desafío hoy' })[0] as HTMLElement;
    await userEvent.click(button);
    expect(screen.getByRole('heading', { level: 1, name: TITLE })).toBeInTheDocument();
    await userEvent.click(document.body);
    for (let i = 0; i < 12 && document.activeElement !== button; i += 1) await userEvent.tab();
    expect(button).toHaveFocus();
  });

  it('TS-41: el CTA del hero baja a las tarjetas', async () => {
    useToday(todayNoChallengesFixture);
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    await renderHome();
    await screen.findByText('Hoy no hay desafíos publicados');
    await userEvent.click(screen.getByRole('button', { name: /Ver los juegos/ }));
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('region', { name: 'Juegos de hoy' })).toHaveFocus();
  });

  it('TS-42: ¿Cómo funciona? lleva a Acerca de', async () => {
    await renderHome();
    const link = screen.getByRole('link', { name: /¿Cómo funciona\?/ });
    expect(link).toHaveAttribute('href', '/about');
    await userEvent.click(link);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Acerca de nerdose' }),
    ).toBeInTheDocument();
  });

  it('TS-43: inglés', async () => {
    server.use(
      http.post('/api/session', () => HttpResponse.json({ ...sessionFixture, locale: 'en' })),
    );
    useToday(todayNoChallengesFixture);
    renderWithProviders({ route: '/' });
    await screen.findByRole('heading', { level: 1, name: 'Five tech games. One challenge a day.' });
    expect(await screen.findByText('No challenges published today')).toBeInTheDocument();
    expect(screen.getByText('Global streak: 0 days')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'No challenge today' })).toHaveLength(5);
    expect(screen.getByText(/Next challenge in 00:00:/)).toBeInTheDocument();
  });

  it('TS-44/46: foco visible y sin anchos fijos', async () => {
    await renderHome();
    await screen.findByText('Racha global: 5 días');
    const main = screen.getByRole('main');
    for (const el of within(main)
      .getAllByRole('link')
      .concat(within(main).getAllByRole('button'))) {
      expect(el.className).toContain('focus-visible:outline-2');
      expect(el.className).toContain('focus-visible:outline-offset-2');
      expect(el.className).toContain('focus-visible:outline-accent');
      expect(el.className).toMatch(/\bmin-h-1[12]\b/);
      expect(el.className).not.toContain('outline-none');
    }
    for (const el of main.querySelectorAll('*')) {
      expect(el.getAttribute('class') ?? '').not.toMatch(
        /(^|\s)(w-\[|min-w-\[|w-(?:[4-9]\d|\d{3})\b|whitespace-nowrap)/,
      );
    }
  });

  it('TS-47/48: arreglo actual de la home', async () => {
    useToday(todayNoChallengesFixture);
    await renderHome();
    await screen.findByText('Hoy no hay desafíos publicados');
    const hero = screen.getByRole('heading', { level: 1 }).closest('section') as HTMLElement;
    expect(hero).toHaveClass('lg:grid-cols-12');
    expect(hero.children[0]).toHaveClass('lg:col-span-7');
    expect(hero.children[1]).toHaveClass('lg:col-span-5');
    const list = screen
      .getByRole('region', { name: 'Juegos de hoy' })
      .querySelector('ul') as HTMLElement;
    expect(list).toHaveClass('lg:grid-cols-3');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(6);
    expect(items[5]).toHaveTextContent('Tu progreso');
    const order = [
      screen.getByRole('heading', { level: 1 }),
      screen.getByRole('button', { name: /Ver los juegos/ }),
      screen.getByRole('link', { name: /¿Cómo funciona\?/ }),
      screen.getByText('Hoy no hay desafíos publicados'),
      screen.getByText(/Racha global/),
      screen.getByText(/Próximo desafío en/),
      screen.getByRole('heading', { level: 2, name: 'Devdle' }),
    ];
    for (let i = 1; i < order.length; i += 1) {
      expect(
        (order[i - 1] as Element).compareDocumentPosition(order[i] as Element) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it('TS-49: axe sin violaciones en desktop', async () => {
    useToday(todayNoChallengesFixture);
    const { container } = await renderHome();
    await screen.findByText('Hoy no hay desafíos publicados');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('TS-49: axe sin violaciones por estado', async () => {
    const cases: [string, () => void, string][] = [
      ['sin desafíos', () => useToday(todayNoChallengesFixture), 'Hoy no hay desafíos publicados'],
      ['mixto', () => useToday(todayFixture), 'Racha global: 5 días'],
      [
        'antes del lanzamiento',
        () => useToday(todayBeforeLaunchFixture),
        'El primer desafío llega pronto',
      ],
      ['error', () => useTodayError(), ERROR_TEXT],
      [
        'cookies',
        () => useToday({ ...todayFirstVisitFixture, has_session: false }),
        'Racha global: —',
      ],
    ];
    for (const [, setup, text] of cases) {
      setup();
      const { container, unmount } = await renderHome();
      await screen.findByText(text);
      expect(await axe(container)).toHaveNoViolations();
      unmount();
    }
    server.use(
      http.get('/api/today', async () => {
        await delay('infinite');
        return HttpResponse.json(todayFixture);
      }),
    );
    const { container } = await renderHome();
    await screen.findByRole('status');
    expect(await axe(container)).toHaveNoViolations();
  });

  describe('con timers falsos', () => {
    const fake = () => {
      vi.useFakeTimers({
        toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
      });
      vi.setSystemTime(new Date('2026-12-01T23:59:50Z'));
    };
    const advance = (ms: number) => act(async () => void (await vi.advanceTimersByTimeAsync(ms)));
    const settle = async (check: () => void) => {
      for (let i = 0; i < 100; i += 1) {
        try {
          check();
          return;
        } catch {
          await advance(0);
          await act(async () => {
            await new Promise<void>((resolve) => setImmediate(resolve));
          });
        }
      }
      check();
    };

    it('TS-30: cuenta regresiva visible', async () => {
      fake();
      renderWithProviders({ route: '/' });
      await advance(0);
      await settle(() =>
        expect(screen.getByText('Próximo desafío en 11:23:20')).toBeInTheDocument(),
      );
      const el = screen.getByText('Próximo desafío en 11:23:20');
      expect(el).not.toHaveAttribute('aria-live');
      expect(el).not.toHaveAttribute('role');
      await advance(1000);
      expect(screen.getByText('Próximo desafío en 11:23:19')).toBeInTheDocument();
    });

    function twoStage(second: () => Response) {
      let calls = 0;
      let boundary = Infinity;
      server.use(
        http.get('/api/today', () => {
          calls += 1;
          return calls > boundary ? second() : HttpResponse.json(todayNoChallengesFixture);
        }),
      );
      return {
        snapshot() {
          boundary = calls;
          return calls;
        },
        get calls() {
          return calls;
        },
      };
    }

    it('TS-31: cambio de día con jitter', async () => {
      fake();
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const probe = twoStage(() => HttpResponse.json(todayNextDayFixture));
      renderWithProviders({ route: '/' });
      await advance(0);
      await settle(() => expect(screen.getByText('#8')).toBeInTheDocument());
      const snap = probe.snapshot();
      await advance(10000);
      expect(screen.getByText('Próximo desafío en 00:00:00')).toBeInTheDocument();
      expect(screen.getByText('#8')).toBeInTheDocument();
      expect(probe.calls).toBe(snap);
      await advance(1499);
      expect(probe.calls).toBe(snap);
      await advance(1);
      await advance(0);
      expect(probe.calls).toBe(snap + 1);
      await advance(50);
      await settle(() => expect(screen.getByText('#9')).toBeInTheDocument());
      expect(screen.getByText('Próximo desafío en 24:00:00')).toBeInTheDocument();
    });

    it('TS-32: recarga fallida al cambiar el día', async () => {
      fake();
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const probe = twoStage(() =>
        HttpResponse.json({ error: { code: 'internal_error', message: 'x' } }, { status: 500 }),
      );
      renderWithProviders({ route: '/' });
      await advance(0);
      await settle(() => expect(screen.getByText('#8')).toBeInTheDocument());
      probe.snapshot();
      await advance(11500);
      await settle(() => expect(screen.getByRole('alert')).toHaveTextContent(ERROR_TEXT));
      expect(screen.getByRole('button', { name: /Reintentar/ })).toBeInTheDocument();
      expect(screen.queryByText('#8')).toBeNull();
      expect(screen.queryByText(/Próximo desafío en/)).toBeNull();
      expect(screen.getAllByRole('article')).toHaveLength(5);
    });
  });
});

describe('Home · CTA del Design System', () => {
  const classesOf = (el: HTMLElement) => el.className.split(/\s+/);

  it('TS-16 CTA del hero habilitado = primary lg', async () => {
    await renderHome();
    const hero = screen.getByRole('button', { name: /Seguir jugando/ });
    expect(hero).toHaveClass(
      'min-h-12',
      'px-5.5',
      'gap-2.5',
      'text-button-lg',
      'rounded-control',
      'bg-accent',
      'text-on-accent',
      'hover:bg-accent-hover',
    );
    expect(hero).not.toHaveAttribute('aria-disabled');
    await userEvent.click(hero);
    expect(document.getElementById('juegos')).toHaveFocus();
  });

  it('TS-18/23 los links de navegación usan linkClass y no se subrayan', async () => {
    await renderHome();
    const how = screen.getByRole('link', { name: /¿Cómo funciona\?/ });
    expect(how).toHaveAttribute('href', '/about');
    expect(how).toHaveClass('font-mono', 'no-underline', 'text-accent', 'hover:text-accent-hover');
    expect(classesOf(how)).not.toContain('underline');
    const stats = screen.getByRole('link', { name: /ver estadísticas/ });
    expect(stats).toHaveAttribute('href', '/stats');
    expect(stats).toHaveClass('font-mono', 'no-underline', 'mt-auto');
    expect(classesOf(stats)).not.toContain('underline');
  });

  it('TS-19/20/21 CTA de tarjeta según estado', async () => {
    await renderHome();
    const grep = within(screen.getByRole('article', { name: 'Grep Grid' })).getByRole('link', {
      name: 'Seguir jugando',
    });
    expect(grep).toHaveAttribute('href', '/grep-grid');
    expect(grep).toHaveClass(
      'bg-game-grep-grid',
      'text-game-grep-grid-on',
      'hover:bg-game-grep-grid-light',
      'w-full',
      'min-h-11',
      'rounded-control',
      'font-bold',
    );
    expect(classesOf(grep)).not.toContain('bg-accent');

    const timeline = within(screen.getByRole('article', { name: 'Tech Timeline' })).getByRole(
      'link',
      { name: /Jugar/ },
    );
    expect(timeline).toHaveAttribute('href', '/timeline');
    expect(timeline).toHaveClass(
      'bg-game-timeline',
      'text-game-timeline-on',
      'hover:bg-game-timeline-light',
      'w-full',
    );
    expect(timeline.querySelector('span[aria-hidden="true"]')).toHaveTextContent('→');

    const devdle = within(screen.getByRole('article', { name: 'Devdle' })).getByRole('link', {
      name: 'Ver resultado',
    });
    expect(devdle).toHaveAttribute('href', '/devdle');
    expect(devdle).toHaveClass('border-border-strong', 'text-text', 'font-medium', 'w-full');
    expect(classesOf(devdle)).not.toContain('text-accent');
    expect(classesOf(devdle)).not.toContain('border-border-interactive');
  });

  it('TS-22 CTA deshabilitados: neutros, focusables y de ancho completo', async () => {
    useToday(todayNoChallengesFixture);
    const { container } = await renderHome();
    await screen.findByText('Hoy no hay desafíos publicados');
    const disabled = screen.getAllByRole('button', { name: 'Sin desafío hoy' });
    expect(disabled).toHaveLength(5);
    for (const el of disabled) {
      expect(el).toHaveAttribute('aria-disabled', 'true');
      expect(el).not.toHaveAttribute('disabled');
      expect(el).toHaveClass(
        'bg-control',
        'text-text-disabled',
        'cursor-not-allowed',
        'w-full',
        'min-h-11',
        'rounded-control',
      );
      expect(el.className).not.toMatch(/bg-game-|bg-accent/);
    }
    await userEvent.tab();
    for (let i = 0; i < 20 && !disabled.some((el) => el === document.activeElement); i += 1) {
      await userEvent.tab();
    }
    expect(disabled).toContain(document.activeElement);
    expect(await axe(container)).toHaveNoViolations();
  });
});
