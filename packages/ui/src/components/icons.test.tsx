import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChartIcon, HelpIcon, ShareIcon } from './icons';

describe('icons', () => {
  it.each([
    ['HelpIcon', HelpIcon, '18'],
    ['ChartIcon', ChartIcon, '18'],
    ['ShareIcon', ShareIcon, '16'],
  ] as const)('%s renders a Lucide svg (S-021 TS-23)', (_n, Comp, size) => {
    const { container } = render(<Comp className="x" />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
    expect(svg).toHaveAttribute('stroke-width', '2');
    expect(svg).toHaveAttribute('stroke-linecap', 'round');
    expect(svg).toHaveAttribute('stroke-linejoin', 'round');
    expect(svg).toHaveAttribute('width', size);
    expect(svg).toHaveAttribute('height', size);
    expect(svg).toHaveClass('x');
  });

  it('ChartIcon has the DS paths', () => {
    const { container } = render(<ChartIcon />);
    const ds = [...container.querySelectorAll('path')].map((p) => p.getAttribute('d'));
    expect(ds).toEqual(['M3 3v18h18', 'M8 17V11', 'M13 17V7', 'M18 17v-4']);
  });
});
