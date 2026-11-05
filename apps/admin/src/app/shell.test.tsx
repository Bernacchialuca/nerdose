import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { renderWithProviders } from '@/test/render';

describe('Shell (pantalla de Admin)', () => {
  it('usa fondo, fuente y acento de los tokens', () => {
    const { container } = renderWithProviders({ route: '/' });
    expect(container.firstElementChild).toHaveClass('bg-bg', 'text-text', 'font-mono');
    expect(
      within(screen.getByRole('banner')).getByText('nerdose').closest('.text-accent'),
    ).not.toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent('>');
  });

  it('es identificable y tiene estructura accesible', () => {
    renderWithProviders({ route: '/' });
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getAllByRole('main')).toHaveLength(1);
    const h1 = screen.getAllByRole('heading', { level: 1 });
    expect(h1).toHaveLength(1);
    expect(h1[0]).toHaveAccessibleName('Admin');
    expect(h1[0]).not.toHaveClass('sr-only');
    expect(within(screen.getByRole('main')).getByRole('heading', { level: 1 })).toBe(h1[0]);
  });

  it('no tiene login ni funcionalidad', () => {
    const { container } = renderWithProviders({ route: '/' });
    expect(screen.queryAllByRole('form')).toHaveLength(0);
    expect(container.querySelectorAll('form')).toHaveLength(0);
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    expect(container.querySelector('input[type="password"]')).toBeNull();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('navigation')).toHaveLength(0);
    expect(
      screen.queryByText(/iniciar sesión|contraseña|cerrar sesión|reportes|métricas/i),
    ).toBeNull();
  });

  it('fija el título del documento', () => {
    renderWithProviders({ route: '/' });
    expect(document.title).toBe('Admin · nerdose');
  });

  it('no tiene violaciones de axe', async () => {
    const { container } = renderWithProviders({ route: '/' });
    expect(await axe(container)).toHaveNoViolations();
  });
});
