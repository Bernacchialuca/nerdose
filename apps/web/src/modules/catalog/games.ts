import type { GameId } from '@nerdose/core';

type GameMeta = { minutes: number; untimed: boolean; accentClass: string };

/** Metadatos estáticos de cada juego, en el orden de `GAME_IDS`. */
export const GAME_CATALOG = {
  devdle: { minutes: 2, untimed: false, accentClass: 'text-game-devdle' },
  'grep-grid': { minutes: 3, untimed: true, accentClass: 'text-game-grep-grid' },
  timeline: { minutes: 1, untimed: false, accentClass: 'text-game-timeline' },
  'big-o': { minutes: 1, untimed: false, accentClass: 'text-game-big-o' },
  'bug-hunt': { minutes: 2, untimed: false, accentClass: 'text-game-bug-hunt' },
} satisfies Record<GameId, GameMeta>;
