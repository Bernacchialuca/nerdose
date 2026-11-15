import { wrapFunction } from '@nerdose/polyglot';
import { describe, expect, it } from 'vitest';

import { PAYLOAD, PAYLOAD_BOOL } from '../definition/test-fixtures';

import { buildSources, correctCode, firstStderrLine, parseValues, testSignature } from './harness';

const P = PAYLOAD;
const B = PAYLOAD_BOOL;
const E = '0\n0\n1\n0\n2\n0\n0\n0\n';

describe('correctCode', () => {
  it('replaces bug_line with the fix and does not mutate (TS-1)', () => {
    const before = structuredClone(P);
    const js = correctCode(P, 'js').split('\n');
    expect(js[3]).toBe('    if (nums[i] > nums[best]) {');
    expect(js.filter((_, i) => i !== 3)).toEqual(P.code.js.split('\n').filter((_, i) => i !== 3));
    expect(correctCode(P, 'go').split('\n')[3]).toBe('\t\tif nums[i] > nums[best] {');
    expect(correctCode(B, 'java').split('\n')[1]).toBe('    boolean found = false;');
    expect(P).toEqual(before);
  });

  it('returns the code unchanged when bug_line is out of range', () => {
    expect(correctCode({ ...P, bug_line: 99 }, 'js')).toBe(P.code.js);
  });
});

describe('testSignature', () => {
  it('derives params and return type from the tests (TS-2)', () => {
    expect(testSignature(P.tests)).toEqual({ params: ['int[]'], returns: 'int' });
    expect(testSignature(B.tests)).toEqual({ params: ['int[]', 'int'], returns: 'bool' });
  });

  it('rejects an empty list', () => {
    expect(() => testSignature([])).toThrow('bug-hunt: no tests');
  });
});

describe('buildSources', () => {
  it('wraps the correct and the mutant version of every language (TS-3)', () => {
    const calls = P.tests.map((t) => t.input);
    const signature = { params: ['int[]'], returns: 'int' } as const;
    const result = buildSources(P);
    if (!result.ok) throw new Error(result.error);
    const { sources } = result;
    expect(sources.correct.js).toBe(
      wrapFunction(correctCode(P, 'js'), 'js', { entry: 'maxIndex', calls, signature }),
    );
    expect(sources.mutant.go).toBe(
      wrapFunction(P.code.go, 'go', { entry: 'maxIndex', calls, signature }),
    );
    expect(sources.mutant.js.endsWith('console.log(String(maxIndex([7, 3, 7, 1])));\n')).toBe(true);
    for (const v of ['correct', 'mutant'] as const) {
      for (const l of ['js', 'go', 'java'] as const) expect(sources[v][l]).toBeTruthy();
    }
  });

  it('returns the error instead of throwing on an impossible harness (TS-4)', () => {
    expect(buildSources({ ...P, function_name: 'main' })).toEqual({
      ok: false,
      error: 'invalid_identifier: main',
    });
  });
});

describe('parseValues', () => {
  it('reads one value per line (TS-5)', () => {
    expect(parseValues(E, 8)).toEqual({ values: [0, 0, 1, 0, 2, 0, 0, 0] });
    expect(parseValues('false\ntrue\n', 2)).toEqual({ values: [false, true] });
    expect(parseValues('-1\n', 1)).toEqual({ values: [-1] });
  });

  it('rejects wrong counts and non-values (TS-5)', () => {
    expect(parseValues('0\n0\n', 8)).toEqual({ error: 'invalid_output: expected 8 values, got 2' });
    expect(parseValues('0\n0\n1\nundefined\n2\n0\n0\n0\n', 8)).toEqual({
      error: 'invalid_output: line 4 is not an integer or boolean',
    });
    expect(parseValues('', 1)).toEqual({ error: 'invalid_output: expected 1 values, got 0' });
    expect(parseValues('0\nTrue\n', 2)).toEqual({
      error: 'invalid_output: line 2 is not an integer or boolean',
    });
  });
});

describe('firstStderrLine', () => {
  it('skips blank and # lines and truncates', () => {
    expect(firstStderrLine('# command-line-arguments\n./main.go:6:13: boom\n')).toBe(
      './main.go:6:13: boom',
    );
    expect(firstStderrLine('')).toBe('');
    expect(firstStderrLine('x'.repeat(300))).toHaveLength(200);
  });
});
