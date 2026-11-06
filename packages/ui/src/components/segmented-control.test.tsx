import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';

import { SegmentedControl } from './segmented-control';

const OPTIONS = [
  { value: 'es', label: 'ES', lang: 'es' },
  { value: 'en', label: 'EN', lang: 'en' },
] as const;

const setup = (props: { disabled?: boolean } = {}) => {
  const onChange = vi.fn();
  const utils = render(
    <SegmentedControl label="Idioma" value="es" options={OPTIONS} onChange={onChange} {...props} />,
  );
  return { onChange, ...utils };
};

describe('SegmentedControl', () => {
  it('renders the ES/EN group with the active indicator (TS-52)', async () => {
    const user = userEvent.setup();
    const { onChange, container } = setup();
    const group = screen.getByRole('group', { name: 'Idioma' });
    expect(group).toHaveClass(
      'inline-flex',
      'gap-0.5',
      'rounded-control',
      'border',
      'border-border-strong',
      'bg-control',
      'p-0.75',
      'font-mono',
    );
    const es = screen.getByRole('button', { name: 'ES' });
    const en = screen.getByRole('button', { name: 'EN' });
    expect(es).toHaveAttribute('aria-pressed', 'true');
    expect(es).toHaveAttribute('lang', 'es');
    expect(es).toHaveClass(
      'bg-control-selected',
      'text-text',
      'after:absolute',
      'after:bottom-0.5',
      'after:inset-x-2',
      'after:h-0.5',
      'after:rounded-full',
      'after:bg-accent',
    );
    expect(en).toHaveAttribute('aria-pressed', 'false');
    expect(en).toHaveAttribute('lang', 'en');
    expect(en).toHaveClass('text-text-muted', 'enabled:hover:text-text-body');
    for (const b of [es, en]) {
      expect(b).toHaveClass(
        'relative',
        'h-9',
        'min-w-11',
        'rounded-segment',
        'text-meta-strong',
        'before:absolute',
        'before:-inset-y-1',
        'before:inset-x-0',
      );
    }
    await user.click(en);
    expect(onChange).toHaveBeenCalledWith('en');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('is operable with the keyboard (TS-53)', async () => {
    const user = userEvent.setup();
    const { onChange } = setup();
    await user.tab();
    expect(screen.getByRole('button', { name: 'ES' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'EN' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('en');
  });

  it('disables both segments (TS-54)', async () => {
    const user = userEvent.setup();
    const { onChange } = setup({ disabled: true });
    for (const name of ['ES', 'EN']) {
      const b = screen.getByRole('button', { name });
      expect(b).toBeDisabled();
      expect(b).toHaveClass('disabled:cursor-not-allowed', 'disabled:text-text-disabled');
    }
    await user.click(screen.getByRole('button', { name: 'EN' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('has no text of its own (TS-55)', () => {
    const { container } = render(
      <SegmentedControl
        label="x"
        value="a"
        options={[{ value: 'a', label: '' }]}
        onChange={() => {}}
      />,
    );
    expect(container.textContent).toBe('');
  });
});
