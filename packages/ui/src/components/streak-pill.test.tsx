import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';

import { StreakPill } from './streak-pill';

describe('StreakPill', () => {
  it('is a link armed by the consumer with hover and 44px target (TS-42)', async () => {
    const { container } = render(
      <StreakPill
        value={17}
        render={(p) => <a href="/stats" aria-label="Racha global: 17 días" {...p} />}
      >
        17 días
      </StreakPill>,
    );
    const link = screen.getByRole('link', { name: 'Racha global: 17 días' });
    expect(link).toHaveClass(
      'inline-flex',
      'min-h-11',
      'items-center',
      'gap-2',
      'rounded-full',
      'border',
      'px-3.5',
      'py-2.5',
      'font-mono',
      'text-mono-strong',
      'border-streak-border',
      'bg-streak-bg',
      'text-streak',
      'hover:border-streak-border-hover',
      'hover:text-streak-hover',
      'focus-visible:outline-accent',
    );
    const svg = link.querySelector('svg')!;
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('width', '16');
    expect(svg).toHaveAttribute('height', '16');
    expect(await axe(container)).toHaveNoViolations();
  });

  it.each([
    [0, '0 días'],
    [null, '—'],
  ])('is a neutral span without streak (TS-43) value=%s', (value, text) => {
    const { container } = render(<StreakPill value={value}>{text}</StreakPill>);
    const pill = container.firstElementChild!;
    expect(pill.tagName).toBe('SPAN');
    expect(pill).toHaveClass('bg-control', 'border-border-strong', 'text-text-dim');
    expect(pill).not.toHaveClass('text-streak');
    expect(pill).not.toHaveClass('bg-streak-bg');
    expect(pill).not.toHaveClass('min-h-11');
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('keeps the neutral colors when rendered as a link without streak', () => {
    render(
      <StreakPill value={0} render={(p) => <a href="/stats" aria-label="Racha" {...p} />}>
        0 días
      </StreakPill>,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveClass('text-text-dim', 'hover:text-text-muted', 'min-h-11');
    expect(link).not.toHaveClass('text-streak');
  });

  it('renders no text of its own (TS-55)', () => {
    const { container } = render(<StreakPill value={null}>{''}</StreakPill>);
    expect(container.textContent).toBe('');
  });
});
