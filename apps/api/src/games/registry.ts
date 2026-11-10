import { createGameRegistry } from '@nerdose/core';
import { devdle } from '@nerdose/game-devdle/definition';
import { grepGrid } from '@nerdose/game-grep-grid/definition';

export const games = createGameRegistry([devdle, grepGrid]);
