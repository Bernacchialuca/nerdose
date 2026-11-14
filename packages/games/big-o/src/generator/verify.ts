import type { GeneratorHistory, VerificationCheck, VerificationLog } from '@nerdose/core';
import {
  LANGUAGES,
  RUN_TIMEOUT_MS,
  runInLanguage,
  wrapFunction,
  type Language,
  type RunOptions,
  type RunOutcome,
} from '@nerdose/polyglot';

import type { BigOPayload } from '../definition';

import { addDays } from './days';
import { FIT_MIN_SECOND_CV, FIT_MIN_SEPARATION, fitCounts, formatFit, type FitResult } from './fit';
import { COUNT_MAX, SCALE } from './scale';
import { MAX_LINES, MAX_NESTING, measureCode } from './shape';
import { answerWouldRepeat, RECIPE_REPEAT_DAYS, recipesUsedNear } from './variety';

export const VERIFY_CHECKS = [
  'texts_bilingual',
  'code_shape',
  'variety_recipe',
  'variety_answer',
  'run_js',
  'run_go',
  'run_java',
  'counts_agree',
  'counts_in_range',
  'example_matches_run',
  'fit_quality',
  'fit_unambiguous',
  'fit_matches_answer',
] as const;

export type Runner = (lang: Language, source: string, options?: RunOptions) => Promise<RunOutcome>;

const ENTRY = 'f';
const SKIPPED = 'skipped';
const STDERR_DETAIL_MAX = 200;
const INTEGER_LINE = /^-?\d+$/;

type Counts = readonly number[];
type RunResult = { check: VerificationCheck; reason: string | null; counts: Counts | null };

const filled = (v: unknown): boolean => typeof v === 'string' && v.trim().length > 0;
const pass = (name: string, detail?: string): VerificationCheck =>
  detail === undefined ? { name, ok: true } : { name, ok: true, detail };
const fail = (name: string, detail: string): VerificationCheck => ({ name, ok: false, detail });
const check = (name: string, detail: string | null): VerificationCheck =>
  detail === null ? pass(name) : fail(name, detail);

function textsBilingual(p: BigOPayload): VerificationCheck {
  const { steps, line_notes, tip } = p.explanation;
  const missing: string[] = [];
  steps.forEach((s, i) => {
    if (!filled(s.es) || !filled(s.en)) missing.push(`steps[${i}]`);
  });
  line_notes.forEach((n, i) => {
    if (!filled(n.text.es) || !filled(n.text.en)) missing.push(`line_notes[${i}]`);
  });
  if (tip !== null && (!filled(tip.es) || !filled(tip.en))) missing.push('tip');
  return check(
    'texts_bilingual',
    missing.length > 0 ? `missing es/en for ${missing.join(', ')}` : null,
  );
}

function codeShape(p: BigOPayload): VerificationCheck {
  const problems: string[] = [];
  const lineCounts = LANGUAGES.map((lang) => {
    const { lines, nesting } = measureCode(p.code[lang], lang);
    if (lines > MAX_LINES) problems.push(`${lang}: ${lines} lines > ${MAX_LINES}`);
    if (nesting > MAX_NESTING) problems.push(`${lang}: nesting ${nesting} > ${MAX_NESTING}`);
    return { lang, lines };
  });
  if (new Set(lineCounts.map((c) => c.lines)).size > 1) {
    problems.push(`line counts differ: ${lineCounts.map((c) => `${c.lang}=${c.lines}`).join(' ')}`);
  }
  const shortest = Math.min(...lineCounts.map((c) => c.lines));
  p.explanation.line_notes.forEach((n, i) => {
    if (n.line > shortest) problems.push(`line_notes[${i}].line ${n.line} > ${shortest}`);
  });
  return check('code_shape', problems.length > 0 ? problems.join('; ') : null);
}

function varietyChecks(
  p: BigOPayload,
  history: GeneratorHistory<BigOPayload>,
): VerificationCheck[] {
  if (p.date === undefined) {
    return [fail('variety_recipe', 'missing date'), fail('variety_answer', 'missing date')];
  }
  const recent = history.recentChallenges;
  const used = recipesUsedNear(p.date, recent).has(p.recipe);
  const from = addDays(p.date, -(RECIPE_REPEAT_DAYS - 1));
  const to = addDays(p.date, RECIPE_REPEAT_DAYS - 1);
  return [
    check('variety_recipe', used ? `recipe ${p.recipe} used in [${from}, ${to}]` : null),
    check(
      'variety_answer',
      answerWouldRepeat(p.answer, p.date, recent)
        ? `answer ${p.answer} would be 3 days in a row`
        : null,
    ),
  ];
}

function parseCounts(stdout: string, expected: number): { counts: number[] } | { error: string } {
  const trimmed = stdout.trim();
  const lines = trimmed === '' ? [] : trimmed.split('\n');
  if (lines.length !== expected) {
    return { error: `invalid_output: expected ${expected} integers, got ${lines.length}` };
  }
  const bad = lines.findIndex((l) => !INTEGER_LINE.test(l));
  if (bad >= 0) return { error: `invalid_output: line ${bad + 1} is not an integer` };
  return { counts: lines.map(Number) };
}

/** First informative line: `go build` opens with a `# command-line-arguments` header that says nothing. */
function firstStderrLine(stderr: string): string {
  const lines = stderr.split('\n');
  const line = lines.find((l) => l.trim() !== '' && !l.startsWith('#')) ?? lines[0] ?? '';
  return line.slice(0, STDERR_DETAIL_MAX);
}

