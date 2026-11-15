import { checkPortable, evaluate } from '@nerdose/polyglot';

import type { BugHuntTestCase } from '../definition';

import type { MutationCandidate } from './mutation/candidates';
import { EVAL_STEP_LIMIT, selectTests, type GeneratedTest, type Selection } from './tests';
import type { TemplateParams } from './types';
import { varietyKey } from './variety';

type Selected<S extends Selection['status']> = Extract<Selection, { status: S }>;

export type CandidateVerdict =
  | { verdict: 'invalid' }
  | { verdict: 'equivalent'; tests: BugHuntTestCase[]; selection: Selected<'equivalent'> }
  | {
      verdict: 'not_enough_passing';
      tests: BugHuntTestCase[];
      selection: Selected<'not_enough_passing'>;
    }
  | { verdict: 'variety' | 'ok'; tests: BugHuntTestCase[]; selection: Selected<'ok'> };

/** Classifies a mutation: invalid, equivalent, too few passing tests, repeated, or good. */
export function evaluateCandidate(
  candidate: MutationCandidate,
  generated: readonly GeneratedTest[],
  usedKeys: ReadonlySet<string>,
  identity: { template: string; params: TemplateParams },
): CandidateVerdict {
  if (checkPortable(candidate.mutant).length > 0) return { verdict: 'invalid' };
  const tests: BugHuntTestCase[] = [];
  for (const t of generated) {
    const outcome = evaluate(candidate.mutant, t.input, { maxSteps: EVAL_STEP_LIMIT });
    if (!outcome.ok) return { verdict: 'invalid' };
    tests.push({
      input: t.input.map((a) => (typeof a === 'number' ? a : [...a])),
      expected: t.expected,
      actual: outcome.value,
    });
  }
  const selection = selectTests(tests);
  if (selection.status === 'equivalent') return { verdict: 'equivalent', tests, selection };
  if (selection.status === 'not_enough_passing') {
    return { verdict: 'not_enough_passing', tests, selection };
  }
  const key = varietyKey({
    template: identity.template,
    params: identity.params,
    mutation: {
      operator: candidate.operator,
      node: candidate.site.node,
      from: candidate.from,
      to: candidate.to,
    },
  });
  return { verdict: usedKeys.has(key) ? 'variety' : 'ok', tests, selection };
}
