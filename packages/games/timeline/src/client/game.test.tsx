// @vitest-environment jsdom
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { Game } from './game';
import {
  INITIAL_ORDER,
  PUBLIC_VIEW_EN,
  PUBLIC_VIEW_ES,
  PUBLIC_VIEW_OTHER,
  STATE_EMPTY,
} from './test-fixtures';
import { makeT } from './test-utils';
import type { GameProps } from './types';

const base = (over: Partial<GameProps> = {}): GameProps => ({
  number: 8,
  locale: 'es',
  t: makeT('es'),
  publicView: PUBLIC_VIEW_ES,
  state: STATE_EMPTY,
  feedback: null,
  onMove: vi.fn(),
  pending: false,
  moveError: null,
  ...over,
});

const orderList = () => screen.getByRole('list', { name: /tu orden|your order/ });
const names = () =>
  within(orderList())
    .getAllByRole('listitem')
    .map((li) => li.getAttribute('data-row-id'));

const ORDER_KUBERNETES_FIRST = ['k1v3s8', 'g2n5w3', 'p7k2m9', 'd9r6t0', 'j4x8q1'];

const liveRegion = () => document.querySelector('[aria-live="polite"]') as HTMLElement;
const dndRegion = () => document.querySelector('[aria-live="assertive"]') as HTMLElement;

const original = Element.prototype.getBoundingClientRect;
function stubRowRects() {
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const index = this.getAttribute('data-row-index');
    if (index === null) return original.call(this);
    const top = Number(index) * 60;
    return {
      top,
      bottom: top + 52,
      left: 0,
      right: 300,
      width: 300,
      height: 52,
      x: 0,
      y: top,
      toJSON: () => ({}),
    };
  };
}
afterEach(() => {
  Element.prototype.getBoundingClientRect = original;
});

describe('Game structure', () => {
  it('tags each row with the category of its milestone, without dates', () => {
    render(<Game {...base()} />);
    const rows = within(orderList()).getAllByRole('listitem');
    const tags = ['programming_languages', 'software_tools', 'programming_languages'];
    tags.push('software_tools', 'programming_languages');
    rows.forEach((row, i) => {
      expect(row.querySelector('[data-category]')).toHaveAttribute('data-category', tags[i]);
    });
    expect(within(rows[0] as HTMLElement).getByText('// lenguajes de programación')).toBeVisible();
    expect(within(rows[1] as HTMLElement).getByText('// software y herramientas')).toBeVisible();
  });

  it('shows the prompt, the shuffled list and no spoilers (TS-18)', () => {
    const { container } = render(<Game {...base()} />);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Ordená estos hitos del más antiguo al más reciente',
      }),
    ).toBeInTheDocument();
    const comment = screen.getByText('un solo intento · 1 punto por posición correcta');
    expect(comment).toHaveTextContent('// un solo intento');
    expect(within(comment).getByText('//')).toHaveAttribute('aria-hidden', 'true');
    expect(
      comment.compareDocumentPosition(screen.getByRole('heading', { level: 1 })) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: /tu orden/ })).toBeInTheDocument();
    expect(within(orderList()).getAllByRole('listitem')).toHaveLength(5);
    expect(names()).toEqual(INITIAL_ORDER);
    ['Go', 'Kubernetes', 'Python', 'Docker', 'Java'].forEach((label, i) => {
      expect(
        screen.getByRole('button', { name: `${label}, posición ${i + 1} de 5` }),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Confirmar orden' })).not.toHaveAttribute(
      'aria-disabled',
    );
    expect(
      screen.getByText('> arrastrá un hito desde su asa ⠿ o usá ↑ ↓ para moverlo'),
    ).toBeVisible();
    expect(liveRegion()).toBeEmptyDOMElement();
    for (const leak of ['1991', '2009', 'nota de', 'correct_order']) {
      expect(container.innerHTML.includes(leak), leak).toBe(false);
    }
  });

  it('the handle is the only touch-none element with roledescription and instructions (TS-19)', () => {
    const { container } = render(<Game {...base()} />);
    const handle = screen.getByRole('button', { name: 'Go, posición 1 de 5' });
    expect(handle.tagName).toBe('BUTTON');
    expect(handle).toHaveAttribute('aria-roledescription', 'elemento reordenable');
    const describedBy = handle.getAttribute('aria-describedby') as string;
    expect(document.getElementById(describedBy)).toHaveTextContent(
      'Para tomar un hito, presioná Espacio o Enter.',
    );
    const touchNone = container.querySelectorAll('.touch-none');
    expect(touchNone).toHaveLength(5);
    touchNone.forEach((el) => expect(el.tagName).toBe('BUTTON'));
  });

  it('disables up/down at the extremes (TS-20)', () => {
    render(<Game {...base()} />);
    expect(screen.getByRole('button', { name: 'Subir Go' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Bajar Java' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Bajar Go' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Subir Java' })).toBeEnabled();
    expect(
      screen
        .getAllByRole('button', { name: /^(Subir|Bajar) / })
        .filter((b) => b.hasAttribute('disabled')),
    ).toHaveLength(2);
  });

  it('throws on invalid data (TS-38)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Game {...base({ publicView: { category: 'x' } })} />)).toThrow(ZodError);
    expect(() => render(<Game {...base({ state: { order: ['a'] } })} />)).toThrow(ZodError);
    spy.mockRestore();
  });
});

