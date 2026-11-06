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
const gameHeadings = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
const gameCards = () => NAMES.map((name) => screen.getByRole('article', { name }));
const terminal = () => screen.getByRole('region', { name: 'Progreso de hoy' });

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Home', () => {
  it('TS-24/25: ningún desafío hoy y #número en el header', async () => {
    useToday(todayNoChallengesFixture);
    await renderHome();
    await screen.findByText('Hoy no hay desafíos publicados');
    expect(gameHeadings()).toEqual(NAMES);
    const cards = gameCards();
    expect(cards[0]).toHaveTextContent('Adiviná el término tech en 6 intentos');
    for (const card of cards) {
      expect(within(card).getByText('sin desafío hoy')).toHaveClass('bg-surface-inset');
      expect(card).toHaveTextContent('no afecta tu racha');
      expect(card.className).not.toMatch(/featured|shadow-next-/);
    }
    const term = within(terminal());
    expect(term.getAllByRole('listitem')).toHaveLength(5);
    expect(term.getAllByText('sin desafío')).toHaveLength(5);
    expect(term.getByText('0 días · récord 0')).toHaveClass('text-text-dim');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    const disabled = screen.getAllByRole('button', { name: 'Sin desafío hoy' });
    expect(disabled).toHaveLength(5);
    for (const b of disabled) expect(b).toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryAllByRole('link', { name: /^Jugar/ })).toHaveLength(0);
    expect(
      screen.getByText('Todavía no hay datos. Cuando haya desafíos, acá vas a ver tu racha.'),
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
    for (const card of gameCards()) {
      expect(card).toHaveTextContent('próximamente');
      expect(card).not.toHaveTextContent('racha');
    }
    expect(within(terminal()).getAllByText('próximamente')).toHaveLength(5);
    expect(screen.getByRole('button', { name: /Ver los juegos/ })).not.toHaveAttribute(
      'aria-disabled',
    );
    expect(
      screen.getByText(
        'Todavía no hay datos. Cuando empiecen los desafíos, acá vas a ver tu racha.',
      ),
    ).toBeInTheDocument();
  });

  it('TS-28/29/45: estado mixto con sesión', async () => {
    await renderHome();
    const term = within(await screen.findByRole('region', { name: 'Progreso de hoy' }));
    expect(term.getByText('5 días · récord 12')).toHaveClass('text-streak');
    expect(within(screen.getByRole('banner')).getByText(`${'#'}128`)).toBeInTheDocument();
    expect(screen.getByText('1 de 4 con desafío completados')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver resultado' })).toHaveAttribute('href', '/devdle');
    expect(screen.getAllByRole('link', { name: 'Seguir jugando' })[0]).toHaveAttribute(
      'href',
      '/grep-grid',
    );
    expect(screen.getByRole('link', { name: 'Jugar' })).toHaveAttribute('href', '/timeline');
    const [devdle, grep, , bigO, bug] = gameCards() as [
      HTMLElement,
      HTMLElement,
      HTMLElement,
      HTMLElement,
      HTMLElement,
    ];
    expect(devdle).toHaveTextContent('✓ 4/6');
    expect(devdle).toHaveTextContent('racha 5');
    expect(grep).toHaveTextContent('en curso');
    expect(grep).toHaveTextContent('sin tiempo');
    expect(bigO).toHaveTextContent('sin desafío hoy');
    expect(bigO).toHaveTextContent('no afecta tu racha');
    expect(within(bigO).getByRole('button', { name: 'Sin desafío hoy' })).toBeInTheDocument();
    expect(bug).toHaveTextContent('anulado');
    expect(within(bug).queryByRole('link')).toBeNull();
    expect(within(bug).queryByRole('button')).toBeNull();
    const progress = within(screen.getByRole('region', { name: 'Tu progreso' }));
    expect(progress.getByText('5')).toHaveClass('text-display-streak-compact', 'text-streak');
    expect(progress.getByText('12')).toBeInTheDocument();
    expect(progress.getByText('récord de racha')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver estadísticas/ })).toHaveAttribute(
      'href',
      '/stats',
    );
    expect(screen.getByRole('button', { name: /Seguir jugando/ })).toBeInTheDocument();
    for (const name of NAMES) {
      const h = screen.getByRole('heading', { level: 3, name });
      expect(h.className).toMatch(/text-game-/);
    }
  });

  it('TS-29: plural de la racha', async () => {
    useToday({ ...todayFixture, global_streak: { current: 1, max: 1 } });
    await renderHome();
    expect(
      await within(await screen.findByRole('region', { name: 'Progreso de hoy' })).findByText(
        '1 día · récord 1',
      ),
    ).toBeInTheDocument();
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
      const cards = gameCards();
      expect(cards[0]).toHaveTextContent('~2 min');
      expect(screen.getByText('$ git checkout -b')).toBeInTheDocument();
      expect(screen.queryByRole('progressbar')).toBeNull();
      expect(screen.queryByRole('region', { name: 'Progreso de hoy' })).toBeNull();
      expect(screen.queryByRole('region', { name: 'Tu progreso' })).toBeNull();
      expect(
        within(screen.getByRole('main')).queryAllByRole('link', {
          name: /Jugar|Seguir|resultado|estad/,
        }),
      ).toHaveLength(0);
      expect(screen.queryByText(/próximo desafío en|Tu progreso/)).toBeNull();
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
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0);
    expect(screen.queryByRole('region', { name: 'Progreso de hoy' })).toBeNull();
    expect(screen.queryByText('Tu progreso')).toBeNull();
    expect(screen.queryByText(/\$ nerdose --today/)).toBeNull();
    expect(screen.queryByText('$ git checkout -b')).toBeNull();
    expect(within(screen.getByRole('banner')).queryByText(/#\d/)).toBeNull();
  });

  it('TS-38: cookies bloqueadas', async () => {
    useToday({ ...todayFirstVisitFixture, has_session: false });
    await renderHome();
    await screen.findByText('Sin sesión: no podemos mostrar tu progreso');
    expect(screen.getByText('Activá las cookies para poder jugar')).toBeInTheDocument();
    expect(within(terminal()).getByText('— sin datos')).toBeInTheDocument();
    expect(within(terminal()).getAllByText('sin sesión')).toHaveLength(5);
    expect(
      within(screen.getByRole('region', { name: 'Tu progreso' })).getAllByText('—'),
    ).toHaveLength(2);
    for (const card of gameCards()) {
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
    expect(within(terminal()).getByText('— sin datos')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Jugar' })).toHaveLength(5);
    for (const card of gameCards()) {
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
    expect(screen.getByRole('region', { name: 'Los desafíos de hoy' })).toHaveFocus();
  });

  it('TS-17: ¿Cómo funciona? baja a #como y enfoca su título', async () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    await renderHome();
    await userEvent.click(screen.getByRole('button', { name: '¿Cómo funciona?' }));
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(scroll).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(scroll.mock.contexts[0]).toBe(document.getElementById('como'));
    const title = screen.getByRole('heading', { level: 2, name: 'Cómo funciona' });
    expect(title).toHaveAttribute('id', 'como-title');
    expect(title).toHaveFocus();
    expect(screen.queryByRole('link', { name: /¿Cómo funciona\?/ })).toBeNull();
  });

  it('TS-18: ¿Cómo funciona? con teclado, reduced motion y en carga', async () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    window.matchMedia = ((query: string) =>
      ({
        matches: query === '(prefers-reduced-motion: reduce)',
      }) as MediaQueryList) as typeof window.matchMedia;
    server.use(
      http.get('/api/today', async () => {
        await delay('infinite');
        return HttpResponse.json(todayFixture);
      }),
    );
    await renderHome();
    const button = screen.getByRole('button', { name: '¿Cómo funciona?' });
    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(scroll).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
    expect(document.getElementById('como-title')).toHaveFocus();
  });

  it('TS-43: inglés', async () => {
    server.use(
      http.post('/api/session', () => HttpResponse.json({ ...sessionFixture, locale: 'en' })),
    );
    useToday(todayNoChallengesFixture);
    renderWithProviders({ route: '/' });
    await screen.findByRole('heading', { level: 1, name: 'Five tech games. One challenge a day.' });
    expect(await screen.findByText('No challenges published today')).toBeInTheDocument();
    const term = within(screen.getByRole('region', { name: "Today's progress" }));
    expect(term.getByText('~/today — progress.log')).toBeInTheDocument();
    expect(term.getAllByText('no challenge')).toHaveLength(5);
    expect(term.getByText('0 days · best 0')).toBeInTheDocument();
    expect(term.getByText(/next challenge in/)).toBeInTheDocument();
    expect(term.getByText(/00:00:/)).toBeInTheDocument();
    expect(screen.getByText(/\/\/ Tuesday Dec 1/)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: "Today's challenges" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('no challenge today')).toHaveLength(5);
    expect(screen.getAllByText("doesn't affect your streak")).toHaveLength(5);
    expect(screen.getAllByRole('button', { name: 'No challenge today' })).toHaveLength(5);
    expect(screen.getByRole('heading', { level: 2, name: 'Your progress' })).toBeInTheDocument();
    expect(screen.getByText('best streak')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'How it works' })).toBeInTheDocument();
    expect(screen.getByText('01 · every day')).toBeInTheDocument();
    expect(screen.getByText('$ git checkout -b')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'How does it work?' })).toBeInTheDocument();
  });

  it('TS-44/46: foco visible y sin anchos fijos', async () => {
    await renderHome();
    await screen.findByRole('region', { name: 'Progreso de hoy' });
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
      const cls = el.getAttribute('class') ?? '';
      expect(cls).not.toMatch(/(^|\s)(w-\[|min-w-\[|w-(?:[4-9]\d|\d{3})\b)/);
      if (/(^|\s)whitespace-nowrap/.test(cls)) expect(cls).toMatch(/rounded-full/);
    }
  });

  it('TS-35/36/37: arreglo de la home sin media queries', async () => {
    await renderHome();
    const term = await screen.findByRole('region', { name: 'Progreso de hoy' });
    const h1 = screen.getByRole('heading', { level: 1 });
    const col = h1.parentElement as HTMLElement;
    expect(col).toHaveClass('grow', 'basis-130', 'min-w-0', 'flex', 'flex-col', 'gap-5.5');
    expect(term).toHaveClass('grow', 'basis-105', 'min-w-0');
    expect(col.parentElement).toHaveClass('flex', 'flex-wrap', 'items-center', 'gap-12');
    expect(screen.getByRole('button', { name: '¿Cómo funciona?' }).parentElement).toHaveClass(
      'flex',
      'flex-wrap',
      'gap-3',
    );
    expect(screen.getByRole('main').firstElementChild).toHaveClass('flex', 'flex-col', 'gap-18');

    const panel = screen.getByRole('region', { name: 'Tu progreso' });
    const inner = panel.firstElementChild as HTMLElement;
    expect(inner.children[0]).toHaveClass('flex', 'flex-wrap', 'items-start', 'justify-between');
    const body = inner.children[1] as HTMLElement;
    expect(body).toHaveClass('flex', 'flex-wrap', 'items-end', 'gap-5');
    expect(body.children[0]).toHaveClass('grow-2', 'basis-140', 'min-w-0');
    expect(body.children[1]).toHaveClass('grow', 'basis-80', 'min-w-0');

    const games = screen.getByRole('region', { name: 'Los desafíos de hoy' }).querySelector('ul');
    expect(games).toHaveClass(
      'grid',
      'grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))]',
      'gap-5',
    );
    const how = document.getElementById('como')?.querySelector('ol');
    expect(how).toHaveClass(
      'grid',
      'grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))]',
      'gap-4',
    );
  });

  it('TS-29/30: placeholder y cabecera de los desafíos', async () => {
    await renderHome();
    const section = screen.getByRole('region', { name: 'Los desafíos de hoy' });
    expect(section).toHaveAttribute('id', 'juegos');
    expect(section).toHaveAttribute('tabindex', '-1');
    const items = [...(section.querySelector('ul') as HTMLElement).children];
    expect(items).toHaveLength(6);
    const placeholder = items[5]!.querySelector('article') as HTMLElement;
    expect(placeholder).toHaveClass('border-dashed', 'rounded-feature', 'min-h-75');
    expect(placeholder).toHaveTextContent('$ git checkout -b próximo-juego');
    expect(placeholder).toHaveTextContent('Más desafíos en camino.');
    expect(placeholder.querySelectorAll('a, button')).toHaveLength(0);
    expect(within(section).getByText('1 de 4 con desafío completados')).toHaveClass(
      'font-mono',
      'text-label-comment',
      'text-text-dim',
    );
    const bar = within(section).getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '1');
    expect(bar).toHaveAttribute('aria-valuemax', '4');
    expect(bar).toHaveAttribute('aria-label', '1 de 4 con desafío completados');
  });

  it('TS-10: hero con eyebrow, titular display y lede', async () => {
    await renderHome();
    const main = within(screen.getByRole('main'));
    expect(main.getByText('// martes 3 nov')).toHaveClass('text-accent');
    expect(main.getByText(/\$ nerdose --today/)).toHaveClass('font-mono', 'text-mono-body');
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass(
      'font-mono',
      'text-display-hero',
      'break-words',
      'hyphens-auto',
    );
    expect(main.getByText(/El mismo desafío para todos/)).toHaveClass(
      'font-sans',
      'text-body-lede',
      'text-text-lede',
      'max-w-lede',
    );
    expect(main.getByRole('button', { name: '¿Cómo funciona?' })).toHaveClass(
      'min-h-12',
      'text-button-lg',
      'border-border-strong',
      'font-medium',
    );
  });

  it('TS-11/19: terminal con filas en orden y pasos de Cómo funciona', async () => {
    await renderHome();
    const term = within(await screen.findByRole('region', { name: 'Progreso de hoy' }));
    expect(term.getByText('~/hoy — progreso.log')).toBeInTheDocument();
    expect(term.getByText('$ nerdose status')).toBeInTheDocument();
    expect(term.getAllByRole('listitem').map((li) => li.textContent?.replace(/\s+/g, ' '))).toEqual(
      [
        expect.stringMatching(/devdle.*4\/6.*completado/),
        expect.stringMatching(/grep-grid.*—.*en curso/),
        expect.stringMatching(/timeline.*—.*sin jugar/),
        expect.stringMatching(/big-o.*—.*sin desafío/),
        expect.stringMatching(/bug-hunt.*—.*anulado/),
      ],
    );
    expect(term.getByText('racha global')).toBeInTheDocument();
    expect(term.getByText('11:23:20')).toBeInTheDocument();
    const steps = within(document.getElementById('como') as HTMLElement).getAllByRole('listitem');
    expect(steps).toHaveLength(4);
    expect(screen.getByText('01 · todos los días')).toHaveClass('text-accent');
    expect(screen.getByText('02 · reglas propias')).toHaveClass('text-game-bug-hunt');
    expect(screen.getByText('03 · aprendés algo')).toHaveClass('text-game-big-o');
    expect(screen.getByText('04 · compartís sin spoilers')).toHaveClass('text-game-timeline');
  });

  it('TS-38/39: jerarquía de encabezados y orden del DOM', async () => {
    await renderHome();
    await screen.findByRole('region', { name: 'Progreso de hoy' });
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Los desafíos de hoy',
      'Tu progreso',
      'Cómo funciona',
    ]);
    const order = [
      screen.getByRole('heading', { level: 1 }),
      screen.getByRole('button', { name: /Seguir jugando/ }),
      screen.getByRole('button', { name: '¿Cómo funciona?' }),
      terminal(),
      screen.getByRole('heading', { level: 2, name: 'Los desafíos de hoy' }),
      screen.getByRole('heading', { level: 3, name: 'Devdle' }),
      screen.getByRole('heading', { level: 3, name: 'Bug Hunt' }),
      screen.getByText('$ git checkout -b'),
      screen.getByRole('heading', { level: 2, name: 'Tu progreso' }),
      screen.getByRole('link', { name: /ver estadísticas/ }),
      screen.getByRole('heading', { level: 2, name: 'Cómo funciona' }),
    ];
    for (let i = 1; i < order.length; i += 1) {
      expect(
        (order[i - 1] as Element).compareDocumentPosition(order[i] as Element) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it('TS-14/19/34: error y carga conservan Cómo funciona y ocultan eyebrow y terminal', async () => {
    useTodayError();
    const { unmount } = await renderHome();
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveClass('rounded-panel', 'border-status-error-border', 'bg-status-error-bg');
    expect(within(alert).getByRole('button', { name: /Reintentar/ })).toHaveClass(
      'border-border-strong',
      'font-medium',
    );
    expect(screen.queryByText(/\$ nerdose --today/)).toBeNull();
    for (const card of gameCards()) expect(card).toHaveTextContent(/~\d min/);
    const como = document.getElementById('como') as HTMLElement;
    expect(como).toHaveAttribute('aria-labelledby', 'como-title');
    expect(within(como).getByRole('heading', { level: 2 })).toHaveClass(
      'font-mono',
      'text-title-section',
    );
    unmount();
    server.use(
      http.get('/api/today', async () => {
        await delay('infinite');
        return HttpResponse.json(todayFixture);
      }),
    );
    await renderHome();
    expect(await screen.findByRole('status')).toHaveClass('font-mono', 'text-mono-body');
    expect(document.getElementById('como')).toHaveAttribute('aria-labelledby', 'como-title');
  });

  it('TS-30/28: etiqueta con // aria-hidden y racha 0 con cookies bloqueadas', async () => {
    useToday({ ...todayFirstVisitFixture, has_session: false });
    await renderHome();
    const section = screen.getByRole('region', { name: 'Los desafíos de hoy' });
    const label = within(section).getByText('Sin sesión: no podemos mostrar tu progreso');
    expect(label.querySelector('span')).toHaveAttribute('aria-hidden', 'true');
    expect(within(section).getByRole('heading', { level: 2 })).toHaveClass('text-title-section-lg');
    for (const card of gameCards()) expect(card).toHaveTextContent('racha 0');
  });

  it('TS-33: tu progreso con racha 0', async () => {
    useToday(todayFirstVisitFixture);
    await renderHome();
    const panel = within(await screen.findByRole('region', { name: 'Tu progreso' }));
    expect(panel.getAllByText('0')[0]).toHaveClass('text-text-dim');
    expect(
      panel.getByText('Todavía no hay datos. Completá un desafío y acá vas a ver tu racha.'),
    ).toHaveClass('font-sans', 'text-caption');
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
      ['mixto', () => useToday(todayFixture), '5 días · récord 12'],
      [
        'antes del lanzamiento',
        () => useToday(todayBeforeLaunchFixture),
        'El primer desafío llega pronto',
      ],
      ['error', () => useTodayError(), ERROR_TEXT],
      ['cookies', () => useToday({ ...todayFirstVisitFixture, has_session: false }), '— sin datos'],
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
      await settle(() => expect(terminal()).toHaveTextContent('11:23:20'));
      const el = within(terminal()).getByText('11:23:20');
      expect(el.closest('p')).toHaveTextContent('próximo desafío en');
      expect(el.closest('p')).not.toHaveAttribute('aria-live');
      expect(el.closest('p')).not.toHaveAttribute('role');
      await advance(1000);
      expect(within(terminal()).getByText('11:23:19')).toBeInTheDocument();
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
      expect(within(terminal()).getByText('00:00:00')).toBeInTheDocument();
      expect(screen.getByText('#8')).toBeInTheDocument();
      expect(probe.calls).toBe(snap);
      await advance(1499);
      expect(probe.calls).toBe(snap);
      await advance(1);
      await advance(0);
      expect(probe.calls).toBe(snap + 1);
      await advance(50);
      await settle(() => expect(screen.getByText('#9')).toBeInTheDocument());
      expect(within(terminal()).getByText('24:00:00')).toBeInTheDocument();
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
      expect(screen.queryByText(/próximo desafío en/)).toBeNull();
      expect(gameCards()).toHaveLength(5);
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
    const stats = screen.getByRole('link', { name: /ver estadísticas/ });
    expect(stats).toHaveAttribute('href', '/stats');
    expect(stats).toHaveClass('font-mono', 'no-underline', 'text-accent');
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
