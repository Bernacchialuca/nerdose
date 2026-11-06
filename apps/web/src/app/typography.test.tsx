import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { todayFirstVisitFixture } from '@/test/fixtures/today';
import { fontOf } from '@/test/font-family';
import { server } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

const TITLE = 'Una dosis diaria de nerdeo.';
const NAV = 'Navegación principal';

async function renderHome() {
  const utils = renderWithProviders({ route: '/' });
  await screen.findByRole('heading', { level: 1, name: TITLE });
  await screen.findByRole('region', { name: 'Progreso de hoy' });
  return utils;
}

describe('Tipografía', () => {
  it('TS-7 el shell usa Inter como base', async () => {
    const { container } = await renderHome();
    expect(container.firstElementChild).toHaveClass('bg-bg', 'text-text', 'font-sans');
    expect(container.firstElementChild).not.toHaveClass('font-mono');
  });

  it('TS-8 header, nav y footer en Mono', async () => {
    await renderHome();
    const banner = screen.getByRole('banner');
    expect(fontOf(banner)).toBe('mono');
    const nav = screen.getByRole('navigation', { name: NAV });
    expect(banner).toContainElement(nav);
    expect(fontOf(nav)).toBe('mono');
    expect(fontOf(screen.getByRole('contentinfo'))).toBe('mono');
    expect(fontOf(screen.getByRole('button', { name: 'ES' }))).toBe('mono');
    expect(fontOf(within(banner).getByText(/#128/))).toBe('mono');
  });

  it('TS-9 la nav vive en el header y resuelve Mono', async () => {
    await renderHome();
    const nav = screen.getByRole('navigation', { name: NAV });
    expect(screen.getByRole('banner')).toContainElement(nav);
    expect(fontOf(nav)).toBe('mono');
  });

  it('TS-10 títulos, botones, links y datos de la home en Mono', async () => {
    await renderHome();
    const h1 = screen.getByRole('heading', { level: 1, name: TITLE });
    expect(fontOf(h1)).toBe('mono');
    expect(h1).toHaveClass('text-display-hero', 'break-words', 'hyphens-auto');
    for (const name of ['Devdle', 'Grep Grid', 'Tech Timeline', 'Big O', 'Bug Hunt']) {
      expect(fontOf(screen.getByRole('heading', { level: 3, name })), name).toBe('mono');
    }
    for (const name of ['Los desafíos de hoy', 'Tu progreso', 'Cómo funciona']) {
      expect(fontOf(screen.getByRole('heading', { level: 2, name })), name).toBe('mono');
    }
    const terminal = within(screen.getByRole('region', { name: 'Progreso de hoy' }));
    const progress = within(screen.getByRole('region', { name: 'Tu progreso' }));
    const mono = [
      screen.getByRole('button', { name: /Seguir jugando/ }),
      screen.getByRole('button', { name: '¿Cómo funciona?' }),
      screen.getByRole('link', { name: /ver estadísticas/ }),
      screen.getByText(/\$ nerdose --today/),
      screen.getByText('// martes 3 nov'),
      screen.getByText(/\d de \d.* completados/),
      terminal.getByText('5 días · récord 12'),
      terminal.getByText(/devdle/),
      progress.getByText('5'),
      within(screen.getByRole('article', { name: 'Devdle' })).getByText(/~2 min/),
      screen.getByText('✓ 4/6'),
    ];
    for (const el of mono) expect(fontOf(el), el.textContent ?? '').toBe('mono');
  });

  it('TS-11 la prosa de la home en Inter', async () => {
    await renderHome();
    const sans = [
      screen.getByText(
        'Minijuegos para developers y curiosos de la tecnología. Un desafío nuevo por día, el mismo para todos. Dos minutos, algo aprendido, una racha que cuidar.',
      ),
      screen.getByText('Adiviná el término tech en 6 intentos'),
      screen.getByText(/Cada juego publica un desafío nuevo/),
      screen.getByText(/Más desafíos en camino/),
      screen.getByText('récord de racha'),
    ];
    for (const el of sans) expect(fontOf(el), el.textContent ?? '').toBe('sans');
  });

  it('TS-12 el resumen de progreso sin datos es prosa', async () => {
    server.use(http.get('/api/today', () => HttpResponse.json(todayFirstVisitFixture)));
    renderWithProviders({ route: '/' });
    const text = await screen.findByText(
      'Todavía no hay datos. Completá un desafío y acá vas a ver tu racha.',
    );
    expect(fontOf(text)).toBe('sans');
    expect(fontOf(screen.getByRole('heading', { level: 2, name: 'Tu progreso' }))).toBe('mono');
  });

  it('TS-13 Acerca de: títulos Mono con rol del DS, prosa Inter', async () => {
    renderWithProviders({ route: '/about' });
    const h1 = await screen.findByRole('heading', { level: 1, name: 'Acerca de nerdose' });
    expect(fontOf(h1)).toBe('mono');
    expect(h1).toHaveClass('text-title-page', 'break-words');
    expect(h1).not.toHaveClass('text-2xl');
    for (const name of [
      'Los juegos',
      'Cómo funciona la racha',
      'Datos y atribución',
      'Privacidad',
    ]) {
      const h2 = screen.getByRole('heading', { level: 2, name });
      expect(fontOf(h2), name).toBe('mono');
      expect(h2).toHaveClass('text-title-panel');
      expect(h2).not.toHaveClass('font-semibold');
      expect(h2).not.toHaveClass('text-lg');
    }
    expect(
      fontOf(
        screen.getByText(
          'Completar un desafío, ganando o perdiendo, suma a tu racha. Un día sin desafío es neutro: no suma ni corta. Un desafío anulado no te afecta.',
        ),
      ),
    ).toBe('sans');
    expect(fontOf(screen.getByRole('link', { name: /Volver a los juegos/ }))).toBe('mono');
  });

  it('TS-14 404: título Mono, mensaje Inter, botón del DS', async () => {
    renderWithProviders({ route: '/no-existe' });
    const h1 = await screen.findByRole('heading', { level: 1, name: '404 · página no encontrada' });
    expect(fontOf(h1)).toBe('mono');
    expect(h1).toHaveClass('text-title-page', 'break-words');
    expect(h1).not.toHaveClass('text-2xl');
    expect(
      fontOf(
        screen.getByText(
          'Esta dirección no existe en nerdose. Los desafíos de hoy te esperan en la home.',
        ),
      ),
    ).toBe('sans');
    const back = screen.getByRole('link', { name: /Volver a los juegos/ });
    expect(back).toHaveAttribute('href', '/');
    expect(back).toHaveClass(
      'rounded-control',
      'min-h-11',
      'px-4',
      'text-button-md',
      'font-bold',
      'bg-accent',
      'text-on-accent',
      'font-mono',
      'focus-visible:outline-accent',
      'w-full',
    );
    expect(back).not.toHaveClass('lg:w-auto');
  });
});
