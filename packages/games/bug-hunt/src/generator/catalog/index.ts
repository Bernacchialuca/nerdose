import { BUG_TYPES, type BugType } from '@nerdose/core';
import { createTreeBuilder } from '@nerdose/polyglot';

import { OPERATORS } from '../mutation/operators';
import type { Template, TemplateParams } from '../types';

import { allWhere } from './all-where';
import { anyWhere } from './any-where';
import { binarySearch } from './binary-search';
import { countEqualNeighbors } from './count-equal-neighbors';
import { countPairs } from './count-pairs';
import { countWhere } from './count-where';
import { extremeIndex } from './extreme-index';
import { firstIndexWhere } from './first-index-where';
import { isPalindrome } from './is-palindrome';
import { isSorted } from './is-sorted';
import { lastIndexWhere } from './last-index-where';
import { longestRun } from './longest-run';
import { maxWindowSum } from './max-window-sum';
import { prefixWithinBudget } from './prefix-within-budget';
import { splitDifference } from './split-difference';
import { sumRange } from './sum-range';
import { trimLength } from './trim-length';
import { valueRange } from './value-range';

/** Ordered by `id`. */
export const TEMPLATES: readonly Template[] = [
  allWhere,
  anyWhere,
  binarySearch,
  countEqualNeighbors,
  countPairs,
  countWhere,
  extremeIndex,
  firstIndexWhere,
  isPalindrome,
  isSorted,
  lastIndexWhere,
  longestRun,
  maxWindowSum,
  prefixWithinBudget,
  splitDifference,
  sumRange,
  trimLength,
  valueRange,
];

export function templateById(id: string): Template {
  const found = TEMPLATES.find((t) => t.id === id);
  if (found === undefined) throw new Error(`bug-hunt: unknown template ${id}`);
  return found;
}

const typesOfCombo = (template: Template, params: TemplateParams): Set<BugType> => {
  const built = template.build(params, createTreeBuilder());
  return new Set(
    built.sites.flatMap((s) => s.operators.map((operator) => OPERATORS[operator].bugType)),
  );
};

/** The bug types some site of some combination of the template admits (derived, not declared). */
export function bugTypesOf(template: Template): BugType[] {
  const all = template.combos.map((p) => typesOfCombo(template, p));
  return BUG_TYPES.filter((type) => all.some((types) => types.has(type)));
}

/** The combinations of the template that admit `bugType`, in declared order. */
export function combosFor(template: Template, bugType: BugType): TemplateParams[] {
  return template.combos.filter((p) => typesOfCombo(template, p).has(bugType));
}
