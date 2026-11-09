import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';

import { buttonClass } from './button-class';
import { GameHeader } from './game-header';
import { ChartIcon, HelpIcon, ShareIcon } from './icons';

// eslint-disable-next-line jsx-a11y/anchor-has-content -- el contenido llega por `children` en `p`
const renderHome = (p: { className: string; children: React.ReactNode }) => <a href="/" {...p} />;

function Full() {
  return (
    <GameHeader
      game="devdle"
      navLabel="Ubicación"
      homeLabel="nerdose"
      renderHome={renderHome}
      crumb="devdle"
      meta="#8"
    >
      <button type="button" aria-label="Cómo se juega" className={buttonClass({ variant: 'icon' })}>
        <HelpIcon />
      </button>
      <a href="/stats" aria-label="Estadísticas" className={buttonClass({ variant: 'icon' })}>
        <ChartIcon />
      </a>
      <button
        type="button"
        aria-disabled="true"
        aria-label="Compartir resultado (disponible al terminar)"
        className={buttonClass({
          variant: 'accent',
          game: 'devdle',
          size: 'share',
          disabled: true,
        })}
      >
        <ShareIcon />
        Compartir
      </button>
    </GameHeader>
  );
}

describe('GameHeader', () => {
  it('renders structure and breadcrumb (S-021 TS-17, TS-37)', () => {
    render(
      <GameHeader
        game="devdle"
        navLabel="Ubicación"
        homeLabel="nerdose"
        renderHome={renderHome}
        crumb="devdle"
        meta="#8"
      />,
    );
    expect(screen.getByRole('banner')).toHaveClass(
      'flex',
      'flex-wrap',
      'items-center',
      'justify-between',
      'gap-4',
      'border-b',
      'border-border-subtle',
      'px-8',
      'py-3.5',
    );
    const nav = screen.getByRole('navigation', { name: 'Ubicación' });
    expect(nav.parentElement).toHaveClass('flex', 'min-w-0', 'flex-wrap');
    const list = within(nav).getByRole('list');
    expect(list).toHaveClass('flex-wrap');
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    const link = screen.getByRole('link', { name: 'nerdose' });
    expect(link).toHaveAttribute('href', '/');
    expect(link).toHaveClass(
      'font-mono',
      'text-brand-logo-compact',
      'text-text',
      'min-h-11',
      'focus-visible:outline-accent',
    );
    const glyph = link.querySelector('span');
    expect(glyph).toHaveAttribute('aria-hidden', 'true');
    expect(glyph).toHaveClass('text-accent');
    expect(screen.getByText('/')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('/')).toHaveClass('text-text-separator');
    const crumb = screen.getByText('devdle');
    expect(crumb).toHaveAttribute('aria-current', 'page');
    expect(crumb).toHaveClass('text-brand-crumb', 'text-game-devdle');
    expect(screen.getByText('#8')).toHaveClass('font-mono', 'text-label-comment', 'text-text-dim');
  });

  it('uses the game accent without conditionals (S-021 TS-18)', () => {
    render(
      <GameHeader
        game="bug-hunt"
        navLabel="x"
        homeLabel="nerdose"
        renderHome={renderHome}
        crumb="bug-hunt"
      />,
    );
    expect(screen.getByText('bug-hunt')).toHaveClass('text-game-bug-hunt');
    expect(screen.getByText('bug-hunt')).not.toHaveClass('text-game-devdle');
  });

  it('omits meta when absent (S-021 TS-19)', () => {
    const { container } = render(
      <GameHeader
        game="devdle"
        navLabel="x"
        homeLabel="nerdose"
        renderHome={renderHome}
        crumb="devdle"
      />,
    );
    expect(screen.queryByText('#8')).toBeNull();
    expect(container.querySelector('header p')).toBeNull();
  });

  it('renders actions in order and wrapping (S-021 TS-20, TS-37)', async () => {
    const { container } = render(<Full />);
    const buttons = [
      screen.getByRole('button', { name: 'Cómo se juega' }),
      screen.getByRole('link', { name: 'Estadísticas' }),
      screen.getByRole('button', { name: /Compartir resultado/ }),
    ];
    const order = [...container.querySelectorAll('[aria-label]')].filter(
      (e) => e.tagName !== 'NAV',
    );
    expect(order).toEqual(buttons);
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual([
      'Cómo se juega',
      'Estadísticas',
      'Compartir resultado (disponible al terminar)',
    ]);
    expect(buttons[0]!.parentElement).toHaveClass('flex', 'flex-wrap', 'items-center', 'gap-2');
    for (const svg of container.querySelectorAll('svg'))
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(await axe(container)).toHaveNoViolations();
    expect(container.innerHTML).not.toMatch(/(sm|md|lg):/);
  });

  it('is keyboard navigable (S-021 TS-21)', async () => {
    const user = userEvent.setup();
    render(<Full />);
    await user.tab();
    expect(screen.getByRole('link', { name: 'nerdose' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Cómo se juega' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Estadísticas' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: /Compartir resultado/ })).toHaveFocus();
  });

  it('has no text of its own and merges className (S-021 TS-22)', () => {
    const { container } = render(
      <GameHeader
        game="devdle"
        navLabel=""
        homeLabel=""
        renderHome={renderHome}
        crumb=""
        className="bg-bg"
      />,
    );
    expect(container.textContent?.replace(/\s/g, '')).toBe('>/');
    expect(container.querySelector('header')).toHaveClass('bg-bg');
  });
});
