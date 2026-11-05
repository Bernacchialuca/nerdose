import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { sessionFixture } from '@/test/fixtures/session';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/msw';

import { Component as About } from './about';

const view = () =>
  renderWithProviders({ route: '/about', routes: [{ path: '/about', element: <About /> }] });

describe('Acerca de', () => {
  it('TS-26 muestra el contenido en español', async () => {
    view();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Acerca de nerdose' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Los 5 juegos',
      'Cómo funciona la racha',
      'Datos y atribución',
      'Privacidad',
    ]);
    expect(
      screen.getByText(/^nerdose es un juego diario sobre programación y tecnología/),
    ).toBeInTheDocument();
    expect(screen.getByText(/^Devdle: adiviná el término\./)).toBeInTheDocument();
    expect(screen.getByText(/^No hay cuenta ni registro\./)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver a los juegos' })).toHaveAttribute('href', '/');
    expect(document.title).toBe('Acerca de · nerdose');
  });

  it('TS-27 enlaces de atribución externos', () => {
    view();
    for (const name of ['Wikipedia', 'Wikidata', 'CC BY-SA 4.0']) {
      const link = screen.getByRole('link', { name: new RegExp(name) });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(within(link).getByText('(abre en una pestaña nueva)')).toHaveClass('sr-only');
    }
  });

  it('TS-28 en inglés', async () => {
    server.use(
      http.post('/api/session', () => HttpResponse.json({ ...sessionFixture, locale: 'en' })),
    );
    view();
    expect(
      await screen.findByRole('heading', { level: 1, name: 'About nerdose' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'The 5 games',
      'How streaks work',
      'Data and attribution',
      'Privacy',
    ]);
    expect(screen.getAllByText('(opens in a new tab)')).toHaveLength(3);
    expect(document.title).toBe('About · nerdose');
  });

  it('TS-29 arreglo desktop', () => {
    const { container } = view();
    const grid = container.firstElementChild;
    expect(grid).toHaveClass('lg:grid', 'lg:grid-cols-12');
    const col = grid?.firstElementChild;
    expect(col).toHaveClass('lg:col-span-10', 'lg:col-start-2');
    const cards = container.querySelector('.lg\\:grid-cols-2');
    expect(cards).not.toBeNull();
    expect(Array.from(cards?.querySelectorAll('h2') ?? []).map((h) => h.textContent)).toEqual([
      'Los 5 juegos',
      'Cómo funciona la racha',
      'Datos y atribución',
      'Privacidad',
    ]);
  });

  it('TS-30 arreglo mobile', () => {
    const { container } = view();
    const cards = container.querySelector('.lg\\:grid-cols-2');
    expect(cards).toHaveClass('grid', 'gap-4');
    expect(cards?.className.split(' ').some((c) => /^grid-cols-/.test(c))).toBe(false);
    expect(container.innerHTML).not.toMatch(/w-\[/);
  });

  it('TS-44 foco visible en enlaces', () => {
    view();
    for (const a of screen.getAllByRole('link')) {
      expect(a).toHaveClass(
        'focus-visible:outline-2',
        'focus-visible:outline-offset-2',
        'focus-visible:outline-accent',
      );
      expect(a).not.toHaveClass('outline-none');
    }
  });

  it('axe sin violaciones', async () => {
    const { container } = view();
    expect(await axe(container)).toHaveNoViolations();
  });
});