describe('Game up/down buttons', () => {
  it('moves up, announces once and moves the focus (TS-21)', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<Game {...base({ onMove })} />);
    await user.click(screen.getByRole('button', { name: 'Subir Kubernetes' }));
    expect(names()).toEqual(ORDER_KUBERNETES_FIRST);
    expect(screen.getByRole('button', { name: 'Kubernetes, posición 1 de 5' })).toBeInTheDocument();
    const line = '> moviste Kubernetes a la posición 1 de 5';
    expect(screen.getAllByText(line)).toHaveLength(2);
    expect(within(liveRegion()).getByText(line)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Subir Kubernetes' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Bajar Kubernetes' })).toHaveFocus();
    expect(onMove).not.toHaveBeenCalled();
  });

  it('keeps the focus on the same button when it stays enabled (TS-22)', async () => {
    const user = userEvent.setup();
    render(<Game {...base()} />);
    screen.getByRole('button', { name: 'Bajar Go' }).focus();
    await user.keyboard('{Enter}');
    expect(names()).toEqual(['k1v3s8', 'g2n5w3', 'p7k2m9', 'd9r6t0', 'j4x8q1']);
    expect(screen.getByRole('button', { name: 'Bajar Go' })).toHaveFocus();
  });
});

describe('Game keyboard (dnd-kit)', () => {
  it('Space, ArrowUp, Space reorders (TS-23)', async () => {
    stubRowRects();
    const user = userEvent.setup();
    render(<Game {...base()} />);
    screen.getByRole('button', { name: 'Python, posición 3 de 5' }).focus();
    await user.keyboard('[Space]');
    await user.keyboard('[ArrowUp]');
    await user.keyboard('[Space]');
    expect(names()).toEqual(['g2n5w3', 'p7k2m9', 'k1v3s8', 'd9r6t0', 'j4x8q1']);
    expect(screen.getByRole('button', { name: 'Python, posición 2 de 5' })).toHaveFocus();
    expect(screen.getByText('> moviste Python a la posición 2 de 5')).toBeInTheDocument();
    expect(dndRegion()).toHaveTextContent('Soltaste Python en la posición 2 de 5.');
  });

  it('Escape puts the milestone back (TS-24)', async () => {
    stubRowRects();
    const user = userEvent.setup();
    render(<Game {...base()} />);
    screen.getByRole('button', { name: 'Python, posición 3 de 5' }).focus();
    await user.keyboard('[Space]');
    await user.keyboard('[ArrowUp]');
    await user.keyboard('[Escape]');
    expect(names()).toEqual(INITIAL_ORDER);
    expect(dndRegion()).toHaveTextContent('Python volvió a la posición 3 de 5.');
    expect(screen.getByText('> Python, posición 3 de 5')).toBeInTheDocument();
  });

  it('marks the taken row with a 2px accent border and has no transition nor overlay (TS-41)', async () => {
    stubRowRects();
    const user = userEvent.setup();
    const { container } = render(<Game {...base()} />);
    screen.getByRole('button', { name: 'Python, posición 3 de 5' }).focus();
    await user.keyboard('[Space]');
    const row = container.querySelector('[data-row-id="p7k2m9"]') as HTMLElement;
    expect(row).toHaveClass('border-2', 'border-game-timeline');
    expect(row.style.transition).toBe('');
    expect(container.querySelector('[data-dnd-overlay]')).toBeNull();
    await user.keyboard('[Escape]');
  });

  it('does not take a milestone when locked (TS-34)', async () => {
    stubRowRects();
    const user = userEvent.setup();
    render(<Game {...base({ locked: true })} />);
    const handle = screen.getByRole('button', { name: 'Python, posición 3 de 5' });
    handle.focus();
    await user.keyboard('[Space]');
    expect(dndRegion()).toBeEmptyDOMElement();
  });
});

