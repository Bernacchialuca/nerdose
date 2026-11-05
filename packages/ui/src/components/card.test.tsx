import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';

import { Card } from './card';

const DEVDLE_DESC =
  'Adiviná el término tech en 6 intentos · ~2 min · racha 0 · sin desafío hoy · no afecta tu racha';

function Devdle() {
  return (
    <Card aria-labelledby="game-devdle">
      <h2 id="game-devdle">Devdle</h2>
      <p>{DEVDLE_DESC}</p>
    </Card>
  );
}

describe('Card', () => {
  it('renders an article named by its heading (TS-6)', () => {
    render(<Devdle />);
    const article = screen.getByRole('article', { name: 'Devdle' });
    expect(within(article).getByRole('heading', { level: 2, name: 'Devdle' })).toBeInTheDocument();
    expect(article).toHaveTextContent(DEVDLE_DESC);
  });

  it('uses the design tokens (TS-7)', () => {
    render(<Devdle />);
    expect(screen.getByRole('article')).toHaveClass(
      'flex',
      'flex-col',
      'gap-3',
      'rounded-2xl',
      'border',
      'border-border',
      'bg-surface',
      'p-4',
    );
  });

  it('merges className with cn (TS-8)', () => {
    render(<Card className="h-full p-6">x</Card>);
    const article = screen.getByRole('article');
    expect(article).toHaveClass('h-full', 'p-6');
    expect(article).not.toHaveClass('p-4');
  });

  it('passes HTML attributes (TS-9)', () => {
    render(
      <Card id="card-big-o" data-game="big-o" aria-labelledby="t">
        <h2 id="t">Big O</h2>
      </Card>,
    );
    const article = screen.getByRole('article', { name: 'Big O' });
    expect(article).toHaveAttribute('id', 'card-big-o');
    expect(article).toHaveAttribute('data-game', 'big-o');
    expect(article).toHaveAttribute('aria-labelledby', 't');
  });

  it('is not interactive and does not take focus (TS-10)', () => {
    render(
      <Card>
        <h2>Grep Grid</h2>
        <p>Encontrá 8 palabras en la grilla · sin tiempo · ~3 min</p>
      </Card>,
    );
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.getByRole('article')).not.toHaveAttribute('tabindex');
    expect(document.activeElement).toBe(document.body);
  });

  it('keeps the focus order of its children (TS-11)', async () => {
    const user = userEvent.setup();
    render(
      <Card>
        <h2>Bug Hunt</h2>
        <a href="/bug-hunt">Jugar →</a>
        <a href="/stats">ver estadísticas →</a>
      </Card>,
    );
    await user.tab();
    expect(screen.getByRole('link', { name: 'Jugar →' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'ver estadísticas →' })).toHaveFocus();
  });

  it('has no fixed widths nor responsive classes (TS-12)', () => {
    render(<Devdle />);
    const cls = screen.getByRole('article').className;
    expect(cls).not.toMatch(/(^|\s)(w-\[|min-w-\[|w-\d|whitespace-nowrap)/);
    expect(cls).not.toMatch(/(^|\s)(sm|md|lg):/);
  });

  it('has no axe violations (TS-13)', async () => {
    const { container } = render(
      <Card>
        <h2>Bug Hunt</h2>
        <a href="/bug-hunt">Jugar →</a>
        <a href="/stats">ver estadísticas →</a>
      </Card>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no text of its own (TS-14)', () => {
    const { container } = render(<Card />);
    expect(container.textContent).toBe('');
    expect(container.querySelectorAll('article')).toHaveLength(1);
  });
});
