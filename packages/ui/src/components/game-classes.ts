export type UiGameId = 'devdle' | 'grep-grid' | 'timeline' | 'big-o' | 'bug-hunt';

export type GameClasses = {
  text: string;
  textHover: string;
  bg: string;
  bgHover: string;
  on: string;
  tintBg: string;
  tintBorder: string;
  featuredBorder: string;
  nextShadow: string;
};

// Literales completos: Tailwind solo genera lo que encuentra escrito en src/components.
export const GAME_CLASSES: Record<UiGameId, GameClasses> = {
  devdle: {
    text: 'text-game-devdle',
    textHover: 'hover:text-game-devdle-light',
    bg: 'bg-game-devdle',
    bgHover: 'hover:bg-game-devdle-light',
    on: 'text-game-devdle-on',
    tintBg: 'bg-game-devdle-tint',
    tintBorder: 'border-game-devdle-border',
    featuredBorder: 'border-game-devdle-featured',
    nextShadow: 'shadow-next-devdle',
  },
  'bug-hunt': {
    text: 'text-game-bug-hunt',
    textHover: 'hover:text-game-bug-hunt-light',
    bg: 'bg-game-bug-hunt',
    bgHover: 'hover:bg-game-bug-hunt-light',
    on: 'text-game-bug-hunt-on',
    tintBg: 'bg-game-bug-hunt-tint',
    tintBorder: 'border-game-bug-hunt-border',
    featuredBorder: 'border-game-bug-hunt-featured',
    nextShadow: 'shadow-next-bug-hunt',
  },
  'big-o': {
    text: 'text-game-big-o',
    textHover: 'hover:text-game-big-o-light',
    bg: 'bg-game-big-o',
    bgHover: 'hover:bg-game-big-o-light',
    on: 'text-game-big-o-on',
    tintBg: 'bg-game-big-o-tint',
    tintBorder: 'border-game-big-o-border',
    featuredBorder: 'border-game-big-o-featured',
    nextShadow: 'shadow-next-big-o',
  },
  timeline: {
    text: 'text-game-timeline',
    textHover: 'hover:text-game-timeline-light',
    bg: 'bg-game-timeline',
    bgHover: 'hover:bg-game-timeline-light',
    on: 'text-game-timeline-on',
    tintBg: 'bg-game-timeline-tint',
    tintBorder: 'border-game-timeline-border',
    featuredBorder: 'border-game-timeline-featured',
    nextShadow: 'shadow-next-timeline',
  },
  'grep-grid': {
    text: 'text-game-grep-grid',
    textHover: 'hover:text-game-grep-grid-light',
    bg: 'bg-game-grep-grid',
    bgHover: 'hover:bg-game-grep-grid-light',
    on: 'text-game-grep-grid-on',
    tintBg: 'bg-game-grep-grid-tint',
    tintBorder: 'border-game-grep-grid-border',
    featuredBorder: 'border-game-grep-grid-featured',
    nextShadow: 'shadow-next-grep-grid',
  },
};
