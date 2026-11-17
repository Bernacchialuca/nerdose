import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { Heatmap } from './heatmap';
import type { HeatmapProps } from './heatmap';

const F: HeatmapProps = {
  today: '2026-11-15',
  days: [
    { date: '2025-11-16', completed: 1 },
    { date: '2026-11-10', completed: 5 },
    { date: '2026-11-15', completed: 2 },
  ],
  locale: 'es',
  caption: 'últimos 365 días · desafíos completados por día',
  summaryLabel: (n) => `${n} desafíos completados en los últimos 365 días`,
  cellLabel: (d) => `${d.longDate}: ${d.completed} de 5 desafíos completados`,
  detailLabel: (d) => `${d.isToday ? 'Hoy' : d.shortDate} · ${d.completed} de 5 completados`,
  emptyDetail: 'Sin partidas en los últimos 365 días',
};

const cell = (date: string) => screen.getByRole('button', { name: new RegExp(`^${date}`) });
const DAY = {
  d1110: 'martes, 10 de noviembre de 2026',
  d1115: 'domingo, 15 de noviembre de 2026',
  d1108: 'domingo, 8 de noviembre de 2026',
  d1107: 'sábado, 7 de noviembre de 2026',
  d1116: 'domingo, 16 de noviembre de 2025',
};

