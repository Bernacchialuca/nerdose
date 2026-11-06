import { cn } from '../cn';

import { FOCUS_RING } from './focus';
import { GAME_CLASSES, type UiGameId } from './game-classes';

type ButtonBase = { size?: 'lg' | 'md'; fullWidth?: boolean; disabled?: boolean };

export type ButtonClassOptions =
  | (ButtonBase & { variant?: 'primary' | 'secondary' })
  | (ButtonBase & { variant: 'accent'; game: UiGameId });

/** Solo clases: el consumidor pone `aria-disabled="true"` y bloquea la acción (en un `<Link>`, no navegar). */
export function buttonClass(options: ButtonClassOptions = {}): string {
  const { size = 'md', fullWidth = false, disabled = false } = options;
  const variant = options.variant ?? 'primary';
  const weight = variant === 'secondary' ? 'font-medium' : 'font-bold';

  let colors: string;
  if (disabled) {
    colors = 'border border-border-strong bg-control text-text-disabled cursor-not-allowed';
  } else if (variant === 'primary') {
    colors = 'bg-accent text-on-accent hover:bg-accent-hover';
  } else if (variant === 'secondary') {
    colors = 'border border-border-strong text-text hover:border-border-hover';
  } else {
    const game = GAME_CLASSES[(options as { game: UiGameId }).game];
    colors = cn(game.bg, game.on, game.bgHover);
  }

  return cn(
    'inline-flex items-center justify-center rounded-control font-mono',
    FOCUS_RING,
    size === 'lg' ? 'min-h-12 gap-2.5 px-5.5 text-button-lg' : 'min-h-11 gap-2 px-4 text-button-md',
    weight,
    colors,
    fullWidth && 'w-full',
  );
}
