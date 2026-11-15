import { createTreeBuilder, emit } from '@nerdose/polyglot';
import { BUG_TYPES } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { payloadSchema } from '../definition';
import { CODE_MAX_INDEX, PAYLOAD, SPEC_MAX_INDEX } from '../definition/test-fixtures';

import { templateById, TEMPLATES } from './catalog';
import { evaluateCandidate } from './evaluate-candidate';
import { mutationsOf } from './mutation/candidates';
import { buildPayload } from './payload';
import { D } from './test-fixtures';

describe('buildPayload (TS-25)', () => {
  it('builds the payload of a fixed candidate', () => {
    const template = templateById('extreme_index');
    const params = { extreme: 'max', tie: 'first' };
    const built = template.build(params, createTreeBuilder());
    const candidate = mutationsOf(built, 'comparison')[0];
    if (candidate === undefined) throw new Error('no candidate');
    const verdict = evaluateCandidate(
      candidate,
      PAYLOAD.tests.map((t) => ({ input: t.input, expected: t.expected })),
      new Set(),
      { template: template.id, params },
    );
    if (verdict.verdict !== 'ok') throw new Error(`verdict ${verdict.verdict}`);
    const payload = buildPayload({
      date: D,
      template,
      params,
      built,
      candidate,
      tests: verdict.tests,
      selection: verdict.selection,
    });
    expect(payloadSchema.parse(payload)).toEqual(payload);
    expect(Object.keys(payload)).toEqual([
      'date',
      'template',
      'params',
      'function_name',
      'bug_type',
      'mutation',
      'spec',
      'code',
      'bug_line',
      'fix',
      'pickable_lines',
      'tests',
      'visible_tests',
      'failing_test',
      'explanation',
    ]);
    expect(payload).toMatchObject({
      date: '2027-03-15',
      template: 'extreme_index',
      params: { extreme: 'max', tie: 'first' },
      function_name: 'maxIndex',
      bug_type: 'comparison',
      mutation: { operator: 'relax_comparison', node: candidate.site.node, from: '>', to: '>=' },
      spec: SPEC_MAX_INDEX,
      bug_line: 4,
      pickable_lines: [2, 3, 4, 5, 8],
      fix: PAYLOAD.fix,
      code: CODE_MAX_INDEX,
      tests: PAYLOAD.tests,
      visible_tests: PAYLOAD.visible_tests,
      failing_test: PAYLOAD.failing_test,
    });
  });
});

describe('a mutation touches a single line (TS-16)', () => {
  it('differs from the correct code only in bug_line, in the 3 languages', () => {
    for (const t of TEMPLATES) {
      for (const p of t.combos) {
        const built = t.build(p, createTreeBuilder());
        const line = emit(built.func, 'js').lineOf;
        for (const type of BUG_TYPES) {
          for (const c of mutationsOf(built, type)) {
            const bugLine = line[c.site.node] as number;
            for (const lang of ['js', 'go', 'java'] as const) {
              const right = emit(built.func, lang).code.split('\n');
              const wrong = emit(c.mutant, lang).code.split('\n');
              expect(wrong.length, `${t.id} ${c.operator}`).toBe(right.length);
              const diff = right.flatMap((l, i) => (l !== wrong[i] ? [i + 1] : []));
              expect(diff, `${t.id} ${JSON.stringify(p)} ${c.operator} ${lang}`).toEqual([bugLine]);
              const indent = (s: string) => /^\s*/.exec(s)?.[0];
              expect(indent(right[bugLine - 1] as string)).toBe(
                indent(wrong[bugLine - 1] as string),
              );
            }
          }
        }
      }
    }
  });
});
