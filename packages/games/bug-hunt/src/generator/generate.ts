import {
  BUG_TYPES,
  rngFrom,
  type BugType,
  type GameGenerator,
  type HistorySpec,
} from '@nerdose/core';
import { createTreeBuilder } from '@nerdose/polyglot';

import type { BugHuntPayload, BugHuntTestCase } from '../definition';

import { bugTypesOf, combosFor, TEMPLATES } from './catalog';
import { evaluateCandidate, type CandidateVerdict } from './evaluate-candidate';
import { mutationsOf, type MutationCandidate } from './mutation/candidates';
import { buildPayload, type PayloadInput } from './payload';
import { shuffle } from './random';
import { buildTests } from './tests';
import type { BuiltTemplate, Template, TemplateParams } from './types';
import { keysUsedNear, VARIETY_DAYS } from './variety';

export const MAX_COMBOS = 30;

export const historySpec: HistorySpec = {
  bank: null,
  lastUsedField: '',
  recentDays: VARIETY_DAYS,
  aheadDays: VARIETY_DAYS,
};

export const usedBankItems = (): string[] => [];

/** Fallback priority: fails only by variety, then too few passing tests, then equivalent. */
const RANK = { variety: 0, not_enough_passing: 1, equivalent: 2 } as const;

type Fallback = { rank: number; input: PayloadInput };

const sizeOf = (t: BugHuntTestCase): number =>
  t.input.reduce<number>((sum, a) => sum + (typeof a === 'number' ? 1 : a.length), 0);

/** An equivalent mutant has no failing test: the schema still needs one, `verify` rejects it. */
function inputFor(
  base: Omit<PayloadInput, 'selection'>,
  verdict: Exclude<CandidateVerdict, { verdict: 'invalid' }>,
): PayloadInput {
  if (verdict.selection.status !== 'equivalent') return { ...base, selection: verdict.selection };
  const bySize = [...base.tests].sort((a, b) => sizeOf(a) - sizeOf(b));
  const failing = bySize[0] as BugHuntTestCase;
  const visible = bySize.slice(1, 4).map((t) => ({ input: t.input, expected: t.expected }));
  return { ...base, selection: { status: 'ok', failing, visible } };
}

/**
 * Deterministic: the rng is consumed in a fixed order (bug type, then per attempt the template,
 * the parameters, the random test inputs and the shuffle of the candidates). The payload carries
 * its `date` (first key) because `verify` receives none. With no valid candidate after
 * `MAX_COMBOS` attempts it still returns the best one so `verify` rejects it with its reason.
 */
export function createGenerate(
  templates: readonly Template[],
): GameGenerator<BugHuntPayload>['generate'] {
  const ordered = [...templates].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const admits = new Map(ordered.map((t) => [t.id, new Set(bugTypesOf(t))]));
  const combos = new Map<string, TemplateParams[]>();
  for (const t of ordered) {
    for (const type of bugTypesOf(t)) combos.set(`${t.id}:${type}`, combosFor(t, type));
  }
  const supported: BugType[] = BUG_TYPES.filter((type) =>
    ordered.some((t) => admits.get(t.id)?.has(type)),
  );

  return ({ date, seed, history }) => {
    const rng = rngFrom(seed);
    const usedKeys = keysUsedNear(date, history.recentChallenges);
    const bugType = rng.pick(supported);
    const candidates = ordered.filter((t) => admits.get(t.id)?.has(bugType));
    let fallback: Fallback | undefined;

    for (let attempt = 0; attempt < MAX_COMBOS; attempt++) {
      const template = rng.pick(candidates);
      const params = rng.pick(combos.get(`${template.id}:${bugType}`) as TemplateParams[]);
      const built: BuiltTemplate = template.build(params, createTreeBuilder());
      const tests = buildTests(template, params, built.func, rng);
      const shuffled: MutationCandidate[] = shuffle(mutationsOf(built, bugType), rng);
      for (const candidate of shuffled) {
        const verdict = evaluateCandidate(candidate, tests, usedKeys, {
          template: template.id,
          params,
        });
        if (verdict.verdict === 'invalid') continue;
        const base = { date, template, params, built, candidate, tests: verdict.tests };
        if (verdict.verdict === 'ok') {
          return buildPayload(inputFor(base, verdict));
        }
        const rank = RANK[verdict.verdict];
        if (fallback === undefined || rank <= fallback.rank) {
          fallback = { rank, input: inputFor(base, verdict) };
        }
      }
    }
    if (fallback === undefined) throw new Error('bug-hunt: no evaluable candidate');
    return buildPayload(fallback.input);
  };
}

export const generate = createGenerate(TEMPLATES);
