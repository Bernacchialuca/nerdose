// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { moveSchema } from '../definition/schemas';

import { Game } from './game';
import { PUBLIC_VIEW, PUBLIC_VIEW_BOOL, PUBLIC_VIEW_EN, STATE_EMPTY } from './test-fixtures';
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

const radio = (re: RegExp | string) => screen.getByRole('radio', { name: re });
const tab = (name: string) => screen.getByRole('tab', { name });
const confirmButton = (name: string | RegExp = /Confirmar línea|Elegí una línea/) =>
  screen.getByRole('button', { name });
const IDLE = '> tocá la línea donde creés que está el bug';
const hasIdle = () => screen.getAllByText(IDLE).length > 0;

describe('Game initial structure (TS-33)', () => {
  it('renders the spec, tests and code without spoilers', () => {
    const { container } = render(<Game {...base()} />);
    const comment = screen.getByText(
      'un solo intento · la firma y las líneas con solo llaves no cuentan',
    );
    expect(comment).toHaveTextContent(
      '// un solo intento · la firma y las líneas con solo llaves no cuentan',
    );
    expect(comment).toHaveClass('font-mono', 'text-label-comment', 'text-text-dim');
    expect(within(comment).getByText('//')).toHaveAttribute('aria-hidden', 'true');
    expect(
      screen.getByRole('heading', { level: 1, name: '¿En qué línea está el bug?' }),
    ).toBeInTheDocument();
    const spec = screen.getByRole('heading', { level: 2, name: /qué debería hacer/ });
    expect(spec.closest('section')).toHaveClass('bg-streak-surface');
    expect(spec.closest('section')).toHaveTextContent(PUBLIC_VIEW.spec);
    const tests = screen.getByRole('heading', { level: 2, name: /tests/ });
    expect(tests.closest('section')).toHaveTextContent('llamada → esperado');
    expect(within(tests.closest('section') as HTMLElement).getAllByRole('listitem')).toHaveLength(
      4,
    );
    expect(screen.getByText('maxIndex([]) → 0')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('maxIndex([3, 7, 2]) → 1')).toBeInTheDocument();
    expect(screen.getByText('maxIndex de [3, 7, 2] da 1, pasa')).toHaveClass('sr-only');
    expect(screen.getByText('1 test oculto falla').closest('li')).toHaveClass('border-dashed');
    expect(screen.getByText(/El test que falla se revela al confirmar/)).toBeInTheDocument();
    expect(tab('JavaScript')).toHaveAttribute('aria-selected', 'true');
    const group = screen.getByRole('radiogroup', { name: 'Líneas de maxIndex en JavaScript' });
    const radios = within(group).getAllByRole('radio');
    expect(radios).toHaveLength(5);
    for (const r of radios) expect(r).toHaveAttribute('aria-checked', 'false');
    expect(hasIdle()).toBe(true);
    const btn = confirmButton();
    expect(btn).toHaveTextContent('Elegí una línea');
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText(/El bug es el mismo en los tres lenguajes/)).toBeInTheDocument();
    expect(container.querySelector('#game-help')).toHaveTextContent('un solo intento');
    for (const leak of [
      'comparación',
      'off_by_one',
      '[5, 1, 5]',
      'acá estaba el bug',
      'Por qué falla',
    ]) {
      expect(container.textContent, leak).not.toContain(leak);
    }
    expect(container.textContent).not.toContain('nums[i] > nums[best]');
    for (const sr of [
      'maxIndex de [] da 0, pasa',
      'maxIndex de [4] da 0, pasa',
      'maxIndex de [3, 7, 2] da 1, pasa',
    ]) {
      expect(screen.getByText(sr)).toHaveClass('sr-only');
    }
    const help = container.querySelector('#game-help') as HTMLElement;
    for (const n of ['01', '02', '03']) expect(help).toHaveTextContent(n);
    expect(within(help).getByText('un solo intento')).toHaveClass('text-game-bug-hunt');
    expect(help).toHaveTextContent('Con teclado: flechas ← →');
    expect(within(help).getByText(/Tocá la línea donde/)).toHaveClass('text-body-sm');
    expect(within(help).getByText('un solo intento').parentElement).toHaveClass('text-body-sm');
  });

  it('starts in the preferred code language (TS-34)', () => {
    render(<Game {...base({ codeLanguage: 'java' })} />);
    expect(tab('Java')).toHaveAttribute('aria-selected', 'true');
    expect(radio(/^Línea 2: int best = 0;$/)).toBeInTheDocument();
    expect(screen.getByText('MaxIndex.java')).toBeInTheDocument();
    expect(
      screen.getByRole('radiogroup', { name: 'Líneas de maxIndex en Java' }),
    ).toBeInTheDocument();
  });

  it('shows two-argument and boolean tests (TS-35)', () => {
    render(<Game {...base({ publicView: PUBLIC_VIEW_BOOL })} />);
    expect(screen.getByText('anyAbove([5], 3) → true')).toBeInTheDocument();
    expect(screen.getByText('anyAbove([4, 9], 3) → true')).toBeInTheDocument();
    expect(screen.getByText('anyAbove([-3, -1], -2) → true')).toBeInTheDocument();
    expect(screen.getByText('anyAbove de [5], 3 da true, pasa')).toBeInTheDocument();
    expect(screen.getByText('1 test oculto falla')).toBeInTheDocument();
    expect(screen.getByText('any-above.js')).toBeInTheDocument();
  });
});

