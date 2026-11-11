// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { Game } from './game';
import { makeT } from './test-utils';
import type { GameProps } from './types';
import {
  FEEDBACK_ALREADY,
  FEEDBACK_DOCKER,
  FEEDBACK_NOT_A_WORD,
  publicViewEn,
  PUBLIC_VIEW_0,
  PUBLIC_VIEW_3,
  STATE_0,
  STATE_3,
  STATE_4,
} from './test-fixtures';

const D = 'D, fila 4, columna 3, libre';
const R = 'R, fila 4, columna 8, libre';

const base = (over: Partial<GameProps> = {}): GameProps => ({
  number: 8,
  locale: 'es',
  t: makeT('es'),
  publicView: PUBLIC_VIEW_3,
  state: STATE_3,
  feedback: null,
  onMove: vi.fn(),
  pending: false,
  moveError: null,
  ...over,
});
const fresh = (over: Partial<GameProps> = {}) =>
  base({ publicView: PUBLIC_VIEW_0, state: STATE_0, ...over });

const cell = (name: string) => screen.getByRole('button', { name });
const live = (container: HTMLElement) => container.querySelectorAll('[aria-live] > p');

describe('Game board (accessibility)', () => {
  it('is a 12x12 grid with a single tab stop (TS-14)', () => {
    render(<Game {...base()} />);
    const grid = screen.getByRole('grid', { name: 'Grilla de 12 por 12' });
    expect(within(grid).getAllByRole('row')).toHaveLength(12);
    expect(within(grid).getAllByRole('gridcell')).toHaveLength(144);
    const buttons = within(grid).getAllByRole('button');
    expect(buttons).toHaveLength(144);
    expect(buttons.filter((b) => b.tabIndex === 0)).toHaveLength(1);
    expect(cell('M, fila 1, columna 1, encontrada').tabIndex).toBe(0);
  });

  it('labels cells and backs found with glyph and weight (TS-15)', () => {
    render(<Game {...base()} />);
    expect(cell(D)).toBeInTheDocument();
    const found = screen.getAllByRole('button', { name: /, encontrada$/ });
    expect(found).toHaveLength(16);
    for (const b of found) {
      expect(b).toHaveClass('bg-game-grep-grid', 'font-extrabold');
      expect(b.querySelector('[aria-hidden="true"]')).toHaveTextContent('✓');
    }
    expect(cell(D).querySelector('[aria-hidden]')).toBeNull();
  });

  it('scales to 320px without horizontal scroll (TS-16)', () => {
    const { container } = render(<Game {...base()} />);
    const wrapper = screen.getByRole('grid').parentElement as HTMLElement;
    expect(wrapper).toHaveClass('@container', 'w-full', 'max-w-163.5');
    expect(wrapper.style.getPropertyValue('--board-pad')).toBe('clamp(6px, 2.5cqi, 16px)');
    expect(wrapper.style.getPropertyValue('--cell-font')).toBe(
      'clamp(9px, calc((100cqi - 2 * var(--board-pad) - 46px) / 12 * 0.375), 18px)',
    );
    expect(screen.getByRole('grid')).toHaveClass('grid-cols-12', 'gap-1', 'p-(--board-pad)');
    for (const gc of screen.getAllByRole('gridcell')) expect(gc).toHaveClass('aspect-square');
    expect(container.querySelector('.overflow-x-auto')).toBeNull();
  });
});

