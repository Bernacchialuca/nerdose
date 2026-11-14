import { describe, expect, it } from 'vitest';

import { payloadSchema } from '../definition';
import { generator } from './index';
import {
  BANK,
  DATE,
  RECENT_GIT_DB_LINUX,
  T_KERNEL,
  T_REACT,
  T_REDIS,
  payloadFrom,
  seed,
} from './test-fixtures';

const history = (bankItems = BANK, recentChallenges: typeof RECENT_GIT_DB_LINUX = []) => ({
  bankItems,
  recentChallenges,
});
const words = (h: ReturnType<typeof history>) =>
  Array.from(
    { length: 50 },
    (_, i) => generator.generate({ date: DATE, seed: seed(i + 1), history: h }).word,
  );

describe('generator.generate', () => {
  it('exposes historySpec and usedBankItems (TS-33)', () => {
    expect(generator.historySpec).toEqual({
      bank: 'terms',
      lastUsedField: 'last_used_devdle',
      recentDays: 3,
    });
    expect(generator.usedBankItems(payloadFrom(T_REACT))).toEqual([T_REACT.id]);
  });

  it('is deterministic and does not mutate history (TS-35)', () => {
    const input = { date: DATE, seed: seed(7), history: history() };
    const before = [...BANK];
    expect(generator.generate(input)).toEqual(generator.generate(input));
    expect(input.history.bankItems).toEqual(before);
  });

  it('does not depend on bank order (TS-36)', () => {
    const a = generator.generate({ date: DATE, seed: seed(7), history: history() });
    const b = generator.generate({
      date: DATE,
      seed: seed(7),
      history: history([...BANK].reverse()),
    });
    expect(b).toEqual(a);
  });

  it('only picks eligible terms (TS-37)', () => {
    const w = words(history());
    for (const x of w) expect(['KERNEL', 'MERGE', 'REACT', 'ROUTER']).toContain(x);
    expect(new Set(w).size).toBeGreaterThanOrEqual(2);
  });

  it('rotates categories (TS-38)', () => {
    for (const x of words(history(BANK, RECENT_GIT_DB_LINUX))) {
      expect(['REACT', 'ROUTER']).toContain(x);
    }
  });

  it('builds the exact payload with a single eligible (TS-39)', () => {
    const p = generator.generate({
      date: DATE,
      seed: seed(3),
      history: history([T_REACT, T_REDIS]),
    });
    expect(p).toEqual({
      term_id: T_REACT.id,
      word: 'REACT',
      category: 'programming_languages',
      definition: T_REACT.definition,
      summary: T_REACT.summary,
      date: DATE,
    });
    expect(p.definition).not.toBe(T_REACT.definition);
    expect(() => payloadSchema.parse(p)).not.toThrow();
  });

  it('accepts the exact D-365 boundary (TS-40)', async () => {
    const h = history([T_KERNEL]);
    const p = generator.generate({ date: DATE, seed: seed(1), history: h });
    expect(p.word).toBe('KERNEL');
    expect((await generator.verify(p, h)).ok).toBe(true);
  });

  it('picks anyway without eligibles and verify rejects (TS-41)', async () => {
    const h = history([T_REDIS]);
    const p = generator.generate({ date: DATE, seed: seed(1), history: h });
    expect(p.word).toBe('REDIS');
    const log = await generator.verify(p, h);
    expect(log.ok).toBe(false);
    expect(log.reason).toBe('not_used_365');
  });

  it('throws on an empty bank (TS-42)', () => {
    expect(() => generator.generate({ date: DATE, seed: seed(1), history: history([]) })).toThrow(
      new RangeError('Rng.pick: empty list'),
    );
  });
});
