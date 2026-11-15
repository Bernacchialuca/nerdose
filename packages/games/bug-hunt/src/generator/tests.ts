import type { Rng } from '@nerdose/core';
import { evaluate, type FuncNode } from '@nerdose/polyglot';

import type { BugHuntTestCase, BugHuntVisibleTest } from '../definition';

import { formatCall } from './format';
import type { Template, TemplateParams, TestInput } from './types';
import { canonicalJson } from './variety';

export const TEST_COUNT = 10;
export const MAX_TEST_DRAWS = 200;
export const EVAL_STEP_LIMIT = 5_000;
export const MAX_VISIBLE = 3;
export const MIN_PASSING = 2;

export type GeneratedTest = { input: TestInput; expected: number | boolean };

/** Total array elements plus scalar arguments. */
export const testSize = (input: TestInput): number =>
  input.reduce<number>((sum, arg) => sum + (typeof arg === 'number' ? 1 : arg.length), 0);

const copyInput = (input: TestInput): (number | number[])[] =>
  input.map((a) => (typeof a === 'number' ? a : [...a]));

/** Edge cases first (declared order), then random inputs until `TEST_COUNT` distinct ones. */
export function buildTests(
  template: Template,
  params: TemplateParams,
  func: FuncNode,
  rng: Rng,
): GeneratedTest[] {
  const seen = new Set<string>();
  const inputs: TestInput[] = [];
  const add = (input: TestInput): void => {
    const key = canonicalJson(input);
    if (seen.has(key) || inputs.length >= TEST_COUNT) return;
    seen.add(key);
    inputs.push(input);
  };
  for (const input of template.edgeCases(params)) add(input);
  for (let draws = 0; inputs.length < TEST_COUNT && draws < MAX_TEST_DRAWS; draws++) {
    add(template.randomInput(rng, params));
  }
  return inputs.map((input) => {
    const outcome = evaluate(func, input, { maxSteps: EVAL_STEP_LIMIT });
    if (!outcome.ok) {
      throw new Error(
        `bug-hunt: ${template.id} reference input fails: ${formatCall(func.name, input)}`,
      );
    }
    return { input: copyInput(input), expected: outcome.value };
  });
}

export type Selection =
  | { status: 'equivalent' }
  | { status: 'not_enough_passing'; failing: BugHuntTestCase; visible: BugHuntVisibleTest[] }
  | { status: 'ok'; failing: BugHuntTestCase; visible: BugHuntVisibleTest[] };

const sizeOf = (t: { input: BugHuntTestCase['input'] }): number => testSize(t.input);

/** Smallest of a list by size; ties keep the order of `items`. */
const bySize = <T extends { input: BugHuntTestCase['input'] }>(items: readonly T[]): T[] =>
  items
    .map((item, order) => ({ item, order }))
    .sort((a, b) => sizeOf(a.item) - sizeOf(b.item) || a.order - b.order)
    .map((x) => x.item);

export function selectTests(tests: readonly BugHuntTestCase[]): Selection {
  const failing = bySize(tests.filter((t) => t.actual !== t.expected));
  const first = failing[0];
  if (first === undefined) return { status: 'equivalent' };
  const passing = bySize(tests.filter((t) => t.actual === t.expected));
  const visible = passing
    .slice(0, MAX_VISIBLE)
    .map((t) => ({ input: copyInput(t.input), expected: t.expected }));
  const status = passing.length < MIN_PASSING ? 'not_enough_passing' : 'ok';
  return { status, failing: first, visible };
}