describe('Game two-tap selection', () => {
  it('first tap marks the start (TS-17)', async () => {
    const onMove = vi.fn();
    const { container } = render(<Game {...fresh({ onMove })} />);
    await userEvent.setup().click(cell(D));
    const start = cell('D, fila 4, columna 3, inicio');
    expect(start).toHaveClass('bg-game-grep-grid-selected-bg');
    expect(screen.getByText('> ahora tocá la última letra')).toBeInTheDocument();
    expect(onMove).not.toHaveBeenCalled();
    expect(live(container)).toHaveLength(0);
  });

  it('second tap sends the selection (TS-18)', async () => {
    const onMove = vi.fn();
    render(<Game {...fresh({ onMove })} />);
    const user = userEvent.setup();
    await user.click(cell(D));
    await user.click(cell(R));
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith({
      type: 'select',
      from: { row: 3, col: 2 },
      to: { row: 3, col: 7 },
    });
    expect(cell(D)).toBeInTheDocument();
    expect(screen.getByText('> tocá la primera letra de una palabra')).toBeInTheDocument();
  });

  it('tapping the start again cancels (TS-19)', async () => {
    const onMove = vi.fn();
    render(<Game {...fresh({ onMove })} />);
    const user = userEvent.setup();
    await user.click(cell(D));
    await user.click(cell('D, fila 4, columna 3, inicio'));
    expect(onMove).not.toHaveBeenCalled();
    expect(cell(D)).toBeInTheDocument();
    expect(screen.getByText('> tocá la primera letra de una palabra')).toBeInTheDocument();
  });

  it('Escape cancels (TS-20)', async () => {
    const onMove = vi.fn();
    render(<Game {...fresh({ onMove })} />);
    const user = userEvent.setup();
    await user.click(cell(D));
    await user.keyboard('{Escape}');
    expect(cell(D)).toBeInTheDocument();
    expect(onMove).not.toHaveBeenCalled();
  });

  it('sends a reversed selection as is (TS-21)', async () => {
    const onMove = vi.fn();
    render(<Game {...fresh({ onMove })} />);
    const user = userEvent.setup();
    await user.click(cell(R));
    await user.click(cell(D));
    expect(onMove).toHaveBeenCalledWith({
      type: 'select',
      from: { row: 3, col: 7 },
      to: { row: 3, col: 2 },
    });
  });

  it('is playable with the keyboard alone (TS-22)', async () => {
    const onMove = vi.fn();
    render(<Game {...fresh({ onMove })} />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowRight}{ArrowRight}');
    await user.keyboard('{Enter}');
    expect(cell('D, fila 4, columna 3, inicio')).toBeInTheDocument();
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{Enter}');
    expect(document.activeElement).toHaveAccessibleName(/^R, fila 4, columna 8/);
    expect(onMove).toHaveBeenCalledWith({
      type: 'select',
      from: { row: 3, col: 2 },
      to: { row: 3, col: 7 },
    });
  });

  it('Space marks the start like Enter (TS-23)', async () => {
    render(<Game {...fresh()} />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowRight}{ArrowRight}');
    await user.keyboard(' ');
    expect(cell('D, fila 4, columna 3, inicio')).toBeInTheDocument();
  });

  it('roving tabindex follows focus (TS-24)', async () => {
    render(<Game {...fresh()} />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard('{ArrowRight}');
    const e = screen.getByRole('button', { name: /^E, fila 1, columna 2/ });
    expect(e).toHaveFocus();
    expect(e.tabIndex).toBe(0);
    expect(screen.getByRole('button', { name: /^M, fila 1, columna 1/ }).tabIndex).toBe(-1);
    await user.tab();
    expect(e).not.toHaveFocus();
    expect(screen.getByRole('button', { name: 'Rendirse' })).toBeInTheDocument();
  });

  it('pending blocks input (TS-25)', async () => {
    const onMove = vi.fn();
    render(<Game {...fresh({ onMove, pending: true })} />);
    await userEvent.setup().click(cell(D));
    expect(cell(D)).toBeInTheDocument();
    expect(onMove).not.toHaveBeenCalled();
    expect(screen.getByRole('grid')).toHaveAttribute('aria-disabled', 'true');
  });

  it('locked blocks input and hides Rendirse (TS-26)', async () => {
    const onMove = vi.fn();
    render(<Game {...fresh({ onMove, locked: true, notices: <p>anulado</p> })} />);
    const user = userEvent.setup();
    await user.click(cell(D));
    await user.click(cell(R));
    expect(onMove).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /Rendirse/ })).toBeNull();
    const order = [
      screen.getByText(/tocá la primera y la última letra de cada palabra/),
      screen.getByText('anulado'),
      screen.getByText('encontradas'),
    ];
    expect(
      order[0]!.compareDocumentPosition(order[1]!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      order[1]!.compareDocumentPosition(order[2]!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

describe('Game feedback', () => {
  it('shows the counter without a clock (TS-27)', () => {
    const { container } = render(<Game {...base()} />);
    // Contador N/8 en el encabezado de la lista, en el color del juego; «encontradas» para lectores.
    const value = screen.getByText('3/8');
    expect(value).toHaveClass('text-game-grep-grid', 'font-bold');
    expect(
      screen.getByRole('heading', { level: 2, name: 'palabras de hoy' }).parentElement,
    ).toContainElement(value);
    expect(screen.getByText('encontradas')).toHaveClass('sr-only');
    expect(container.textContent).not.toMatch(/\d\d:\d\d/);
    expect(value.closest('[role="status"],[aria-live]')).toBeNull();
  });

  it('applies feedback.found (TS-28)', () => {
    const props = base();
    const { container, rerender } = render(<Game {...props} />);
    rerender(<Game {...props} state={STATE_4} feedback={FEEDBACK_DOCKER} />);
    const row = screen.getByText('DOCKER').closest('li') as HTMLElement;
    expect(screen.getByText('DOCKER')).toHaveClass('line-through');
    expect(within(row).getByText('encontrada')).toHaveClass('sr-only');
    expect(within(row).getByText('definición de DOCKER')).toBeInTheDocument();
    expect(screen.getByText('4/8')).toBeInTheDocument();
    expect(screen.getAllByText('> DOCKER encontrada · 4/8')).toHaveLength(2);
    for (const col of [2, 3, 4, 5, 6, 7]) {
      expect(
        screen.getByRole('button', {
          name: new RegExp(`, fila 4, columna ${col + 1}, encontrada$`),
        }),
      ).toBeInTheDocument();
    }
    const nodes = live(container);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toHaveTextContent('> DOCKER encontrada · 4/8');
  });

  it('feedback ahead of the state still counts (TS-29)', () => {
    const props = base();
    const { rerender } = render(<Game {...props} />);
    rerender(<Game {...props} feedback={FEEDBACK_DOCKER} />);
    expect(screen.getByText('4/8')).toBeInTheDocument();
    expect(screen.getByText('definición de DOCKER')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^D, fila 4, columna 3, encontrada/ }),
    ).toBeInTheDocument();
  });

  it('ignores the feedback present at mount (TS-30)', () => {
    const { container } = render(<Game {...fresh({ feedback: FEEDBACK_DOCKER })} />);
    expect(screen.getByText('0/8')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /encontrada$/ })).toBeNull();
    expect(screen.queryByText('definición de DOCKER')).toBeNull();
    expect(live(container)).toHaveLength(0);
  });

  it('does not reprocess the same identity (TS-31)', () => {
    const props = base();
    const { container, rerender } = render(<Game {...props} />);
    rerender(<Game {...props} state={STATE_4} feedback={FEEDBACK_DOCKER} />);
    rerender(<Game {...props} state={STATE_4} feedback={FEEDBACK_DOCKER} />);
    expect(live(container)).toHaveLength(1);
  });

  it('not_a_word is quiet (TS-32)', () => {
    const props = base();
    const { container, rerender } = render(<Game {...props} />);
    rerender(<Game {...props} feedback={FEEDBACK_NOT_A_WORD} />);
    const hint = screen.getAllByText('> no es una palabra de la lista, probá de nuevo')[0]!;
    expect(hint).toHaveClass('text-text-dim');
    expect(hint.className).not.toMatch(/error/);
    expect(screen.getByText('3/8')).toBeInTheDocument();
    expect(live(container)).toHaveLength(1);
  });

  it('announces a repeated not_a_word again (TS-33)', () => {
    const props = base();
    const { container, rerender } = render(<Game {...props} />);
    rerender(<Game {...props} feedback={FEEDBACK_NOT_A_WORD} />);
    const first = live(container)[0];
    rerender(<Game {...props} feedback={{ found: false, reason: 'not_a_word' }} />);
    const second = live(container)[0];
    expect(live(container)).toHaveLength(1);
    expect(second).not.toBe(first);
    expect(second).toHaveTextContent('> no es una palabra de la lista, probá de nuevo');
  });

  it('already_found says nothing (TS-34)', () => {
    const props = base();
    const { container, rerender } = render(<Game {...props} />);
    rerender(<Game {...props} feedback={FEEDBACK_ALREADY} />);
    expect(screen.getByText('> tocá la primera letra de una palabra')).toBeInTheDocument();
    expect(screen.getByText('3/8')).toBeInTheDocument();
    expect(live(container)).toHaveLength(0);
  });

  it.each([
    [
      { code: 'invalid_move', message: 'Jugada inválida' },
      '> las palabras se marcan de la primera a la última letra, hacia adelante',
    ],
    [
      { code: 'rate_limited', message: 'Demasiadas solicitudes' },
      '> vas muy rápido. Esperá unos segundos y probá de nuevo',
    ],
    [{ code: 'validation_error', message: 'Datos inválidos' }, '> Datos inválidos'],
  ])('moveError %j (TS-35, TS-36, TS-37)', (moveError, expected) => {
    const props = base();
    const { container, rerender } = render(<Game {...props} />);
    rerender(<Game {...props} moveError={moveError} />);
    expect(screen.getAllByText(expected)).toHaveLength(2);
    expect(screen.getByText('3/8')).toBeInTheDocument();
    expect(live(container)).toHaveLength(1);
  });

  it('the hint is replaced when tapping (TS-38)', async () => {
    const props = fresh();
    const { rerender } = render(<Game {...props} />);
    rerender(<Game {...props} feedback={FEEDBACK_NOT_A_WORD} />);
    await userEvent.setup().click(cell(D));
    expect(screen.getByText('> ahora tocá la última letra')).toBeInTheDocument();
  });

  it('throws on an invalid feedback (TS-39)', () => {
    const props = base();
    const { rerender } = render(<Game {...props} />);
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => rerender(<Game {...props} feedback={{ found: 'yes' }} />)).toThrow(ZodError);
    spy.mockRestore();
  });
});

