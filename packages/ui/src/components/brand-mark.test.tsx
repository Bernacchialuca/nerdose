import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BrandMark } from './brand-mark';

describe('BrandMark', () => {
  it('renders a decorative glyph plus the label (TS-16)', () => {
    const { container } = render(<BrandMark label="nerdose" />);
    const glyph = container.querySelector('[aria-hidden="true"]');
    expect(glyph?.textContent).toBe('> ');
    expect(screen.getByText('nerdose')).toBeVisible();
    expect(container.firstElementChild).toHaveClass('text-accent');
  });

  it('keeps the glyph out of the accessible name (TS-17)', () => {
    render(
      <a href="/">
        <BrandMark label="nerdose" />
      </a>,
    );
    expect(screen.getByRole('link', { name: 'nerdose' })).toBeInTheDocument();
  });

  it('merges className (TS-18)', () => {
    const { container } = render(<BrandMark label="nerdose" className="font-bold" />);
    expect(container.firstElementChild).toHaveClass('text-accent', 'font-bold');
  });

  it('only renders the decorative glyph without label (TS-25)', () => {
    const { container } = render(<BrandMark label="" />);
    expect(container.textContent).toBe('> ');
  });
});
