import { describe, expect, it } from 'vitest';

import { navItemClass } from './nav-item-class';

const classes = (s: string) => s.split(/\s+/);

describe('navItemClass', () => {
  const base = [
    'inline-flex',
    'min-h-11',
    'items-center',
    'rounded-tile',
    'px-3.5',
    'py-3',
    'font-mono',
    'text-mono-body',
    'focus-visible:outline-accent',
  ];

  it('builds the active item without brand color (TS-23)', () => {
    const c = classes(navItemClass({ active: true }));
    for (const k of [...base, 'bg-nav-active', 'text-text']) expect(c, k).toContain(k);
    expect(c).not.toContain('text-accent');
  });

  it('builds the inactive item with hover (TS-23)', () => {
    const c = classes(navItemClass({ active: false }));
    for (const k of [...base, 'text-text-muted', 'hover:text-text-body']) expect(c, k).toContain(k);
    expect(c).not.toContain('bg-nav-active');
  });
});
