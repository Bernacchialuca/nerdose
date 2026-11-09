import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StreakNumber } from './streak-number';

describe('StreakNumber', () => {
  it('renders the compact number and unit read together (TS-44)', () => {
    const { container } = render(
      <StreakNumber
        value={4}
        unit={
          <>
            días
            <br />
            seguidos
          </>
        }
      />,
    );
    const p = container.querySelector('p')!;
    // Última línea de la unidad («seguidos») sobre la base del número, no la primera.
    expect(p).toHaveClass('flex', 'items-baseline-last', 'gap-2.5', 'font-mono');
    const [num, unit] = p.querySelectorAll('span');
    expect(num).toHaveClass('text-display-streak-compact', 'text-streak');
    expect(num?.textContent).toBe('4');
    expect(unit).toHaveClass('text-mono-unit-compact', 'text-text-lede');
    expect(p.textContent).toBe('4díasseguidos');
  });

  it('is gray for 0 and for no data, never amber (TS-45)', () => {
    const zero = render(<StreakNumber value={0} unit="días" />);
    const n0 = zero.container.querySelector('span')!;
    expect(n0.textContent).toBe('0');
    expect(n0).toHaveClass('text-text-dim');
    expect(n0).not.toHaveClass('text-streak');
    zero.unmount();
    const none = render(<StreakNumber value={null} unit="sin datos" />);
    const nn = none.container.querySelector('span')!;
    expect(nn.textContent).toBe('—');
    expect(nn).toHaveClass('text-text-dim');
    expect(nn).not.toHaveClass('text-streak');
  });

  it('renders no text of its own besides the empty marker (TS-55)', () => {
    const { container } = render(<StreakNumber value={null} unit="" />);
    expect(container.textContent).toBe('—');
  });
});
