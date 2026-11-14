import {
  BIG_O_OPTIONS,
  createGameRegistry,
  rebuildGameStats,
  type CodeLanguage,
  type CompletedPlay,
} from '@nerdose/core';
import { describe, expect, expectTypeOf, it } from 'vitest';

import { OPTION_LABEL } from '../shared/labels';
import { definition, bigO } from './index';
import {
  feedbackSchema,
  moveSchema,
  publicViewSchema,
  resultSchema,
  statsSchema,
  type BigOResult,
  type BigOStats,
} from './schemas';
import {
  CODE_NLOGN,
  CTX_EN,
  CTX_ES,
  LOST_GO,
  NOW,
  PAYLOAD,
  PAYLOAD_RECURSION,
  S0,
  WON_JAVA,
  withAnswer,
} from './test-fixtures';

const OPTIONS = ['o_1', 'o_log_n', 'o_n', 'o_n_log_n', 'o_n2', 'o_n3', 'o_2n', 'o_n_fact'];

describe('bigO definition', () => {
  it('has identity and registers in core (TS-11)', () => {
    expect(bigO.id).toBe('big-o');
    expect(bigO.version).toBe(1);
    expect(bigO.bankUsage).toBeNull();
    expect(bigO.culprits(PAYLOAD)).toEqual([]);
    expect(bigO.culprits(PAYLOAD_RECURSION)).toEqual([]);
    expect(createGameRegistry([bigO]).get('big-o')).toBe(bigO);
    expect(definition).toBe(bigO);
    expect(bigO.moveSchema).toBe(moveSchema);
  });
});

describe('output schemas', () => {
  it('are strict (TS-10)', () => {
    const r = bigO.result(PAYLOAD, WON_JAVA, 'es');
    expect(
      publicViewSchema.safeParse({ ...bigO.toPublic(PAYLOAD, 'es'), answer: 'o_n_log_n' }).success,
    ).toBe(false);
    expect(
      publicViewSchema.safeParse({ code: CODE_NLOGN, options: BIG_O_OPTIONS.slice(0, 7) }).success,
    ).toBe(false);
    expect(resultSchema.safeParse({ ...r, recipe: 'x' }).success).toBe(false);
    expect(resultSchema.safeParse({ ...r, score: 2 }).success).toBe(false);
    expect(
      statsSchema.safeParse({ by_category: { sorting: { played: 1, correct: 0 } } }).success,
    ).toBe(false);
    expect(feedbackSchema.safeParse(null).success).toBe(true);
  });
});

describe('toPublic', () => {
  it.each(['es', 'en'] as const)('is exact in %s with and without state (TS-12)', (l) => {
    for (const s of [undefined, {}]) {
      const view = bigO.toPublic(PAYLOAD, l, s);
      expect(view).toEqual({
        code: { js: CODE_NLOGN.js, go: CODE_NLOGN.go, java: CODE_NLOGN.java },
        options: OPTIONS,
      });
      expect(Object.keys(view)).toEqual(['code', 'options']);
      expect(Object.keys(view.code)).toEqual(['js', 'go', 'java']);
      expect(() => publicViewSchema.parse(view)).not.toThrow();
    }
  });

  it('keeps fixed options for any answer and returns fresh arrays (TS-13)', () => {
    for (const a of BIG_O_OPTIONS) {
      expect(bigO.toPublic(withAnswer(a), 'es').options).toEqual([...BIG_O_OPTIONS]);
    }
    const v1 = bigO.toPublic(PAYLOAD, 'es');
    expect(v1.options).not.toBe(BIG_O_OPTIONS);
    v1.options.reverse();
    expect(bigO.toPublic(PAYLOAD, 'es').options).toEqual([...BIG_O_OPTIONS]);
    expect([...BIG_O_OPTIONS]).toEqual(OPTIONS);
  });

  it('does not store the selection while in progress (TS-15)', () => {
    const s = bigO.initState(PAYLOAD, NOW);
    expect(bigO.isFinished(s)).toBe(false);
    expect(bigO.codeLanguage(s)).toBeNull();
    expect(bigO.toPublic(PAYLOAD, 'es', s)).toEqual(bigO.toPublic(PAYLOAD, 'es'));
  });
});

describe('initState', () => {
  it('is empty (TS-14)', () => {
    expect(bigO.initState(PAYLOAD, NOW)).toEqual({});
    const s = bigO.initState(PAYLOAD_RECURSION, new Date('2027-01-01T00:00:00.000Z'));
    expect(s).toEqual({});
    expect(Object.keys(s)).toHaveLength(0);
  });
});

