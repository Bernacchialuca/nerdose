// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { moveSchema } from '../definition/schemas';

import { Game } from './game';
import { PUBLIC_VIEW, PUBLIC_VIEW_OTHER, STATE_EMPTY } from './test-fixtures';
import { makeT } from './test-utils';
import type { GameProps } from './types';

vi.mock('./highlight', () => ({ loadTokenizer: vi.fn(() => new Promise(() => {})) }));

const base = (over: Partial<GameProps> = {}): GameProps => ({
  number: 8,
  locale: 'es',
  t: makeT('es'),
  publicView: PUBLIC_VIEW,
  state: STATE_EMPTY,
  feedback: null,
  onMove: vi.fn(),
  pending: false,
  moveError: null,
  ...over,
});

const LABELS = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(n³)', 'O(2ⁿ)', 'O(n!)'];
const radio = (name: string) => screen.getByRole('radio', { name });
const tab = (name: string) => screen.getByRole('tab', { name });
const firstLine = () =>
  screen.getByRole('tabpanel').querySelector('[data-line="1"] .whitespace-pre')?.textContent;
const confirmButton = (name = 'Confirmar respuesta') => screen.getByRole('button', { name });
const QUESTION = '¿Cuál es la complejidad temporal (peor caso) de f(n)?';
const comment = () =>
  screen.getByText(
    (_, el) => el?.tagName === 'P' && el.textContent === '// peor caso · un solo intento',
  );

describe('Game initial structure (TS-32)', () => {
  it('renders the question, code and 8 options without spoilers', () => {
    const { container } = render(<Game {...base()} />);
    expect(comment()).toBeInTheDocument();
    expect(comment().firstElementChild).toHaveAttribute('aria-hidden', 'true');
    const h1 = screen.getByRole('heading', { level: 1, name: QUESTION });
    expect(within(h1).getByText('f(n)')).toHaveClass('text-game-big-o');
    expect(tab('JavaScript')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { level: 2, name: /tu respuesta/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /cómo se juega/ })).toBeInTheDocument();
    const group = screen.getByRole('radiogroup', { name: 'Complejidad temporal de f(n)' });
    const radios = within(group).getAllByRole('radio');
    expect(radios.map((r) => r.textContent)).toEqual(LABELS);
    for (const r of radios) expect(r).toHaveAttribute('aria-checked', 'false');
    expect(radios[0]).toHaveAttribute('tabindex', '0');
    radios.slice(1).forEach((r) => expect(r).toHaveAttribute('tabindex', '-1'));
    expect(screen.getAllByText('> elegí una de las 8 opciones').length).toBeGreaterThan(0);
    const confirm = confirmButton('Elegí una opción');
    expect(confirm).toHaveAttribute('aria-disabled', 'true');
    expect(confirm).not.toHaveTextContent('→');
    const help = container.querySelector('#game-help') as HTMLElement;
    expect(help).toHaveTextContent('01');
    expect(help).toHaveTextContent('02');
    expect(help).toHaveTextContent('03');
    expect(help).toHaveTextContent('Con teclado: flechas ← → para cambiar de lenguaje');
    for (const spoiler of ['veces', 'Paso a paso', 'correcta', 'nested_loops', 'o_n_log_n']) {
      expect(container.textContent).not.toContain(spoiler);
    }
  });
});

describe('Game language (TS-33)', () => {
  it('starts on codeLanguage', () => {
    render(<Game {...base({ codeLanguage: 'java' })} />);
    expect(tab('Java')).toHaveAttribute('aria-selected', 'true');
    expect(firstLine()).toBe('static int f(int n) {');
    expect(screen.getByText('F.java')).toBeInTheDocument();
  });
});

