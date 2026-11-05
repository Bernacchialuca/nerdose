import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { sessionFixture } from '@/test/fixtures/session';
import { server } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

import { NotFound } from './not-found';

const view = () =>
  renderWithProviders({ route: '/no-existe', routes: [{ path: '*', element: <NotFound /> }] });

describe('NotFound', () => {
  it('TS-31 muestra la 404', () => {
    view();
    expect(
      screen.getByRole('heading', { level: 1, name: '404 · página no encontrada' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Esta dirección no existe en nerdose. Los desafíos de hoy te esperan en la home.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Volver a los juegos/ })).toHaveAttribute('href', '/');
    expect(document.title).toBe('Página no encontrada · nerdose');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('TS-34 en inglés', async () => {
    server.use(
      http.post('/api/session', () => HttpResponse.json({ ...sessionFixture, locale: 'en' })),
    );
    view();
    expect(
      await screen.findByRole('heading', { level: 1, name: '404 · page not found' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to the games/ })).toBeInTheDocument();
    expect(document.title).toBe('Page not found · nerdose');
  });

  it('TS-35 y TS-44 arreglo por viewport, targets y foco', () => {
    const { container } = view();
    expect(container.firstElementChild).toHaveClass('lg:grid', 'lg:grid-cols-12');
    expect(container.firstElementChild?.firstElementChild).toHaveClass(
      'lg:col-span-6',
      'lg:col-start-4',
    );
    const link = screen.getByRole('link', { name: /Volver a los juegos/ });
    expect(link).toHaveClass('w-full', 'lg:w-auto', 'min-h-11');
    expect(link).toHaveClass(
      'focus-visible:outline-2',
      'focus-visible:outline-offset-2',
      'focus-visible:outline-accent',
    );
    expect(link).not.toHaveClass('outline-none');
  });

  it('axe sin violaciones', async () => {
    const { container } = view();
    expect(await axe(container)).toHaveNoViolations();
  });
});
