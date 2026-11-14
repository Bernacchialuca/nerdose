import type { Rng } from '@nerdose/core';

import type { Branch, ParamValue, Params, Recipe, Shape } from './types';

export const CONSTANT_DOMAIN: readonly number[] = [10, 50, 100];
const STEP_DOMAIN: readonly number[] = [1, 2];
const BRANCH_DOMAIN: readonly Branch[] = ['left', 'right'];

/** The parameter a block takes, if any. */
function slotOf(shape: Shape): 'k' | 'step' | 'branch' | null {
  switch (shape.kind) {
    case 'constant':
      return 'k';
    case 'linear':
      return 'step';
    case 'binary_search':
      return 'branch';
    case 'divide_and_conquer':
      return shape.work === 'constant' ? 'k' : null;
    case 'double_recursion':
      return shape.work === 'constant' ? 'k' : null;
    case 'permutations':
      return shape.work === 'constant' ? 'k' : null;
    default:
      return null;
  }
}

function leaves(shape: Shape): Shape[] {
  if (shape.kind === 'nest') return [...leaves(shape.outer), ...leaves(shape.inner)];
  if (shape.kind === 'seq') return shape.parts.flatMap(leaves);
  return [shape];
}

function domainsOf(recipe: Recipe): (readonly ParamValue[])[] {
  return leaves(recipe.shape).flatMap((leaf): (readonly ParamValue[])[] => {
    switch (slotOf(leaf)) {
      case 'k':
        return [recipe.paramDomain?.k ?? CONSTANT_DOMAIN];
      case 'step':
        return [STEP_DOMAIN];
      case 'branch':
        return [BRANCH_DOMAIN];
      default:
        return [];
    }
  });
}

/** Draws one value per slot, in traversal order (the order the rng is consumed in). */
export function drawParams(recipe: Recipe, rng: Rng): Params {
  return domainsOf(recipe).map((domain) => rng.pick(domain));
}

/** The whole domain of the recipe, as the cartesian product of its slots. */
export function paramCombos(recipe: Recipe): Params[] {
  let combos: ParamValue[][] = [[]];
  for (const domain of domainsOf(recipe)) {
    combos = combos.flatMap((prefix) => domain.map((value) => [...prefix, value]));
  }
  return combos;
}

/** Returns the shape with every parametrizable block filled from `params`. */
export function bindParams(shape: Shape, params: Params): Shape {
  let cursor = 0;
  const take = (): ParamValue => {
    const value = params[cursor++];
    if (value === undefined) throw new Error('big-o: missing_param');
    return value;
  };
  const bind = (s: Shape): Shape => {
    switch (s.kind) {
      case 'nest': {
        const outer = bind(s.outer);
        return { kind: 'nest', outer, inner: bind(s.inner) };
      }
      case 'seq':
        return { kind: 'seq', parts: s.parts.map(bind) };
      default: {
        const slot = slotOf(s);
        if (slot === null) return s;
        const value = take();
        if (slot === 'k' && typeof value === 'number') return { ...s, k: value } as Shape;
        if (slot === 'step' && (value === 1 || value === 2)) return { ...s, step: value } as Shape;
        if (slot === 'branch' && (value === 'left' || value === 'right')) {
          return { ...s, branch: value } as Shape;
        }
        throw new Error(`big-o: invalid_param ${slot}`);
      }
    }
  };
  const bound = bind(shape);
  if (cursor !== params.length) throw new Error('big-o: too_many_params');
  return bound;
}