describe('Game selection', () => {
  it('chooses with click (TS-34)', async () => {
    const user = userEvent.setup();
    render(<Game {...base()} />);
    await user.click(radio('O(n²)'));
    const chosen = radio('O(n²)');
    expect(chosen).toHaveAttribute('aria-checked', 'true');
    expect(chosen).toHaveAttribute('tabindex', '0');
    expect(chosen.querySelector('[aria-hidden="true"]')?.textContent).toContain('●');
    expect(chosen).toHaveClass('bg-game-big-o-tint', 'border-game-big-o');
    expect(radio('O(1)')).toHaveAttribute('aria-checked', 'false');
    const msg = '> elegiste O(n²). Podés cambiarla hasta confirmar.';
    expect(screen.getAllByText(msg)).toHaveLength(2);
    expect(screen.getAllByText(msg).some((el) => el.closest('[aria-live="polite"]') !== null)).toBe(
      true,
    );
    expect(confirmButton()).not.toHaveAttribute('aria-disabled');
    expect(confirmButton()).toHaveTextContent('Confirmar respuesta →');
    await user.click(radio('O(n log n)'));
    expect(radio('O(n²)')).toHaveAttribute('aria-checked', 'false');
    expect(radio('O(n log n)')).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getAllByText('> elegiste O(n log n). Podés cambiarla hasta confirmar.').length,
    ).toBeGreaterThan(0);
  });

  it('is a radiogroup with a single tab stop and arrow navigation (TS-35)', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<Game {...base({ onMove })} />);
    tab('JavaScript').focus();
    await user.tab();
    expect(screen.getByRole('tabpanel')).toHaveFocus();
    await user.tab();
    expect(radio('O(1)')).toHaveFocus();
    await user.tab();
    expect(confirmButton('Elegí una opción')).toHaveFocus();
    await user.tab({ shift: true });
    expect(radio('O(1)')).toHaveFocus();
    await user.keyboard(' ');
    expect(radio('O(1)')).toHaveAttribute('aria-checked', 'true');
    await user.keyboard('{ArrowRight}');
    expect(radio('O(log n)')).toHaveAttribute('aria-checked', 'true');
    expect(radio('O(log n)')).toHaveFocus();
    await user.keyboard('{End}');
    expect(radio('O(n!)')).toHaveFocus();
    expect(radio('O(n!)')).toHaveAttribute('aria-checked', 'true');
    await user.keyboard('{ArrowRight}');
    expect(radio('O(1)')).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(radio('O(n!)')).toHaveFocus();
    await user.keyboard('{Home}');
    expect(radio('O(1)')).toHaveFocus();
    expect(onMove).not.toHaveBeenCalled();
  });

  it('keeps the option when the language tab changes (TS-36)', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<Game {...base({ onMove })} />);
    await user.click(radio('O(n²)'));
    tab('JavaScript').focus();
    await user.keyboard('{ArrowRight}');
    expect(tab('Go')).toHaveAttribute('aria-selected', 'true');
    expect(firstLine()).toBe('func f(n int) int {');
    expect(radio('O(n²)')).toHaveAttribute('aria-checked', 'true');
    expect(onMove).not.toHaveBeenCalled();
  });
});

