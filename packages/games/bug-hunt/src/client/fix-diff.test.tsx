// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';

import { FixDiff } from './fix-diff';
import { makeT } from './test-utils';

const FIX = {
  before: '\t\tif nums[i] >= nums[best] {',
  after: '\t\tif nums[i] > nums[best] {',
};

describe('FixDiff (TS-27)', () => {
  it('shows the buggy and fixed line with literal prefixes', async () => {
    const { container } = render(
      <FixDiff line={4} fix={FIX} language="go" t={makeT('es')} headingLevel={2} />,
    );
    const h = screen.getByRole('heading', { level: 2, name: /el fix · línea 4/ });
    expect(h.querySelector('[aria-hidden="true"]')).toHaveTextContent('//');
    const region = screen.getByRole('region', { name: 'Fix de la línea 4 en Go' });
    expect(region).toHaveAttribute('tabindex', '0');
    const [minus, plus] = [...region.children] as HTMLElement[];
    expect(minus?.textContent?.startsWith('- ')).toBe(true);
    expect(minus?.querySelector('.whitespace-pre:last-child')?.textContent).toBe(FIX.before);
    expect(minus).toHaveClass('bg-status-error-bg');
    expect(plus?.textContent?.startsWith('+ ')).toBe(true);
    expect(plus?.querySelector('.whitespace-pre:last-child')?.textContent).toBe(FIX.after);
    expect(plus).toHaveClass('bg-status-success-bg');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('uses h3 when embedded', () => {
    render(<FixDiff line={4} fix={FIX} language="go" t={makeT('es')} headingLevel={3} />);
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });
});
