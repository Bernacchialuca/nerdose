import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { Tabs } from './tabs';

const TABS = [
  { value: 'open', label: 'Abiertos' },
  { value: 'resolved', label: 'Resueltos' },
  { value: 'dismissed', label: 'Descartados' },
] as const;

function Harness() {
  const [value, setValue] = useState<'open' | 'resolved' | 'dismissed'>('open');
  return (
    <Tabs label="Estado" tabs={TABS} value={value} onChange={setValue}>
      <p>contenido {value}</p>
    </Tabs>
  );
}

const tab = (name: string) => screen.getByRole('tab', { name });

describe('Tabs', () => {
  it('selects with click, circular arrows, Home and End (S-033 TS-13)', async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    expect(tab('Abiertos')).toHaveAttribute('aria-selected', 'true');
    await user.click(tab('Resueltos'));
    expect(screen.getByText('contenido resolved')).toBeInTheDocument();
    await user.keyboard('{ArrowRight}');
    expect(tab('Descartados')).toHaveFocus();
    expect(tab('Descartados')).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowRight}');
    expect(tab('Abiertos')).toHaveFocus();
    await user.keyboard('{End}');
    expect(tab('Descartados')).toHaveFocus();
    await user.keyboard('{Home}');
    expect(tab('Abiertos')).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(tab('Descartados')).toHaveAttribute('aria-selected', 'true');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('uses roving tabindex and links tabs to the panel (S-033 TS-14)', () => {
    render(<Harness />);
    expect(tab('Abiertos')).toHaveAttribute('tabindex', '0');
    expect(tab('Resueltos')).toHaveAttribute('tabindex', '-1');
    expect(tab('Descartados')).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('tablist', { name: 'Estado' })).toBeInTheDocument();
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveAttribute('aria-labelledby', tab('Abiertos').id);
    for (const t of screen.getAllByRole('tab'))
      expect(t).toHaveAttribute('aria-controls', panel.id);
    expect(tab('Abiertos')).toHaveClass('bg-nav-active');
  });
});
