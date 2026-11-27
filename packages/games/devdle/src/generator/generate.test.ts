import { describe, expect, it } from 'vitest';

import { payloadSchema } from '../definition';
import { generator } from './index';
import { LAUNCH_DAYS } from './launch-terms';
import {
  BANK,
  DATE,
  RECENT_GIT_DB_LINUX,
  T_KERNEL,
  T_REACT,
  T_REDIS,
  T_ROUTER,
  payloadFrom,
  recent as recent3,
  seed,
} from './test-fixtures';

const history = (bankItems = BANK, recentChallenges: typeof RECENT_GIT_DB_LINUX = []) => ({
  bankItems,
  recentChallenges,
});
const words = (h: ReturnType<typeof history>, number?: number) =>
  Array.from(
    { length: 50 },
    (_, i) => generator.generate({ date: DATE, number, seed: seed(i + 1), history: h }).word,
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

  it('never picks a term excluded from Devdle', () => {
    const niche = { ...T_ROUTER, id: '77777777-7777-4777-8777-777777777777', term: 'MALBOLGE' };
    for (const x of words(history([...BANK, niche]))) expect(x).not.toBe('MALBOLGE');
  });

  it('relaxes the rotation instead of running out of words', () => {
    // Las 3 categorías con stock salieron en los últimos 3 días: elige igual, evitando la de ayer.
    const recent = [
      recent3('2026-11-29', 'programming_languages'),
      recent3('2026-11-30', 'networking'),
      recent3('2026-12-01', 'linux'),
    ];
    const w = words(history([T_REACT, T_ROUTER, T_KERNEL], recent));
    for (const x of w) expect(['REACT', 'ROUTER']).toContain(x);
  });

  describe('launch window', () => {
    // REACT y REDIS están en la lista de lanzamiento; REDIS no se puede reusar en DATE.
    it('picks only launch terms in the first LAUNCH_DAYS challenges', () => {
      for (const n of [1, LAUNCH_DAYS]) {
        expect(new Set(words(history(), n))).toEqual(new Set(['REACT']));
      }
    });

    it('picks from the whole bank after the launch window or without a number', () => {
      for (const n of [LAUNCH_DAYS + 1, undefined]) {
        const w = words(history(), n);
        for (const x of w) expect(['KERNEL', 'MERGE', 'REACT', 'ROUTER']).toContain(x);
        expect(new Set(w).size).toBeGreaterThanOrEqual(2);
      }
    });

    it('falls back to the whole bank when no launch term is reusable', () => {
      const w = words(history([T_REDIS, T_KERNEL, T_ROUTER]), 1);
      for (const x of w) expect(['KERNEL', 'ROUTER']).toContain(x);
    });

    it('rotates categories inside the launch terms', () => {
      const docker = { ...T_KERNEL, id: '88888888-8888-4888-8888-888888888888', term: 'DOCKER' };
      const recentLangs = [recent3('2026-12-01', 'programming_languages')];
      const w = words(history([T_REACT, docker, T_ROUTER], recentLangs), 1);
      expect(new Set(w)).toEqual(new Set(['DOCKER']));
    });
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
