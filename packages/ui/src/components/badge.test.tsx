import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge } from './badge';

describe('Badge', () => {
  const base = [
    'inline-flex',
    'flex-none',
    'items-center',
    'whitespace-nowrap',
    'rounded-full',
    'px-2.5',
    'py-1',
    'font-mono',
    'text-meta',
  ];

  it('renders each tone (TS-38)', () => {
    const { rerender } = render(<Badge tone="success">✓ 4/6</Badge>);
    expect(screen.getByText('✓ 4/6')).toHaveClass(
      ...base,
      'bg-status-success-badge',
      'text-status-success-badge-text',
    );
    rerender(<Badge tone="pending">sin jugar</Badge>);
    expect(screen.getByText('sin jugar')).toHaveClass(
      ...base,
      'bg-status-pending-badge',
      'text-status-pending',
    );
    rerender(<Badge tone="neutral">sin desafío hoy</Badge>);
    expect(screen.getByText('sin desafío hoy')).toHaveClass(
      ...base,
      'bg-surface-inset',
      'text-text-muted',
    );
    rerender(
      <Badge tone="success" strong>
        ok
      </Badge>,
    );
    expect(screen.getByText('ok')).toHaveClass('font-bold');
  });

  it('renders the "próximamente" chip without background (TS-39)', () => {
    render(<Badge variant="chip">próximamente</Badge>);
    const chip = screen.getByText('próximamente');
    expect(chip).toHaveClass(
      'rounded-full',
      'border',
      'border-border-strong',
      'px-3',
      'py-1.5',
      'font-mono',
      'text-meta',
      'text-text-muted',
    );
    expect(chip.className).not.toMatch(/(^|\s)bg-/);
    expect(chip.tagName).toBe('SPAN');
  });

  it('merges className and has no text of its own (TS-55)', () => {
    const { container } = render(<Badge className="ml-2">{''}</Badge>);
    expect(container.firstElementChild).toHaveClass('ml-2');
    expect(container.textContent).toBe('');
  });
});
