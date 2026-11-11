import { cn } from '../cn';

import { FOCUS_RING } from './focus';

export type DataTableClasses = { region: string; table: string; th: string; td: string };

/** Clases del DS data-table; la semántica (<caption>, scope, tabIndex={0} + aria-label en la región) la pone el consumidor. */
export function dataTableClass(): DataTableClasses {
  return {
    region: cn('overflow-x-auto rounded-panel border border-border bg-surface', FOCUS_RING),
    table: 'w-full min-w-160 border-collapse font-mono text-mono-body text-text-body',
    th: 'border-b border-border-subtle px-5 py-3.5 text-left font-mono text-label-comment font-medium text-text-dim',
    td: 'border-b border-border-row px-5 py-3.5 align-middle',
  };
}
