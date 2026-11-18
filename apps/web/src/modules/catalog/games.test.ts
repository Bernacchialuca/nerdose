import { GAME_IDS } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { GAME_CATALOG } from './games';

describe('GAME_CATALOG', () => {
  it('TS-1: está completo y en orden de GAME_IDS', () => {
    expect(Object.keys(GAME_CATALOG)).toEqual([...GAME_IDS]);
    expect(GAME_CATALOG['grep-grid']).toEqual({
      minutes: 3,
      untimed: true,
      accentClass: 'text-game-grep-grid',
      barClass: 'bg-game-grep-grid',
    });
    expect(GAME_CATALOG.devdle).toEqual({
      minutes: 2,
      untimed: false,
      accentClass: 'text-game-devdle',
      barClass: 'bg-game-devdle',
    });
    expect(GAME_CATALOG['bug-hunt'].minutes).toBe(2);
    expect(GAME_CATALOG['big-o'].minutes).toBe(1);
    expect(GAME_CATALOG.timeline.minutes).toBe(1);
  });

  it('barClass es el literal de fondo del acento de cada juego', () => {
    for (const id of GAME_IDS) expect(GAME_CATALOG[id].barClass).toBe('bg-game-' + id);
  });
});
