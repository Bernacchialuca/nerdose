// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { cn } from '../src/cn';
import { RADIUS_ROLES, SHADOW_ROLES, TEXT_ROLES } from '../src/theme';

import { declarations } from './parse-theme';

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
      cn(
        'font-mono',
        isActive && 'text-accent',
        undefined,
        null,
        0,
        '',
        { 'bg-bg': true, 'bg-surface': false },
        ['p-2', ['m-1']],
      ),
    ).toBe('font-mono bg-bg p-2 m-1');
  });

  it('returns an empty string without arguments (TS-12)', () => {
    expect(cn()).toBe('');
  });
});

describe('cn with theme roles', () => {
  it('keeps a typographic role next to a color (TS-10)', () => {
    expect(cn('text-display-hero text-streak')).toBe('text-display-hero text-streak');
  });

  it('keeps the game-piece roles next to a color (S-021 TS-4)', () => {
    expect(cn('text-game-tile-lg text-status-absent-text')).toBe(
      'text-game-tile-lg text-status-absent-text',
    );
    expect(cn('text-brand-crumb text-game-devdle')).toBe('text-brand-crumb text-game-devdle');
    for (const r of [
      'title-game',
      'brand-logo-compact',
      'brand-crumb',
      'game-tile-lg',
      'game-tile-sm',
      'game-key',
      'game-key-small',
      'body-sm',
      'body-sm-legend',
      'code-share',
    ])
      expect(TEXT_ROLES).toContain(r);
  });

  it('resolves role, radius and shadow conflicts (TS-11)', () => {
    expect(cn('text-meta', 'text-mono-body')).toBe('text-mono-body');
    expect(cn('rounded-control', 'rounded-panel')).toBe('rounded-panel');
    expect(cn('shadow-window', 'shadow-next-big-o')).toBe('shadow-next-big-o');
    expect(cn('p-4.5', 'p-5')).toBe('p-5');
  });

  it('keeps theme lists in sync with tokens.css (TS-12)', () => {
    const names = Object.keys(declarations);
    const pick = (prefix: string) =>
      names
        .filter((n) => n.startsWith(prefix) && !n.slice(prefix.length).includes('--'))
        .map((n) => n.slice(prefix.length))
        .sort();
    expect([...TEXT_ROLES].sort()).toEqual(pick('--text-'));
    expect([...RADIUS_ROLES].sort()).toEqual(pick('--radius-'));
    expect([...SHADOW_ROLES].sort()).toEqual(pick('--shadow-'));
  });
});
