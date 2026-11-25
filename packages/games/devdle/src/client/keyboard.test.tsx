// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Keyboard } from './keyboard';
import { makeT } from './test-utils';

describe('Keyboard spacing (TS-11)', () => {
  it('keeps the gap and key sizing that justify the 320px target-size exception', () => {
    render(
      <Keyboard
        states={{}}
        onLetter={vi.fn()}
        onBackspace={vi.fn()}
        onSubmit={vi.fn()}
        submitDisabled={false}
        t={makeT('es')}
      />,
    );
    const group = screen.getByRole('group', { name: 'Teclado' });
    expect(group.children).toHaveLength(3);
    for (const row of group.children) expect(row).toHaveClass('gap-1.5');
    for (const letter of ['Q', 'A', 'Z']) {
      expect(screen.getByRole('button', { name: letter })).toHaveClass(
        'h-13.5',
        'basis-0',
        'grow',
        'min-w-0',
      );
    }
  });
});
