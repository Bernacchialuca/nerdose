import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import i18n from '@/i18n';
import { server } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

describe('router', () => {
  it('TS-32 game_id desconocido y /acerca-de caen en 404', async () => {
    for (const route of ['/sudoku', '/acerca-de']) {
      const { unmount } = renderWithProviders({ route });
      expect(
        await screen.findByRole('heading', { level: 1, name: '404 · página no encontrada' }),
      ).toBeInTheDocument();
      unmount();
    }
  });

  it('TS-33 Volver a los juegos navega a la home', async () => {
    renderWithProviders({ route: '/no-existe' });
    await userEvent.click(await screen.findByRole('link', { name: /Volver a los juegos/ }));
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Una dosis diaria de nerdeo.',
      }),
    ).toBeInTheDocument();
  });

  it('TS-1 una sola nav, siempre dentro del header', async () => {
    renderWithProviders({ route: '/' });
    const nav = await screen.findByRole('navigation', { name: 'Navegación principal' });
    expect(screen.getAllByRole('navigation')).toHaveLength(1);
    expect(screen.getByRole('banner')).toContainElement(nav);
    expect(within(nav).getByRole('link', { name: './juegos' })).toHaveAttribute('href', '/');
    expect(within(nav).getByRole('link', { name: './stats' })).toHaveAttribute('href', '/stats');
    expect(within(nav).getByRole('link', { name: './about' })).toHaveAttribute('href', '/about');
  });

  it('TS-40 marca y link activo', async () => {
    renderWithProviders({ route: '/about' });
    const header = await screen.findByRole('banner');
    expect(within(header).getByRole('link', { name: 'nerdose' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: './about' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: './juegos' })).not.toHaveAttribute('aria-current');
  });

  it('TS-41 navegar mueve el foco al h1 y actualiza el título', async () => {
    renderWithProviders({ route: '/' });
    await userEvent.click(await screen.findByRole('link', { name: './about' }));
    const h1 = await screen.findByRole('heading', { level: 1, name: 'Acerca de nerdose' });
    expect(h1).toHaveFocus();
    expect(h1).toHaveAttribute('tabindex', '-1');
    expect(document.title).toBe('Acerca de · nerdose');
  });

  it('TS-42 la carga inicial no roba el foco', async () => {
    renderWithProviders({ route: '/about' });
    await screen.findByRole('heading', { level: 1, name: 'Acerca de nerdose' });
    expect(document.body).toHaveFocus();
  });

  it('TS-42b la carga inicial no roba el foco en StrictMode (doble efecto)', async () => {
    renderWithProviders({ route: '/', strict: true });
    await screen.findByRole('heading', { level: 1, name: 'Una dosis diaria de nerdeo.' });
    expect(document.body).toHaveFocus();
  });

  it('flujo / -> about -> volver', async () => {
    renderWithProviders({ route: '/' });
    await userEvent.click(await screen.findByRole('link', { name: './about' }));
    await userEvent.click(await screen.findByRole('link', { name: /Volver a los juegos/ }));
    const h1 = await screen.findByRole('heading', {
      level: 1,
      name: 'Una dosis diaria de nerdeo.',
    });
    expect(h1).toHaveFocus();
    expect(document.title).toBe('nerdose');
  });

  it('TS-44 foco visible y sin outline-none en el shell', async () => {
    renderWithProviders({ route: '/no-existe' });
    await screen.findByRole('heading', { level: 1 });
    const controls = [...screen.getAllByRole('link'), ...screen.getAllByRole('button')];
    for (const el of controls) {
      expect(el).toHaveClass(
        'focus-visible:outline-2',
        'focus-visible:outline-offset-2',
        'focus-visible:outline-accent',
      );
      expect(el).not.toHaveClass('outline-none');
    }
    for (const b of screen.getAllByRole('button')) {
      expect(b).toHaveClass('min-w-11', 'before:-inset-y-1');
    }
  });

  it('TS-46 axe en /about y 404', async () => {
    for (const route of ['/about', '/no-existe']) {
      const { container, unmount } = renderWithProviders({ route });
      await screen.findByRole('heading', { level: 1 });
      expect(await axe(container)).toHaveNoViolations();
      unmount();
    }
  });
});

describe('persistencia del idioma', () => {
  it('TS-7 al recargar sigue en inglés y TS-6 sin reload', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload });
    let saved = 'es';
    server.use(
      http.post('/api/session', () =>
        HttpResponse.json({ locale: saved, preferred_code_language: 'js', created: false }),
      ),
      http.patch('/api/me/preferences', async ({ request }) => {
        saved = ((await request.json()) as { locale: string }).locale;
        return HttpResponse.json({ locale: saved, preferred_code_language: 'js' });
      }),
    );
    const first = renderWithProviders({ route: '/' });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'EN' })).toBeEnabled();
    });
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(await screen.findByText(/one platform, many challenges/)).toBeInTheDocument();
    expect(reload).not.toHaveBeenCalled();
    first.unmount();
    await i18n.changeLanguage('es');

    renderWithProviders({ route: '/' });
    expect(await screen.findByText(/one platform, many challenges/)).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
    vi.unstubAllGlobals();
  });

  it('TS-1 solo una mutación (POST session) al cargar', async () => {
    const mutations: string[] = [];
    server.events.on('request:start', ({ request }) => {
      if (request.method !== 'GET')
        mutations.push(`${request.method} ${new URL(request.url).pathname}`);
    });
    renderWithProviders({ route: '/' });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'ES' })).toBeEnabled();
    });
    server.events.removeAllListeners();
    expect(mutations).toEqual(['POST /api/session']);
  });

  it('TS-4/TS-47 StrictMode con providers y router: una sesión, sin cookies ni storage', async () => {
    let posts = 0;
    server.use(
      http.post('/api/session', () => {
        posts += 1;
        return HttpResponse.json({ locale: 'es', preferred_code_language: 'js', created: false });
      }),
    );
    const { container } = renderWithProviders({ route: '/', strict: true });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'ES' })).toBeEnabled();
    });
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    await screen.findByText(/one platform, many challenges/);
    expect(container).toBeInTheDocument();
    expect(posts).toBe(1);
    expect(document.cookie).toBe('');
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it.each([
    [
      '500',
      () => HttpResponse.json({ error: { code: 'internal_error', message: 'x' } }, { status: 500 }),
    ],
    ['red', () => HttpResponse.error()],
  ])('TS-22 %s en la sesión: sin banner y shell visible', async (_n, reply) => {
    server.use(http.post('/api/session', reply));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderWithProviders({ route: '/' });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'ES' })).toBeEnabled();
    });
    expect(screen.queryByText(/(Activá las cookies|Enable cookies)/)).toBeNull();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('TS-11 PATCH 401 dos veces: sin banner', async () => {
    server.use(
      http.patch('/api/me/preferences', () =>
        HttpResponse.json({ error: { code: 'no_session', message: 'x' } }, { status: 401 }),
      ),
    );
    renderWithProviders({ route: '/' });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'EN' })).toBeEnabled();
    });
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(await screen.findByText(/one platform, many challenges/)).toBeInTheDocument();
    expect(screen.queryByText(/(Activá las cookies|Enable cookies)/)).toBeNull();
  });
});
