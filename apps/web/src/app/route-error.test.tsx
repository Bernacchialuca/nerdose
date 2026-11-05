import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

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
