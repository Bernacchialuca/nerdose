import { BUG_TYPES } from '@nerdose/core';
import { createTreeBuilder, evaluate, type FuncNode } from '@nerdose/polyglot';
import { expect } from 'vitest';

import { payloadSchema, type BugHuntPayload } from '../definition';

import { TEMPLATES, templateById } from './catalog';
import { mutationsOf, type MutationCandidate } from './mutation/candidates';
import { MAX_LINES, MAX_NESTING, measureCode, MIN_LINES } from './shape';
import { EVAL_STEP_LIMIT, selectTests, TEST_COUNT } from './tests';

const LANGS = ['js', 'go', 'java'] as const;

/** Everything `verify` (S-050) will check about the shape of a payload, minus the runs. */
export function assertValidPayload(p: BugHuntPayload): void {
  payloadSchema.parse(p);
  expect(p.spec.es.length).toBeGreaterThan(0);
  expect(p.spec.en.length).toBeGreaterThan(0);
  for (const step of p.explanation.steps) {
    expect(step.es.length).toBeGreaterThan(0);
    expect(step.en.length).toBeGreaterThan(0);
  }
  const lineCounts = new Set<number>();
  for (const lang of LANGS) {
    const m = measureCode(p.code[lang], lang);
    expect(m.lines).toBeGreaterThanOrEqual(MIN_LINES);
    expect(m.lines).toBeLessThanOrEqual(MAX_LINES);
    expect(m.nesting).toBeLessThanOrEqual(MAX_NESTING);
    lineCounts.add(m.lines);
    const lines = p.code[lang].split('\n');
    const bug = lines[p.bug_line - 1] as string;
    expect(bug).not.toBe(p.fix[lang]);
    expect(/^\s*/.exec(bug)?.[0]).toBe(/^\s*/.exec(p.fix[lang])?.[0]);
  }
  expect(lineCounts.size).toBe(1);
  const total = [...lineCounts][0] as number;
  const lines = p.code.js.split('\n');
  expect(p.pickable_lines).toEqual([...new Set(p.pickable_lines)].sort((a, b) => a - b));
  for (const line of p.pickable_lines) {
    expect(line).toBeGreaterThanOrEqual(2);
    expect(line).toBeLessThanOrEqual(total - 1);
    expect(lines[line - 1]?.trim()).not.toBe('}');
  }
  expect(p.pickable_lines).toContain(p.bug_line);
  expect(p.tests).toHaveLength(TEST_COUNT);
  const selection = selectTests(p.tests);
  expect(selection.status).toBe('ok');
  if (selection.status === 'equivalent') return;
  expect(p.failing_test).toEqual(selection.failing);
  expect(p.visible_tests).toEqual(selection.visible);
  expect(p.visible_tests.length).toBeGreaterThanOrEqual(2);
  expect(p.visible_tests.length).toBeLessThanOrEqual(3);
}

/** The trees of a payload, rebuilt from its template, parameters and mutation. */
export function rebuild(p: BugHuntPayload): {
  correct: FuncNode;
  mutant: FuncNode;
  candidate: MutationCandidate;
} {
  const template = templateById(p.template);
  const built = template.build(p.params, createTreeBuilder());
  const candidate = mutationsOf(built, p.bug_type).find(
    (c) =>
      c.site.node === p.mutation.node &&
      c.operator === p.mutation.operator &&
      c.to === p.mutation.to,
  );
  if (candidate === undefined) throw new Error('rebuild: mutation not found');
  return { correct: built.func, mutant: candidate.mutant, candidate };
}

/** The identity (template, params, mutation) of every candidate the real catalog can produce. */
export function allCandidates(): Pick<BugHuntPayload, 'template' | 'params' | 'mutation'>[] {
  const all: Pick<BugHuntPayload, 'template' | 'params' | 'mutation'>[] = [];
  for (const t of TEMPLATES) {
    for (const params of t.combos) {
      const built = t.build(params, createTreeBuilder());
      for (const type of BUG_TYPES) {
        for (const c of mutationsOf(built, type)) {
          all.push({
            template: t.id,
            params: { ...params },
            mutation: { operator: c.operator, node: c.site.node, from: c.from, to: c.to },
          });
        }
      }
    }
  }
  return all;
}

export const evalOutcome = (func: FuncNode, input: BugHuntPayload['tests'][number]['input']) =>
  evaluate(func, input, { maxSteps: EVAL_STEP_LIMIT });