describe('Game confirm', () => {
  it('sends the validated order (TS-26, TS-27)', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<Game {...base({ onMove })} />);
    await user.click(screen.getByRole('button', { name: 'Confirmar orden' }));
    expect(onMove).toHaveBeenCalledWith({ order: INITIAL_ORDER });
  });

  it('has no «Reiniciar» button', () => {
    render(<Game {...base()} />);
    expect(screen.queryByRole('button', { name: 'Reiniciar' })).not.toBeInTheDocument();
  });

  it('shows the «cómo se juega» card without the streak nor averages', () => {
    const gameStats = {
      game_id: 'timeline',
      current_streak: 3,
      max_streak: 5,
      played: 37,
      wins: 9,
      win_rate: 0.24,
      extra: null,
    };
    render(<Game {...base({ gameStats })} />);
    const rules = screen.getByRole('region', { name: /cómo se juega/ });
    expect(rules).toHaveAttribute('id', 'game-help');
    expect(screen.queryByText(/racha/)).not.toBeInTheDocument();
    expect(within(rules).getAllByRole('listitem')).toHaveLength(3);
    within(rules)
      .getAllByRole('listitem')
      .forEach((li) => expect(li.lastElementChild).toHaveClass('text-body-sm'));
    expect(screen.queryByText(/promedio/)).not.toBeInTheDocument();
  });

  it('hides the streak with no streak and shows the date placeholder in every row', () => {
    render(<Game {...base()} />);
    expect(screen.queryByText(/^racha/)).not.toBeInTheDocument();
    for (const row of within(orderList()).getAllByRole('listitem')) {
      expect(within(row).getByText('????')).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('sends the arranged order', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<Game {...base({ onMove })} />);
    await user.click(screen.getByRole('button', { name: 'Subir Kubernetes' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar orden' }));
    expect(onMove).toHaveBeenCalledWith({ order: ORDER_KUBERNETES_FIRST });
  });

  it('does not double submit (TS-28)', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<Game {...base({ onMove })} />);
    await user.dblClick(screen.getByRole('button', { name: 'Confirmar orden' }));
    expect(onMove).toHaveBeenCalledTimes(1);
  });

  it('pending blocks everything and re-arms (TS-29)', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    const props = base({ onMove });
    const { rerender } = render(<Game {...props} />);
    rerender(<Game {...props} pending />);
    const confirm = screen.getByRole('button', { name: /Confirmando…/ });
    expect(confirm).toHaveAttribute('aria-disabled', 'true');
    await user.click(confirm);
    expect(onMove).not.toHaveBeenCalled();
    expect(screen.getAllByRole('button', { name: /posición \d de 5/ })).toHaveLength(5);
    screen
      .getAllByRole('button', { name: /posición \d de 5|^(Subir|Bajar) / })
      .forEach((b) => expect(b).toBeDisabled());
    rerender(<Game {...props} pending={false} />);
    await user.click(screen.getByRole('button', { name: 'Confirmar orden' }));
    expect(onMove).toHaveBeenCalledTimes(1);
  });

  it('locked hides help and confirm and blocks rows (TS-34)', () => {
    render(<Game {...base({ locked: true, notices: <p>anulado host</p> })} />);
    expect(screen.getByText('anulado host')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirmar orden' })).not.toBeInTheDocument();
    expect(document.getElementById('game-help')).toBeNull();
    expect(screen.queryByText(/^> arrastrá un hito/)).not.toBeInTheDocument();
    screen
      .getAllByRole('button', { name: /posición \d de 5|^(Subir|Bajar) / })
      .forEach((b) => expect(b).toBeDisabled());
  });
});

