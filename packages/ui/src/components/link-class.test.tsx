import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';

import { buttonClass } from './button-class';
import { linkClass } from './link-class';

const classes = (s: string) => s.split(/\s+/);

describe('linkClass', () => {
  it('builds the default brand link (TS-20)', () => {
    const c = classes(linkClass());
    for (const k of [
      'inline-flex',
      'min-h-11',
      'items-center',
      'py-3',
      'font-mono',
      'text-mono-body',
      'no-underline',
      'text-accent',
      'hover:text-accent-hover',
      'focus-visible:outline-accent',
    ])
      expect(c, k).toContain(k);
    expect(c).not.toContain('underline');
  });

  it('builds game and subtle tones (TS-21)', () => {
    const game = classes(linkClass({ tone: 'timeline' }));
    expect(game).toContain('text-game-timeline');
    expect(game).toContain('hover:text-game-timeline-light');
    const subtle = classes(linkClass({ tone: 'subtle' }));
    for (const k of ['py-2', 'text-label-comment', 'text-text-body', 'hover:text-text', 'min-h-11'])
      expect(subtle, k).toContain(k);
  });

  it('renders on an anchor without underline (TS-22)', async () => {
    const { container } = render(
      <a href="/stats" className={linkClass()}>
        ver estadísticas →
      </a>,
    );
    const link = screen.getByRole('link', { name: 'ver estadísticas →' });
    expect(classes(link.className)).not.toContain('underline');
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('disabled button keeps focus (TS-19)', () => {
  it('stays focusable with aria-disabled', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <button
        type="button"
        aria-disabled="true"
        className={buttonClass({ variant: 'primary', size: 'md', disabled: true })}
      >
        Sin desafío hoy
      </button>,
    );
    await user.tab();
    const button = screen.getByRole('button', { name: 'Sin desafío hoy' });
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toHaveAttribute('disabled');
    expect(await axe(container)).toHaveNoViolations();
  });
});