describe('applyMove', () => {
  it('confirms and closes (TS-16)', () => {
    const s = structuredClone(S0);
    const m = { language: 'java', option: 'o_n_log_n' } as const;
    const mCopy = structuredClone(m);
    const r = bigO.applyMove(PAYLOAD, s, m, NOW, CTX_ES);
    expect(r).toEqual({ state: { language: 'java', option: 'o_n_log_n' }, feedback: null });
    if ('error' in r) throw new Error('unexpected error');
    expect(Object.keys(r.state)).toEqual(['language', 'option']);
    expect(bigO.isFinished(r.state)).toBe(true);
    expect(s).toEqual({});
    expect(m).toEqual(mCopy);
    expect(r.state).not.toBe(m);
  });

  it('rejects a move on a confirmed play (TS-17)', () => {
    const won = structuredClone(WON_JAVA);
    const lost = structuredClone(LOST_GO);
    expect(
      bigO.applyMove(PAYLOAD, WON_JAVA, { language: 'go', option: 'o_n2' }, NOW, CTX_ES),
    ).toEqual({ error: 'invalid_move' });
    expect(
      bigO.applyMove(PAYLOAD, LOST_GO, { language: 'go', option: 'o_n_log_n' }, NOW, CTX_EN),
    ).toEqual({ error: 'invalid_move' });
    expect(WON_JAVA).toEqual(won);
    expect(LOST_GO).toEqual(lost);
  });
});

describe('isFinished', () => {
  it('is true only when confirmed (TS-18)', () => {
    expect(bigO.isFinished({})).toBe(false);
    expect(bigO.isFinished(WON_JAVA)).toBe(true);
    expect(bigO.isFinished(LOST_GO)).toBe(true);
  });
});

const ES_EXPLANATION = {
  steps: [
    'El loop externo corre n veces.',
    'El interno duplica j: log₂ n vueltas.',
    'Anidados se multiplican: n × log n. Simplificado: O(n log n).',
  ],
  line_notes: [
    { line: 3, text: 'n veces' },
    { line: 4, text: 'log n veces' },
  ],
  tip: 'Un loop interno que duplica su variable no es n.',
  example: { n: 1024, ops: 10240, trap_ops: 1048576 },
};

describe('result', () => {
  it('wins in Java (TS-19)', () => {
    const r = bigO.result(PAYLOAD, WON_JAVA, 'es');
    expect(r).toEqual({
      win: true,
      score: 1,
      answer: 'o_n_log_n',
      chosen_option: 'o_n_log_n',
      code_language: 'java',
      recipe_category: 'nested_loops',
      trap_option: 'o_n2',
      explanation: ES_EXPLANATION,
    });
    expect(bigO.isWin(r)).toBe(true);
    expect(bigO.score(r)).toBe(1);
    expect(bigO.codeLanguage(WON_JAVA)).toBe('java');
  });

  it('loses in Go (TS-20)', () => {
    const r = bigO.result(PAYLOAD, LOST_GO, 'es');
    expect(r.win).toBe(false);
    expect(r.score).toBe(0);
    expect(r.answer).toBe('o_n_log_n');
    expect(r.chosen_option).toBe('o_n2');
    expect(r.code_language).toBe('go');
    expect(r.trap_option).toBe('o_n2');
    expect(r.explanation).toEqual(ES_EXPLANATION);
    expect(bigO.isWin(r)).toBe(false);
    expect(bigO.score(r)).toBe(0);
    expect(bigO.codeLanguage(LOST_GO)).toBe('go');
  });

  it('localizes in English and follows the contract shape (TS-21)', () => {
    const r = bigO.result(PAYLOAD, WON_JAVA, 'en');
    expect(r.explanation).toEqual({
      steps: [
        'The outer loop runs n times.',
        'The inner loop doubles j: log₂ n iterations.',
        'Nested loops multiply: n × log n. Simplified: O(n log n).',
      ],
      line_notes: [
        { line: 3, text: 'n times' },
        { line: 4, text: 'log n times' },
      ],
      tip: 'An inner loop that doubles its variable is not n.',
      example: { n: 1024, ops: 10240, trap_ops: 1048576 },
    });
    expect(() => resultSchema.parse(r)).not.toThrow();
    expect(Object.keys(r)).toEqual([
      'win',
      'score',
      'answer',
      'chosen_option',
      'code_language',
      'recipe_category',
      'trap_option',
      'explanation',
    ]);
    const json = JSON.stringify(r);
    expect(json.includes('"es"')).toBe(false);
    expect(json.includes('"en"')).toBe(false);
  });

  it.each(['es', 'en'] as const)('handles null branches in %s (TS-22)', (l) => {
    const r = bigO.result(PAYLOAD_RECURSION, { language: 'js', option: 'o_2n' }, l);
    expect(r.win).toBe(true);
    expect(r.score).toBe(1);
    expect(r.answer).toBe('o_2n');
    expect(r.trap_option).toBeNull();
    expect(r.explanation.tip).toBeNull();
    expect(r.explanation.example).toBeNull();
    expect(r.explanation.line_notes).toEqual([
      { line: 5, text: l === 'es' ? 'dos llamadas por nivel' : 'two calls per level' },
    ]);
    expect(r.explanation.steps[1]).toContain('φⁿ');
    expect(() => resultSchema.parse(r)).not.toThrow();
  });

  it('throws on an unconfirmed state (TS-23)', () => {
    expect(() => bigO.result(PAYLOAD, {}, 'es')).toThrow('big-o: result requires a confirmed state');
  });

  it('shares no references with the payload (TS-24)', () => {
    const before = structuredClone(PAYLOAD);
    const r = bigO.result(PAYLOAD, WON_JAVA, 'es');
    r.explanation.example!.ops = 1;
    r.explanation.line_notes[0]!.line = 99;
    expect(PAYLOAD.explanation.example!.ops).toBe(10240);
    expect(PAYLOAD.explanation.line_notes[0]!.line).toBe(3);
    expect(before).toEqual(PAYLOAD);
  });
});

