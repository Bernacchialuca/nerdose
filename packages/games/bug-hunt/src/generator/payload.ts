import { emit } from '@nerdose/polyglot';

import type { BugHuntPayload, BugHuntTestCase } from '../definition';

import { buildExplanation } from './explain';
import type { MutationCandidate } from './mutation/candidates';
import { OPERATORS } from './mutation/operators';
import type { Selection } from './tests';
import type { BuiltTemplate, Template, TemplateParams } from './types';

const LANGS = ['js', 'go', 'java'] as const;

export type PayloadInput = {
  date: string;
  template: Template;
  params: TemplateParams;
  built: BuiltTemplate;
  candidate: MutationCandidate;
  tests: BugHuntTestCase[];
  selection: Exclude<Selection, { status: 'equivalent' }>;
};

/** The payload of a candidate; keys follow the order of the schema. */
export function buildPayload(input: PayloadInput): BugHuntPayload {
  const { date, template, params, built, candidate, tests, selection } = input;
  const reference = emit(built.func, 'js');
  const bugLine = reference.lineOf[candidate.site.node];
  if (bugLine === undefined) {
    throw new Error(`bug-hunt: site node ${candidate.site.node} has no line`);
  }
  const mutated = Object.fromEntries(LANGS.map((l) => [l, emit(candidate.mutant, l)])) as Record<
    (typeof LANGS)[number],
    ReturnType<typeof emit>
  >;
  const fixLine = (lang: (typeof LANGS)[number]): string => {
    const line = emit(built.func, lang).code.split('\n')[bugLine - 1];
    if (line === undefined) throw new Error('bug-hunt: bug_line out of range');
    return line;
  };
  const functionName = template.functionName(params);
  return {
    date,
    template: template.id,
    params: { ...params },
    function_name: functionName,
    bug_type: OPERATORS[candidate.operator].bugType,
    mutation: {
      operator: candidate.operator,
      node: candidate.site.node,
      from: candidate.from,
      to: candidate.to,
    },
    spec: template.spec(params),
    code: { js: mutated.js.code, go: mutated.go.code, java: mutated.java.code },
    bug_line: bugLine,
    fix: { js: fixLine('js'), go: fixLine('go'), java: fixLine('java') },
    pickable_lines: [...mutated.js.statementLines],
    tests,
    visible_tests: selection.visible,
    failing_test: selection.failing,
    explanation: buildExplanation({
      operator: candidate.operator,
      role: candidate.site.role,
      from: candidate.from,
      to: candidate.to,
      functionName,
      failing: selection.failing,
    }),
  };
}