describe('Game words and locale', () => {
  it('resumes with definitions (TS-40)', () => {
    render(<Game {...base()} />);
    expect(screen.getByRole('heading', { level: 2, name: /palabras de hoy/ })).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items.map((li) => li.querySelector('span')?.textContent)).toEqual([
      'CACHE',
      'DOCKER',
      'KERNEL',
      'KUBERNETES',
      'MERGE',
      'OAUTH',
      'PYTHON',
      'REDIS',
    ]);
    for (const w of ['MERGE', 'CACHE', 'PYTHON']) {
      const li = screen.getByText(w).closest('li') as HTMLElement;
      expect(screen.getByText(w)).toHaveClass('line-through');
      expect(within(li).getByText(`definición de ${w}`)).toBeInTheDocument();
    }
    expect(
      within(screen.getByText('DOCKER').closest('li')!).getByText('6 letras'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByText('KUBERNETES').closest('li')!).getByText('10 letras'),
    ).toBeInTheDocument();
  });

  it('shows no spoilers in the initial view (TS-41)', () => {
    const { container } = render(<Game {...fresh()} />);
    expect(container.textContent).not.toContain('definición de');
    expect(screen.queryByRole('button', { name: /encontrada$/ })).toBeNull();
    expect(container.innerHTML).not.toContain('00000000-0000');
  });

  it('switches language keeping what was learned (TS-42, TS-43)', () => {
    const props = base();
    const { rerender } = render(<Game {...props} />);
    rerender(<Game {...props} state={STATE_4} feedback={FEEDBACK_DOCKER} />);
    rerender(
      <Game
        {...props}
        locale="en"
        t={makeT('en')}
        state={STATE_4}
        feedback={FEEDBACK_DOCKER}
        publicView={publicViewEn(['MERGE', 'CACHE', 'PYTHON', 'DOCKER'])}
      />,
    );
    for (const w of ['MERGE', 'CACHE', 'PYTHON', 'DOCKER']) {
      expect(screen.getByText(`definition of ${w}`)).toBeInTheDocument();
    }
    expect(screen.queryByText('definición de DOCKER')).toBeNull();
    expect(screen.getByText('4/8')).toBeInTheDocument();
    expect(
      screen.getAllByRole('listitem').map((li) => li.querySelector('span')?.textContent),
    ).toEqual(['CACHE', 'DOCKER', 'KERNEL', 'KUBERNETES', 'MERGE', 'OAUTH', 'PYTHON', 'REDIS']);
    expect(screen.getAllByRole('button')).toHaveLength(144 + 1);
    expect(screen.getAllByRole('button', { name: /, found$/ })).toHaveLength(22);
    expect(screen.getByText('> tap the first letter of a word')).toBeInTheDocument();
  });

  it('keeps the learned definition before the refetch (TS-43)', () => {
    const props = base();
    const { rerender } = render(<Game {...props} />);
    rerender(<Game {...props} state={STATE_4} feedback={FEEDBACK_DOCKER} />);
    rerender(
      <Game
        {...props}
        locale="en"
        t={makeT('en')}
        state={STATE_4}
        feedback={FEEDBACK_DOCKER}
        publicView={publicViewEn(['MERGE', 'CACHE', 'PYTHON'])}
      />,
    );
    expect(screen.getByText('definición de DOCKER')).toBeInTheDocument();
    expect(screen.getByText('definition of MERGE')).toBeInTheDocument();
  });
});

