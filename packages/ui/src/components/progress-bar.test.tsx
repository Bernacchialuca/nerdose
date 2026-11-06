import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';

import { ProgressBar } from './progress-bar';

describe('ProgressBar', () => {
  it('renders segments with progressbar semantics (TS-46)', async () => {
    const { container } = render(
      <ProgressBar value={2} total={5} label="Progreso del día: 2 de 5" />,
    );
    const bar = screen.getByRole('progressbar', { name: 'Progreso del día: 2 de 5' });
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '5');
    expect(bar).toHaveAttribute('aria-valuenow', '2');
    expect(bar).toHaveClass('flex', 'gap-1.5');
    const segments = [...bar.children];
    expect(segments).toHaveLength(5);
    for (const s of segments) {
      expect(s).toHaveAttribute('aria-hidden', 'true');
      expect(s).toHaveClass('h-1.5', 'w-9', 'rounded-full');
    }
    expect(segments.filter((s) => s.classList.contains('bg-accent'))).toHaveLength(2);
    expect(segments.filter((s) => s.classList.contains('bg-control-selected'))).toHaveLength(3);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('clamps out-of-range values (TS-47)', () => {
    const over = render(<ProgressBar value={7} total={5} label="a" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '5');
    expect(over.container.querySelectorAll('.bg-accent')).toHaveLength(5);
    over.unmount();
    const under = render(<ProgressBar value={-1} total={5} label="b" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    expect(under.container.querySelectorAll('.bg-accent')).toHaveLength(0);
  });

  it('renders no text of its own (TS-55)', () => {
    const { container } = render(<ProgressBar value={0} total={5} label="x" />);
    expect(container.textContent).toBe('');
  });
});