describe('Game move errors', () => {
  const invalid = { code: 'invalid_move', message: 'Jugada inválida.' };

  it('invalid_move shows the hint and keeps the order (TS-30)', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    const props = base({ onMove });
    const { rerender } = render(<Game {...props} />);
    await user.click(screen.getByRole('button', { name: 'Subir Kubernetes' }));
    rerender(<Game {...props} moveError={invalid} />);
    const line = '> no pudimos registrar ese orden. Revisalo y confirmá de nuevo';
    expect(screen.getAllByText(line)).toHaveLength(2);
    expect(names()).toEqual(ORDER_KUBERNETES_FIRST);
    await user.click(screen.getByRole('button', { name: 'Confirmar orden' }));
    expect(onMove).toHaveBeenCalledWith({ order: ORDER_KUBERNETES_FIRST });
  });

  it('rate limited and other codes (TS-31, TS-32)', () => {
    const props = base();
    const { rerender } = render(<Game {...props} />);
    rerender(
      <Game
        {...props}
        moveError={{
          code: 'rate_limited',
          message: 'Demasiadas solicitudes. Probá de nuevo en un rato',
        }}
      />,
    );
    expect(
      screen.getAllByText('> vas muy rápido. Esperá unos segundos y probá de nuevo'),
    ).toHaveLength(2);
    rerender(
      <Game {...props} moveError={{ code: 'validation_error', message: 'Body inválido' }} />,
    );
    expect(screen.getAllByText('> Body inválido')).toHaveLength(2);
  });

  it('does not re-announce the same error but announces a new one (TS-33)', () => {
    const props = base();
    const { rerender } = render(<Game {...props} />);
    rerender(<Game {...props} moveError={invalid} />);
    const first = liveRegion().querySelector('p');
    expect(liveRegion().querySelectorAll('p')).toHaveLength(1);
    rerender(<Game {...props} moveError={invalid} />);
    expect(liveRegion().querySelector('p')).toBe(first);
    rerender(<Game {...props} moveError={{ ...invalid }} />);
    expect(liveRegion().querySelectorAll('p')).toHaveLength(1);
    expect(liveRegion().querySelector('p')).not.toBe(first);
  });
});

describe('Game local order lifecycle', () => {
  it('keeps the order across a language change (TS-35)', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    const props = base({ onMove });
    const { rerender } = render(<Game {...props} />);
    await user.click(screen.getByRole('button', { name: 'Subir Kubernetes' }));
    rerender(<Game {...props} locale="en" t={makeT('en')} publicView={PUBLIC_VIEW_EN} />);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Order these milestones from oldest to newest',
      }),
    ).toBeInTheDocument();
    expect(names()).toEqual(ORDER_KUBERNETES_FIRST);
    expect(screen.getByRole('button', { name: 'Kubernetes, position 1 of 5' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirm order' }));
    expect(onMove).toHaveBeenCalledWith({ order: ORDER_KUBERNETES_FIRST });
  });

  it('resets when the challenge changes (TS-36)', async () => {
    const user = userEvent.setup();
    const props = base();
    const { rerender } = render(<Game {...props} />);
    await user.click(screen.getByRole('button', { name: 'Subir Kubernetes' }));
    rerender(<Game {...props} publicView={PUBLIC_VIEW_OTHER} />);
    expect(names()).toEqual(PUBLIC_VIEW_OTHER.items.map((i) => i.opaque_id));
    expect(liveRegion()).toBeEmptyDOMElement();
  });

  it('starts from the initial shuffle after remounting (TS-37)', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Game {...base()} />);
    await user.click(screen.getByRole('button', { name: 'Subir Kubernetes' }));
    unmount();
    render(<Game {...base()} />);
    expect(names()).toEqual(INITIAL_ORDER);
  });
});

