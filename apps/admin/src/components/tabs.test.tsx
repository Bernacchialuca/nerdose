import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { Tabs } from './tabs';

const TABS = [
  { value: 'a', label: 'Uno' },
  { value: 'b', label: 'Dos' },
  { value: 'c', label: 'Tres' },
] as const;

function Harness() {
  const [value, setValue] = useState<'a' | 'b' | 'c'>('a');
  return (
    <Tabs label="Estado" tabs={TABS} value={value} onChange={setValue}>
      <p>contenido {value}</p>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('selecciona con click y flechas, Home y End', async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    expect(screen.getByRole('tab', { name: 'Uno' })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('tab', { name: 'Dos' }));
    expect(screen.getByText('contenido b')).toBeInTheDocument();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Tres' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Tres' })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Uno' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Tres' })).toHaveFocus();
    await user.keyboard('{Home}');
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Tres' })).toHaveAttribute('aria-selected', 'true');
    expect(await axe(container)).toHaveNoViolations();
  });
});