describe('Game surrender (O-04)', () => {
  const open = async (props: GameProps = base()) => {
    const user = userEvent.setup();
    const utils = render(<Game {...props} />);
    await user.click(screen.getByRole('button', { name: /Rendirse/ }));
    return { user, ...utils };
  };

  it('opens the alertdialog with the current count (TS-44)', async () => {
    const { container } = await open();
    const dialog = screen.getByRole('alertdialog', { name: '¿Rendirte?' });
    expect(dialog).toHaveAccessibleDescription(
      'Vas a cerrar la partida con 3/8. Cuenta para tu racha y te mostramos las palabras que faltan. No se puede deshacer.',
    );
    expect(screen.getByRole('button', { name: 'Seguir jugando' })).toHaveFocus();
    expect(container.querySelector('[inert]')).not.toBeNull();
  });

  it('Seguir jugando closes and returns focus (TS-45)', async () => {
    const onMove = vi.fn();
    const { user, container } = await open(base({ onMove }));
    await user.click(screen.getByRole('button', { name: 'Seguir jugando' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(onMove).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Rendirse/ })).toHaveFocus();
    expect(container.querySelector('[inert]')).toBeNull();
  });

  it('Escape, close icon and overlay close it (TS-46)', async () => {
    const onMove = vi.fn();
    const { user } = await open(base({ onMove }));
    const trigger = () => screen.getByRole('button', { name: /Rendirse/ });
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(trigger()).toHaveFocus();
    await user.click(trigger());
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(trigger()).toHaveFocus();
    await user.click(trigger());
    await user.click(screen.getByRole('presentation'));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(trigger()).toHaveFocus();
    expect(onMove).not.toHaveBeenCalled();
  });

  it('traps focus (TS-47)', async () => {
    const { user } = await open();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Sí, rendirme' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Seguir jugando' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Sí, rendirme' })).toHaveFocus();
  });

  it('uses the 0/8 copy (TS-48)', async () => {
    await open(fresh());
    expect(screen.getByRole('alertdialog')).toHaveAccessibleDescription(
      'Vas a cerrar la partida con 0/8. Cuenta para tu racha igual y te mostramos las 8 palabras. No se puede deshacer.',
    );
  });

  it('confirms once (TS-49)', async () => {
    const onMove = vi.fn();
    const { user } = await open(base({ onMove }));
    await user.click(screen.getByRole('button', { name: 'Sí, rendirme' }));
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith({ type: 'give_up' });
  });

  it('stays open while in flight (TS-50)', async () => {
    const onMove = vi.fn();
    const props = base({ onMove });
    const { user, rerender } = await open(props);
    await user.click(screen.getByRole('button', { name: 'Sí, rendirme' }));
    rerender(<Game {...props} pending />);
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Cerrando…' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrando…' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Seguir jugando' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(onMove).toHaveBeenCalledTimes(1);
  });

  it('closes when the surrender fails (TS-51)', async () => {
    const props = base();
    const { user, rerender } = await open(props);
    await user.click(screen.getByRole('button', { name: 'Sí, rendirme' }));
    rerender(<Game {...props} pending />);
    rerender(
      <Game {...props} pending={false} moveError={{ code: 'rate_limited', message: 'x' }} />,
    );
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.getByRole('button', { name: /Rendirse/ })).toHaveFocus();
    expect(
      screen.getAllByText('> vas muy rápido. Esperá unos segundos y probá de nuevo')[0],
    ).toBeInTheDocument();
  });

  it('Rendirse is disabled while pending (TS-52)', async () => {
    render(<Game {...base({ pending: true })} />);
    const btn = screen.getByRole('button', { name: /Rendirse/ });
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    await userEvent.setup().click(btn);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });
});