describe('Game confirm', () => {
  it('sends the visible language once (TS-37)', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<Game {...base({ onMove })} />);
    await user.click(radio('O(n log n)'));
    await user.click(tab('Java'));
    await user.dblClick(confirmButton());
    expect(onMove).toHaveBeenCalledTimes(1);
    const move = onMove.mock.calls[0]?.[0];
    expect(move).toEqual({ language: 'java', option: 'o_n_log_n' });
    expect(moveSchema.safeParse(move).success).toBe(true);
  });

  it('does not send without a selection (TS-38)', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<Game {...base({ onMove })} />);
    await user.click(confirmButton('Elegí una opción'));
    confirmButton('Elegí una opción').focus();
    await user.keyboard('{Enter}');
    expect(onMove).not.toHaveBeenCalled();
    expect(screen.getAllByText('> elegí una de las 8 opciones').length).toBeGreaterThan(0);
  });

  it('locks everything while pending (TS-39)', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    const props = base({ onMove });
    const { rerender } = render(<Game {...props} />);
    await user.click(radio('O(n²)'));
    rerender(<Game {...props} pending />);
    await user.click(radio('O(1)'));
    await user.click(tab('Go'));
    tab('JavaScript').focus();
    await user.keyboard('{ArrowRight}');
    await user.click(confirmButton('Confirmando…'));
    expect(confirmButton('Confirmando…')).toHaveAttribute('aria-disabled', 'true');
    for (const r of screen.getAllByRole('radio'))
      expect(r).toHaveAttribute('aria-disabled', 'true');
    for (const tb of screen.getAllByRole('tab'))
      expect(tb).toHaveAttribute('aria-disabled', 'true');
    expect(radio('O(n²)')).toHaveAttribute('aria-checked', 'true');
    expect(tab('JavaScript')).toHaveAttribute('aria-selected', 'true');
    expect(onMove).not.toHaveBeenCalled();
  });
});

describe('Game server errors', () => {
  it('invalid_move does not consume the attempt (TS-40)', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    const props = base({ onMove });
    const { rerender } = render(<Game {...props} />);
    await user.click(radio('O(n²)'));
    await user.click(confirmButton());
    expect(onMove).toHaveBeenCalledTimes(1);
    rerender(
      <Game
        {...props}
        pending={false}
        moveError={{ code: 'invalid_move', message: 'Jugada inválida.' }}
      />,
    );
    const msg =
      '> no pudimos registrar tu respuesta. Elegí una opción y confirmá de nuevo: no perdiste tu intento.';
    expect(screen.getAllByText(msg).length).toBeGreaterThan(0);
    expect(screen.getAllByText(msg).some((el) => el.closest('[aria-live="polite"]') !== null)).toBe(
      true,
    );
    expect(radio('O(n²)')).toHaveAttribute('aria-checked', 'true');
    await user.click(confirmButton());
    expect(onMove).toHaveBeenCalledTimes(2);
    expect(onMove).toHaveBeenLastCalledWith({ language: 'js', option: 'o_n2' });
  });

  it('shows 429 and other codes, and does not re-announce the same error (TS-41)', () => {
    const props = base();
    const err429 = { code: 'rate_limited', message: 'x' };
    const { rerender, container } = render(<Game {...props} />);
    rerender(<Game {...props} moveError={err429} />);
    expect(
      screen.getAllByText('> vas muy rápido. Esperá unos segundos y probá de nuevo.').length,
    ).toBeGreaterThan(0);
    const other = { code: 'game_finished', message: 'La partida ya terminó' };
    rerender(<Game {...props} moveError={other} />);
    expect(screen.getAllByText('> La partida ya terminó').length).toBeGreaterThan(0);
    const live = container.querySelector('[aria-live="polite"]') as HTMLElement;
    const node = live.firstElementChild;
    rerender(<Game {...props} moveError={other} />);
    expect(live.firstElementChild).toBe(node);
    expect(live.children).toHaveLength(1);
  });
});

describe('Game state across changes', () => {
  it('keeps selection and tab on language change (TS-42)', async () => {
    const user = userEvent.setup();
    const props = base();
    const { rerender } = render(<Game {...props} />);
    await user.click(radio('O(n²)'));
    await user.click(tab('Go'));
    rerender(<Game {...props} locale="en" t={makeT('en')} />);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'What is the time complexity (worst case) of f(n)?',
      }),
    ).toBeInTheDocument();
    expect(radio('O(n²)')).toHaveAttribute('aria-checked', 'true');
    expect(tab('Go')).toHaveAttribute('aria-selected', 'true');
    expect(
      screen.getAllByText('> you picked O(n²). You can change it until you confirm.').length,
    ).toBeGreaterThan(0);
    expect(confirmButton('Confirm answer')).toBeInTheDocument();
  });

  it('restarts with a new challenge (TS-43)', async () => {
    const user = userEvent.setup();
    const props = base();
    const { rerender } = render(<Game {...props} />);
    await user.click(radio('O(n²)'));
    await user.click(tab('Go'));
    rerender(<Game {...props} publicView={PUBLIC_VIEW_OTHER} />);
    for (const r of screen.getAllByRole('radio'))
      expect(r).toHaveAttribute('aria-checked', 'false');
    expect(tab('JavaScript')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByText('> elegí una de las 8 opciones').length).toBeGreaterThan(0);
    expect(
      screen.getByRole('tabpanel').querySelector('[data-line="2"] .whitespace-pre')?.textContent,
    ).toBe('  if (n < 2) {');
  });
});

