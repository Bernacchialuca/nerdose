import { rngFrom } from '@nerdose/core';
import type { GameGenerator, TermCategory } from '@nerdose/core';

import type { DevdlePayload } from '../definition';
import { RECENT_DAYS, eligibleTerms, sortByTerm } from './eligibility';
import { verifyPayload } from './verify';

export type DevdleTerm = {
  id: string;
  term: string;
  category: TermCategory;
  definition: { es: string; en: string };
  summary: { es: string; en: string };
  last_used_devdle: string | null;
};

export const generator: GameGenerator<DevdlePayload, DevdleTerm> = {
  historySpec: { bank: 'terms', lastUsedField: 'last_used_devdle', recentDays: RECENT_DAYS },

  usedBankItems: (p) => [p.term_id],

  generate({ date, number, seed, history }) {
    const eligible = eligibleTerms(history.bankItems, date, history.recentChallenges, number);
    // Sin elegibles se elige igual: `verify` rechaza y el pipeline lo registra.
    const pool = eligible.length > 0 ? eligible : sortByTerm(history.bankItems);
    const t = rngFrom(seed).pick(pool);
    return {
      term_id: t.id,
      word: t.term,
      category: t.category,
      definition: { es: t.definition.es, en: t.definition.en },
      summary: { es: t.summary.es, en: t.summary.en },
      date,
    };
  },

  verify: verifyPayload,
};
