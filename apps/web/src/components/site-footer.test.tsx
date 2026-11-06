import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/render';

import { SiteFooter } from './site-footer';

describe('SiteFooter', () => {
  it('es una sola línea con el lema y exit 0, como el prototipo', () => {
    renderWithProviders({ route: '/', routes: [{ path: '*', element: <SiteFooter /> }] });
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveTextContent('> nerdose — una plataforma, múltiples desafíos.exit 0');
    expect(footer).toHaveClass('flex', 'flex-wrap', 'justify-between');
    expect(footer).not.toHaveTextContent('cookie');
    expect(within(footer).queryByRole('link')).toBeNull();
  });
});
