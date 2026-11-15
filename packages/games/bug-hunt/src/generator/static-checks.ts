import type { GeneratorHistory, VerificationCheck } from '@nerdose/core';
import { LANGUAGES } from '@nerdose/polyglot';

import type { BugHuntPayload, BugHuntTestCase } from '../definition';

import { addDays } from './days';
import { formatCall } from './format';
import { MAX_LINES, MAX_NESTING, measureCode, MIN_LINES } from './shape';
import { selectTests } from './tests';
import { canonicalJson, keysUsedNear, varietyKey, VARIETY_DAYS } from './variety';

const MIN_VISIBLE = 2;
const MAX_VISIBLE = 3;
const BRACE_ONLY = /^[{}]*$/;
const INDENT = /^\s*/;

const filled = (v: unknown): boolean => typeof v === 'string' && v.trim().length > 0;
const pass = (name: string, detail?: string): VerificationCheck =>
  detail === undefined ? { name, ok: true } : { name, ok: true, detail };
const fail = (name: string, detail: string): VerificationCheck => ({ name, ok: false, detail });
const check = (name: string, problems: readonly string[]): VerificationCheck =>
  problems.length === 0 ? pass(name) : fail(name, problems.join('; '));

export function textsBilingual(p: BugHuntPayload): VerificationCheck {
  const missing: string[] = [];
  if (!filled(p.spec.es) || !filled(p.spec.en)) missing.push('spec');
  p.explanation.steps.forEach((s, i) => {
    if (!filled(s.es) || !filled(s.en)) missing.push(`steps[${i}]`);
  });
  return check(
    'texts_bilingual',
    missing.length > 0 ? [`missing es/en for ${missing.join(', ')}`] : [],
  );
}

export function codeShape(p: BugHuntPayload): VerificationCheck {
  const problems: string[] = [];
  const counts = LANGUAGES.map((lang) => {
    const { lines, nesting } = measureCode(p.code[lang], lang);
    if (lines < MIN_LINES) problems.push(`${lang}: ${lines} lines < ${MIN_LINES}`);
    if (lines > MAX_LINES) problems.push(`${lang}: ${lines} lines > ${MAX_LINES}`);
    if (nesting > MAX_NESTING) problems.push(`${lang}: nesting ${nesting} > ${MAX_NESTING}`);
    const comment = p.code[lang].split('\n').findIndex((l) => l.includes('//') || l.includes('/*'));
    if (comment >= 0) problems.push(`${lang}: comment at line ${comment + 1}`);
    return { lang, lines };
  });
  if (new Set(counts.map((c) => c.lines)).size > 1) {
    problems.push(`line counts differ: ${counts.map((c) => `${c.lang}=${c.lines}`).join(' ')}`);
  }
  return check('code_shape', problems);
}

export function linesConsistent(p: BugHuntPayload): VerificationCheck {
  const problems: string[] = [];
  const codeLines = LANGUAGES.map((lang) => p.code[lang].split('\n'));
  const total = Math.min(...codeLines.map((l) => l.length));
  const picks = p.pickable_lines;
  if (picks.some((n, i) => i > 0 && n <= (picks[i - 1] as number))) {
    problems.push('pickable_lines not strictly ascending');
  }
  for (const n of picks) {
    if (n < 2 || n > total - 1) {
      problems.push(`pickable line ${n} out of [2, ${total - 1}]`);
      continue;
    }
    const braceOnly = LANGUAGES.filter((_, i) =>
      BRACE_ONLY.test((codeLines[i]?.[n - 1] ?? '').replace(/\s/g, '')),
    );
    if (braceOnly.length === LANGUAGES.length) {
      problems.push(`pickable line ${n} is brace-only in ${braceOnly.join(', ')}`);
    }
  }
  if (!picks.includes(p.bug_line)) problems.push(`bug_line ${p.bug_line} not in pickable_lines`);
  if (p.bug_line < 1 || p.bug_line > total) {
    problems.push(`bug_line ${p.bug_line} out of code`);
  } else {
    LANGUAGES.forEach((lang, i) => {
      const bug = codeLines[i]?.[p.bug_line - 1] ?? '';
      const fix = p.fix[lang];
      if (bug === fix) problems.push(`${lang}: bug line equals fix`);
      else if (INDENT.exec(bug)?.[0] !== INDENT.exec(fix)?.[0]) {
        problems.push(`${lang}: fix indentation differs`);
      }
    });
  }
  return check('lines_consistent', problems);
}

