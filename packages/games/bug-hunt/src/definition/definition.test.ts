import {
  CODE_LANGUAGES,
  createGameRegistry,
  rebuildGameStats,
  type CodeLanguage,
  type CompletedPlay,
} from '@nerdose/core';
import { describe, expect, expectTypeOf, it } from 'vitest';

import { bugHunt, definition } from './index';
import {
  feedbackSchema,
  moveSchema,
  publicViewSchema,
  resultSchema,
  statsSchema,
  type BugHuntPayload,
  type BugHuntResult,
} from './schemas';
import {
  CODE_MAX_INDEX,
  CTX_EN,
  CTX_ES,
  LOST_GO,
  NON_PICKABLE,
  NOW,
  PAYLOAD,
  PAYLOAD_BOOL,
  S0,
  SPEC_MAX_INDEX,
  WON_BOOL_JS,
  WON_JAVA,
} from './test-fixtures';

const FIX_MAX_INDEX = {
  js: { before: '    if (nums[i] >= nums[best]) {', after: '    if (nums[i] > nums[best]) {' },
  go: { before: '\t\tif nums[i] >= nums[best] {', after: '\t\tif nums[i] > nums[best] {' },
  java: {
    before: '        if (nums[i] >= nums[best]) {',
    after: '        if (nums[i] > nums[best]) {',
  },
};

describe('identity and registry', () => {
  it('exposes id, version, bankUsage and culprits (TS-12)', () => {
    expect(bugHunt.id).toBe('bug-hunt');
    expect(bugHunt.version).toBe(1);
    expect(bugHunt.bankUsage).toBeNull();
    expect(bugHunt.culprits(PAYLOAD)).toEqual([]);
    expect(bugHunt.culprits(PAYLOAD_BOOL)).toEqual([]);
    expect(createGameRegistry([bugHunt]).get('bug-hunt')).toBe(bugHunt);
    expect(definition).toBe(bugHunt);
    expect(bugHunt.moveSchema).toBe(moveSchema);
  });
});

describe('toPublic', () => {
  it.each(['es', 'en'] as const)('returns the exact view in %s (TS-13)', (l) => {
    for (const s of [undefined, {}]) {
      const view = bugHunt.toPublic(PAYLOAD, l, s);
      expect(view).toEqual({
        function_name: 'maxIndex',
        spec: SPEC_MAX_INDEX[l],
        code: { js: CODE_MAX_INDEX.js, go: CODE_MAX_INDEX.go, java: CODE_MAX_INDEX.java },
        pickable_lines: [2, 3, 4, 5, 8],
        visible_tests: [
          { input: [[]], expected: 0 },
          { input: [[4]], expected: 0 },
          { input: [[3, 7, 2]], expected: 1 },
        ],
      });
      expect(Object.keys(view)).toEqual([
        'function_name',
        'spec',
        'code',
        'pickable_lines',
        'visible_tests',
      ]);
      expect(Object.keys(view.code)).toEqual(['js', 'go', 'java']);
      expect(() => publicViewSchema.parse(view)).not.toThrow();
    }
  });

  it('copies, sorts and drops stray keys (TS-14)', () => {
    const p = {
      ...PAYLOAD,
      pickable_lines: [8, 4, 2, 5, 3],
      visible_tests: PAYLOAD.visible_tests.map((t) => ({ ...t, actual: 9 })),
    } as BugHuntPayload;
    const v0 = bugHunt.toPublic(p, 'es');
    expect(v0.pickable_lines).toEqual([2, 3, 4, 5, 8]);
    for (const t of v0.visible_tests) expect(Object.keys(t)).toEqual(['input', 'expected']);
    expect(p.pickable_lines).toEqual([8, 4, 2, 5, 3]);

    const snapshot = structuredClone(PAYLOAD);
    const v = bugHunt.toPublic(PAYLOAD, 'es');
    expect(v.pickable_lines).not.toBe(PAYLOAD.pickable_lines);
    expect(v.visible_tests[2]!.input[0]).not.toBe(PAYLOAD.visible_tests[2]!.input[0]);
    v.pickable_lines.reverse();
    (v.visible_tests[2]!.input[0] as number[]).push(99);
    v.code.js = 'x';
    expect(PAYLOAD).toEqual(snapshot);
  });
});

