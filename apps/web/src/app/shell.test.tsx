import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { sessionFixture } from '@/test/fixtures/session';
import { todayNoSessionFixture } from '@/test/fixtures/today';
import { server } from '@/test/msw';
import { renderWithProviders } from '@/test/render';
import { mockViewport } from '@/test/viewport';

const COOKIES = 'Activá las cookies para poder jugar';

const blocked = () =>
  server.use(http.get('/api/today', () => HttpResponse.json(todayNoSessionFixture)));
const english = () =>
  server.use(
    http.post('/api/session', () => HttpResponse.json({ ...sessionFixture, locale: 'en' })),
  );

describe('Shell', () => {
  it('usa fondo, fuente y acento de los tokens', async () => {
    const { container } = renderWithProviders({ route: '/' });
    await screen.findByRole('heading', {
      level: 1,
      name: 'Cinco juegos tech. Un desafío por día.',
    });
    expect(container.firstElementChild).toHaveClass('bg-bg', 'text-text', 'font-mono');
    const brand = within(screen.getByRole('banner')).getByRole('link', { name: 'nerdose' });
    expect(brand).toHaveAttribute('href', '/');
    expect(brand.querySelector('.text-accent')).not.toBeNull();
    expect(brand.querySelector('[aria-hidden="true"]')).toHaveTextContent('>');
  });

  it('TS-3/TS-2 selector refleja el locale de la sesión', async () => {
    renderWithProviders({ route: '/' });
    const es = await screen.findByRole('button', { name: 'ES' });
    expect(es).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.lang).toBe('es');
  });

  it('TS-2 locale en inglés', async () => {
    english();
    renderWithProviders({ route: '/' });
    expect(await screen.findByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.lang).toBe('en');
  });

  it('TS-23 footer con privacidad y enlace a Acerca de en todas las pantallas', async () => {
    for (const route of ['/', '/about', '/no-existe']) {
      const { unmount } = renderWithProviders({ route });
      const footer = await screen.findByRole('contentinfo');
      expect(footer).toHaveTextContent('nerdose.dev');
      expect(footer).toHaveTextContent(
        'Sin cuenta: una única cookie funcional guarda tu progreso, sin datos personales ni cookies de terceros.',
      );
      expect(within(footer).getByRole('link', { name: 'Acerca de' })).toHaveAttribute(
        'href',
        '/about',
      );
      unmount();
    }
  });

  it('TS-24 footer en inglés', async () => {
    english();
    renderWithProviders({ route: '/' });
    await waitFor(() => {
      expect(screen.getByRole('contentinfo')).toHaveTextContent(
        'No account: a single functional cookie keeps your progress, with no personal data or third-party cookies.',
      );
    });
    expect(
      within(screen.getByRole('contentinfo')).getByRole('link', { name: 'About' }),
    ).toHaveAttribute('href', '/about');
  });

  it('TS-25 el footer navega a Acerca de', async () => {
    renderWithProviders({ route: '/' });
    await userEvent.click(await screen.findByRole('link', { name: 'Acerca de' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Acerca de nerdose' }),
    ).toBeInTheDocument();
  });

  it('TS-13/TS-17/TS-18 banner O-03 sin controles y bajo la nav en mobile', async () => {
    blocked();
    renderWithProviders({ route: '/' });
    const banner = await screen.findByRole('status');
    expect(banner).toHaveTextContent(COOKIES);
    expect(banner).toHaveTextContent(
      'Sin cookies no podemos guardar tu partida. El catálogo, las estadísticas y «Acerca de» siguen disponibles.',
    );
    expect(within(banner).queryAllByRole('button')).toHaveLength(0);
    expect(within(banner).queryAllByRole('link')).toHaveLength(0);
    await userEvent.tab();
    for (let i = 0; i < 15; i += 1) {
      expect(banner.contains(document.activeElement)).toBe(false);
      await userEvent.tab();
    }
    const nav = screen.getByRole('navigation');
    const main = screen.getByRole('main');
    const order = [screen.getByRole('banner'), nav, banner, main];
    order.slice(1).forEach((el, i) => {
      const prev = order[i] as HTMLElement;
      expect(prev.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
    expect(screen.getByRole('banner')).not.toContainElement(nav);
  });

  it('TS-19 banner en desktop con la nav dentro del header', async () => {
    mockViewport('desktop');
    blocked();
    renderWithProviders({ route: '/' });
    const banner = await screen.findByRole('status');
    const header = screen.getByRole('banner');
    expect(within(header).getByRole('navigation')).toBeInTheDocument();
    expect(header.compareDocumentPosition(banner) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(
      banner.compareDocumentPosition(screen.getByRole('main')) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('TS-14 con cookies bloqueadas el selector EN traduce el banner', async () => {
    blocked();
    renderWithProviders({ route: '/' });
    await screen.findByRole('status');
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(await screen.findByText('Enable cookies to play')).toBeInTheDocument();
  });

  it('TS-20 429 en la sesión: sin banner y shell visible', async () => {
    server.use(
      http.post('/api/session', () =>
        HttpResponse.json(
          { error: { code: 'rate_limited', message: 'x' } },
          { status: 429, headers: { 'Retry-After': '600' } },
        ),
      ),
    );
    renderWithProviders({ route: '/' });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'ES' })).toBeEnabled();
    });
    expect(screen.queryByText(/(Activá las cookies|Enable cookies)/)).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('TS-48 sin diálogo ni consentimiento de cookies', async () => {
    renderWithProviders({ route: '/' });
    await screen.findByRole('button', { name: 'ES' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByText(/aceptar cookies|accept cookies/i)).toBeNull();
  });

  it('TS-45 axe sin violaciones en mobile y desktop', async () => {
    const mobile = renderWithProviders({ route: '/' });
    await screen.findByRole('heading', {
      level: 1,
      name: 'Cinco juegos tech. Un desafío por día.',
    });
    expect(await axe(mobile.container)).toHaveNoViolations();
    mobile.unmount();
    mockViewport('desktop');
    const desktop = renderWithProviders({ route: '/' });
    await screen.findByRole('heading', {
      level: 1,
      name: 'Cinco juegos tech. Un desafío por día.',
    });
    expect(await axe(desktop.container)).toHaveNoViolations();
  });

  it('TS-46 axe sin violaciones con el banner visible', async () => {
    blocked();
    const { container } = renderWithProviders({ route: '/' });
    await screen.findByRole('status');
    expect(await axe(container)).toHaveNoViolations();
  });
});
