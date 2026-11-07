import { describe, expect, expectTypeOf, it } from 'vitest';

import type {
  AnyGameGenerator,
  GameGenerator,
  GeneratorHistory,
  HistorySpec,
  RecentChallenge,
  VerificationLog,
} from '../src/game-generator';
import { makeGenerator } from './fixtures/fake-generator';
import type { FakePayload, FakeTerm } from './fixtures/fake-generator';

const SEED_A = Uint8Array.from({ length: 32 }, (_, i) => i);

const history: GeneratorHistory<FakePayload, FakeTerm> = {
  bankItems: [
    { id: 't1', term: 'REACT', category: 'programming_languages', last_used_devdle: null },
    { id: 't2', term: 'CACHE', category: 'software_engineering', last_used_devdle: null },
    { id: 't3', term: 'MERGE', category: 'git', last_used_devdle: null },
  ],
  recentChallenges: [
    { date: '2026-12-09', payload: { term_id: 't3', word: 'MERGE', category: 'git' } },
  ],
};

describe('GameGenerator contract', () => {
  it('compiles a complete generator with the Devdle historySpec (TS-8)', () => {
    const gen: GameGenerator<FakePayload, FakeTerm> = makeGenerator();
    expect(gen.historySpec).toEqual({
      bank: 'terms',
      lastUsedField: 'last_used_devdle',
      recentDays: 3,
    });
  });

  it('allows a null bank and rejects unknown banks (TS-9)', () => {
    const a: HistorySpec = { bank: null, lastUsedField: 'last_used', recentDays: 0 };
    // @ts-expect-error 'players' is not a bank
    const b: HistorySpec = { bank: 'players', lastUsedField: 'x', recentDays: 1 };
    expect(a.bank).toBeNull();
    expect(b.recentDays).toBe(1);
    expectTypeOf<HistorySpec['bank']>().toEqualTypeOf<'terms' | 'timeline_facts' | null>();
  });

  it('generates deterministically from the history (TS-10)', () => {
    const gen = makeGenerator();
    const first = gen.generate({ date: '2026-12-10', seed: SEED_A, history });
    const second = gen.generate({ date: '2026-12-10', seed: SEED_A, history });
    expect(first).toEqual(second);
    expect(first.category).not.toBe('git');
    expect(['t1', 't2']).toContain(first.term_id);
  });

  it('returns the consumed bank ids (TS-11)', () => {
    const gen = makeGenerator();
    expect(
      gen.usedBankItems({ term_id: 't2', word: 'CACHE', category: 'software_engineering' }),
    ).toEqual(['t2']);
    expectTypeOf(gen.usedBankItems).returns.toEqualTypeOf<string[]>();
  });

  it('returns a failing VerificationLog (TS-12)', () => {
    const gen = makeGenerator();
    const log = gen.verify({ term_id: 't3', word: 'MERGE', category: 'git' }, history);
    expect(log).toEqual({
      ok: false,
      checks: [{ name: 'category_rotation', ok: false }],
      reason: 'category_rotation',
    });
    expectTypeOf(gen.verify).returns.toEqualTypeOf<VerificationLog>();
  });

  it('returns a passing, serializable VerificationLog (TS-13)', () => {
    const gen = makeGenerator();
    const log = gen.verify(
      { term_id: 't1', word: 'REACT', category: 'programming_languages' },
      history,
    );
    expect(log).toEqual({ ok: true, checks: [{ name: 'category_rotation', ok: true }] });
    expect('reason' in log).toBe(false);
    expect(JSON.parse(JSON.stringify(log))).toEqual(log);
  });

  it('fixes the shape of history, log and generate input (TS-14)', () => {
    type P = { p: 1 };
    type B = { b: 2 };
    expectTypeOf<GeneratorHistory<P, B>['bankItems']>().toEqualTypeOf<readonly B[]>();
    expectTypeOf<GeneratorHistory<P, B>['recentChallenges']>().toEqualTypeOf<
      readonly RecentChallenge<P>[]
    >();
    expectTypeOf<RecentChallenge<P>>().toEqualTypeOf<{ date: string; payload: P }>();
    expectTypeOf<VerificationLog['reason']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<
      Parameters<GameGenerator<P, B>['generate']>[0]['seed']
    >().toEqualTypeOf<Uint8Array>();
    const gen = makeGenerator();
    const call = (): unknown =>
      // @ts-expect-error seed must be a Uint8Array
      gen.generate({ date: '2026-12-10', seed: 42, history });
    expectTypeOf(call).toBeFunction();
  });

  it('accepts heterogeneous generators in AnyGameGenerator (TS-15)', () => {
    const otherGeneratorWithBankNull: GameGenerator<{ n: number }> = {
      historySpec: { bank: null, lastUsedField: 'last_used', recentDays: 0 },
      usedBankItems: () => [],
      generate: () => ({ n: 1 }),
      verify: () => ({ ok: true, checks: [] }),
    };
    const list: AnyGameGenerator[] = [makeGenerator(), otherGeneratorWithBankNull];
    expect(list).toHaveLength(2);
  });
});