describe('initState and resume', () => {
  it('starts empty (TS-15)', () => {
    const a = bugHunt.initState(PAYLOAD, NOW);
    expect(a).toEqual({});
    expect(bugHunt.initState(PAYLOAD_BOOL, new Date('2027-01-01T00:00:00.000Z'))).toEqual({});
    expect(bugHunt.initState(PAYLOAD, NOW)).not.toBe(a);
  });

  it('in-progress state keeps no line (TS-16)', () => {
    const s = bugHunt.initState(PAYLOAD, NOW);
    expect(bugHunt.isFinished(s)).toBe(false);
    expect(bugHunt.codeLanguage(s)).toBeNull();
    expect(bugHunt.toPublic(PAYLOAD, 'es', s)).toEqual(bugHunt.toPublic(PAYLOAD, 'es'));
  });
});

describe('applyMove', () => {
  it('confirms a pickable line and closes (TS-17)', () => {
    const pBefore = structuredClone(PAYLOAD);
    const s: typeof S0 = {};
    const m1 = { language: 'java', line: 4 } as const;
    const m1Before = structuredClone(m1);
    const r1 = bugHunt.applyMove(PAYLOAD, s, m1, NOW, CTX_ES);
    const r2 = bugHunt.applyMove(PAYLOAD, {}, { language: 'go', line: 5 }, NOW, CTX_EN);
    expect(r1).toEqual({ state: { language: 'java', line: 4 }, feedback: null });
    expect(r2).toEqual({ state: { language: 'go', line: 5 }, feedback: null });
    if (!('state' in r1)) throw new Error('expected state');
    expect(Object.keys(r1.state)).toEqual(['language', 'line']);
    expect(bugHunt.isFinished(r1.state)).toBe(true);
    expect(s).toEqual({});
    expect(m1).toEqual(m1Before);
    expect(PAYLOAD).toEqual(pBefore);
    expect(r1.state).not.toBe(m1);
  });

  it('rejects a line outside pickable_lines (TS-18)', () => {
    for (const line of NON_PICKABLE) {
      for (const language of CODE_LANGUAGES) {
        const s = {};
        expect(bugHunt.applyMove(PAYLOAD, s, { language, line }, NOW, CTX_ES)).toEqual({
          error: 'invalid_move',
        });
        expect(s).toEqual({});
      }
    }
  });

  it('rejects a move on a confirmed Play (TS-19)', () => {
    const won = structuredClone(WON_JAVA);
    const lost = structuredClone(LOST_GO);
    expect(bugHunt.applyMove(PAYLOAD, WON_JAVA, { language: 'go', line: 5 }, NOW, CTX_ES)).toEqual({
      error: 'invalid_move',
    });
    expect(bugHunt.applyMove(PAYLOAD, LOST_GO, { language: 'go', line: 4 }, NOW, CTX_EN)).toEqual({
      error: 'invalid_move',
    });
    expect(WON_JAVA).toEqual(won);
    expect(LOST_GO).toEqual(lost);
  });

  it('isFinished (TS-20)', () => {
    expect(bugHunt.isFinished({})).toBe(false);
    expect(bugHunt.isFinished(WON_JAVA)).toBe(true);
    expect(bugHunt.isFinished(LOST_GO)).toBe(true);
  });
});

