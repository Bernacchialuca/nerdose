import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';

import { Card } from './card';
import { GameThumbnail } from './game-thumbnail';

const DEVDLE_DESC =
  'Adiviná el término tech en 6 intentos · ~2 min · racha 0 · sin desafío hoy · no afecta tu racha';

describe('Card game', () => {
  it('renders the thumbnail header and the body (TS-31)', async () => {
    const { container } = render(
      <Card game="bug-hunt" thumbnail={<GameThumbnail game="bug-hunt" />} aria-labelledby="t">
        <h3 id="t">Bug Hunt</h3>
      </Card>,
    );
    const article = screen.getByRole('article', { name: 'Bug Hunt' });
    expect(article).toHaveClass(
      'flex',
      'flex-col',
      'overflow-hidden',
      'rounded-feature',
      'border',
      'border-border',
      'bg-surface',
    );
    const thumb = article.firstElementChild;
    expect(thumb).toHaveAttribute('aria-hidden', 'true');
    expect(thumb).toHaveClass(
      'h-37.5',
      'border-b',
      'bg-game-bug-hunt-tint',
      'border-game-bug-hunt-border',
    );
    expect(article.lastElementChild).toHaveClass('flex', 'flex-1', 'flex-col', 'gap-3', 'p-5');
    expect(article.className).not.toMatch(/(^|\s)shadow-/);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('marks the next card with the game border and shadow (TS-32)', () => {
    render(
      <Card game="devdle" next aria-labelledby="t">
        <h3 id="t">Devdle</h3>
      </Card>,
    );
    const article = screen.getByRole('article', { name: 'Devdle' });
    expect(article).toHaveClass('border-game-devdle-featured', 'shadow-next-devdle');
    expect(article).not.toHaveClass('border-border');
  });

  it('ignores next without game', () => {
    render(
      <Card next aria-labelledby="t">
        <h3 id="t">x</h3>
      </Card>,
    );
    const article = screen.getByRole('article');
    expect(article).toHaveClass('border-border');
    expect(article.className).not.toContain('shadow-next');
  });

  it('is compatible with web usage without variant nor game (TS-33)', () => {
    render(
      <Card aria-labelledby="t" className="h-full">
        <h2 id="t">Devdle</h2>
        <p>{DEVDLE_DESC}</p>
      </Card>,
    );
    const article = screen.getByRole('article', { name: 'Devdle' });
    expect(article).toHaveClass(
      'rounded-feature',
      'border',
      'border-border',
      'bg-surface',
      'h-full',
    );
    expect(article.querySelector('[aria-hidden]')).toBeNull();
    expect(article.firstElementChild).toHaveClass('p-5');
    expect(within(article).getByRole('heading', { level: 2, name: 'Devdle' })).toBeInTheDocument();
    expect(article).toHaveTextContent(DEVDLE_DESC);
  });

  it('passes HTML attributes and merges className', () => {
    render(
      <Card id="card-big-o" data-game="big-o" aria-labelledby="t" className="rounded-panel">
        <h2 id="t">Big O</h2>
      </Card>,
    );
    const article = screen.getByRole('article', { name: 'Big O' });
    expect(article).toHaveAttribute('id', 'card-big-o');
    expect(article).toHaveAttribute('data-game', 'big-o');
    expect(article).toHaveClass('rounded-panel');
    expect(article).not.toHaveClass('rounded-feature');
  });

  it('keeps the focus order of its children and is not focusable itself', async () => {
    const user = userEvent.setup();
    render(
      <Card>
        <h3>Bug Hunt</h3>
        <a href="/bug-hunt">Jugar →</a>
        <a href="/stats">ver estadísticas →</a>
      </Card>,
    );
    expect(screen.getByRole('article')).not.toHaveAttribute('tabindex');
    await user.tab();
    expect(screen.getByRole('link', { name: 'Jugar →' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'ver estadísticas →' })).toHaveFocus();
  });

  it('has no fixed widths nor responsive classes', () => {
    render(<Card>x</Card>);
    const cls = screen.getByRole('article').className;
    expect(cls).not.toMatch(/(^|\s)(w-\d|whitespace-nowrap)/);
    expect(cls).not.toMatch(/(^|\s)(sm|md|lg):/);
  });

  it('has no text of its own (TS-55)', () => {
    const { container } = render(<Card />);
    expect(container.textContent).toBe('');
  });
});

describe('Card placeholder', () => {
  it('is dashed, without background and not interactive (TS-34)', () => {
    render(
      <Card variant="placeholder">
        <p>$ git checkout -b próximo-juego</p>
      </Card>,
    );
    const article = screen.getByRole('article');
    expect(article).toHaveClass(
      'flex',
      'flex-col',
      'justify-center',
      'gap-3',
      'rounded-feature',
      'border',
      'border-dashed',
      'border-border-strong',
      'p-7',
      'min-h-75',
    );
    expect(article).not.toHaveClass('bg-surface');
    expect(article.querySelectorAll('a,button,[tabindex]')).toHaveLength(0);
  });
});

describe('Card step', () => {
  it('colors the kicker by tone (TS-35)', () => {
    const { rerender } = render(
      <Card variant="step" kicker="02 · reglas propias" tone="bug-hunt">
        Cada juego tiene su propia mecánica, sus intentos y su puntaje.
      </Card>,
    );
    const article = screen.getByRole('article');
    expect(article).toHaveClass(
      'flex',
      'flex-col',
      'gap-2',
      'rounded-panel',
      'border',
      'border-border-subtle',
      'p-5.5',
    );
    expect(article.className).not.toMatch(/(^|\s)bg-/);
    expect(screen.getByText('02 · reglas propias')).toHaveClass(
      'font-mono',
      'text-mono-body',
      'text-game-bug-hunt',
    );
    expect(screen.getByText(/Cada juego/)).toHaveClass('font-sans', 'text-body', 'text-text-body');
    rerender(
      <Card variant="step" kicker="01 · todos los días">
        x
      </Card>,
    );
    expect(screen.getByText('01 · todos los días')).toHaveClass('text-accent');
  });
});

describe('Card mini-stat', () => {
  it('renders a div with value and label (TS-36)', () => {
    const { container } = render(<Card variant="mini-stat" value="9" label="récord de racha" />);
    expect(screen.queryByRole('article')).toBeNull();
    const root = container.firstElementChild;
    expect(root?.tagName).toBe('DIV');
    expect(root).toHaveClass(
      'flex',
      'flex-col',
      'gap-1',
      'rounded-inset',
      'bg-surface-inset',
      'px-4',
      'py-3.5',
    );
    expect(screen.getByText('9')).toHaveClass('font-mono', 'text-numeric-md', 'text-text');
    expect(screen.getByText('récord de racha')).toHaveClass(
      'font-sans',
      'text-caption-tight',
      'text-text-muted',
    );
  });
});
