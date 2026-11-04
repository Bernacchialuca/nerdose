import { screen, within } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/render';

describe('Shell', () => {
  it('usa fondo, fuente y acento de los tokens', () => {
    const { container } = renderWithProviders({ route: '/' });
    const root = container.firstElementChild;
    expect(root).toHaveClass('bg-bg', 'text-text', 'font-mono');
    expect(within(screen.getByRole('banner')).getByText('nerdose').closest('.text-accent')).not.toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent('>');
  });

  it('tiene estructura accesible', () => {
    renderWithProviders({ route: '/' });
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getAllByRole('main')).toHaveLength(1);
    const h1 = screen.getAllByRole('heading', { level: 1, name: 'nerdose' });
    expect(h1).toHaveLength(1);
    expect(within(screen.getByRole('main')).getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('no muestra contenido de juego ni controles', () => {
    renderWithProviders({ route: '/' });
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryByText(/devdle|bug hunt|big o|timeline|grep grid/i)).toBeNull();
  });

  it('fija el título del documento', () => {
    renderWithProviders({ route: '/' });
    expect(document.title).toBe('nerdose');
  });

  it('no tiene violaciones de axe', async () => {
    const { container } = renderWithProviders({ route: '/' });
    expect(await axe(container)).toHaveNoViolations();
  });
});