describe('result', () => {
  const steps = (l: 'es' | 'en') => PAYLOAD.explanation.steps.map((s) => s[l]);

  it('win in Java (TS-21)', () => {
    const r = bugHunt.result(PAYLOAD, WON_JAVA, 'es');
    expect(r).toEqual({
      win: true,
      score: 1,
      chosen_line: 4,
      code_language: 'java',
      bug_line: 4,
      bug_type: 'comparison',
      function_name: 'maxIndex',
      failing_test: { input: [[5, 1, 5]], expected: 0, actual: 2 },
      fix: FIX_MAX_INDEX,
      explanation: { steps: steps('es') },
    });
    expect(bugHunt.isWin(r)).toBe(true);
    expect(bugHunt.score(r)).toBe(1);
    expect(bugHunt.codeLanguage(WON_JAVA)).toBe('java');
  });

  it('loss in Go (TS-22)', () => {
    const r = bugHunt.result(PAYLOAD, LOST_GO, 'es');
    expect(r).toMatchObject({
      win: false,
      score: 0,
      chosen_line: 5,
      bug_line: 4,
      code_language: 'go',
      bug_type: 'comparison',
      failing_test: { input: [[5, 1, 5]], expected: 0, actual: 2 },
      fix: FIX_MAX_INDEX,
      explanation: { steps: steps('es') },
    });
    expect(bugHunt.isWin(r)).toBe(false);
    expect(bugHunt.score(r)).toBe(0);
    expect(bugHunt.codeLanguage(LOST_GO)).toBe('go');
  });

  it('english result with the contract shape (TS-23)', () => {
    const r = bugHunt.result(PAYLOAD, WON_JAVA, 'en');
    expect(r.explanation).toEqual({ steps: steps('en') });
    expect(r.explanation.steps[0]).toBe(
      'The condition that decides whether best changes uses >= instead of >: on a tie it moves too.',
    );
    expect(() => resultSchema.parse(r)).not.toThrow();
    expect(Object.keys(r)).toEqual([
      'win',
      'score',
      'chosen_line',
      'code_language',
      'bug_line',
      'bug_type',
      'function_name',
      'failing_test',
      'fix',
      'explanation',
    ]);
    expect(Object.keys(r.fix)).toEqual(['js', 'go', 'java']);
    const json = JSON.stringify(r);
    expect(json.includes('"es"')).toBe(false);
    expect(json.includes('"en"')).toBe(false);
  });

  it('boolean result with two arguments (TS-24)', () => {
    const r = bugHunt.result(PAYLOAD_BOOL, WON_BOOL_JS, 'es');
    expect(r).toMatchObject({
      win: true,
      score: 1,
      chosen_line: 2,
      bug_line: 2,
      bug_type: 'bad_initialization',
      function_name: 'anyAbove',
      failing_test: { input: [[], 3], expected: false, actual: true },
      fix: {
        js: { before: '  let found = true;', after: '  let found = false;' },
        go: { before: '\tfound := true', after: '\tfound := false' },
        java: { before: '    boolean found = true;', after: '    boolean found = false;' },
      },
    });
    expect(r.explanation.steps).toHaveLength(2);
    expect(r.explanation.steps[0]).toBe(PAYLOAD_BOOL.explanation.steps[0]!.es);
    expect(() => resultSchema.parse(r)).not.toThrow();

    const r2 = bugHunt.result(PAYLOAD_BOOL, { language: 'java', line: 4 }, 'en');
    expect(r2).toMatchObject({ win: false, score: 0, chosen_line: 4, code_language: 'java' });
    expect(r2.explanation.steps[0]).toBe(PAYLOAD_BOOL.explanation.steps[0]!.en);
    expect(() => resultSchema.parse(r2)).not.toThrow();
  });

  it('throws on broken invariants (TS-25)', () => {
    expect(() => bugHunt.result(PAYLOAD, {}, 'es')).toThrow(
      'bug-hunt: result requires a confirmed state',
    );
    expect(() => bugHunt.result({ ...PAYLOAD, bug_line: 10 }, WON_JAVA, 'es')).toThrow(
      'bug-hunt: bug_line out of range',
    );
  });

  it('shares no references with the payload (TS-26)', () => {
    const before = structuredClone(PAYLOAD);
    const r = bugHunt.result(PAYLOAD, WON_JAVA, 'es');
    expect(r.failing_test.input).not.toBe(PAYLOAD.failing_test.input);
    (r.failing_test.input[0] as number[])[0] = 99;
    r.explanation.steps[0] = 'x';
    expect(PAYLOAD).toEqual(before);
  });
});

describe('codeLanguage', () => {
  it('reads the confirmed language (TS-27)', () => {
    expect(bugHunt.codeLanguage({})).toBeNull();
    expect(bugHunt.codeLanguage({ language: 'js', line: 2 })).toBe('js');
    expect(createGameRegistry([bugHunt]).get('bug-hunt').codeLanguage(LOST_GO)).toBe('go');
    expectTypeOf<ReturnType<typeof bugHunt.codeLanguage>>().toEqualTypeOf<CodeLanguage | null>();
  });
});

