import type { GameGenerator } from '@nerdose/core';

import type { BigOPayload } from '../definition';

import { generate, historySpec, usedBankItems } from './generate';
import { verify } from './verify';

export const generator: GameGenerator<BigOPayload> = {
  historySpec,
  usedBankItems,
  generate,
  verify,
};
export { buildRecipe } from './catalog/build';
export { RECIPES } from './catalog/recipes';
export type { BlockKind, Recipe, TrapKind } from './catalog/types';
export { addDays } from './days';
export {
  EXP_BASE_MAX,
  EXP_BASE_MIN,
  FIT_MAX_CV,
  FIT_MIN_SECOND_CV,
  FIT_MIN_SEPARATION,
  fitCounts,
  formatFit,
  type FitResult,
  type FitVerdict,
  type ModelFit,
} from './fit';
export { buildPayload, generate, historySpec, TRAP_RATE, usedBankItems } from './generate';
export { createVerify, verify, VERIFY_CHECKS, type Runner } from './verify';
export { classValue, COUNT_MAX, EXAMPLE_N, SCALE, SCALE_WORK_BUDGET } from './scale';
export { MAX_LINES, MAX_NESTING, MAX_RECURSION_DEPTH, measureCode, treeNesting } from './shape';
export {
  answerWouldRepeat,
  eligibleRecipes,
  MAX_SAME_ANSWER_STREAK,
  recipesUsedNear,
  RECIPE_REPEAT_DAYS,
} from './variety';