describe('Heatmap', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a grid with summary and 365 cells (TS-10)', () => {
    render(<Heatmap {...F} />);
    const grid = screen.getByRole('grid', {
      name: '8 desafíos completados en los últimos 365 días',
    });
    expect(within(grid).getAllByRole('row')).toHaveLength(7);
    expect(within(grid).getAllByRole('gridcell')).toHaveLength(365);
    expect(within(grid).getAllByRole('button')).toHaveLength(365);
    expect(screen.getByText('últimos 365 días · desafíos completados por día')).toBeInTheDocument();
  });

  it('names each cell with its quantity (TS-11)', () => {
    render(<Heatmap {...F} />);
    expect(
      screen.getByRole('button', { name: `${DAY.d1110}: 5 de 5 desafíos completados` }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: `${DAY.d1115}: 2 de 5 desafíos completados` }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: `${DAY.d1108}: 0 de 5 desafíos completados` }),
    ).toBeInTheDocument();
  });

  it('colors cells by level with DS tokens (TS-12)', () => {
    render(<Heatmap {...F} />);
    expect(cell(DAY.d1110)).toHaveClass('bg-heatmap-4');
    expect(cell(DAY.d1115)).toHaveClass('bg-heatmap-2');
    expect(cell(DAY.d1116)).toHaveClass('bg-heatmap-1');
    expect(cell(DAY.d1108)).toHaveClass('bg-heatmap-0');
    const grid = screen.getByRole('grid');
    for (const b of within(grid).getAllByRole('button')) {
      const bg = b.className.split(/\s+/).filter((c) => /(^|:)bg-/.test(c));
      expect(bg).toHaveLength(1);
      expect(bg[0]).toMatch(/^bg-heatmap-[0-4]$/);
    }
  });

  it('marks today with aria-current and a ring (TS-13)', () => {
    render(<Heatmap {...F} />);
    const grid = screen.getByRole('grid');
    const current = within(grid)
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-current') === 'date');
    expect(current).toEqual([cell(DAY.d1115)]);
    const ringed = within(grid)
      .getAllByRole('button')
      .filter((b) => b.classList.contains('ring-border-interactive'));
    expect(ringed).toEqual([cell(DAY.d1115)]);
  });

  it('has a single tab stop on today (TS-14)', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">antes</button>
        <Heatmap {...F} />
        <button type="button">después</button>
      </>,
    );
    const buttons = within(screen.getByRole('grid')).getAllByRole('button');
    expect(buttons.filter((b) => b.tabIndex === 0)).toHaveLength(1);
    expect(buttons.filter((b) => b.tabIndex === -1)).toHaveLength(364);
    await user.tab();
    expect(screen.getByText('antes')).toHaveFocus();
    await user.tab();
    expect(cell(DAY.d1115)).toHaveFocus();
    await user.tab();
    expect(screen.getByText('después')).toHaveFocus();
  });

  it('moves focus with arrows, Home and End (TS-15)', async () => {
    const user = userEvent.setup();
    render(<Heatmap {...F} />);
    cell(DAY.d1115).focus();
    const expectFocus = (name: string) => {
      const el = cell(name);
      expect(el).toHaveFocus();
      expect(el.tabIndex).toBe(0);
      const others = within(screen.getByRole('grid'))
        .getAllByRole('button')
        .filter((b) => b !== el);
      expect(others.every((b) => b.tabIndex === -1)).toBe(true);
    };
    await user.keyboard('{ArrowLeft}');
    expectFocus(DAY.d1108);
    await user.keyboard('{ArrowUp}');
    expectFocus(DAY.d1107);
    await user.keyboard('{Home}');
    expectFocus(DAY.d1116);
    await user.keyboard('{End}');
    expectFocus(DAY.d1115);
    await user.keyboard('{ArrowRight}');
    expectFocus(DAY.d1115);
  });

  it('shows today by default in the detail, not live (TS-16)', () => {
    render(<Heatmap {...F} />);
    const detail = screen.getByText('Hoy · 2 de 5 completados');
    expect(detail).not.toHaveAttribute('aria-live');
  });

  it('shows the focused day in the detail (TS-17)', async () => {
    const user = userEvent.setup();
    render(<Heatmap {...F} />);
    cell(DAY.d1115).focus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByText('dom 08/11 · 0 de 5 completados')).toBeInTheDocument();
  });

  it('shows the tapped day in the detail (TS-18)', async () => {
    const user = userEvent.setup();
    render(<Heatmap {...F} />);
    await user.click(cell(DAY.d1110));
    expect(screen.getByText('mar 10/11 · 5 de 5 completados')).toBeInTheDocument();
    expect(cell(DAY.d1110)).toHaveFocus();
    expect(cell(DAY.d1110).tabIndex).toBe(0);
  });

  it('renders the empty state (TS-19)', async () => {
    const user = userEvent.setup();
    render(<Heatmap {...F} days={[]} />);
    const grid = screen.getByRole('grid', {
      name: '0 desafíos completados en los últimos 365 días',
    });
    const buttons = within(grid).getAllByRole('button');
    expect(buttons).toHaveLength(365);
    expect(buttons.every((b) => b.classList.contains('bg-heatmap-0'))).toBe(true);
    expect(screen.getByText('Sin partidas en los últimos 365 días')).toBeInTheDocument();
    await user.click(cell('jueves, 12 de noviembre de 2026'));
    expect(screen.getByText('jue 12/11 · 0 de 5 completados')).toBeInTheDocument();
  });

  it('localizes to English (TS-20)', async () => {
    const user = userEvent.setup();
    render(
      <Heatmap
        {...F}
        locale="en"
        cellLabel={(d) => `${d.longDate}: ${d.completed} of 5 challenges completed`}
        detailLabel={(d) => `${d.isToday ? 'Today' : d.shortDate} · ${d.completed} of 5 completed`}
      />,
    );
    expect(
      screen.getByRole('button', {
        name: 'Tuesday, November 10, 2026: 5 of 5 challenges completed',
      }),
    ).toBeInTheDocument();
    screen.getByRole('button', { name: /^Sunday, November 15, 2026/ }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByText('Sun 11/08 · 0 of 5 completed')).toBeInTheDocument();
    expect(screen.getByText('Dec')).toBeInTheDocument();
    expect(screen.getByText('Nov')).toBeInTheDocument();
  });

  it('shows month labels hidden from assistive tech (TS-21)', () => {
    render(<Heatmap {...F} />);
    for (const m of [
      'dic',
      'ene',
      'feb',
      'mar',
      'abr',
      'may',
      'jun',
      'jul',
      'ago',
      'sept',
      'oct',
      'nov',
    ]) {
      const el = screen.getByText(m);
      expect(el.closest('[aria-hidden="true"]')).not.toBeNull();
    }
  });

  it('renders the 0-5 legend (TS-22)', () => {
    const { container } = render(<Heatmap {...F} />);
    const legend = [...container.querySelectorAll('[aria-hidden="true"]')].find(
      (el) => el.textContent === '012345',
    );
    expect(legend).toBeDefined();
    const squares = [...(legend?.querySelectorAll('span > span') ?? [])];
    expect(squares.map((s) => s.className.match(/bg-heatmap-\d/)?.[0])).toEqual([
      'bg-heatmap-0',
      'bg-heatmap-1',
      'bg-heatmap-2',
      'bg-heatmap-3',
      'bg-heatmap-4',
      'bg-heatmap-4',
    ]);
  });

  it('opens scrolled to the right (TS-23)', () => {
    const setter = vi.fn();
    const sw = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollWidth');
    const sl = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollLeft');
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get: () => 954,
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollLeft', {
      configurable: true,
      get: () => 0,
      set: setter,
    });
    try {
      const { container } = render(<Heatmap {...F} />);
      expect(setter).toHaveBeenCalledWith(954);
      expect(container.querySelector('.overflow-x-auto')).not.toBeNull();
      expect(container.querySelector('.w-max')).not.toBeNull();
    } finally {
      if (sw) Object.defineProperty(HTMLElement.prototype, 'scrollWidth', sw);
      else Reflect.deleteProperty(HTMLElement.prototype, 'scrollWidth');
      if (sl) Object.defineProperty(HTMLElement.prototype, 'scrollLeft', sl);
      else Reflect.deleteProperty(HTMLElement.prototype, 'scrollLeft');
    }
  });

  it('handles a day change of the platform (TS-24)', async () => {
    const user = userEvent.setup();
    const { rerender, unmount } = render(<Heatmap {...F} />);
    await user.click(cell(DAY.d1116));
    rerender(<Heatmap {...F} today="2026-11-16" />);
    expect(screen.getByText('Hoy · 0 de 5 completados')).toBeInTheDocument();
    const today = screen.getByRole('button', { name: /^lunes, 16 de noviembre de 2026/ });
    expect(today.tabIndex).toBe(0);
    expect(today).toHaveAttribute('aria-current', 'date');
    unmount();

    const second = render(<Heatmap {...F} />);
    await user.click(cell(DAY.d1110));
    second.rerender(<Heatmap {...F} today="2026-11-16" />);
    expect(screen.getByText('mar 10/11 · 5 de 5 completados')).toBeInTheDocument();
  });

  it('has no axe violations with data or empty (TS-25)', async () => {
    const a = render(<Heatmap {...F} />);
    expect(await axe(a.container)).toHaveNoViolations();
    a.unmount();
    const b = render(<Heatmap {...F} days={[]} />);
    expect(await axe(b.container)).toHaveNoViolations();
  });

  it('gives every cell a visible focus ring (TS-26)', () => {
    render(<Heatmap {...F} />);
    for (const b of within(screen.getByRole('grid')).getAllByRole('button')) {
      expect(b).toHaveClass(
        'focus-visible:outline-2',
        'focus-visible:outline-offset-2',
        'focus-visible:outline-accent',
      );
    }
  });
});
