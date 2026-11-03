import { describe, expect, it } from 'vitest';

import { cn } from '../src/cn';

describe('cn', () => {
  it('keeps the last conflicting utility (TS-7)', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('resolves conflicts between project tokens (TS-8)', () => {
    expect(cn('bg-surface', 'bg-bg')).toBe('bg-bg');
    expect(cn('text-text-muted', 'text-accent')).toBe('text-accent');
    expect(cn('border-border', 'border-border-strong')).toBe('border-border-strong');
  });

  it('does not confuse text size with a token color (TS-9)', () => {
    expect(cn('text-sm text-text-muted', 'text-accent')).toBe('text-sm text-accent');
  });

  it('respects variants when merging (TS-10)', () => {
    expect(cn('hover:bg-surface', 'hover:bg-surface-2')).toBe('hover:bg-surface-2');
    expect(cn('bg-surface', 'hover:bg-surface-2')).toBe('bg-surface hover:bg-surface-2');
  });

  it('accepts conditional values like clsx (TS-11)', () => {
    const isActive = false;
    expect(
      cn('font-mono', isActive && 'text-accent', undefined, null, 0, '', { 'bg-bg': true, 'bg-surface': false }, [
        'p-2',
        ['m-1'],
      ]),
    ).toBe('font-mono bg-bg p-2 m-1');
  });

  it('returns an empty string without arguments (TS-12)', () => {
    expect(cn()).toBe('');
  });
});
