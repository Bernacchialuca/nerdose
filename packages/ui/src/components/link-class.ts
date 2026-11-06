import { cn } from '../cn';

import { FOCUS_RING } from './focus';
import { GAME_CLASSES, type UiGameId } from './game-classes';

export type LinkTone = 'brand' | 'subtle' | UiGameId;

export function linkClass(options: { tone?: LinkTone } = {}): string {
  const tone = options.tone ?? 'brand';
  let tonal: string;
  if (tone === 'brand') tonal = 'py-3 text-mono-body text-accent hover:text-accent-hover';
  else if (tone === 'subtle') tonal = 'py-2 text-label-comment text-text-body hover:text-text';
  else tonal = cn('py-3 text-mono-body', GAME_CLASSES[tone].text, GAME_CLASSES[tone].textHover);
  return cn('inline-flex min-h-11 items-center gap-1 font-mono no-underline', FOCUS_RING, tonal);
}
