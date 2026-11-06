import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { UiGameId } from './game-classes';
import { GameThumbnail } from './game-thumbnail';

const GAMES: UiGameId[] = ['devdle', 'bug-hunt', 'big-o', 'timeline', 'grep-grid'];

const byClass = (el: Element, cls: string) => [...el.querySelectorAll(`[class~="${cls}"]`)];

describe('GameThumbnail', () => {
  it.each(GAMES)('is decorative and not focusable for %s (TS-37)', (game) => {
    const { container } = render(<GameThumbnail game={game} />);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(root.querySelectorAll('a,button,input,[tabindex]')).toHaveLength(0);
    for (const el of root.querySelectorAll('[class]')) expect(el.className).not.toContain('[');
  });

  it('draws the Devdle grid (TS-37)', () => {
    const { container } = render(<GameThumbnail game="devdle" />);
    const cells = byClass(container, 'size-7.5');
    expect(cells).toHaveLength(12);
    for (const c of cells) expect(c).toHaveClass('rounded-cell-sm');
    expect(cells.filter((c) => c.classList.contains('border-dashed'))).toHaveLength(1);
    expect(byClass(container, 'border-status-pending')).toHaveLength(1);
    expect(byClass(container, 'bg-game-devdle')).toHaveLength(8);
    expect(byClass(container, 'border-game-devdle-muted')).toHaveLength(3);
  });

  it('draws Bug Hunt with the highlighted bug line (TS-37)', () => {
    const { container } = render(<GameThumbnail game="bug-hunt" />);
    expect(container.textContent).toContain('🐛');
    expect(byClass(container, 'shadow-bar-bug-hunt')).toHaveLength(1);
  });

  it('draws Big O with the active chip (TS-37)', () => {
    const { container } = render(<GameThumbnail game="big-o" />);
    const active = [...container.querySelectorAll('span')].find(
      (s) => s.textContent === 'O(n log n)',
    );
    expect(active).toHaveClass('bg-game-big-o', 'text-game-big-o-on');
    expect(container.querySelectorAll('span')).toHaveLength(5);
  });

  it('draws Timeline with 5 nodes (TS-37)', () => {
    const { container } = render(<GameThumbnail game="timeline" />);
    const nodes = byClass(container, 'size-3.5');
    expect(nodes).toHaveLength(5);
    expect(nodes.filter((n) => n.classList.contains('bg-game-timeline'))).toHaveLength(2);
    expect(nodes.filter((n) => n.classList.contains('border-2'))).toHaveLength(3);
    for (const text of ['1991', '1995']) expect(container.textContent).toContain(text);
    expect(container.textContent?.match(/\?\?\?\?/g)).toHaveLength(3);
  });

  it('draws Grep Grid with 28 cells in 7 columns (TS-37)', () => {
    const { container } = render(<GameThumbnail game="grep-grid" />);
    expect(container.firstElementChild).toHaveClass('grid-cols-7');
    expect(byClass(container, 'size-5.5')).toHaveLength(28);
    const found = byClass(container, 'bg-game-grep-grid').map((n) => n.textContent).join('');
    expect(found).toBe('MUTEX');
  });
});