describe('Game layout and styles', () => {
  it('lays out two wrapping columns: list + hint + CTA, then help + aside (TS-39)', () => {
    const { container } = render(<Game {...base({ aside: <p>reportar host</p> })} />);
    const cols = container.querySelector('.flex-wrap') as HTMLElement;
    expect(cols).toHaveClass('flex', 'flex-wrap', 'gap-6');
    const [listCol, sideCol] = Array.from(cols.children) as [HTMLElement, HTMLElement];
    expect(listCol).toHaveClass('grow-7', 'basis-130', 'min-w-0');
    expect(sideCol).toHaveClass('grow-5', 'basis-80', 'min-w-0');
    const confirm = screen.getByRole('button', { name: 'Confirmar orden' });
    expect(confirm).toHaveClass('w-full');
    expect(confirm.className).not.toMatch(/lg:w-auto/);
    expect(within(confirm).getByText('→')).toHaveAttribute('aria-hidden', 'true');
    expect(confirm.parentElement).toBe(listCol);
    expect(listCol.lastElementChild).toBe(confirm);
    const hint = screen.getByText(/^> arrastrá un hito/);
    expect(hint.compareDocumentPosition(confirm) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const help = document.getElementById('game-help') as HTMLElement;
    expect(help).toHaveTextContent(/Arrastrá cada fila/);
    expect(sideCol.firstElementChild).toBe(help);
    expect(sideCol.lastElementChild).toHaveTextContent('reportar host');
  });

  it('keeps 44px controls that never shrink (TS-1)', () => {
    const { container } = render(<Game {...base()} />);
    const row = container.querySelector('[data-row-id="g2n5w3"]') as HTMLElement;
    const controls = [
      within(row).getByRole('button', { name: /^Go, posición \d de 5$/ }),
      within(row).getByRole('button', { name: 'Subir Go' }),
      within(row).getByRole('button', { name: 'Bajar Go' }),
    ];
    for (const b of controls) expect(b).toHaveClass('size-11', 'shrink-0');
  });

  it('wraps the row in two lines below @xs and keeps one line from @xs (TS-2)', () => {
    const { container } = render(<Game {...base()} />);
    expect(orderList()).toHaveClass('@container');
    const row = container.querySelector('[data-row-id="g2n5w3"]') as HTMLElement;
    expect(row).toHaveClass('flex-wrap', '@xs:flex-nowrap');
    const name = within(row).getByText('Go');
    expect(name).toHaveClass('break-words');
    expect(name.parentElement).toHaveClass(
      'min-w-0',
      'grow',
      'basis-full',
      'order-last',
      '@xs:basis-auto',
      '@xs:order-none',
    );
    const group = within(row).getByRole('button', { name: 'Bajar Go' }).parentElement;
    expect(group).toHaveClass('flex-row', 'ml-auto');
    expect(group).not.toHaveClass('flex-col');
    expect(container.innerHTML).not.toMatch(/overflow-x-|w-\[/);
  });

  it('keeps the focus order handle, up, down inside a row (TS-3)', async () => {
    const user = userEvent.setup();
    const { container } = render(<Game {...base()} />);
    const row = container.querySelector('[data-row-id="k1v3s8"]') as HTMLElement;
    const handle = within(row).getByRole('button', { name: /^Kubernetes, posición \d de 5$/ });
    handle.focus();
    await user.tab();
    expect(within(row).getByRole('button', { name: 'Subir Kubernetes' })).toHaveFocus();
    await user.tab();
    expect(within(row).getByRole('button', { name: 'Bajar Kubernetes' })).toHaveFocus();
  });
});

describe('Game a11y (TS-42)', () => {
  it.each(['es', 'en'] as const)('has no axe violations in %s', async (locale) => {
    const { container } = render(
      <Game
        {...base({
          locale,
          t: makeT(locale),
          publicView: locale === 'es' ? PUBLIC_VIEW_ES : PUBLIC_VIEW_EN,
        })}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations while moving and when locked', async () => {
    stubRowRects();
    const user = userEvent.setup();
    const { container, unmount } = render(<Game {...base()} />);
    screen.getByRole('button', { name: 'Python, posición 3 de 5' }).focus();
    await user.keyboard('[Space]');
    await act(async () => undefined);
    expect(await axe(container)).toHaveNoViolations();
    await user.keyboard('[Escape]');
    unmount();
    const locked = render(<Game {...base({ locked: true })} />);
    expect(await axe(locked.container)).toHaveNoViolations();
  });
});