export type TestsMotive = 'equivalent_mutant' | 'not_enough_passing';

const sameCase = (a: BugHuntTestCase, b: BugHuntTestCase): boolean =>
  canonicalJson({ input: a.input, expected: a.expected, actual: a.actual }) ===
  canonicalJson({ input: b.input, expected: b.expected, actual: b.actual });

const kindOf = (arg: number | readonly number[]): string => (typeof arg === 'number' ? 'n' : 'a');

function sameShape(t: BugHuntTestCase, first: BugHuntTestCase): boolean {
  return (
    t.input.length === first.input.length &&
    t.input.every((a, i) => kindOf(a) === kindOf(first.input[i] as number)) &&
    typeof t.expected === typeof first.expected &&
    typeof t.actual === typeof first.expected
  );
}

export function testsConsistent(p: BugHuntPayload): {
  check: VerificationCheck;
  motive: TestsMotive | null;
} {
  const name = 'tests_consistent';
  const problems: string[] = [];
  let motive: TestsMotive | null = null;
  const done = () => ({ check: check(name, problems), motive });

  if (!p.tests.some((t) => sameCase(t, p.failing_test))) problems.push('failing_test not in tests');
  const visibleMatches = p.visible_tests.map((v) =>
    p.tests.filter(
      (t) => canonicalJson(t.input) === canonicalJson(v.input) && t.expected === v.expected,
    ),
  );
  visibleMatches.forEach((m, i) => {
    if (m.length === 0) problems.push(`visible_tests[${i}] not in tests`);
  });

  const first = p.tests[0] as BugHuntTestCase;
  p.tests.forEach((t, i) => {
    if (!sameShape(t, first)) problems.push(`inconsistent types at tests[${i}]`);
  });

  const selection = selectTests(p.tests);
  if (selection.status === 'equivalent') {
    problems.push('equivalent_mutant: no failing test');
    motive = 'equivalent_mutant';
    return done();
  }

  const passing = p.tests.filter((t) => t.actual === t.expected).length;
  if (
    passing < MIN_VISIBLE ||
    p.visible_tests.length < MIN_VISIBLE ||
    p.visible_tests.length > MAX_VISIBLE
  ) {
    problems.push(`not_enough_passing: ${passing} passing, ${p.visible_tests.length} visible`);
    motive = 'not_enough_passing';
  } else {
    visibleMatches.forEach((m, i) => {
      if (m.length > 0 && !m.some((t) => t.actual === t.expected)) {
        problems.push(`not_enough_passing: visible_tests[${i}] does not pass`);
        motive = 'not_enough_passing';
      }
    });
  }

  if (!sameCase(p.failing_test, selection.failing)) {
    const expected = formatCall(p.function_name, selection.failing.input);
    problems.push(`failing_test is not the smallest failing test (expected ${expected})`);
  }
  const failingInput = canonicalJson(p.failing_test.input);
  if (p.visible_tests.some((v) => canonicalJson(v.input) === failingInput)) {
    problems.push('failing_test is among visible_tests');
  }
  return done();
}

export function varietyCombo(
  p: BugHuntPayload,
  history: GeneratorHistory<BugHuntPayload>,
): VerificationCheck {
  if (p.date === undefined) return fail('variety_combo', 'missing date');
  if (!keysUsedNear(p.date, history.recentChallenges).has(varietyKey(p))) {
    return pass('variety_combo');
  }
  const from = addDays(p.date, -(VARIETY_DAYS - 1));
  const to = addDays(p.date, VARIETY_DAYS - 1);
  return fail('variety_combo', `combo ${varietyKey(p)} used in [${from}, ${to}]`);
}