describe('Game interaction', () => {
  it('picks lines with click (TS-36)', async () => {
    const user = userEvent.setup();
    render(<Game {...base()} />);
    await user.click(radio(/^Línea 4:/));
    expect(radio(/^Línea 4:/)).toHaveAttribute('aria-checked', 'true');
    const text = '> elegiste la línea 4. Podés cambiarla hasta confirmar.';
    expect(screen.getAllByText(text).length).toBeGreaterThan(1);
    const live = document.querySelector('[aria-live="polite"]') as HTMLElement;
    expect(live).toHaveTextContent(text);
    const btn = confirmButton('Confirmar línea 4');
    expect(btn).not.toHaveAttribute('aria-disabled');
    expect(btn.querySelector('[aria-hidden="true"]')).toHaveTextContent('→');
    await user.click(radio(/^Línea 2:/));
    expect(radio(/^Línea 4:/)).toHaveAttribute('aria-checked', 'false');
    expect(radio(/^Línea 2:/)).toHaveAttribute('aria-checked', 'true');
    expect(confirmButton('Confirmar línea 2')).toBeInTheDocument();
  });

  it('supports the keyboard and a single tab stop (TS-37)', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<Game {...base({ onMove })} />);
    tab('JavaScript').focus();
    await user.tab();
    expect(radio(/^Línea 2:/)).toHaveFocus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(radio(/^Línea 4:/)).toHaveFocus();
    await user.keyboard(' ');
    expect(radio(/^Línea 4:/)).toHaveAttribute('aria-checked', 'true');
    await user.tab();
    expect(confirmButton('Confirmar línea 4')).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith({ language: 'js', line: 4 });
  });

  it('keeps the line when switching language (TS-38)', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<Game {...base({ onMove })} />);
    await user.click(radio(/^Línea 4:/));
    tab('JavaScript').focus();
    await user.keyboard('{ArrowRight}');
    expect(tab('Go')).toHaveAttribute('aria-selected', 'true');
    expect(radio('Línea 4: if nums[i] >= nums[best] {')).toHaveAttribute('aria-checked', 'true');
    expect(confirmButton('Confirmar línea 4')).toBeInTheDocument();
    expect(onMove).not.toHaveBeenCalled();
  });

  it('confirms the visible language once (TS-39)', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<Game {...base({ onMove })} />);
    await user.click(radio(/^Línea 4:/));
    await user.click(tab('Java'));
    const btn = confirmButton('Confirmar línea 4');
    await user.dblClick(btn);
    expect(onMove).toHaveBeenCalledTimes(1);
    const move = onMove.mock.calls[0]?.[0];
    expect(move).toEqual({ language: 'java', line: 4 });
    expect(moveSchema.safeParse(move).success).toBe(true);
  });

  it('does not send without a selection (TS-40)', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<Game {...base({ onMove })} />);
    await user.click(confirmButton('Elegí una línea'));
    confirmButton('Elegí una línea').focus();
    await user.keyboard('{Enter}');
    expect(onMove).not.toHaveBeenCalled();
    expect(hasIdle()).toBe(true);
  });

  it('locks everything while pending (TS-41)', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    const { rerender } = render(<Game {...base({ onMove })} />);
    await user.click(radio(/^Línea 4:/));
    rerender(<Game {...base({ onMove, pending: true })} />);
    const btn = screen.getByRole('button', { name: 'Confirmando…' });
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    for (const r of screen.getAllByRole('radio'))
      expect(r).toHaveAttribute('aria-disabled', 'true');
    for (const x of screen.getAllByRole('tab')) expect(x).toHaveAttribute('aria-disabled', 'true');
    await user.click(radio(/^Línea 2:/));
    await user.click(tab('Go'));
    await user.click(btn);
    expect(radio(/^Línea 4:/)).toHaveAttribute('aria-checked', 'true');
    expect(tab('JavaScript')).toHaveAttribute('aria-selected', 'true');
    expect(onMove).not.toHaveBeenCalled();
  });

  it('invalid_move keeps the line and the attempt (TS-42)', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    const { rerender } = render(<Game {...base({ onMove })} />);
    await user.click(radio(/^Línea 4:/));
    await user.click(confirmButton('Confirmar línea 4'));
    expect(onMove).toHaveBeenCalledTimes(1);
    rerender(<Game {...base({ onMove, pending: true })} />);
    rerender(
      <Game
        {...base({ onMove, moveError: { code: 'invalid_move', message: 'Jugada inválida.' } })}
      />,
    );
    const text =
      '> no pudimos registrar esa línea. Elegí una y confirmá de nuevo: no perdiste tu intento.';
    expect(screen.getAllByText(text).length).toBeGreaterThan(0);
    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent(text);
    expect(radio(/^Línea 4:/)).toHaveAttribute('aria-checked', 'true');
    await user.click(confirmButton('Confirmar línea 4'));
    expect(onMove).toHaveBeenCalledTimes(2);
    expect(onMove).toHaveBeenLastCalledWith({ language: 'js', line: 4 });
  });

  it('shows other errors and does not re-announce the same one (TS-43)', () => {
    const { rerender } = render(<Game {...base()} />);
    rerender(<Game {...base({ moveError: { code: 'rate_limited', message: 'x' } })} />);
    expect(
      screen.getAllByText('> vas muy rápido. Esperá unos segundos y probá de nuevo.').length,
    ).toBeGreaterThan(0);
    const err = { code: 'game_finished', message: 'La partida ya terminó' };
    rerender(<Game {...base({ moveError: err })} />);
    expect(screen.getAllByText('> La partida ya terminó').length).toBeGreaterThan(0);
    const live = document.querySelector('[aria-live="polite"]') as HTMLElement;
    const node = live.firstChild;
    rerender(<Game {...base({ moveError: err })} />);
    expect(live.firstChild).toBe(node);
    expect(live.childNodes).toHaveLength(1);
  });

  it('keeps selection and tab across a locale change (TS-44)', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Game {...base()} />);
    await user.click(radio(/^Línea 4:/));
    await user.click(tab('Go'));
    rerender(<Game {...base({ locale: 'en', t: makeT('en'), publicView: PUBLIC_VIEW_EN })} />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Which line has the bug?' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /what it should do/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(PUBLIC_VIEW_EN.spec)).toBeInTheDocument();
    expect(radio('Line 4: if nums[i] >= nums[best] {')).toHaveAttribute('aria-checked', 'true');
    expect(tab('Go')).toHaveAttribute('aria-selected', 'true');
    expect(
      screen.getAllByText('> you picked line 4. You can change it until you confirm.').length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Confirm line 4/ })).toBeInTheDocument();
    expect(screen.getByText('maxIndex of [3, 7, 2] returns 1, passes')).toBeInTheDocument();
    expect(screen.getByText('1 hidden test fails')).toBeInTheDocument();
  });

  it('restarts on a new challenge (TS-45)', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Game {...base()} />);
    await user.click(radio(/^Línea 4:/));
    await user.click(tab('Go'));
    rerender(<Game {...base({ publicView: PUBLIC_VIEW_BOOL })} />);
    for (const r of screen.getAllByRole('radio'))
      expect(r).toHaveAttribute('aria-checked', 'false');
    expect(tab('JavaScript')).toHaveAttribute('aria-selected', 'true');
    expect(hasIdle()).toBe(true);
    expect(radio('Línea 2: let found = true;')).toBeInTheDocument();
  });

  it('does not keep the selection when remounted (TS-46)', async () => {
    const user = userEvent.setup();
    const first = render(<Game {...base()} />);
    await user.click(radio(/^Línea 4:/));
    first.unmount();
    render(<Game {...base()} />);
    for (const r of screen.getAllByRole('radio'))
      expect(r).toHaveAttribute('aria-checked', 'false');
    expect(confirmButton('Elegí una línea')).toHaveAttribute('aria-disabled', 'true');
    expect(hasIdle()).toBe(true);
  });

  it('hides the board when locked (TS-47)', () => {
    render(
      <Game
        {...base({ locked: true, notices: <p>anulado host</p>, aside: <a href="#r">Reportar</a> })}
      />,
    );
    for (const role of ['tablist', 'radiogroup', 'button'])
      expect(screen.queryByRole(role)).toBeNull();
    expect(screen.queryByText(/cómo se juega/)).toBeNull();
    expect(screen.queryByText(/qué debería hacer/)).toBeNull();
    expect(screen.getByText(/un solo intento/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText('anulado host')).toBeInTheDocument();
    expect(screen.getByText('Reportar')).toBeInTheDocument();
  });

  it('throws on invalid data (TS-48)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(<Game {...base({ publicView: { ...PUBLIC_VIEW, visible_tests: [] } })} />),
    ).toThrow(ZodError);
    expect(() => render(<Game {...base({ state: { line: 4 } })} />)).toThrow(ZodError);
    spy.mockRestore();
  });
});