describe('Game locked and invalid data', () => {
  it('hides the board when voided (TS-44)', () => {
    render(
      <Game
        {...base({ locked: true, notices: <p>anulado host</p>, aside: <a href="#r">Reportar</a> })}
      />,
    );
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirmar respuesta' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /cómo se juega/ })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText('anulado host')).toBeInTheDocument();
    expect(screen.getByText('Reportar')).toBeInTheDocument();
  });

  it('throws on invalid data (TS-45)', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(<Game {...base({ publicView: { code: { js: 'x' }, options: [] } })} />),
    ).toThrow(ZodError);
    expect(() => render(<Game {...base({ state: { option: 'o_1' } })} />)).toThrow(ZodError);
    error.mockRestore();
  });
});

describe('Game layout (TS-46)', () => {
  it('keeps the mobile DOM order and places blocks with lg classes', () => {
    const { container } = render(
      <Game {...base({ notices: <p>aviso</p>, aside: <a href="#r">Reportar</a> })} />,
    );
    const order = [
      comment(),
      screen.getByRole('heading', { level: 1 }),
      screen.getByText('aviso'),
      screen.getByRole('tablist'),
      screen.getByRole('radiogroup'),
      container.querySelector('p.min-h-5') as HTMLElement,
      confirmButton('Elegí una opción'),
      container.querySelector('#game-help') as HTMLElement,
      screen.getByText('Reportar'),
    ];
    order.slice(1).forEach((el, i) => {
      const prev = order[i] as HTMLElement;
      expect(prev.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
    expect(screen.getByRole('radiogroup')).toHaveClass('grid-cols-2', 'lg:grid-cols-4');
    expect(container.querySelector('.lg\\:grid-cols-12')).toBeInTheDocument();
    const main = screen.getByRole('radiogroup').closest('.lg\\:col-span-7');
    expect(main).toContainElement(confirmButton('Elegí una opción'));
    expect(confirmButton('Elegí una opción')).toHaveClass('w-full');
    const side = container.querySelector('#game-help')?.parentElement;
    expect(side).toHaveClass('lg:col-span-5');
    expect(side).toContainElement(screen.getByText('Reportar'));
    expect(side?.lastElementChild).toBe(screen.getByText('Reportar'));
    expect(container.querySelector('[class*="row-start"]')).toBeNull();
    const scrollers = [...container.querySelectorAll('*')].filter((el) =>
      el.className.toString().includes('overflow-x-auto'),
    );
    expect(scrollers).toEqual([screen.getByRole('tabpanel')]);
  });
});

describe('Game accessibility (TS-47)', () => {
  it('has no axe violations', async () => {
    const user = userEvent.setup();
    const props = base();
    const first = render(<Game {...props} />);
    expect(await axe(first.container)).toHaveNoViolations();
    await user.click(radio('O(n²)'));
    expect(await axe(first.container)).toHaveNoViolations();
    first.unmount();
    const en = render(<Game {...props} locale="en" t={makeT('en')} />);
    expect(await axe(en.container)).toHaveNoViolations();
    en.unmount();
    const pend = render(<Game {...props} pending />);
    expect(await axe(pend.container)).toHaveNoViolations();
  });
});
