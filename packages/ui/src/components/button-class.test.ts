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

  it('builds the icon variant (S-021 TS-5)', () => {
    const c = buttonClass({ variant: 'icon' }).split(' ');
    for (const x of [
      'inline-flex',
      'size-11',
      'items-center',
      'justify-center',
      'rounded-control',
      'border',
      'border-border-strong',
      'bg-control',
      'text-text-body',
      'hover:border-border-hover',
      'focus-visible:outline-accent',
    ])
      expect(c).toContain(x);
    for (const x of ['min-h-12', 'px-4', 'font-mono', 'w-full']) expect(c).not.toContain(x);
  });

  it('builds the disabled icon variant (S-021 TS-6)', () => {
    const c = buttonClass({ variant: 'icon', disabled: true }).split(' ');
    for (const x of [
      'size-11',
      'bg-control',
      'border-border-strong',
      'text-text-disabled',
      'cursor-not-allowed',
    ])
      expect(c).toContain(x);
    expect(c).not.toContain('hover:border-border-hover');
  });

  it('builds the share size (S-021 TS-7, TS-8)', () => {
    const c = buttonClass({ variant: 'accent', game: 'devdle', size: 'share' }).split(' ');
    for (const x of [
      'h-11',
      'gap-2',
      'px-3.5',
      'text-button-md',
      'font-bold',
      'bg-game-devdle',
      'text-game-devdle-on',
      'hover:bg-game-devdle-light',
    ])
      expect(c).toContain(x);
    expect(c).not.toContain('min-h-12');
    expect(c).not.toContain('px-4');
    const d = buttonClass({
      variant: 'accent',
      game: 'devdle',
      size: 'share',
      disabled: true,
    }).split(' ');
    for (const x of ['h-11', 'px-3.5', 'bg-control', 'text-text-disabled', 'cursor-not-allowed'])
      expect(d).toContain(x);
    expect(d).not.toContain('bg-game-devdle');
  });

  it('keeps existing outputs (S-021 TS-9)', () => {
    expect(buttonClass()).toContain('min-h-11 gap-2 px-4 text-button-md');
    expect(buttonClass()).toContain('bg-accent');
    expect(buttonClass({ size: 'lg', variant: 'secondary' })).toContain(
      'min-h-12 gap-2.5 px-5.5 text-button-lg',
    );
  });
});
