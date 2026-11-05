import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';

import { AppHeader } from './app-header';
import { BrandMark } from './brand-mark';

const renderFull = () =>
  render(
    <AppHeader
      brand={
        <a href="/">
          <BrandMark label="nerdose" />
        </a>
      }
    >
      <nav aria-label="principal">
        <a href="/stats">./stats</a>
      </nav>
      <button type="button">EN</button>
    </AppHeader>,
  );

describe('AppHeader', () => {
  it('is a banner landmark with brand before children (TS-19)', () => {
    renderFull();
    const header = screen.getByRole('banner');
    expect(header).toHaveTextContent('nerdose');
    expect(screen.getByRole('navigation', { name: 'principal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument();
    const brand = screen.getByRole('link', { name: 'nerdose' });
    expect(brand.compareDocumentPosition(screen.getByRole('button', { name: 'EN' }))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('keeps the focus order of the DOM (TS-20)', () => {
    const { container } = renderFull();
    const names = [...container.querySelectorAll<HTMLElement>('a,button')].map((el) => {
      el.focus();
      expect(document.activeElement).toBe(el);
      return el.textContent;
    });
    expect(names).toEqual(['> nerdose', './stats', 'EN']);
  });

  it('lays out mobile-first with wrapping (TS-21)', () => {
    const { container } = renderFull();
    const header = screen.getByRole('banner');
    for (const c of ['flex', 'flex-wrap', 'items-center', 'justify-between', 'px-4', 'lg:px-12']) {
      expect(header).toHaveClass(c);
    }
    expect(header.className).not.toMatch(/(^|\s)(sm|md):/);
    const controls = container.querySelector('header > div');
    expect(controls).toHaveClass('flex', 'flex-wrap', 'items-center');
  });

  it('renders only the brand without children (TS-22)', () => {
    render(<AppHeader brand={<BrandMark label="nerdose" />} />);
    expect(screen.getByRole('banner').children).toHaveLength(1);
  });

  it('merges className (TS-23)', () => {
    render(<AppHeader brand="x" className="py-2" />);
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('py-2');
    expect(header).not.toHaveClass('py-4');
  });

  it('has no axe violations (TS-24)', async () => {
    const { container } = renderFull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no text of its own (TS-25)', () => {
    const { container } = render(<AppHeader brand="" />);
    expect(container.textContent).toBe('');
  });
});
