import { createGameRegistry } from '@nerdose/core';
import { bigO } from '@nerdose/game-big-o/definition';
import { bugHunt } from '@nerdose/game-bug-hunt/definition';
import { devdle } from '@nerdose/game-devdle/definition';
import { grepGrid } from '@nerdose/game-grep-grid/definition';
import { timeline } from '@nerdose/game-timeline/definition';

export const games = createGameRegistry([devdle, grepGrid, timeline, bigO, bugHunt]);
