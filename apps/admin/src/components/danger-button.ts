import { buttonClass, cn } from '@nerdose/ui';

const DANGER_BASE =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 font-mono text-button-md font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

/** Variante `error` del botón (gap aceptado del DS admin): acción destructiva. */
export function dangerButtonClass({ disabled = false }: { disabled?: boolean } = {}): string {
  return disabled
    ? buttonClass({ disabled: true })
    : cn(DANGER_BASE, 'bg-status-error text-status-error-on hover:bg-error');
}
