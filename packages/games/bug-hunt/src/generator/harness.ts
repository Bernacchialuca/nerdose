import {
  LANGUAGES,
  wrapFunction,
  type Language,
  type Signature,
  type Type,
} from '@nerdose/polyglot';

import type { BugHuntPayload, BugHuntTestCase } from '../definition';

const STDERR_DETAIL_MAX = 200;
const INTEGER_LINE = /^-?\d+$/;

export type Sources = { correct: Record<Language, string>; mutant: Record<Language, string> };

/** `code` is the version with the bug; the correct one swaps `bug_line` for `fix[lang]`. */
export function correctCode(
  p: Pick<BugHuntPayload, 'code' | 'fix' | 'bug_line'>,
  lang: Language,
): string {
  const lines = p.code[lang].split('\n');
  if (p.bug_line < 1 || p.bug_line > lines.length) return p.code[lang];
  lines[p.bug_line - 1] = p.fix[lang];
  return lines.join('\n');
}

/** `tests_consistent` guarantees every test has the shape of the first one. */
export function testSignature(tests: readonly BugHuntTestCase[]): Signature {
  const first = tests[0];
  if (first === undefined) throw new RangeError('bug-hunt: no tests');
  const params: Type[] = first.input.map((a) => (Array.isArray(a) ? 'int[]' : 'int'));
  return { params, returns: typeof first.expected === 'boolean' ? 'bool' : 'int' };
}

export function buildSources(
  p: BugHuntPayload,
): { ok: true; sources: Sources } | { ok: false; error: string } {
  try {
    const options = {
      entry: p.function_name,
      calls: p.tests.map((t) => t.input),
      signature: testSignature(p.tests),
    };
    const make = (pick: (lang: Language) => string): Record<Language, string> =>
      Object.fromEntries(
        LANGUAGES.map((lang) => [lang, wrapFunction(pick(lang), lang, options)]),
      ) as Record<Language, string>;
    return {
      ok: true,
      sources: {
        correct: make((lang) => correctCode(p, lang)),
        mutant: make((lang) => p.code[lang]),
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Only `true`, `false` and integers: `JSON.parse` would accept `1.5`, `"x"` and `null`. */
export function parseValues(
  stdout: string,
  expected: number,
): { values: (number | boolean)[] } | { error: string } {
  const trimmed = stdout.trim();
  const lines = trimmed === '' ? [] : trimmed.split('\n');
  if (lines.length !== expected) {
    return { error: `invalid_output: expected ${expected} values, got ${lines.length}` };
  }
  const values: (number | boolean)[] = [];
  for (const [i, line] of lines.entries()) {
    if (line === 'true') values.push(true);
    else if (line === 'false') values.push(false);
    else if (INTEGER_LINE.test(line)) values.push(Number(line));
    else return { error: `invalid_output: line ${i + 1} is not an integer or boolean` };
  }
  return { values };
}

/** First informative line: `go build` opens with a `# command-line-arguments` header that says nothing. */
export function firstStderrLine(stderr: string): string {
  const lines = stderr.split('\n');
  const line = lines.find((l) => l.trim() !== '' && !l.startsWith('#')) ?? lines[0] ?? '';
  return line.slice(0, STDERR_DETAIL_MAX);
}
