import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BrandMark } from './brand-mark';

describe('BrandMark', () => {
  it('renders a static mark with decorative glyphs (TS-27)', () => {
    const { container } = render(
      <a href="/">
        <BrandMark label="nerdose" />
      </a>,
    );
    expect(screen.getByRole('link', { name: 'nerdose' })).toBeInTheDocument();
    const root = container.querySelector('a > span');
    expect(root).toHaveClass('font-mono', 'text-brand-logo', 'text-text');
    const hidden = [...container.querySelectorAll('[aria-hidden="true"]')];
    expect(hidden).toHaveLength(2);
    for (const el of hidden) expect(el).toHaveClass('text-accent');
    expect(hidden[0]?.textContent).toContain('>');
    expect(hidden[1]?.textContent).toBe('_');
    expect(hidden[1]?.className).not.toContain('animate-blink');
  });

  it('blinks the cursor only under motion-safe (TS-28)', () => {
    const { container } = render(<BrandMark label="nerdose" cursor="blink" />);
    const cursor = [...container.querySelectorAll('[aria-hidden="true"]')].at(-1);
    expect(cursor).toHaveClass('motion-safe:animate-blink');
    expect(cursor?.className.split(/\s+/)).not.toContain('animate-blink');
  });

  it('merges className', () => {
    const { container } = render(<BrandMark label="nerdose" className="font-bold" />);
    expect(container.firstElementChild).toHaveClass('text-text', 'font-bold');
  });

  it('only renders glyphs without label (TS-55)', () => {
    const { container } = render(<BrandMark label="" />);
    expect(container.textContent?.replace(/ /g, ' ')).toBe('> _');
  });
});
