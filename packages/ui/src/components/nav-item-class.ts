import { cn } from '../cn';

import { FOCUS_RING } from './focus';

/** `aria-current="page"` lo pone el `NavLink` del consumidor. */
export function navItemClass({ active }: { active: boolean }): string {
  return cn(
    'inline-flex min-h-11 items-center rounded-tile px-3.5 py-3 font-mono text-mono-body',
    FOCUS_RING,
    active ? 'bg-nav-active text-text' : 'text-text-muted hover:text-text-body',
  );
}
