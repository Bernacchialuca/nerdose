import { render, screen, within } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';

import { TerminalWindow, type TerminalRow } from './terminal-window';

const ROWS: TerminalRow[] = [
  { key: 'devdle', state: 'done', slug: 'devdle', metric: '4/6', status: 'completado' },
  { key: 'bug-hunt', state: 'in-progress', slug: 'bug-hunt', metric: '—', status: 'en curso' },
  { key: 'big-o', state: 'voided', slug: 'big-o', metric: '—', status: 'anulado' },
  { key: 'timeline', state: 'no-challenge', slug: 'timeline', metric: '—', status: 'sin desafío' },
  { key: 'grep-grid', state: 'pending', slug: 'grep-grid', metric: '—', status: 'sin jugar' },
];

function full() {
  return (
    <TerminalWindow
      label="Progreso de hoy"
      title="~/hoy — progreso.log"
      command="$ nerdose status"
      rows={ROWS}
      summary={{ label: 'racha global', value: '4 días · récord 9', tone: 'streak' }}
      countdown={{ label: 'próximo desafío en', value: '05:42:10' }}
    />
  );
}

describe('TerminalWindow', () => {
  it('renders rows of the five states with icon and text (TS-48)', async () => {
    const { container } = render(full());
    const region = screen.getByRole('region', { name: 'Progreso de hoy' });
    expect(region).toHaveClass(
      'rounded-panel',
      'border',
      'border-border',
      'bg-surface',
      'shadow-window',
      'overflow-hidden',
      'min-w-0',
      'font-mono',
    );
    const bar = region.firstElementChild!;
    expect(bar).toHaveAttribute('aria-hidden', 'true');
    const dots = [...bar.querySelectorAll('.size-2\\.75')];
    expect(dots).toHaveLength(3);
    for (const d of dots) expect(d).toHaveClass('rounded-full', 'bg-window-dot');

    const list = within(region).getByRole('list');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(5);
    for (const item of items) expect(item).toHaveClass('flex', 'flex-wrap');

    const expected: [string, string, string, string][] = [
      ['✓', 'text-status-success', 'completado', 'text-status-success'],
      ['◐', 'text-status-pending', 'en curso', 'text-status-pending'],
      ['⊘', 'text-text-muted', 'anulado', 'text-text-muted'],
      ['–', 'text-text-dim', 'sin desafío', 'text-text-dim'],
      ['○', 'text-text-dim', 'sin jugar', 'text-status-pending'],
    ];
    expected.forEach(([icon, iconClass, status, statusClass], i) => {
      const item = items[i]!;
      const iconEl = item.querySelector('[aria-hidden="true"]')!;
      expect(iconEl.textContent).toBe(icon);
      expect(iconEl).toHaveClass(iconClass);
      expect(within(item).getByText(status)).toHaveClass(statusClass);
    });

    const summary = screen.getByText('racha global').closest('p')!;
    expect(summary).toHaveClass('border-t', 'border-dashed', 'border-border-strong');
    expect(screen.getByText('4 días · récord 9')).toHaveClass('font-bold', 'text-streak');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders upcoming and unavailable as dim (TS-49)', () => {
    render(
      <TerminalWindow
        label="x"
        title="t"
        command="c"
        rows={[
          { key: 'a', state: 'upcoming', slug: 'a', status: 'próximamente' },
          { key: 'b', state: 'unavailable', slug: 'b', status: 'sin sesión' },
        ]}
      />,
    );
    for (const status of ['próximamente', 'sin sesión']) {
      const el = screen.getByText(status);
      expect(el).toHaveClass('text-text-dim');
      const icon = el.closest('li')!.querySelector('[aria-hidden="true"]')!;
      expect(icon.textContent).toBe('○');
      expect(icon).toHaveClass('text-text-dim');
    }
  });

  it('shows the streak line in gray without data (TS-50)', () => {
    render(
      <TerminalWindow
        label="x"
        title="t"
        command="c"
        rows={[]}
        summary={{ label: 'racha global', value: '— sin datos', tone: 'dim' }}
      />,
    );
    const value = screen.getByText('— sin datos');
    expect(value).toHaveClass('text-text-dim');
    expect(value).not.toHaveClass('text-streak');
  });

  it('keeps the countdown out of live regions and blinks the cursor safely (TS-51)', () => {
    const { container } = render(full());
    expect(
      container.querySelectorAll('[aria-live],[role="status"],[role="alert"],[role="timer"]'),
    ).toHaveLength(0);
    const cursor = screen.getByText('▌');
    expect(cursor).toHaveAttribute('aria-hidden', 'true');
    expect(cursor).toHaveClass('text-accent', 'motion-safe:animate-blink');
    expect(screen.getByText('05:42:10')).toHaveClass('text-text');
  });

  it('has no text of its own (TS-55)', () => {
    const { container } = render(<TerminalWindow label="x" title="" command="" rows={[]} />);
    expect(container.textContent).toBe('');
  });
});
