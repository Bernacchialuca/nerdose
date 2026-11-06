import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';

import { AppHeader } from './app-header';
import { BrandMark } from './brand-mark';

const renderFull = (variant: 'default' | 'home' = 'home') =>
  render(
    <AppHeader
      variant={variant}
      brand={
        <a href="/">
          <BrandMark label="nerdose" />
        </a>
      }
      nav={
        <nav aria-label="principal">
          <a href="/stats">./stats</a>
        </nav>
      }
    >
      <button type="button">EN</button>
    </AppHeader>,
  );

describe('AppHeader', () => {
  it('lays out the home header with wrapping and no responsive classes (TS-29)', async () => {
    const { container } = renderFull();
    const header = screen.getByRole('banner');
    expect(header).toHaveClass(
      'flex',
      'flex-wrap',
      'items-center',
      'justify-between',
      'gap-4',
      'border-b',
      'border-border-subtle',
      'px-8',
      'py-4.5',
      'bg-header',
    );
    expect(header.className).not.toMatch(/(^|\s)(sm|md|lg|xl):/);
    const brand = screen.getByRole('link', { name: 'nerdose' });
    const nav = screen.getByRole('navigation', { name: 'principal' });
    const action = screen.getByRole('button', { name: 'EN' });
    expect(brand.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(nav.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.querySelector('header > div')).toHaveClass(
      'flex',
      'flex-wrap',
      'items-center',
      'gap-2.5',
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('keeps the focus order of the DOM', () => {
    const { container } = renderFull();
    const names = [...container.querySelectorAll<HTMLElement>('a,button')].map((el) => {
      el.focus();
      expect(document.activeElement).toBe(el);
      return el.textContent?.replace(/ /g, ' ');
    });
    expect(names).toEqual(['> nerdose_', './stats', 'EN']);
  });

  it('has no background in the default variant (TS-30)', () => {
    renderFull('default');
    expect(screen.getByRole('banner')).not.toHaveClass('bg-header');
  });

  it('renders only the brand without nav or children (TS-30)', () => {
    render(<AppHeader brand={<BrandMark label="nerdose" />} />);
    expect(screen.getByRole('banner').children).toHaveLength(1);
  });

  it('renders children in the actions container without nav (TS-30)', () => {
    const { container } = render(
      <AppHeader brand="x">
        <button type="button">EN</button>
      </AppHeader>,
    );
    expect(container.querySelector('header > div')).toContainElement(
      screen.getByRole('button', { name: 'EN' }),
    );
  });

  it('merges className (TS-30)', () => {
    render(<AppHeader brand="x" className="py-2" />);
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('py-2');
    expect(header).not.toHaveClass('py-4.5');
  });

  it('has no text of its own (TS-55)', () => {
    const { container } = render(<AppHeader brand="" />);
    expect(container.textContent).toBe('');
  });
});