describe('codeLanguage', () => {
  it('returns the confirmed language or null (TS-25)', () => {
    expect(bigO.codeLanguage({})).toBeNull();
    expect(bigO.codeLanguage({ language: 'js', option: 'o_1' })).toBe('js');
    expect(createGameRegistry([bigO]).get('big-o').codeLanguage(LOST_GO)).toBe('go');
    expectTypeOf<ReturnType<typeof bigO.codeLanguage>>().toEqualTypeOf<CodeLanguage | null>();
  });
});

describe('stats', () => {
  const rWin = bigO.result(PAYLOAD, WON_JAVA, 'es');
  const rLoss = bigO.result(PAYLOAD, LOST_GO, 'es');
  const rRec = bigO.result(PAYLOAD_RECURSION, { language: 'go', option: 'o_n' }, 'es');

  it('starts empty with fresh objects (TS-26)', () => {
    expect(bigO.initialStats()).toEqual({ by_category: {} });
    expect(bigO.initialStats()).not.toBe(bigO.initialStats());
  });

  it('reduces by category without mutating (TS-27)', () => {
    const s0 = bigO.initialStats();
    const s1 = bigO.reduceStats(s0, rWin);
    const s2 = bigO.reduceStats(s1, rLoss);
    const s3 = bigO.reduceStats(s2, rRec);
    expect(s1).toEqual({ by_category: { nested_loops: { played: 1, correct: 1 } } });
    expect(s2).toEqual({ by_category: { nested_loops: { played: 2, correct: 1 } } });
    expect(s3).toEqual({
      by_category: {
        nested_loops: { played: 2, correct: 1 },
        recursion: { played: 1, correct: 0 },
      },
    });
    expect(s0).toEqual({ by_category: {} });
    expect(s1).toEqual({ by_category: { nested_loops: { played: 1, correct: 1 } } });
    expect(() => statsSchema.parse(s3)).not.toThrow();
  });

  it('rebuild equals the incremental fold (TS-28)', () => {
    const results = [rWin, rLoss, rRec];
    const plays: CompletedPlay<BigOResult>[] = Array.from({ length: 12 }, (_, i) => {
      const date = `2026-11-${String(i + 1).padStart(2, '0')}`;
      if (i === 3 || i === 8) return { date, status: 'voided', result: null };
      const result = results[i % 3] as BigOResult;
      return { date, status: result.win ? 'won' : 'lost', result };
    });
    let expected: BigOStats = bigO.initialStats();
    for (const p of plays) if (p.status !== 'voided') expected = bigO.reduceStats(expected, p.result!);
    const rebuilt = rebuildGameStats(bigO, plays);
    expect(rebuilt.extra).toEqual(expected);
    expect(rebuilt.played).toBe(10);
    expect(rebuilt.wins).toBe(plays.filter((p) => p.status === 'won').length);
    expect(rebuildGameStats(bigO, [...plays].reverse())).toEqual(rebuilt);
  });
});

describe('historyLabel', () => {
  it('labels wins with the answer and losses with a cross (TS-29)', () => {
    const rWin = bigO.result(PAYLOAD, WON_JAVA, 'es');
    for (const a of BIG_O_OPTIONS) {
      expect(bigO.historyLabel({ ...rWin, answer: a, chosen_option: a })).toBe(
        `✓ ${OPTION_LABEL[a]}`,
      );
    }
    expect(bigO.historyLabel({ ...rWin, answer: 'o_n_log_n' })).toBe('✓ O(n log n)');
    expect(bigO.historyLabel({ ...rWin, answer: 'o_n2' })).toBe('✓ O(n²)');
    expect(bigO.historyLabel(bigO.result(PAYLOAD, LOST_GO, 'es'))).toBe('✗');
  });
});
