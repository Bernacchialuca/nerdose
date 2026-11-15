import type { GeneratorHistory, VerificationCheck, VerificationLog } from '@nerdose/core';
import {
  LANGUAGES,
  RUN_TIMEOUT_MS,
  runInLanguage,
  type Language,
  type RunOptions,
  type RunOutcome,
} from '@nerdose/polyglot';

import type { BugHuntPayload } from '../definition';

import { formatCall, formatValue } from './format';
import { buildSources, firstStderrLine, parseValues } from './harness';
import {
  codeShape,
  linesConsistent,
  testsConsistent,
  textsBilingual,
  varietyCombo,
} from './static-checks';

export const VERIFY_CHECKS = [
  'texts_bilingual',
  'code_shape',
  'lines_consistent',
  'tests_consistent',
  'variety_combo',
  'run_correct_js',
  'run_correct_go',
  'run_correct_java',
  'run_mutant_js',
  'run_mutant_go',
  'run_mutant_java',
  'correct_agrees',
  'mutant_agrees',
] as const;

export type Runner = (lang: Language, source: string, options?: RunOptions) => Promise<RunOutcome>;

const SKIPPED = 'skipped';
const MEMORY_CHECKS = VERIFY_CHECKS.slice(0, 5);
const VARIANTS = ['correct', 'mutant'] as const;
type Variant = (typeof VARIANTS)[number];
type Value = number | boolean;
type RunResult = { check: VerificationCheck; reason: string | null; values: Value[] | null };

const pass = (name: string, detail?: string): VerificationCheck =>
  detail === undefined ? { name, ok: true } : { name, ok: true, detail };
const fail = (name: string, detail: string): VerificationCheck => ({ name, ok: false, detail });

const runName = (variant: Variant, lang: Language): string => `run_${variant}_${lang}`;

function harnessFailure(variant: Variant, lang: Language, error: string): RunResult {
  return {
    check: fail(runName(variant, lang), `harness_error: ${error}`),
    reason: `${runName(variant, lang)}: harness_error`,
    values: null,
  };
}

function runResult(variant: Variant, lang: Language, outcome: RunOutcome, n: number): RunResult {
  const name = runName(variant, lang);
  if (!outcome.ok) {
    const first = firstStderrLine(outcome.stderr);
    const head = `${outcome.kind} (${outcome.durationMs} ms)`;
    return {
      check: fail(name, first === '' ? head : `${head}: ${first}`),
      reason: `${name}: ${outcome.kind}`,
      values: null,
    };
  }
  const parsed = parseValues(outcome.stdout, n);
  if ('error' in parsed) {
    return { check: fail(name, parsed.error), reason: `${name}: invalid_output`, values: null };
  }
  return { check: pass(name, `${outcome.durationMs} ms`), reason: null, values: parsed.values };
}

/** First test where the languages differ, or where they agree on something other than the stored value. */
function agrees(
  name: string,
  p: BugHuntPayload,
  by: Record<Language, Value[]>,
  stored: 'expected' | 'actual',
): VerificationCheck {
  for (const [i, t] of p.tests.entries()) {
    const [js, go, java] = [by.js[i], by.go[i], by.java[i]] as [Value, Value, Value];
    const call = `tests[${i}] ${formatCall(p.function_name, t.input)}`;
    if (js !== go || go !== java) {
      return fail(name, `differs at ${call}: js=${js} go=${go} java=${java}`);
    }
    if (js !== t[stored]) {
      return fail(name, `${call}: run=${formatValue(js)} ${stored}=${formatValue(t[stored])}`);
    }
  }
  return pass(name, `${p.tests.length} tests`);
}

/**
 * `verify` for Bug Hunt: 5 checks in memory, then the correct and the mutant version run in the 3
 * languages (languages in parallel, the two variants of each in sequence) and their outputs must
 * agree with each other and with the stored `expected` / `actual`. The runner is injectable so
 * unit tests never touch a toolchain.
 */
export function createVerify(deps: { run?: Runner; timeoutMs?: number } = {}) {
  const run: Runner = deps.run ?? runInLanguage;
  const timeoutMs = deps.timeoutMs ?? RUN_TIMEOUT_MS;

  return async function verify(
    p: BugHuntPayload,
    history: GeneratorHistory<BugHuntPayload>,
  ): Promise<VerificationLog> {
    const done = new Map<string, VerificationCheck>();
    const reasons = new Map<string, string>();
    const put = (...cs: VerificationCheck[]): void => cs.forEach((c) => done.set(c.name, c));

    const tests = testsConsistent(p);
    put(textsBilingual(p), codeShape(p), linesConsistent(p), tests.check, varietyCombo(p, history));
    if (tests.motive !== null) reasons.set('tests_consistent', `tests_consistent: ${tests.motive}`);

    if (!MEMORY_CHECKS.some((n) => done.get(n)?.ok === false)) {
      const n = p.tests.length;
      const built = buildSources(p);
      const results = {} as Record<Variant, Record<Language, RunResult>>;
      for (const v of VARIANTS) results[v] = {} as Record<Language, RunResult>;

      if (!built.ok) {
        for (const v of VARIANTS) {
          for (const lang of LANGUAGES) results[v][lang] = harnessFailure(v, lang, built.error);
        }
      } else {
        const { sources } = built;
        await Promise.all(
          LANGUAGES.map(async (lang) => {
            for (const v of VARIANTS) {
              const outcome = await run(lang, sources[v][lang], { timeoutMs });
              results[v][lang] = runResult(v, lang, outcome, n);
            }
          }),
        );
      }

      for (const v of VARIANTS) {
        for (const lang of LANGUAGES) {
          const r = results[v][lang];
          put(r.check);
          if (r.reason !== null) reasons.set(r.check.name, r.reason);
        }
        const [js, go, java] = LANGUAGES.map((l) => results[v][l].values);
        if (js && go && java) {
          const by = { js, go, java };
          put(
            agrees(
              v === 'correct' ? 'correct_agrees' : 'mutant_agrees',
              p,
              by,
              v === 'correct' ? 'expected' : 'actual',
            ),
          );
        }
      }
    }

    const checks = VERIFY_CHECKS.map((name) => done.get(name) ?? fail(name, SKIPPED));
    const failed = checks.find((c) => !c.ok);
    if (!failed) return { ok: true, checks };
    return { ok: false, checks, reason: reasons.get(failed.name) ?? failed.name };
  };
}

export const verify = createVerify();
