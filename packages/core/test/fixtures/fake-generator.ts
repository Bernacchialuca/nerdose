import { rngFrom } from '../../src/prng';
import type { TermCategory } from '../../src/enums';
import type { GameGenerator } from '../../src/game-generator';

export interface FakePayload {
  term_id: string;
  word: string;
  category: TermCategory;
}

export interface FakeTerm {
  id: string;
  term: string;
  category: TermCategory;
  last_used_devdle: string | null;
}

export function makeGenerator(): GameGenerator<FakePayload, FakeTerm> {
  return {
    historySpec: { bank: 'terms', lastUsedField: 'last_used_devdle', recentDays: 3 },
    usedBankItems: (p) => [p.term_id],
    generate: ({ seed, history }) => {
      const recent = new Set(history.recentChallenges.map((c) => c.payload.category));
      const eligible = [...history.bankItems]
        .sort((a, b) => a.term.localeCompare(b.term))
        .filter((t) => !recent.has(t.category));
      const chosen = rngFrom(seed).pick(eligible);
      return { term_id: chosen.id, word: chosen.term, category: chosen.category };
    },
    verify: (p, history) => {
      const ok = !history.recentChallenges.some((c) => c.payload.category === p.category);
      return {
        ok,
        checks: [{ name: 'category_rotation', ok }],
        ...(ok ? {} : { reason: 'category_rotation' }),
      };
    },
  };
}

export function makeAsyncGenerator(): GameGenerator<FakePayload, FakeTerm> {
  const base = makeGenerator();
  return {
    ...base,
    historySpec: { ...base.historySpec, aheadDays: 2 },
    verify: async (p, history) => base.verify(p, history),
  };
}
