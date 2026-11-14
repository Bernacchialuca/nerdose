import type { BigOPayloadExplanation } from '../../definition';
import { MAX_STEPS } from '../../definition';
import { OPTION_LABEL } from '../../shared/labels';
import { classValue, EXAMPLE_N } from '../scale';

import {
  COMPOSITION,
  FINAL,
  LOOP_STEP,
  NOTE,
  PHI,
  RECURSION_STEP,
  TIP_CATEGORY,
  TIP_TRAP,
  type Localized,
} from './texts';
import type { BuiltRecipe, LoopPart, Recipe } from './types';

const loopStep = (p: LoopPart): Localized => {
  switch (p.kind) {
    case 'constant':
      return LOOP_STEP.constant(p.line, p.k ?? 0);
    case 'linear':
      return p.step === 2 ? LOOP_STEP.linearStep2(p.line) : LOOP_STEP.linear(p.line);
    case 'dependent':
      return LOOP_STEP.dependent(p.line);
    case 'doubling':
      return p.bound === 'outer' ? LOOP_STEP.doublingOuter(p.line) : LOOP_STEP.doubling(p.line);
    case 'halving':
      return p.bound === 'outer' ? LOOP_STEP.halvingOuter(p.line) : LOOP_STEP.halving(p.line);
    case 'binary_search':
      return LOOP_STEP.binarySearch(p.line);
  }
};

const loopNote = (p: LoopPart): Localized => {
  switch (p.kind) {
    case 'constant':
      return NOTE.constant(p.k ?? 0);
    case 'linear':
      return p.step === 2 ? NOTE.linearStep2 : NOTE.linear;
    case 'dependent':
      return NOTE.dependent;
    case 'doubling':
    case 'halving':
      return p.bound === 'outer' ? NOTE.logOuter : NOTE.log;
    case 'binary_search':
      return NOTE.log;
  }
};

function recursiveSteps(recipe: Recipe, built: BuiltRecipe): Localized[] {
  const { shape } = recipe;
  const { loops, calls } = built.parts;
  const lines = loops.map((l) => l.line);
  const callLine = calls[0] ?? 0;
  switch (shape.kind) {
    case 'divide_and_conquer': {
      const key = `${shape.calls}-${shape.work}`;
      const levels = RECURSION_STEP.dcLevels[key];
      if (levels === undefined) throw new Error(`big-o: no_text ${recipe.id}`);
      const work =
        shape.work === 'unit'
          ? []
          : [
              shape.work === 'constant'
                ? RECURSION_STEP.dcWork.constant(lines, loops[0]?.k ?? 0)
                : RECURSION_STEP.dcWork[shape.work](lines),
            ];
      return [...work, levels];
    }
    case 'double_recursion': {
      const second = shape.variant === 'n-1,n-2' ? 'n - 2' : 'n - 1';
      const extra =
        shape.work === 'constant'
          ? [RECURSION_STEP.extraWork(lines[0] ?? 0, loops[0]?.k ?? 0)]
          : [];
      return [
        RECURSION_STEP.doubleCalls(callLine, second),
        ...extra,
        shape.variant === 'n-1,n-2' ? RECURSION_STEP.doubleTree : RECURSION_STEP.doubleTreeEqual,
        ...(shape.variant === 'n-1,n-2' ? [PHI] : []),
      ];
    }
    case 'permutations':
      return [
        RECURSION_STEP.permutationsLoop(lines[0] ?? 0),
        ...(shape.work === 'none' ? [] : [RECURSION_STEP.permutationsExtra]),
        RECURSION_STEP.permutationsTree,
      ];
    default:
      throw new Error(`big-o: not_recursive ${recipe.id}`);
  }
}

function lineNotes(recipe: Recipe, built: BuiltRecipe): BigOPayloadExplanation['line_notes'] {
  const notes = new Map<number, Localized>();
  for (const loop of built.parts.loops) notes.set(loop.line, loopNote(loop));
  const call = built.parts.calls[0];
  if (call !== undefined) {
    const { shape } = recipe;
    notes.set(
      call,
      shape.kind === 'divide_and_conquer'
        ? NOTE.halfCalls(shape.calls)
        : shape.kind === 'permutations'
          ? NOTE.nCalls
          : NOTE.twoCalls,
    );
  }
  return [...notes.entries()].sort(([a], [b]) => a - b).map(([line, text]) => ({ line, text }));
}

export function buildExplanation(recipe: Recipe, built: BuiltRecipe): BigOPayloadExplanation {
  const recursive =
    recipe.shape.kind === 'divide_and_conquer' ||
    recipe.shape.kind === 'double_recursion' ||
    recipe.shape.kind === 'permutations';
  const body: Localized[] = recursive
    ? recursiveSteps(recipe, built)
    : [
        ...built.parts.loops.map(loopStep),
        ...built.parts.compositions.map((c) =>
          c.kind === 'nest'
            ? COMPOSITION.nest(c.terms[0] ?? '', c.terms[1] ?? '')
            : COMPOSITION.seq(c.terms),
        ),
      ];
  const steps = [...body, FINAL(OPTION_LABEL[recipe.answer])];
  if (steps.length > MAX_STEPS) throw new Error(`big-o: too many steps ${recipe.id}`);

  const n = EXAMPLE_N[recipe.answer];
  return {
    steps,
    line_notes: lineNotes(recipe, built),
    tip:
      recipe.trap !== null && recipe.trapOption !== null
        ? TIP_TRAP[recipe.trap](OPTION_LABEL[recipe.trapOption])
        : TIP_CATEGORY[recipe.category],
    example: {
      n,
      ops: built.cost(n),
      trap_ops: recipe.trapOption === null ? null : classValue(recipe.trapOption, n),
    },
  };
}
