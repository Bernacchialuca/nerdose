// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { Result } from './result';
import { GAME_STATS, RESULT_LOSS, RESULT_WIN } from './test-fixtures';
import { makeT } from './test-utils';
import type { ResultProps } from './types';

const base = (over: Partial<ResultProps> = {}): ResultProps => ({
  number: 128,
  locale: 'es',
  t: makeT('es'),
  result: RESULT_WIN,
  gameStats: GAME_STATS,
  ...over,
});

const bar = (label: string) => {
  const items = screen.getAllByRole('listitem');
  const li = items.find((i) => i.firstElementChild?.textContent === label) as HTMLElement;
  return li.children[1] as HTMLElement;
};

describe('Result', () => {
  it('shows a win (TS-50)', () => {
    render(<Result {...base()} />);
    const h1 = screen.getByRole('heading', { level: 1, name: 'Ganaste en 3/6' });
    expect(h1.closest('[role="status"]')).not.toBeNull();
    expect(screen.getByRole('grid', { name: 'Tus intentos' })).toBeInTheDocument();
    expect(screen.getAllByRole('gridcell')).toHaveLength(18);
    const row3 = within(screen.getAllByRole('row')[2] as HTMLElement).getAllByRole('gridcell');
    expect(row3.map((c) => c.getAttribute('aria-label'))).toEqual(
      [...'PARSER'].map((l) => `${l}, correcta`),
    );
    expect(screen.queryByRole('group', { name: 'Teclado' })).toBeNull();
  });

  it('shows a loss (TS-51)', () => {
    render(<Result {...base({ result: RESULT_LOSS })} />);
    expect(screen.getByRole('heading', { level: 1, name: 'No salió: X/6' })).toBeInTheDocument();
    expect(screen.getByText('Mostramos la palabra y su explicación.')).toBeInTheDocument();
  });

  it('shows the word card (TS-52) and follows the language (TS-53)', () => {
    const { rerender } = render(<Result {...base()} />);
    expect(screen.getByRole('heading', { level: 2, name: /palabra del día/ })).toBeInTheDocument();
    expect(screen.getByText('PARSER')).toBeInTheDocument();
    expect(screen.getByText('Categoría: ingeniería de software')).toBeInTheDocument();
    expect(screen.getByText(RESULT_WIN.definition)).toBeInTheDocument();
    expect(screen.getByText(RESULT_WIN.summary)).toBeInTheDocument();
    expect(screen.getByText('Fuente: Wikipedia (CC BY-SA)')).toBeInTheDocument();
    rerender(
      <Result
        {...base({
          locale: 'en',
          t: makeT('en'),
          result: {
            ...RESULT_WIN,
            definition: 'A program that analyzes…',
            summary: 'A parser is…',
          },
        })}
      />,
    );
    expect(screen.getByText('PARSER')).toBeInTheDocument();
    expect(screen.getByText('Category: software engineering')).toBeInTheDocument();
    expect(screen.getByText('A program that analyzes…')).toBeInTheDocument();
    expect(screen.getByText('A parser is…')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'You won in 3/6' })).toBeInTheDocument();
  });

  it('shows the distribution (TS-54)', () => {
    render(<Result {...base()} />);
    const heading = screen.getByRole('heading', { level: 2, name: /tus intentos/ });
    expect(heading.parentElement).toHaveTextContent('racha 3');
    const labels = ['1', '2', '3', '4', '5', '6', 'X'];
    expect(labels.map((l) => bar(l).querySelector('[aria-hidden]')?.textContent)).toEqual([
      '0',
      '1',
      '4',
      '3',
      '2',
      '1',
      '1',
    ]);
    expect(bar('3')).toHaveClass('bg-game-devdle');
    expect(bar('3')).toHaveTextContent('hoy');
    expect(bar('4')).toHaveClass('bg-control-selected');
    expect(bar('3').style.getPropertyValue('--w')).toBe('100%');
    expect(bar('1').style.getPropertyValue('--w')).toBe('8%');
    expect(bar('4').style.getPropertyValue('--w')).toBe('75%');
    const totals = heading.closest('section') as HTMLElement;
    expect(within(totals).getByText('12')).toBeInTheDocument();
    expect(totals).toHaveTextContent('jugadas');
    expect(within(totals).getByText('92%')).toBeInTheDocument();
    expect(totals).toHaveTextContent('victorias');
  });

  it('highlights X on a loss (TS-55)', () => {
    render(<Result {...base({ result: RESULT_LOSS })} />);
    expect(bar('X')).toHaveClass('bg-game-devdle');
    expect(bar('X')).toHaveTextContent('hoy');
    expect(bar('3')).not.toHaveTextContent('hoy');
  });

  it('hides the distribution without stats (TS-56)', () => {
    render(<Result {...base({ gameStats: null })} />);
    expect(screen.queryByRole('heading', { level: 2, name: /tus intentos/ })).toBeNull();
    expect(screen.getByText('PARSER')).toBeInTheDocument();
  });

  it('survives played = 0 with null win_rate (TS-57)', () => {
    const stats = {
      ...GAME_STATS,
      played: 0,
      wins: 0,
      win_rate: null,
      extra: { guesses: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 }, losses: 0 },
    };
    render(<Result {...base({ gameStats: stats })} />);
    const section = screen
      .getByRole('heading', { level: 2, name: /tus intentos/ })
      .closest('section') as HTMLElement;
    expect(
      within(section)
        .getAllByText('0')
        .some((e) => e.tagName === 'B'),
    ).toBe(true);
    expect(within(section).getByText('—')).toBeInTheDocument();
    for (const l of ['1', '2', '3', '4', '5', '6', 'X']) {
      expect(bar(l).style.getPropertyValue('--w')).toBe('8%');
    }
  });

  it('reveals the word in the game accent', () => {
    render(<Result {...base()} />);
    const card = screen
      .getByRole('heading', { level: 2, name: /palabra del día/ })
      .closest('section');
    const word = Array.from(card?.querySelectorAll('p') ?? []).find((p) =>
      p.classList.contains('text-title-panel'),
    );
    expect(word).toHaveClass('text-game-devdle');
  });

  it('renders slots and layout (TS-58)', () => {
    const { container } = render(
      <Result {...base({ aside: <p>rachas</p>, notices: <p>nota</p>, footer: <p>salidas</p> })} />,
    );
    const banner = screen.getByRole('heading', { level: 1 });
    const nota = screen.getByText('nota');
    expect(banner.compareDocumentPosition(nota) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const cols = (container.firstElementChild as HTMLElement).children;
    expect(cols[0]).toHaveClass('basis-140', 'grow-999');
    // Veredicto y salidas van en la columna principal: la lateral queda como sección aparte.
    expect(cols[0]).toContainElement(banner);
    expect((cols[0] as HTMLElement).lastElementChild).toHaveTextContent('salidas');
    expect(cols[1]).toHaveClass('basis-75', 'max-w-devdle-aside');
    const aside = cols[1] as HTMLElement;
    expect(aside.lastElementChild).toHaveTextContent('rachas');
    expect(within(aside).getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('throws on invalid result (TS-59)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Result {...base({ result: { win: true } })} />)).toThrow(ZodError);
    spy.mockRestore();
  });

  it('has no axe violations (TS-60)', async () => {
    const win = render(<Result {...base()} />);
    expect(await axe(win.container)).toHaveNoViolations();
    win.unmount();
    const loss = render(<Result {...base({ result: RESULT_LOSS })} />);
    expect(await axe(loss.container)).toHaveNoViolations();
  });
});