function runResult(lang: Language, outcome: RunOutcome, expected: number): RunResult {
  const name = `run_${lang}`;
  if (!outcome.ok) {
    const first = firstStderrLine(outcome.stderr);
    const head = `${outcome.kind} (${outcome.durationMs} ms)`;
    return {
      check: fail(name, first === '' ? head : `${head}: ${first}`),
      reason: `${name}: ${outcome.kind}`,
      counts: null,
    };
  }
  const parsed = parseCounts(outcome.stdout, expected);
  if ('error' in parsed) {
    return { check: fail(name, parsed.error), reason: `${name}: invalid_output`, counts: null };
  }
  return { check: pass(name, `${outcome.durationMs} ms`), reason: null, counts: parsed.counts };
}

function countsAgree(ns: Counts, by: Record<Language, Counts>): VerificationCheck {
  for (let i = 0; i < ns.length; i++) {
    const [js, go, java] = [by.js[i], by.go[i], by.java[i]];
    if (js !== go || go !== java) {
      return fail('counts_agree', `differs at n=${ns[i]}: js=${js} go=${go} java=${java}`);
    }
  }
  return pass('counts_agree', `n=${ns.join(',')} counts=${by.js.join(',')}`);
}

function countsInRange(ns: Counts, counts: Counts): VerificationCheck {
  const i = counts.findIndex((c) => c < 1 || c > COUNT_MAX);
  return check('counts_in_range', i >= 0 ? `out of range at n=${ns[i]}: ${counts[i]}` : null);
}

function exampleMatchesRun(p: BigOPayload, ns: Counts, counts: Counts): VerificationCheck {
  const example = p.explanation.example;
  if (example === null) return pass('example_matches_run', 'no example');
  const i = ns.indexOf(example.n);
  if (i < 0) return fail('example_matches_run', `example n ${example.n} not in scale`);
  const measured = counts[i];
  if (measured !== example.ops) {
    return fail(
      'example_matches_run',
      `example ops ${example.ops} != measured ${measured} at n=${example.n}`,
    );
  }
  return pass('example_matches_run', `n=${example.n} ops=${example.ops}`);
}

function fitChecks(p: BigOPayload, fit: FitResult): VerificationCheck[] {
  const { best, second } = fit;
  const minSecond = Math.max(FIT_MIN_SEPARATION * best.cv, FIT_MIN_SECOND_CV);
  const quality = formatFit(fit);
  const qualityOk = fit.verdict !== 'poor_fit';
  const separated = second.cv >= minSecond;
  const separation =
    `best=${best.option} (${best.cv.toFixed(4)}) second=${second.option} ` +
    `(${second.cv.toFixed(4)}) min=${minSecond.toFixed(4)}`;
  const matches = `best=${best.option} answer=${p.answer}`;
  return [
    qualityOk ? pass('fit_quality', quality) : fail('fit_quality', `poor_fit: ${quality}`),
    separated
      ? pass('fit_unambiguous', separation)
      : fail('fit_unambiguous', `ambiguous_fit: ${separation}`),
    best.option === p.answer
      ? pass('fit_matches_answer', matches)
      : fail('fit_matches_answer', `fit_mismatch: ${matches}`),
  ];
}

/**
 * `verify` for Big O: checks the texts, the shape and the variety in memory, then runs the stored
 * code in the 3 languages and fits the measured counts against the 8 classes. The runner is
 * injectable so unit tests never touch a toolchain.
 */
export function createVerify(deps: { run?: Runner; timeoutMs?: number } = {}) {
  const run: Runner = deps.run ?? runInLanguage;
  const timeoutMs = deps.timeoutMs ?? RUN_TIMEOUT_MS;

  return async function verify(
    p: BigOPayload,
    history: GeneratorHistory<BigOPayload>,
  ): Promise<VerificationLog> {
    const done = new Map<string, VerificationCheck>();
    const runReasons = new Map<string, string>();
    const put = (...cs: VerificationCheck[]): void => cs.forEach((c) => done.set(c.name, c));
    const failedAny = (names: readonly string[]): boolean =>
      names.some((n) => done.get(n)?.ok === false);

    put(textsBilingual(p), codeShape(p), ...varietyChecks(p, history));

    if (!failedAny(VERIFY_CHECKS.slice(0, 4))) {
      const ns = SCALE[p.answer];
      const calls = ns.map((n) => [n]);
      const outcomes = await Promise.all(
        LANGUAGES.map((lang) =>
          run(lang, wrapFunction(p.code[lang], lang, { entry: ENTRY, calls }), { timeoutMs }),
        ),
      );
      const results = LANGUAGES.map((lang, i) =>
        runResult(lang, outcomes[i] as RunOutcome, ns.length),
      );
      results.forEach((r) => {
        put(r.check);
        if (r.reason !== null) runReasons.set(r.check.name, r.reason);
      });

      const [js, go, java] = results.map((r) => r.counts);
      if (js && go && java) {
        put(countsAgree(ns, { js, go, java }));
        if (done.get('counts_agree')?.ok) {
          put(countsInRange(ns, js));
          put(exampleMatchesRun(p, ns, js));
          if (done.get('counts_in_range')?.ok) put(...fitChecks(p, fitCounts(ns, js)));
        }
      }
    }

    const checks = VERIFY_CHECKS.map((name) => done.get(name) ?? fail(name, SKIPPED));
    const failed = checks.find((c) => !c.ok);
    if (!failed) return { ok: true, checks };
    return { ok: false, checks, reason: runReasons.get(failed.name) ?? failed.name };
  };
}

export const verify = createVerify();
