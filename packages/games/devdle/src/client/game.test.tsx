// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { Game } from './game';
import {
  GUESS_BRANCH,
  GUESS_PARSER,
  GUESS_SERVER,
  PUBLIC_VIEW_12,
  PUBLIC_VIEW_6,
  GAME_STATS,
  STATE_2,
} from './test-fixtures';
import { makeT } from './test-utils';
import type { GameProps } from './types';

const base = (over: Partial<GameProps> = {}): GameProps => ({
  number: 128,
  locale: 'es',
  t: makeT('es'),
  publicView: PUBLIC_VIEW_6,
  state: STATE_2,
  onMove: vi.fn(),
  pending: false,
  moveError: null,
  ...over,
});

const row = (n: number) => screen.getAllByRole('row')[n - 1] as HTMLElement;
const labels = (n: number) =>
  within(row(n))
    .getAllByRole('gridcell')
    .map((c) => c.getAttribute('aria-label'));
const hint = () => screen.getAllByRole('status')[0] as HTMLElement;

describe('Game', () => {
  it('resumes the board (TS-12, TS-13, TS-14)', () => {
    render(<Game {...base()} />);
    expect(
      screen.getByRole('grid', { name: 'Tablero: 6 intentos de 6 letras' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(6);
    expect(screen.getAllByRole('gridcell')).toHaveLength(36);
    expect(labels(1)).toEqual([
      'B, no está',
      'R, en otra posición',
      'A, en otra posición',
      'N, no está',
      'C, no está',
      'H, no está',
    ]);
    expect(labels(2)).toContain('R, correcta');
    expect(labels(4)).toEqual(Array(6).fill('casilla, vacía'));
    expect(screen.getByText('término técnico · 6 letras · intento 3 de 6')).toBeInTheDocument();
    const correct = screen.getAllByRole('gridcell', { name: 'R, correcta' })[0] as HTMLElement;
    expect(correct).toHaveTextContent('✓');
    expect(correct.querySelector('[aria-hidden="true"]')).not.toBeNull();
    const present = screen.getAllByRole('gridcell', {
      name: 'R, en otra posición',
    })[0] as HTMLElement;
    expect(present).toHaveTextContent('~');
    expect(present).toHaveClass('border-dashed');
    expect(screen.getAllByRole('gridcell', { name: 'B, no está' })[0]).toHaveTextContent('✗');
    expect(screen.getAllByRole('gridcell', { name: 'casilla, vacía' })[0]).toHaveTextContent('');
  });

  it('scales columns for 6 and 12 letters (TS-15, TS-16)', () => {
    const { unmount } = render(<Game {...base()} />);
    const grid = screen.getByRole('grid');
    expect(grid.style.getPropertyValue('--board-cols')).toBe('repeat(6, minmax(0, 1fr))');
    expect(grid.style.getPropertyValue('--board-max')).toBe('calc(6 * 64px + 5 * 8px)');
    expect(grid).toHaveClass('@container', 'gap-2');
    expect(row(1)).toHaveClass('grid-cols-(--board-cols)');
    unmount();
    render(<Game {...base({ publicView: PUBLIC_VIEW_12, state: { guesses: [] } })} />);
    expect(screen.getAllByRole('gridcell')).toHaveLength(72);
    const g12 = screen.getByRole('grid');
    expect(g12.style.getPropertyValue('--board-cols')).toBe('repeat(12, minmax(0, 1fr))');
    expect(g12).toHaveClass('gap-1');
    expect(g12.style.getPropertyValue('--tile-font')).toBe(
      'clamp(10px, calc((100cqi - 44px) / 12 * 0.4375), 28px)',
    );
  });

  it('shows keys with learned state (TS-17)', () => {
    render(<Game {...base()} />);
    expect(screen.getByRole('button', { name: 'R, correcta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'A, presente' })).toHaveClass('border-dashed');
    expect(screen.getByRole('button', { name: 'B, descartada' })).toHaveClass('line-through');
    expect(screen.getByRole('button', { name: 'Q' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Borrar' })).toBeInTheDocument();
  });

  it('shows categories and legend (TS-18, TS-19)', () => {
    render(<Game {...base()} />);
    expect(
      screen.getByRole('heading', { level: 2, name: /pista de categoría/ }),
    ).toBeInTheDocument();
    const items = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(items).toEqual(
      expect.arrayContaining([
        'lenguajes',
        'git',
        'bases de datos',
        'redes',
        'linux',
        'apis',
        'seguridad',
        'ingeniería de software',
      ]),
    );
    expect(
      screen.getByText('La categoría y la definición se revelan al terminar.'),
    ).toBeInTheDocument();
    const legend = screen
      .getByRole('heading', { level: 2, name: /cómo se juega/ })
      .closest('section');
    expect(legend).toHaveAttribute('id', 'game-help');
    expect(legend).toHaveTextContent('Letra correcta en el lugar correcto.');
    expect(legend).toHaveTextContent('Está en la palabra, pero en otra posición.');
    expect(legend).toHaveTextContent('No está en la palabra.');
  });

  it('types with the physical keyboard (TS-20, TS-22, TS-23, TS-28)', async () => {
    const user = userEvent.setup();
    render(<Game {...base()} />);
    await user.keyboard('par');
    expect(labels(3).slice(0, 4)).toEqual([
      'P, escrita',
      'A, escrita',
      'R, escrita',
      'casilla, vacía',
    ]);
    await user.keyboard('{Backspace}');
    expect(labels(3).slice(0, 3)).toEqual(['P, escrita', 'A, escrita', 'casilla, vacía']);
    await user.click(screen.getByRole('button', { name: 'Borrar' }));
    expect(labels(3)[0]).toBe('P, escrita');
    expect(labels(3)[1]).toBe('casilla, vacía');
  });

  it('ignores more than length letters without hint (TS-22)', async () => {
    const user = userEvent.setup();
    render(<Game {...base({ state: { guesses: [] } })} />);
    await user.keyboard('PARSERS');
    expect(labels(1)).toEqual(['P', 'A', 'R', 'S', 'E', 'R'].map((l) => `${l}, escrita`));
    expect(hint()).toHaveTextContent('');
  });

  it('ignores modifier shortcuts (TS-28)', async () => {
    const user = userEvent.setup();
    render(<Game {...base()} />);
    await user.keyboard('{Control>}r{/Control}');
    expect(labels(3)[0]).toBe('casilla, vacía');
    expect(hint()).toHaveTextContent('');
  });

  it('rejects non A-Z with a hint (TS-21)', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<Game {...base({ onMove })} />);
    await user.keyboard('1á-');
    expect(labels(3)[0]).toBe('casilla, vacía');
    expect(hint()).toHaveTextContent('Solo letras de la A a la Z.');
    expect(onMove).not.toHaveBeenCalled();
  });

  it('does not send an incomplete guess (TS-24)', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<Game {...base({ onMove })} />);
    await user.keyboard('PARS{Enter}');
    expect(hint()).toHaveTextContent('Faltan letras: el término tiene 6.');
    expect(onMove).not.toHaveBeenCalled();
    expect(labels(3).slice(0, 4)).toEqual(['P, escrita', 'A, escrita', 'R, escrita', 'S, escrita']);
  });

  it('sends a complete guess (TS-25, TS-26)', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    const { unmount } = render(<Game {...base({ onMove })} />);
    await user.keyboard('parser{Enter}');
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith({ guess: 'PARSER' });
    unmount();
    const onMove2 = vi.fn();
    render(<Game {...base({ onMove: onMove2, state: { guesses: [] } })} />);
    for (const l of 'PARSER') {
      await user.click(screen.getByRole('button', { name: l }));
    }
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(onMove2).toHaveBeenCalledTimes(1);
    expect(onMove2).toHaveBeenCalledWith({ guess: 'PARSER' });
  });

  it('Enter on a focused key does not double submit (TS-27)', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<Game {...base({ onMove })} />);
    await user.click(screen.getByRole('button', { name: 'Q' }));
    await user.keyboard('{Enter}');
    expect(labels(3).slice(0, 2)).toEqual(['Q, escrita', 'Q, escrita']);
    expect(onMove).not.toHaveBeenCalled();
    expect(hint()).toHaveTextContent('');
  });

  it('blocks input while pending (TS-29)', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    const props = base({ onMove });
    const { rerender } = render(<Game {...props} />);
    await user.keyboard('PARSER');
    rerender(<Game {...props} pending />);
    await user.keyboard('{Enter}a{Backspace}');
    const enter = screen.getByRole('button', { name: 'Enviar' });
    expect(enter).toHaveAttribute('aria-disabled', 'true');
    await user.click(enter);
    expect(onMove).not.toHaveBeenCalled();
    expect(labels(3)).toEqual(['P', 'A', 'R', 'S', 'E', 'R'].map((l) => `${l}, escrita`));
  });

  it('shows move errors and dismisses them on typing (TS-30..TS-33)', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    const props = base({ onMove });
    const { rerender } = render(<Game {...props} />);
    await user.keyboard('PARSEX{Enter}');
    expect(onMove).toHaveBeenCalledTimes(1);
    const err = { code: 'not_in_word_list', message: 'La palabra no está en la lista' };
    rerender(<Game {...props} moveError={err} />);
    expect(hint()).toHaveTextContent('No está en la lista. Probá con otro término.');
    expect(labels(3)).toEqual(['P', 'A', 'R', 'S', 'E', 'X'].map((l) => `${l}, escrita`));
    await user.keyboard('{Backspace}');
    expect(hint()).toHaveTextContent('');
    expect(labels(3)[5]).toBe('casilla, vacía');
    rerender(<Game {...props} moveError={{ code: 'rate_limited', message: 'x' }} />);
    expect(hint()).toHaveTextContent('Vas muy rápido. Esperá unos segundos y probá de nuevo.');
    rerender(<Game {...props} moveError={{ code: 'invalid_move', message: 'Jugada inválida' }} />);
    expect(hint()).toHaveTextContent('Jugada inválida');
  });

  it('clears the row and announces an applied guess (TS-34, TS-35)', async () => {
    const user = userEvent.setup();
    const props = base();
    const { container, rerender } = render(<Game {...props} />);
    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent('');
    await user.keyboard('PARSER');
    rerender(<Game {...props} state={{ guesses: [GUESS_BRANCH, GUESS_SERVER, GUESS_PARSER] }} />);
    expect(labels(3)).toEqual(
      Array(6)
        .fill(null)
        .map((_, i) => `${'PARSER'[i]}, correcta`),
    );
    expect(labels(4)).toEqual(Array(6).fill('casilla, vacía'));
    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent(
      'P, correcta, A, correcta, R, correcta, S, correcta, E, correcta y R, correcta',
    );
  });

  it('locked hides the keyboard and ignores input (TS-36)', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<Game {...base({ locked: true, onMove })} />);
    expect(screen.queryByRole('group', { name: 'Teclado' })).toBeNull();
    await user.keyboard('abc{Enter}');
    expect(onMove).not.toHaveBeenCalled();
    expect(labels(3)[0]).toBe('casilla, vacía');
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('places notices after the prompt and before the grid (TS-37)', () => {
    render(<Game {...base({ notices: <p>aviso</p> })} />);
    const notice = screen.getByText('aviso');
    const prompt = screen.getByText(/término técnico/);
    const grid = screen.getByRole('grid');
    expect(prompt.compareDocumentPosition(notice) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(notice.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('lays out board column and aside (TS-38)', () => {
    const { container } = render(<Game {...base()} />);
    const page = container.firstElementChild as HTMLElement;
    // Patrón común: comentario arriba del h1, alineado a la izquierda y a ancho completo.
    const titleBlock = page.firstElementChild as HTMLElement;
    expect(titleBlock).not.toHaveClass('text-center', 'items-center');
    expect(titleBlock.firstElementChild).toHaveTextContent(/término técnico/);
    expect(titleBlock.lastElementChild).toBe(screen.getByRole('heading', { level: 1 }));
    const root = page.lastElementChild as HTMLElement;
    expect(root).toHaveClass('flex', 'flex-wrap', 'gap-10');
    const col = root.firstElementChild as HTMLElement;
    expect(col).toHaveClass('basis-140', 'grow-999', 'min-w-0');
    expect(col).toHaveAttribute('aria-labelledby', screen.getByRole('heading', { level: 1 }).id);
    expect(within(col).getByRole('group', { name: 'Teclado' })).toHaveClass('max-w-keyboard');
    const aside = container.querySelector('aside') as HTMLElement;
    expect(aside).toHaveClass('basis-75', 'grow', 'max-w-devdle-aside', 'min-w-0');
    const heads = within(aside)
      .getAllByRole('heading', { level: 2 })
      .map((h) => h.textContent);
    // Orden del prototipo: cómo se juega, categoría y, si hay stats, tus intentos.
    expect(heads[0]).toMatch(/cómo se juega/);
    expect(heads[1]).toMatch(/pista de categoría/);
    expect(heads).toHaveLength(2);
  });

  it('titles the game like the prototype', () => {
    render(<Game {...base()} />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Adiviná el término del día' }),
    ).toBeInTheDocument();
  });

  it('shows "tus intentos" in the aside while playing when there are stats', () => {
    const { container } = render(<Game {...base({ gameStats: GAME_STATS })} />);
    const aside = container.querySelector('aside') as HTMLElement;
    const heads = within(aside)
      .getAllByRole('heading', { level: 2 })
      .map((h) => h.textContent);
    expect(heads[2]).toMatch(/tus intentos/);
    expect(within(aside).getByText('racha 3')).toBeInTheDocument();
    // Partida en curso: ninguna barra se marca como la de hoy.
    expect(within(aside).queryByText(/· hoy/)).toBeNull();
  });

  it('throws on invalid publicView (TS-39)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Game {...base({ publicView: { length: 3 } })} />)).toThrow(ZodError);
    spy.mockRestore();
  });

  it('renders in English (TS-40)', () => {
    render(<Game {...base({ locale: 'en', t: makeT('en') })} />);
    expect(screen.getByText('tech term · 6 letters · try 3 of 6')).toBeInTheDocument();
    expect(screen.getByText('software engineering')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    expect(screen.getAllByRole('gridcell', { name: 'R, correct' }).length).toBeGreaterThan(0);
  });

  it('has no axe violations (TS-41)', async () => {
    const user = userEvent.setup();
    const { container, unmount } = render(<Game {...base()} />);
    expect(await axe(container)).toHaveNoViolations();
    await user.keyboard('PAR1');
    expect(await axe(container)).toHaveNoViolations();
    unmount();
    const locked = render(<Game {...base({ locked: true })} />);
    expect(await axe(locked.container)).toHaveNoViolations();
  });

  it('completes a whole game with the keyboard only (TS-42)', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    const props = base({ onMove, state: { guesses: [] } });
    const { rerender } = render(<Game {...props} />);
    await user.keyboard('branch{Enter}');
    rerender(<Game {...props} state={{ guesses: [GUESS_BRANCH] }} />);
    await user.keyboard('parser{Enter}');
    rerender(<Game {...props} state={{ guesses: [GUESS_BRANCH, GUESS_PARSER] }} />);
    expect(onMove.mock.calls).toEqual([[{ guess: 'BRANCH' }], [{ guess: 'PARSER' }]]);
    expect(labels(2)).toEqual(
      Array(6)
        .fill(null)
        .map((_, i) => `${'PARSER'[i]}, correcta`),
    );
  });

  describe('letter hint', () => {
    const hintButton = () => screen.getByRole('button', { name: /Pista: revelar una letra/ });

    it('sits in the aside right above Rendirse, just as wide', () => {
      render(<Game {...base()} />);
      expect(screen.queryByRole('heading', { name: /pista de letra/ })).toBeNull();
      const surrender = screen.getByRole('button', { name: /Rendirse/ });
      expect(hintButton().closest('aside')).toContainElement(surrender);
      expect(hintButton().nextElementSibling).toBe(surrender);
      expect(hintButton()).toHaveClass('w-full');
    });

    it('picking marks the free cells of the current row and tapping one sends the hint', async () => {
      const onMove = vi.fn();
      const user = userEvent.setup();
      render(<Game {...base({ onMove })} />);
      await user.click(hintButton());
      expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(hint()).toHaveTextContent('tocá una casilla de la fila actual');
      // SERVER acertó las posiciones 3, 5 y 6: no se pueden elegir.
      const cells = within(row(3))
        .getAllByRole('button')
        .map((b) => b.getAttribute('aria-label'));
      expect(cells).toEqual(['Revelar la letra 1', 'Revelar la letra 2', 'Revelar la letra 4']);
      await user.click(within(row(3)).getByRole('button', { name: 'Revelar la letra 2' }));
      expect(onMove).toHaveBeenCalledWith({ hint: 1 });
      expect(within(row(3)).queryAllByRole('button')).toHaveLength(0);
    });

    it('Esc, Cancelar or typing cancel the picking without a move', async () => {
      const onMove = vi.fn();
      const user = userEvent.setup();
      render(<Game {...base({ onMove })} />);
      await user.click(hintButton());
      await user.keyboard('{Escape}');
      expect(within(row(3)).queryAllByRole('button')).toHaveLength(0);
      await user.click(hintButton());
      await user.click(screen.getByRole('button', { name: 'Cancelar' }));
      expect(within(row(3)).queryAllByRole('button')).toHaveLength(0);
      await user.click(hintButton());
      await user.keyboard('x');
      expect(within(row(3)).queryAllByRole('button')).toHaveLength(0);
      expect(onMove).not.toHaveBeenCalled();
    });

    it('once used shows the revealed letter, disabled, and the guide in the active row', () => {
      render(<Game {...base({ state: { ...STATE_2, hint: { position: 5, letter: 'R' } } })} />);
      const used = screen.getByRole('button', { name: 'Pista usada: la letra 6 es R' });
      expect(used).toHaveAttribute('aria-disabled', 'true');
      expect(used).toHaveTextContent('Letra 6: R');
      expect(labels(3)[5]).toBe('R, pista');
    });

    it('typing over the hinted cell replaces the guide', async () => {
      render(<Game {...base({ state: { ...STATE_2, hint: { position: 0, letter: 'P' } } })} />);
      expect(labels(3)[0]).toBe('P, pista');
      await userEvent.keyboard('x');
      expect(labels(3)[0]).toBe('X, escrita');
    });

    it('is disabled while a move is pending', async () => {
      render(<Game {...base({ pending: true })} />);
      expect(hintButton()).toHaveAttribute('aria-disabled', 'true');
      await userEvent.click(hintButton());
      expect(within(row(3)).queryAllByRole('button')).toHaveLength(0);
    });
  });

  describe('surrender', () => {
    it('asks for confirmation and then sends the give up move', async () => {
      const onMove = vi.fn();
      const user = userEvent.setup();
      render(<Game {...base({ onMove })} />);
      await user.click(screen.getByRole('button', { name: /Rendirse/ }));
      const dialog = screen.getByRole('alertdialog', { name: '¿Rendirte?' });
      expect(dialog).toHaveTextContent('2 de 6 intentos usados');
      expect(within(dialog).getByRole('button', { name: 'Seguir jugando' })).toHaveFocus();
      await user.click(within(dialog).getByRole('button', { name: 'Sí, rendirme' }));
      expect(onMove).toHaveBeenCalledWith({ give_up: true });
    });

    it('keeps playing closes the dialog without a move', async () => {
      const onMove = vi.fn();
      const user = userEvent.setup();
      render(<Game {...base({ onMove })} />);
      await user.click(screen.getByRole('button', { name: /Rendirse/ }));
      await user.click(screen.getByRole('button', { name: 'Seguir jugando' }));
      expect(screen.queryByRole('alertdialog')).toBeNull();
      expect(onMove).not.toHaveBeenCalled();
    });

    it('the physical keyboard does not type while the dialog is open', async () => {
      const user = userEvent.setup();
      render(<Game {...base()} />);
      await user.click(screen.getByRole('button', { name: /Rendirse/ }));
      await user.keyboard('x');
      expect(labels(3)[0]).toBe('casilla, vacía');
    });

    it('is a full-width error-outline button, hidden when locked', () => {
      const { unmount } = render(<Game {...base()} />);
      const btn = screen.getByRole('button', { name: /Rendirse/ });
      expect(btn).toHaveClass('border-status-error-border', 'w-full');
      expect(btn.querySelector('[aria-hidden="true"]')).toHaveTextContent('⚑');
      unmount();
      render(<Game {...base({ locked: true })} />);
      expect(screen.queryByRole('button', { name: /Rendirse/ })).toBeNull();
    });
  });
});
