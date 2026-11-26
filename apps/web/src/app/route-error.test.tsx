import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { fontOf } from '@/test/font-family';
import { renderWithProviders } from '@/test/render';

import { RouteError } from './route-error';

function Boom(): never {
  throw new Error('boom');
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('RouteError', () => {
  it('un error de render muestra la pantalla de error sin filtrar el mensaje', () => {
    renderWithProviders({
      route: '/',
      routes: [{ path: '/', element: <Boom />, errorElement: <RouteError /> }],
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Algo salió mal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toHaveAttribute('type', 'button');
    expect(screen.queryByText(/boom/)).toBeNull();
  });

  it('TS-15 base Inter, título Mono, Reintentar primary y volver secondary', () => {
    renderWithProviders({
      route: '/',
      routes: [{ path: '/', element: <Boom />, errorElement: <RouteError /> }],
    });
    const main = screen.getByRole('main');
    expect(main).toHaveClass('font-sans');
    expect(main).not.toHaveClass('font-mono');
    const h1 = screen.getByRole('heading', { level: 1, name: 'Algo salió mal' });
    expect(fontOf(h1)).toBe('mono');
    expect(h1).toHaveClass('text-title-page');
    expect(
      screen.getByText(
        'Tuvimos un error inesperado. Tu progreso está guardado: reintentá o volvé a los juegos.',
      ),
    ).toBeInTheDocument();
    const retry = screen.getByRole('button', { name: 'Reintentar' });
    expect(retry).toHaveClass('rounded-control', 'min-h-11', 'w-full');
    expect(retry).not.toHaveClass('border-border-strong');
    const back = screen.getByRole('link', { name: /Volver a los juegos/ });
    expect(back).toHaveAttribute('href', '/');
    expect(back).toHaveClass('border-border-strong', 'min-h-11', 'w-full');
    const section = screen.getByRole('alert').querySelector('section');
    expect(section).toContainElement(retry);
    expect(section).toContainElement(back);
  });

  it('muestra la marca y el footer aunque el shell no se haya montado', () => {
    renderWithProviders({
      route: '/',
      routes: [{ path: '/', element: <Boom />, errorElement: <RouteError /> }],
    });
    expect(screen.getByRole('banner')).toHaveTextContent('nerdose');
    expect(screen.getByRole('contentinfo')).toHaveTextContent('exit 0');
  });

  it('no tiene violaciones de axe', async () => {
    const { container } = renderWithProviders({
      route: '/',
      routes: [{ path: '/', element: <Boom />, errorElement: <RouteError /> }],
    });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('Reintentar recarga la página', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload });
    renderWithProviders({
      route: '/',
      routes: [{ path: '/', element: <Boom />, errorElement: <RouteError /> }],
    });
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
