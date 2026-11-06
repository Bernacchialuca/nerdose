// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { GAME_CLASSES } from './game-classes';

const source = readFileSync(fileURLToPath(new URL('./game-classes.ts', import.meta.url)), 'utf8');

describe('game classes', () => {
  it('writes the five accent combinations as scannable literals (TS-17)', () => {
    for (const game of ['devdle', 'bug-hunt', 'big-o', 'timeline', 'grep-grid']) {
      expect(source).toContain(`'bg-game-${game}'`);
      expect(source).toContain(`'text-game-${game}-on'`);
      expect(source).toContain(`'hover:bg-game-${game}-light'`);
    }
    expect(source).not.toContain('${');
    expect(Object.keys(GAME_CLASSES)).toHaveLength(5);
  });
});