describe('stats', () => {
  const rWin = bugHunt.result(PAYLOAD, WON_JAVA, 'es');
  const rLoss = bugHunt.result(PAYLOAD, LOST_GO, 'es');
  const rBool = bugHunt.result(PAYLOAD_BOOL, WON_BOOL_JS, 'es');

  it('initialStats is empty and fresh (TS-28)', () => {
    expect(bugHunt.initialStats()).toEqual({ by_language: {}, by_bug_type: {} });
    expect(bugHunt.initialStats()).not.toBe(bugHunt.initialStats());
  });

  it('reduceStats by language and bug type (TS-29)', () => {
    const s0 = bugHunt.initialStats();
    const s1 = bugHunt.reduceStats(s0, rWin);
    const s2 = bugHunt.reduceStats(s1, rLoss);
    const s3 = bugHunt.reduceStats(s2, rBool);
    expect(s1).toEqual({
      by_language: { java: { played: 1, correct: 1 } },
      by_bug_type: { comparison: { played: 1, correct: 1 } },
    });
    expect(s2).toEqual({
      by_language: { java: { played: 1, correct: 1 }, go: { played: 1, correct: 0 } },
      by_bug_type: { comparison: { played: 2, correct: 1 } },
    });
    expect(s3).toEqual({
      by_language: {
        java: { played: 1, correct: 1 },
        go: { played: 1, correct: 0 },
        js: { played: 1, correct: 1 },
      },
      by_bug_type: {
        comparison: { played: 2, correct: 1 },
        bad_initialization: { played: 1, correct: 1 },
      },
    });
    expect(s0).toEqual({ by_language: {}, by_bug_type: {} });
    expect(s1.by_language).toEqual({ java: { played: 1, correct: 1 } });
    expect(s2.by_bug_type).toEqual({ comparison: { played: 2, correct: 1 } });
    expect(() => statsSchema.parse(s3)).not.toThrow();
  });

  it('rebuild equals incremental fold (TS-30)', () => {
    const cycle = [rWin, rLoss, rBool];
    const plays: CompletedPlay<BugHuntResult>[] = Array.from({ length: 12 }, (_, i) => {
      const date = `2026-11-${String(i + 1).padStart(2, '0')}`;
      if (i === 3 || i === 8) return { date, status: 'voided', result: null };
      const r = cycle[i % 3]!;
      return { date, status: r.win ? 'won' : 'lost', result: r };
    });
    let inc = bugHunt.initialStats();
    for (const p of plays) if (p.result) inc = bugHunt.reduceStats(inc, p.result);
    const a = rebuildGameStats(bugHunt, plays);
    const b = rebuildGameStats(bugHunt, [...plays].reverse());
    expect(a.extra).toEqual(inc);
    expect(b.extra).toEqual(inc);
    expect(a.played).toBe(10);
    expect(a.wins).toBe(plays.filter((p) => p.status === 'won').length);
  });

  it('historyLabel (TS-31)', () => {
    expect(bugHunt.historyLabel(rWin)).toBe('✓ L4');
    expect(bugHunt.historyLabel(rLoss)).toBe('✗ L4');
    expect(bugHunt.historyLabel(rBool)).toBe('✓ L2');
    expect(bugHunt.historyLabel({ ...rLoss, bug_line: 12 })).toBe('✗ L12');
  });
});

describe('output schemas', () => {
  const v = bugHunt.toPublic(PAYLOAD, 'es');
  const r = bugHunt.result(PAYLOAD, WON_JAVA, 'es');

  it('are strict (TS-11)', () => {
    const view = (x: unknown) => publicViewSchema.safeParse(x).success;
    const res = (x: unknown) => resultSchema.safeParse(x).success;
    expect(view({ ...v, bug_line: 4 })).toBe(false);
    expect(view({ ...v, visible_tests: v.visible_tests.slice(0, 1) })).toBe(false);
    expect(view({ ...v, visible_tests: [...v.visible_tests, v.visible_tests[0]] })).toBe(false);
    expect(
      view({
        ...v,
        visible_tests: v.visible_tests.map((t) => ({ ...t, actual: 0 })),
      }),
    ).toBe(false);
    expect(res({ ...r, mutation: {} })).toBe(false);
    expect(res({ ...r, score: 2 })).toBe(false);
    expect(res({ ...r, explanation: { steps: ['a', 'b', 'c', 'd', 'e'] } })).toBe(false);
    expect(res({ ...r, fix: { js: r.fix.js, java: r.fix.java } })).toBe(false);
    expect(
      statsSchema.safeParse({ by_language: {}, by_bug_type: { typo: { played: 1, correct: 0 } } })
        .success,
    ).toBe(false);
    expect(
      statsSchema.safeParse({
        by_language: { python: { played: 1, correct: 0 } },
        by_bug_type: {},
      }).success,
    ).toBe(false);
    expect(feedbackSchema.safeParse(null).success).toBe(true);
    expect(feedbackSchema.safeParse({}).success).toBe(false);
    expect(view(v)).toBe(true);
    expect(res(r)).toBe(true);
  });
});
