import { createGameRegistry } from '@nerdose/core';
import { bigO } from '@nerdose/game-big-o/definition';
import { devdle } from '@nerdose/game-devdle/definition';
import { grepGrid } from '@nerdose/game-grep-grid/definition';
import { timeline } from '@nerdose/game-timeline/definition';

/** Registry sin bug-hunt: prueba las ramas defensivas de un game_id del enum fuera del registry. */
export const registryWithoutBugHunt = createGameRegistry([devdle, grepGrid, timeline, bigO]);