describe('Game layout (TS-49, TS-50)', () => {
  it('keeps the DOM in mobile order with the desktop grid classes', () => {
    const { container } = render(
      <Game {...base({ notices: <p>aviso</p>, aside: <a href="#r">Reportar</a> })} />,
    );
    const seq = [
      screen.getByRole('heading', { level: 1 }),
      screen.getByText('aviso'),
      screen.getByRole('heading', { level: 2, name: /qué debería hacer/ }),
      screen.getByRole('tablist'),
      screen.getByRole('radiogroup'),
      document.querySelector('[aria-live="polite"]')!.previousElementSibling as HTMLElement,
      screen.getByRole('button', { name: 'Elegí una línea' }),
      screen.getByText(/El bug es el mismo/),
      screen.getByRole('heading', { level: 2, name: /cómo se juega/ }),
      screen.getByRole('heading', { level: 2, name: /tests/ }),
      screen.getByText('Reportar'),
    ];
    seq.slice(1).forEach((el, i) => {
      expect(
        seq[i]!.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING,
        `step ${i}`,
      ).toBeTruthy();
    });
    expect(container.querySelector('.lg\\:grid-cols-12')).not.toBeNull();
    const main = screen
      .getByRole('heading', { name: /qué debería hacer/ })
      .closest('section')!.parentElement!;
    expect(main).toHaveClass('lg:col-span-7');
    for (const el of [screen.getByRole('tablist'), confirmButton('Elegí una línea')])
      expect(main).toContainElement(el);
    const side = document.getElementById('game-help')!.parentElement!;
    expect(side).toHaveClass('lg:col-span-5');
    expect(side.firstElementChild).toBe(document.getElementById('game-help'));
    expect(side).toContainElement(screen.getByRole('heading', { name: /tests/ }));
    expect(side.lastElementChild).toContainElement(screen.getByText('Reportar'));
    const cta = confirmButton('Elegí una línea');
    expect(cta).toHaveClass('w-full');
    expect(cta.className).not.toMatch(/lg:w-auto/);
    const scrollers = [...container.querySelectorAll('.overflow-x-auto')];
    expect(scrollers).toHaveLength(1);
    expect(scrollers[0]).toBe(screen.getByRole('tabpanel'));
  });

  it('has no axe violations', async () => {
    const a = render(<Game {...base()} />);
    expect(await axe(a.container)).toHaveNoViolations();
    a.unmount();
    const user = userEvent.setup();
    const b = render(<Game {...base()} />);
    await user.click(radio(/^Línea 4:/));
    expect(await axe(b.container)).toHaveNoViolations();
    b.unmount();
    const c = render(
      <Game {...base({ locale: 'en', t: makeT('en'), publicView: PUBLIC_VIEW_EN })} />,
    );
    expect(await axe(c.container)).toHaveNoViolations();
    c.unmount();
    const d = render(<Game {...base({ pending: true })} />);
    expect(await axe(d.container)).toHaveNoViolations();
    d.unmount();
    const e = render(<Game {...base({ publicView: PUBLIC_VIEW_BOOL })} />);
    expect(await axe(e.container)).toHaveNoViolations();
  });
});
