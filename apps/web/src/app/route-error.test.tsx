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

  it('TS-15 base Inter, título Mono y Reintentar secondary', () => {
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
    const retry = screen.getByRole('button', { name: 'Reintentar' });
    expect(retry).toHaveClass(
      'rounded-control',
      'border-border-strong',
      'text-text',
      'font-medium',
      'min-h-11',
      'mt-4',
    );
    expect(retry).not.toHaveClass('border-border-interactive');
    expect(retry).not.toHaveClass('text-accent');
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
