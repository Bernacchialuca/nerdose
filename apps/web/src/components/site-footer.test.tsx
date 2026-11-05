import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/render';

import { SiteFooter } from './site-footer';

describe('SiteFooter', () => {
  it('muestra privacidad y enlace a Acerca de', () => {
    renderWithProviders({ route: '/', routes: [{ path: '*', element: <SiteFooter /> }] });
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveTextContent('nerdose.dev');
    expect(footer).toHaveTextContent('una única cookie funcional');
    expect(screen.getByRole('link', { name: 'Acerca de' })).toHaveAttribute('href', '/about');
  });
});
