import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/render';

import { MainNav } from './main-nav';

describe('MainNav', () => {
  it('muestra los tres enlaces con foco visible y target táctil', () => {
    renderWithProviders({ route: '/stats', routes: [{ path: '*', element: <MainNav /> }] });
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/', '/stats', '/about']);
    expect(screen.getByRole('link', { name: './stats' })).toHaveAttribute('aria-current', 'page');
    for (const l of links)
      expect(l).toHaveClass('min-h-11', 'rounded-tile', 'focus-visible:outline-accent');
    expect(screen.getByRole('link', { name: './stats' })).toHaveClass('bg-nav-active', 'text-text');
  });
});