describe('Game layout and style', () => {
  it('Rendirse is an outlined error button (TS-53)', () => {
    render(<Game {...base()} />);
    const btn = screen.getByRole('button', { name: /Rendirse/ });
    expect(btn).toHaveClass('border-status-error-border', 'font-medium', 'rounded-control');
    expect(btn.className).not.toMatch(/bg-status-error/);
    expect(btn.querySelector('[aria-hidden="true"]')).toHaveTextContent('✕');
  });

  it('lays out board 7/12 and word list 5/12 on desktop, one column on mobile (TS-54)', () => {
    const { container } = render(<Game {...base()} />);
    const root = container.querySelector('.lg\\:grid-cols-12') as HTMLElement;
    expect(root).toHaveClass('flex', 'flex-col', 'lg:grid', 'lg:items-start');
    const [main, side] = Array.from(root.children) as HTMLElement[];
    expect(main).toHaveClass('min-w-0', 'lg:col-span-7');
    expect(side).toHaveClass('min-w-0', 'lg:col-span-5');
    const before = (x: Element | null, y: Element | null) =>
      expect(x!.compareDocumentPosition(y!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const h1 = main!.querySelector('h1');
    const help = main!.querySelector('#game-help p');
    const grid = main!.querySelector('[role="grid"]');
    const hint = screen.getByText('> tocá la primera letra de una palabra');
    before(h1, help);
    before(help, grid);
    before(grid, hint);
    expect(main).toContainElement(hint);
    // El contador N/8 vive en el encabezado de la lista (columna lateral), no sobre la grilla.
    expect(side).toContainElement(screen.getByText('3/8'));
    before(side!.querySelector('ul'), screen.getByRole('button', { name: /Rendirse/ }));
    expect(main!.querySelector('h1')).toHaveTextContent('Grep Grid');
    expect(side!.lastElementChild).toHaveTextContent('Rendirse');
  });

  it('shows the prompt in Mono and the instruction in Inter (TS-55)', () => {
    render(<Game {...base()} />);
    expect(screen.getByText("$ grep -o '[A-Z]*' hoy.txt")).toHaveClass(
      'font-mono',
      'text-text-dim',
    );
    expect(screen.getByText('tocá la primera y la última letra de cada palabra')).toHaveClass(
      'font-sans',
    );
  });

  it('has no axe violations (TS-56)', async () => {
    const { container, rerender } = render(<Game {...base()} />);
    expect(await axe(container)).toHaveNoViolations();
    rerender(<Game {...base({ locked: true })} />);
    expect(await axe(container)).toHaveNoViolations();
    rerender(<Game {...base({ locale: 'en', t: makeT('en') })} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations with a start and with O-04 open (TS-56)', async () => {
    const user = userEvent.setup();
    const { container } = render(<Game {...fresh()} />);
    await user.click(cell(D));
    expect(await axe(container)).toHaveNoViolations();
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: /Rendirse/ }));
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
