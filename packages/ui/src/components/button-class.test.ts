import { describe, expect, it } from 'vitest';

import { buttonClass } from './button-class';

const classes = (s: string) => s.split(/\s+/);

describe('buttonClass', () => {
  it('builds primary lg (TS-14)', () => {
    const c = classes(buttonClass({ variant: 'primary', size: 'lg' }));
    for (const k of [
      'inline-flex',
      'items-center',
      'justify-center',
      'rounded-control',
      'font-mono',
      'min-h-12',
      'px-5.5',
      'gap-2.5',
      'text-button-lg',
      'bg-accent',
      'text-on-accent',
      'font-bold',
      'hover:bg-accent-hover',
      'focus-visible:outline-2',
      'focus-visible:outline-offset-2',
      'focus-visible:outline-accent',
    ])
      expect(c, k).toContain(k);
    expect(c).not.toContain('w-full');
  });

  it('builds secondary md (TS-15)', () => {
    const c = classes(buttonClass({ variant: 'secondary', size: 'md' }));
    for (const k of [
      'min-h-11',
      'px-4',
      'gap-2',
      'text-button-md',
      'border',
      'border-border-strong',
      'text-text',
      'font-medium',
      'hover:border-border-hover',
    ])
      expect(c, k).toContain(k);
    expect(c).not.toContain('bg-accent');
    expect(c).not.toContain('border-border-interactive');
  });

  it('builds the accent of a game, full width (TS-16)', () => {
    const c = classes(
      buttonClass({ variant: 'accent', game: 'big-o', size: 'md', fullWidth: true }),
    );
    for (const k of [
      'bg-game-big-o',
      'text-game-big-o-on',
      'font-bold',
      'hover:bg-game-big-o-light',
      'w-full',
      'min-h-11',
      'rounded-control',
    ])
      expect(c, k).toContain(k);
  });

  it('defaults to primary md', () => {
    const c = classes(buttonClass());
    expect(c).toContain('bg-accent');
    expect(c).toContain('min-h-11');
  });

  it('is neutral and has no hover when disabled (TS-18)', () => {
    const raw = buttonClass({ variant: 'accent', game: 'devdle', size: 'md', disabled: true });
    const c = classes(raw);
    for (const k of [
      'bg-control',
      'border',
      'border-border-strong',
      'text-text-disabled',
      'cursor-not-allowed',
      'font-bold',
    ])
      expect(c, k).toContain(k);
    expect(c).not.toContain('bg-game-devdle');
    expect(c).not.toContain('text-game-devdle-on');
    expect(raw).not.toContain('hover:');
  });

  it('requires game for accent at type level', () => {
    const typeOnly = () =>
      // @ts-expect-error accent without game
      buttonClass({ variant: 'accent' });
    expect(typeof typeOnly).toBe('function');
  });
});
